import type Phaser from "phaser";
import { classifyWin, celebrationDuration } from "../game/feedback";
import type { SaveV1, SpinRecord } from "../game/model";
import { reelWindow as win } from "./tuning";
export function playWin(scene: Phaser.Scene, spin: SpinRecord, settings: SaveV1["settings"]) {
  const tier = classifyWin(spin.totalStake, spin.outcome.payout);
  const strength = settings.effectsIntensity;
  const frame = scene.add.graphics();
  if ((tier === "big" || tier === "jackpot") && strength > 0) {
    frame.lineStyle(4, 0xd8af55, 0.4 * strength).strokeRoundedRect(win.x - 28, win.y - 17, win.w + 56, win.h + 32, 22);
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
    resolve();
  };
  const timer = scene.time.delayedCall(
    settings.reducedMotion ? 900 : tier === "neutral" && spin.outcome.payout > 0 ? 900 : celebrationDuration(tier),
    skip,
  );
  return { done, skip, dispose: skip };
}
