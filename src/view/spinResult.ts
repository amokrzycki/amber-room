import type { SpinRecord, SymbolId } from "../game/model";

export const symbolNames: Record<SymbolId, string> = {
  cherry: "Cherries",
  lemon: "Lemon",
  plum: "Plum",
  melon: "Melon",
  seven: "Seven",
  wild: "7 WILD",
};

export const signed = (n: number) => `${n > 0 ? "+" : ""}${n.toLocaleString("en-GB")}`;

/** Short result word; "Win" is reserved for spins that actually finish ahead of the stake. */
export function resultWord(spin: SpinRecord, tier: "neutral" | "small" | "big" | "jackpot") {
  if (tier === "small") return "Win";
  if (tier === "big") return "Big win";
  if (tier === "jackpot") return "Jackpot";
  if (spin.outcome.payout === spin.totalStake) return "Break-even";
  return spin.outcome.payout ? "Tokens returned" : "No return this time";
}

export function describeSpinResult(spin: SpinRecord) {
  const stake = spin.totalStake.toLocaleString("en-GB");
  const returned = spin.outcome.payout.toLocaleString("en-GB");
  const net = spin.outcome.payout - spin.totalStake;
  return {
    breakdown: `Stake ${stake} · Returned ${returned} · Net ${signed(net)}`,
    announcement: `Spin ${spin.id} complete. Stake ${stake} tokens. Returned ${returned} tokens. ${net === 0 ? "Break-even." : `Net ${net > 0 ? "gain" : "loss"} ${Math.abs(net).toLocaleString("en-GB")} tokens.`}`,
  };
}
