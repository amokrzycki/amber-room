import type { SpinRecord } from "../game/model";
import { machine } from "../game/machine";
import { assetUrls } from "./assets";
import { symbolNames } from "./spinResult";

/** Inspect a saved result in its own diagram; never repaint the live machine. */
export function showResultDetails(dialog: HTMLDialogElement, spin: SpinRecord) {
  const wins = spin.outcome.lineWins;
  if (!wins.length) return;
  const body = dialog.querySelector(".dialog-body")!;
  dialog.classList.add("result-dialog");
  dialog.setAttribute("aria-labelledby", "result-title");
  body.innerHTML = `<h2 id="result-title">Win details</h2><p>Stake ${spin.totalStake.toLocaleString("en-GB")} · Returned ${spin.outcome.payout.toLocaleString("en-GB")} · ${wins.length} winning line${wins.length === 1 ? "" : "s"}</p><div class="result-layout"><div><div class="result-diagram" role="group" aria-label="Result reels, five columns and three rows">${spin.outcome.grid.map((column, c) => column.map((symbol, r) => `<div class="result-cell" data-column="${c}" data-row="${r}"><img src="${assetUrls[symbol]}" alt="${symbolNames[symbol]}" width="64" height="64"><span class="sr-only">Column ${c + 1}, row ${r + 1}</span></div>`).join("")).join("")}<svg viewBox="0 0 500 240" aria-hidden="true"><polyline class="result-path"/><polyline class="result-tail"/></svg></div><p class="result-selection" aria-live="polite" aria-atomic="true"></p></div><div class="win-list" role="group" aria-label="Winning lines">${wins.map((w) => `<button type="button" data-line="${w.lineIndex}" data-payout="${w.payout}" aria-pressed="false"><b>Line ${w.lineIndex + 1}</b><span>${symbolNames[w.symbol]} ×${w.count}</span><em>${w.payout.toLocaleString("en-GB")}</em></button>`).join("")}</div></div>`;
  const buttons = Array.from(body.querySelectorAll<HTMLButtonElement>(".win-list button"));
  const select = (index: number) => {
    const win = wins[index];
    const path = machine.paylines[win.lineIndex];
    buttons.forEach((button, i) => {
      button.setAttribute("aria-pressed", String(i === index));
    });
    body.querySelectorAll<HTMLElement>(".result-cell").forEach((cell) => {
      const c = Number(cell.dataset.column),
        r = Number(cell.dataset.row);
      cell.dataset.winning = String(c < win.count && path[c] === r);
    });
    const points = path.map((row, c) => `${50 + c * 100},${40 + row * 80}`);
    body.querySelector(".result-path")!.setAttribute("points", points.slice(0, win.count).join(" "));
    body.querySelector(".result-tail")!.setAttribute("points", points.slice(win.count - 1).join(" "));
    body.querySelector(".result-selection")!.textContent =
      `Line ${win.lineIndex + 1} · ${symbolNames[win.symbol]} ×${win.count} · ${win.payout.toLocaleString("en-GB")} tokens. Rows ${path.map((r) => r + 1).join("–")}; first ${win.count} reels pay. Dots mark the paying symbols; WILD keeps its own identity.`;
  };
  buttons.forEach((button, i) => {
    button.addEventListener("click", () => select(i));
    button.addEventListener("keydown", (event) => {
      let next = i;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (i + 1) % wins.length;
      else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (i + wins.length - 1) % wins.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = wins.length - 1;
      else return;
      event.preventDefault();
      select(next);
      buttons[next].focus();
    });
  });
  select(0);
  const trapFocus = (event: KeyboardEvent) => {
    if (event.key !== "Tab") return;
    const controls = [dialog.querySelector<HTMLButtonElement>(".close")!, ...buttons];
    const first = controls[0],
      last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  dialog.addEventListener("keydown", trapFocus);
  dialog.addEventListener(
    "close",
    () => {
      dialog.removeEventListener("keydown", trapFocus);
      dialog.classList.remove("result-dialog");
      dialog.removeAttribute("aria-labelledby");
    },
    { once: true },
  );
  dialog.showModal();
  buttons[0].focus();
}
