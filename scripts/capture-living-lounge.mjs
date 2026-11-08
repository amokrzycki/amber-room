// Run against npm run dev. Uses disposable contexts, real UI purchases, and no user browser profile.
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH optionally selects an already installed Chromium executable.
// --performance-only refreshes the measurements without replacing the screenshot matrix/manifest.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const out = resolve("docs/evidence/phase41");
const performanceOnly = process.argv.includes("--performance-only");
const url = "http://localhost:5173/prototypes/living-lounge.html";
const progressKey = "amber-room:prototype:living-lounge:v1";
const appearanceKey = "amber-room:prototype:living-lounge:appearance:v1";
const productionKey = "fruit-salon:v1";
const sentinel = '{"production":"capture sentinel; never import"}';
const viewports = [
  { width: 1600, height: 900 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
];
const launchArgs = ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"];
const manifest = { url, capturedAt: new Date().toISOString(), viewports, captures: [], sheets: [], errors: [] };
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  args: launchArgs,
});
manifest.browser = browser.version();

async function start(viewport, damaged = false) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: "no-preference" });
  const page = await context.newPage();
  page.on("pageerror", (error) => manifest.errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") manifest.errors.push(message.text());
  });
  // Same route-only instrumentation as the E2E suite. No application debug global is shipped.
  await page.route("**/src/view/SalonScene.ts*", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: `${await response.text()}\nconst createSalon = SalonScene.prototype.create; SalonScene.prototype.create = function () { window.__loungeScene = this; return createSalon.call(this); };`,
    });
  });
  await page.addInitScript(
    ({ progressKey, appearanceKey, productionKey, sentinel, damaged }) => {
      const get = Storage.prototype.getItem;
      const set = Storage.prototype.setItem;
      if (get.call(localStorage, productionKey) === null) set.call(localStorage, productionKey, sentinel);
      if (get.call(localStorage, progressKey) === null) {
        set.call(
          localStorage,
          progressKey,
          damaged
            ? "{damaged progress"
            : JSON.stringify({
                version: 1,
                balance: 20000,
                businesses: { barLevel: 0, extraMachines: 0, decorLevel: 0 },
                // Hold accrual still, not Date.now(): Phaser needs its advancing tween clock.
                lastAccrualAtMs: 4102444800000,
                remainderUnits: 0,
                nextSpinId: 1,
                lastSpin: null,
                selectedBet: { lineCount: 5, perLine: 1 },
                settings: { muted: true, reducedMotion: false, effectsIntensity: 0.4 },
              }),
        );
        if (damaged) set.call(localStorage, appearanceKey, "{damaged rug");
      }
      window.__productionAccesses = [];
      window.__captureStored = () => ({
        progress: get.call(localStorage, progressKey),
        appearance: get.call(localStorage, appearanceKey),
        production: get.call(localStorage, productionKey),
      });
      for (const method of ["getItem", "setItem", "removeItem", "clear"]) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function (...args) {
          if (args[0] === productionKey || method === "clear")
            window.__productionAccesses.push({ method, key: args[0] });
          return original.apply(this, args);
        };
      }
    },
    { progressKey, appearanceKey, productionKey, sentinel, damaged },
  );
  await page.goto(url);
  await page.locator("#enter-slot").waitFor();
  await page.evaluate(() => document.fonts.ready);
  return { context, page };
}

async function settled(page) {
  await page.waitForFunction(() => {
    const scene = window.__loungeScene;
    const room = scene?.children.getByName("living-lounge");
    return room?.list.every((group) => group.alpha === 1 && scene.tweens.getTweensOf(group).length === 0);
  });
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
}

async function buy(page, item, times = 1) {
  for (let level = 0; level < times; level++) {
    await page.click(`#buy-${item}`);
    await settled(page);
  }
}

async function style(page, name, apply = true) {
  await page.click("#style-rug");
  await page.getByRole("button", { name: `${name} weave` }).click();
  if (apply) await page.click("#rug-apply");
  await settled(page);
}

async function shot(page, name, levels, rug, keepFocus = false) {
  await settled(page);
  if (!keepFocus) await page.evaluate(() => document.activeElement?.blur());
  await page.mouse.move(0, 0);
  const state = await page.evaluate(() => {
    const scene = window.__loungeScene;
    const room = scene.children.getByName("living-lounge");
    return {
      levels: ["bar", "machine", "decor"].map((item) => document.querySelector(`#level-${item}`).textContent),
      rug:
        room.list
          .flatMap((group) => group.list.map((child) => child.name))
          .find((name) => name.startsWith("lounge-rug-")) ?? null,
      stored: window.__captureStored(),
      productionAccesses: window.__productionAccesses,
      message: document.querySelector("#salon-message").textContent,
      warning: document.querySelector(".save-warning").textContent,
      previewOpen: !document.querySelector("#rug-chooser").hidden,
      focus:
        document.activeElement?.id ||
        document.activeElement?.getAttribute("data-rug") ||
        document.activeElement?.tagName,
    };
  });
  assert.deepEqual(
    state.levels,
    levels.map((level) => `${level} / 3`),
    name,
  );
  assert.equal(state.rug, rug ? `lounge-rug-${rug}` : null, name);
  assert.equal(state.stored.production, sentinel, name);
  assert.deepEqual(state.productionAccesses, [], name);
  const viewport = page.viewportSize();
  const file = `${name}-${viewport.width}x${viewport.height}.png`;
  const pixels = await page.screenshot({ path: resolve(out, file) });
  manifest.captures.push({ name, file, viewport, sha256: createHash("sha256").update(pixels).digest("hex"), ...state });
}

async function captures() {
  for (const viewport of viewports) {
    for (const item of ["bar", "machine", "decor"]) {
      const { page, context } = await start(viewport);
      try {
        const levels = [0, 0, 0];
        await shot(page, `${item}-0`, levels, null);
        for (let level = 1; level <= 3; level++) {
          await buy(page, item);
          levels[["bar", "machine", "decor"].indexOf(item)] = level;
          await shot(page, `${item}-${level}`, levels, item === "decor" ? "claret" : null);
        }
      } finally {
        await context.close();
      }
    }
    const { page, context } = await start(viewport);
    try {
      for (let level = 1; level <= 3; level++) {
        for (const item of ["bar", "machine", "decor"]) await buy(page, item);
        await shot(page, level === 3 ? "max-claret" : `cumulative-${level}`, [level, level, level], "claret");
      }
      assert.equal(JSON.parse((await page.evaluate(() => window.__captureStored())).progress).balance, 8250);
      await style(page, "Moss");
      await shot(page, "max-moss", [3, 3, 3], "moss");
      await page.reload();
      await page.locator("#enter-slot").waitFor();
      await shot(page, "max-moss-reloaded", [3, 3, 3], "moss");
      await page.click("#enter-slot");
      await page.locator("#spin").waitFor();
      await page.getByRole("button", { name: "Back to lounge" }).click();
      await page.locator("#enter-slot").waitFor();
      await shot(page, "max-moss-roundtrip", [3, 3, 3], "moss");
    } finally {
      await context.close();
    }
    const mixed = await start(viewport);
    try {
      await buy(mixed.page, "bar", 3);
      await buy(mixed.page, "machine");
      await buy(mixed.page, "decor", 2);
      await shot(mixed.page, "mixed-bar3-machine1-decor2", [3, 1, 2], "claret");
      await mixed.page.click("#style-rug");
      await mixed.page.keyboard.press("Tab");
      await mixed.page.keyboard.press("Enter");
      await shot(mixed.page, "preview-moss-confirmed-claret-keyfocus", [3, 1, 2], "moss", true);
      assert.equal((await mixed.page.evaluate(() => window.__captureStored())).appearance, null);
      await mixed.page.keyboard.press("Escape");
      await shot(mixed.page, "focus-style-rug-after-cancel", [3, 1, 2], "claret", true);
      assert.equal(await mixed.page.locator("#style-rug").evaluate((node) => node === document.activeElement), true);
      await style(mixed.page, "Moss", false);
      await mixed.page.evaluate((appearanceKey) => {
        const set = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
          if (key === appearanceKey) throw new Error("capture quota fixture");
          return set.call(this, key, value);
        };
      }, appearanceKey);
      await mixed.page.click("#rug-apply");
      await shot(mixed.page, "error-apply-preview-moss-confirmed-claret", [3, 1, 2], "moss", true);
      assert.match(await mixed.page.locator(".save-warning").textContent(), /not saved/);
      assert.equal((await mixed.page.evaluate(() => window.__captureStored())).appearance, null);
    } finally {
      await mixed.context.close();
    }
    const damaged = await start(viewport, true);
    try {
      await buy(damaged.page, "decor");
      await shot(damaged.page, "error-protected-originals-decor1", [0, 0, 1], "claret");
      assert.equal((await damaged.page.evaluate(() => window.__captureStored())).progress, "{damaged progress");
    } finally {
      await damaged.context.close();
    }
  }
  assert.equal(manifest.captures.length, 92);
  assert.equal(new Set(manifest.captures.map((capture) => capture.file)).size, 92);
}

function stats(values) {
  assert.ok(values.length > 0, "frame phase must contain observations");
  const sorted = [...values].sort((a, b) => a - b);
  return {
    samples: values.length,
    meanMs: values.reduce((a, b) => a + b, 0) / values.length,
    p50Ms: sorted[Math.floor(sorted.length * 0.5)],
    p95Ms: sorted[Math.floor(sorted.length * 0.95)],
    p99Ms: sorted[Math.floor(sorted.length * 0.99)],
    maxMs: sorted.at(-1),
    over25Ms: values.filter((value) => value > 25).length,
    over50Ms: values.filter((value) => value > 50).length,
  };
}

async function performanceReport() {
  const { page, context } = await start(viewports[0]);
  try {
    const client = await context.newCDPSession(page);
    await client.send("Performance.enable");
    await page.evaluate(() => {
      window.__intervals = { idle: [], purchases: [], previews: [], navigation: [] };
      window.__phase = "idle";
      let previous;
      function frame(now) {
        if (previous !== undefined) window.__intervals[window.__phase].push(now - previous);
        previous = now;
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
    // Fixed observation windows measure intervals; they are not application-readiness waits.
    await page.waitForTimeout(5000);
    await page.evaluate(() => {
      window.__phase = "purchases";
    });
    for (const item of ["bar", "machine", "decor"]) await buy(page, item, 3);
    await client.send("HeapProfiler.collectGarbage");
    const before = await client.send("Memory.getDOMCounters");
    await page.evaluate(() => {
      window.__phase = "previews";
    });
    for (let change = 0; change < 12; change++) {
      await style(page, change % 2 ? "Claret" : "Moss");
      await page.waitForTimeout(100);
    }
    await client.send("HeapProfiler.collectGarbage");
    const afterPreviews = await client.send("Memory.getDOMCounters");
    await page.evaluate(() => {
      window.__phase = "navigation";
    });
    for (let visit = 0; visit < 12; visit++) {
      await page.click("#enter-slot");
      await page.locator("#spin").waitFor();
      await page.getByRole("button", { name: "Back to lounge" }).click();
      await page.locator("#enter-slot").waitFor();
    }
    await client.send("HeapProfiler.collectGarbage");
    const afterNavigation = await client.send("Memory.getDOMCounters");
    // A first machine visit creates a cached scene. Compare a second batch before calling that growth a leak.
    for (let visit = 0; visit < 12; visit++) {
      await page.click("#enter-slot");
      await page.locator("#spin").waitFor();
      await page.getByRole("button", { name: "Back to lounge" }).click();
      await page.locator("#enter-slot").waitFor();
    }
    await settled(page);
    await client.send("HeapProfiler.collectGarbage");
    const afterRepeatedNavigation = await client.send("Memory.getDOMCounters");
    const observations = await page.evaluate(() => {
      const scene = window.__loungeScene;
      const gl = scene.game.renderer.gl;
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      return {
        intervals: window.__intervals,
        renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        webgl: gl.getParameter(gl.VERSION),
        phaser: scene.game.config.gameTitle || "Phaser (package.json pins 4.2.1)",
        activeScreens: document.querySelectorAll("#ui > .screen").length,
        productionAccesses: window.__productionAccesses,
        production: window.__captureStored().production,
      };
    });
    assert.equal(observations.production, sentinel);
    assert.deepEqual(observations.productionAccesses, []);
    assert.equal(observations.activeScreens, 1);
    const { intervals, ...details } = observations;
    await writeFile(
      resolve(out, "performance.json"),
      `${JSON.stringify(
        {
          observedAt: new Date().toISOString(),
          browser: browser.version(),
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? "Playwright default",
          launchArgs,
          viewport: viewports[0],
          os: `${os.platform()} ${os.release()}`,
          cpu: os.cpus()[0].model,
          ...details,
          softwareRendering: /swiftshader|software|llvmpipe/i.test(details.renderer),
          scenarios:
            "5s idle; nine real purchases with settled local reveals; 12 applied rug changes with 100ms dwell; two batches of 12 machine round trips",
          frameIntervals: Object.fromEntries(
            Object.entries(intervals).map(([phase, values]) => [phase, stats(values)]),
          ),
          rawFrameIntervals: intervals,
          domBefore: before,
          domAfterPreviews: afterPreviews,
          domAfterNavigation: afterNavigation,
          domAfterRepeatedNavigation: afterRepeatedNavigation,
          metrics: (await client.send("Performance.getMetrics")).metrics,
          errors: manifest.errors,
          limits:
            "One serial headless software-rendered run. RAF intervals include automation, GC and scene work, not GPU presentation times. No hardware 60FPS, acoustic listening, owner acceptance, sustained-load or heap-leak verdict. DOM counters after forced GC are one before/after observation, not proof of leak freedom.",
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    await context.close();
  }
}

async function sheets() {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    for (const viewport of viewports) {
      const captures = manifest.captures.filter((capture) => capture.viewport.width === viewport.width);
      for (let start = 0; start < captures.length; start += 4) {
        const group = captures.slice(start, start + 4);
        const rowHeight = Math.ceil((800 * viewport.height) / viewport.width) + 32;
        await page.setViewportSize({ width: 1600, height: rowHeight * 2 });
        await page.setContent(`<canvas width="1600" height="${rowHeight * 2}"></canvas>`);
        const sources = await Promise.all(
          group.map(async (capture) => ({
            label: capture.file,
            image: `data:image/png;base64,${(await readFile(resolve(out, capture.file))).toString("base64")}`,
          })),
        );
        await page.evaluate(
          async ({ sources, rowHeight }) => {
            const canvas = document.querySelector("canvas");
            document.body.style.margin = "0";
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#171214";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            for (const [index, source] of sources.entries()) {
              const image = new Image();
              image.src = source.image;
              await image.decode();
              const x = (index % 2) * 800,
                y = Math.floor(index / 2) * rowHeight;
              ctx.fillStyle = "#fff2cc";
              ctx.font = "16px sans-serif";
              ctx.fillText(source.label, x + 8, y + 22);
              ctx.drawImage(image, x, y + 32, 800, rowHeight - 32);
            }
          },
          { sources, rowHeight },
        );
        const file = `sheet-${viewport.width}x${viewport.height}-${String(start / 4 + 1).padStart(2, "0")}.png`;
        await page.screenshot({ path: resolve(out, file) });
        manifest.sheets.push({ file, sources: group.map((capture) => capture.file) });
      }
    }
  } finally {
    await context.close();
  }
}

try {
  if (!performanceOnly) await captures();
  await performanceReport();
  if (!performanceOnly) await sheets();
  assert.deepEqual(manifest.errors, []);
} finally {
  if (!performanceOnly) await writeFile(resolve(out, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await browser.close();
}
console.log(
  performanceOnly
    ? `Performance report refreshed; ${manifest.errors.length} page/console errors. ${out}`
    : `${manifest.captures.length} captures, ${manifest.sheets.length} contact sheets; ${manifest.errors.length} page/console errors. ${out}`,
);
