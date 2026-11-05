import type Phaser from "phaser";
import { reelWindow as win } from "./tuning";

const textureKey = "orchard-cabinet";
const TEXTURE_X = 35;
const TEXTURE_Y = 105;
/** Texture-space quads around the reel aperture; the aperture itself is flat-shaded geometry, not texture. */
export const cabinetCrops = [
  [0, 0, 1530, win.y - TEXTURE_Y],
  [0, win.y + win.h - TEXTURE_Y, 1530, 780 - (win.y + win.h - TEXTURE_Y)],
  [0, win.y - TEXTURE_Y, win.x - TEXTURE_X, win.h],
  [win.x + win.w - TEXTURE_X, win.y - TEXTURE_Y, 1530 - (win.x + win.w - TEXTURE_X), win.h],
];

/** Static joinery, baked once; the reels, feedback and accessible controls stay live. */
export function drawCabinet(scene: Phaser.Scene) {
  if (!scene.textures.exists(textureKey)) {
    const texture = scene.textures.createCanvas(textureKey, 1530, 780)!;
    const ctx = texture.getContext();
    ctx.translate(-35, -105);

    const gradient = (x: number, y: number, width: number, height: number, colors: string[]) => {
      const paint = ctx.createLinearGradient(x, y, x + width, y + height);
      colors.forEach((color, index) => {
        paint.addColorStop(index / (colors.length - 1), color);
      });
      return paint;
    };
    const round = (
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number,
      paint: string | CanvasGradient,
    ) => {
      ctx.fillStyle = paint;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.fill();
    };
    const line = (points: number[][], color: string, width = 1) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      points.forEach(([x, y], i) => {
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      });
      ctx.stroke();
    };
    const brass = (x: number, y: number, width: number, height: number, radius: number, lip: number) => {
      round(x + 3, y + 5, width, height, radius, "#120c0b");
      round(x, y, width, height, radius, gradient(x, y, width * 0.3, height, ["#f0d398", "#aa7738", "#725025"]));
      round(
        x + 2,
        y + 2,
        width - 4,
        height - 4,
        radius - 2,
        gradient(x, y, 0, height, ["#c39a56", "#8c602c", "#c29a54", "#5b3b20"]),
      );
      round(x + lip, y + lip, width - lip * 2, height - lip * 2, radius - lip, "#29150f");
    };
    const screw = (x: number, y: number) => {
      ctx.fillStyle = "#160d0c";
      ctx.beginPath();
      ctx.arc(x + 1, y + 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = gradient(x - 3, y - 3, 6, 6, ["#d8b879", "#755128"]);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      line(
        [
          [x - 1.5, y + 1.5],
          [x + 1.5, y - 1.5],
        ],
        "#49341c",
      );
    };
    // Recessed wood returns, a narrow lit edge, and a lower plinth give the face thickness.
    ctx.save();
    ctx.shadowColor = "#000b";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 8;
    round(46, 119, 1508, 750, 35, "#190e0e");
    ctx.restore();
    round(48, 117, 1504, 741, 34, gradient(48, 117, 1504, 0, ["#623823", "#301d17", "#21130f"]));
    for (let x = 52; x < 1550; x += 5) {
      line(
        [
          [x, 153],
          [x + 2, 831],
        ],
        x % 3 ? "#e1ad6a08" : "#0b060619",
      );
    }
    round(65, 114, 1470, 762, 30, gradient(65, 114, 900, 762, ["#b49460", "#68482e"]));
    round(70, 119, 1460, 752, 26, gradient(70, 119, 0, 752, ["#682431", "#481620", "#2b1118"]));

    // A flush metal plate, fastened to the enamel canopy.
    round(594, 125, 412, 44, 5, "#180e0c");
    round(595, 126, 410, 42, 4, gradient(595, 126, 410, 42, ["#c8aa76", "#b69561", "#a88650"]));
    line(
      [
        [598, 127],
        [1001, 127],
      ],
      "#f0d6a177",
    );
    line(
      [
        [598, 167],
        [1001, 167],
      ],
      "#4b321a99",
    );
    screw(607, 147);
    screw(993, 147);

    // One brass bezel and a dark gasket establish the recessed reel aperture.
    brass(win.x - 33, 185, win.w + 66, win.y - 185 + win.h + 19, 20, 9);
    round(win.x - 22, 196, win.w + 42, win.y - 196 + win.h + 11, 11, "#09090d");
    const bezelBottom = win.y + win.h + 19;
    const lip = bezelBottom + 16;
    const deck = lip + 11;
    // A sloped lip catches the light; the instrument deck remains dark under every label.
    round(79, lip, 1442, 19, 5, gradient(79, lip, 0, 19, ["#8b3d3f", "#48151e", "#210e13"]));
    line(
      [
        [85, lip + 1],
        [1514, lip + 1],
      ],
      "#c2966555",
    );
    round(89, deck, 1422, 867 - deck, 10, gradient(89, deck, 0, 867 - deck, ["#25171b", "#1d1217"]));
    line(
      [
        [94, deck + 1],
        [1506, deck + 1],
      ],
      "#08070a",
      2,
    );
    round(61, 871, 1478, 9, 4, gradient(61, 871, 0, 9, ["#69313a", "#230e14"]));
    // Fasteners belong to the enamel frame; none on the instrument deck, where they read as stray dots beside the HUD.
    for (const x of [104, 1496]) for (const y of [169, lip - 7]) screw(x, y);

    texture.refresh();
  }
  // Leave the reel field out of the textured quads: its flat shading needs no texture sampling.
  for (const [x, y, width, height] of cabinetCrops)
    scene.add.image(35, 105, textureKey).setOrigin(0).setCrop(x, y, width, height);
  const field = scene.add.graphics();
  const right = win.x + win.w;
  const bottom = win.y + win.h;
  field.fillStyle(0x100d12).fillRect(win.x, win.y, win.w, win.h);
  const tones = [0x100e13, 0x201920, 0x19131a, 0x100d12];
  for (let column = 0; column < 5; column++) {
    const x = win.x + column * (win.colW + win.colGap);
    for (let band = 0; band < 3; band++)
      field
        .fillGradientStyle(tones[band], tones[band], tones[band + 1], tones[band + 1])
        .fillRect(x, win.y + band * win.rowGap, win.colW, win.rowGap);
    if (column < 4) {
      field.lineStyle(4, 0x09070b).lineBetween(x + win.colW + 2, win.y + 1, x + win.colW + 2, bottom - 1);
      field.lineStyle(1, 0x9d7b46, 0.24).lineBetween(x + win.colW + 3, win.y + 2, x + win.colW + 3, bottom - 1);
    }
  }
  field.lineStyle(5, 0x000000, 0.6).lineBetween(win.x, win.y + 1, right, win.y + 1);
  field.lineStyle(2, 0xab814b, 0.2).lineBetween(win.x, bottom - 2, right, bottom - 2);
}
