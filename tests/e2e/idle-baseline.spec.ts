import type { SaveV1 } from "../../src/game/model";
import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
test("delayed income delivery and reload", async ({ browser }) => {
  // Controlled browser accounting, invoking the actual installed 1s callback at simulated delivery times.
  // This characterizes delayed/throttled delivery; it does not claim a natural 48h background browser run.
  const results: Record<string, unknown>[] = [];

  for (const [name, hidden, gapHours, calls, expected] of [
    ["visible 48h, hourly delivery", false, 1, 48, 3072],
    ["visible 48h, 12-hour delayed delivery", false, 12, 4, 2048],
    ["visible 48h, single delayed delivery", false, 48, 1, 512],
    ["hidden 48h then visible", true, 1, 48, 512],
  ] as const) {
    const context = await browser.newContext({ offline: true });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__now = Number(sessionStorage.getItem("virtualNow")!) || 1000000;
      Date.now = () => window.__now;
      const interval = window.setInterval.bind(window);
      Object.defineProperty(window, "setInterval", {
        configurable: true,
        value: (fn: TimerHandler, ms?: number, ...args: unknown[]) => {
          if (ms === 1000 && typeof fn === "function") window.__incomeTick = () => fn(...args);
          return interval(fn, ms, ...args);
        },
      });
      window.__hidden = false;
      Object.defineProperty(document, "hidden", { get: () => window.__hidden });
    });
    await page.goto(`file://${resolve("dist/index.html")}`);
    await page.locator("#enter-slot").waitFor();
    const result = await page.evaluate(
      ({ hidden, gapHours, calls }) => {
        const read = () => JSON.parse(localStorage.getItem("fruit-salon:v1")!) as SaveV1;
        window.__now += 1000;
        window.__incomeTick();
        const before = read();
        window.__hidden = hidden;
        document.dispatchEvent(new Event("visibilitychange"));
        for (let i = 0; i < calls; i++) {
          window.__now += gapHours * 3600000;
          window.__incomeTick();
        }
        const intermediate = read();
        window.__hidden = false;
        document.dispatchEvent(new Event("visibilitychange"));
        const after = read();
        document.dispatchEvent(new Event("visibilitychange"));
        window.__incomeTick();
        const repeated = read();
        return { before, intermediate, after, repeated, now: window.__now };
      },
      { hidden, gapHours, calls },
    );
    expect(result.after.balance - result.before.balance, name).toBe(expected);
    expect(result.repeated.balance, "duplicate visibility/ticks cannot repay").toBe(result.after.balance);
    if (hidden) expect(result.intermediate.balance).toBe(result.before.balance);
    // A reload with the persisted accounting checkpoint must not repay the same interval.
    await page.evaluate((now) => sessionStorage.setItem("virtualNow", String(now)), result.now);
    await page.reload();
    await page.locator("#enter-slot").waitFor();
    const reloaded = await page.evaluate(() => JSON.parse(localStorage.getItem("fruit-salon:v1")!) as SaveV1);
    expect(reloaded.balance).toBe(result.after.balance);
    results.push({
      name,
      earned: expected,
      reloadEarned: reloaded.balance - result.after.balance,
      duplicateEarned: result.repeated.balance - result.after.balance,
    });
    await context.close();
  }

  mkdirSync("docs/evidence/phase40", { recursive: true });
  writeFileSync("docs/evidence/phase40/baseline-browser.json", JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
});
