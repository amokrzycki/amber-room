import { SaveOwner } from "./game/save";
import { accrueIncome } from "./game/business";
import { isPlaytest } from "./runtimeMode";
import { createLoungeSave, createLoungeStorage } from "../prototypes/living-lounge-state";
let storage: Pick<Storage, "getItem" | "setItem">;
try {
  storage = window.localStorage;
} catch {
  storage = {
    getItem() {
      throw new Error("storage unavailable");
    },
    setItem() {
      throw new Error("storage unavailable");
    },
  };
}
const nowMs = Date.now();
const loungeMode = isPlaytest();
export const owner = new SaveOwner(loungeMode ? createLoungeStorage(storage, nowMs) : storage, nowMs);
// Keep SaveOwner's storage warning and damaged-original protection while accelerating only an unavailable load.
if (loungeMode && owner.warning && owner.originalRaw === undefined) owner.state.save = createLoungeSave(nowMs);
export const number = (n: number) => n.toLocaleString("en-GB");
export function accrue(nowMs = Date.now()) {
  try {
    const save = accrueIncome(owner.state.save, nowMs);
    if (save !== owner.state.save) {
      owner.commit({ ...owner.state, save });
      window.dispatchEvent(new Event("salon-state"));
    }
  } catch (error) {
    owner.warning = error instanceof Error ? error.message : "Income could not be saved";
    window.dispatchEvent(new Event("salon-state"));
  }
}
