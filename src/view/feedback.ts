import type Phaser from "phaser";
import { classifyWin, celebrationDuration } from "../game/feedback";
import type { SaveV1, SpinRecord } from "../game/model";
import { tuning as t } from "./tuning";
export function playWin(scene: Phaser.Scene, spin: SpinRecord, settings: SaveV1["settings"]) {
  const tier = classifyWin(spin.totalStake, spin.outcome.payout);
  const strength = settings.effectsIntensity;
  const lines = scene.add.graphics();
  const frame = scene.add.graphics();
  if (strength > 0) {
    for (const w of [...spin.outcome.lineWins].sort((a, b) => b.payout - a.payout).slice(0, 1)) {
      const path = scene.registry.get("paylines")[w.lineIndex] as number[];
      lines.lineStyle(1.5, 0x35e6d1, 0.24 * strength).beginPath();
      path.forEach((row, i) => {
        if (i === 0) lines.moveTo(t.reelX, t.reelY + row * t.rowGap);
        else lines.lineTo(t.reelX + i * t.reelGap, t.reelY + row * t.rowGap);
      });
      lines.strokePath();
      for (let i = 0; i < w.count; i++)
        lines
          .lineStyle(2, 0x35e6d1, 0.45 * strength)
          .strokeRoundedRect(t.reelX + i * t.reelGap - 94, t.reelY + path[i] * t.rowGap - 68, 188, 136, 10);
    }
  }
  if ((tier === "big" || tier === "jackpot") && strength > 0) {
    frame.lineStyle(4, 0xd8af55, 0.4 * strength).strokeRoundedRect(263, 192, 1075, 464, 22);
    if (!settings.reducedMotion)
      scene.tweens.add({ targets: frame, alpha: 0.45, duration: 1100, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }
  let finished = false;
  let resolve!: () => void;
  const done = new Promise<void>((r) => {
    resolve = r;
  });
  const skip = () => {
    if (finished) return;
    finished = true;
    timer.remove(false);
    scene.tweens.killTweensOf(frame);
    frame.destroy();
    lines.destroy();
    resolve();
  };
  const timer = scene.time.delayedCall(
    settings.reducedMotion ? 900 : tier === "neutral" && spin.outcome.payout > 0 ? 900 : celebrationDuration(tier),
    skip,
  );
  return { done, skip, dispose: skip };
}
