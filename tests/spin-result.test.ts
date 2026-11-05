import { expect, it } from "vitest";
import { createSave, parseSave } from "../src/game/save";
import { createSession, requestSpin, selectBet, reelsStopped, finishSpin } from "../src/game/session";
import { describeSpinResult } from "../src/view/spinResult";
import type { Bet } from "../src/game/model";

it("describes zero, partial, break-even and profitable returns for every supported bet", () => {
  for (const lineCount of [1, 5, 10, 20, 40] as const)
    for (const perLine of [1, 2, 5] as const) {
      const state = selectBet(createSession(createSave(0)), { lineCount, perLine });
      const result = requestSpin(state, () => 0);
      if (!result.ok) throw Error("Expected a spin");
      const stake = lineCount * perLine;
      for (const returned of [0, Math.max(0, stake - 1), stake, stake + 1]) {
        const spin = { ...result.spin, outcome: { ...result.spin.outcome, payout: returned } };
        const net = returned - stake;
        const description = describeSpinResult(spin);
        expect(description.breakdown).toBe(`Stake ${stake} · Returned ${returned} · Net ${net > 0 ? "+" : ""}${net}`);
        expect(description.announcement).toContain(`Stake ${stake} tokens. Returned ${returned} tokens.`);
        expect(description.announcement).toContain(
          net === 0 ? "Break-even." : `Net ${net > 0 ? "gain" : "loss"} ${Math.abs(net)} tokens.`,
        );
      }
    }
});

it("uses the recorded stake after selecting a different bet and reloading a version 1 save", () => {
  let i = 0;
  const result = requestSpin(createSession(createSave(0)), () => [8, 0, 0, 0, 0][i++]);
  if (!result.ok) throw Error("Expected a spin");
  const settled = finishSpin(reelsStopped(result.state, result.spin.id), result.spin.id);
  const changed = selectBet(settled, { lineCount: 40, perLine: 5 } satisfies Bet);
  const loaded = parseSave(JSON.stringify(changed.save));
  expect(loaded.selectedBet).toEqual({ lineCount: 40, perLine: 5 });
  if (!loaded.lastSpin) throw Error("Expected the saved spin");
  expect(describeSpinResult(loaded.lastSpin).breakdown).toBe("Stake 5 · Returned 20 · Net +15");
  expect(loaded.version).toBe(1);
});

it("formats large returns and distinguishes consecutive identical outcomes", () => {
  const result = requestSpin(createSession(createSave(0)), () => 0);
  if (!result.ok) throw Error("Expected a spin");
  const spin = { ...result.spin, outcome: { ...result.spin.outcome, payout: 10000 } };
  expect(describeSpinResult(spin).breakdown).toBe("Stake 5 · Returned 10,000 · Net +9,995");
  expect(describeSpinResult(spin).announcement).not.toBe(describeSpinResult({ ...spin, id: spin.id + 1 }).announcement);
});
