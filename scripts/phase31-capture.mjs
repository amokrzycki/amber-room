// Phase 3.1 evidence: screenshots per viewport/state and bounding-box sampling through real spins.
// Usage: node scripts/phase31-capture.mjs <label> [html-file]
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const label = process.argv[2] ?? "after";
const html = resolve(process.argv[3] ?? "dist/index.html");
const out = "docs/evidence/phase31";
mkdirSync(out, { recursive: true });
const viewports = [
  [1280, 800],
  [1366, 768],
  [1600, 900],
  [1920, 1080],
];
// Stakes of 5 (5 lines x 1): loss 0, partial return 4, positive net 15, big 70.
const states = [
  ["losing", [1, 0, 0, 0, 0]],
  ["partial", [2, 1, 0, 0, 0]],
  ["positive", [3, 0, 0, 0, 0]],
];
const tracked = {
  stage: "#stage",
  ui: "#ui",
  canvas: "canvas",
  hud: ".slot-hud",
  spin: "#spin",
  balance: "#balance",
  payout: "#payout",
  perLine: "#per-line",
  lineCount: "#line-count",
};

const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const report = {};
try {
  for (const [w, h] of viewports) {
    const context = await browser.newContext({ viewport: { width: w, height: h }, offline: true });
    const page = await context.newPage();
    await page.addInitScript(() => {
      const rng = crypto.getRandomValues.bind(crypto);
      window.__stops = [];
      crypto.getRandomValues = (a) => {
        if (window.__stops.length && a instanceof Uint32Array) {
          a[0] = window.__stops.shift();
          return a;
        }
        return rng(a);
      };
      if (!localStorage.getItem("fruit-salon:v1"))
        localStorage.setItem(
          "fruit-salon:v1",
          JSON.stringify({
            version: 1,
            balance: 100000,
            businesses: { barLevel: 0, extraMachines: 0, decorLevel: 0 },
            lastAccrualAtMs: Date.now() + 86400000,
            remainderUnits: 0,
            nextSpinId: 1,
            lastSpin: null,
            selectedBet: { lineCount: 5, perLine: 1 },
            settings: { muted: true, reducedMotion: false, effectsIntensity: 0.4 },
          }),
        );
    });
    await page.goto(`file://${html}`);
    await page.click("#enter-slot");
    await page.locator("#spin").waitFor();
    await page.waitForTimeout(500);
    const key = `${w}x${h}`;
    const shot = (name) => page.screenshot({ path: `${out}/${label}-${key}-${name}.png` });
    await shot("idle");
    report[key] = {};
    for (const [name, stops] of states) {
      await page.evaluate(
        ([s, sel]) => {
          window.__stops = [...s];
          window.__geo = [];
          window.__sampling = true;
          const t0 = performance.now();
          const loop = () => {
            const frame = { t: Math.round(performance.now() - t0), s: document.querySelector("#spin")?.dataset.state };
            for (const [k, q] of Object.entries(sel)) {
              const r = document.querySelector(q)?.getBoundingClientRect();
              frame[k] = r && [r.x, r.y, r.width, r.height].map((n) => Math.round(n * 100) / 100);
            }
            document.querySelectorAll(".slot-hud > *").forEach((el, i) => {
              const r = el.getBoundingClientRect();
              frame[`hud${i}`] = [r.x, r.y, r.width, r.height].map((n) => Math.round(n * 100) / 100);
            });
            window.__geo.push(frame);
            if (window.__sampling) requestAnimationFrame(loop);
          };
          requestAnimationFrame(loop);
        },
        [stops, tracked],
      );
      await page.waitForTimeout(100);
      await page.click("#spin");
      await page.waitForTimeout(450);
      await shot(`${name}-spinning`);
      await page.waitForFunction(() => document.querySelector("#spin").dataset.state !== "spinning", null, {
        timeout: 15000,
      });
      await page.waitForTimeout(900);
      await shot(name);
      await page.waitForFunction(() => document.querySelector("#spin").dataset.state === "idle", null, {
        timeout: 15000,
      });
      await page.waitForTimeout(600);
      const frames = await page.evaluate(() => {
        window.__sampling = false;
        return window.__geo;
      });
      const spread = {};
      for (const k of Object.keys(frames[0]).filter((k) => k !== "t" && k !== "s")) {
        const rows = frames.map((f) => f[k]).filter(Boolean);
        spread[k] = [0, 1, 2, 3].map((i) => {
          const v = rows.map((r) => r[i]);
          return Math.round((Math.max(...v) - Math.min(...v)) * 100) / 100;
        });
      }
      report[key][name] = { frames: frames.length, spread };
    }
    await context.close();
  }
} finally {
  await browser.close();
}
writeFileSync(`${out}/layout-${label}.json`, JSON.stringify(report, null, 2));
const worst = {};
for (const [vp, runs] of Object.entries(report))
  for (const [state, { spread }] of Object.entries(runs))
    for (const [k, [dx, dy, dw, dh]] of Object.entries(spread)) {
      const m = Math.max(dx, dy, dw, dh);
      if (m > (worst[k]?.max ?? -1)) worst[k] = { max: m, vp, state, spread: [dx, dy, dw, dh] };
    }
console.log(`label=${label}\nWorst displacement per tracked box (x,y,w,h spread in screen px):`);
for (const [k, v] of Object.entries(worst))
  console.log(k.padEnd(10), String(v.max).padStart(7), v.vp, v.state, v.spread.join(","));
