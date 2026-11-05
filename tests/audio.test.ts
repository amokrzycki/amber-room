import { afterEach, expect, it, vi } from "vitest";
import { audioMix, createAudio } from "../src/view/audio";

function rig(locked = false) {
  vi.stubGlobal("document", { hidden: false });
  const sounds = new Map<string, any>();
  const tweens: any[] = [];
  const scene: any = {
    sound: {
      locked,
      unlock() {
        this.locked = false;
      },
      context: { state: "running", resume: vi.fn() },
      add(name: string) {
        const sound = {
          volume: 0,
          rate: 1,
          isPlaying: false,
          play: vi.fn(function (this: any) {
            this.isPlaying = true;
          }),
          stop: vi.fn(function (this: any) {
            this.isPlaying = false;
          }),
          destroy: vi.fn(),
          setVolume(v: number) {
            this.volume = v;
          },
          setRate(v: number) {
            this.rate = v;
          },
        };
        sounds.set(name, sound);
        return sound;
      },
    },
    tweens: { add: (config: any) => tweens.push(config), killTweensOf: vi.fn() },
  };
  return { scene, sounds, tweens };
}
afterEach(() => {
  audioMix.music = 0.6;
  audioMix.effects = 0.7;
  vi.unstubAllGlobals();
});
it("routes independent session gains and ducking without overwriting the music level", () => {
  const { scene, sounds, tweens } = rig();
  const audio = createAudio(scene);
  audio.setVolume("music", 0.5);
  audio.setVolume("effects", 0.4);
  expect(sounds.get("press").volume).toBeCloseTo(0.3 * 0.4 ** 2);
  audio.duck(true);
  const duck = tweens.at(-1);
  duck.targets.duck = duck.duck;
  duck.onUpdate();
  expect(sounds.get("salon-ambience").volume).toBeCloseTo(0.1 * 0.5 ** 2 * 0.3);
  expect(audioMix.music).toBe(0.5);
  audio.setVolume("effects", 0);
  expect(sounds.get("press").volume).toBe(0);
  audio.dispose();
});
it("ramps reel gain/rate, plays five separate stops and cleans up every sound", () => {
  const { scene, sounds, tweens } = rig();
  const audio = createAudio(scene, false);
  audio.startReels();
  const ramp = tweens.at(-1);
  ramp.targets.reels = 1;
  ramp.onUpdate();
  expect(sounds.get("reels").rate).toBe(1);
  for (let reel = 0; reel < 5; reel++) audio.reelStopped();
  expect(sounds.get("stop-a").play).toHaveBeenCalledTimes(2);
  expect(sounds.get("stop-b").play).toHaveBeenCalledTimes(2);
  expect(sounds.get("stop-c").play).toHaveBeenCalledOnce();
  expect(sounds.get("reels").volume).toBe(0);
  audio.silence();
  audio.dispose();
  audio.play("big");
  expect(sounds.get("win-big").play).not.toHaveBeenCalled();
  for (const sound of sounds.values()) expect(sound.destroy).toHaveBeenCalledOnce();
});
it("does not replay an asynchronous audio unlock after silence or scene destruction", async () => {
  for (const destroy of [false, true]) {
    const { scene, sounds } = rig(true);
    let resume!: () => void;
    scene.sound.context = {
      state: "suspended",
      resume: () =>
        new Promise<void>((r) => {
          resume = r;
        }),
    };
    const audio = createAudio(scene);
    const unlock = audio.unlock();
    expect(audio.unlock()).toBe(unlock);
    if (destroy) audio.dispose();
    else audio.silence();
    resume();
    await unlock;
    expect(sounds.get("salon-ambience").play).not.toHaveBeenCalled();
  }
});
