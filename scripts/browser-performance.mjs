import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import os from "node:os";
const [artifact = "dist/index.html", reportPath = "docs/performance-report.json"] = process.argv.slice(2);
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, offline: true });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.addInitScript(() => {
  window.__cabinetUploads = [];
  for (const renderer of [WebGLRenderingContext, WebGL2RenderingContext]) {
    const upload = renderer.prototype.texImage2D;
    renderer.prototype.texImage2D = function (...args) {
      const source = args.at(-1);
      if (source instanceof HTMLCanvasElement && source.width === 1530 && source.height === 780)
        window.__cabinetUploads.push(performance.now());
      return upload.apply(this, args);
    };
  }
  const raf = requestAnimationFrame.bind(window);
  window.__frames = [];
  window.__callbacks = [];
  window.__phases = { idle: [], spinning: [], stopping: [], win: [] };
  let previous = 0;
  window.requestAnimationFrame = (cb) =>
    raf((t) => {
      if (previous && t !== previous) {
        const interval = t - previous;
        window.__frames.push(interval);
        const button = document.querySelector("#spin");
        const phase =
          button?.dataset.state === "spinning"
            ? performance.now() - window.__spinStarted < 850
              ? "spinning"
              : "stopping"
            : button?.dataset.state === "settled"
              ? "win"
              : "idle";
        window.__phases[phase].push(interval);
      }
      previous = t;
      const start = performance.now();
      cb(t);
      window.__callbacks.push(performance.now() - start);
    });
  const rng = crypto.getRandomValues.bind(crypto);
  window.__stops = [];
  crypto.getRandomValues = (a) => {
    if (window.__stops.length && a instanceof Uint32Array) {
      a[0] = window.__stops.shift();
      return a;
    }
    return rng(a);
  };
});
const client = await context.newCDPSession(page);
await client.send("Performance.enable");
const memory = () => client.send("Memory.getDOMCounters");
const stats = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    samples: values.length,
    mean: values.reduce((a, b) => a + b, 0) / values.length,
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
    max: sorted.at(-1),
    over25ms: values.filter((v) => v > 25).length,
    estimatedMissed60Hz: values.reduce((n, v) => n + Math.max(0, Math.round(v / (1000 / 60)) - 1), 0),
  };
};
try {
  await page.goto(`file://${resolve(artifact)}`);
  await page.locator("#enter-slot").waitFor();
  await page.click("#enter-slot");
  await page.locator("#spin").waitFor();
  await page.selectOption("#line-count", "40");
  await page.selectOption("#per-line", "5");
  // A large valid imported bankroll allows repeated maximum-stake observations without a production cheat UI.
  await page.click("[data-action=settings]");
  const save = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("fruit-salon:v1"));
    s.balance = 10000;
    return s;
  });
  await page.setInputFiles("#import", {
    name: "perf-save.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(save)),
  });
  await page.locator("#enter-slot").waitFor();
  await page.click("#enter-slot");
  await page.locator("#spin").waitFor();
  await page.waitForTimeout(1000);
  await client.send("HeapProfiler.collectGarbage");
  const before = await memory();
  for (let i = 0; i < 12; i++) {
    await page.click("#back");
    await page.locator("#enter-slot").waitFor();
    await page.click("#enter-slot");
    await page.locator("#spin").waitFor();
  }
  await page.waitForTimeout(500);
  await client.send("HeapProfiler.collectGarbage");
  const after = await memory();
  await page.evaluate(() => {
    window.__frames = [];
    window.__callbacks = [];
    window.__phases = { idle: [], spinning: [], stopping: [], win: [] };
    window.__stops = [9, 10, 10, 10, 9];
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    window.__spinStarted = performance.now();
  });
  await page.click("#spin");
  await page.waitForTimeout(5200);
  const values = await page.evaluate(() => ({
    frames: window.__frames,
    callbacks: window.__callbacks,
    phases: window.__phases,
    cabinetUploads: window.__cabinetUploads,
    renderer: (() => {
      const gl =
        document.querySelector("canvas").getContext("webgl2") || document.querySelector("canvas").getContext("webgl");
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unknown";
    })(),
  }));
  const metrics = await client.send("Performance.getMetrics");
  const report = {
    date: new Date().toISOString(),
    browser: browser.version(),
    os: `${os.platform()} ${os.release()}`,
    cpu: os.cpus()[0].model,
    cpus: os.cpus().length,
    viewport: { width: 1600, height: 900 },
    artifact,
    cabinetUploads: values.cabinetUploads,
    renderer: values.renderer,
    softwareRendering: true,
    recordVideo: false,
    case: "40 lines × 5, exact maximum payout 13055, stops9/10/10/10/9; 12 scene round trips",
    rafIntervalMs: stats(values.frames),
    phases: Object.fromEntries(Object.entries(values.phases).map(([phase, samples]) => [phase, stats(samples)])),
    mainCallbackMs: stats(values.callbacks),
    estimatedRafFps: 1000 / stats(values.frames).mean,
    domBefore: before,
    domAfter: after,
    performanceMetrics: metrics.metrics.filter((m) =>
      ["JSHeapUsedSize", "Nodes", "JSEventListeners", "ScriptDuration", "TaskDuration"].includes(m.name),
    ),
    errors,
    limits:
      "Headless Chromium + SwiftShader. No user hardware, GPU timing or acoustic listening. RAF is not a guarantee of perceived 60FPS.",
  };
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (errors.length || after.jsEventListeners > before.jsEventListeners + 5) process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
}
