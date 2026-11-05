import type Phaser from "phaser";
import type { SymbolId } from "../game/model";
import { machine } from "../game/machine";
import { reelEase, tuning as t } from "./tuning";
export class ReelView {
  private images: Phaser.GameObjects.Image[] = [];
  private container: Phaser.GameObjects.Container;
  private moving: Phaser.GameObjects.Container | undefined;
  private tween: Phaser.Tweens.Tween | undefined;
  private resolve: (() => void) | undefined;
  private target: SymbolId[] | undefined;
  constructor(
    private scene: Phaser.Scene,
    private index: number,
    column: SymbolId[],
  ) {
    this.container = scene.add.container(t.reelX + index * t.reelGap, 0);
    this.show(column);
  }
  show(column: SymbolId[]) {
    this.container.removeAll(true);
    this.images = column.map((symbol, row) =>
      this.scene.add.image(0, t.reelY + row * t.rowGap, symbol).setDisplaySize(168, 168),
    );
    this.container.add(this.images);
    this.clip(this.images);
  }
  private clip(images: Phaser.GameObjects.Image[], offset = 0) {
    for (const image of images) {
      const top = image.y + offset - image.displayHeight / 2;
      const from = Math.max(0, Math.ceil((207 - top) / image.scaleY));
      const to = Math.min(image.height, Math.floor((642 - top) / image.scaleY));
      image.setVisible(to > from);
      if (to > from) image.setCrop(0, from, image.width, to - from);
    }
  }
  play(column: SymbolId[], delayMs: number, stop = 0, reduced = false, onStop?: () => void): Promise<void> {
    this.cancel();
    if (reduced) {
      this.show(column);
      return Promise.resolve();
    }
    this.target = column;
    const count = 10 + this.index * 2;
    const strip = machine.reels[this.index];
    this.moving = this.scene.add.container(0, 0);
    this.container.add(this.moving);
    for (let row = 0; row < count + 3; row++) {
      const symbol =
        row >= count
          ? column[row - count]
          : row < 3
            ? this.images[row].texture.key
            : strip[(stop + row - count + strip.length * 3) % strip.length];
      this.moving.add(this.scene.add.image(0, t.reelY + row * t.rowGap, symbol).setDisplaySize(168, 168));
    }
    this.images.forEach((im) => {
      im.setVisible(false);
    });
    this.clip(this.moving.list as Phaser.GameObjects.Image[]);
    const total = t.acceleration + t.cruise + delayMs + t.braking;
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.tween = this.scene.tweens.add({
        targets: this.moving,
        y: -count * t.rowGap - 2,
        duration: total,
        ease: (p: number) => reelEase(p, total),
        onUpdate: () => {
          if (this.moving) this.clip(this.moving.list as Phaser.GameObjects.Image[], this.moving.y);
        },
        onComplete: () => {
          onStop?.();
          this.tween = this.scene.tweens.add({
            targets: this.moving,
            y: -count * t.rowGap,
            duration: t.settling,
            ease: "Cubic.easeOut",
            onUpdate: () => {
              if (this.moving) this.clip(this.moving.list as Phaser.GameObjects.Image[], this.moving.y);
            },
            onComplete: () => this.finish(),
          });
        },
      });
    });
  }
  clearHighlight() {
    for (const image of this.images) {
      this.scene.tweens.killTweensOf(image);
      image.setAlpha(1).setDisplaySize(168, 168);
    }
  }
  cancel() {
    this.clearHighlight();
    this.tween?.stop();
    this.tween = undefined;
    this.moving?.destroy();
    this.moving = undefined;
    this.images.forEach((im) => {
      im.setVisible(true);
    });
    this.resolve?.();
    this.resolve = undefined;
    this.target = undefined;
  }
  finish() {
    const column = this.target;
    this.cancel();
    if (column) this.show(column);
  }
  highlight(rows: number[], intensity: number, reduced: boolean) {
    if (intensity <= 0) return;
    if (reduced) return;
    for (const row of rows) {
      const im = this.images[row];
      this.scene.tweens.add({
        targets: im,
        alpha: 1 - 0.12 * intensity,
        duration: 500,
        yoyo: true,
        ease: "Sine.easeInOut",
      });
    }
  }
  dispose() {
    this.cancel();
    this.container.destroy();
  }
}
