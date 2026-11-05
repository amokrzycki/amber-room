// Phase 3.2 evidence: identical application states at the four supported viewports.
// Usage: node scripts/phase32-capture.mjs <label> [html-file] [--zoom]
// Writes docs/evidence/phase32/<label>-<WxH>-<state>.png and zoom crops (2x DPR) of the reel window at 1600x900.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const label = process.argv[2] ?? "after";
const html = resolve(process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : "dist/index.html");
const out = "docs/evidence/phase32";
mkdirSync(out, { recursive: true });
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7); // e.g. --only=1600
const viewports = [
  [1280, 800],
  [1366, 768],
  [1600, 900],
  [1920, 1080],
].filter(([w]) => !only || String(w) === only);
const scenarioFilter = process.argv
  .find((a) => a.startsWith("--states="))
  ?.slice(9)
  ?.split(",");
// 5 lines x 1 token unless noted. Stops index each reel strip; rows are stop, stop+1, stop+2.
export const SCENARIOS = [
  { name: "loss", stops: [1, 0, 0, 0, 0] },
  { name: "fruit", stops: [3, 0, 0, 0, 0] }, // cherry x5 on line 2
  { name: "fruit-multi", stops: [0, 0, 0, 0, 0] }, // three separate 5-of-a-kind lines
  { name: "wild", stops: [11, 0, 0, 0, 0] }, // WILD on reel 1 completes cherry x5
  { name: "wild-overlap", stops: [9, 6, 0, 0, 0] }, // two lines share the same WILD cell
  { name: "wild-five", stops: [11, 11, 11, 11, 11] }, // five WILD tiles in a row, 2000 + two more lines
  { name: "busy", stops: [9, 10, 10, 10, 9], bet: { lineCount: 40, perLine: 5 } },
];
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const errors = [];
try {
  for (const [w, h] of viewports) {
    const zoom = w === 1600;
    const context = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: zoom ? 2 : 1,
      offline: true,
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`${w}x${h}: ${e.message}`));
    page.on("console", (m) => m.type() === "error" && errors.push(`${w}x${h} console: ${m.text()}`));
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
    await page.waitForTimeout(600);
    const key = `${w}x${h}`;
    const shot = (name) => page.screenshot({ path: `${out}/${label}-${key}-${name}.png` });
    const reels = { x: 130, y: 180, width: 1340, height: 520 }; // scene px at 1600 wide
    const crop = async (name) => {
      if (!zoom) return;
      await page.screenshot({ path: `${out}/${label}-zoom-${name}.png`, clip: reels });
    };
    await shot("idle");
    let first = true;
    for (const sc of SCENARIOS.filter((x) => !scenarioFilter || scenarioFilter.includes(x.name))) {
      if (sc.bet) {
        await page.selectOption("#per-line", String(sc.bet.perLine));
        await page.selectOption("#line-count", String(sc.bet.lineCount));
      }
      await page.evaluate((s) => (window.__stops = [...s]), sc.stops);
      await page.click("#spin");
      if (first) {
        await page.waitForTimeout(450);
        await shot("spinning");
        first = false;
      }
      await page.waitForFunction(() => document.querySelector("#spin").dataset.state !== "spinning", null, {
        timeout: 15000,
      });
      await page.waitForTimeout(350);
      await shot(`${sc.name}-celebrating`);
      await page.waitForFunction(() => document.querySelector("#spin").dataset.state === "idle", null, {
        timeout: 15000,
      });
      await page.waitForTimeout(300);
      await shot(sc.name);
      await crop(sc.name);
      // Pointer and keyboard line previews on spins with a win-details list.
      if (["wild-overlap", "fruit-multi"].includes(sc.name)) {
        await page.locator(".win-details summary").click();
        const rows = page.locator(".win-list button");
        await rows.nth(1).hover();
        await page.waitForTimeout(150);
        await shot(`${sc.name}-hover`);
        await crop(`${sc.name}-hover`);
        await page.mouse.move(5, 450);
        await page.waitForTimeout(100);
        await page.locator(".win-details summary").focus();
        await page.keyboard.press("Tab");
        await page.waitForTimeout(150);
        await shot(`${sc.name}-keyfocus`);
        await crop(`${sc.name}-keyfocus`);
        await page.keyboard.press("Escape");
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}
writeFileSync(`${out}/${label}-errors.json`, JSON.stringify(errors, null, 2));
console.log(`label=${label} errors=${errors.length}`, errors.slice(0, 5).join("\n"));
