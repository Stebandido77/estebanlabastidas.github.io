"""Make the 1400 px grid/viewer versions of the visualizations (quality ~72).

Usage:  python tools/plates.py
Reads assets/visualizations/*.jpg (originals, used only by "Open full size") and writes
assets/visualizations/<name>-1400.jpg next to them.
"""
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parent.parent / "assets" / "visualizations"
for src in sorted(root.glob("*.jpg")):
    if src.stem.endswith("-1400"):
        continue
    im = Image.open(src).convert("RGB")
    if im.width > 1400:
        im = im.resize((1400, round(im.height * 1400 / im.width)), Image.LANCZOS)
    dst = src.with_name(f"{src.stem}-1400.jpg")
    im.save(dst, "JPEG", quality=72, optimize=True, progressive=True)
    print(f"{dst.name}: {src.stat().st_size // 1024} KB -> {dst.stat().st_size // 1024} KB")
