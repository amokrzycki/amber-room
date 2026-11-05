import type Phaser from "phaser";
import type { LineWin } from "../game/model";
import { machine } from "../game/machine";
import { reelWindow as win, tuning as t } from "./tuning";

const cellCenter = (column: number, row: number) => [t.reelX + column * t.reelGap, t.reelY + row * t.rowGap] as const;
/** Beyond this many winning cells a faint outline on every one is noise; only the focused line is marked. */
const BUSY = 9;

/**
 * Static, persistent marks for a settled spin: the focused line's path and cells, plus faint outlines on
 * every other winning cell. Purely presentational; the amounts live in the HUD and the win details.
 */
export function createWinMarks(scene: Phaser.Scene) {
  const g = scene.add.graphics();
  const box = (column: number, row: number, alpha: number, width: number) => {
    const [x, y] = cellCenter(column, row);
    g.lineStyle(width, 0x35e6d1, alpha).strokeRoundedRect(
      x - (win.colW - 20) / 2,
      y - (win.rowGap - 16) / 2,
      win.colW - 20,
      win.rowGap - 16,
      12,
    );
  };
  return {
    show(wins: LineWin[], focus: LineWin | undefined = [...wins].sort((a, b) => b.payout - a.payout)[0]) {
      g.clear();
      if (!focus) return;
      const cells = new Set<string>();
      for (const w of wins) for (let c = 0; c < w.count; c++) cells.add(`${c},${machine.paylines[w.lineIndex][c]}`);
      if (cells.size <= BUSY)
        for (const key of cells) {
          const [c, r] = key.split(",").map(Number);
          box(c, r, 0.22, 1.5);
        }
      const path = machine.paylines[focus.lineIndex];
      g.lineStyle(2, 0x35e6d1, 0.3).beginPath();
      path.forEach((row, c) => {
        const [x, y] = cellCenter(c, row);
        if (c === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      });
      g.strokePath();
      for (let c = 0; c < focus.count; c++) box(c, path[c], 0.55, 2);
    },
    clear: () => {
      g.clear();
    },
    dispose: () => {
      g.destroy();
    },
  };
}
