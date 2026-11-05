import type Phaser from "phaser";
import manifest from "../assets/manifest.json";
const images = import.meta.glob("../assets/{symbols,art}/*.png", {
  eager: true,
  query: "?inline",
  import: "default",
}) as Record<string, string>;
const audio = import.meta.glob("../assets/audio/*.wav", { eager: true, query: "?inline", import: "default" }) as Record<
  string,
  string
>;
export const assetUrls = Object.fromEntries(
  [...Object.entries(images), ...Object.entries(audio)].map(([path, url]) => [
    path.split("/").pop()!.split(".")[0],
    url,
  ]),
);
export function preloadAssets(scene: Phaser.Scene) {
  for (const asset of manifest.assets) {
    const url = assetUrls[asset.id];
    if (!url) throw new Error(`Brak zasobu: ${asset.id}`);
    if (asset.kind === "image") scene.load.image(asset.id, url);
    else scene.load.audio(asset.id, url);
  }
}
