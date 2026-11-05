import type { SymbolId } from "../game/model";

// Presentation only: no RNG call, spin record or payable line before the first spin.
export const idleGrid: SymbolId[][] = [
  ["cherry", "lemon", "plum"],
  ["melon", "seven", "cherry"],
  ["lemon", "plum", "melon"],
  ["plum", "melon", "cherry"],
  ["cherry", "lemon", "plum"],
];
