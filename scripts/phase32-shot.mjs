// Ad hoc 2x crops of the slot scene: node scripts/phase32-shot.mjs <out-prefix> [html]
import { chromium } from "playwright";
import { resolve } from "node:path";
const prefix = process.argv[2];
const html = resolve(process.argv[3] ?? "dist/index.html");
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2, offline: true });
const page = await ctx.newPage();
await page.addInitScript(() => {
  localStorage.setItem(
    "fruit-salon:v1",
    JSON.stringify({
      version: 1,
      balance: 12345,
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
const clips = { tl: [0, 90, 800, 360], bottom: [0, 640, 1600, 260], br: [800, 640, 800, 260], full: [0, 0, 1600, 900] };
for (const [k, [x, y, width, height]] of Object.entries(clips))
  await page.screenshot({ path: `${prefix}-${k}.png`, clip: { x, y, width, height } });
await browser.close();
