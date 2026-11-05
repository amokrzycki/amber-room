// Isolated Phase 4 experiment. No production imports this module or reads its save key.
import type { SaveV1 } from "../src/game/model";
import { accrueIncome, hourlyIncome } from "../src/game/business";
import { parseSave } from "../src/game/save";
export const PROTOTYPE_SAVE_KEY = "amber-room:prototype:opening-hours:v1";
export const openingHours = {
  brisk: { multiplier: 1.5, capHours: 4 },
  standard: { multiplier: 1, capHours: 8 },
  long: { multiplier: 0.75, capHours: 12 },
} as const;
export type OpeningMode = keyof typeof openingHours;
export type PrototypeSave = {
  prototype: "opening-hours-v1";
  mode: OpeningMode;
  creditedMs: number;
  save: SaveV1;
};
/** Settle the old eight-hour rules before choosing a future mode. Preserve the original v1 file separately. */
export function migratePrototype(save: SaveV1, mode: OpeningMode, nowMs = save.lastAccrualAtMs): PrototypeSave {
  return { prototype: "opening-hours-v1", mode, creditedMs: 0, save: accrueIncome(save, nowMs) };
}
export function parsePrototype(raw: string): PrototypeSave {
  if (raw.length > 110000) throw new Error("Prototype save is too large");
  const state = JSON.parse(raw);
  if (
    state?.prototype !== "opening-hours-v1" ||
    !Object.hasOwn(openingHours, state.mode) ||
    !Number.isSafeInteger(state.creditedMs) ||
    state.creditedMs < 0 ||
    state.creditedMs > openingHours[state.mode as OpeningMode].capHours * 3600000
  )
    throw new Error("Invalid prototype save");
  return {
    prototype: "opening-hours-v1",
    mode: state.mode,
    creditedMs: state.creditedMs,
    save: parseSave(JSON.stringify(state.save)),
  };
}
/** Ticks, visibility and reload all use this same persisted budget. Clock-only changes cannot refill it. */
export function accruePrototype(state: PrototypeSave, nowMs: number): PrototypeSave {
  if (!Number.isSafeInteger(nowMs) || nowMs < 0) throw new RangeError("Invalid time");
  const save = state.save;
  if (nowMs <= save.lastAccrualAtMs) return state;
  const config = openingHours[state.mode];
  const elapsed = Math.min(nowMs - save.lastAccrualAtMs, config.capHours * 3600000 - state.creditedMs);
  const units = save.remainderUnits + elapsed * hourlyIncome(save.businesses) * config.multiplier;
  const balance = save.balance + Math.floor(units / 3600000);
  if (!Number.isSafeInteger(balance)) throw new RangeError("Safe number range exceeded");
  return {
    ...state,
    creditedMs: state.creditedMs + elapsed,
    save: { ...save, balance, remainderUnits: units % 3600000, lastAccrualAtMs: nowMs },
  };
}
/** Caller must require deliberate player interaction; a timer, visibility event or reload is never attendance. */
export function attendPrototype(state: PrototypeSave, nowMs: number, mode = state.mode): PrototypeSave {
  const settled = accruePrototype(state, nowMs);
  if (nowMs < settled.save.lastAccrualAtMs) return settled;
  return { ...settled, mode, creditedMs: 0 };
}
