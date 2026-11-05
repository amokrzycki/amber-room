import Phaser from "phaser";
import type { LineWin } from "../game/model";
import { machine } from "../game/machine";
import { reelWindow as win, tuning as t } from "./tuning";

const cellCenter = (column: number, row: number) => [t.reelX + column * t.reelGap, t.reelY + row * t.rowGap] as const;
/** Beyond this many winning cells a faint plate on every one is noise; only the focused line is marked. */
const BUSY = 9;
const PLATE = "win-plate";
// Inset from the 254x156 cell so the feather stays clear of the column dividers and the window edge.
const PLATE_W = win.colW - 14;
const PLATE_H = win.rowGap - 16;
const FEATHER = 16;
/** Line path: mint is the app's selection colour and matches the "winning line" link that drives the preview. */
const PATH = 0x35e6d1;

/** A feathered plate, baked once: nested rounded rectangles of rising alpha, so there is no edge to outline. */
function bakePlate(scene: Phaser.Scene) {
  if (scene.textures.exists(PLATE)) return;
  const texture = scene.textures.createCanvas(PLATE, PLATE_W, PLATE_H)!;
  const ctx = texture.getContext();
  ctx.fillStyle = "#f2c872";
  ctx.globalAlpha = 1 / FEATHER;
  for (let inset = 0; inset < FEATHER; inset++) {
    ctx.beginPath();
    ctx.roundRect(inset, inset, PLATE_W - inset * 2, PLATE_H - inset * 2, Math.max(8, 26 - inset));
    ctx.fill();
  }
  texture.refresh();
}

/**
 * Persistent marks for a settled spin, drawn behind the symbols: a soft plate under each winning cell and the
 * focused payline threaded between them. Nothing is stroked around a symbol, so symbol art (including WILD's own
 * gold border) keeps its identity; opaque tiles simply sit in front of the thread. Create it before the reels.
 */
export function createWinMarks(scene: Phaser.Scene) {
  bakePlate(scene);
  const layer = scene.add.container(0, 0);
  const g = scene.add.graphics();
  layer.add(g);
  let plates: Phaser.GameObjects.Image[] = [];
  const clear = () => {
    g.clear();
    for (const plate of plates) plate.destroy();
    plates = [];
  };
  const plate = (column: number, row: number, alpha: number) => {
    const [x, y] = cellCenter(column, row);
    // ADD reads as light falling on the reel well rather than a brown pad laid over it.
    const image = scene.add.image(x, y, PLATE).setAlpha(alpha).setBlendMode(Phaser.BlendModes.ADD);
    layer.addAt(image, 0);
    plates.push(image);
  };
  return {
    show(wins: LineWin[], focus: LineWin | undefined = [...wins].sort((a, b) => b.payout - a.payout)[0]) {
      clear();
      if (!focus) return;
      const path = machine.paylines[focus.lineIndex];
      const onFocus = new Set<string>();
      for (let c = 0; c < focus.count; c++) onFocus.add(`${c},${path[c]}`);
      const others = new Set<string>();
      for (const w of wins)
        for (let c = 0; c < w.count; c++) {
          const key = `${c},${machine.paylines[w.lineIndex][c]}`;
          if (!onFocus.has(key)) others.add(key);
        }
      if (onFocus.size + others.size <= BUSY)
        for (const key of others) {
          const [c, r] = key.split(",").map(Number);
          plate(c, r, 0.16);
        }
      for (const key of onFocus) {
        const [c, r] = key.split(",").map(Number);
        plate(c, r, 0.3);
      }
      const trace = (from: number, to: number, width: number, alpha: number) => {
        g.lineStyle(width, PATH, alpha).beginPath();
        for (let c = from; c <= to; c++) {
          const [x, y] = cellCenter(c, path[c]);
          if (c === from) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.strokePath();
      };
      if (focus.count < 5) trace(focus.count - 1, 4, 2, 0.16);
      trace(0, focus.count - 1, 3, 0.5);
    },
    clear,
    dispose: () => {
      clear();
      layer.destroy();
    },
  };
}
