"""Build the black & white desktop wallpaper from a source photo.

Usage:  python tools/wallpaper.py path/to/photo.jpg

Writes assets/img/wallpaper-{2560,1440,900}.webp and wallpaper.jpg (1920 px fallback).
Current source: "Bogotá, Monserrate, 2023-06 CN-02.jpg" by Steffen Schmitz (Carschten),
Wikimedia Commons, CC BY-SA 4.0 — see assets/img/WALLPAPER-CREDIT.md.
"""
import sys
from pathlib import Path

from PIL import Image, ImageOps, ImageEnhance

root = Path(__file__).resolve().parent.parent
out = root / "assets" / "img"
src = Image.open(sys.argv[1])
src = ImageOps.exif_transpose(src)
bw = ImageOps.grayscale(src)
bw = ImageOps.autocontrast(bw, cutoff=0.5)
bw = ImageEnhance.Contrast(bw).enhance(1.08)

def resized(width):
    h = round(bw.height * width / bw.width)
    return bw.resize((width, h), Image.LANCZOS) if width < bw.width else bw

for w in (2560, 1440, 900):
    p = out / f"wallpaper-{w}.webp"
    resized(w).save(p, "WEBP", quality=74, method=6)
    print(p.name, p.stat().st_size)
p = out / "wallpaper.jpg"
resized(1920).save(p, "JPEG", quality=76, optimize=True, progressive=True)
print(p.name, p.stat().st_size)
