import type { SaveV1 } from "../../src/game/model";
import { expect } from "@playwright/test";
import { test } from "./fixtures";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
test("cabinet geometry and rendering", async ({ browser }) => {
  const label = "after";
  const artifact = "dist/index.html";
  const evidence = "docs/evidence/phase2";
  await mkdir(evidence, { recursive: true });
  const layouts: unknown[] = [],
    errors: string[] = [],
    network: string[] = [];

  for (const [width, height] of [
    [1280, 800],
    [1366, 768],
    [1600, 900],
    [1920, 1080],
  ] as const) {
    const context = await browser.newContext({ viewport: { width, height }, offline: true });
    const page = await context.newPage();
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
    await page.goto(`file://${resolve(artifact)}`);
    await page.locator("#enter-slot").waitFor();
    await page.screenshot({ path: `${evidence}/${label}-lounge-${width}x${height}.png` });
    await page.click("#enter-slot");
    await page.locator("#spin").waitFor();
    const capture = async (state: string) => {
      const layout = await page.evaluate(() => {
        const stage = document.querySelector<HTMLElement>("#stage")!.getBoundingClientRect();
        const scale = document.querySelector<HTMLElement>("#ui")!.getBoundingClientRect().width / 1600;
        const elements = [
          ...document.querySelectorAll<HTMLElement>(
            ".slot-hud,.balance-block,.returned-block,.bet-block,#spin,#spin-status,#balance,#payout,#stake,#per-line,#line-count,#back",
          ),
        ];
        return elements.map((element) => {
          const r = element.getBoundingClientRect();
          return {
            element: element.id || [...element.classList].pop(),
            text: element.textContent!,
            font: parseFloat(getComputedStyle(element).fontSize) * scale,
            rect: r.toJSON(),
            inside:
              r.left >= stage.left - 1 &&
              r.right <= stage.right + 1 &&
              r.top >= stage.top - 1 &&
              r.bottom <= stage.bottom + 1,
            // Large numerals overflow their line box vertically by design (glyph ascent/descent); width must always fit.
            fits:
              element.scrollWidth <= element.clientWidth + 1 &&
              (element.tagName === "STRONG" || element.scrollHeight <= element.clientHeight + 1),
          };
        });
      });
      for (const e of layout) {
        assert(e.inside && e.fits, `${label} ${width} ${state}: ${e.element} clipped`);
      }
      const byName = (name: string) => layout.find((e) => e.element === name)?.rect;
      for (const [a, b] of [
        ["balance-block", "returned-block"],
        ["returned-block", "bet-block"],
        ["balance-block", "bet-block"],
      ] as const) {
        const x = byName(a),
          y = byName(b);
        assert(
          Math.min(x.right, y.right) - Math.max(x.left, y.left) <= 1 ||
            Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) <= 1,
          `${state}: ${a} overlaps ${b}`,
        );
      }
      layouts.push({ state, width, height, layout });
      await page.screenshot({ path: `${evidence}/${label}-${state}-${width}x${height}.png` });
    };
    await capture("idle");
    for (const [state, stops, payout] of [
      ["loss", [1, 0, 0, 0, 0], 0],
      ["partial", [2, 1, 0, 0, 0], 4],
      ["break-even", [5, 1, 1, 0, 0], 5],
      ["win", [3, 0, 0, 0, 0], 15],
      ["jackpot", [9, 9, 9, 9, 0], 108],
      ["long-result", [9, 10, 10, 10, 9], 13055],
    ] as const) {
      if (state === "long-result") {
        await page.selectOption("#line-count", "40");
        await page.selectOption("#per-line", "5");
      }
      await page.evaluate((values: readonly number[]) => {
        window.__stops = [...values];
      }, stops);
      await page.click("#spin");
      expect(await page.locator("#spin").getAttribute("data-state")).toBe("spinning");
      expect(await page.locator("#spin").innerText()).toBe("SKIP");
      assert(await page.locator("#line-count").isDisabled());
      assert(await page.locator("#per-line").isDisabled());
      assert(await page.locator("#back").isDisabled());
      await page.waitForTimeout(400);
      if (state === "loss") await capture("spinning-disabled");
      await page.waitForFunction(() => !document.querySelector<HTMLButtonElement>("#back")!.disabled);
      if (state === "jackpot") await capture("celebrating");
      await page.waitForFunction(
        () =>
          document.querySelector<HTMLButtonElement>("#spin")!.textContent! === "SPIN" &&
          document.querySelector<HTMLButtonElement>("#spin")!.dataset.state === "idle" &&
          document.querySelector<HTMLElement>("#payout")!.textContent! ===
            (JSON.parse(localStorage.getItem("fruit-salon:v1")!) as SaveV1).lastSpin!.outcome.payout.toLocaleString(
              "en-GB",
            ),
      );
      expect(await page.locator("#payout").innerText()).toBe(payout.toLocaleString("en-GB"));
      expect(await page.locator("#spin").isDisabled()).toBe(false);
      await capture(state);
    }
    await page.focus("#spin");
    await capture("keyboard-focus");
    await context.close();
  }
  expect(errors).toEqual([]);
  expect(network).toEqual([]);
  await writeFile(
    `${evidence}/${label}-checks.json`,
    JSON.stringify(
      {
        artifact,
        layouts,
        errors,
        network,
        timing:
          "Real clock: spinning capture requested 400ms after click; screenshot timing varies with software rendering. Performance measured separately.",
      },
      null,
      2,
    ),
  );
  console.log(
    `PASS ${label}: ${layouts.length} state/size captures; deterministic outcomes, disabled controls, focus, bounds and overlap; no network/errors.`,
  );
});
