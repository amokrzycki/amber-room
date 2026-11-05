import type Phaser from "phaser";
export function createAudio(scene: Phaser.Scene) {
  const clips = new Map<string, Phaser.Sound.BaseSound>();
  let stopped = 0,
    unlocked = false,
    disposed = false;
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
  for (const name of names)
    clips.set(
      name,
      scene.sound.add(name, {
        volume: name === "salon-ambience" ? 0.12 : name === "reels" ? 0.22 : name === "payout-tick" ? 0.2 : 0.34,
        loop: name === "reels" || name === "salon-ambience",
      }),
    );
  const playKey = (key: string) => {
    if (!disposed && !document.hidden) clips.get(key)?.play();
  };
  const silence = () => {
    for (const s of clips.values()) s.stop();
  };
  return {
    async unlock() {
      if (disposed) return;
      scene.sound.unlock();
      const manager = scene.sound as Phaser.Sound.WebAudioSoundManager;
      if (manager.context?.state === "suspended") await manager.context.resume();
      if (disposed || document.hidden) return;
      unlocked = true;
      if (!clips.get("salon-ambience")?.isPlaying) playKey("salon-ambience");
    },
    setMuted(value: boolean) {
      scene.sound.mute = value;
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
      playKey("reels");
    },
    stopReels() {
      clips.get("reels")?.stop();
    },
    duck(active: boolean) {
      const s = clips.get("salon-ambience") as Phaser.Sound.WebAudioSound;
      scene.tweens.killTweensOf(s);
      scene.tweens.add({ targets: s, volume: active ? 0.035 : 0.12, duration: 250 });
    },
    stopWin() {
      for (const name of ["win-small", "win-big", "win-jackpot", "salon-cheer", "payout-tick"]) clips.get(name)?.stop();
    },
    silence,
    resume() {
      if (unlocked && !disposed) playKey("salon-ambience");
    },
    dispose() {
      disposed = true;
      for (const s of clips.values()) {
        scene.tweens.killTweensOf(s);
        s.destroy();
      }
      clips.clear();
    },
  };
}
export type GameAudio = ReturnType<typeof createAudio>;
