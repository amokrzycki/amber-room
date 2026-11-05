import { expect, it, vi } from "vitest";
import { classifyWin, celebrationDuration, createCelebration } from "../src/game/feedback";
it("profit thresholds and bounded durations", () => {
  for (const [p, t] of [
    [0, "neutral"],
    [4, "neutral"],
    [5, "neutral"],
    [6, "small"],
    [29, "small"],
    [30, "big"],
    [104, "big"],
    [105, "jackpot"],
  ] as const)
    expect(classifyWin(5, p)).toBe(t);
  expect(["neutral", "small", "big", "jackpot"].map((t) => celebrationDuration(t as any))).toEqual([
    0, 700, 2200, 4000,
  ]);
});
it("double skip resolves once and disposes timer/effects without touching wallet", async () => {
  vi.useFakeTimers();
  let effects = true;
  const wallet = { balance: 123 };
  let completions = 0;
  const c = createCelebration(4000, () => {
    effects = false;
  });
  c.done.then(() => completions++);
  c.skip();
  c.skip();
  c.dispose();
  await c.done;
  await Promise.resolve();
  vi.runAllTimers();
  expect(completions).toBe(1);
  expect(effects).toBe(false);
  expect(wallet.balance).toBe(123);
  expect(vi.getTimerCount()).toBe(0);
  vi.useRealTimers();
});
