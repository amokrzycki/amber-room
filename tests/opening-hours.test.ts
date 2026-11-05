import { expect, it } from "vitest";
import { createSession, requestSpin } from "../src/game/session";
import { createSave, parseSave } from "../src/game/save";
import { accruePrototype, attendPrototype, migratePrototype, parsePrototype } from "../prototypes/opening-hours";
const H = 3600000;
it("makes all three strategies best at different return cadences", () => {
  for (const [hours, expected] of [
    [4, [384, 256, 192]],
    [8, [384, 512, 384]],
    [24, [384, 512, 576]],
  ] as const) {
    expect(
      (["brisk", "standard", "long"] as const).map(
        (mode) => accruePrototype(migratePrototype(createSave(0), mode), hours * H).save.balance - 1000,
      ),
    ).toEqual(expected);
  }
});
it("polling, hidden delivery, reload and clock jumps share one persisted earnings budget", () => {
  let state = migratePrototype(createSave(0), "brisk");
  for (let h = 1; h <= 48; h++) state = accruePrototype(parsePrototype(JSON.stringify(state)), h * H);
  expect(state.save.balance).toBe(1384);
  expect(accruePrototype(state, 1000000 * H).save.balance).toBe(1384);
  expect(accruePrototype(state, 0)).toBe(state);
  expect(accruePrototype(state, state.save.lastAccrualAtMs)).toBe(state);
  expect(() => accruePrototype(state, NaN)).toThrow();
  expect(() => accruePrototype(state, -1)).toThrow();
});
it("settles the old mode before attendance changes the future mode", () => {
  const old = migratePrototype(createSave(0), "brisk");
  const next = attendPrototype(old, 24 * H, "long");
  expect(next.save.balance).toBe(1384);
  expect(accruePrototype(next, 48 * H).save.balance).toBe(1960);
  expect(attendPrototype(next, 0, "standard")).toBe(next);
});
it("migration is nonretroactive and leaves v1 saves and recorded slot settlement readable", () => {
  const save = createSave(0);
  save.remainderUnits = 1800000;
  const state = migratePrototype(save, "long");
  expect(state.save).toEqual(save);
  expect(parseSave(JSON.stringify(save))).toEqual(save);
  expect(parsePrototype(JSON.stringify(state))).toEqual(state);
  expect(accruePrototype(state, H / 96).save.balance).toBe(1001);
  expect(() => parsePrototype(JSON.stringify({ ...state, mode: "typo" }))).toThrow();
  expect(() => parsePrototype(JSON.stringify({ ...state, creditedMs: -1 }))).toThrow();
  expect(() => parsePrototype(JSON.stringify({ ...state, creditedMs: 13 * H }))).toThrow();
});

it("settles pre-migration absences under v1 rules without applying the new multiplier retroactively", () => {
  const save = createSave(0);
  const state = migratePrototype(save, "brisk", 24 * H);
  expect(state.save.balance).toBe(1512);
  expect(accruePrototype(state, 24 * H)).toBe(state);
  expect(accruePrototype(state, 48 * H).save.balance).toBe(1896);
  expect(save.balance).toBe(1000);
});
it("allows no clock-only farming even across repeated forward/rollback/reload cycles", () => {
  let state = migratePrototype(createSave(0), "long");
  for (let i = 1; i <= 100; i++) {
    state = accruePrototype(parsePrototype(JSON.stringify(state)), i * 1000 * H);
    state = accruePrototype(state, 0);
  }
  expect(state.save.balance).toBe(1576);
  expect(() => accruePrototype(state, Infinity)).toThrow();
  const rich = migratePrototype({ ...createSave(0), balance: Number.MAX_SAFE_INTEGER }, "brisk");
  expect(() => accruePrototype(rich, H)).toThrow();
});
it("preserves recorded slot settlement through migration and prototype reload", () => {
  const initial = createSession(createSave(0));
  const result = requestSpin(initial, () => 0);
  if (!result.ok) throw Error("Expected valid spin");
  const state = parsePrototype(JSON.stringify(migratePrototype(result.state.save, "standard")));
  expect(state.save.lastSpin).toEqual(result.spin);
  expect(state.save.balance).toBe(1065);
  expect(parseSave(JSON.stringify(state.save))).toEqual(state.save);
});
