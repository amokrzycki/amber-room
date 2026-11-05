export const tuning = {
  width: 1600,
  height: 900,
  reelX: 390,
  reelY: 280,
  reelGap: 205,
  rowGap: 145,
  acceleration: 180,
  cruise: 500,
  braking: 420,
  stagger: 120,
  settling: 100,
  counter: 320,
};

// Integrate a smoothstep velocity: no velocity or acceleration jump at the joins.
export function reelEase(progress: number, duration: number) {
  const a = tuning.acceleration / duration;
  const b = tuning.braking / duration;
  const area = 1 - (a + b) / 2;
  if (progress < a) {
    const u = progress / a;
    return (a * (u ** 3 - u ** 4 / 2)) / area;
  }
  if (progress <= 1 - b) return (progress - a / 2) / area;
  const u = (1 - progress) / b;
  return 1 - (b * (u ** 3 - u ** 4 / 2)) / area;
}
