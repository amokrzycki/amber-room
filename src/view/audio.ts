import type Phaser from "phaser";

// Session preferences: the version 1 save and exported backups stay unchanged.
export const audioMix = { music: 0.6, effects: 0.7 };
export function createAudio(scene: Phaser.Scene, ambience = true) {
  const clips = new Map<string, Phaser.Sound.WebAudioSound>();
  const levels = new Map<string, number>();
  const envelope = { reels: 0, duck: 1 };
  let stopped = 0,
    disposed = false,
    generation = 0;
  let unlocking: Promise<void> | undefined;
  const names = [
    "press",
    "reels",
    "stop-a",
    "stop-b",
    "stop-c",
    "payout-tick",
    "payout-end",
    "win-small",
    "win-big",
    "win-jackpot",
    "salon-ambience",
    "salon-cheer",
    "salon-toast",
  ];
  for (const name of names) {
    levels.set(name, name === "salon-ambience" ? 0.1 : name === "reels" ? 0.15 : 0.3);
    clips.set(
      name,
      scene.sound.add(name, {
        volume: 0,
        loop: name === "reels" || name === "salon-ambience",
      }) as Phaser.Sound.WebAudioSound,
    );
  }
  const mix = () => {
    for (const [name, sound] of clips) {
      const gain = name === "salon-ambience" ? audioMix.music ** 2 * envelope.duck : audioMix.effects ** 2;
      sound.setVolume(levels.get(name)! * gain * (name === "reels" ? envelope.reels : 1));
    }
  };
  const available = () => !disposed && !document.hidden && !scene.sound.locked;
  const playKey = (key: string) => {
    if (!available()) return;
    const sound = clips.get(key)!;
    sound.stop();
    sound.play();
  };
  const stopReels = () => {
    scene.tweens.killTweensOf(envelope);
    clips.get("reels")?.stop();
    envelope.reels = 0;
    envelope.duck = 1;
    mix();
  };
  const stopWin = () => {
    for (const name of ["win-small", "win-big", "win-jackpot", "salon-cheer", "payout-tick", "payout-end"])
      clips.get(name)?.stop();
  };
  const silence = () => {
    generation++;
    stopReels();
    for (const sound of clips.values()) sound.stop();
  };
  mix();
  return {
    unlock() {
      if (disposed || document.hidden) return Promise.resolve();
      if (unlocking) return unlocking;
      const current = generation;
      unlocking = (async () => {
        scene.sound.unlock();
        const manager = scene.sound as Phaser.Sound.WebAudioSoundManager;
        if (manager.context?.state === "suspended") await manager.context.resume();
        if (current !== generation || !available()) return;
        if (ambience && !clips.get("salon-ambience")?.isPlaying) playKey("salon-ambience");
      })().finally(() => {
        unlocking = undefined;
      });
      return unlocking;
    },
    setMuted(value: boolean) {
      scene.sound.mute = value;
    },
    setVolume(bus: keyof typeof audioMix, value: number) {
      if (!Number.isFinite(value)) return;
      audioMix[bus] = Math.min(1, Math.max(0, value));
      mix();
    },
    play(
      event:
        | "press"
        | "stop"
        | "small"
        | "big"
        | "jackpot"
        | "salon-toast"
        | "payout-tick"
        | "payout-end"
        | "salon-cheer",
    ) {
      playKey(
        event === "stop"
          ? ["stop-a", "stop-b", "stop-c"][stopped++ % 3]
          : ["small", "big", "jackpot"].includes(event)
            ? `win-${event}`
            : event,
      );
    },
    startReels() {
      if (!available()) return;
      stopWin();
      stopReels();
      stopped = 0;
      const reel = clips.get("reels")!;
      reel.setRate(0.65);
      playKey("reels");
      scene.tweens.add({
        targets: envelope,
        reels: 1,
        duration: 180,
        ease: "Sine.easeInOut",
        onUpdate: () => {
          reel.setRate(0.65 + envelope.reels * 0.35);
          mix();
        },
      });
    },
    reelStopped() {
      if (!available()) return;
      const remaining = Math.max(0, 1 - ++stopped / 5);
      envelope.reels = remaining;
      clips.get("reels")!.setRate(0.75 + remaining * 0.25);
      mix();
      playKey(["stop-a", "stop-b", "stop-c"][(stopped - 1) % 3]);
    },
    stopReels,
    duck(active: boolean) {
      scene.tweens.killTweensOf(envelope);
      scene.tweens.add({ targets: envelope, duck: active ? 0.3 : 1, duration: 250, onUpdate: mix });
    },
    stopWin,
    silence,
    resume() {
      if (ambience && available() && !clips.get("salon-ambience")?.isPlaying) playKey("salon-ambience");
    },
    dispose() {
      silence();
      disposed = true;
      for (const sound of clips.values()) sound.destroy();
      clips.clear();
    },
  };
}
export type GameAudio = ReturnType<typeof createAudio>;
