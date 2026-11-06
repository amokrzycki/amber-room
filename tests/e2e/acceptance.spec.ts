import type { SaveV1 } from "../../src/game/model";
import { expect } from "@playwright/test";
import { test } from "./fixtures";
import assert from "node:assert/strict";
import { resolve } from "node:path";
test("offline game acceptance", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    offline: true,
    recordVideo: { dir: "docs/evidence/video", size: { width: 1600, height: 900 } },
  });
  const page = await context.newPage();
  const errors: string[] = [],
    network: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (/^https?:/.test(r.url())) network.push(r.url());
  });
  await page.addInitScript(() => {
    const rng = crypto.getRandomValues.bind(crypto);
    window.__stops = [];
    crypto.getRandomValues = (array) => {
      if (window.__stops.length && array instanceof Uint32Array) {
        array[0] = window.__stops.shift()!;
        return array;
      }
      return rng(array);
    };
    window.__audio = { contexts: 0, active: 0, started: 0 };
    const Context = window.AudioContext;
    window.AudioContext = class extends Context {
      constructor(...args: ConstructorParameters<typeof AudioContext>) {
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
        source.start = (...a: Parameters<AudioBufferSourceNode["start"]>) => {
          window.__audio.active++;
          window.__audio.started!++;
          source.addEventListener("ended", () => window.__audio.active--, { once: true });
          return start(...a);
        };
        return source;
      }
    };
  });
  const readSave = () => page.evaluate(() => JSON.parse(localStorage.getItem("fruit-salon:v1")!) as SaveV1);
  const force = (stops: readonly number[]) =>
    page.evaluate((s) => {
      window.__stops = [...s];
    }, stops);
  const ready = () =>
    page.waitForFunction(() => {
      const spin = document.querySelector<HTMLButtonElement>("#spin")!;
      const saved = JSON.parse(localStorage.getItem("fruit-salon:v1")!) as SaveV1;
      const net = document.querySelector<HTMLElement>("#net")!;
      return (
        spin?.dataset.state === "idle" &&
        (!saved?.lastSpin ||
          (document.querySelector<HTMLElement>("#payout")!.textContent! ===
            saved.lastSpin!.outcome.payout.toLocaleString("en-GB") &&
            (!net ||
              Number(net.textContent!.replaceAll(",", "")) ===
                saved.lastSpin!.outcome.payout - saved.lastSpin!.totalStake)))
      );
    });
  try {
    await page.goto(`file://${resolve("dist/index.html")}`);
    await page.locator("#enter-slot").waitFor();
    await page.screenshot({ path: "docs/evidence/salon.png" });
    await page.mouse.click(745, 405);
    await page.locator("#spin").waitFor({ timeout: 2000 });
    for (const key of ["Space", "Enter"] as const) {
      await page.focus("[data-action=settings]");
      await page.keyboard.press(key);
      expect(await page.locator("dialog").evaluate((d) => (d as HTMLDialogElement).open)).toBe(true);
      await page.click(".close");
    }
    for (const size of [
      { width: 1280, height: 720 },
      { width: 1600, height: 900 },
      { width: 1920, height: 1080 },
    ] as const) {
      await page.setViewportSize(size);
      await page.waitForFunction(
        () =>
          Math.abs(
            document.querySelector<HTMLElement>("#ui")!.getBoundingClientRect().width -
              document.querySelector<HTMLElement>("#stage")!.clientWidth,
          ) < 2,
      );
      const bounds = await page.locator("#spin").boundingBox();
      assert(bounds);
      assert(bounds);
      assert(
        bounds.x >= 0 &&
          bounds.y >= 0 &&
          bounds.x + bounds.width <= size.width + 1 &&
          bounds.y + bounds.height <= size.height + 1,
      );
      await page.click("[data-action=settings]");
      const dialog = await page.locator("dialog").boundingBox();
      assert(dialog);
      assert(
        dialog.x >= 0 &&
          dialog.y >= 0 &&
          dialog.x + dialog.width <= size.width + 1 &&
          dialog.y + dialog.height <= size.height + 1,
      );
      await page.click(".close");
    }
    await page.setViewportSize({ width: 1600, height: 900 });
    for (const n of [1, 5, 10, 20, 40] as const) {
      await page.selectOption("#line-count", String(n));
      await page.selectOption("#per-line", "2");
      expect(await page.locator("#stake").innerText()).toBe(String(n * 2));
      await page.click("[data-action=table]");
      expect(await page.locator(".line.active").count()).toBe(n);
      expect(await page.locator(".line").count()).toBe(40);
      await page.click(".close");
    }
    await page.selectOption("#line-count", "5");
    await page.selectOption("#per-line", "1");
    await page.screenshot({ path: "docs/evidence/slot.png" });
    const cases: [string, number[], number][] = [
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
      expect(settled.balance).toBe(before.balance - 5 + payout);
      expect(settled.nextSpinId).toBe(before.nextSpinId + 1);
      expect(settled.lastSpin!.outcome.payout).toBe(payout);
      expect(await page.locator("#back").isDisabled()).toBe(true);
      expect(await page.locator("#line-count").isDisabled()).toBe(true);
      await page.waitForFunction(() => !document.querySelector<HTMLButtonElement>("#back")!.disabled); // reels have stopped
      if (tier !== "neutral" && tier !== "return") {
        // Reels have settled: the one button reads SPIN again; the celebration ends without another wager.
        expect(await page.locator("#spin").innerText()).toBe("SPIN");
        await page.screenshot({ path: `docs/evidence/win-${tier}.png` });
        await page.keyboard.press("Escape");
        expect((await readSave()).nextSpinId, "Escape must not place another bet").toBe(settled.nextSpinId);
        await ready();
        await page.waitForTimeout(400); // A distinct activation must follow the celebration-dismiss re-arm window.
        await page.waitForFunction(() => window.__audio.active === 0, undefined, { timeout: 2000 });
        expect((await readSave()).nextSpinId).toBe(settled.nextSpinId);
        expect((await readSave()).balance).toBe(settled.balance);
      } else await ready();
      expect(await page.locator("#payout").innerText()).toBe(payout.toLocaleString("en-GB"));
    }
    for (let i = 0; i < 4; i++) {
      await page.click("#back");
      await page.locator("#enter-slot").waitFor();
      await page.click("#enter-slot");
      await page.locator("#spin").waitFor();
    }
    await force([9, 9, 9, 9, 0]);
    await page.click("#spin");
    await page.waitForFunction(() => document.querySelector<HTMLButtonElement>("#spin")!.dataset.state === "settled");
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
    expect((await readSave()).settings).toEqual(saved.settings);
    expect((await readSave()).balance).toBe(saved.balance);
    await page.click("#enter-slot");
    await page.locator("#spin").waitFor();
    await page.waitForFunction(() => window.__masterMute.gain.value === 0, undefined, { timeout: 2000 });
    expect(errors).toEqual([]);
    expect(network).toEqual([]);
    console.log(
      "PASS: offline file, 3 resolutions, 5 line settings, 4 forced classes, save-before-motion, skip/space/held-enter, repeated scenes, settings reload.",
    );
    console.log("Audio output/headphone listening and user-device FPS: NOT VERIFIED.");
  } finally {
    console.log("errors", errors);
    await context.close();
  }
});
