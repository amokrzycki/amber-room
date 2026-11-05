import { expect, it, vi } from "vitest";
import { drawCabinet } from "../src/view/cabinet";

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
    [0, 536, 1530, 244],
    [0, 104, 256, 432],
    [1276, 104, 254, 432],
  ]);
});
