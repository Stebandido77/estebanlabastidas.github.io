"""Build the 1200×630 social card (og:image / twitter:image).

Usage:  python tools/og.py

Composes the black & white Bogotá wallpaper (assets/img/wallpaper-1440.webp, CC BY-SA 4.0,
see assets/img/WALLPAPER-CREDIT.md) with the site's darkening, the name in Instrument Serif
(tools/fonts, SIL OFL 1.1) and the kicker, and writes assets/img/og.jpg.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

root = Path(__file__).resolve().parent.parent
fonts = Path(__file__).resolve().parent / "fonts"
W, H = 1200, 630
CREAM, AMBER, AMBER_HI = (236, 229, 214), (199, 154, 94), (232, 194, 136)

bg = Image.open(root / "assets" / "img" / "wallpaper-1440.webp").convert("L")
bg = ImageOps.fit(bg, (W, H), Image.LANCZOS, centering=(0.5, 0.62)).convert("RGB")

# darken like .wdim: a vertical gradient plus a heavier left side for the type
shade = Image.new("L", (W, H))
px = shade.load()
for y in range(H):
    for x in range(W):
        v = 0.42 + 0.30 * (y / H) + 0.28 * max(0.0, 1 - x / (W * 0.75))
        px[x, y] = int(255 * min(0.9, v))
card = Image.composite(Image.new("RGB", (W, H), (11, 10, 8)), bg, shade)

d = ImageDraw.Draw(card)
serif = ImageFont.truetype(str(fonts / "InstrumentSerif-Regular.ttf"), 132)
serif_it = ImageFont.truetype(str(fonts / "InstrumentSerif-Italic.ttf"), 132)
small = ImageFont.truetype(str(fonts / "InstrumentSerif-Italic.ttf"), 34)
x0 = 84
d.text((x0, 150), "Esteban", font=serif, fill=CREAM)
d.text((x0, 268), "Labastidas", font=serif_it, fill=AMBER)
d.line([(x0, 452), (x0 + 72, 452)], fill=AMBER, width=2)
d.text((x0 + 92, 432), "Economist · Banker · Builder", font=small, fill=AMBER_HI)
d.text((x0, 520), "Strategy & Investor Relations · Grupo Aval · Bogotá", font=ImageFont.truetype(str(fonts / "InstrumentSerif-Regular.ttf"), 30), fill=(236, 229, 214))

credit = "Photo: Steffen Schmitz, Wikimedia Commons, CC BY-SA 4.0"   # required by the license
cf = ImageFont.truetype(str(fonts / "InstrumentSerif-Regular.ttf"), 19)
d.text((W - 24 - d.textlength(credit, font=cf), H - 34), credit, font=cf, fill=(236, 229, 214, 160))

out = root / "assets" / "img" / "og.jpg"
card.save(out, "JPEG", quality=84, optimize=True, progressive=True)
print(out.relative_to(root), out.stat().st_size // 1024, "KB")
