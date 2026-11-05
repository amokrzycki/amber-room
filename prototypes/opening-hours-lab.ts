import { createSave, parseSave, SAVE_KEY } from "../src/game/save";
import { hourlyIncome } from "../src/game/business";
import {
  accruePrototype,
  attendPrototype,
  migratePrototype,
  openingHours,
  parsePrototype,
  PROTOTYPE_SAVE_KEY,
  type OpeningMode,
} from "./opening-hours";
const q = <T extends HTMLElement>(selector: string) => document.querySelector(selector) as T;
let state = migratePrototype(createSave(0), "standard");
try {
  const raw = localStorage.getItem(PROTOTYPE_SAVE_KEY);
  if (raw) state = parsePrototype(raw);
} catch (error) {
  q("#error").textContent = String(error);
}
let now = state.save.lastAccrualAtMs;
function render() {
  const config = openingHours[state.mode];
  q("#balance").textContent = state.save.balance.toLocaleString("en-GB");
  q("#rate").textContent = `${state.mode} · ${hourlyIncome(state.save.businesses) * config.multiplier} tokens/hour`;
  q("#budget").textContent = `${state.creditedMs / 3600000} / ${config.capHours} hours`;
  q("#clock").textContent = (now / 3600000).toLocaleString("en-GB");
  q<HTMLSelectElement>("#mode").value = state.mode;
}
function store() {
  try {
    localStorage.setItem(PROTOTYPE_SAVE_KEY, JSON.stringify(state));
    q("#error").textContent = "";
  } catch (error) {
    q("#error").textContent = `Lab progress is in memory only: ${String(error)}`;
  }
  render();
}
document.querySelectorAll<HTMLButtonElement>("[data-hours]").forEach((button) => {
  button.addEventListener("click", () => {
    now = Math.max(0, now + Number(button.dataset.hours) * 3600000);
    state = accruePrototype(state, now);
    store();
  });
});
q("#attend").addEventListener("click", (event) => {
  if (!event.isTrusted) return;
  state = attendPrototype(state, now, q<HTMLSelectElement>("#mode").value as OpeningMode);
  store();
});
q("#reset").addEventListener("click", () => {
  state = migratePrototype(createSave(0), "standard");
  now = 0;
  store();
});
q("#copy").addEventListener("click", () => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) throw Error("No production save exists on this origin. Start the normal game first.");
    now = Date.now();
    state = migratePrototype(parseSave(raw), q<HTMLSelectElement>("#mode").value as OpeningMode, now);
    store();
  } catch (error) {
    q("#error").textContent = String(error);
  }
});
render();
