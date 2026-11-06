import type { SaveV1 } from "../../src/game/model";
import { expect } from "@playwright/test";
import { test } from "./fixtures";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
test("outcome copy and accessible announcements", async ({ browser }) => {
  const evidence = "docs/evidence/phase1";
  await mkdir(evidence, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, offline: true });
  const page = await context.newPage();
  const errors: string[] = [],
    network: string[] = [],
    layouts: unknown[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (/^https?:/.test(request.url())) network.push(request.url());
  });
  await page.addInitScript(() => {
    const random = crypto.getRandomValues.bind(crypto);
    window.__stops = [];
    crypto.getRandomValues = (array) => {
      if (window.__stops.length && array instanceof Uint32Array) {
        array[0] = window.__stops.shift()!;
        return array;
      }
      return random(array);
    };
  });
  const save = () => page.evaluate(() => JSON.parse(localStorage.getItem("fruit-salon:v1")!) as SaveV1);
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
  const number = (value: number) => value.toLocaleString("en-GB");
  const checkLayout = async (screen: string) => {
    const result = await page.evaluate(() => {
      const stage = document.querySelector<HTMLElement>("#stage")!.getBoundingClientRect();
      const scale = document.querySelector<HTMLElement>("#ui")!.getBoundingClientRect().width / 1600;
      const elements = [
        ...document.querySelectorAll<HTMLElement>(
          ".topbar button,.salon-wallet,.purchase button,.purchase p,.purchase small,#round,#round-purpose,#salon-message,.balance-block,.returned-block,.bet-block,#spin,#spin-status,#back",
        ),
      ].filter((element) => element.textContent!.trim());
      const rects = elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          element: element.id || element.className || element.textContent!.trim(),
          text: element.textContent!.trim(),
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
      const overlaps: unknown[] = [];
      for (const [a, b] of [
        [".balance-block", ".returned-block"],
        [".returned-block", ".bet-block"],
        ["#round-purpose", "#salon-message"],
      ] as const) {
        const first = document.querySelector<HTMLElement>(a)!,
          second = document.querySelector<HTMLElement>(b)!;
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
    expect(result.overlaps, `${screen} ${result.viewport}: overlapping controls`).toEqual([]);
    layouts.push({ screen, ...result });
  };
  let completed = 0;
  const spinOnce = async (stops: readonly number[], skip = false) => {
    const before = await save();
    await page.evaluate((values: readonly number[]) => {
      window.__stops = [...values];
    }, stops);
    await page.click("#spin");
    const settled = await save();
    expect(settled.nextSpinId).toBe(before.nextSpinId + 1);
    expect(settled.balance).toBe(before.balance - settled.lastSpin!.totalStake + settled.lastSpin!.outcome.payout);
    expect(await page.locator("#back").isDisabled()).toBe(true);
    expect(await page.locator("#line-count").isDisabled()).toBe(true);
    expect(await page.evaluate(() => window.__resultUpdates.length)).toBe(completed);
    await page.waitForFunction(() => !document.querySelector<HTMLButtonElement>("#back")!.disabled);
    if (skip && (await page.locator("#spin").getAttribute("data-state")) === "settled") {
      await page.waitForFunction(
        () => Number(document.querySelector<HTMLElement>("#payout")!.textContent!.replaceAll(",", "")) > 0,
      );
      expect(
        await page.evaluate(() => window.__resultUpdates.length),
        "Counting frames must announce the final authoritative outcome once",
      ).toBe(completed + 1);
      // Escape ends the celebration without a wager; focus stays on the one SPIN/SKIP button.
      await page.keyboard.press("Escape");
      expect(await page.evaluate(() => document.activeElement?.id)).toBe("spin");
      // Dismissing a celebration blocks another wager for 350ms.
      await page.waitForTimeout(400);
    }
    await ready();
    completed++;
    await page.waitForFunction((count) => window.__resultUpdates.length === count, completed);
    const { totalStake, outcome, id } = settled.lastSpin!;
    const net = outcome.payout - totalStake;
    expect(await page.locator("#payout").innerText()).toBe(number(outcome.payout));
    expect(await page.locator("#spin-status").getAttribute("title")).toBe(
      `Stake ${number(totalStake)} · Returned ${number(outcome.payout)} · Net ${net > 0 ? "+" : ""}${number(net)}`,
    );
    expect(await page.locator("#net").innerText()).toBe(`${net > 0 ? "+" : ""}${number(net)}`);
    const announcement = await page.locator("#result-announcement").innerText();
    expect(announcement).toBe(
      `Spin ${id} complete. Stake ${number(totalStake)} tokens. Returned ${number(outcome.payout)} tokens. ${net === 0 ? "Break-even." : `Net ${net > 0 ? "gain" : "loss"} ${number(Math.abs(net))} tokens.`} Balance ${number(settled.balance)} tokens. Payout already credited.`,
    );
    expect((await save()).nextSpinId, "Skip/held Space must not place another bet").toBe(settled.nextSpinId);
    return settled;
  };
  try {
    await page.goto(`file://${resolve("dist/index.html")}`);
    await page.locator("#enter-slot").waitFor();
    expect(await page.locator("#round-purpose").innerText()).toMatch(/Celebration only.*no bonus or income/);
    expect(await page.locator("#round").getAttribute("aria-describedby")).toBe("round-purpose");
    expect(await page.locator("#round").innerText()).toMatch(/50 tokens/);
    expect(await page.locator("#benefit-decor").innerText()).toMatch(/Cosmetic only; no income/);
    expect(await page.locator("#benefit-bar").innerText()).toMatch(/\+12 tokens/);
    expect(await page.locator("#benefit-machine").innerText()).toMatch(/\+20 tokens/);
    await page.click("#enter-slot");
    await page.locator("#spin").waitFor();
    expect(await page.locator("#spin-status").innerText()).toBe("Choose a bet · SPACE to spin");
    expect(await page.locator("#payout").innerText()).toBe("—");
    expect(await page.locator("#result-announcement").innerText()).toBe("");
    expect(await page.locator("#result-announcement").getAttribute("aria-live")).toBe("polite");
    expect(await page.locator("#result-announcement").getAttribute("aria-atomic")).toBe("true");
    expect(await page.locator("#payout").getAttribute("aria-live")).toBe(null);
    for (const [width, height] of [
      [1280, 800],
      [1366, 768],
      [1600, 900],
    ] as const) {
      await page.setViewportSize({ width, height });
      await page.waitForFunction(
        () =>
          Math.abs(
            document.querySelector<HTMLElement>("#ui")!.getBoundingClientRect().width -
              document.querySelector<HTMLElement>("#stage")!.clientWidth,
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
        window.__resultUpdates.push(document.querySelector<HTMLElement>("#result-announcement")!.textContent!),
      ).observe(document.querySelector<HTMLElement>("#result-announcement")!, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    });
    for (const [name, stops, returned, skip] of [
      ["loss", [1, 0, 0, 0, 0], 0, false],
      ["loss-repeat", [1, 0, 0, 0, 0], 0, false],
      ["partial-return", [2, 1, 0, 0, 0], 4, false],
      ["break-even", [5, 1, 1, 0, 0], 5, false],
      ["win", [3, 0, 0, 0, 0], 15, false],
      ["big-skip", [0, 0, 0, 0, 0], 70, true],
      ["jackpot-skip", [9, 9, 9, 9, 0], 108, true],
    ] as const) {
      const result = await spinOnce(stops, skip);
      expect(result.lastSpin!.outcome.payout).toBe(returned);
      await checkLayout(name);
      await page.screenshot({ path: `${evidence}/after-${name}-1280x800.png` });
    }
    for (const lineCount of [1, 5, 10, 20, 40] as const)
      for (const perLine of [1, 2, 5] as const) {
        const previous = await page.locator("#spin-status").getAttribute("title");
        await page.selectOption("#line-count", String(lineCount));
        await page.selectOption("#per-line", String(perLine));
        expect(await page.locator("#stake").innerText()).toBe(String(lineCount * perLine));
        expect(await page.locator("#spin-status").getAttribute("title")).toBe(previous);
        await spinOnce([1, 0, 0, 0, 0], true);
      }
    const last = await save(),
      breakdown = await page.locator("#spin-status").getAttribute("title");
    await page.selectOption("#line-count", "1");
    await page.selectOption("#per-line", "1");
    await page.reload();
    await page.locator("#enter-slot").waitFor();
    await page.click("#enter-slot");
    await page.locator("#spin").waitFor();
    expect(await page.locator("#spin-status").getAttribute("title")).toBe(breakdown);
    expect(await page.locator("#result-announcement").innerText(), "Reload must not announce an old spin as new").toBe(
      "",
    );
    expect((await save()).lastSpin!).toEqual(last.lastSpin!);
    expect((await save()).version).toBe(1);
    expect(await page.locator("#stake").innerText()).toBe("1");
    await page.click("#back");
    await page.locator("#round").waitFor();
    const beforeRound = await save();
    await page.click("#round");
    const afterRound = await save();
    expect(afterRound.balance).toBe(beforeRound.balance - 50);
    expect(afterRound.businesses).toEqual(beforeRound.businesses);
    await checkLayout("lounge-after-round");
    expect(errors).toEqual([]);
    expect(network).toEqual([]);
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
  }
});
