import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
const directory = "docs/evidence/reel-clipping";
mkdirSync(directory, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
try {
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, offline: true });
  const page = await context.newPage();
  const warnings = [],
    errors = [];
  page.on("console", (m) => {
    if (m.type() === "warning") warnings.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`file://${resolve("dist/index.html")}`);
  await page.locator("#enter-slot").waitFor();
  await page.click("#enter-slot");
  await page.locator("#spin").waitFor();
  await page.screenshot({ path: `${directory}/idle.png` });
  await page.click("#spin");
  for (let frame = 0; frame < 4; frame++) {
    await page.waitForTimeout(80);
    assert(await page.locator("#spin").isDisabled(), "Capture must sample moving reels");
    await page.screenshot({ path: `${directory}/moving-${frame}.png` });
  }
  execFileSync(
    "python",
    [
      "-c",
      `
from PIL import Image, ImageChops
from pathlib import Path
root=Path('${directory}')
idle=Image.open(root/'idle.png').convert('RGB')
changed_inside=False
for path in sorted(root.glob('moving-*.png')):
 frame=Image.open(path).convert('RGB')
 for region in [(285,100,1320,207),(285,642,1320,690)]:
  diff=ImageChops.difference(idle.crop(region),frame.crop(region))
  assert diff.getbbox() is None, f'{path.name}: symbols leak outside reel window {region}'
 changed_inside |= ImageChops.difference(idle.crop((291,209,1310,640)),frame.crop((291,209,1310,640))).getbbox() is not None
assert changed_inside, 'Reels must actually move; a frozen screen cannot prove clipping'
`,
    ],
    { stdio: "pipe" },
  );
  assert(!warnings.some((w) => /not supported in WebGL|mask/i.test(w)), warnings.join("\n"));
  assert.deepEqual(errors, []);
  console.log(
    "PASS: four moving frames, upper/lower cabinet unchanged, reel pixels moving, no unsupported-mask warning.",
  );
  await context.close();
} finally {
  await browser.close();
}
