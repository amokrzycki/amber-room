export const symbols = ["cherry", "lemon", "plum", "melon", "seven", "wild"] as const;
export type SymbolId = (typeof symbols)[number];
export type Bet = { lineCount: 1 | 5 | 10 | 20 | 40; perLine: 1 | 2 | 5 };
export type Rng = (exclusiveMax: number) => number;
export type MachineConfig = {
  reels: SymbolId[][];
  paylines: number[][];
  allowedLineCounts: number[];
  allowedPerLine: number[];
  paytable: Record<SymbolId, readonly [number, number, number]>;
};
export type LineWin = { lineIndex: number; symbol: SymbolId; count: number; payout: number };
export type SpinOutcome = { stops: number[]; grid: SymbolId[][]; lineWins: LineWin[]; payout: number };
export type SpinRecord = { id: number; bet: Bet; totalStake: number; outcome: SpinOutcome };
export type Businesses = { barLevel: 0 | 1 | 2 | 3; extraMachines: 0 | 1 | 2 | 3; decorLevel: 0 | 1 | 2 | 3 };
export type SaveV1 = {
  version: 1;
  balance: number;
  businesses: Businesses;
  lastAccrualAtMs: number;
  remainderUnits: number;
  nextSpinId: number;
  lastSpin: SpinRecord | null;
  selectedBet: Bet;
  settings: { muted: boolean; reducedMotion: boolean; effectsIntensity: number };
};
export type SessionState = { save: SaveV1; phase: "ready" | "spinning" | "celebrating"; activeSpinId: number | null };
export type SpinDecision =
  | { ok: true; state: SessionState; spin: SpinRecord }
  | { ok: false; state: SessionState; reason: "busy" | "invalid-bet" | "insufficient-funds" };
export type WinTier = "neutral" | "small" | "big" | "jackpot";
