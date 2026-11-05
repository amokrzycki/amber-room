import { expect, it, vi } from "vitest";
import { cabinetCrops, drawCabinet } from "../src/view/cabinet";
import { reelWindow, tuning } from "../src/view/tuning";

it("bakes the cabinet once across scene visits and places it without moving the reel coordinate system", () => {
  const context: any = {};
  for (const method of [
    "translate",
    "beginPath",
    "roundRect",
    "fill",
    "moveTo",
    "lineTo",
    "stroke",
    "arc",
    "save",
    "restore",
    "rotate",
    "bezierCurveTo",
  ])
    context[method] = vi.fn();
  context.createLinearGradient = () => ({ addColorStop() {} });
  const refresh = vi.fn();
  const keys = new Set();
  const createCanvas = vi.fn((key) => {
    keys.add(key);
    return { getContext: () => context, refresh };
  });
  const setCrop = vi.fn();
  const image = vi.fn(() => ({ setOrigin: () => ({ setCrop }) }));
  const field: any = {};
  for (const method of ["fillStyle", "fillRect", "fillGradientStyle", "lineStyle", "lineBetween"])
    field[method] = vi.fn().mockReturnValue(field);
  const textures = { exists: (key: string) => keys.has(key), createCanvas };
  const scene: any = { textures, add: { image, graphics: () => field } };
  drawCabinet(scene);
  const painted = context.fill.mock.calls.length;
  for (let visit = 0; visit < 12; visit++) drawCabinet({ ...scene } as any);
  expect(createCanvas).toHaveBeenCalledExactlyOnceWith("orchard-cabinet", 1530, 780);
  expect(refresh).toHaveBeenCalledOnce();
  expect(context.fill.mock.calls.length).toBe(painted);
  expect(image).toHaveBeenCalledTimes(52);
  expect(image).toHaveBeenLastCalledWith(35, 105, "orchard-cabinet");
  expect(setCrop.mock.calls.slice(0, 4)).toEqual([
    [0, 0, 1530, 104],
    [0, 572, 1530, 208],
    [0, 104, 122, 468],
    [1408, 104, 122, 468],
  ]);
});

it("keeps the reel aperture, columns and clip bounds on one geometry, 85% of the cabinet face", () => {
  const w = reelWindow;
  expect(w.w).toBe(1286);
  expect(w.w / 1508).toBeGreaterThanOrEqual(0.85);
  expect(w.x + w.w / 2).toBe(800);
  expect(w.h).toBe(3 * tuning.rowGap);
  expect(tuning.reelGap).toBe(w.colW + w.colGap);
  expect(tuning.reelX + 4 * tuning.reelGap + w.colW / 2).toBe(w.x + w.w);
  expect(tuning.reelY - tuning.rowGap / 2).toBe(w.y);
  // The textured quads leave exactly the aperture bare, with no gap or overlap.
  const [top, bottom, left, right] = cabinetCrops;
  expect(105 + top[3]).toBe(w.y);
  expect(105 + bottom[1]).toBe(w.y + w.h);
  expect(35 + left[2]).toBe(w.x);
  expect(35 + right[0]).toBe(w.x + w.w);
  expect(w.clipTop).toBeLessThan(w.y);
  expect(w.clipBottom).toBeGreaterThan(w.y + w.h);
  // Symbols stay square and fit a row with a visible gap (sprite art fills ~81% of its frame).
  expect(tuning.symbol * 0.82).toBeLessThan(tuning.rowGap);
  expect(tuning.symbol).toBeLessThanOrEqual(w.colW);
});
