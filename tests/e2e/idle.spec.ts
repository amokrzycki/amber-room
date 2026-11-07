import type { SaveV1 } from "../../src/game/model";
import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { resolve } from "node:path";
test("hidden tab income is credited once", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, offline: true });
  const page = await context.newPage();
  await page.goto(`file://${resolve("dist/index.html")}`);
  await page.locator("#enter-slot").waitFor();
  const result = await page.evaluate(() => {
    const before = JSON.parse(localStorage.getItem("fruit-salon:v1")!) as SaveV1;
    let now = before.lastAccrualAtMs;
    Date.now = () => now;
    let hidden = true;
    Object.defineProperty(document, "hidden", { get: () => hidden, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    now += 24 * 3600000;
    window.dispatchEvent(new Event("pagehide"));
    const whileHidden = JSON.parse(localStorage.getItem("fruit-salon:v1")!) as SaveV1;
    hidden = false;
    document.dispatchEvent(new Event("visibilitychange"));
    const returned = JSON.parse(localStorage.getItem("fruit-salon:v1")!) as SaveV1;
    return { before, whileHidden, returned };
  });
  expect(
    result.whileHidden.lastAccrualAtMs,
    "Closing a hidden tab must not split one absence into multiple paid breaks",
  ).toBe(result.before.lastAccrualAtMs);
  expect(result.returned.balance).toBe(result.before.balance + 512);
  expect(result.returned.lastAccrualAtMs).toBe(result.before.lastAccrualAtMs + 24 * 3600000);
  console.log("PASS: hidden close does not checkpoint another break; 24h absence settles exactly 8h once.");
  await context.close();
});
