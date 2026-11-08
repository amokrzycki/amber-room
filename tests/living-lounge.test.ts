import { afterEach, expect, it, vi } from "vitest";
import { hourlyIncome, purchase } from "../src/game/business";
import { createSave, exportSave, parseSave, SAVE_KEY, SaveOwner } from "../src/game/save";
import { createSession, requestSpin } from "../src/game/session";
import {
  createLoungeStorage,
  LOUNGE_APPEARANCE_KEY,
  LOUNGE_SAVE_KEY,
  readRug,
  resetLounge,
  writeRug,
} from "../prototypes/living-lounge-state";

const now = 1000;
const sentinel = '{"production":"must stay byte-for-byte unchanged"}';
const stores: { data: Map<string, string>; storage: Storage }[] = [];
function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries({ [SAVE_KEY]: sentinel, unrelated: "keep", ...initial }));
  const storage = {
    get length() {
      return data.size;
    },
    clear: vi.fn(() => data.clear()),
    key: (index: number) => [...data.keys()][index] ?? null,
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => void data.set(key, value)),
    removeItem: vi.fn((key: string) => void data.delete(key)),
  };
  const store = { data, storage };
  stores.push(store);
  return store;
}
afterEach(() => {
  for (const { data, storage } of stores) {
    expect(data.get(SAVE_KEY)).toBe(sentinel);
    expect(data.get("unrelated")).toBe("keep");
    expect(vi.mocked(storage.getItem).mock.calls.some(([key]) => key === SAVE_KEY)).toBe(false);
    expect(vi.mocked(storage.setItem).mock.calls.some(([key]) => key === SAVE_KEY)).toBe(false);
    expect(storage.removeItem).not.toHaveBeenCalled();
    expect(storage.clear).not.toHaveBeenCalled();
  }
  stores.length = 0;
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetModules();
});

it("starts a missing prototype save at 20,000 with zero levels and the unchanged base rate", () => {
  const { storage } = memoryStorage();
  const owner = new SaveOwner(createLoungeStorage(storage, now), now);
  expect(owner.state.save.balance).toBe(20000);
  expect(owner.state.save.businesses).toEqual({ barLevel: 0, extraMachines: 0, decorLevel: 0 });
  expect(owner.state.save.lastAccrualAtMs).toBe(now);
  expect(parseSave(exportSave(owner.state.save))).toEqual(owner.state.save);
  expect(hourlyIncome(owner.state.save.businesses)).toBe(64);
  expect(owner.warning).toBe("");
  expect(readRug(storage)).toEqual({ style: "claret", warning: "" });
});

it("buys all nine upgrades at unchanged costs, rates and limits and reloads only prototype progress", () => {
  const { storage, data } = memoryStorage();
  const adapter = createLoungeStorage(storage, now);
  const owner = new SaveOwner(adapter, now);
  for (const [item, balances, rates] of [
    ["bar", [19500, 18500, 16500], [76, 88, 100]],
    ["machine", [15750, 14250, 11250], [120, 140, 160]],
    ["decor", [10950, 10050, 8250], [160, 160, 160]],
  ] as const) {
    for (let level = 0; level < 3; level++) {
      const result = purchase(owner.state.save, item, now);
      expect(result.ok).toBe(true);
      owner.commit(createSession(result.save));
      expect(owner.state.save.balance).toBe(balances[level]);
      expect(hourlyIncome(owner.state.save.businesses)).toBe(rates[level]);
    }
    expect(purchase(owner.state.save, item, now).reason).toBe("max-level");
  }
  expect(owner.state.save.businesses).toEqual({ barLevel: 3, extraMachines: 3, decorLevel: 3 });
  expect(parseSave(data.get(LOUNGE_SAVE_KEY) ?? "")).toEqual(owner.state.save);
  expect(new SaveOwner(createLoungeStorage(storage, now + 1), now + 1).state.save).toEqual(owner.state.save);
});

it("changes both rug styles freely without changing game progress or income", () => {
  const { storage, data } = memoryStorage();
  const owner = new SaveOwner(createLoungeStorage(storage, now), now);
  owner.commit(createSession(purchase(owner.state.save, "decor", now).save));
  const before = data.get(LOUNGE_SAVE_KEY);
  for (const style of ["moss", "claret", "moss"] as const) {
    expect(writeRug(storage, style)).toEqual({ ok: true });
    expect(readRug(storage)).toEqual({ style, warning: "" });
    expect(JSON.parse(data.get(LOUNGE_APPEARANCE_KEY) ?? "")).toEqual({ version: 1, rug: style });
    expect(data.get(LOUNGE_SAVE_KEY)).toBe(before);
    expect(owner.state.save.balance).toBe(19700);
    expect(hourlyIncome(owner.state.save.businesses)).toBe(64);
  }
});

it.each(["{bad", "null", '{"version":2,"rug":"moss"}', '{"version":1,"rug":"gold"}'])(
  "warns and defaults to claret without overwriting invalid appearance: %s",
  (raw) => {
    const { storage, data } = memoryStorage({ [LOUNGE_APPEARANCE_KEY]: raw });
    const result = readRug(storage);
    expect(result.style).toBe("claret");
    expect(result.warning).toBeTruthy();
    expect(data.get(LOUNGE_APPEARANCE_KEY)).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();
  },
);

it("reports unavailable appearance storage and unsuccessful writes", () => {
  const { storage } = memoryStorage();
  storage.getItem.mockImplementation(() => {
    throw new Error("denied");
  });
  storage.setItem.mockImplementation(() => {
    throw new Error("denied");
  });
  expect(readRug(storage).style).toBe("claret");
  expect(readRug(storage).warning).toBeTruthy();
  expect(writeRug(storage, "moss")).toEqual({ ok: false });
});

it("rejects an unsupported rug from an untyped caller without touching storage", () => {
  const { storage } = memoryStorage();
  // @ts-expect-error Exercise validation at an untyped caller boundary.
  expect(writeRug(storage, "gold")).toEqual({ ok: false });
  expect(storage.setItem).not.toHaveBeenCalled();
});

it("preserves a damaged game original through play and permits only deliberate valid import", () => {
  const raw = "{damaged prototype";
  const { storage, data } = memoryStorage({ [LOUNGE_SAVE_KEY]: raw });
  const owner = new SaveOwner(createLoungeStorage(storage, now), now);
  expect(owner.originalRaw).toBe(raw);
  expect(owner.warning).toContain("Damaged save protected");
  const result = requestSpin(owner.state, () => 0);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("Expected playable in-memory fallback");
  owner.commit(result.state);
  expect(data.get(LOUNGE_SAVE_KEY)).toBe(raw);
  expect(() => owner.import("{bad")).toThrow();
  expect(data.get(LOUNGE_SAVE_KEY)).toBe(raw);
  const imported = createSave(now);
  imported.balance = 4321;
  owner.import(exportSave(imported));
  expect(parseSave(data.get(LOUNGE_SAVE_KEY) ?? "")).toEqual(imported);
  expect(owner.originalRaw).toBeUndefined();
});

it("rejects every unexpected adapter key before touching underlying storage", () => {
  const { storage } = memoryStorage();
  const adapter = createLoungeStorage(storage, now);
  for (const key of ["", "other", LOUNGE_SAVE_KEY, LOUNGE_APPEARANCE_KEY, `${SAVE_KEY}:backup`]) {
    expect(() => adapter.getItem(key)).toThrow();
    expect(() => adapter.setItem(key, "anything")).toThrow();
  }
  expect(storage.getItem).not.toHaveBeenCalled();
  expect(storage.setItem).not.toHaveBeenCalled();
});

it("resets only prototype progress and appearance to a validated accelerated fixture", () => {
  const { storage, data } = memoryStorage({
    [LOUNGE_SAVE_KEY]: "{damaged",
    [LOUNGE_APPEARANCE_KEY]: '{"version":1,"rug":"moss"}',
  });
  resetLounge(storage, now);
  const save = parseSave(data.get(LOUNGE_SAVE_KEY) ?? "");
  expect(save.balance).toBe(20000);
  expect(save.businesses).toEqual({ barLevel: 0, extraMachines: 0, decorLevel: 0 });
  expect(save.lastAccrualAtMs).toBe(now);
  expect(readRug(storage)).toEqual({ style: "claret", warning: "" });
  expect(storage.setItem.mock.calls.map(([key]) => key).sort()).toEqual(
    [LOUNGE_SAVE_KEY, LOUNGE_APPEARANCE_KEY].sort(),
  );
});

it("does not claim reset success when storage rejects a write", () => {
  const { storage } = memoryStorage();
  storage.setItem.mockImplementation(() => {
    throw new Error("quota");
  });
  expect(() => resetLounge(storage, now)).toThrow("quota");
});

it("exposes a second-write reset failure without claiming an atomic reset", () => {
  const { storage, data } = memoryStorage({
    [LOUNGE_SAVE_KEY]: "{damaged",
    [LOUNGE_APPEARANCE_KEY]: '{"version":1,"rug":"moss"}',
  });
  storage.setItem.mockImplementation((key, value) => {
    if (key === LOUNGE_APPEARANCE_KEY) throw new Error("appearance quota");
    data.set(key, value);
  });
  expect(() => resetLounge(storage, now)).toThrow("appearance quota");
  const reloaded = new SaveOwner(createLoungeStorage(storage, now), now);
  expect(reloaded.state.save.balance).toBe(20000);
  expect(reloaded.state.save.businesses).toEqual({ barLevel: 0, extraMachines: 0, decorLevel: 0 });
  expect(readRug(storage)).toEqual({ style: "moss", warning: "" });
});

it("keeps runtime mode off until explicitly enabled", async () => {
  const mode = await import("../src/runtimeMode");
  expect(mode.livingLounge).toBe(false);
  mode.enableLivingLounge();
  expect(mode.livingLounge).toBe(true);
});

it("uses the isolated adapter when runtime boots in lounge mode", async () => {
  const { storage, data } = memoryStorage();
  vi.stubGlobal("window", { localStorage: storage });
  vi.spyOn(Date, "now").mockReturnValue(now);
  (await import("../src/runtimeMode")).enableLivingLounge();
  const { owner } = await import("../src/runtime");
  expect(owner.state.save.balance).toBe(20000);
  owner.commit(owner.state);
  expect(parseSave(data.get(LOUNGE_SAVE_KEY) ?? "").balance).toBe(20000);
});

it("does not replace a protected damaged-save runtime fallback with the accelerated fixture", async () => {
  const { storage, data } = memoryStorage({ [LOUNGE_SAVE_KEY]: "{damaged" });
  vi.stubGlobal("window", { localStorage: storage });
  vi.spyOn(Date, "now").mockReturnValue(now);
  (await import("../src/runtimeMode")).enableLivingLounge();
  const { owner } = await import("../src/runtime");
  expect(owner.state.save.balance).toBe(1000);
  expect(owner.originalRaw).toBe("{damaged");
  expect(owner.warning).toContain("Damaged save protected");
  owner.commit(owner.state);
  expect(data.get(LOUNGE_SAVE_KEY)).toBe("{damaged");
});

it.each(["getter", "methods"])("keeps denied-storage lounge runtime accelerated and playable: %s", async (kind) => {
  const { storage } = memoryStorage();
  storage.getItem.mockImplementation(() => {
    throw new Error("denied");
  });
  storage.setItem.mockImplementation(() => {
    throw new Error("denied");
  });
  vi.stubGlobal(
    "window",
    kind === "getter"
      ? {
          get localStorage() {
            throw new Error("denied");
          },
        }
      : { localStorage: storage },
  );
  vi.spyOn(Date, "now").mockReturnValue(now);
  (await import("../src/runtimeMode")).enableLivingLounge();
  const { owner } = await import("../src/runtime");
  expect(owner.state.save.balance).toBe(20000);
  expect(owner.warning).toContain("Storage is unavailable");
  const result = purchase(owner.state.save, "bar", now);
  expect(result.ok).toBe(true);
  owner.commit(createSession(result.save));
  expect(owner.state.save.balance).toBe(19500);
  expect(owner.warning).toContain("Saving failed");
});

it("retains a playable accelerated fixture when only writes are denied", () => {
  const { storage } = memoryStorage();
  storage.setItem.mockImplementation(() => {
    throw new Error("quota");
  });
  const owner = new SaveOwner(createLoungeStorage(storage, now), now);
  owner.commit(createSession(purchase(owner.state.save, "bar", now).save));
  expect(owner.state.save.balance).toBe(19500);
  expect(owner.warning).toContain("Saving failed");
});

it("leaves production runtime defaults unchanged when lounge mode is not enabled", async () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => void data.set(key, value)),
  };
  vi.stubGlobal("window", { localStorage: storage });
  vi.spyOn(Date, "now").mockReturnValue(now);
  const { owner } = await import("../src/runtime");
  expect(owner.state.save).toEqual(createSave(now));
  owner.commit(owner.state);
  expect([...data.keys()]).toEqual([SAVE_KEY]);
  expect(parseSave(data.get(SAVE_KEY) ?? "").balance).toBe(1000);
});

it("ignores lounge mode outside development even when explicitly enabled", async () => {
  const storage = { getItem: vi.fn(() => null), setItem: vi.fn() };
  vi.stubGlobal("window", { localStorage: storage });
  vi.stubEnv("DEV", false);
  vi.spyOn(Date, "now").mockReturnValue(now);
  (await import("../src/runtimeMode")).enableLivingLounge();
  const { owner } = await import("../src/runtime");
  expect(owner.state.save).toEqual(createSave(now));
  owner.commit(owner.state);
  expect(storage.getItem).toHaveBeenCalledExactlyOnceWith(SAVE_KEY);
  expect(storage.setItem).toHaveBeenCalledExactlyOnceWith(SAVE_KEY, exportSave(createSave(now)));
});
