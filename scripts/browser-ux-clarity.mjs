import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const evidence = "docs/evidence/phase1";
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, offline: true });
const page = await context.newPage();
const errors = [],
  network = [],
  layouts = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("request", (request) => {
  if (/^https?:/.test(request.url())) network.push(request.url());
});
await page.addInitScript(() => {
  const random = crypto.getRandomValues.bind(crypto);
  window.__stops = [];
  crypto.getRandomValues = (array) => {
    if (window.__stops.length && array instanceof Uint32Array) {
      array[0] = window.__stops.shift();
      return array;
    }
    return random(array);
  };
});
const save = () => page.evaluate(() => JSON.parse(localStorage.getItem("fruit-salon:v1")));
const ready = () =>
  page.waitForFunction(
    () => document.querySelector("#spin")?.textContent.includes("START") && !document.querySelector("#spin").disabled,
  );
const number = (value) => value.toLocaleString("en-GB");
const checkLayout = async (screen) => {
  const result = await page.evaluate(() => {
    const stage = document.querySelector("#stage").getBoundingClientRect();
    const scale = document.querySelector("#ui").getBoundingClientRect().width / 1600;
    const elements = [
      ...document.querySelectorAll(
        ".topbar button,.salon-wallet,.purchase button,.purchase p,.purchase small,#round,#round-purpose,#salon-message,.balance-block,.payout-block,.bet-block,#spin,#spin-status,#back",
      ),
    ].filter((element) => element.textContent.trim());
    const rects = elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        element: element.id || element.className || element.textContent.trim(),
        text: element.textContent.trim(),
        renderedFont: parseFloat(getComputedStyle(element).fontSize) * scale,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        inside:
          rect.left >= stage.left - 1 &&
          rect.top >= stage.top - 1 &&
          rect.right <= stage.right + 1 &&
          rect.bottom <= stage.bottom + 1,
        fits: element.scrollWidth <= element.clientWidth + 1,
      };
    });
    const overlaps = [];
    for (const [a, b] of [
      [".payout-block", ".bet-block"],
      [".bet-block", "#spin"],
      [".balance-block", "#spin-status"],
      ["#round-purpose", "#salon-message"],
    ]) {
      const first = document.querySelector(a),
        second = document.querySelector(b);
      if (!first?.textContent.trim() || !second?.textContent.trim()) continue;
      const x = first.getBoundingClientRect(),
        y = second.getBoundingClientRect();
      if (
        Math.min(x.right, y.right) - Math.max(x.left, y.left) > 1 &&
        Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 1
      )
        overlaps.push([a, b]);
    }
    return { viewport: [innerWidth, innerHeight], scale, stage: stage.toJSON(), rects, overlaps };
  });
  for (const rect of result.rects) {
    assert(rect.inside, `${screen} ${result.viewport}: ${rect.element} outside stage`);
    assert(rect.fits, `${screen} ${result.viewport}: ${rect.element} text overflow`);
  }
  assert.deepEqual(result.overlaps, [], `${screen} ${result.viewport}: overlapping controls`);
  layouts.push({ screen, ...result });
};
let completed = 0;
const spinOnce = async (stops, skip = false) => {
  const before = await save();
  await page.evaluate((values) => {
    window.__stops = [...values];
  }, stops);
  await page.click("#spin");
  const settled = await save();
  assert.equal(settled.nextSpinId, before.nextSpinId + 1);
  assert.equal(settled.balance, before.balance - settled.lastSpin.totalStake + settled.lastSpin.outcome.payout);
  assert.equal(await page.locator("#back").isDisabled(), true);
  assert.equal(await page.locator("#line-count").isDisabled(), true);
  assert.equal(await page.evaluate(() => window.__resultUpdates.length), completed);
  await page.waitForFunction(() => !document.querySelector("#back").disabled);
  if (skip && (await page.locator("#spin").textContent()).includes("SKIP")) {
    await page.waitForFunction(() => Number(document.querySelector("#payout").textContent.replaceAll(",", "")) > 0);
    assert.equal(
      await page.evaluate(() => window.__resultUpdates.length),
      completed,
      "Counting frames must stay silent",
    );
    await page.focus("#spin");
    await page.keyboard.down("Space");
    await page.keyboard.down("Space");
    await page.keyboard.up("Space");
    assert.equal(await page.evaluate(() => document.activeElement.id), "spin");
  }
  await ready();
  completed++;
  await page.waitForFunction((count) => window.__resultUpdates.length === count, completed);
  const { totalStake, outcome, id } = settled.lastSpin;
  const net = outcome.payout - totalStake;
  assert.equal(await page.locator("#payout").innerText(), number(outcome.payout));
  assert.equal(
    await page.locator("#spin-breakdown").innerText(),
    `Stake ${number(totalStake)} · Returned ${number(outcome.payout)} · Net ${net > 0 ? "+" : ""}${number(net)}`,
  );
  const announcement = await page.locator("#result-announcement").textContent();
  assert.equal(
    announcement,
    `Spin ${id} complete. Stake ${number(totalStake)} tokens. Returned ${number(outcome.payout)} tokens. ${net === 0 ? "Break-even." : `Net ${net > 0 ? "gain" : "loss"} ${number(Math.abs(net))} tokens.`}`,
  );
  assert.equal((await save()).nextSpinId, settled.nextSpinId, "Skip/held Space must not place another bet");
  return settled;
};
try {
  await page.goto(`file://${resolve("dist/index.html")}`);
  await page.locator("#enter-slot").waitFor();
  assert.match(await page.locator("#round-purpose").innerText(), /Celebration only.*no bonus or income/);
  assert.equal(await page.locator("#round").getAttribute("aria-describedby"), "round-purpose");
  assert.match(await page.locator("#round").innerText(), /50 tokens/);
  assert.match(await page.locator("#benefit-decor").innerText(), /Cosmetic only; no income/);
  assert.match(await page.locator("#benefit-bar").innerText(), /\+12 tokens/);
  assert.match(await page.locator("#benefit-machine").innerText(), /\+20 tokens/);
  await page.click("#enter-slot");
  await page.locator("#spin").waitFor();
  assert.equal(await page.locator("#win-label").innerText(), "Ready to play");
  assert.equal(await page.locator("#payout").innerText(), "—");
  assert.equal(await page.locator("#result-announcement").textContent(), "");
  assert.equal(await page.locator("#result-announcement").getAttribute("aria-live"), "polite");
  assert.equal(await page.locator("#result-announcement").getAttribute("aria-atomic"), "true");
  assert.equal(await page.locator("#payout").getAttribute("aria-live"), null);
  for (const [width, height] of [
    [1280, 800],
    [1366, 768],
    [1600, 900],
  ]) {
    await page.setViewportSize({ width, height });
    await page.waitForFunction(
      () =>
        Math.abs(
          document.querySelector("#ui").getBoundingClientRect().width - document.querySelector("#stage").clientWidth,
        ) < 2,
    );
    await checkLayout("slot-initial");
    await page.screenshot({ path: `${evidence}/after-slot-${width}x${height}.png` });
    await page.click("#back");
    await page.locator("#enter-slot").waitFor();
    await checkLayout("lounge");
    await page.screenshot({ path: `${evidence}/after-lounge-${width}x${height}.png` });
    await page.click("#enter-slot");
    await page.locator("#spin").waitFor();
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.evaluate(() => {
    window.__resultUpdates = [];
    new MutationObserver(() =>
      window.__resultUpdates.push(document.querySelector("#result-announcement").textContent),
    ).observe(document.querySelector("#result-announcement"), { childList: true, characterData: true, subtree: true });
  });
  for (const [name, stops, returned, skip] of [
    ["loss", [1, 0, 0, 0, 0], 0, false],
    ["loss-repeat", [1, 0, 0, 0, 0], 0, false],
    ["partial-return", [2, 1, 0, 0, 0], 4, false],
    ["break-even", [5, 1, 1, 0, 0], 5, false],
    ["win", [3, 0, 0, 0, 0], 15, false],
    ["big-skip", [0, 0, 0, 0, 0], 70, true],
    ["jackpot-skip", [9, 9, 9, 9, 0], 108, true],
  ]) {
    const result = await spinOnce(stops, skip);
    assert.equal(result.lastSpin.outcome.payout, returned);
    await checkLayout(name);
    await page.screenshot({ path: `${evidence}/after-${name}-1280x800.png` });
  }
  for (const lineCount of [1, 5, 10, 20, 40])
    for (const perLine of [1, 2, 5]) {
      const previous = await page.locator("#spin-breakdown").innerText();
      await page.selectOption("#line-count", String(lineCount));
      await page.selectOption("#per-line", String(perLine));
      assert.equal(await page.locator("#stake").innerText(), String(lineCount * perLine));
      assert.equal(await page.locator("#spin-breakdown").innerText(), previous);
      await spinOnce([1, 0, 0, 0, 0], true);
    }
  const last = await save(),
    breakdown = await page.locator("#spin-breakdown").innerText();
  await page.selectOption("#line-count", "1");
  await page.selectOption("#per-line", "1");
  await page.reload();
  await page.locator("#enter-slot").waitFor();
  await page.click("#enter-slot");
  await page.locator("#spin").waitFor();
  assert.equal(await page.locator("#spin-breakdown").innerText(), breakdown);
  assert.equal(
    await page.locator("#result-announcement").textContent(),
    "",
    "Reload must not announce an old spin as new",
  );
  assert.deepEqual((await save()).lastSpin, last.lastSpin);
  assert.equal((await save()).version, 1);
  assert.equal(await page.locator("#stake").innerText(), "1");
  await page.click("#back");
  await page.locator("#round").waitFor();
  const beforeRound = await save();
  await page.click("#round");
  const afterRound = await save();
  assert.equal(afterRound.balance, beforeRound.balance - 50);
  assert.deepEqual(afterRound.businesses, beforeRound.businesses);
  await checkLayout("lounge-after-round");
  assert.deepEqual(errors, []);
  assert.deepEqual(network, []);
  const report = {
    completed,
    layouts,
    errors,
    network,
    nativeScreenReader: "NOT TESTED; DOM semantics and mutation counts verified",
  };
  await writeFile(`${evidence}/browser-checks.json`, JSON.stringify(report, null, 2));
  console.log(
    `PASS: ${completed} spins; initial/loss/partial/break-even/win/skip; all 15 bets; one final announcement per spin; no counting announcements; focus; old-save reload; pre-purchase copy; unchanged round cost; 3 layouts; no clipping or control overlap; offline with no network/errors.`,
  );
} finally {
  await context.close();
  await browser.close();
}
