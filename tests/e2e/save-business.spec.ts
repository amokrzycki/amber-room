import type { SaveV1 } from "../../src/game/model";
import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
test("save recovery and business purchases", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, offline: true });
  const page = await context.newPage();
  const errors: string[] = [],
    network: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (/^https?:/.test(r.url())) network.push(r.url());
  });
  const open = async () => {
    await page.goto(`file://${resolve("dist/index.html")}`);
    await page.locator("#enter-slot").waitFor();
  };
  const save = () => page.evaluate(() => JSON.parse(localStorage.getItem("fruit-salon:v1")!) as SaveV1);
  const input = async (data: unknown) => {
    await page.click("[data-action=settings]");
    await page.setInputFiles("#import", {
      name: "backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(typeof data === "string" ? data : JSON.stringify(data)),
    });
  };
  try {
    await open();
    const imported = {
      version: 1,
      balance: 20000,
      businesses: { barLevel: 0, extraMachines: 0, decorLevel: 0 },
      lastAccrualAtMs: Date.now() - 24 * 3600000,
      remainderUnits: 0,
      nextSpinId: 1,
      lastSpin: null,
      selectedBet: { lineCount: 5, perLine: 1 },
      settings: { muted: false, reducedMotion: false, effectsIntensity: 0.4 },
    };
    await input(imported);
    await page.waitForFunction(() => !document.querySelector<HTMLDialogElement>("dialog")!.open);
    await page.waitForFunction(() => (JSON.parse(localStorage.getItem("fruit-salon:v1")!) as SaveV1).balance >= 20512);
    const accrued = await save();
    expect(accrued.balance).toBe(20512);
    expect(accrued.businesses.barLevel).toBe(0);
    if (!process.env.CI) await page.screenshot({ path: "docs/evidence/salon-before.png" });
    for (const item of ["bar", "machine", "decor"] as const)
      for (let i = 1; i <= 3; i++) {
        await page.click(`#buy-${item}`);
        await page.waitForFunction(
          ([key, n]) => (JSON.parse(localStorage.getItem("fruit-salon:v1")!) as SaveV1).businesses[key] === n,
          [({ bar: "barLevel", machine: "extraMachines", decor: "decorLevel" } as const)[item], i] as const,
        );
        expect(await page.locator(`#level-${item}`).innerText()).toBe(`${i} / 3`);
      }
    const maxed = await save();
    expect(maxed.balance).toBe(20512 - 11750);
    expect(maxed.businesses).toEqual({ barLevel: 3, extraMachines: 3, decorLevel: 3 });
    expect(await page.locator("#income").innerText()).toMatch(/160 tokens/);
    for (const item of ["bar", "machine", "decor"] as const)
      expect(await page.locator(`#buy-${item}`).isDisabled()).toBe(true);
    await page.click("#round");
    expect((await save()).balance).toBe(maxed.balance - 50);
    if (!process.env.CI) await page.screenshot({ path: "docs/evidence/salon-max.png" });
    await page.click("[data-action=settings]");
    const download = page.waitForEvent("download");
    await page.click("#export");
    const backup = await download;
    const exported = JSON.parse(await readFile(await backup.path(), "utf8"));
    expect(exported.businesses).toEqual(maxed.businesses);
    expect(exported.version).toBe(1);
    await page.click(".close");
    const before = await save();
    await input("{bad");
    await page.waitForFunction(() => document.querySelector<HTMLElement>("#import-status")!.textContent!.length > 0);
    expect((await save()).balance).toBe(before.balance);
    await page.click(".close");
    await page.reload();
    await page.locator("#enter-slot").waitFor();
    expect((await save()).businesses).toEqual(maxed.businesses);
    await page.addInitScript(() => localStorage.setItem("fruit-salon:v1", "{damaged-original"));
    await page.reload();
    await page.locator("#enter-slot").waitFor();
    expect(await page.locator(".save-warning").innerText()).toMatch(/Damaged save protected/);
    await page.click("#enter-slot");
    await page.click("#spin");
    await page.waitForTimeout(1900);
    expect(await page.evaluate(() => localStorage.getItem("fruit-salon:v1")!)).toBe("{damaged-original");
    await page.click("[data-action=settings]");
    expect(await page.locator("#original").count()).toBe(1);
    await page.click(".close");
    await page.waitForFunction(() => document.querySelector<HTMLButtonElement>("#spin")!.dataset.state === "idle");
    await page.click("#back");
    await page.locator("#enter-slot").waitFor();
    await input(exported);
    await page.waitForFunction(() => !document.querySelector<HTMLDialogElement>("dialog")!.open);
    expect((await save()).businesses).toEqual(maxed.businesses);
    const unavailable = await browser.newContext({ viewport: { width: 1280, height: 720 }, offline: true });
    await unavailable.addInitScript(() =>
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("denied");
        },
      }),
    );
    const denied = await unavailable.newPage();
    denied.on("pageerror", (e) => errors.push(e.message));
    await denied.goto(`file://${resolve("dist/index.html")}`);
    await denied.locator("#enter-slot").waitFor();
    expect(await denied.locator(".save-warning").innerText()).toMatch(/Storage is unavailable|Saving failed/);
    await denied.click("#enter-slot");
    await denied.click("#spin");
    await denied.waitForTimeout(1900);
    expect(await denied.locator(".save-warning").innerText()).toMatch(/Saving failed/);
    await unavailable.close();
    expect(errors).toEqual([]);
    expect(network).toEqual([]);
    console.log(
      "PASS: idle8h cap, all9 purchases visible and persistent, round50, export/import, invalid import atomic, damaged original protected through spin, recovery import, storage denied play-in-memory.",
    );
  } finally {
    console.log("errors", errors);
    await context.close();
  }
});
