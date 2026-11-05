import { spin } from "../game/engine";
import { machine } from "../game/machine";
import { classifyWin } from "../game/feedback";
import { owner } from "../runtime";
export function installScenarios(root: HTMLElement, start: (stops: number[]) => void) {
  const panel = document.createElement("div");
  panel.className = "dev-tools";
  panel.dataset.testid = "dev-scenarios";
  for (const tier of ["neutral", "small", "big", "jackpot"] as const) {
    const button = document.createElement("button");
    button.textContent = `DEV ${tier}`;
    button.onclick = () => {
      if (owner.state.phase !== "ready") return;
      for (let n = 0; n < 12 ** 5; n++) {
        let k = n;
        const stops = Array.from({ length: 5 }, () => {
          const v = k % 12;
          k = Math.floor(k / 12);
          return v;
        });
        let i = 0;
        const bet = owner.state.save.selectedBet;
        const result = spin(machine, bet, () => stops[i++]);
        if (classifyWin(bet.lineCount * bet.perLine, result.payout) === tier) {
          start(stops);
          return;
        }
      }
    };
    panel.append(button);
  }
  root.append(panel);
}
