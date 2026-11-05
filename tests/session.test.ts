import { expect, it } from "vitest";
import { createSave } from "../src/game/save";
import { createSession, requestSpin, selectBet, reelsStopped, finishSpin } from "../src/game/session";
const rng = (() => {
  let n = 0;
  return () => [11, 11, 11, 1, 1][n++ % 5];
})();
it("settles once, rejects busy, snapshots bet and reloads settled balance", () => {
  const s = createSession(createSave(0));
  const r = requestSpin(s, rng);
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(r.state.save.balance).toBe(1000 - 5 + r.spin.outcome.payout);
  expect(requestSpin(r.state, () => 0)).toMatchObject({ ok: false, reason: "busy" });
  expect(selectBet(r.state, { lineCount: 40, perLine: 5 })).toBe(r.state);
  const stopped = reelsStopped(r.state, r.spin.id);
  const done = finishSpin(stopped, r.spin.id);
  expect(finishSpin(done, r.spin.id)).toBe(done);
  expect(done.save.balance).toBe(r.state.save.balance);
  const changed = selectBet(done, { lineCount: 40, perLine: 5 });
  expect(changed.save.lastSpin?.bet).toEqual({ lineCount: 5, perLine: 1 });
  expect(createSession(changed.save).phase).toBe("ready");
});
it("rejects 200 stake when balance is 199", () => {
  const save = createSave(0);
  save.balance = 199;
  save.selectedBet = { lineCount: 40, perLine: 5 };
  expect(requestSpin(createSession(save), () => 0)).toMatchObject({ ok: false, reason: "insufficient-funds" });
});
it("ignores stale animation callbacks", () => {
  const r = requestSpin(createSession(createSave(0)), () => 0);
  if (!r.ok) throw Error();
  expect(reelsStopped(r.state, 999)).toBe(r.state);
  expect(finishSpin(r.state, r.spin.id)).toBe(r.state);
});
it("1000 minus default stake plus gross 20 persists as exactly 1015", () => {
  let i = 0;
  const r = requestSpin(createSession(createSave(0)), () => [8, 0, 0, 0, 0][i++]);
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(r.spin.outcome.payout).toBe(20);
  expect(r.state.save.balance).toBe(1015);
});
it.each([
  [[1, 0, 0, 0, 0], 0],
  [[2, 1, 0, 0, 0], 4],
  [[5, 1, 1, 0, 0], 5],
  [[3, 0, 0, 0, 0], 15],
] as const)("preserves balance through repeated completion and reload for stops %j", (stops, payout) => {
  let i = 0;
  const result = requestSpin(createSession(createSave(0)), () => stops[i++]);
  if (!result.ok) throw Error("Expected a spin");
  expect(result.spin.outcome.payout).toBe(payout);
  const expected = 1000 - 5 + payout;
  let state = reelsStopped(result.state, result.spin.id);
  for (let input = 0; input < 20; input++) state = finishSpin(state, result.spin.id);
  expect(state.save.balance).toBe(expected);
  expect(state.save.nextSpinId).toBe(2);
  for (const saved of [result.state.save, state.save]) {
    const loaded = createSession(saved);
    expect(loaded.phase).toBe("ready");
    expect(loaded.save.balance).toBe(expected);
    const next = requestSpin(loaded, () => 0);
    if (!next.ok) throw Error("Expected the next spin");
    expect(next.state.save.balance).toBe(expected - 5 + next.spin.outcome.payout);
    expect(finishSpin(next.state, result.spin.id)).toBe(next.state);
  }
});
