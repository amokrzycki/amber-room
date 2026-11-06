import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { writeFileSync } from "node:fs";
test("isolated opening hours prototype", async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto("http://localhost:5173/prototypes/opening-hours.html");
  await page.locator("#reset").waitFor({ timeout: 3000 });
  await page.click("#reset");
  await page.selectOption("#mode", "brisk");
  await page.click("#attend");
  await page.click('[data-hours="48"]');
  expect(await page.locator("#balance").innerText()).toBe("1,384");
  await page.click('[data-hours="48"]');
  expect(await page.locator("#balance").innerText()).toBe("1,384");
  await page.reload();
  await page.click('[data-hours="48"]');
  expect(await page.locator("#balance").innerText()).toBe("1,384");
  await page.selectOption("#mode", "long");
  await page.click("#attend");
  await page.click('[data-hours="24"]');
  expect(await page.locator("#balance").innerText()).toBe("1,960");
  const production = await page.evaluate(() => localStorage.getItem("fruit-salon:v1")!);
  expect(production, "lab must never create the production key").toBe(null);
  const result = await page.evaluate(() => JSON.parse(localStorage.getItem("amber-room:prototype:opening-hours:v1")!));
  expect(result.creditedMs).toBe(12 * 3600000);
  const original = JSON.stringify(result.save);
  await page.evaluate((raw) => localStorage.setItem("fruit-salon:v1", raw), original);
  await page.click("#copy");
  expect(await page.evaluate(() => localStorage.getItem("fruit-salon:v1")!)).toBe(original);
  await page.click("#reset");
  expect(await page.evaluate(() => localStorage.getItem("fruit-salon:v1")!)).toBe(original);
  await page.screenshot({ path: "docs/evidence/phase40/accounting-lab.png" });
  writeFileSync(
    "docs/evidence/phase40/prototype-browser.json",
    JSON.stringify({ ok: true, result, productionKeyUntouched: true }, null, 2),
  );
  console.log("PASS: isolated lab, mode changes, persisted budget and reload accounting");
});
