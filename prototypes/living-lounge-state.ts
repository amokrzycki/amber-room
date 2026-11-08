import { createSave, exportSave, parseSave, SAVE_KEY } from "../src/game/save";
import type { Item } from "../src/game/business";

export const LOUNGE_SAVE_KEY = "amber-room:prototype:living-lounge:v1";
export const LOUNGE_APPEARANCE_KEY = "amber-room:prototype:living-lounge:appearance:v1";
export type RugStyle = "claret" | "moss";

export function loungeReward(item: Item, level: number): string {
  const rewards = {
    bar: ["Stocked bar", "Pair of upholstered stools", "Stocked back-bar display"],
    machine: ["First additional cabinet", "Second additional cabinet", "Third additional cabinet"],
    decor: [
      "Woven rug · cosmetic only; no income",
      "Pair of planted brass planters · cosmetic only; no income",
      "Engraved brass nameplate · cosmetic only; no income",
    ],
  };
  return rewards[item][level - 1] ?? "";
}

export function createLoungeSave(nowMs: number) {
  return parseSave(exportSave({ ...createSave(nowMs), balance: 20000 }));
}

export function createLoungeStorage(
  storage: Pick<Storage, "getItem" | "setItem">,
  nowMs: number,
): Pick<Storage, "getItem" | "setItem"> {
  const checkKey = (key: string) => {
    if (key !== SAVE_KEY) throw new Error("Unexpected Living Lounge save key");
  };
  return {
    getItem(key) {
      checkKey(key);
      return storage.getItem(LOUNGE_SAVE_KEY) ?? exportSave(createLoungeSave(nowMs));
    },
    setItem(key, value) {
      checkKey(key);
      storage.setItem(LOUNGE_SAVE_KEY, value);
    },
  };
}

export function readRug(storage: Pick<Storage, "getItem">): { style: RugStyle; warning: string } {
  let raw: string | null;
  try {
    raw = storage.getItem(LOUNGE_APPEARANCE_KEY);
  } catch {
    return { style: "claret", warning: "Rug storage is unavailable. Appearance changes may not persist." };
  }
  if (raw === null) return { style: "claret", warning: "" };
  try {
    const appearance = JSON.parse(raw);
    if (appearance?.version !== 1 || (appearance.rug !== "claret" && appearance.rug !== "moss"))
      throw new Error("Invalid rug appearance");
    return { style: appearance.rug, warning: "" };
  } catch {
    return {
      style: "claret",
      warning: "Invalid rug appearance. Using Claret weave; stored preference left unchanged.",
    };
  }
}

export function writeRug(storage: Pick<Storage, "setItem">, style: RugStyle): { ok: boolean } {
  if (style !== "claret" && style !== "moss") return { ok: false };
  try {
    storage.setItem(LOUNGE_APPEARANCE_KEY, JSON.stringify({ version: 1, rug: style }));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function resetLounge(storage: Storage, nowMs: number): void {
  storage.setItem(LOUNGE_SAVE_KEY, exportSave(createLoungeSave(nowMs)));
  storage.setItem(LOUNGE_APPEARANCE_KEY, JSON.stringify({ version: 1, rug: "claret" }));
}
