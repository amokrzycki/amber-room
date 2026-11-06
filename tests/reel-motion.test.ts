import { expect, it } from "vitest";
import { reelEase, tuning } from "../src/view/tuning";

it("accelerates, cruises and brakes continuously at 30/60/120/165 Hz with exact endpoints", () => {
  for (let reel = 0; reel < 5; reel++) {
    const duration = tuning.acceleration + tuning.cruise + tuning.braking + reel * tuning.stagger;
    expect(reelEase(0, duration)).toBe(0);
    expect(reelEase(1, duration)).toBe(1);
    for (const hz of [30, 60, 120, 165]) {
      let previous = 0;
      for (let elapsed = 0; elapsed <= duration; elapsed += 1000 / hz) {
        const position = reelEase(elapsed / duration, duration);
        expect(position).toBeGreaterThanOrEqual(previous);
        expect(position).toBeLessThanOrEqual(1);
        previous = position;
      }
    }
    const velocity = (ms: number) =>
      (reelEase((ms + 0.1) / duration, duration) - reelEase(ms / duration, duration)) / 0.1;
    expect(velocity(1)).toBeLessThan(velocity(80));
    expect(velocity(300)).toBeCloseTo(velocity(500), 8);
    expect(velocity(duration - 80)).toBeGreaterThan(velocity(duration - 1));
    for (const join of [tuning.acceleration, duration - tuning.braking])
      expect(velocity(join - 0.2)).toBeCloseTo(velocity(join + 0.2), 7);
  }
});
