import { expect, it } from "vitest";
import { createSave } from "../src/game/save";
import { accrueIncome, hourlyIncome, purchase, buyRound } from "../src/game/business";
import { createSession, requestSpin } from "../src/game/session";
it("finite rates and eight-hour cap", () => {
  expect(hourlyIncome(createSave(0).businesses)).toBe(64);
  const s = createSave(0);
  s.businesses = { barLevel: 3, extraMachines: 3, decorLevel: 3 };
  expect(hourlyIncome(s.businesses)).toBe(160);
  expect(accrueIncome(s, 24 * 3600000).balance).toBe(2280);
});
it("keeps fractions and never double-accrues on rollback", () => {
  const s = createSave(56250);
  const a = accrueIncome(s, 84375);
  expect(a.balance).toBe(1000);
  expect(a.remainderUnits).toBe(1800000);
  expect(accrueIncome(a, 112500).balance).toBe(1001);
  const back = accrueIncome(a, 0);
  expect(back).toEqual(a);
  expect(accrueIncome(back, 84375)).toEqual(a);
});
it("accrues before purchase using old rate even when declined", () => {
  let r = purchase(createSave(0), "bar", 3600000);
  expect(r.ok).toBe(true);
  expect(r.save.balance).toBe(564);
  expect(accrueIncome(r.save, 7200000).balance).toBe(640);
  const s = createSave(0);
  s.balance = 0;
  r = purchase(s, "machine", 3600000);
  expect(r.ok).toBe(false);
  expect(r.save.balance).toBe(64);
  expect(r.save.lastAccrualAtMs).toBe(3600000);
});
it("bounded catalog, decor cannot change income, round has no reward", () => {
  const s = createSave(0);
  s.balance = 10000;
  s.businesses.extraMachines = 3;
  expect(purchase(s, "machine", 0).reason).toBe("max-level");
  const d = purchase(s, "decor", 0);
  expect(hourlyIncome(d.save.businesses)).toBe(hourlyIncome(s.businesses));
  expect(buyRound(s, 0).save.balance).toBe(9950);
  s.balance = 49;
  expect(buyRound(s, 0).ok).toBe(false);
});
it("manual losses do not become business revenue", () => {
  const r = requestSpin(
    createSession(createSave(0)),
    (() => {
      let i = 0;
      return () => [1, 0, 0, 0, 0][i++];
    })(),
  );
  if (!r.ok) throw Error();
  expect(r.state.save.balance).toBe(995);
  expect(accrueIncome(r.state.save, 3600000).balance).toBe(1059);
});
it("refuses numeric overflow without clamping earned money", () => {
  const s = createSave(0);
  s.balance = Number.MAX_SAFE_INTEGER;
  expect(() => accrueIncome(s, 3600000)).toThrow(RangeError);
});
