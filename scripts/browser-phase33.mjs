// Offline browser regression: result dialog, gestures, lifecycle, saves, geometry and warm win marks.
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const out = "docs/evidence/phase33";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const results = [],
  errors = [],
  requests = [];
const check = (name, ok) => {
  results.push({ name, ok });
  assert(ok, name);
};
const saved = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("fruit-salon:v1")));
async function open(width = 1600, height = 900) {
  const context = await browser.newContext({ viewport: { width, height }, offline: true });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (/^https?:/.test(r.url())) requests.push(r.url());
  });
  await page.addInitScript(() => {
    const original = crypto.getRandomValues.bind(crypto);
    window.__stops = [];
    crypto.getRandomValues = (a) => {
      if (window.__stops.length && a instanceof Uint32Array) {
        a[0] = window.__stops.shift();
        return a;
      }
      return original(a);
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
  return { page, context };
}
async function force(page, stops, lines = 5) {
  await page.selectOption("#line-count", String(lines));
  await page.evaluate((s) => {
    window.__stops = s;
  }, stops);
  await page.click("#spin");
}
const phase = (p, state) => p.waitForFunction((s) => document.querySelector("#spin").dataset.state === s, state);
const rect = (p) => p.locator("#spin").boundingBox();
try {
  const { page, context } = await open();
  const box = await rect(page);
  await force(page, [11, 11, 11, 11, 11]);
  await phase(page, "settled");
  const paid = await saved(page);
  await page.click("#spin");
  check("first SPIN during celebration only dismisses", (await saved(page)).nextSpinId === paid.nextSpinId);
  check("dismissal keeps exact settlement", (await saved(page)).balance === paid.balance);
  await page.locator("#spin").dispatchEvent("click", { detail: 2 });
  await page.locator("#spin").dispatchEvent("click", { detail: 3 });
  check("rapid pointer echoes never bet", (await saved(page)).nextSpinId === paid.nextSpinId);
  await page.waitForTimeout(420);
  await page.focus("#spin");
  await page.keyboard.down("Space");
  for (let i = 0; i < 4; i++) await page.keyboard.down("Space");
  await page.keyboard.up("Space");
  check(
    "distinct Space wagers once; held repeats do not skip or wager",
    (await saved(page)).nextSpinId === paid.nextSpinId + 1,
  );
  await page.waitForTimeout(400);
  await page.keyboard.press("Space");
  await page.waitForFunction(() => document.querySelector("#spin").dataset.state !== "spinning");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(420);
  check("SPIN footprint preserved", JSON.stringify(await rect(page)) === JSON.stringify(box));
  await context.close();
  for (const [width, height] of [
    [1280, 800],
    [1366, 768],
    [1600, 900],
    [1920, 1080],
  ]) {
    const { page, context } = await open(width, height);
    const initial = await rect(page);
    for (const [name, stops, lines] of [
      ["fruit", [3, 0, 0, 0, 0], 5],
      ["wild", [11, 0, 0, 0, 0], 5],
      ["overlap", [9, 6, 0, 0, 0], 5],
      ["busy", [9, 10, 10, 10, 9], 40],
    ]) {
      await force(page, stops, lines);
      await phase(page, "idle");
      const save = await saved(page),
        wins = save.lastSpin.outcome.lineWins;
      check(
        `${width} ${name}: line count`,
        (await page.locator(".win-details").innerText()).includes(`${wins.length} winning`),
      );
      check(
        `${width} ${name}: ordinary gameplay has no open dialog`,
        (await page.locator("dialog[open]").count()) === 0,
      );
      check(`${width} ${name}: HUD fixed`, JSON.stringify(await rect(page)) === JSON.stringify(initial));
      if (width === 1600) await page.screenshot({ path: `${out}/after-${name}.png` });
      await page.click(".win-details");
      const dialog = page.locator(".result-dialog");
      check(
        `${width} ${name}: accessible named modal`,
        (await dialog.getAttribute("aria-labelledby")) === "result-title",
      );
      check(`${width} ${name}: independent 5x3 diagram`, (await dialog.locator(".result-cell").count()) === 15);
      check(
        `${width} ${name}: accurate symbols`,
        JSON.stringify(await dialog.locator(".result-cell img").evaluateAll((els) => els.map((e) => e.alt))) ===
          JSON.stringify(
            save.lastSpin.outcome.grid.flat().map(
              (s) =>
                ({
                  cherry: "Cherries",
                  lemon: "Lemon",
                  plum: "Plum",
                  melon: "Melon",
                  seven: "Seven",
                  wild: "7 WILD",
                })[s],
            ),
          ),
      );
      check(
        `${width} ${name}: line identities and payouts`,
        JSON.stringify(
          await dialog
            .locator(".win-list button")
            .evaluateAll((els) => els.map((e) => [Number(e.dataset.line), Number(e.dataset.payout)])),
        ) === JSON.stringify(wins.map((w) => [w.lineIndex, w.payout])),
      );
      const rows = dialog.locator(".win-list button");
      await rows.first().focus();
      if (wins.length > 1) {
        await page.keyboard.press("ArrowDown");
        check(`${width} ${name}: arrow selects next line`, (await rows.nth(1).getAttribute("aria-pressed")) === "true");
      }
      const selected = wins[wins.length > 1 ? 1 : 0];
      check(
        `${width} ${name}: selected winning cells`,
        (await dialog.locator('.result-cell[data-winning="true"]').count()) === selected.count,
      );
      await page.keyboard.press("End");
      check(`${width} ${name}: End selects last line`, (await rows.last().getAttribute("aria-pressed")) === "true");
      await page.keyboard.press("Home");
      check(`${width} ${name}: Home selects first line`, (await rows.first().getAttribute("aria-pressed")) === "true");
      for (let i = 0; i < wins.length + 3; i++) await page.keyboard.press("Tab");
      check(
        `${width} ${name}: focus stays in modal`,
        await page.evaluate(() => !!document.activeElement.closest(".result-dialog")),
      );
      const fits = await dialog.evaluate((d) => {
        const r = d.getBoundingClientRect();
        return r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight;
      });
      check(`${width} ${name}: dialog fits viewport`, fits);
      if (width === 1600) await page.screenshot({ path: `${out}/dialog-${name}.png` });
      await page.keyboard.press("Escape");
      check(
        `${width} ${name}: Escape restores trigger focus`,
        await page.locator(".win-details").evaluate((e) => e === document.activeElement),
      );
      check(`${width} ${name}: viewing results never settles twice`, (await saved(page)).balance === save.balance);
    }
    const settled = await saved(page);
    await page.reload();
    await page.click("#enter-slot");
    await page.locator("#spin").waitFor();
    check(
      `${width}: saved result survives reload`,
      (await saved(page)).nextSpinId === settled.nextSpinId && (await saved(page)).balance === settled.balance,
    );
    await page.click(".win-details");
    await page.keyboard.press("Escape");
    await page.click("#back");
    await page.locator("#enter-slot").waitFor();
    check(`${width}: navigation preserves balance`, (await saved(page)).balance === settled.balance);
    await context.close();
  }
  check("no page errors", errors.length === 0);
  check("standalone file makes no network requests", requests.length === 0);
} finally {
  writeFileSync(`${out}/browser-tests.json`, JSON.stringify({ results, errors, requests }, null, 2));
  await browser.close();
}
console.log(`phase33: ${results.length} checks passed`);
