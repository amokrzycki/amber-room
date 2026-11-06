// Phase 3.2 typography comparison: identical states and seeded save, only the display face changes.
// Usage: node scripts/phase32-fonts.mjs  (needs dist/index.html built with --font-display / --display-weight tokens)
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const FONTS = process.env.FONT_DIR;
const out = "docs/evidence/phase32/fonts";
mkdirSync(out, { recursive: true });
const b64 = (path) => readFileSync(path).toString("base64");
const face = (family, file, weight = "400") =>
  `@font-face{font-family:"${family}";src:url(data:font/ttf;base64,${b64(`${FONTS}/${file}`)}) format("truetype");font-weight:${weight};font-display:block}`;
// Display-role overrides; every candidate keeps Source Sans 3 for labels, controls and figures.
const candidates = {
  caslon: { css: "", note: "Libre Caslon Text (current face, new role map)" },
  marcellus: {
    css: `${face("Cand Marcellus", "Marcellus-Regular.ttf")}:root{--font-display:"Cand Marcellus",Georgia,serif;--display-weight:400}`,
    note: "Marcellus 400",
  },
  newsreader: {
    css: `${face("Cand Newsreader", "Newsreader.ttf", "200 800")}:root{--font-display:"Cand Newsreader",Georgia,serif;--display-weight:500}`,
    note: "Newsreader 500 (opsz auto)",
  },
};
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const html = `file://${resolve(process.env.HTML ?? "dist/index.html")}`;
const sizes = [
  [1280, 800, 1],
  [1920, 1080, 1],
  [1600, 900, 2],
];
try {
  for (const [name, c] of Object.entries(candidates)) {
    for (const [w, h, dsf] of sizes) {
      const ctx = await browser.newContext({
        viewport: { width: w, height: h },
        deviceScaleFactor: dsf,
        offline: true,
      });
      const page = await ctx.newPage();
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
        localStorage.setItem(
          "fruit-salon:v1",
          JSON.stringify({
            version: 1,
            balance: 12345,
            businesses: { barLevel: 1, extraMachines: 0, decorLevel: 1 },
            lastAccrualAtMs: Date.now() + 86400000,
            remainderUnits: 0,
            nextSpinId: 1,
            lastSpin: null,
            selectedBet: { lineCount: 5, perLine: 1 },
            settings: { muted: true, reducedMotion: false, effectsIntensity: 0.4 },
          }),
        );
      });
      await page.goto(html);
      if (c.css) await page.addStyleTag({ content: c.css });
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(async () => {
        await Promise.all([
          document.fonts.load('400 24px "Cand Marcellus"').catch(() => undefined),
          document.fonts.load('500 24px "Cand Newsreader"').catch(() => undefined),
        ]);
      });
      await page.locator("#enter-slot").waitFor();
      const shot = (n, opts = {}) =>
        page.screenshot({ path: `${out}/${name}-${w}x${h}${dsf > 1 ? "@2x" : ""}-${n}.png`, ...opts });
      await page.waitForTimeout(300);
      if (dsf === 1) await shot("lounge");
      await page.click("#enter-slot");
      await page.locator("#spin").waitFor();
      await page.waitForTimeout(400);
      if (dsf === 1) await shot("slot-idle");
      await page.evaluate(() => (window.__stops = [9, 6, 0, 0, 0]));
      await page.click("#spin");
      await page.waitForFunction(() => document.querySelector("#spin").dataset.state === "idle", null, {
        timeout: 15000,
      });
      await page.waitForTimeout(300);
      if (dsf === 1) {
        await page.locator(".win-details").click();
        await page.waitForTimeout(100);
        await shot("slot-win");
        await page.keyboard.press("Escape");
        await page.click('[data-action="table"]');
        await page.waitForTimeout(200);
        await shot("dialog");
      } else {
        const k = 1; // clip rects are in CSS px at 1600 wide
        await shot("plate", { clip: { x: 560 * k, y: 100 * k, width: 480 * k, height: 90 * k } });
        await shot("hud", { clip: { x: 80 * k, y: 715 * k, width: 1440 * k, height: 160 * k } });
        await shot("topbar", { clip: { x: 0, y: 0, width: 1600, height: 100 } });
      }
      const fonts = await page.evaluate(() => ({
        display: getComputedStyle(document.querySelector(".machine-name")).fontFamily,
        loaded: [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family),
      }));
      if (dsf === 2) console.log(name, JSON.stringify(fonts));
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}
