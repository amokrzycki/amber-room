import { expect, type Page } from "@playwright/test";
import { test } from "./fixtures";
import { readFile } from "node:fs/promises";

const progressKey = "amber-room:prototype:living-lounge:v1";
const appearanceKey = "amber-room:prototype:living-lounge:appearance:v1";
const productionKey = "fruit-salon:v1";
const sentinel = '{"production":"byte-for-byte sentinel"}';
const task3Captures = ".superpowers/sdd/2026-11-07-living-lounge/task-3-captures";

async function startPlaytest(page: Page) {
  await captureScene(page);
  await page.addInitScript(
    ({ productionKey, sentinel, progressKey }) => {
      localStorage.setItem(productionKey, sentinel);
      // A future accrual marker holds the economy still without freezing Phaser's tween clock.
      if (localStorage.getItem(progressKey) === null)
        localStorage.setItem(
          progressKey,
          JSON.stringify({
            version: 1,
            balance: 20000,
            businesses: { barLevel: 0, extraMachines: 0, decorLevel: 0 },
            lastAccrualAtMs: 4102444800000,
            remainderUnits: 0,
            nextSpinId: 1,
            lastSpin: null,
            selectedBet: { lineCount: 5, perLine: 1 },
            settings: { muted: false, reducedMotion: false, effectsIntensity: 0.4 },
          }),
        );
    },
    { productionKey, sentinel, progressKey },
  );
  await page.goto("http://localhost:5173/prototypes/living-lounge.html");
  await page.locator("#enter-slot").waitFor();
}

async function roomState(page: Page) {
  return page.evaluate(() => {
    const scene = (window as unknown as { __loungeScene: import("phaser").Scene }).__loungeScene;
    const room = scene.children.getByName("living-lounge") as import("phaser").GameObjects.Container;
    const groups = room.list as import("phaser").GameObjects.Container[];
    return {
      rug: groups
        .flatMap((group) => group.list.map((child) => child.name))
        .find((name) => name.startsWith("lounge-rug-")),
      alpha: groups.map((group) => group.alpha),
      reveals: groups.filter((group) => scene.tweens.getTweensOf(group).length > 0).map((group) => group.name),
    };
  });
}

async function settled(page: Page) {
  await expect.poll(() => roomState(page)).toMatchObject({ alpha: [1, 1, 1], reveals: [] });
}

async function stored(page: Page) {
  return page.evaluate(
    ({ progressKey, appearanceKey, productionKey }) => ({
      progress: localStorage.getItem(progressKey),
      appearance: localStorage.getItem(appearanceKey),
      production: localStorage.getItem(productionKey),
    }),
    { progressKey, appearanceKey, productionKey },
  );
}

test("rug preview is free, reversible, keyboard usable, and persists only Apply", async ({ page }) => {
  await startPlaytest(page);
  await expect(page.getByRole("button", { name: "Style rug" })).toBeDisabled();
  await page.click("#buy-decor");
  await settled(page);
  await expect(page.locator("#salon-message")).toContainText("1/3");
  await expect(page.locator("#salon-message")).toContainText(/woven rug.*cosmetic only/i);
  const before = (await stored(page)).progress;
  await page.getByRole("button", { name: "Style rug" }).click();
  await expect(page.getByRole("button", { name: "Claret weave" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Moss weave" })).toBeFocused();
  await page.keyboard.press("Enter");
  expect((await roomState(page)).rug).toBe("lounge-rug-moss");
  expect((await stored(page)).appearance).toBeNull();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect((await roomState(page)).rug).toBe("lounge-rug-claret");
  await expect(page.getByRole("button", { name: "Style rug" })).toBeFocused();
  await page.getByRole("button", { name: "Style rug" }).click();
  await page.getByRole("button", { name: "Moss weave" }).click();
  await page.keyboard.press("Escape");
  expect((await roomState(page)).rug).toBe("lounge-rug-claret");
  await page.getByRole("button", { name: "Style rug" }).click();
  await page.getByRole("button", { name: "Moss weave" }).click();
  await page.reload();
  await page.locator("#enter-slot").waitFor();
  expect((await roomState(page)).rug).toBe("lounge-rug-claret");
  for (const [name, value] of [
    ["Moss weave", "moss"],
    ["Claret weave", "claret"],
    ["Moss weave", "moss"],
  ]) {
    await page.getByRole("button", { name: "Style rug" }).click();
    await page.getByRole("button", { name }).click();
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    expect(JSON.parse((await stored(page)).appearance!)).toEqual({ version: 1, rug: value });
    expect((await stored(page)).progress).toBe(before);
    await expect(page.locator("#salon-balance")).toHaveText("19,700");
    await expect(page.locator("#income")).toContainText("64 tokens / hour");
    for (const viewport of [
      { width: 1366, height: 768 },
      { width: 1280, height: 720 },
    ]) {
      await page.setViewportSize(viewport);
      await page.screenshot({ path: `${task3Captures}/confirmed-${value}-${viewport.width}x${viewport.height}.png` });
    }
    await page.setViewportSize({ width: 1600, height: 900 });
  }
  await page.getByRole("button", { name: "Style rug" }).click();
  await page.getByRole("button", { name: "Claret weave" }).click();
  await page.click("#enter-slot");
  await page.locator("#spin").waitFor();
  await page.getByRole("button", { name: "Back to lounge" }).click();
  await page.locator("#enter-slot").waitFor();
  expect((await roomState(page)).rug).toBe("lounge-rug-moss");
  await page.reload();
  await page.locator("#enter-slot").waitFor();
  expect((await roomState(page)).rug).toBe("lounge-rug-moss");
  expect((await stored(page)).production).toBe(sentinel);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.screenshot({ path: `${task3Captures}/confirmed-moss-after-navigation-reload-1280x720.png` });
});

test("all nine purchases retain exact economics, name rewards, and keep maximum benefits clear", async ({ page }) => {
  await startPlaytest(page);
  for (const [item, balances, rates, rewards, total] of [
    ["bar", [19500, 18500, 16500], [76, 88, 100], ["Stocked bar", "upholstered stools", "back-bar display"], 36],
    [
      "machine",
      [15750, 14250, 11250],
      [120, 140, 160],
      ["First additional cabinet", "Second additional cabinet", "Third additional cabinet"],
      60,
    ],
    [
      "decor",
      [10950, 10050, 8250],
      [160, 160, 160],
      ["Woven rug", "planted brass planters", "Engraved brass nameplate"],
      0,
    ],
  ] as const) {
    for (let level = 0; level < 3; level++) {
      await expect(page.locator(`#benefit-${item}`)).toContainText(rewards[level]);
      await page.click(`#buy-${item}`);
      await expect(page.locator("#salon-balance")).toHaveText(balances[level].toLocaleString("en-GB"));
      await expect(page.locator("#income")).toContainText(`${rates[level]} tokens / hour`);
      await expect(page.locator("#salon-message")).toContainText(`${level + 1}/3`);
      await expect(page.locator("#salon-message")).toContainText(rewards[level]);
      if (item === "decor") await expect(page.locator("#salon-message")).toContainText("cosmetic only; no income");
      else await expect(page.locator("#salon-message")).toContainText(`+${item === "bar" ? 12 : 20} tokens/hour`);
    }
    await expect(page.locator(`#buy-${item}`)).toBeDisabled();
    await expect(page.locator(`#benefit-${item}`)).toContainText(
      total ? `+${total} tokens/hour` : "cosmetic only; no income",
    );
  }
  const message = await page.locator("#salon-message").textContent();
  await page.evaluate(() => window.dispatchEvent(new Event("salon-state")));
  await expect(page.locator("#salon-message")).toHaveText(message!);
  await page.getByRole("button", { name: "Style rug" }).click();
  await page.getByRole("button", { name: "Moss weave" }).click();
  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
  ]) {
    await page.setViewportSize(viewport);
    for (const selector of [
      "#buy-bar",
      "#buy-machine",
      "#buy-decor",
      "#style-rug",
      "#rug-apply",
      "#rug-cancel",
      "#round",
      "#reset-playtest",
      "#round-purpose",
      "#salon-message",
    ]) {
      const button = page.locator(selector);
      await expect(button).toBeInViewport({ ratio: 0.9999 });
      const font = await button.evaluate(
        (node) =>
          (Number.parseFloat(getComputedStyle(node).fontSize) *
            document.querySelector("canvas")!.getBoundingClientRect().width) /
          1600,
      );
      expect(font).toBeGreaterThanOrEqual(selector === "#round-purpose" || selector === "#salon-message" ? 13.9 : 14.9);
    }
    await page.screenshot({ path: `${task3Captures}/max-preview-moss-${viewport.width}x${viewport.height}.png` });
  }
  await page.click("#rug-apply");
  expect((await stored(page)).production).toBe(sentinel);
});

test("settings exports label prototype progress, import stays isolated, and reset requires confirmation", async ({
  page,
}) => {
  await startPlaytest(page);
  await page.click("#buy-decor");
  await page.click("#style-rug");
  await page.getByRole("button", { name: "Moss weave" }).click();
  await page.click("#rug-apply");
  await page.click("#enter-slot");
  await page.click("#spin");
  await expect(page.locator("#spin")).toBeEnabled();
  await page.getByRole("button", { name: "Settings & save" }).click();
  await expect(page.locator(".dialog-body")).toContainText("rug appearance is not included");
  await page.locator("#motion").check();
  const downloadPromise = page.waitForEvent("download");
  await page.click("#export");
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("amber-room-living-lounge-prototype-progress.json");
  const raw = (await stored(page)).progress!;
  const save = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(save).toEqual(JSON.parse(raw));
  expect(save.version).toBe(1);
  expect(save).not.toHaveProperty("rug");
  expect(save.nextSpinId).toBe(2);
  await page
    .locator("#import")
    .setInputFiles({ name: "prototype.json", mimeType: "application/json", buffer: Buffer.from(raw) });
  await page.locator("#enter-slot").waitFor();
  expect((await stored(page)).production).toBe(sentinel);
  const before = await stored(page);
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.click("#reset-playtest");
  expect(await stored(page)).toEqual(before);
  page.once("dialog", (dialog) => dialog.accept());
  await page.click("#reset-playtest");
  await expect(page.locator("#salon-balance")).toHaveText("20,000");
  for (const item of ["bar", "machine", "decor"]) await expect(page.locator(`#level-${item}`)).toHaveText("0 / 3");
  expect(JSON.parse((await stored(page)).appearance!)).toEqual({ version: 1, rug: "claret" });
  await page.reload();
  await page.locator("#enter-slot").waitFor();
  await expect(page.locator("#salon-balance")).toHaveText("20,000");
  expect((await stored(page)).production).toBe(sentinel);
});

test("mixed next-reward copy, rug chooser, and status fit the lower-bound laptop", async ({ page }) => {
  await startPlaytest(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.click("#buy-decor");
  for (let level = 1; level <= 3; level++) {
    await page.click("#style-rug");
    await page.getByRole("button", { name: "Moss weave" }).click();
    for (const selector of ["#rug-apply", "#rug-cancel", "#round", "#round-purpose", "#salon-message"]) {
      await expect(page.locator(selector)).toBeInViewport({ ratio: 0.9999 });
    }
    await page.screenshot({ path: `${task3Captures}/mixed-decor-${level}-1280x720.png` });
    await page.click("#style-rug");
    expect((await roomState(page)).rug).toBe("lounge-rug-claret");
    if (level < 3) {
      await page.click("#buy-bar");
      await page.click("#buy-machine");
      await page.click("#buy-decor");
    }
  }
  await page.click("#style-rug");
  await page.getByRole("button", { name: "Moss weave" }).click();
  await page.getByRole("button", { name: "Settings & save" }).click();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  expect((await roomState(page)).rug).toBe("lounge-rug-claret");
  await expect(page.locator("#rug-chooser")).toBeHidden();
});

test("malformed originals stay untouched and appearance failures remain visible", async ({ page }) => {
  await page.addInitScript(
    ({ progressKey, appearanceKey }) => {
      localStorage.setItem(progressKey, "{damaged progress");
      localStorage.setItem(appearanceKey, "{damaged rug");
    },
    { progressKey, appearanceKey },
  );
  await startPlaytest(page);
  await expect(page.locator(".save-warning")).toContainText("Damaged save protected");
  await expect(page.locator(".save-warning")).toContainText("Invalid rug appearance");
  await page.click("#buy-decor");
  expect((await stored(page)).progress).toBe("{damaged progress");
  expect((await stored(page)).appearance).toBe("{damaged rug");
  await page.reload();
  await page.locator("#enter-slot").waitFor();
  await expect(page.locator(".save-warning")).toContainText("Invalid rug appearance");
  expect((await stored(page)).production).toBe(sentinel);
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page.locator(".save-warning")).toBeInViewport({ ratio: 0.9999 });
  await page.screenshot({ path: `${task3Captures}/protected-originals-warning-1280x720.png` });
});

test("denied appearance Apply keeps the last confirmed rug through cancel and reload", async ({ page }) => {
  await startPlaytest(page);
  await page.click("#buy-decor");
  await page.click("#style-rug");
  await page.getByRole("button", { name: "Moss weave" }).click();
  await page.click("#rug-apply");
  await page.evaluate((appearanceKey) => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === appearanceKey) throw new Error("quota");
      set.call(this, key, value);
    };
  }, appearanceKey);
  await page.click("#style-rug");
  await page.getByRole("button", { name: "Claret weave" }).click();
  await page.click("#rug-apply");
  await expect(page.locator(".save-warning")).toContainText("not saved");
  expect(JSON.parse((await stored(page)).appearance!)).toEqual({ version: 1, rug: "moss" });
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page.locator(".save-warning")).toBeInViewport({ ratio: 0.9999 });
  await page.screenshot({ path: `${task3Captures}/failed-apply-preview-claret-confirmed-moss-1280x720.png` });
  await page.click("#rug-cancel");
  expect((await roomState(page)).rug).toBe("lounge-rug-moss");
  await page.reload();
  await page.locator("#enter-slot").waitFor();
  expect((await roomState(page)).rug).toBe("lounge-rug-moss");
});

test("storage getter denial stays playable and warns instead of claiming a successful reset", async ({ page }) => {
  await captureScene(page);
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("denied");
      },
    }),
  );
  await page.goto("http://localhost:5173/prototypes/living-lounge.html");
  await page.locator("#enter-slot").waitFor();
  await expect(page.locator("#salon-balance")).toHaveText("20,000");
  await expect(page.locator(".save-warning")).toContainText("Rug storage is unavailable");
  await page.click("#buy-bar");
  await expect(page.locator("#salon-balance")).toHaveText("19,500");
  page.once("dialog", (dialog) => dialog.accept());
  await page.click("#reset-playtest");
  await expect(page.locator("#salon-message")).toContainText("Reset failed");
  await expect(page.locator("#salon-balance")).toHaveText("19,500");
});

test("second reset write failure warns about a partial reset and leaves the session unchanged", async ({ page }) => {
  await startPlaytest(page);
  await page.click("#buy-decor");
  await page.click("#style-rug");
  await page.getByRole("button", { name: "Moss weave" }).click();
  await page.click("#rug-apply");
  await page.evaluate((appearanceKey) => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === appearanceKey) throw new Error("quota");
      set.call(this, key, value);
    };
  }, appearanceKey);
  page.once("dialog", (dialog) => dialog.accept());
  await page.click("#reset-playtest");
  await expect(page.locator("#salon-message")).toContainText("Reset failed");
  await expect(page.locator("#salon-message")).toContainText("partial reset");
  await expect(page.locator("#salon-balance")).toHaveText("19,700");
  expect((await roomState(page)).rug).toBe("lounge-rug-moss");
  const partial = await stored(page);
  expect(JSON.parse(partial.progress!).businesses.decorLevel).toBe(1);
  expect(JSON.parse(partial.appearance!).rug).toBe("moss");
  await page.reload();
  await page.locator("#enter-slot").waitFor();
  await expect(page.locator("#salon-balance")).toHaveText("19,700");
  await expect(page.locator("#level-decor")).toHaveText("1 / 3");
  expect(JSON.parse((await stored(page)).appearance!).rug).toBe("moss");
  await expect(page.locator("#salon-message")).not.toContainText("Playtest reset");
  await page.click("#buy-decor");
  expect((await roomState(page)).rug).toBe("lounge-rug-moss");
  expect((await stored(page)).production).toBe(sentinel);
});

test("third reset write failure reconciles live wallet, room, and preview while retaining the warning", async ({
  page,
}) => {
  await startPlaytest(page);
  await page.click("#buy-decor");
  await page.click("#style-rug");
  await page.getByRole("button", { name: "Moss weave" }).click();
  await page.click("#rug-apply");
  await expect(page.locator("#salon-balance")).toHaveText("19,700");
  await expect(page.locator("#level-decor")).toHaveText("1 / 3");
  await page.click("#style-rug");
  await page.getByRole("button", { name: "Claret weave" }).click();
  await page.evaluate(
    ({ progressKey, appearanceKey }) => {
      const set = Storage.prototype.setItem;
      let writes = 0;
      Storage.prototype.setItem = function (key, value) {
        if ((key === progressKey || key === appearanceKey) && ++writes === 3) throw new Error("final reset quota");
        set.call(this, key, value);
      };
    },
    { progressKey, appearanceKey },
  );
  page.once("dialog", (dialog) => dialog.accept());
  const afterReset = await page.evaluate(() => {
    (document.querySelector("#reset-playtest") as HTMLButtonElement).click();
    // Snapshot before an income tick can hide stale labels or clear the write warning.
    return {
      balance: document.querySelector("#salon-balance")!.textContent,
      levels: ["bar", "machine", "decor"].map((item) => document.querySelector(`#level-${item}`)!.textContent),
      warning: document.querySelector(".save-warning")!.textContent,
      message: document.querySelector("#salon-message")!.textContent,
    };
  });
  expect(afterReset.message).toContain("Reset failed");
  expect(afterReset.balance).toBe("20,000");
  expect(afterReset.levels).toEqual(["0 / 3", "0 / 3", "0 / 3"]);
  expect((await roomState(page)).rug).toBeUndefined();
  await expect(page.locator("#rug-chooser")).toBeHidden();
  await expect(page.locator("#style-rug")).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#style-rug")).toBeDisabled();
  await expect(page.locator("#buy-decor")).toBeEnabled();
  expect(afterReset.warning).toContain("Saving failed");
  const persisted = await stored(page);
  expect(JSON.parse(persisted.progress!).balance).toBe(20000);
  expect(JSON.parse(persisted.progress!).businesses).toEqual({ barLevel: 0, extraMachines: 0, decorLevel: 0 });
  expect(JSON.parse(persisted.appearance!)).toEqual({ version: 1, rug: "claret" });
  expect(persisted.production).toBe(sentinel);
  await page.click("#buy-decor");
  expect((await roomState(page)).rug).toBe("lounge-rug-claret");
});

test("local reveals settle on rapid purchase, preview, OS preferences, hidden page, and shutdown", async ({ page }) => {
  await startPlaytest(page);
  const untouched = await page.evaluateHandle(() => {
    const scene = (window as unknown as { __loungeScene: import("phaser").Scene }).__loungeScene;
    const room = scene.children.getByName("living-lounge") as import("phaser").GameObjects.Container;
    return (room.getByName("lounge-machine") as import("phaser").GameObjects.Container).getByName(
      "lounge-cabinet-personal",
    );
  });
  await page.evaluate(() => {
    (document.querySelector("#buy-bar") as HTMLButtonElement).click();
  });
  expect((await roomState(page)).reveals).toEqual(["lounge-bar"]);
  expect(
    await page.evaluate((personal) => {
      const scene = (window as unknown as { __loungeScene: import("phaser").Scene }).__loungeScene;
      const room = scene.children.getByName("living-lounge") as import("phaser").GameObjects.Container;
      return (
        (room.getByName("lounge-machine") as import("phaser").GameObjects.Container).getByName(
          "lounge-cabinet-personal",
        ) === personal
      );
    }, untouched),
  ).toBe(true);
  await untouched.dispose();
  await page.evaluate(() => {
    (document.querySelector("#buy-machine") as HTMLButtonElement).click();
    (document.querySelector("#buy-decor") as HTMLButtonElement).click();
  });
  await settled(page);
  await page.evaluate(() => {
    (document.querySelector("#buy-bar") as HTMLButtonElement).click();
    (document.querySelector("#style-rug") as HTMLButtonElement).click();
  });
  expect((await roomState(page)).reveals).toEqual([]);
  await page.click("#rug-cancel");
  await page.evaluate(() => (document.querySelector("#buy-machine") as HTMLButtonElement).click());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await settled(page);
  await page.evaluate(() => (document.querySelector("#buy-decor") as HTMLButtonElement).click());
  expect((await roomState(page)).reveals).toEqual([]);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate(() => {
    (document.querySelector("#buy-bar") as HTMLButtonElement).click();
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(await roomState(page)).toMatchObject({ alpha: [1, 1, 1], reveals: [] });
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    document.dispatchEvent(new Event("visibilitychange"));
    (document.querySelector("#buy-decor") as HTMLButtonElement).click();
    const scene = (window as unknown as { __loungeScene: import("phaser").Scene; __oldGroups?: unknown }).__loungeScene;
    const room = scene.children.getByName("living-lounge") as import("phaser").GameObjects.Container;
    (window as unknown as { __oldGroups: unknown }).__oldGroups = room.list.slice();
    (document.querySelector("#enter-slot") as HTMLButtonElement).click();
  });
  await page.locator("#spin").waitFor();
  expect(
    await page.evaluate(() =>
      (window as unknown as { __oldGroups: { alpha: number }[] }).__oldGroups.map((group) => group.alpha),
    ),
  ).toEqual([1, 1, 1]);
  await page.getByRole("button", { name: "Back to lounge" }).click();
  await page.locator("#enter-slot").waitFor();
  await settled(page);
});

for (const preference of ["motion", "intensity"] as const) {
  test(`game ${preference} preference interrupts and bypasses local reveals`, async ({ page }) => {
    await startPlaytest(page);
    await page.evaluate((preference) => {
      (document.querySelector("#buy-bar") as HTMLButtonElement).click();
      (document.querySelector("[data-action=settings]") as HTMLButtonElement).click();
      const input = document.querySelector(`#${preference}`) as HTMLInputElement;
      if (preference === "motion") input.checked = true;
      else input.value = "0";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, preference);
    expect(await roomState(page)).toMatchObject({ alpha: [1, 1, 1], reveals: [] });
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.evaluate(() => (document.querySelector("#buy-machine") as HTMLButtonElement).click());
    expect(await roomState(page)).toMatchObject({ alpha: [1, 1, 1], reveals: [] });
  });
}

const captures = `${task3Captures}/room-regression`;
const viewports = [
  { width: 1600, height: 900 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
];

async function captureScene(page: Page) {
  // Capture the real scene only inside this test; the application exposes no cheat hooks.
  await page.route("**/src/view/SalonScene.ts*", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: `${await response.text()}\nconst createSalon = SalonScene.prototype.create; SalonScene.prototype.create = function () { window.__loungeScene = this; return createSalon.call(this); };`,
    });
  });
}

test("Living Lounge exposes reward groups and one cabinet per purchase", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await captureScene(page);
  await page.goto("http://localhost:5173/prototypes/living-lounge.html");
  await page.locator("#enter-slot").waitFor();
  await expect.soft(page.locator(".salon-copy > .eyebrow")).toBeHidden();
  const inspect = () =>
    page.evaluate(() => {
      const scene = (window as unknown as { __loungeScene: import("phaser").Scene }).__loungeScene;
      const room = scene.children.getByName("living-lounge") as import("phaser").GameObjects.Container | null;
      if (!room) return null;
      const descendants = (group: import("phaser").GameObjects.Container): import("phaser").GameObjects.GameObject[] =>
        group.list.flatMap((child) => [child, ...("list" in child ? descendants(child as typeof group) : [])]);
      const objects = descendants(room);
      return {
        groups: room.list.map((child) => child.name),
        cabinets: objects.filter((child) => {
          const image = child as import("phaser").GameObjects.Image;
          return child.name.startsWith("lounge-cabinet-") && image.visible && image.alpha > 0;
        }).length,
        objects: objects.map((child) => child.name).filter(Boolean),
        order: room.list.map((child) => child.name),
      };
    });
  await expect.poll(inspect).toMatchObject({
    groups: expect.arrayContaining(["lounge-bar", "lounge-machine", "lounge-decor"]),
    cabinets: 1,
  });
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.screenshot({ path: `${captures}/zero-${viewport.width}x${viewport.height}.png` });
  }
  await page.setViewportSize(viewports[0]);
  expect((await inspect())?.objects).not.toContain("lounge-stocked-bar");
  const shadow = await page.evaluate(() => {
    const scene = (window as unknown as { __loungeScene: import("phaser").Scene }).__loungeScene;
    const ctx = (scene.textures.get("lounge-contact-shadow") as import("phaser").Textures.CanvasTexture).getContext();
    return { center: ctx.getImageData(80, 16, 1, 1).data[3], edge: ctx.getImageData(0, 16, 1, 1).data[3] };
  });
  expect(shadow.center).toBeGreaterThan(100);
  expect(shadow.edge).toBeLessThan(10);
  for (let count = 2; count <= 4; count++) {
    await page.click("#buy-machine");
    await expect.poll(inspect).toMatchObject({ cabinets: count });
    await page.screenshot({ path: `${captures}/machine-${count - 1}-1600x900.png` });
  }
  for (const name of ["lounge-stocked-bar", "lounge-stool-left", "lounge-back-bar"]) {
    await page.click("#buy-bar");
    expect((await inspect())?.objects).toContain(name);
    await page.screenshot({ path: `${captures}/${name}-1600x900.png` });
  }
  for (const name of ["lounge-rug-claret", "lounge-planter-left", "lounge-nameplate"]) {
    await page.click("#buy-decor");
    expect((await inspect())?.objects).toContain(name);
    await page.screenshot({ path: `${captures}/${name}-1600x900.png` });
  }
  const max = await inspect();
  expect(max?.objects).toEqual(expect.arrayContaining(["lounge-stool-right", "lounge-planter-right"]));
  expect(max!.order.indexOf("lounge-decor")).toBeLessThan(max!.order.indexOf("lounge-machine"));
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    const clearance = await page.evaluate(() => {
      const scene = (window as unknown as { __loungeScene: import("phaser").Scene }).__loungeScene;
      const room = scene.children.getByName("living-lounge") as import("phaser").GameObjects.Container;
      const bar = room.getByName("lounge-bar") as import("phaser").GameObjects.Container;
      const shelf = (bar.getByName("lounge-back-bar") as import("phaser").GameObjects.Image).getBounds();
      const source = scene.textures.get("salon-base").getSourceImage();
      // Conservative hard-art bounds, including the lower mount, measured on the 1600×900 source.
      const lamp = { left: 460, top: 248, right: 530, bottom: 334 };
      const canvas = document.querySelector("canvas")!.getBoundingClientRect();
      const title = document.querySelector(".salon-copy")!.getBoundingClientRect();
      const scale = canvas.width / 1600;
      const titleRight = (title.right - canvas.left) / scale;
      return {
        source: [source.width, source.height],
        lampGap: Math.max(
          lamp.left - shelf.right,
          shelf.left - lamp.right,
          lamp.top - shelf.bottom,
          shelf.top - lamp.bottom,
        ),
        titleGap: shelf.left - titleRight,
        size: [shelf.width, shelf.height],
      };
    });
    expect(clearance.source).toEqual([1600, 900]);
    expect.soft(clearance.lampGap).toBeGreaterThanOrEqual(12);
    expect.soft(clearance.titleGap).toBeGreaterThanOrEqual(8);
    expect(clearance.size).toEqual([170, 250]);
    const overlap = await page.evaluate(() => {
      const scene = (window as unknown as { __loungeScene: import("phaser").Scene }).__loungeScene;
      const room = scene.children.getByName("living-lounge") as import("phaser").GameObjects.Container;
      const machines = room.getByName("lounge-machine") as import("phaser").GameObjects.Container;
      const canvas = document.querySelector("canvas")!.getBoundingClientRect();
      const button = document.querySelector("#enter-slot")!.getBoundingClientRect();
      const scale = canvas.width / 1600;
      return machines.list
        .filter((object) => /^lounge-cabinet-\d$/.test(object.name))
        .map((object) => {
          const bounds = (object as import("phaser").GameObjects.Image).getBounds();
          const left = canvas.left + bounds.x * scale;
          const top = canvas.top + bounds.y * scale;
          return (
            Math.max(0, Math.min(left + bounds.width * scale, button.right) - Math.max(left, button.left)) *
            Math.max(0, Math.min(top + bounds.height * scale, button.bottom) - Math.max(top, button.top))
          );
        });
    });
    expect(overlap).toEqual([0, 0, 0]);
    await page.screenshot({ path: `${captures}/max-claret-${viewport.width}x${viewport.height}.png` });
  }
  const cached = await page.evaluateHandle(() => {
    const scene = (window as unknown as { __loungeScene: import("phaser").Scene }).__loungeScene;
    return Object.fromEntries(Object.entries(scene.textures.list).filter(([key]) => key.startsWith("lounge-")));
  });
  const canvas = await page.locator("canvas").boundingBox();
  await page.mouse.click(canvas!.x + (745 * canvas!.width) / 1600, canvas!.y + (405 * canvas!.width) / 1600);
  await page.locator("#spin").waitFor();
  await page.getByRole("button", { name: "Back to lounge" }).click();
  await page.locator("#enter-slot").waitFor();
  expect(
    await page.evaluate((textures) => {
      const scene = (window as unknown as { __loungeScene: import("phaser").Scene }).__loungeScene;
      return Object.entries(textures).every(([key, texture]) => scene.textures.get(key) === texture);
    }, cached),
  ).toBe(true);
  await cached.dispose();
  await page.evaluate(() => {
    localStorage.setItem("amber-room:prototype:living-lounge:appearance:v1", '{"version":1,"rug":"moss"}');
  });
  await page.reload();
  await page.locator("#enter-slot").waitFor();
  expect((await inspect())?.objects).toContain("lounge-rug-moss");
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.screenshot({ path: `${captures}/max-moss-${viewport.width}x${viewport.height}.png` });
  }
  expect(errors).toEqual([]);
});

test("production retains its original room painter", async ({ page }) => {
  await captureScene(page);
  await page.goto("http://localhost:5173/");
  await page.locator("#enter-slot").waitFor();
  await expect(page.locator(".salon-copy > .eyebrow")).toBeVisible();
  const original = await page.evaluate(() => {
    const scene = (window as unknown as { __loungeScene: import("phaser").Scene }).__loungeScene;
    const images = scene.children
      .getChildren()
      .flatMap((child) => ("list" in child ? (child as import("phaser").GameObjects.Container).list : []))
      .filter((child) => "texture" in child) as import("phaser").GameObjects.Image[];
    return {
      prototype: Boolean(scene.children.getByName("living-lounge")),
      barAlpha: images.find((image) => image.texture.key === "salon-bar")?.alpha,
      cabinets: images.filter((image) => image.texture.key === "salon-machine").length,
    };
  });
  expect(original).toEqual({ prototype: false, barAlpha: 0.18, cabinets: 1 });
  await expect(page.locator("#style-rug")).toHaveCount(0);
  await expect(page.locator("#reset-playtest")).toHaveCount(0);
  await expect(page.locator("#playtest-label")).toHaveCount(0);
  await page.click("#buy-bar");
  await expect(page.locator("#salon-message")).toHaveText("A little more yours.");
  await page.getByRole("button", { name: "Settings & save" }).click();
  await expect(page.locator(".dialog-body")).not.toContainText("prototype progress");
  const downloadPromise = page.waitForEvent("download");
  await page.click("#export");
  expect((await downloadPromise).suggestedFilename()).toBe("amber-room-save.json");
});
