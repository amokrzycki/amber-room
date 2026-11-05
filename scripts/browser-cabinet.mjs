import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const [label = "after", artifact = "dist/index.html"] = process.argv.slice(2);
assert(["before", "after"].includes(label));
const evidence = "docs/evidence/phase2";
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const layouts = [],
  errors = [],
  network = [];
try {
  for (const [width, height] of [
    [1280, 800],
    [1366, 768],
    [1600, 900],
    [1920, 1080],
  ]) {
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
          array[0] = window.__stops.shift();
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
    const capture = async (state) => {
      const layout = await page.evaluate(() => {
        const stage = document.querySelector("#stage").getBoundingClientRect();
        const scale = document.querySelector("#ui").getBoundingClientRect().width / 1600;
        const elements = [
          ...document.querySelectorAll(
            ".slot-hud,.balance-block,.payout-block,.bet-block,#spin,#spin-status,#spin-breakdown,#win-label,#per-line,#line-count,#back",
          ),
        ];
        return elements.map((element) => {
          const r = element.getBoundingClientRect();
          return {
            element: element.id || element.className,
            text: element.textContent,
            font: parseFloat(getComputedStyle(element).fontSize) * scale,
            rect: r.toJSON(),
            inside:
              r.left >= stage.left - 1 &&
              r.right <= stage.right + 1 &&
              r.top >= stage.top - 1 &&
              r.bottom <= stage.bottom + 1,
            fits: element.scrollWidth <= element.clientWidth + 1 && element.scrollHeight <= element.clientHeight + 1,
          };
        });
      });
      for (const e of layout) {
        assert(e.inside && e.fits, `${label} ${width} ${state}: ${e.element} clipped`);
      }
      const byName = (name) => layout.find((e) => e.element === name).rect;
      for (const [a, b] of [
        ["payout-block", "bet-block"],
        ["payout-block", "spin"],
        ["bet-block", "spin"],
        ["balance-block", "spin-status"],
      ]) {
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
    ]) {
      if (state === "long-result") {
        await page.selectOption("#line-count", "40");
        await page.selectOption("#per-line", "5");
      }
      await page.evaluate((values) => {
        window.__stops = [...values];
      }, stops);
      await page.click("#spin");
      assert(await page.locator("#spin").isDisabled());
      assert(await page.locator("#line-count").isDisabled());
      assert(await page.locator("#per-line").isDisabled());
      assert(await page.locator("#back").isDisabled());
      await page.waitForTimeout(400);
      if (state === "loss") await capture("spinning-disabled");
      await page.waitForFunction(() => !document.querySelector("#back").disabled);
      if (state === "jackpot") await capture("celebrating");
      await page.waitForFunction(
        () =>
          document.querySelector("#spin").textContent.includes("START") && !document.querySelector("#spin").disabled,
      );
      assert.equal(await page.locator("#payout").innerText(), payout.toLocaleString("en-GB"));
      assert.equal(await page.locator("#spin").isDisabled(), false);
      await capture(state);
    }
    await page.focus("#spin");
    await capture("keyboard-focus");
    await context.close();
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(network, []);
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
} finally {
  await browser.close();
}
