import type { SaveV1 } from "../../src/game/model";
import { expect, type Browser, type Page } from "@playwright/test";
import { test } from "./fixtures";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
let browser: Browser;
test.beforeAll(async ({ browser: runnerBrowser }) => {
  browser = runnerBrowser;
});
// Phase 3.1 focused browser tests: unified SPIN/SKIP, stable HUD, compact win details, wider reels.
// Runs against the standalone offline build.

const evidence = "docs/evidence/phase31";
mkdirSync(evidence, { recursive: true });
const file = `file://${resolve("dist/index.html")}`;
const errors: string[] = [];
const network: string[] = [];

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
  video = false,
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
          a[0] = window.__stops.shift()!;
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
      if (!localStorage.getItem("fruit-salon:v1")!)
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
        const hud = document.querySelector<HTMLElement>(".slot-hud")!;
        if (!hud) return null;
        const out: Record<string, number[]> = {};
        const add = (name: string, el: Element) => {
          const r = el.getBoundingClientRect();
          out[name] = [r.x, r.y, r.width, r.height];
        };
        for (const q of ["#stage", "#ui", "canvas", ".slot-hud", "#back"] as const)
          add(q, document.querySelector<HTMLElement>(q)!);
        let i = 0;
        for (const el of hud.querySelectorAll<HTMLElement>("*")) {
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

const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("fruit-salon:v1")!) as SaveV1);
const state = (page: Page) => page.locator("#spin").getAttribute("data-state");
const force = (page: Page, stops: readonly number[]) => page.evaluate((s) => (window.__stops = [...s]), stops);
const idle = (page: Page, timeout = 20000) =>
  page.waitForFunction(() => document.querySelector<HTMLButtonElement>("#spin")!.dataset.state === "idle", null, {
    timeout,
  });
const watchAnnouncements = (page: Page) =>
  page.evaluate(() => {
    window.__ann = [];
    new MutationObserver(() =>
      window.__ann.push(document.querySelector<HTMLElement>("#result-announcement")!.textContent!),
    ).observe(document.querySelector<HTMLElement>("#result-announcement")!, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });
const announcements = async (page: Page) => (await page.evaluate(() => window.__ann)).filter(Boolean);
const track = (page: Page) => page.evaluate(() => (window.__layout = { n: 0, box: {} }));
async function untrack(page: Page) {
  const l = await page.evaluate(() => {
    window.__sample();
    const l = window.__layout!;
    window.__layout = null;
    return l;
  });
  const spread: Record<string, number[]> = {};
  for (const [k, { min, max }] of Object.entries(l.box))
    spread[k] = max.map((v, i) => Math.round((v - min[i]) * 1000) / 1000);
  return { frames: l.n, spread };
}
function assertStable({ frames, spread }: { frames: number; spread: Record<string, number[]> }, label: string) {
  assert(frames > 10, `${label}: sampler saw only ${frames} frames`);
  for (const [k, s] of Object.entries(spread)) assert(Math.max(...s) <= 0.02, `${label}: ${k} moved/resized by ${s}`);
}
const reelPixels = (page: Page) => {
  // Reel aperture in scene coordinates 157..1443 x 209..677, mapped through the current FIT scale.
  return page
    .evaluate(() => {
      const r = document.querySelector<HTMLCanvasElement>("canvas")!.getBoundingClientRect();
      return { x: r.x, y: r.y, k: r.width / 1600 };
    })
    .then(({ x, y, k }) =>
      page.screenshot({ clip: { x: x + 157 * k, y: y + 209 * k, width: 1286 * k, height: 468 * k } }),
    );
};
const settleAll = async (page: Page) => {
  await page.waitForFunction(() => document.querySelector<HTMLButtonElement>("#spin")!.dataset.state !== "spinning");
  await page.keyboard.press("Escape");
  await idle(page);
  await page.waitForTimeout(400);
  await page.waitForFunction(() => {
    const s = JSON.parse(localStorage.getItem("fruit-salon:v1")!) as SaveV1;
    return (
      document.querySelector<HTMLElement>("#balance")!.textContent! === s.balance.toLocaleString("en-GB") &&
      (!s.lastSpin! ||
        document.querySelector<HTMLElement>("#payout")!.textContent! ===
          s.lastSpin!.outcome.payout.toLocaleString("en-GB"))
    );
  });
};

// 1 ──────────────────────────────────────────────────────────────────────────────────────────────
test("one button: SPIN → SKIP → SPIN, same rectangle in every state, pressed and focused", async () => {
  const { context, page } = await open();
  const rect = () => page.locator("#spin").evaluate((e) => JSON.stringify(e.getBoundingClientRect()));
  expect(await page.locator("#skip-motion").count()).toBe(0);
  expect(await page.locator("button", { hasText: /skip/i }).count(), "SKIP is not a separate control").toBe(0);
  const r0 = await rect();
  expect(await page.locator("#spin").innerText()).toBe("SPIN");
  expect(await page.locator("#spin").getAttribute("aria-label")).toBe("Spin reels");
  await force(page, STOPS.small);
  await track(page);
  await page.hover("#spin");
  await page.mouse.down();
  expect(await rect(), "pressing must not move the button box").toBe(r0);
  await page.mouse.up();
  expect(await state(page)).toBe("spinning");
  expect(await page.locator("#spin").innerText()).toBe("SKIP");
  expect(await page.locator("#spin").getAttribute("aria-label")).toBe("Skip to result");
  expect(
    await page.locator(".win-details").isVisible(),
    "previous spin's win details are hidden while reels turn",
  ).toBe(false);
  expect(await page.locator("#spin").isDisabled()).toBe(false);
  expect(await rect()).toBe(r0);
  expect(await page.evaluate(() => document.activeElement?.id), "focus stays on the one button").toBe("spin");
  await page.waitForTimeout(450);
  await page.click("#spin"); // SKIP
  await page.waitForFunction(() => document.querySelector<HTMLButtonElement>("#spin")!.dataset.state !== "spinning");
  expect(await state(page)).toBe("settled");
  expect(await page.locator("#spin").innerText()).toBe("SPIN");
  expect(await rect()).toBe(r0);
  await idle(page);
  expect(await page.locator("#spin").innerText()).toBe("SPIN");
  expect(await rect()).toBe(r0);
  assertStable(await untrack(page), "button journey");
  await context.close();
});

// 2 ──────────────────────────────────────────────────────────────────────────────────────────────
test("rapid repeated clicks in one task: one wager, one settlement, one announcement, predetermined result", async () => {
  const { context, page } = await open();
  await watchAnnouncements(page);
  const before = await saved(page);
  await force(page, STOPS.small);
  await page.evaluate(() => {
    for (let i = 0; i < 25; i++) document.querySelector<HTMLButtonElement>("#spin")!.click();
  });
  await settleAll(page);
  await page.waitForTimeout(300);
  const after = await saved(page);
  expect(after.nextSpinId).toBe(before.nextSpinId + 1);
  expect(after.balance).toBe(before.balance - 5 + 15);
  expect(after.lastSpin!.outcome.stops).toEqual(STOPS.small);
  expect((await announcements(page)).length).toBe(1);
  expect(await page.locator("#balance").innerText()).toBe("100,010");
  expect(await page.locator("#payout").innerText()).toBe("15");
  await context.close();
});

test("Space: held key spins once; keyup never skips; fresh Space skips; double-tap Space cannot wager", async () => {
  const { context, page } = await open();
  await watchAnnouncements(page);
  await page.focus("#spin");
  const before = await saved(page);
  await force(page, STOPS.small);
  await page.keyboard.down("Space");
  for (let i = 0; i < 15; i++) await page.keyboard.down("Space"); // auto-repeat
  await page.keyboard.up("Space");
  await page.waitForTimeout(150);
  expect(await state(page), "the keyup echo must not act as SKIP").toBe("spinning");
  expect((await saved(page)).nextSpinId).toBe(before.nextSpinId + 1);
  await page.waitForTimeout(350); // outside the first-gesture window; a fresh Space now means SKIP
  await page.locator("#spin").evaluate((button) => {
    for (let i = 0; i < 3; i++) {
      button.dispatchEvent(new KeyboardEvent("keydown", { key: " ", code: "Space", bubbles: true }));
      button.dispatchEvent(new KeyboardEvent("keyup", { key: " ", code: "Space", bubbles: true }));
    }
  });
  await page.waitForTimeout(100);
  expect((await saved(page)).nextSpinId, "double-tapping SKIP must not wager").toBe(before.nextSpinId + 1);
  expect(await page.evaluate(() => document.activeElement?.id)).toBe("spin");
  await settleAll(page);
  const after = await saved(page);
  expect(after.balance).toBe(before.balance - 5 + 15);
  expect((await announcements(page)).length).toBe(1);
  // Enter on the focused button behaves the same, Space on the page body too.
  await page.evaluate(() => (document.activeElement as HTMLElement).blur());
  await force(page, STOPS.loss);
  await page.waitForTimeout(400); // A distinct wager follows the SKIP rearm window.
  await page.keyboard.press("Space");
  expect((await saved(page)).nextSpinId).toBe(before.nextSpinId + 2);
  await settleAll(page);
  await context.close();
});

test("pointer: SKIP then dismiss celebration without a wager; a distinct activation spins again", async () => {
  const { context, page } = await open();
  const before = await saved(page);
  await force(page, STOPS.big);
  await page.click("#spin");
  await page.waitForTimeout(250);
  await page.locator("#spin").evaluate((button) => {
    for (let i = 0; i < 3; i++) (button as HTMLButtonElement).click();
  }); // SKIP and immediate echoes share one browser task.
  expect((await saved(page)).nextSpinId, "extra clicks right after SKIP are not a new wager").toBe(
    before.nextSpinId + 1,
  );
  expect(await state(page)).toBe("settled");
  await page.waitForTimeout(450);
  await force(page, STOPS.loss);
  await page.click("#spin"); // First activation dismisses the still-active celebration.
  expect((await saved(page)).nextSpinId).toBe(before.nextSpinId + 1);
  expect(await state(page)).toBe("idle");
  await page.waitForTimeout(400);
  await page.click("#spin"); // A later distinct activation places the next wager.
  expect((await saved(page)).nextSpinId).toBe(before.nextSpinId + 2);
  expect(await state(page)).toBe("spinning");
  await settleAll(page);
  expect((await saved(page)).balance).toBe(before.balance - 5 + 70 - 5);
  await context.close();
});

// 3 ──────────────────────────────────────────────────────────────────────────────────────────────
test("skip during acceleration, cruise and deceleration: exact predetermined grid, balance and one announcement", {
  tag: "@local",
}, async () => {
  for (const [label, delay] of [
    ["acceleration", 90],
    ["cruise", 500],
    ["deceleration", 900],
    ["settling", 1500],
  ] as const) {
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
    expect(after.nextSpinId, label).toBe(before.nextSpinId + 1);
    expect(after.balance, label).toBe(before.balance + 10);
    expect(after.lastSpin!.outcome.stops, label).toEqual(STOPS.small);
    expect(await page.locator("#balance").innerText(), label).toBe("100,010");
    expect((await announcements(page)).length, label).toBe(1);
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

test("SKIP is immediate: reels settle within two frames of the activation", { tag: "@local" }, async () => {
  const { context, page } = await open();
  await force(page, STOPS.small);
  await page.click("#spin");
  await page.waitForTimeout(300);
  const timing = await page.evaluate(
    () =>
      new Promise<{ ms: number; frames: number }>((done) => {
        const t0 = performance.now();
        let frames = 0;
        document.querySelector<HTMLButtonElement>("#spin")!.click();
        const check = () => {
          if (document.querySelector<HTMLButtonElement>("#spin")!.dataset.state !== "spinning")
            done({ ms: performance.now() - t0, frames });
          else
            requestAnimationFrame(() => {
              frames++;
              check();
            });
        };
        check();
      }),
  );
  assert(timing.frames <= 2, `settled after ${timing.frames} frames / ${timing.ms}ms`);
  await context.close();
});

test("30 spins with random skip timing: every wager and credit appears exactly once", async () => {
  const { context, page } = await open({ reducedMotion: false });
  let expected = (await saved(page)).balance;
  const ids: unknown[] = [];
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
    expect(after.nextSpinId, `spin ${n}`).toBe(before.nextSpinId + 1);
    expect(after.lastSpin!.outcome.stops, `spin ${n}: predetermined stops`).toEqual(stops);
    expected += after.lastSpin!.outcome.payout - after.lastSpin!.totalStake;
    expect(after.balance, `spin ${n}: balance`).toBe(expected);
    expect(await page.locator("#balance").innerText()).toBe(expected.toLocaleString("en-GB"));
    ids.push(after.lastSpin!.id);
    // A skipped spin must not write more often than an unskipped one: one commit at the wager.
    assert((await page.evaluate(() => window.__saves)) - saves <= 2, `spin ${n}: save churn`);
    await page.waitForTimeout(400); // clear the SKIP re-arm window
  }
  expect(new Set(ids).size).toBe(30);
  await context.close();
});

// 4 ──────────────────────────────────────────────────────────────────────────────────────────────
test("HUD and canvas boxes never move or resize through loss / partial / even / win / jackpot spins (4 viewports, with and without SKIP)", {
  tag: "@local",
}, async () => {
  for (const [width, height] of [
    [1280, 800],
    [1366, 768],
    [1600, 900],
    [1920, 1080],
  ] as const) {
    const { context, page } = await open({ width, height });
    for (const [name, skip] of [
      ["loss", false],
      ["partial", true],
      ["even", false],
      ["small", false],
      ["big", true],
      ["jackpot", false],
    ] as const) {
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

test("long result text and 40-line result dialog are bounded: HUD unchanged, list scrolls inside the stage", async () => {
  const { context, page } = await open({ bet: { lineCount: 40, perLine: 5 } });
  await force(page, STOPS.long);
  await track(page);
  await page.click("#spin");
  await page.waitForTimeout(200);
  await page.click("#spin");
  await page.waitForFunction(() => document.querySelector<HTMLButtonElement>("#spin")!.dataset.state !== "spinning");
  await page.keyboard.press("Escape");
  await settleAll(page);
  const summary = await page.locator(".win-details").innerText();
  const lines = Number.parseInt(summary, 10);
  assert(lines >= 10, `expected a long list, got "${summary}"`);
  await page.click(".win-details");
  const panel = page.locator(".result-dialog");
  assert(await panel.isVisible());
  expect(await panel.locator(".win-list button").count()).toBe(lines);
  const geo = await page.evaluate(() => {
    const p = document.querySelector<HTMLDialogElement>(".result-dialog")!.getBoundingClientRect();
    const s = document.querySelector<HTMLElement>("#stage")!.getBoundingClientRect();
    const el = document.querySelector<HTMLElement>(".win-list")!;
    return {
      inside: p.top >= s.top && p.bottom <= s.bottom && p.left >= s.left && p.right <= s.right,
      scrolls: el.scrollHeight > el.clientHeight,
      hudBottom: document.querySelector<HTMLElement>(".slot-hud")!.getBoundingClientRect().top - p.bottom,
    };
  });
  assert(geo.inside, "panel stays inside the stage");
  if (lines > 12) assert(geo.scrolls, "long content scrolls rather than growing");
  await page.locator(".win-list button").nth(2).hover();
  await page.waitForTimeout(150);
  await page.keyboard.press("Escape");
  expect((await page.locator(".result-dialog[open]").count()) > 0).toBe(false);
  await page.waitForTimeout(300);
  expect(await page.locator("#spin-status").innerText()).toMatch(/Net \+/);
  assertStable(await untrack(page), "long result");
  // The spend text is bounded too.
  await context.close();
  const low = await open({ balance: 3, bet: { lineCount: 40, perLine: 5 } });
  await track(low.page);
  await low.page.click("#spin");
  await low.page.waitForTimeout(500);
  expect(await low.page.locator("#spin-status").innerText()).toMatch(/Not enough tokens/);
  expect(await low.page.locator("#result-announcement").innerText()).toMatch(/Not enough tokens/);
  expect((await saved(low.page)).nextSpinId).toBe(1);
  expect(await state(low.page)).toBe("idle");
  assertStable(await untrack(low.page), "insufficient funds message");
  await low.context.close();
});

test("net is never labelled as a win unless it is one; sign, wording and accessible text agree", async () => {
  const { context, page } = await open();
  await watchAnnouncements(page);
  for (const [name, word, net] of [
    ["loss", "No return this time", -5],
    ["partial", "Tokens returned", -1],
    ["even", "Break-even", 0],
    ["small", "Win", 10],
    ["big", "Big win", 65],
  ] as const) {
    await force(page, STOPS[name]);
    await page.click("#spin");
    expect(await page.locator(".win-details").isVisible(), `${name}: stale details hidden while spinning`).toBe(false);
    await page.waitForFunction(() => document.querySelector<HTMLButtonElement>("#spin")!.dataset.state !== "spinning");
    if (name === "big") await page.keyboard.press("Escape");
    await settleAll(page);
    const text = await page.locator("#spin-status").innerText();
    assert(text.startsWith(word), `${name}: "${text}"`);
    if (net !== 0) expect(text).toMatch(new RegExp(`Net ${net > 0 ? "\\+" : "-"}${Math.abs(net)}$`));
    else assert.doesNotMatch(text, /Net/.source === "" ? /x/ : /Net [+-]/);
    if (net <= 0) assert.doesNotMatch(text, /\bwin\b/i);
    const s = await saved(page);
    expect(s.lastSpin!.outcome.payout - s.lastSpin!.totalStake).toBe(net);
    expect(await page.locator("#result-summary").innerText()).toMatch(
      net < 0 ? /Net loss/ : net === 0 ? /Break-even/ : /Net gain/,
    );
    expect((await page.locator("#spin-status").getAttribute("title"))!).toMatch(/Stake 5 · Returned \d+ · Net/);
    await page.waitForTimeout(400);
  }
  expect((await announcements(page)).length).toBe(5);
  await context.close();
});

// 5 ──────────────────────────────────────────────────────────────────────────────────────────────
test("number-animation interruptions: skip, new spin, back to lounge and reduced motion all end on the saved numbers", async () => {
  const { context, page } = await open();
  for (const how of ["skip-during-count", "spin-during-count", "motion-toggle", "navigate"] as const) {
    await force(page, STOPS.big);
    await track(page);
    await page.click("#spin");
    await page.waitForFunction(
      () => document.querySelector<HTMLButtonElement>("#spin")!.dataset.state === "settled",
      null,
      {
        timeout: 15000,
      },
    );
    if (how === "skip-during-count") await page.click("#spin", { trial: true });
    if (how === "spin-during-count") {
      await page.waitForTimeout(400);
      await force(page, STOPS.loss);
      const beforeDismiss = await saved(page);
      await page.click("#spin");
      expect((await saved(page)).nextSpinId).toBe(beforeDismiss.nextSpinId);
      expect((await saved(page)).balance).toBe(beforeDismiss.balance);
      await page.waitForTimeout(400);
      await page.click("#spin");
      expect((await saved(page)).lastSpin!.outcome.payout).toBe(0);
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
    expect(await page.locator("#balance").innerText(), how).toBe(s.balance.toLocaleString("en-GB"));
    expect(await page.locator("#payout").innerText(), how).toBe(s.lastSpin!.outcome.payout.toLocaleString("en-GB"));
    if (how !== "navigate") assertStable(await untrack(page), `count interruption: ${how}`);
    else await untrack(page);
    await page.waitForTimeout(450);
  }
  await context.close();
});

test("reload and navigation restore the last result without a new wager; mid-spin reload keeps the committed spin", async () => {
  const { context, page } = await open();
  await force(page, STOPS.small);
  await page.click("#spin");
  await page.waitForTimeout(300);
  const mid = await saved(page);
  await page.reload();
  await page.click("#enter-slot");
  await page.locator("#spin").waitFor();
  await page.waitForTimeout(500);
  expect(await saved(page), "reload must not wager or settle again").toEqual(mid);
  expect(await state(page)).toBe("idle");
  expect(await page.locator("#balance").innerText()).toBe(mid.balance.toLocaleString("en-GB"));
  expect(await page.locator("#payout").innerText()).toBe("15");
  expect(await page.locator("#spin-status").innerText()).toMatch(/^Last spin · Net \+10$/);
  expect(await page.locator(".win-details").innerText()).toMatch(/winning line/);
  expect(await page.locator("#result-announcement").innerText()).toBe("");
  for (let i = 0; i < 3; i++) {
    await page.click("#back");
    await page.locator("#enter-slot").waitFor();
    await page.click("#enter-slot");
    await page.locator("#spin").waitFor();
  }
  expect(await saved(page)).toEqual({ ...mid, lastAccrualAtMs: (await saved(page)).lastAccrualAtMs });
  await context.close();
});

// 6 ──────────────────────────────────────────────────────────────────────────────────────────────
test("responsive scaling: the HUD occupies the same scene rectangle at every size; resizing mid-spin changes nothing", async () => {
  const { context, page } = await open({ width: 1280, height: 800 });
  const design = () =>
    page.evaluate(() => {
      const k = document.querySelector<HTMLElement>("#ui")!.getBoundingClientRect();
      const s = k.width / 1600;
      const out: Record<string, number[]> = {};
      for (const q of [
        ".slot-hud",
        "#spin",
        "#per-line",
        "#line-count",
        ".balance-block",
        ".returned-block",
        ".bet-block",
      ] as const) {
        const r = document.querySelector<HTMLElement>(q)!.getBoundingClientRect();
        out[q] = [(r.x - k.x) / s, (r.y - k.y) / s, r.width / s, r.height / s].map((n) => Math.round(n * 10) / 10);
      }
      return out;
    });
  const base = await design();
  expect(base[".slot-hud"]).toEqual([125, 723, 1350, 144]);
  for (const [w, h] of [
    [1366, 768],
    [1600, 900],
    [1920, 1080],
    [1280, 800],
  ] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    const d = await design();
    for (const q of Object.keys(base))
      for (const [i, v] of base[q].entries())
        assert(Math.abs(v - d[q][i]) <= 0.6, `${w}x${h} ${q}: ${d[q]} vs ${base[q]}`);
    const text = await page.evaluate(() => {
      const k = document.querySelector<HTMLElement>("#ui")!.getBoundingClientRect().width / 1600;
      return [
        ...document.querySelectorAll<HTMLElement>(".hud-label,.hud-note,.bet-row label,.bet-row .total span"),
      ].map((e) => parseFloat(getComputedStyle(e).fontSize) * k);
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
  ] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(120);
  }
  await settleAll(page);
  const r = await untrack(page);
  // Only scale-driven moves are allowed; compare in scene units instead.
  const d = await design();
  expect(d[".slot-hud"]).toEqual(base[".slot-hud"]);
  assert(r.frames > 10);
  await context.close();
});

test("reduced motion (OS and in-game): no SKIP stage, no reel motion or counting, HUD still", async () => {
  for (const mode of ["os", "setting"] as const) {
    const { context, page } = await open({ os: mode === "os", reducedMotion: mode === "setting" });
    await force(page, STOPS.small);
    await track(page);
    const before = await saved(page);
    await page.click("#spin");
    await page.waitForTimeout(100);
    expect(await state(page), `${mode}: result is immediate`).not.toBe("spinning");
    expect(await page.locator("#balance").innerText()).toBe((before.balance + 10).toLocaleString("en-GB"));
    expect(await page.locator("#payout").innerText()).toBe("15");
    if (mode === "os")
      expect(
        await page.evaluate(
          () => getComputedStyle(document.querySelector<HTMLButtonElement>("#spin")!, "::before").transitionDuration,
        ),
      ).toBe("0s");
    await settleAll(page);
    expect((await saved(page)).nextSpinId).toBe(before.nextSpinId + 1);
    assertStable(await untrack(page), `reduced motion ${mode}`);
    await context.close();
  }
});

test("keyboard and assistive semantics: labelled groups, focus ring, Tab order, result trigger Space does not spin", async () => {
  const { context, page } = await open();
  expect(await page.locator(".slot-hud section").count()).toBe(3);
  for (const id of ["hud-balance", "hud-returned", "hud-bet"] as const)
    expect(await page.locator(`#${id}`).count()).toBe(1);
  expect(await page.locator("#spin").getAttribute("aria-keyshortcuts")).toBe("Space");
  expect(await page.locator("#balance-final").innerText()).toBe("100,000 tokens");
  await force(page, STOPS.small);
  await page.click("#spin");
  await settleAll(page);
  await page.locator(".win-details").focus();
  const before = (await saved(page)).nextSpinId;
  await page.keyboard.press("Space"); // opens the result dialog, must not start a spin
  expect((await page.locator(".result-dialog[open]").count()) > 0).toBe(true);
  await page.keyboard.press("Space");
  expect((await saved(page)).nextSpinId).toBe(before);
  await page.keyboard.press("Escape");
  await page.focus("#spin");
  const ring = await page
    .locator("#spin")
    .evaluate((e) => getComputedStyle(e).outlineStyle + getComputedStyle(e).outlineWidth);
  expect(ring).toBe("solid3px");
  await context.close();
});

test("flow: no console errors, no network", async () => {
  expect(errors).toEqual([]);
  expect(network).toEqual([]);
});
