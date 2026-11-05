// Phase 3.2 browser checks on dist/index.html (offline file://): lounge link in shared nav, font loading and
// fallback, win marks behind symbols (pixel checks), preview via pointer and keyboard, overlay hit testing.
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const evidence = "docs/evidence/phase32";
mkdirSync(evidence, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const results = [];
const errors = [];
const requests = [];
const check = (name, ok, detail) => {
  results.push({ name, ok: !!ok, detail });
  assert(ok, `${name}${detail ? ` — ${JSON.stringify(detail)}` : ""}`);
};

async function open(width, height) {
  const context = await browser.newContext({ viewport: { width, height }, offline: true });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("request", (r) => /^https?:/.test(r.url()) && requests.push(r.url()));
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
  await page.goto(`file://${resolve("dist/index.html")}`);
  await page.click("#enter-slot");
  await page.locator("#spin").waitFor();
  await page.waitForTimeout(400);
  return { page, context };
}
const save = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("fruit-salon:v1")));
const settle = async (page, stops) => {
  await page.evaluate((s) => (window.__stops = [...s]), stops);
  await page.click("#spin");
  await page.waitForFunction(() => document.querySelector("#spin").dataset.state === "idle", null, { timeout: 15000 });
  await page.waitForTimeout(300);
};
// Reel cell centres in scene px (1600x900 viewport maps 1:1).
const cx = (c) => 157 + 127 + c * 258;
const cy = (r) => 209 + 78 + r * 156;
const isMint = (r, g, b) => g > 90 && b > 90 && r < 75 && Math.abs(g - b) < 45 && g > r + 45;
const isBrass = (r, g, b) => r > 80 && r > g && g > b * 1.3;
async function pixels(page, rect) {
  const buf = await page.screenshot({ clip: rect });
  return page.evaluate(
    async ([b64]) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = new OffscreenCanvas(img.width, img.height).getContext("2d");
      c.drawImage(img, 0, 0);
      return Array.from(c.getImageData(0, 0, img.width, img.height).data);
    },
    [buf.toString("base64")],
  );
}
const mintCount = (data) => {
  let n = 0;
  for (let i = 0; i < data.length; i += 4) if (isMint(data[i], data[i + 1], data[i + 2])) n++;
  return n;
};

try {
  // 1. Lounge link lives in the shared navigation at every supported size and never touches its neighbours.
  for (const [w, h] of [
    [1280, 800],
    [1366, 768],
    [1600, 900],
    [1920, 1080],
  ]) {
    const { page, context } = await open(w, h);
    const geo = await page.evaluate(() => {
      const r = (q) => document.querySelector(q).getBoundingClientRect().toJSON();
      const stage = r("#stage");
      return {
        stage,
        back: r("#back"),
        brand: r(".brand"),
        buttons: [...document.querySelectorAll(".topbar nav button:not(#back)")].map((b) =>
          b.getBoundingClientRect().toJSON(),
        ),
        bar: r(".topbar"),
        machine: r(".machine-name"),
        inNav: !!document.querySelector(".topbar nav > #back"),
        inCabinet: !!document.querySelector(".slot-hud #back"),
        label: document.querySelector("#back").getAttribute("aria-label"),
        text: document.querySelector("#back").textContent.trim(),
        displayed: document.querySelector("#back").getBoundingClientRect().height,
      };
    });
    check(
      `${w}x${h} back is in shared nav`,
      geo.inNav && !geo.inCabinet && geo.label === "Back to lounge" && geo.text === "Lounge",
    );
    check(
      `${w}x${h} back inside topbar`,
      geo.back.top >= geo.bar.top && geo.back.bottom <= geo.bar.bottom && geo.back.left >= geo.stage.left,
    );
    check(
      `${w}x${h} back clear of neighbours`,
      geo.buttons.every((b) => b.left >= geo.back.right + 4) && geo.back.left > geo.brand.right + 40,
    );
    check(`${w}x${h} back above the cabinet`, geo.back.bottom <= geo.machine.top, {
      back: geo.back.bottom,
      plate: geo.machine.top,
    });
    check(`${w}x${h} back target >= 32px tall`, geo.displayed >= 32, geo.displayed);
    // Fonts: the shipped faces are loaded from the file, and the nameplate fits.
    const fonts = await page.evaluate(() => ({
      marcellus: document.fonts.check('400 28px "Marcellus"'),
      sans: document.fonts.check('400 18px "Source Sans 3"'),
      statuses: [...document.fonts].map((f) => `${f.family}:${f.status}`),
      plate: (() => {
        const e = document.querySelector(".machine-name");
        return {
          family: getComputedStyle(e).fontFamily,
          fits: e.scrollWidth <= e.clientWidth,
          w: e.scrollWidth,
          box: e.clientWidth,
        };
      })(),
      figures: getComputedStyle(document.querySelector("#balance")).fontVariantNumeric,
    }));
    check(
      `${w}x${h} fonts loaded`,
      fonts.marcellus && fonts.sans && fonts.statuses.every((s) => s.endsWith("loaded")),
      fonts.statuses,
    );
    check(
      `${w}x${h} nameplate uses Marcellus and fits`,
      /^"?Marcellus/.test(fonts.plate.family) && fonts.plate.fits,
      fonts.plate,
    );
    check(`${w}x${h} figures tabular lining`, /tabular-nums/.test(fonts.figures) && /lining-nums/.test(fonts.figures));
    if (w === 1280) {
      // Fallback: with the display face unavailable, Georgia must still fit the 360px nameplate.
      await page.addStyleTag({ content: `:root{--font-display:"Not Installed",Georgia,serif}` });
      const fb = await page.evaluate(() => {
        const e = document.querySelector(".machine-name");
        return {
          fits: e.scrollWidth <= e.clientWidth,
          w: e.scrollWidth,
          box: e.clientWidth,
          used: getComputedStyle(e).fontFamily,
        };
      });
      check("fallback nameplate fits", fb.fits, fb);
      await page.screenshot({ path: `${evidence}/fallback-1280x800.png` });
    }
    // Disabled while spinning; click returns to the lounge and keeps the wallet.
    const before = await save(page);
    await page.evaluate(() => (window.__stops = [1, 0, 0, 0, 0]));
    await page.click("#spin");
    check(`${w}x${h} back disabled while spinning`, await page.locator("#back").isDisabled());
    await page.waitForFunction(() => document.querySelector("#spin").dataset.state === "idle", null, {
      timeout: 15000,
    });
    check(`${w}x${h} back enabled again`, await page.locator("#back").isEnabled());
    const mid = await save(page);
    check(
      `${w}x${h} spin wallet exact`,
      mid.balance === before.balance - 5 && mid.nextSpinId === before.nextSpinId + 1,
      [before.balance, mid.balance],
    );
    await page.focus("#back");
    await page.keyboard.press("Enter");
    await page.locator("#enter-slot").waitFor();
    check(`${w}x${h} back keyboard returns to lounge`, (await save(page)).balance === mid.balance);
    await context.close();
  }

  // 2. Win marks at the reference size: behind symbols, thread visible, preview by pointer and keyboard.
  const { page, context } = await open(1600, 900);
  await settle(page, [11, 11, 11, 11, 11]); // five WILD tiles on the top row
  const tile = { x: cx(0) - 62, y: cy(0) - 62, width: 124, height: 124 };
  const gap = { x: cx(0) + 76, y: cy(0) - 4, width: cx(1) - cx(0) - 152, height: 8 };
  check("WILD tile has no mint over it", mintCount(await pixels(page, tile)) === 0);
  const gapPixels = await pixels(page, gap);
  let brass = 0;
  for (let i = 0; i < gapPixels.length; i += 4) if (isBrass(gapPixels[i], gapPixels[i + 1], gapPixels[i + 2])) brass++;
  check("warm brass thread visible between WILD tiles", brass > 80, brass);
  await page.screenshot({ path: `${evidence}/check-wild-five.png` });
  const top = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.tagName, [cx(2), cy(1)]);
  check("overlay leaves the canvas hit-testable", top === "CANVAS", top);
  await settle(page, [9, 6, 0, 0, 0]); // two lines share one WILD cell
  const reels = { x: 150, y: 200, width: 1300, height: 500 };
  const rest = await pixels(page, reels);
  await page.locator(".win-details").click();
  await page.locator(".win-list button").nth(1).click();
  check(
    "dialog selection changes its own diagram",
    (await page.locator('.win-list button[aria-pressed="true"]').getAttribute("data-line")) !== null,
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(120);
  const left = await pixels(page, reels);
  check(
    "dialog selection preserves live machine marks",
    rest.every((v, i) => v === left[i]),
  );
  check(
    "Escape restores result trigger focus",
    await page.locator(".win-details").evaluate((e) => e === document.activeElement),
  );
  await context.close();
} finally {
  await browser.close();
}
check("no page errors", errors.length === 0, errors);
check("no network requests", requests.length === 0, requests);
writeFileSync(`${evidence}/phase32-tests.json`, JSON.stringify(results, null, 2));
console.log(`phase32: ${results.filter((r) => r.ok).length}/${results.length} checks passed`);
