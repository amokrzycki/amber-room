import Phaser from "phaser";
import "./style.css";
import { SalonScene } from "./view/SalonScene";
import { SlotScene } from "./view/SlotScene";
import { accrue } from "./runtime";
new Phaser.Game({
  type: Phaser.WEBGL,
  parent: "game",
  width: 1600,
  height: 900,
  backgroundColor: "#171214",
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [SalonScene, SlotScene],
  audio: { disableWebAudio: false },
  render: { antialias: true },
  fps: { target: 60 },
});
const stage = document.querySelector("#stage") as HTMLElement;
const ui = document.querySelector("#ui") as HTMLElement;
new ResizeObserver(() => {
  const scale = stage.clientWidth / 1600;
  ui.style.transform = `scale(${scale})`;
  ui.style.setProperty("--ui-scale", String(scale));
}).observe(stage);
setInterval(() => {
  if (!document.hidden) accrue();
}, 1000);
document.addEventListener("visibilitychange", () => accrue());
