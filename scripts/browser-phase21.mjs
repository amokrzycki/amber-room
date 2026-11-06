import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const evidence = "docs/evidence/phase2.1";
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const results = [],
  errors = [],
  network = [];
const ready = (page) =>
  page.waitForFunction(() => {
    const spin = document.querySelector("#spin");
    const save = JSON.parse(localStorage.getItem("fruit-salon:v1"));
    const payout = document.querySelector("#payout");
    const net = document.querySelector("#net");
    return (
      spin?.dataset.state === "idle" &&
      (!save?.lastSpin ||
        (payout.textContent === save.lastSpin.outcome.payout.toLocaleString("en-GB") &&
          (!net ||
            Number(net.textContent.replaceAll(",", "")) === save.lastSpin.outcome.payout - save.lastSpin.totalStake)))
    );
  });
const save = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("fruit-salon:v1")));
try {
  for (const [width, height] of [
    [1280, 800],
    [1366, 768],
    [1600, 900],
    [1920, 1080],
  ]) {
    const context = await browser.newContext({ viewport: { width, height }, offline: true });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (/^https?:/.test(r.url())) network.push(r.url());
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
      // A valid future accrual checkpoint isolates token accounting from passive income.
      if (!localStorage.getItem("fruit-salon:v1"))
        localStorage.setItem(
          "fruit-salon:v1",
          JSON.stringify({
            version: 1,
            balance: 1000,
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
    await ready(page);
    const capture = async (state) => {
      const layout = await page.evaluate(() =>
        [
          ...document.querySelectorAll(
            ".machine-name,#back,#spin,.balance-block,.returned-block,.bet-block,#spin-status",
          ),
        ].map((element) => {
          const r = element.getBoundingClientRect();
          const stage = document.querySelector("#stage").getBoundingClientRect();
          return {
            id: element.id || element.className,
            rect: r.toJSON(),
            // The pressed cap shifts 3px by transform, which counts as scrollable overflow of its group, never clipping.
            fits:
              element.scrollWidth <= element.clientWidth + 1 &&
              (element.closest(".slot-hud") || element.scrollHeight <= element.clientHeight + 1),
            inside:
              r.left >= stage.left && r.right <= stage.right + 1 && r.top >= stage.top && r.bottom <= stage.bottom + 1,
          };
        }),
      );
      for (const element of layout) assert(element.fits && element.inside, `${width} ${state}: ${element.id} clipped`);
      await page.screenshot({ path: `${evidence}/after-${state}-${width}x${height}.png` });
      results.push({ width, height, state, layout });
    };
    await capture("idle");
    const fonts = await page.evaluate(() => [...document.fonts].map((f) => ({ family: f.family, status: f.status })));
    assert(fonts.every((f) => f.status === "loaded"));
    // Evaluate both display alternatives in the real cabinet at the reference size.
    if (width === 1600) {
      await page.locator(".machine-name").evaluate((e) => {
        e.style.fontFamily = "Georgia, serif";
      });
      await capture("type-georgia");
      await page.locator(".machine-name").evaluate((e) => {
        e.style.fontFamily = "";
      });
      await capture("type-caslon");
    }
    await page.focus("#spin");
    await capture("focus");
    await page.hover("#spin");
    await capture("hover");
    const idle = await page.locator("#spin").boundingBox();
    await page.evaluate(() => {
      window.__stops = [3, 0, 0, 0, 0];
    });
    await page.mouse.down();
    // The cap and its label depress 3px by transform; the button's own box does not move.
    await page.waitForFunction(() => {
      const transform = getComputedStyle(document.querySelector("#spin .face")).transform;
      return transform !== "none" && Math.abs(new DOMMatrix(transform).m42 - 3) < 0.01;
    });
    const pressed = await page.locator("#spin").boundingBox();
    assert.deepEqual(pressed, idle, "the pressed button keeps its exact box");
    await capture("pressed");
    await page.mouse.up();
    await page.waitForTimeout(150);
    assert(await page.locator("#back").isDisabled());
    const settled = await save(page);
    assert.equal(settled.balance, 1010);
    await page.locator("#back").evaluate((e) => {
      for (let i = 0; i < 20; i++) e.click();
    });
    assert.equal((await save(page)).nextSpinId, 2);
    await capture("spinning");
    await ready(page);
    assert.equal(await page.locator("#balance").innerText(), "1,010");
    await capture("result");
    const announcement = await page.locator("#result-announcement").innerText();
    assert.match(
      announcement,
      /Stake 5 tokens\. Returned 15 tokens\. Net gain 10 tokens\. Balance 1,010 tokens\. Payout already credited\./,
    );
    // Rapid mixed inputs cannot place a bet after cash-out queues navigation.
    await page.locator("#back").evaluate((e) => {
      for (let i = 0; i < 20; i++) {
        e.click();
        document.querySelector("#spin").click();
      }
    });
    await page.locator("#enter-slot").waitFor();
    assert.equal((await save(page)).balance, settled.balance);
    assert.equal((await save(page)).nextSpinId, settled.nextSpinId);
    assert.equal(await page.locator("#salon-balance").innerText(), "1,010");
    await page.screenshot({ path: `${evidence}/after-cash-out-${width}x${height}.png` });
    await page.reload();
    await page.click("#enter-slot");
    await ready(page);
    assert.equal((await save(page)).balance, settled.balance);
    assert.equal(await page.locator("#result-announcement").innerText(), "");
    assert.match(await page.locator("#result-summary").innerText(), /Returned 15 tokens/);
    // Loss, partial return, break-even, and a win all conserve tokens.
    for (const [stops, payout] of [
      [[1, 0, 0, 0, 0], 0],
      [[2, 1, 0, 0, 0], 4],
      [[5, 1, 1, 0, 0], 5],
      [[9, 9, 9, 9, 0], 108],
    ]) {
      const before = await save(page);
      await page.evaluate((s) => {
        window.__stops = s;
      }, stops);
      await page.click("#spin");
      const after = await save(page);
      assert.equal(after.balance, before.balance - 5 + payout);
      assert.equal(after.nextSpinId, before.nextSpinId + 1);
      await page.waitForFunction(() => !document.querySelector("#back").disabled);
      // Cash out directly during celebration, without another spin or waiting for count-up.
      if (payout === 108) {
        await capture("celebrating");
        await page.focus("#back");
        await page.keyboard.down("Enter");
        await page.keyboard.down("Enter");
        await page.keyboard.up("Enter");
        await page.locator("#enter-slot").waitFor();
        assert.equal((await save(page)).balance, after.balance);
        assert.equal((await save(page)).nextSpinId, after.nextSpinId);
        await page.waitForTimeout(500);
        await page.click("#enter-slot");
      }
      await ready(page);
    }
    // Reload during moving reels: the complete outcome is already safely saved.
    await page.evaluate(() => {
      window.__stops = [3, 0, 0, 0, 0];
    });
    await page.click("#spin");
    const during = await save(page);
    await page.reload();
    await page.click("#enter-slot");
    await ready(page);
    assert.deepEqual(await save(page), during);
    await context.close();
  }
  for (const preference of ["normal", "os", "setting"]) {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 768 },
      offline: true,
      reducedMotion: preference === "os" ? "reduce" : "no-preference",
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      const random = crypto.getRandomValues.bind(crypto);
      window.__stops = [];
      crypto.getRandomValues = (a) => {
        if (window.__stops.length && a instanceof Uint32Array) {
          a[0] = window.__stops.shift();
          return a;
        }
        return random(a);
      };
    });
    await page.goto(`file://${resolve("dist/index.html")}`);
    if (preference === "setting") {
      await page.click("[data-action=settings]");
      await page.check("#motion");
      await page.click(".close");
    }
    await page.click("#enter-slot");
    await ready(page);
    await page.evaluate(() => {
      window.__changes = { balance: [], payout: [], net: [], announcement: [] };
      for (const [key, selector] of Object.entries({
        balance: "#balance",
        payout: "#payout",
        net: "#net",
        announcement: "#result-announcement",
      })) {
        new MutationObserver(() => window.__changes[key].push(document.querySelector(selector).textContent)).observe(
          document.querySelector(selector),
          { childList: true, characterData: true, subtree: true },
        );
      }
      window.__stops = [3, 0, 0, 0, 0];
    });
    await page.click("#spin");
    await ready(page);
    const changes = await page.evaluate(() => window.__changes);
    if (preference === "normal") {
      assert(changes.balance.some((v) => v !== "1,000" && v !== "1,010"));
      assert(changes.payout.some((v) => v !== "0" && v !== "15"));
      assert(
        changes.net.every((v) => !v || v === "+10"),
        "net is final the moment it appears",
      );
    } else {
      assert(changes.balance.every((v) => v === "1,000" || v === "995" || v === "1,010"));
      assert(changes.payout.every((v) => v === "—" || v === "0" || v === "15"));
      assert(changes.net.every((v) => !v || v === "+10"));
    }
    assert.equal(changes.announcement.filter(Boolean).length, 1);
    results.push({ preference, changes });
    await page.screenshot({ path: `${evidence}/after-reduced-${preference}-1366x768.png` });
    await context.close();
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(network, []);
  await writeFile(`${evidence}/checks.json`, JSON.stringify({ results, errors, network }, null, 2));
  console.log(
    "PASS: 4 resolutions; tactile states; direct/rapid/keyboard cash-out; exact-once accounting; loss/partial/break-even/win; navigation and mid-spin reload; both reduced-motion preferences; one final accessible outcome; embedded fonts offline.",
  );
} finally {
  await browser.close();
}
