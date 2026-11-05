import type { WinTier } from "./model";
export function classifyWin(stake: number, payout: number): WinTier {
  const profit = payout - stake;
  return profit <= 0 ? "neutral" : profit < 5 * stake ? "small" : profit < 20 * stake ? "big" : "jackpot";
}
export const celebrationDuration = (tier: WinTier) => ({ neutral: 0, small: 700, big: 2200, jackpot: 4000 })[tier];
export function createCelebration(ms: number, cleanup: () => void) {
  let finished = false;
  let resolve!: () => void;
  const done = new Promise<void>((r) => (resolve = r));
  const skip = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    cleanup();
    resolve();
  };
  const timer = setTimeout(skip, ms);
  return { done, skip, dispose: skip };
}
