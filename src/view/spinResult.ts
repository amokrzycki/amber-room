import type { SpinRecord } from "../game/model";

export function describeSpinResult(spin: SpinRecord) {
  const stake = spin.totalStake.toLocaleString("en-GB");
  const returned = spin.outcome.payout.toLocaleString("en-GB");
  const net = spin.outcome.payout - spin.totalStake;
  return {
    breakdown: `Stake ${stake} · Returned ${returned} · Net ${net > 0 ? "+" : ""}${net.toLocaleString("en-GB")}`,
    announcement: `Spin ${spin.id} complete. Stake ${stake} tokens. Returned ${returned} tokens. ${net === 0 ? "Break-even." : `Net ${net > 0 ? "gain" : "loss"} ${Math.abs(net).toLocaleString("en-GB")} tokens.`}`,
  };
}
