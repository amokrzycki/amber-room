import type Phaser from "phaser";
import type { RugStyle } from "../../prototypes/living-lounge-state";
import type { Item } from "../game/business";
import type { Businesses } from "../game/model";

export { loungeReward } from "../../prototypes/living-lounge-state";

type Paint = string | CanvasGradient;
type Context = CanvasRenderingContext2D;

function gradient(ctx: Context, x: number, y: number, w: number, h: number, colors: string[]) {
  const paint = ctx.createLinearGradient(x, y, x + w, y + h);
  colors.forEach((color, i) => {
    paint.addColorStop(i / (colors.length - 1), color);
  });
  return paint;
}

function round(ctx: Context, x: number, y: number, w: number, h: number, r: number, paint: Paint) {
  ctx.fillStyle = paint;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function ellipse(ctx: Context, x: number, y: number, rx: number, ry: number, paint: Paint) {
  ctx.fillStyle = paint;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function stroke(ctx: Context, points: number[][], color: Paint, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  points.forEach(([x, y], i) => {
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  });
  ctx.stroke();
}

function canvas(scene: Phaser.Scene, key: string, w: number, h: number, paint: (ctx: Context) => void) {
  if (!scene.textures.exists(key)) {
    const texture = scene.textures.createCanvas(key, w, h)!;
    paint(texture.getContext());
    texture.refresh();
  }
  return key;
}

function stool(ctx: Context) {
  ctx.save();
  ctx.shadowColor = "#09050699";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  ellipse(ctx, 62, 179, 47, 7, "#130b0a77");
  ctx.restore();
  const brass = gradient(ctx, 22, 0, 78, 0, ["#614225", "#e0b86a", "#956333", "#54351c"]);
  for (const [top, foot] of [
    [36, 25],
    [88, 99],
    [48, 43],
    [76, 82],
  ]) {
    stroke(
      ctx,
      [
        [top, 83],
        [foot, 174],
      ],
      "#24100e",
      8,
    );
    stroke(
      ctx,
      [
        [top - 1, 83],
        [foot - 1, 174],
      ],
      brass,
      4,
    );
    round(ctx, foot - 5, 170, 10, 7, 2, brass);
  }
  ctx.strokeStyle = brass;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(62, 135, 32, 9, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (const x of [29, 95]) round(ctx, x, 33, 5, 51, 2, brass);
  round(ctx, 23, 8, 80, 53, 15, "#240e15");
  round(ctx, 24, 8, 77, 49, 14, gradient(ctx, 24, 8, 65, 45, ["#984653", "#642331", "#38111f"]));
  ctx.strokeStyle = "#c78e7577";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(29, 13, 67, 38, 11);
  ctx.stroke();
  ellipse(ctx, 62, 85, 49, 19, brass);
  ellipse(ctx, 62, 80, 48, 18, "#300f1c");
  ellipse(ctx, 61, 76, 46, 15, gradient(ctx, 20, 63, 70, 23, ["#aa5863", "#702b3c", "#401423"]));
  ctx.strokeStyle = "#cb917a88";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(61, 75, 41, 11, 0, Math.PI, Math.PI * 2);
  ctx.stroke();
}

function backBar(ctx: Context) {
  // The supplied bar's broad lacquer bevels, recessed bays and glass decanters are the material reference.
  round(ctx, 10, 11, 158, 235, 4, "#12090cbb");
  round(ctx, 5, 7, 160, 234, 3, gradient(ctx, 5, 7, 160, 80, ["#a75c37", "#551923", "#210b12"]));
  round(ctx, 8, 12, 146, 222, 1, gradient(ctx, 8, 12, 132, 30, ["#efb866", "#81431d", "#3b1b17"]));
  round(ctx, 18, 21, 126, 207, 0, gradient(ctx, 18, 21, 105, 180, ["#793b26", "#3d181c", "#170d12", "#32101c"]));
  round(ctx, 19, 22, 7, 205, 0, gradient(ctx, 19, 22, 7, 0, ["#180c11", "#693b24"]));
  round(ctx, 137, 22, 7, 205, 0, "#160b10");
  for (const [row, bottom] of [108, 216].entries()) {
    round(ctx, 26, bottom - 82, 111, 82, 0, gradient(ctx, 26, bottom - 82, 94, 70, ["#d78b3b30", "#10080e77"]));
    for (let i = 0; i < 4; i++) {
      const x = [39, 66, 96, 124][i];
      const kind = (i + row) % 4;
      const height = [59, 74, 49, 64][kind];
      const width = [21, 17, 26, 19][kind];
      const neck = kind === 1 ? 5 : 7;
      const shoulder = kind === 2 ? 23 : 20;
      const top = bottom - height;
      const amber = kind !== 1;
      ellipse(ctx, x + 2, bottom + 1, width * 0.62, 3, "#09070bbc");
      const bottle = new Path2D();
      bottle.moveTo(x - neck / 2, top + 4);
      bottle.lineTo(x - neck / 2, top + 16);
      bottle.bezierCurveTo(x - width * 0.7, top + shoulder, x - width / 2, bottom - 19, x - width / 2, bottom - 5);
      bottle.quadraticCurveTo(x - width / 2, bottom, x, bottom);
      bottle.quadraticCurveTo(x + width / 2, bottom, x + width / 2, bottom - 5);
      bottle.bezierCurveTo(x + width / 2, bottom - 19, x + width * 0.7, top + shoulder, x + neck / 2, top + 16);
      bottle.lineTo(x + neck / 2, top + 4);
      bottle.closePath();
      ctx.fillStyle = gradient(
        ctx,
        x - width / 2,
        top,
        width,
        5,
        amber
          ? ["#60301bd9", "#ffe2a799", "#c87620cc", "#6e2516ee", "#f0bb6388"]
          : ["#1c342bbd", "#d7d79eaa", "#5c7446c9", "#152e26ee", "#9cab7399"],
      );
      ctx.fill(bottle);
      ctx.save();
      ctx.clip(bottle);
      round(
        ctx,
        x - width / 2,
        bottom - height * 0.57,
        width,
        height * 0.57,
        0,
        gradient(
          ctx,
          x - width / 2,
          bottom - 28,
          width,
          6,
          amber ? ["#e9a83c33", "#e6a32d9c", "#863012c9", "#48201fbb"] : ["#b4b06a22", "#687b3c99", "#193b2ce0"],
        ),
      );
      if (kind === 0 || kind === 2) {
        for (let facet = -2; facet <= 2; facet++) {
          stroke(
            ctx,
            [
              [x + facet * 4, top + shoulder],
              [x + facet * 3, bottom - 5],
            ],
            "#ffdda568",
          );
        }
      } else {
        round(
          ctx,
          x - width * 0.33,
          bottom - 27,
          width * 0.67,
          15,
          1,
          gradient(ctx, x - 6, bottom - 27, 13, 8, ["#e3c88d", "#9c7548"]),
        );
        round(ctx, x - 3, bottom - 24, 5, 1, 0, "#65432d");
      }
      round(ctx, x - width / 2 + 3, top + shoulder, 2, height - shoulder - 7, 1, "#ffe7bda8");
      ellipse(ctx, x - 2, bottom - 4, width * 0.3, 1, "#f8cb7777");
      ctx.restore();
      ctx.strokeStyle = "#e5b67e77";
      ctx.lineWidth = 0.7;
      ctx.stroke(bottle);
      if (kind === 0 || kind === 2) {
        ellipse(
          ctx,
          x,
          top + 1,
          neck * 0.8,
          kind === 2 ? 5 : 3,
          gradient(ctx, x - 5, top - 4, 9, 8, ["#fff0bc", "#b6762d", "#50291c"]),
        );
      } else
        round(
          ctx,
          x - neck / 2 - 1,
          top,
          neck + 2,
          5,
          1,
          gradient(ctx, x - 4, top, 8, 2, ["#f7d17a", "#8b4b24", "#d4a452"]),
        );
    }
    ctx.fillStyle = gradient(ctx, 17, bottom + 1, 0, 12, ["#a76c3f", "#5a2621", "#270e13"]);
    ctx.beginPath();
    ctx.moveTo(25, bottom + 1);
    ctx.lineTo(139, bottom + 1);
    ctx.lineTo(153, bottom + 9);
    ctx.lineTo(12, bottom + 9);
    ctx.closePath();
    ctx.fill();
    round(ctx, 12, bottom + 9, 141, 8, 1, gradient(ctx, 12, bottom + 9, 0, 8, ["#ffe0a0", "#b77b38", "#4a241a"]));
    round(ctx, 18, bottom + 18, 126, 4, 0, "#10080e99");
  }
  for (const x of [7, 148]) {
    round(ctx, x, 15, 10, 218, 2, gradient(ctx, x, 15, 10, 0, ["#4c231c", "#ebb765", "#ad682e", "#4c231c"]));
    round(ctx, x + 3, 18, 2, 212, 1, "#ffdb9855");
  }
  round(ctx, 1, 1, 163, 14, 2, gradient(ctx, 1, 1, 0, 14, ["#ffdf9d", "#bc803e", "#f6c775", "#6d3c24", "#2b1318"]));
  round(ctx, 2, 233, 163, 11, 2, gradient(ctx, 2, 233, 0, 11, ["#e6b76b", "#86522b", "#31151a"]));
}

function planter(ctx: Context, variant = 0) {
  ctx.save();
  ctx.shadowColor = "#09050699";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ellipse(ctx, 72, 239, 48, 7, "#120c0b88");
  ctx.restore();
  // Rear branches first; broad, folded leaves overlap instead of radiating from one flat fan.
  const leaves = [
    [68, 121, 39, 36, 22],
    [73, 137, 105, 50, 24],
    [62, 150, 14, 83, 26],
    [81, 150, 132, 98, 23],
    [65, 82, 54, 15, 20],
    [75, 113, 83, 33, 22],
    [63, 112, 20, 57, 26],
    [77, 104, 119, 68, 25],
    [61, 137, 6, 124, 29],
    [81, 131, 138, 136, 28],
    [66, 84, 34, 75, 23],
    [72, 96, 103, 89, 24],
    [68, 145, 36, 109, 29],
    [79, 151, 119, 121, 28],
    [66, 151, 17, 167, 26],
    [79, 155, 127, 179, 25],
    [71, 173, 53, 131, 26],
    [77, 182, 101, 155, 26],
  ];
  leaves.forEach(([bx, by, tx, ty, width], i) => {
    tx += variant ? ((i % 3) - 1) * 8 : 0;
    ty += variant ? ((i % 4) - 1) * 5 : 0;
    ctx.strokeStyle = i < 5 ? "#30402a" : "#7e7942";
    ctx.lineWidth = i < 5 ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(71 + (i % 3) * 3, 185);
    ctx.quadraticCurveTo(bx - 7, by + 22, bx, by);
    ctx.stroke();
    const length = Math.hypot(tx - bx, ty - by);
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(Math.atan2(ty - by, tx - bx));
    const leaf = new Path2D();
    leaf.moveTo(0, 0);
    const curl = ((i % 3) - 1) * width * 0.18;
    leaf.bezierCurveTo(length * 0.12, -width * 0.85, length * 0.56, -width, length * 0.87, curl - 3);
    leaf.quadraticCurveTo(length * 0.95, curl - 2, length, curl + 5);
    leaf.bezierCurveTo(length * 0.69, curl - 1, length * 0.34, width * 0.72, 0, 0);
    const lit = i >= 5 && i % 3 !== 1;
    // Project upper-left light into each leaf's local coordinates; never flip the lighting with the plant.
    const angle = Math.atan2(ty - by, tx - bx);
    const lightX = -Math.cos(angle) * 18 - Math.sin(angle) * 24;
    const lightY = Math.sin(angle) * 18 - Math.cos(angle) * 24;
    ctx.fillStyle = gradient(
      ctx,
      length * 0.5 + lightX,
      lightY,
      -lightX * 2,
      -lightY * 2,
      lit ? ["#b1a75d", "#78803e", "#354b27", "#15291f"] : ["#707440", "#34482a", "#101f17"],
    );
    ctx.fill(leaf);
    ctx.save();
    ctx.clip(leaf);
    ctx.fillStyle = "#142d2270";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(length * 0.54, -width * 0.12, length, curl + 5);
    ctx.lineTo(length, width);
    ctx.lineTo(0, width);
    ctx.fill();
    for (let vein = 0.22; vein < 0.85; vein += 0.16) {
      ctx.fillStyle = lit ? "#dfc97b12" : "#040f101a";
      ctx.beginPath();
      ctx.moveTo(length * vein, -width * 0.05);
      ctx.quadraticCurveTo(length * (vein - 0.04), -width * 0.5, length * (vein + 0.08), -width * 0.63);
      ctx.lineTo(length * (vein + 0.15), -width * 0.5);
      ctx.closePath();
      ctx.fill();
      stroke(
        ctx,
        [
          [length * vein, -width * 0.05],
          [length * (vein + 0.13), -width * 0.38],
        ],
        "#d0c47833",
        0.65,
      );
    }
    ctx.restore();
    ctx.strokeStyle = lit ? "#c6bc6b88" : "#7f915344";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(1, 0);
    ctx.quadraticCurveTo(length * 0.54, -width * 0.12, length - 1, curl + 4);
    ctx.stroke();
    ctx.restore();
  });
  const brass = gradient(ctx, 35, 173, 74, 8, ["#4e351e", "#a27d3d", "#e1bd73", "#9b6e31", "#50351f"]);
  round(ctx, 40, 178, 64, 51, 9, brass);
  ellipse(ctx, 72, 229, 26, 6, "#5c3b22");
  round(ctx, 48, 231, 48, 7, 2, brass);
  ellipse(ctx, 72, 177, 35, 10, "#ddbb77");
  ellipse(ctx, 72, 178, 30, 7, "#32251b");
  ellipse(ctx, 72, 180, 28, 5, "#1d1b13");
  stroke(
    ctx,
    [
      [44, 189],
      [48, 218],
    ],
    "#f4d49755",
    2,
  );
  ellipse(ctx, 72, 190, 32, 5, "#b88b4833");
}

function rug(ctx: Context, style: RugStyle) {
  ctx.save();
  ctx.shadowColor = "#180c0cab";
  ctx.shadowBlur = 7;
  ctx.shadowOffsetY = 5;
  ctx.beginPath();
  ctx.moveTo(64, 9);
  ctx.lineTo(535, 9);
  ctx.lineTo(626, 149);
  ctx.lineTo(9, 149);
  ctx.closePath();
  ctx.fillStyle = "#261317";
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(64, 9);
  ctx.lineTo(535, 9);
  ctx.lineTo(626, 149);
  ctx.lineTo(9, 149);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle =
    style === "claret"
      ? gradient(ctx, 0, 9, 0, 140, ["#632735", "#813b49", "#592330"])
      : gradient(ctx, 0, 9, 0, 140, ["#304e3f", "#4d6c51", "#2d4838"]);
  ctx.fillRect(0, 0, 640, 165);
  for (let y = 12; y < 150; y += 3)
    stroke(
      ctx,
      [
        [0, y],
        [640, y],
      ],
      y % 2 ? "#ead2a01a" : "#100d142e",
    );
  for (let x = 0; x < 640; x += 4)
    stroke(
      ctx,
      [
        [64 + x * 0.74, 9],
        [x, 149],
      ],
      "#ead2a015",
    );
  for (const [inset, color, width] of [
    [7, "#b59660", 5],
    [15, "#342b22", 2],
    [23, "#c3a36d", 2],
  ] as const) {
    stroke(
      ctx,
      [
        [64 + inset, 9 + inset * 0.4],
        [535 - inset, 9 + inset * 0.4],
        [626 - inset * 1.3, 149 - inset * 0.5],
        [9 + inset, 149 - inset * 0.5],
        [64 + inset, 9 + inset * 0.4],
      ],
      color,
      width,
    );
  }
  ctx.restore();
  for (let x = 15; x < 621; x += 7)
    stroke(
      ctx,
      [
        [x, 150],
        [x - 1, 154 + (x % 3)],
      ],
      "#bea27688",
    );
}

function nameplate(ctx: Context) {
  round(ctx, 3, 5, 324, 46, 3, "#1b0e12aa");
  round(ctx, 1, 1, 324, 46, 3, gradient(ctx, 1, 1, 285, 46, ["#ebce92", "#c3a16b", "#9c793e"]));
  stroke(
    ctx,
    [
      [4, 2],
      [322, 2],
    ],
    "#f7dfb2",
  );
  stroke(
    ctx,
    [
      [4, 46],
      [322, 46],
    ],
    "#614123",
  );
  for (let y = 4; y < 45; y += 2)
    stroke(
      ctx,
      [
        [5, y],
        [321, y],
      ],
      "#533b1710",
    );
  for (const x of [13, 313]) {
    ellipse(ctx, x, 24, 3, 3, "#72532d");
    stroke(
      ctx,
      [
        [x - 1, 25],
        [x + 1, 23],
      ],
      "#2d2419",
    );
  }
  ctx.font = '400 22px "Marcellus", Georgia, serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f4d9a988";
  ctx.fillText("THE AMBER ROOM", 164, 26);
  ctx.fillStyle = "#38271c";
  ctx.fillText("THE AMBER ROOM", 163, 25);
}

/** Original static materials, baked once per variant; see docs/asset-generation.md. */
export function drawLivingLounge(
  scene: Phaser.Scene,
  businesses: Businesses,
  rugStyle: RugStyle,
  update?: {
    room: Phaser.GameObjects.Container;
    groups: Record<Item, Phaser.GameObjects.Container>;
    item: Item;
  },
) {
  const room = update?.room ?? scene.add.container(0, 0).setName("living-lounge");
  const groups: Record<Item, Phaser.GameObjects.Container> = update?.groups ?? {
    decor: scene.add.container(0, 0).setName("lounge-decor"),
    bar: scene.add.container(0, 0).setName("lounge-bar"),
    machine: scene.add.container(0, 0).setName("lounge-machine"),
  };
  if (update) groups[update.item].removeAll(true);
  else room.add([groups.decor, groups.bar, groups.machine]);
  const draws = (item: Item) => !update || update.item === item;
  const image = (group: Item, name: string, x: number, y: number, key: string) => {
    const object = scene.add.image(x, y, key).setOrigin(0).setName(name);
    groups[group].add(object);
    return object;
  };
  const shadow = (group: Item, x: number, y: number, w: number, h: number) => {
    const key = canvas(scene, "lounge-contact-shadow", 160, 32, (ctx) => {
      const paint = ctx.createRadialGradient(80, 80, 2, 80, 80, 80);
      paint.addColorStop(0, "#10080999");
      paint.addColorStop(1, "#10080900");
      ctx.scale(1, 0.2);
      ellipse(ctx, 80, 80, 80, 80, paint);
    });
    image(group, "", x - w / 2, y - h / 2, key).setDisplaySize(w, h);
  };
  if (draws("decor") && businesses.decorLevel >= 1) {
    image(
      "decor",
      `lounge-rug-${rugStyle}`,
      390,
      716,
      canvas(scene, `lounge-weave-${rugStyle}`, 640, 165, (ctx) => rug(ctx, rugStyle)),
    ).setDisplaySize(640, 190);
  }
  if (draws("decor") && businesses.decorLevel >= 2) {
    const key = canvas(scene, "lounge-brass-planter", 144, 250, (ctx) => planter(ctx));
    image("decor", "lounge-planter-left", 7, 475, key).setDisplaySize(125, 217);
    image(
      "decor",
      "lounge-planter-right",
      914,
      475,
      canvas(scene, "lounge-brass-planter-right", 144, 250, (ctx) => planter(ctx, 1)),
    ).setDisplaySize(125, 217);
  }
  if (draws("decor") && businesses.decorLevel >= 3) {
    image("decor", "lounge-nameplate", 582, 184, canvas(scene, "lounge-engraved-nameplate", 330, 55, nameplate));
  }
  if (draws("bar") && businesses.barLevel >= 1) {
    shadow("bar", 250, 674, 330, 40);
    if (businesses.barLevel >= 3)
      image("bar", "lounge-back-bar", 380, 350, canvas(scene, "lounge-back-bar-material", 170, 250, backBar));
    image("bar", "lounge-stocked-bar", 50, 395, "salon-bar").setDisplaySize(400, 280);
    if (businesses.barLevel >= 2) {
      const key = canvas(scene, "lounge-upholstered-stool", 124, 190, stool);
      image("bar", "lounge-stool-left", 112, 516, key);
      image("bar", "lounge-stool-right", 280, 516, key);
    }
  }
  if (draws("machine")) {
    shadow("machine", 745, 561, 175, 25);
    image("machine", "lounge-cabinet-personal", 627.5, 245, "salon-machine")
      .setDisplaySize(235, 320)
      .setInteractive({ useHandCursor: true });
    for (let i = 0; i < businesses.extraMachines; i++) {
      const x = 470 + i * 190;
      shadow("machine", x, 848, 145, 30);
      image("machine", `lounge-cabinet-${i + 1}`, x - 77.5, 635, "salon-machine").setDisplaySize(155, 210);
    }
  }
  return { room, groups };
}
