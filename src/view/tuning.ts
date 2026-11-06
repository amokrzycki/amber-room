// Reel window in scene coordinates: 1286 of the cabinet's 1508px face (85.3%), five equal columns, three rows.
const colW = 254;
const colGap = 4;
const rowGap = 156;
export const reelWindow = {
  x: 157,
  y: 209,
  colW,
  colGap,
  rowGap,
  w: 5 * colW + 4 * colGap,
  h: 3 * rowGap,
  // Sprites are cropped 2px above and 1px below the aperture so they tuck under the gasket.
  clipTop: 209 - 2,
  clipBottom: 209 + 3 * rowGap + 1,
};
export const tuning = {
  width: 1600,
  height: 900,
  reelX: reelWindow.x + colW / 2,
  reelY: reelWindow.y + rowGap / 2,
  reelGap: colW + colGap,
  rowGap,
  symbol: 184,
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
