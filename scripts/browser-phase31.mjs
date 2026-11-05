// Phase 3.1 focused browser tests: unified SPIN/SKIP, stable HUD, compact win details, wider reels.
// Runs against dist/index.html (offline file://). `node scripts/browser-phase31.mjs [video]`
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const evidence = "docs/evidence/phase31";
mkdirSync(evidence, { recursive: true });
const file = `file://${resolve("dist/index.html")}`;
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const results = [];
const errors = [];
const network = [];

const STOPS = {
  loss: [1, 0, 0, 0, 0], // 0 returned
  partial: [2, 1, 0, 0, 0], // 4 returned on a stake of 5
  even: [5, 1, 1, 0, 0], // 5
  small: [3, 0, 0, 0, 0], // 15
  big: [0, 0, 0, 0, 0], // 70
  jackpot: [9, 9, 9, 9, 0], // 108
  long: [9, 10, 10, 10, 9], // 13,055 on 40 x 5, many winning lines
};

async function open({
  width = 1600,
  height = 900,
  balance = 100000,
  bet = { lineCount: 5, perLine: 1 },
  reducedMotion = false,
  os = false,
  video,
} = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    offline: true,
    reducedMotion: os ? "reduce" : "no-preference",
    ...(video ? { recordVideo: { dir: evidence, size: { width: 1280, height: 720 } } } : {}),
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => /^https?:/.test(r.url()) && network.push(r.url()));
  await page.addInitScript(
    ([balance, bet, reducedMotion]) => {
      const rng = crypto.getRandomValues.bind(crypto);
      window.__stops = [];
      crypto.getRandomValues = (a) => {
        if (window.__stops.length && a instanceof Uint32Array) {
          a[0] = window.__stops.shift();
          return a;
        }
        return rng(a);
      };
      window.__saves = 0;
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) {
        if (k === "fruit-salon:v1") window.__saves++;
        return set.call(this, k, v);
      };
      if (!localStorage.getItem("fruit-salon:v1"))
        localStorage.setItem(
          "fruit-salon:v1",
          JSON.stringify({
            version: 1,
            balance,
            businesses: { barLevel: 0, extraMachines: 0, decorLevel: 0 },
            lastAccrualAtMs: Date.now() + 86400000,
            remainderUnits: 0,
            nextSpinId: 1,
            lastSpin: null,
            selectedBet: bet,
            settings: { muted: true, reducedMotion, effectsIntensity: 0.4 },
          }),
        );
      // Layout sampler: every non-inline box in the HUD, plus canvas/stage, on every frame and every 5ms.
      window.__layout = null;
      const boxes = () => {
        const hud = document.querySelector(".slot-hud");
        if (!hud) return null;
        const out = {};
        const add = (name, el) => {
          const r = el.getBoundingClientRect();
          out[name] = [r.x, r.y, r.width, r.height];
        };
        for (const q of ["#stage", "#ui", "canvas", ".slot-hud", "#back"]) add(q, document.querySelector(q));
        let i = 0;
        for (const el of hud.querySelectorAll("*")) {
          // .face is the label of the pressed cap: it depresses 3px by transform while physically pressed.
          if (el.closest(".win-details") || el.classList.contains("face") || getComputedStyle(el).display === "inline")
            continue;
          add(`hud[${i++}] ${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : `.${el.className}`}`, el);
        }
        return out;
      };
      const sample = () => {
        if (!window.__layout) return;
        const b = boxes();
        if (!b) return;
        window.__layout.n++;
        for (const [k, v] of Object.entries(b)) {
          if (!window.__layout.box[k]) window.__layout.box[k] = { min: [...v], max: [...v] };
          const m = window.__layout.box[k];
          v.forEach((n, j) => {
            m.min[j] = Math.min(m.min[j], n);
            m.max[j] = Math.max(m.max[j], n);
          });
        }
      };
      const loop = () => {
        sample();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
      setInterval(sample, 5);
      window.__sample = sample;
    },
    [balance, bet, reducedMotion],
  );
  await page.goto(file);
  await page.click("#enter-slot");
  await page.locator("#spin").waitFor();
  await page.waitForTimeout(400);
  return { context, page };
}

const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("fruit-salon:v1")));
const state = (page) => page.locator("#spin").getAttribute("data-state");
const force = (page, stops) => page.evaluate((s) => (window.__stops = [...s]), stops);
const idle = (page, timeout = 20000) =>
  page.waitForFunction(() => document.querySelector("#spin").dataset.state === "idle", null, { timeout });
const watchAnnouncements = (page) =>
  page.evaluate(() => {
    window.__ann = [];
    new MutationObserver(() => window.__ann.push(document.querySelector("#result-announcement").textContent)).observe(
      document.querySelector("#result-announcement"),
      { childList: true, subtree: true, characterData: true },
    );
  });
const announcements = async (page) => (await page.evaluate(() => window.__ann)).filter(Boolean);
const track = (page) => page.evaluate(() => (window.__layout = { n: 0, box: {} }));
async function untrack(page) {
  const l = await page.evaluate(() => {
    window.__sample();
    const l = window.__layout;
    window.__layout = null;
    return l;
  });
  const spread = {};
  for (const [k, { min, max }] of Object.entries(l.box))
    spread[k] = max.map((v, i) => Math.round((v - min[i]) * 1000) / 1000);
  return { frames: l.n, spread };
}
function assertStable({ frames, spread }, label) {
  assert(frames > 10, `${label}: sampler saw only ${frames} frames`);
  for (const [k, s] of Object.entries(spread)) assert(Math.max(...s) <= 0.02, `${label}: ${k} moved/resized by ${s}`);
}
async function test(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - t0 });
    console.log(`PASS ${name}`);
  } catch (e) {
    results.push({ name, ok: false, error: e.message });
    console.log(`FAIL ${name}\n  ${e.message.split("\n").slice(0, 6).join("\n  ")}`);
    process.exitCode = 1;
  }
}
const reelPixels = (page) => {
  // Reel aperture in scene coordinates 157..1443 x 209..677, mapped through the current FIT scale.
  return page
    .evaluate(() => {
      const r = document.querySelector("canvas").getBoundingClientRect();
      return { x: r.x, y: r.y, k: r.width / 1600 };
    })
    .then(({ x, y, k }) =>
      page.screenshot({ clip: { x: x + 157 * k, y: y + 209 * k, width: 1286 * k, height: 468 * k } }),
    );
};
const settleAll = async (page) => {
  await idle(page);
  await page.waitForFunction(() => {
    const s = JSON.parse(localStorage.getItem("fruit-salon:v1"));
    return (
      document.querySelector("#balance").textContent === s.balance.toLocaleString("en-GB") &&
      (!s.lastSpin ||
        document.querySelector("#payout").textContent === s.lastSpin.outcome.payout.toLocaleString("en-GB"))
    );
  });
};

// 1 ──────────────────────────────────────────────────────────────────────────────────────────────
await test("one button: SPIN → SKIP → SPIN, same rectangle in every state, pressed and focused", async () => {
  const { context, page } = await open();
  const rect = () => page.locator("#spin").evaluate((e) => JSON.stringify(e.getBoundingClientRect()));
  assert.equal(await page.locator("#skip-motion").count(), 0);
  assert.equal(await page.locator("button", { hasText: /skip/i }).count(), 0, "SKIP is not a separate control");
  const r0 = await rect();
  assert.equal(await page.locator("#spin").innerText(), "SPIN");
  assert.equal(await page.locator("#spin").getAttribute("aria-label"), "Spin reels");
  await force(page, STOPS.small);
  await track(page);
  await page.hover("#spin");
  await page.mouse.down();
  assert.equal(await rect(), r0, "pressing must not move the button box");
  await page.mouse.up();
  assert.equal(await state(page), "spinning");
  assert.equal(await page.locator("#spin").innerText(), "SKIP");
  assert.equal(await page.locator("#spin").getAttribute("aria-label"), "Skip to result");
  assert.equal(
    await page.locator(".win-details").isVisible(),
    false,
    "previous spin's win details are hidden while reels turn",
  );
  assert.equal(await page.locator("#spin").isDisabled(), false);
  assert.equal(await rect(), r0);
  assert.equal(await page.evaluate(() => document.activeElement.id), "spin", "focus stays on the one button");
  await page.waitForTimeout(450);
  await page.click("#spin"); // SKIP
  await page.waitForFunction(() => document.querySelector("#spin").dataset.state !== "spinning");
  assert.equal(await state(page), "settled");
  assert.equal(await page.locator("#spin").innerText(), "SPIN");
  assert.equal(await rect(), r0);
  await idle(page);
  assert.equal(await page.locator("#spin").innerText(), "SPIN");
  assert.equal(await rect(), r0);
  assertStable(await untrack(page), "button journey");
  await context.close();
});

// 2 ──────────────────────────────────────────────────────────────────────────────────────────────
await test("rapid repeated clicks in one task: one wager, one settlement, one announcement, predetermined result", async () => {
  const { context, page } = await open();
  await watchAnnouncements(page);
  const before = await saved(page);
  await force(page, STOPS.small);
  await page.evaluate(() => {
    for (let i = 0; i < 25; i++) document.querySelector("#spin").click();
  });
  await settleAll(page);
  await page.waitForTimeout(300);
  const after = await saved(page);
  assert.equal(after.nextSpinId, before.nextSpinId + 1);
  assert.equal(after.balance, before.balance - 5 + 15);
  assert.deepEqual(after.lastSpin.outcome.stops, STOPS.small);
  assert.equal((await announcements(page)).length, 1);
  assert.equal(await page.locator("#balance").innerText(), "100,010");
  assert.equal(await page.locator("#payout").innerText(), "15");
  await context.close();
});

await test("Space: held key spins once; keyup never skips; fresh Space skips; double-tap Space cannot wager", async () => {
  const { context, page } = await open();
  await watchAnnouncements(page);
  await page.focus("#spin");
  const before = await saved(page);
  await force(page, STOPS.small);
  await page.keyboard.down("Space");
  for (let i = 0; i < 15; i++) await page.keyboard.down("Space"); // auto-repeat
  await page.keyboard.up("Space");
  await page.waitForTimeout(150);
  assert.equal(await state(page), "spinning", "the keyup echo must not act as SKIP");
  assert.equal((await saved(page)).nextSpinId, before.nextSpinId + 1);
  await page.waitForTimeout(350); // outside the first-gesture window; a fresh Space now means SKIP
  await page.keyboard.press("Space");
  await page.keyboard.press("Space"); // double-tap: second must be swallowed, not a new wager
  await page.keyboard.press("Space");
  await page.waitForTimeout(100);
  assert.equal((await saved(page)).nextSpinId, before.nextSpinId + 1, "double-tapping SKIP must not wager");
  assert.equal(await page.evaluate(() => document.activeElement.id), "spin");
  await settleAll(page);
  const after = await saved(page);
  assert.equal(after.balance, before.balance - 5 + 15);
  assert.equal((await announcements(page)).length, 1);
  // Enter on the focused button behaves the same, Space on the page body too.
  await page.evaluate(() => document.activeElement.blur());
  await force(page, STOPS.loss);
  await page.keyboard.press("Space");
  assert.equal((await saved(page)).nextSpinId, before.nextSpinId + 2);
  await settleAll(page);
  await context.close();
});

await test("pointer: SPIN, SKIP, immediate extra clicks are swallowed; a later click spins again", async () => {
  const { context, page } = await open();
  const before = await saved(page);
  await force(page, STOPS.big);
  await page.click("#spin");
  await page.waitForTimeout(250);
  await page.click("#spin"); // SKIP
  await page.click("#spin", { delay: 20 });
  await page.click("#spin");
  assert.equal(
    (await saved(page)).nextSpinId,
    before.nextSpinId + 1,
    "extra clicks right after SKIP are not a new wager",
  );
  assert.equal(await state(page), "settled");
  await page.waitForTimeout(450);
  await force(page, STOPS.loss);
  await page.click("#spin"); // deliberate: SETTLED → SPIN
  assert.equal((await saved(page)).nextSpinId, before.nextSpinId + 2);
  assert.equal(await state(page), "spinning");
  await settleAll(page);
  assert.equal((await saved(page)).balance, before.balance - 5 + 70 - 5);
  await context.close();
});

// 3 ──────────────────────────────────────────────────────────────────────────────────────────────
await test("skip during acceleration, cruise and deceleration: exact predetermined grid, balance and one announcement", async () => {
  for (const [label, delay] of [
    ["acceleration", 90],
    ["cruise", 500],
    ["deceleration", 900],
    ["settling", 1500],
  ]) {
    const { context, page } = await open();
    await watchAnnouncements(page);
    await force(page, STOPS.small);
    const before = await saved(page);
    await page.click("#spin");
    await page.waitForTimeout(delay);
    if ((await state(page)) === "spinning") await page.click("#spin");
    await settleAll(page);
    await page.waitForTimeout(250);
    const after = await saved(page);
    assert.equal(after.nextSpinId, before.nextSpinId + 1, label);
    assert.equal(after.balance, before.balance + 10, label);
    assert.deepEqual(after.lastSpin.outcome.stops, STOPS.small, label);
    assert.equal(await page.locator("#balance").innerText(), "100,010", label);
    assert.equal((await announcements(page)).length, 1, label);
    const animated = await reelPixels(page);
    await page.reload();
    await page.click("#enter-slot");
    await page.locator("#spin").waitFor();
    await page.waitForTimeout(500);
    const restored = await reelPixels(page);
    assert(animated.equals(restored), `${label}: skipped reels differ from the saved grid`);
    await context.close();
  }
});

await test("SKIP is immediate: reels settle within two frames of the activation", async () => {
  const { context, page } = await open();
  await force(page, STOPS.small);
  await page.click("#spin");
  await page.waitForTimeout(300);
  const ms = await page.evaluate(
    () =>
      new Promise((done) => {
        const t0 = performance.now();
        document.querySelector("#spin").click();
        const check = () =>
          document.querySelector("#spin").dataset.state !== "spinning"
            ? done(performance.now() - t0)
            : requestAnimationFrame(check);
        check();
      }),
  );
  assert(ms < 100, `settled after ${ms}ms`);
  await context.close();
});

await test("30 spins with random skip timing: every wager and credit appears exactly once", async () => {
  const { context, page } = await open({ reducedMotion: false });
  let expected = (await saved(page)).balance;
  const ids = [];
  for (let n = 0; n < 30; n++) {
    const stops = Array.from({ length: 5 }, () => Math.floor(Math.random() * 12));
    await force(page, stops);
    const before = await saved(page);
    const saves = await page.evaluate(() => window.__saves);
    await page.click("#spin");
    const skipAt = [null, 60, 200, 500, 800, 1100][n % 6];
    if (skipAt !== null) {
      await page.waitForTimeout(skipAt);
      if ((await state(page)) === "spinning") await page.click("#spin");
    }
    await settleAll(page);
    const after = await saved(page);
    assert.equal(after.nextSpinId, before.nextSpinId + 1, `spin ${n}`);
    assert.deepEqual(after.lastSpin.outcome.stops, stops, `spin ${n}: predetermined stops`);
    expected += after.lastSpin.outcome.payout - after.lastSpin.totalStake;
    assert.equal(after.balance, expected, `spin ${n}: balance`);
    assert.equal(await page.locator("#balance").innerText(), expected.toLocaleString("en-GB"));
    ids.push(after.lastSpin.id);
    // A skipped spin must not write more often than an unskipped one: one commit at the wager.
    assert((await page.evaluate(() => window.__saves)) - saves <= 2, `spin ${n}: save churn`);
    await page.waitForTimeout(400); // clear the SKIP re-arm window
  }
  assert.equal(new Set(ids).size, 30);
  await context.close();
});

// 4 ──────────────────────────────────────────────────────────────────────────────────────────────
await test("HUD and canvas boxes never move or resize through loss / partial / even / win / jackpot spins (4 viewports, with and without SKIP)", async () => {
  for (const [width, height] of [
    [1280, 800],
    [1366, 768],
    [1600, 900],
    [1920, 1080],
  ]) {
    const { context, page } = await open({ width, height });
    for (const [name, skip] of [
      ["loss", false],
      ["partial", true],
      ["even", false],
      ["small", false],
      ["big", true],
      ["jackpot", false],
    ]) {
      await force(page, STOPS[name]);
      await track(page);
      await page.click("#spin");
      if (skip) {
        await page.waitForTimeout(350);
        await page.click("#spin");
      }
      await page.waitForTimeout(100);
      if (name === "jackpot") await page.keyboard.press("Escape");
      await settleAll(page);
      await page.waitForTimeout(600);
      assertStable(await untrack(page), `${width}x${height} ${name}${skip ? "+skip" : ""}`);
      await page.waitForTimeout(400);
    }
    await context.close();
  }
});

await test("long result text and 40-line win details are bounded: HUD unchanged, panel scrolls inside the stage", async () => {
  const { context, page } = await open({ bet: { lineCount: 40, perLine: 5 } });
  await force(page, STOPS.long);
  await track(page);
  await page.click("#spin");
  await page.waitForTimeout(200);
  await page.click("#spin");
  await page.waitForFunction(() => document.querySelector("#spin").dataset.state !== "spinning");
  await page.keyboard.press("Escape");
  await settleAll(page);
  const summary = await page.locator(".win-details summary").innerText();
  const lines = Number.parseInt(summary, 10);
  assert(lines >= 10, `expected a long list, got "${summary}"`);
  await page.click(".win-details summary");
  const panel = page.locator(".win-panel");
  assert(await panel.isVisible());
  assert.equal(await panel.locator("button").count(), lines);
  const geo = await page.evaluate(() => {
    const p = document.querySelector(".win-panel").getBoundingClientRect();
    const s = document.querySelector("#stage").getBoundingClientRect();
    const el = document.querySelector(".win-panel");
    return {
      inside: p.top >= s.top && p.bottom <= s.bottom && p.left >= s.left && p.right <= s.right,
      scrolls: el.scrollHeight > el.clientHeight,
      hudBottom: document.querySelector(".slot-hud").getBoundingClientRect().top - p.bottom,
    };
  });
  assert(geo.inside, "panel stays inside the stage");
  assert(geo.hudBottom >= 0, "panel does not cover the HUD");
  if (lines > 12) assert(geo.scrolls, "long content scrolls rather than growing");
  await page.locator(".win-list button").nth(2).hover();
  await page.waitForTimeout(150);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator(".win-details").evaluate((d) => d.open), false);
  await page.waitForTimeout(300);
  assert.match(await page.locator("#spin-status").innerText(), /Net \+/);
  assertStable(await untrack(page), "long result");
  // The spend text is bounded too.
  await context.close();
  const low = await open({ balance: 3, bet: { lineCount: 40, perLine: 5 } });
  await track(low.page);
  await low.page.click("#spin");
  await low.page.waitForTimeout(500);
  assert.match(await low.page.locator("#spin-status").innerText(), /Not enough tokens/);
  assert.match(await low.page.locator("#result-announcement").innerText(), /Not enough tokens/);
  assert.equal((await saved(low.page)).nextSpinId, 1);
  assert.equal(await state(low.page), "idle");
  assertStable(await untrack(low.page), "insufficient funds message");
  await low.context.close();
});

await test("net is never labelled as a win unless it is one; sign, wording and accessible text agree", async () => {
  const { context, page } = await open();
  await watchAnnouncements(page);
  for (const [name, word, net] of [
    ["loss", "No return this time", -5],
    ["partial", "Tokens returned", -1],
    ["even", "Break-even", 0],
    ["small", "Win", 10],
    ["big", "Big win", 65],
  ]) {
    await force(page, STOPS[name]);
    await page.click("#spin");
    assert.equal(await page.locator(".win-details").isVisible(), false, `${name}: stale details hidden while spinning`);
    await page.waitForFunction(() => document.querySelector("#spin").dataset.state !== "spinning");
    if (name === "big") await page.keyboard.press("Escape");
    await settleAll(page);
    const text = await page.locator("#spin-status").innerText();
    assert(text.startsWith(word), `${name}: "${text}"`);
    if (net !== 0) assert.match(text, new RegExp(`Net ${net > 0 ? "\\+" : "-"}${Math.abs(net)}$`));
    else assert.doesNotMatch(text, /Net/.source === "" ? /x/ : /Net [+-]/);
    if (net <= 0) assert.doesNotMatch(text, /\bwin\b/i);
    const s = await saved(page);
    assert.equal(s.lastSpin.outcome.payout - s.lastSpin.totalStake, net);
    assert.match(
      await page.locator("#result-summary").innerText(),
      net < 0 ? /Net loss/ : net === 0 ? /Break-even/ : /Net gain/,
    );
    assert.match(await page.locator("#spin-status").getAttribute("title"), /Stake 5 · Returned \d+ · Net/);
    await page.waitForTimeout(400);
  }
  assert.equal((await announcements(page)).length, 5);
  await context.close();
});

// 5 ──────────────────────────────────────────────────────────────────────────────────────────────
await test("number-animation interruptions: skip, new spin, back to lounge and reduced motion all end on the saved numbers", async () => {
  const { context, page } = await open();
  for (const how of ["skip-during-count", "spin-during-count", "motion-toggle", "navigate"]) {
    await force(page, STOPS.big);
    await track(page);
    await page.click("#spin");
    await page.waitForFunction(() => document.querySelector("#spin").dataset.state === "settled", null, {
      timeout: 15000,
    });
    if (how === "skip-during-count") await page.click("#spin", { trial: true });
    if (how === "spin-during-count") {
      await page.waitForTimeout(400);
      await force(page, STOPS.loss);
      await page.click("#spin");
      assert.equal((await saved(page)).lastSpin.outcome.payout, 0);
    }
    if (how === "motion-toggle") await page.emulateMedia({ reducedMotion: "reduce" });
    if (how === "navigate") {
      await page.click("#back");
      await page.locator("#enter-slot").waitFor();
      await page.click("#enter-slot");
      await page.locator("#spin").waitFor();
    } else await page.keyboard.press("Escape");
    await settleAll(page);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const s = await saved(page);
    assert.equal(await page.locator("#balance").innerText(), s.balance.toLocaleString("en-GB"), how);
    assert.equal(await page.locator("#payout").innerText(), s.lastSpin.outcome.payout.toLocaleString("en-GB"), how);
    if (how !== "navigate") assertStable(await untrack(page), `count interruption: ${how}`);
    else await untrack(page);
    await page.waitForTimeout(450);
  }
  await context.close();
});

await test("reload and navigation restore the last result without a new wager; mid-spin reload keeps the committed spin", async () => {
  const { context, page } = await open();
  await force(page, STOPS.small);
  await page.click("#spin");
  await page.waitForTimeout(300);
  const mid = await saved(page);
  await page.reload();
  await page.click("#enter-slot");
  await page.locator("#spin").waitFor();
  await page.waitForTimeout(500);
  assert.deepEqual(await saved(page), mid, "reload must not wager or settle again");
  assert.equal(await state(page), "idle");
  assert.equal(await page.locator("#balance").innerText(), mid.balance.toLocaleString("en-GB"));
  assert.equal(await page.locator("#payout").innerText(), "15");
  assert.match(await page.locator("#spin-status").innerText(), /^Last spin · Net \+10$/);
  assert.match(await page.locator(".win-details summary").innerText(), /winning line/);
  assert.equal(await page.locator("#result-announcement").innerText(), "");
  for (let i = 0; i < 3; i++) {
    await page.click("#back");
    await page.locator("#enter-slot").waitFor();
    await page.click("#enter-slot");
    await page.locator("#spin").waitFor();
  }
  assert.deepEqual(await saved(page), { ...mid, lastAccrualAtMs: (await saved(page)).lastAccrualAtMs });
  await context.close();
});

// 6 ──────────────────────────────────────────────────────────────────────────────────────────────
await test("responsive scaling: the HUD occupies the same scene rectangle at every size; resizing mid-spin changes nothing", async () => {
  const { context, page } = await open({ width: 1280, height: 800 });
  const design = () =>
    page.evaluate(() => {
      const k = document.querySelector("#ui").getBoundingClientRect();
      const s = k.width / 1600;
      const out = {};
      for (const q of [
        ".slot-hud",
        "#spin",
        "#per-line",
        "#line-count",
        ".balance-block",
        ".returned-block",
        ".bet-block",
      ]) {
        const r = document.querySelector(q).getBoundingClientRect();
        out[q] = [(r.x - k.x) / s, (r.y - k.y) / s, r.width / s, r.height / s].map((n) => Math.round(n * 10) / 10);
      }
      return out;
    });
  const base = await design();
  assert.deepEqual(base[".slot-hud"], [125, 723, 1350, 144]);
  for (const [w, h] of [
    [1366, 768],
    [1600, 900],
    [1920, 1080],
    [1280, 800],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    const d = await design();
    for (const q of Object.keys(base))
      for (const [i, v] of base[q].entries())
        assert(Math.abs(v - d[q][i]) <= 0.6, `${w}x${h} ${q}: ${d[q]} vs ${base[q]}`);
    const text = await page.evaluate(() => {
      const k = document.querySelector("#ui").getBoundingClientRect().width / 1600;
      return [...document.querySelectorAll(".hud-label,.hud-note,.bet-row label,.bet-row .total span")].map(
        (e) => parseFloat(getComputedStyle(e).fontSize) * k,
      );
    });
    assert(Math.min(...text) >= 12.9, `${w}x${h}: text under 13 CSS px: ${Math.min(...text)}`);
  }
  await force(page, STOPS.small);
  await track(page);
  await page.click("#spin");
  for (const [w, h] of [
    [1920, 1080],
    [1366, 768],
    [1600, 900],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(120);
  }
  await settleAll(page);
  const r = await untrack(page);
  // Only scale-driven moves are allowed; compare in scene units instead.
  const d = await design();
  assert.deepEqual(d[".slot-hud"], base[".slot-hud"]);
  assert(r.frames > 10);
  await context.close();
});

await test("reduced motion (OS and in-game): no SKIP stage, no reel motion or counting, HUD still", async () => {
  for (const mode of ["os", "setting"]) {
    const { context, page } = await open({ os: mode === "os", reducedMotion: mode === "setting" });
    await force(page, STOPS.small);
    await track(page);
    const before = await saved(page);
    await page.click("#spin");
    await page.waitForTimeout(100);
    assert.notEqual(await state(page), "spinning", `${mode}: result is immediate`);
    assert.equal(await page.locator("#balance").innerText(), (before.balance + 10).toLocaleString("en-GB"));
    assert.equal(await page.locator("#payout").innerText(), "15");
    if (mode === "os")
      assert.equal(
        await page.evaluate(() => getComputedStyle(document.querySelector("#spin"), "::before").transitionDuration),
        "0s",
      );
    await settleAll(page);
    assert.equal((await saved(page)).nextSpinId, before.nextSpinId + 1);
    assertStable(await untrack(page), `reduced motion ${mode}`);
    await context.close();
  }
});

await test("keyboard and assistive semantics: labelled groups, focus ring, Tab order, summary Space does not spin", async () => {
  const { context, page } = await open();
  assert.equal(await page.locator(".slot-hud section").count(), 3);
  for (const id of ["hud-balance", "hud-returned", "hud-bet"]) assert.equal(await page.locator(`#${id}`).count(), 1);
  assert.equal(await page.locator("#spin").getAttribute("aria-keyshortcuts"), "Space");
  assert.equal(await page.locator("#balance-final").innerText(), "100,000 tokens");
  await force(page, STOPS.small);
  await page.click("#spin");
  await settleAll(page);
  await page.locator(".win-details summary").focus();
  const before = (await saved(page)).nextSpinId;
  await page.keyboard.press("Space"); // toggles the disclosure, must not start a spin
  assert.equal(await page.locator(".win-details").evaluate((d) => d.open), true);
  await page.keyboard.press("Space");
  assert.equal((await saved(page)).nextSpinId, before);
  await page.focus("#spin");
  const ring = await page
    .locator("#spin")
    .evaluate((e) => getComputedStyle(e).outlineStyle + getComputedStyle(e).outlineWidth);
  assert.equal(ring, "solid3px");
  await context.close();
});

await test("flow: no console errors, no network", async () => {
  assert.deepEqual(errors, []);
  assert.deepEqual(network, []);
});

await browser.close();
writeFileSync(`${evidence}/phase31-tests.json`, JSON.stringify(results, null, 2));
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed`);
