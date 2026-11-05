import type Phaser from "phaser";

const textureKey = "orchard-cabinet";

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
    const fan = (x: number, y: number, size: number) => {
      ctx.save();
      ctx.translate(x, y);
      for (let petal = -2; petal <= 2; petal++) {
        ctx.save();
        ctx.rotate(petal * 0.36);
        ctx.fillStyle = gradient(-size / 5, -size, size / 2, size, ["#d2ac69", "#87602f", "#4c301c"]);
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.bezierCurveTo(-size * 0.36, -size * 0.8, -size * 0.2, -size, 0, -size);
        ctx.bezierCurveTo(size * 0.2, -size, size * 0.36, -size * 0.8, 3, 0);
        ctx.fill();
        ctx.restore();
      }
      round(-size * 0.3, -3, size * 0.6, 7, 3, "#b88d4c");
      ctx.restore();
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
    brass(65, 114, 1470, 762, 30, 9);
    round(76, 125, 1448, 742, 22, gradient(76, 125, 1100, 742, ["#7b2935", "#551720", "#2b1118"]));
    round(89, 139, 1422, 727, 15, gradient(89, 139, 0, 727, ["#601925", "#45141e", "#301018"]));
    line(
      [
        [92, 657],
        [92, 153],
        [240, 153],
      ],
      "#d2947140",
    );
    line(
      [
        [1508, 156],
        [1508, 828],
        [100, 828],
      ],
      "#16090dcc",
      2,
    );

    // The canopy and fluted fittings echo the miniature's fan crown without shrinking the reels.
    brass(583, 116, 434, 49, 18, 3);
    round(589, 122, 422, 37, 12, gradient(589, 122, 0, 37, ["#40171b", "#230e13"]));
    for (const x of [531, 1069]) {
      fan(x, 155, 35);
      line(
        [
          [x - 90, 155],
          [x - 42, 155],
        ],
        "#b48c4c",
        2,
      );
      line(
        [
          [x + 42, 155],
          [x + 90, 155],
        ],
        "#b48c4c",
        2,
      );
    }
    for (const x of [135, 1439]) {
      brass(x, 185, 26, 470, 12, 5);
      round(x + 7, 194, 12, 449, 5, gradient(x, 194, 26, 0, ["#6d202a", "#9b4650", "#3c101a"]));
      for (const y of [185, 645]) round(x - 7, y, 40, 11, 3, gradient(x, y, 0, 11, ["#c9a669", "#765026"]));
    }
    fan(199, 429, 25);
    fan(1401, 429, 25);
    for (const x of [199, 1401]) {
      line(
        [
          [x, 272],
          [x, 365],
        ],
        "#b58a4c55",
      );
      line(
        [
          [x, 455],
          [x, 576],
        ],
        "#b58a4c55",
      );
    }

    // Enamel collar → raised brass → dark gasket → unchanged reel aperture.
    round(239, 170, 1122, 511, 33, "#230d14");
    round(243, 172, 1114, 503, 31, gradient(243, 172, 600, 503, ["#9b3b46", "#611b28", "#320e17"]));
    brass(258, 185, 1084, 475, 27, 13);
    round(273, 200, 1054, 448, 15, "#09090d");
    // A sloped lip catches the light; the instrument deck remains dark under every label.
    round(79, 676, 1442, 19, 5, gradient(79, 676, 0, 19, ["#8b3d3f", "#48151e", "#210e13"]));
    line(
      [
        [85, 677],
        [1514, 677],
      ],
      "#c2966555",
    );
    round(89, 687, 1422, 180, 10, gradient(89, 687, 0, 180, ["#25171b", "#1d1217"]));
    line(
      [
        [94, 688],
        [1506, 688],
      ],
      "#08070a",
      2,
    );
    for (const x of [410, 1070])
      line(
        [
          [x, 710],
          [x, 798],
        ],
        "#a77e443d",
      );
    round(61, 871, 1478, 12, 5, gradient(61, 871, 0, 12, ["#752a33", "#3d141d", "#230e14"]));
    round(66, 872, 1468, 3, 1, gradient(66, 872, 1468, 0, ["#dfbf80", "#aa7b3b", "#634021"]));
    for (const x of [104, 1496]) for (const y of [169, 669, 819]) screw(x, y);

    texture.refresh();
  }
  // Leave the reel field out of the textured quads: its flat shading needs no texture sampling.
  for (const [x, y, width, height] of [
    [0, 0, 1530, 104],
    [0, 536, 1530, 244],
    [0, 104, 256, 432],
    [1276, 104, 254, 432],
  ])
    scene.add.image(35, 105, textureKey).setOrigin(0).setCrop(x, y, width, height);
  const field = scene.add.graphics();
  field.fillStyle(0x100d12).fillRect(291, 209, 1020, 432);
  const tones = [0x100e13, 0x201920, 0x19131a, 0x100d12];
  for (let column = 0; column < 5; column++) {
    const x = 291 + column * 205;
    for (let band = 0; band < 3; band++)
      field
        .fillGradientStyle(tones[band], tones[band], tones[band + 1], tones[band + 1])
        .fillRect(x, 209 + band * 144, 198, 144);
    if (column < 4) {
      field.lineStyle(4, 0x09070b).lineBetween(x + 200, 210, x + 200, 640);
      field.lineStyle(1, 0x9d7b46, 0.24).lineBetween(x + 201, 211, x + 201, 640);
    }
  }
  field.lineStyle(5, 0x000000, 0.6).lineBetween(291, 210, 1311, 210);
  field.lineStyle(2, 0xab814b, 0.2).lineBetween(291, 639, 1311, 639);
}
