import { expect, it } from "vitest";
import { ReelView } from "../src/view/ReelView";

function renderer() {
  const active = new Set<any>(),
    images: any[] = [],
    tweens: any[] = [],
    containers: any[] = [];
  const scene: any = {
    add: {
      container(x = 0, y = 0) {
        const container = {
          x,
          y,
          list: [] as any[],
          add(items: any) {
            this.list.push(...(Array.isArray(items) ? items : [items]));
            return this;
          },
          setMask() {
            return this;
          },
          removeAll() {
            this.list = [];
          },
          destroy() {},
        };
        containers.push(container);
        return container;
      },
      image(x: number, y: number, key: string) {
        const image = {
          x,
          y,
          width: 512,
          height: 512,
          alpha: 1,
          scaleX: 1,
          scaleY: 1,
          visible: true,
          crop: undefined as number[] | undefined,
          texture: { key },
          get displayHeight() {
            return this.height * this.scaleY;
          },
          setDisplaySize(w: number, h: number) {
            this.scaleX = w / this.width;
            this.scaleY = h / this.height;
            return this;
          },
          setCrop(x: number, y: number, w: number, h: number) {
            this.crop = [x, y, w, h];
            return this;
          },
          setVisible(v: boolean) {
            this.visible = v;
            return this;
          },
          setAlpha(a: number) {
            this.alpha = a;
            return this;
          },
        };
        images.push(image);
        return image;
      },
    },
    make: {
      graphics() {
        return {
          fillStyle() {
            return this;
          },
          fillRect() {
            return this;
          },
          createGeometryMask() {
            return { destroy() {} };
          },
          destroy() {},
        };
      },
    },
    tweens: {
      add(config: any) {
        tweens.push(config);
        active.add(config.targets);
        if (config.alpha !== undefined) config.targets.alpha = config.alpha;
        return {
          stop() {
            active.delete(config.targets);
          },
        };
      },
      killTweensOf(target: any) {
        active.delete(target);
      },
    },
  };
  return { scene, active, images, tweens, containers };
}

it("clears all symbol effects and restores rest state immediately", () => {
  const { scene, active, images } = renderer();
  const reel = new ReelView(scene, 0, ["cherry", "lemon", "plum"]);
  reel.highlight([0], 0.4, false);
  expect(active.size).toBeGreaterThan(0);
  reel.clearHighlight();
  expect(active.size).toBe(0);
  expect(images[0].alpha).toBe(1);
  expect(images[0].scaleX).toBe(168 / 512);
});

it("clips visible pixels to the reel window throughout motion and restores the final column", async () => {
  const { scene, tweens, containers } = renderer();
  const reel = new ReelView(scene, 2, ["cherry", "lemon", "plum"]);
  const done = reel.play(["wild", "seven", "melon"], 220);
  const tween = tweens[0],
    moving = containers[1];
  for (const offset of [0, -10, -100, -350, -840, -1200, tween.y]) {
    moving.y = offset;
    tween.onUpdate?.();
    const visible = moving.list.filter((image: any) => image.visible);
    expect(visible.length).toBeGreaterThan(0);
    for (const image of visible) {
      const crop = image.crop ?? [0, 0, image.width, image.height];
      const top = image.y + offset - image.displayHeight / 2 + crop[1] * image.scaleY;
      expect(top).toBeGreaterThanOrEqual(207);
      expect(top + crop[3] * image.scaleY).toBeLessThanOrEqual(642);
    }
  }
  tween.onComplete();
  await done;
  expect(containers[0].list.map((image: any) => image.texture.key)).toEqual(["wild", "seven", "melon"]);
  reel.dispose();
});
