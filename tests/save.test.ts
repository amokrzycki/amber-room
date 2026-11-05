import { expect, it } from "vitest";
import { createSave, parseSave, exportSave, loadSave, writeSave, SaveOwner } from "../src/game/save";
import { createSession, requestSpin } from "../src/game/session";
it("roundtrip preserves full state and validates outcome consistency", () => {
  let save = createSave(100);
  save.businesses = { barLevel: 2, extraMachines: 3, decorLevel: 1 };
  save.remainderUnits = 3500;
  save.settings = { muted: true, reducedMotion: true, effectsIntensity: 0.3 };
  const r = requestSpin(createSession(save), () => 11);
  if (r.ok) save = r.state.save;
  expect(parseSave(exportSave(save))).toEqual(save);
  for (const mutate of [
    (s: any) => (s.version = 2),
    (s: any) => (s.balance = Number.MAX_SAFE_INTEGER + 1),
    (s: any) => (s.selectedBet.lineCount = 3),
    (s: any) => (s.lastSpin.totalStake = 3),
    (s: any) => (s.lastSpin.outcome.grid[0][0] = "oops"),
    (s: any) => s.lastSpin.outcome.payout++,
  ]) {
    const copy = JSON.parse(exportSave(save));
    mutate(copy);
    expect(() => parseSave(JSON.stringify(copy))).toThrow();
  }
  expect(() => parseSave("{")).toThrow();
});
it("reports unavailable storage", () => {
  expect(
    loadSave(
      {
        getItem() {
          throw Error();
        },
      },
      0,
    ).kind,
  ).toBe("unavailable");
  expect(
    writeSave(
      {
        setItem() {
          throw Error();
        },
      },
      createSave(0),
    ).ok,
  ).toBe(false);
});
it("protects corrupt original after spin and permits deliberate validated import", () => {
  let raw = "{bad";
  const storage = {
    getItem: () => raw,
    setItem: (_k: string, v: string) => {
      raw = v;
    },
  };
  const owner = new SaveOwner(storage, 0);
  expect(owner.originalRaw).toBe("{bad");
  const r = requestSpin(owner.state, () => 0);
  if (r.ok) owner.commit(r.state);
  expect(raw).toBe("{bad");
  expect(owner.warning).toBeTruthy();
  const before = owner.state;
  expect(() => owner.import("{broken")).toThrow();
  expect(owner.state).toBe(before);
  owner.import(exportSave(createSave(100)));
  expect(parseSave(raw)).toEqual(createSave(100));
});
it("refuses malformed ids, timestamps, settings and unreachable spin grids", () => {
  for (const mutate of [
    (s: any) => (s.lastAccrualAtMs = -1),
    (s: any) => (s.remainderUnits = 3600000),
    (s: any) => (s.nextSpinId = 0),
    (s: any) => (s.settings.muted = 0),
    (s: any) => (s.settings.effectsIntensity = 2),
  ]) {
    const s = createSave(0);
    mutate(s);
    expect(() => parseSave(JSON.stringify(s))).toThrow();
  }
});
it("accepts JSON objects regardless of field order", () => {
  const r = requestSpin(createSession(createSave(0)), () => 11);
  if (!r.ok) throw Error();
  const s = JSON.parse(exportSave(r.state.save));
  const o = s.lastSpin.outcome;
  s.lastSpin.outcome = {
    payout: o.payout,
    lineWins: o.lineWins.map((w: any) => ({
      payout: w.payout,
      count: w.count,
      symbol: w.symbol,
      lineIndex: w.lineIndex,
    })),
    grid: o.grid,
    stops: o.stops,
  };
  expect(parseSave(JSON.stringify(s))).toEqual(r.state.save);
});
it("reloading a persisted gross-20 spin keeps 1015 without replaying the settlement", () => {
  let raw: string | null = null;
  const storage = {
    getItem: () => raw,
    setItem: (_k: string, value: string) => {
      raw = value;
    },
  };
  const owner = new SaveOwner(storage, 0);
  let i = 0;
  const result = requestSpin(owner.state, () => [4, 0, 0, 0, 0][i++]);
  if (!result.ok) throw Error();
  owner.commit(result.state);
  const reloaded = new SaveOwner(storage, 1000);
  expect(reloaded.state.save.balance).toBe(1015);
  expect(reloaded.state.phase).toBe("ready");
  expect(reloaded.state.save.lastSpin?.id).toBe(1);
});
