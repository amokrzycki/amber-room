import { chromium } from "playwright";
import assert from "node:assert/strict";
import { resolve } from "node:path";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const context = await browser.newContext({
  viewport: { width: 1600, height: 900 },
  offline: true,
  recordVideo: { dir: "docs/evidence/video", size: { width: 1600, height: 900 } },
});
const page = await context.newPage();
const errors = [],
  network = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => {
  if (/^https?:/.test(r.url())) network.push(r.url());
});
await page.addInitScript(() => {
  const rng = crypto.getRandomValues.bind(crypto);
  window.__stops = [];
  crypto.getRandomValues = (array) => {
    if (window.__stops.length && array instanceof Uint32Array) {
      array[0] = window.__stops.shift();
      return array;
    }
    return rng(array);
  };
  window.__audio = { contexts: 0, active: 0, started: 0 };
  const Context = window.AudioContext;
  window.AudioContext = class extends Context {
    constructor(...args) {
      super(...args);
      window.__audio.contexts++;
    }
    createGain() {
      const gain = super.createGain();
      window.__masterMute ??= gain;
      return gain;
    }
    createBufferSource() {
      const source = super.createBufferSource();
      const start = source.start.bind(source);
      source.start = (...a) => {
        window.__audio.active++;
        window.__audio.started++;
        source.addEventListener("ended", () => window.__audio.active--, { once: true });
        return start(...a);
      };
      return source;
    }
  };
});
const readSave = () => page.evaluate(() => JSON.parse(localStorage.getItem("fruit-salon:v1")));
const force = (stops) =>
  page.evaluate((s) => {
    window.__stops = [...s];
  }, stops);
const ready = () =>
  page.waitForFunction(() => {
    const spin = document.querySelector("#spin");
    const saved = JSON.parse(localStorage.getItem("fruit-salon:v1"));
    const net = document.querySelector("#net");
    return (
      spin?.textContent === "SPIN" &&
      !spin.disabled &&
      (!saved?.lastSpin ||
        (document.querySelector("#payout").textContent === saved.lastSpin.outcome.payout.toLocaleString("en-GB") &&
          (!net ||
            Number(net.textContent.replaceAll(",", "")) === saved.lastSpin.outcome.payout - saved.lastSpin.totalStake)))
    );
  });
try {
  await page.goto(`file://${resolve("dist/index.html")}`);
  await page.locator("#enter-slot").waitFor();
  await page.screenshot({ path: "docs/evidence/salon.png" });
  await page.mouse.click(745, 405);
  await page.locator("#spin").waitFor({ timeout: 2000 });
  for (const key of ["Space", "Enter"]) {
    await page.focus("[data-action=settings]");
    await page.keyboard.press(key);
    assert.equal(await page.locator("dialog").evaluate((d) => d.open), true);
    await page.click(".close");
  }
  for (const size of [
    { width: 1280, height: 720 },
    { width: 1600, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(size);
    await page.waitForFunction(
      () =>
        Math.abs(
          document.querySelector("#ui").getBoundingClientRect().width - document.querySelector("#stage").clientWidth,
        ) < 2,
    );
    const bounds = await page.locator("#spin").boundingBox();
    assert(
      bounds.x >= 0 &&
        bounds.y >= 0 &&
        bounds.x + bounds.width <= size.width + 1 &&
        bounds.y + bounds.height <= size.height + 1,
    );
    await page.click("[data-action=settings]");
    const dialog = await page.locator("dialog").boundingBox();
    assert(
      dialog.x >= 0 &&
        dialog.y >= 0 &&
        dialog.x + dialog.width <= size.width + 1 &&
        dialog.y + dialog.height <= size.height + 1,
    );
    await page.click(".close");
  }
  await page.setViewportSize({ width: 1600, height: 900 });
  for (const n of [1, 5, 10, 20, 40]) {
    await page.selectOption("#line-count", String(n));
    await page.selectOption("#per-line", "2");
    assert.equal(await page.locator("#stake").innerText(), String(n * 2));
    await page.click("[data-action=table]");
    assert.equal(await page.locator(".line.active").count(), n);
    assert.equal(await page.locator(".line").count(), 40);
    await page.click(".close");
  }
  await page.selectOption("#line-count", "5");
  await page.selectOption("#per-line", "1");
  await page.screenshot({ path: "docs/evidence/slot.png" });
  const cases = [
    ["small", [3, 0, 0, 0, 0], 15],
    ["big", [0, 0, 0, 0, 0], 70],
    ["jackpot", [9, 9, 9, 9, 0], 108],
    ["neutral", [1, 0, 0, 0, 0], 0],
    ["return", [2, 1, 0, 0, 0], 4],
  ];
  for (const [tier, stops, payout] of cases) {
    const before = await readSave();
    await force(stops);
    if (tier === "jackpot") {
      await page.focus("#spin");
      await page.keyboard.press("Enter");
    } else await page.click("#spin");
    const settled = await readSave();
    assert.equal(settled.balance, before.balance - 5 + payout);
    assert.equal(settled.nextSpinId, before.nextSpinId + 1);
    assert.equal(settled.lastSpin.outcome.payout, payout);
    assert.equal(await page.locator("#back").isDisabled(), true);
    assert.equal(await page.locator("#line-count").isDisabled(), true);
    await page.waitForFunction(() => !document.querySelector("#back").disabled); // reels have stopped
    if (tier !== "neutral" && tier !== "return") {
      assert.match(await page.locator("#spin").innerText(), /SKIP/);
      await page.screenshot({ path: `docs/evidence/win-${tier}.png` });
      const key = { small: "Space", big: "Enter", jackpot: "NumpadEnter" }[tier];
      await page.focus("#spin");
      await page.keyboard.down(key);
      await page.keyboard.down(key);
      await page.keyboard.up(key);
      assert.equal((await readSave()).nextSpinId, settled.nextSpinId, `Held ${key} must not place another bet`);
      await ready();
      await page.waitForFunction(() => window.__audio.active === 0, undefined, { timeout: 2000 });
      assert.equal((await readSave()).nextSpinId, settled.nextSpinId);
      assert.equal((await readSave()).balance, settled.balance);
    } else await ready();
    assert.equal(await page.locator("#payout").innerText(), payout.toLocaleString("en-GB"));
  }
  for (let i = 0; i < 4; i++) {
    await page.click("#back");
    await page.locator("#enter-slot").waitFor();
    await page.click("#enter-slot");
    await page.locator("#spin").waitFor();
  }
  await force([9, 9, 9, 9, 0]);
  await page.click("#spin");
  await page.waitForFunction(() => document.querySelector("#spin")?.textContent.includes("SKIP"));
  await page.click("#back");
  await page.locator("#enter-slot").waitFor();
  await page.waitForTimeout(100);
  console.log("audio probe after repeated transitions", await page.evaluate(() => window.__audio));
  await page.click("#enter-slot");
  await page.locator("#spin").waitFor();
  await page.click("[data-action=settings]");
  await page.check("#muted");
  await page.waitForFunction(() => window.__masterMute.gain.value === 0, undefined, { timeout: 2000 });
  await page.check("#motion");
  await page.locator("#intensity").fill("0");
  await page.click(".close");
  const saved = await readSave();
  await page.reload();
  await page.locator("#enter-slot").waitFor();
  assert.deepEqual((await readSave()).settings, saved.settings);
  assert.equal((await readSave()).balance, saved.balance);
  await page.click("#enter-slot");
  await page.locator("#spin").waitFor();
  await page.waitForFunction(() => window.__masterMute.gain.value === 0, undefined, { timeout: 2000 });
  assert.deepEqual(errors, []);
  assert.deepEqual(network, []);
  console.log(
    "PASS: offline file, 3 resolutions, 5 line settings, 4 forced classes, save-before-motion, skip/space/held-enter, repeated scenes, settings reload.",
  );
  console.log("Audio output/headphone listening and user-device FPS: NOT VERIFIED.");
} finally {
  console.log("errors", errors);
  await context.close();
  await browser.close();
}
