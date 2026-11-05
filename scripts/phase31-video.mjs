// Records the Phase 3.1 gameplay demonstration (docs/evidence/phase31/phase31-gameplay.webm).
import { chromium } from "playwright";
import { mkdirSync, renameSync, readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const out = "docs/evidence/phase31/video-tmp";
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const context = await browser.newContext({
  viewport: { width: 1600, height: 900 },
  offline: true,
  recordVideo: { dir: out, size: { width: 1600, height: 900 } },
});
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
  // Recording aids only (this page, not the game): a cursor dot and a caption for what the operator did.
  addEventListener("DOMContentLoaded", () => {
    const dot = document.createElement("div");
    dot.style.cssText =
      "position:fixed;z-index:99;width:18px;height:18px;margin:-9px;border-radius:50%;border:2px solid #35e6d1;pointer-events:none;left:-50px;top:-50px";
    const cap = document.createElement("div");
    cap.style.cssText =
      "position:fixed;z-index:99;left:50%;top:6px;transform:translateX(-50%);padding:4px 14px;border-radius:6px;background:#000c;color:#fff2cc;font:600 20px 'Source Sans 3',sans-serif;pointer-events:none";
    document.body.append(dot, cap);
    addEventListener("mousemove", (e) => {
      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;
    });
    window.__cap = (t) => {
      cap.textContent = t;
    };
    setInterval(() => {
      const s = document.querySelector("#spin")?.dataset.state;
      const f = document.querySelector("#spin")?.getBoundingClientRect();
      if (s && f) cap.dataset.state = s;
    }, 100);
  });
});
const say = (t) => page.evaluate((x) => window.__cap?.(x), t);
const hud = () =>
  page.evaluate(() => {
    const r = document.querySelector(".slot-hud").getBoundingClientRect();
    const b = document.querySelector("#spin").getBoundingClientRect();
    return `HUD ${r.x},${r.y},${r.width}x${r.height} · button ${b.x},${b.y}`;
  });
await page.goto(`file://${resolve("dist/index.html")}`);
await page.click("#enter-slot");
await page.locator("#spin").waitFor();
await page.waitForTimeout(1200);
await say(`Idle · ${await hud()}`);
await page.waitForTimeout(1500);
// 1. SPIN then SKIP mid-spin: lands on the predetermined result.
await page.evaluate(() => (window.__stops = [3, 0, 0, 0, 0]));
await page.hover("#spin");
await say("Click SPIN");
await page.click("#spin");
await page.waitForTimeout(500);
await say(`SPINNING: same button reads SKIP · ${await hud()}`);
await page.waitForTimeout(500);
await say("Click SKIP: settles on the saved outcome");
await page.click("#spin");
await page.waitForTimeout(1500);
await say(`SETTLED: SPIN again · returned 15, net +10 · ${await hud()}`);
await page.waitForTimeout(1500);
// 2. Win details disclosure and reel marks.
await page.click(".win-details summary");
await say("Win details: optional disclosure; hover previews a line on the reels");
await page.locator(".win-list button").first().hover();
await page.waitForTimeout(1500);
await page.keyboard.press("Escape");
// 3. Partial return, natural stop (no skip).
await page.evaluate(() => (window.__stops = [2, 1, 0, 0, 0]));
await page.focus("#spin");
await say("SPACE: spin, let it finish");
await page.keyboard.press("Space");
await page.waitForFunction(() => document.querySelector("#spin").dataset.state === "idle", null, { timeout: 15000 });
await say("Partial return: 4 returned on a stake of 5, net -1 (not labelled a win)");
await page.waitForTimeout(2200);
// 4. Loss, skipped with Space; a double-tap does not wager.
await page.evaluate(() => (window.__stops = [1, 0, 0, 0, 0]));
await page.focus("#spin");
await say("SPACE to spin, SPACE twice to skip");
await page.keyboard.press("Space");
await page.waitForTimeout(450);
await page.keyboard.press("Space");
await page.keyboard.press("Space");
await page.waitForTimeout(2400);
await say("Loss: returned 0, net -5; one wager only");
await page.waitForTimeout(1500);
// 5. Many winning lines at the highest bet: bounded details, HUD unchanged.
await page.selectOption("#line-count", "40");
await page.selectOption("#per-line", "5");
await page.evaluate(() => (window.__stops = [9, 10, 10, 10, 9]));
await say("40 lines x 5: long result");
await page.click("#spin");
await page.waitForTimeout(400);
await page.click("#spin");
await page.waitForTimeout(800);
await page.keyboard.press("Escape");
await page.waitForFunction(() => document.querySelector("#spin").dataset.state === "idle", null, { timeout: 15000 });
await page.click(".win-details summary");
await say(`${await page.locator(".win-details summary").innerText()}: panel scrolls, HUD unchanged · ${await hud()}`);
await page.waitForTimeout(2500);
await context.close();
await browser.close();
const file = readdirSync(out).find((f) => f.endsWith(".webm"));
renameSync(`${out}/${file}`, "docs/evidence/phase31/phase31-gameplay.webm");
rmSync(out, { recursive: true, force: true });
console.log("docs/evidence/phase31/phase31-gameplay.webm");
