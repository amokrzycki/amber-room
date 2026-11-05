import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const evidence = "docs/evidence/phase3";
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, offline: true });
const page = await context.newPage();
const errors = [],
  network = [],
  checks = [],
  stopTimings = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => {
  if (/^https?:/.test(r.url())) network.push(r.url());
});
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
        settings: { muted: false, reducedMotion: false, effectsIntensity: 0.4 },
      }),
    );
  window.__audio = { active: 0, starts: 0, contexts: 0, events: [] };
  const Context = window.AudioContext;
  window.AudioContext = class extends Context {
    constructor(...args) {
      super(...args);
      window.__audio.contexts++;
    }
    createBufferSource() {
      const source = super.createBufferSource(),
        start = source.start.bind(source);
      source.start = (...args) => {
        window.__audio.active++;
        window.__audio.starts++;
        window.__audio.events.push({ duration: source.buffer?.duration, time: performance.now(), loop: source.loop });
        source.addEventListener("ended", () => window.__audio.active--, { once: true });
        return start(...args);
      };
      return source;
    }
  };
});
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem("fruit-salon:v1")));
const force = (stops) =>
  page.evaluate((s) => {
    window.__stops = [...s];
  }, stops);
const ready = () =>
  page.waitForFunction(() => {
    const save = JSON.parse(localStorage.getItem("fruit-salon:v1")),
      button = document.querySelector("#spin");
    return (
      button?.dataset.state === "idle" &&
      document.querySelector("#balance").textContent === save.balance.toLocaleString("en-GB") &&
      (!save.lastSpin ||
        (document.querySelector("#payout").textContent === save.lastSpin.outcome.payout.toLocaleString("en-GB") &&
          (!document.querySelector("#net") ||
            Number(document.querySelector("#net").textContent.replaceAll(",", "")) ===
              save.lastSpin.outcome.payout - save.lastSpin.totalStake)))
    );
  });
const settings = async () => {
  await page.click("[data-action=settings]");
};
const motion = async (value) => {
  await settings();
  await page.locator("#motion").setChecked(value);
  await page.click(".close");
};
try {
  await page.goto(`file://${resolve("dist/index.html")}`);
  await page.click("#enter-slot");
  await ready();
  assert.equal(await page.locator("#back").innerText(), "Lounge");
  assert.equal(await page.locator("#back").getAttribute("aria-label"), "Back to lounge");
  assert.equal(await page.locator(".topbar nav #back").count(), 1); // navigation, not part of the machine
  assert.equal(await page.locator(".slot-hud #back, .machine-name ~ #back").count(), 0);
  assert.equal(await page.locator("#cashout-note").count(), 0);
  for (const id of ["balance", "payout"])
    assert.match(await page.locator(`#${id}`).evaluate((e) => getComputedStyle(e).fontVariantNumeric), /tabular-nums/);
  await motion(true);
  for (const lineCount of [1, 5, 10, 20, 40])
    for (const perLine of [1, 2, 5]) {
      await page.selectOption("#line-count", String(lineCount));
      await page.selectOption("#per-line", String(perLine));
      await force([0, 0, 0, 0, 0]);
      const before = await saved();
      await page.click("#spin");
      await ready();
      const after = await saved();
      assert.equal(after.balance, before.balance - lineCount * perLine + after.lastSpin.outcome.payout);
      assert.deepEqual(after.lastSpin.bet, { lineCount, perLine });
      assert.equal(after.nextSpinId, before.nextSpinId + 1);
    }
  checks.push("all 15 bet/line combinations: actual deterministic spin, display and exact settlement");
  await page.selectOption("#line-count", "5");
  await page.selectOption("#per-line", "1");
  await motion(false);
  for (const [stops, payout] of [
    [[1, 0, 0, 0, 0], 0],
    [[2, 1, 0, 0, 0], 4],
    [[5, 1, 1, 0, 0], 5],
    [[3, 0, 0, 0, 0], 15],
    [[0, 0, 0, 0, 0], 70],
  ]) {
    await page.evaluate(() => {
      window.__announcements = [];
      window.__coherence = [];
      window.__moneyObserver?.disconnect();
      window.__moneyObserver = new MutationObserver(() => {
        const net = document.querySelector("#net");
        if (!net || document.querySelector("#net-wrap").hidden) return;
        const value = (el) => Number(el.textContent.replaceAll(",", ""));
        const spin = JSON.parse(localStorage.getItem("fruit-salon:v1")).lastSpin;
        // The net is final as soon as it appears; only RETURNED counts up, never past the settled payout.
        window.__coherence.push(
          value(net) === spin.outcome.payout - spin.totalStake &&
            value(document.querySelector("#payout")) <= spin.outcome.payout,
        );
      });
      window.__moneyObserver.observe(document.querySelector("#payout"), { childList: true });
      window.__announcementObserver?.disconnect();
      window.__announcementObserver = new MutationObserver(() =>
        window.__announcements.push(document.querySelector("#result-announcement").textContent),
      );
      window.__announcementObserver.observe(document.querySelector("#result-announcement"), {
        childList: true,
        subtree: true,
        characterData: true,
      });
    });
    await force(stops);
    const audioStart = await page.evaluate(() => window.__audio.events.length);
    const before = await saved();
    await page.focus("#spin");
    await page.keyboard.down("Space");
    for (let i = 0; i < 10; i++) await page.keyboard.down("Space");
    await page.evaluate(() => {
      for (let i = 0; i < 20; i++) document.querySelector("#back").click();
    });
    await page.waitForTimeout(400);
    assert.equal(await page.locator("#balance").innerText(), (before.balance - 5).toLocaleString("en-GB"));
    assert.equal(await page.locator("#payout").innerText(), "—");
    assert.equal(await page.locator("#back").isDisabled(), true);
    assert.equal((await saved()).lastSpin.outcome.payout, payout);
    assert.equal((await saved()).nextSpinId, before.nextSpinId + 1);
    assert.deepEqual(await page.evaluate(() => window.__announcements), []);
    await page.keyboard.up("Space");
    await page.waitForFunction(() => !document.querySelector("#back").disabled);
    // Reels have stopped: the single button is SPIN again; a win overlay ends without another wager.
    assert.equal(await page.locator("#spin").innerText(), "SPIN");
    if (payout > 5) await page.keyboard.press("Escape");
    await ready();
    const stopEvents = await page.evaluate(
      (start) => window.__audio.events.slice(start).filter((e) => e.duration >= 0.119 && e.duration <= 0.141),
      audioStart,
    );
    assert.equal(stopEvents.length, 5);
    stopTimings.push({
      payout,
      times: stopEvents.map((e) => e.time),
      intervals: stopEvents.slice(1).map((e, i) => e.time - stopEvents[i].time),
    });
    const after = await saved();
    assert.equal(after.balance, before.balance - 5 + payout);
    assert.equal(Number((await page.locator("#net").innerText()).replaceAll(",", "")), payout - 5);
    assert.equal(await page.locator("#balance").innerText(), after.balance.toLocaleString("en-GB"));
    assert.equal(await page.evaluate(() => window.__announcements.filter(Boolean).length), 1);
    assert(await page.evaluate(() => window.__coherence.length > 0 && window.__coherence.every(Boolean)));
    assert.match(await page.locator("#result-summary").innerText(), /Spin .* complete/);
    if (payout) assert.match(await page.locator(".win-details summary").innerText(), /winning line/);
    assert.match(await page.locator("#spin-status").innerText(), /Net/);
    // Phaser time is frame-driven; allow the 900ms line overlay to expire even under SwiftShader.
    await page.waitForTimeout(payout > 0 && payout <= 5 ? 2500 : 150);
    const clip = { x: 158, y: 209, width: 1285, height: 468 };
    const animated = await page.screenshot({ clip });
    await page.reload();
    await page.click("#enter-slot");
    await ready();
    const restored = await page.screenshot({ clip });
    if (!animated.equals(restored)) {
      await writeFile(`${evidence}/alignment-animated-${payout}.png`, animated);
      await writeFile(`${evidence}/alignment-restored-${payout}.png`, restored);
    }
    assert(
      animated.equals(restored),
      `animated final reel pixels must equal the reloaded predetermined grid (payout ${payout})`,
    );
    assert.equal(await page.locator("#result-announcement").innerText(), "");
    assert.deepEqual(await saved(), after);
  }
  checks.push(
    "loss, partial return, break-even, small/big wins; debit/reveal sequencing; held Space/rapid mixed input; one final announcement; pixel-exact reload alignment",
  );
  // Skip motion, preference changes, and hidden-tab interruption all settle the saved result once.
  for (const interruption of ["skip", "os-motion", "setting-motion", "visibility"]) {
    await force([3, 0, 0, 0, 0]);
    const before = await saved();
    await page.click("#spin");
    if (interruption === "skip") {
      assert.equal(await page.locator("#spin").innerText(), "SKIP");
      await page.click("#spin");
    }
    if (interruption === "os-motion") await page.emulateMedia({ reducedMotion: "reduce" });
    if (interruption === "setting-motion") {
      await motion(true);
    }
    if (interruption === "visibility")
      await page.evaluate(() => {
        Object.defineProperty(document, "hidden", { configurable: true, value: true });
        document.dispatchEvent(new Event("visibilitychange"));
      });
    await page.waitForFunction(() => !document.querySelector("#back").disabled);
    if (interruption !== "skip" && (await page.locator("#spin").getAttribute("data-state")) === "settled")
      await page.keyboard.press("Escape");
    await ready();
    assert.equal((await saved()).nextSpinId, before.nextSpinId + 1);
    assert.equal((await saved()).balance, before.balance + 10);
    if (interruption === "visibility") {
      await page.waitForTimeout(100);
      assert.equal(await page.evaluate(() => window.__audio.active), 0);
      await page.evaluate(() => {
        delete document.hidden;
        document.dispatchEvent(new Event("visibilitychange"));
      });
    }
    await page.emulateMedia({ reducedMotion: "no-preference" });
    if (interruption === "setting-motion") await motion(false);
  }
  checks.push(
    "skip motion; OS and in-game motion changes during reels; simulated hidden/resume; no repeated settlement or stale audio",
  );
  await settings();
  await page.locator("#music-volume").fill("0.25");
  await page.locator("#effects-volume").fill("0.35");
  assert.equal((await saved()).version, 1);
  assert.deepEqual(Object.keys((await saved()).settings).sort(), ["effectsIntensity", "muted", "reducedMotion"]);
  await page.click(".close");
  await force([3, 0, 0, 0, 0]);
  await page.click("#spin");
  const pending = await saved();
  await page.reload();
  await page.click("#enter-slot");
  await ready();
  assert.deepEqual(await saved(), pending);
  // Navigate directly during the win, with counters in flight; then exercise repeated teardown.
  await force([0, 0, 0, 0, 0]);
  await page.click("#spin");
  await page.waitForFunction(() => document.querySelector("#spin").dataset.state === "settled");
  const won = await saved();
  await page.click("#back");
  await page.locator("#enter-slot").waitFor();
  await page.click("#enter-slot");
  await ready();
  assert.deepEqual(await saved(), won);
  const client = await context.newCDPSession(page);
  await client.send("HeapProfiler.collectGarbage");
  const beforeMemory = await client.send("Memory.getDOMCounters");
  const heapBefore = await client.send("Runtime.getHeapUsage");
  for (let trip = 0; trip < 12; trip++) {
    await page.click("#back");
    await page.click("#enter-slot");
    await ready();
  }
  await page.waitForTimeout(400);
  await client.send("HeapProfiler.collectGarbage");
  const afterMemory = await client.send("Memory.getDOMCounters");
  const heapAfter = await client.send("Runtime.getHeapUsage");
  assert(
    afterMemory.jsEventListeners <= beforeMemory.jsEventListeners + 5,
    JSON.stringify({ beforeMemory, afterMemory }),
  );
  assert(afterMemory.nodes <= beforeMemory.nodes + 5);
  await page.waitForFunction(() => window.__audio.active === 0);
  assert.equal(await page.evaluate(() => window.__audio.contexts), 1);
  checks.push(
    "version 1 schema unchanged; mid-spin reload; navigation during count-up; 12 scene round trips; bounded DOM/listeners; one audio context, zero active slot sources at rest",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(network, []);
  await writeFile(
    `${evidence}/checks.json`,
    JSON.stringify({ checks, errors, network, stopTimings, beforeMemory, afterMemory, heapBefore, heapAfter }, null, 2),
  );
  console.log(JSON.stringify({ checks, beforeMemory, afterMemory, heapBefore, heapAfter }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
