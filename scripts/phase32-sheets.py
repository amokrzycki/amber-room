"""Before/after contact sheets from docs/evidence/phase32 (run after phase32-capture for both labels)."""
from PIL import Image, ImageDraw
import os
D = "docs/evidence/phase32"
os.makedirs(f"{D}/sheets", exist_ok=True)

def pair(states, size_key, out, scale=0.5, crop=None):
    rows = []
    for st in states:
        pics = []
        for lab in ("before", "after"):
            im = Image.open(f"{D}/{lab}-{size_key}-{st}.png").convert("RGB")
            if crop: im = im.crop(crop)
            im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
            pics.append(im)
        rows.append((st, pics))
    w = sum(p.width for p in rows[0][1]) + 30
    h = sum(r[1][0].height + 22 for r in rows)
    sheet = Image.new("RGB", (w, h), (16, 12, 16)); d = ImageDraw.Draw(sheet); y = 0
    for st, (a, b) in rows:
        d.text((6, y + 5), f"{st}   — before (left)   after (right)   {size_key}", fill=(216, 175, 85)); y += 22
        sheet.paste(a, (0, y)); sheet.paste(b, (a.width + 30, y)); y += a.height
    sheet.save(out)

def zoom(states, out, scale=0.62):
    rows = []
    for st in states:
        pics = [Image.open(f"{D}/{lab}-zoom-{st}.png").convert("RGB") for lab in ("before", "after")]
        pics = [p.resize((int(p.width * scale), int(p.height * scale)), Image.LANCZOS) for p in pics]
        rows.append((st, pics))
    w = max(r[1][0].width + r[1][1].width + 20 for r in rows)
    h = sum(r[1][0].height + 22 for r in rows)
    sheet = Image.new("RGB", (w, h), (16, 12, 16)); d = ImageDraw.Draw(sheet); y = 0
    for st, (a, b) in rows:
        d.text((6, y + 5), f"{st}   — before (left)   after (right)   1600x900 @2x", fill=(216, 175, 85)); y += 22
        sheet.paste(a, (0, y)); sheet.paste(b, (a.width + 20, y)); y += a.height
    sheet.save(out)

# Overlay evidence at 2x zoom: each state stacked vertically, before | after.
for group, states in {
    "overlay-wild": ["wild", "wild-five", "wild-overlap"],
    "overlay-preview": ["wild-overlap-hover", "wild-overlap-keyfocus", "fruit-multi-hover"],
    "overlay-fruit": ["fruit", "fruit-multi", "busy"],
}.items():
    zoom(states, f"{D}/sheets/{group}.png")
# Full frames at all four established resolutions: idle, spinning, winning, losing, WILD.
for key in ("1280x800", "1366x768", "1600x900", "1920x1080"):
    pair(["idle", "spinning", "loss", "fruit", "wild-overlap"], key, f"{D}/sheets/frames-{key}.png", scale=0.45)
print("sheets written")
