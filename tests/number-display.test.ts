import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NumberDisplay } from "../src/view/NumberDisplay";
let now = 0;
let next = 0;
let frames: Map<number, FrameRequestCallback>;
const advance = (time: number) => {
  now = time;
  const callbacks = [...frames.values()];
  frames.clear();
  callbacks.forEach((callback) => {
    callback(time);
  });
};
beforeEach(() => {
  now = next = 0;
  frames = new Map();
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++next, callback);
    return next;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("completes integer win, loss, break-even and large counters at the exact target", () => {
  for (const target of [1015, 995, 1000, Number.MAX_SAFE_INTEGER]) {
    const render = vi.fn();
    const counter = new NumberDisplay(1000, render);
    counter.to(target, false);
    advance(now + 160);
    expect(render.mock.calls.every(([value]) => Number.isSafeInteger(value))).toBe(true);
    advance(now + 160);
    if (target !== 1000) expect(render).toHaveBeenLastCalledWith(target);
    expect(frames.size).toBe(0);
  }
});
it("interrupts from the displayed value, ignores duplicate refresh and cancels stale frames", () => {
  const render = vi.fn();
  const counter = new NumberDisplay(1000, render);
  counter.to(1200, false);
  advance(160);
  const middle = render.mock.lastCall?.[0];
  counter.to(900, false);
  counter.to(900, false);
  expect(frames.size).toBe(1);
  advance(240);
  expect(render.mock.lastCall?.[0]).toBeLessThan(middle);
  counter.finish();
  expect(render).toHaveBeenLastCalledWith(900);
  expect(frames.size).toBe(0);
  counter.to(950, false);
  counter.dispose();
  expect(frames.size).toBe(0);
});
it("reduced motion jumps to the final value, including a preference changed mid-animation", () => {
  const render = vi.fn();
  const counter = new NumberDisplay(0, render);
  counter.to(13055, true);
  expect(render).toHaveBeenLastCalledWith(13055);
  expect(frames.size).toBe(0);
  counter.to(-200, false);
  advance(80);
  counter.to(-200, true);
  expect(render).toHaveBeenLastCalledWith(-200);
  expect(frames.size).toBe(0);
});
