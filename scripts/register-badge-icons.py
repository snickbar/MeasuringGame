"""Turns art-source/badge-icons-2026-10-29/icons/*.png (white background) into transparent WebPs in icons/badges/.
The white background is removed by flood-filling from the image edges, so white inside an icon is kept."""
import sys, pathlib
import numpy as np
from PIL import Image
from collections import deque

root = pathlib.Path(__file__).resolve().parent.parent
src = root / "art-source" / "badge-icons-2026-10-29" / "icons"
dst = root / "icons" / "badges"
dst.mkdir(parents=True, exist_ok=True)
SIZE = 160

def is_bg(px):
    return px[0] >= 240 and px[1] >= 240 and px[2] >= 240

for f in sorted(src.glob("*.png")):
    im = Image.open(f).convert("RGBA")
    a = np.array(im)
    h, w = a.shape[:2]
    bg = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg(a[y, x]) and not bg[y, x]: bg[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg(a[y, x]) and not bg[y, x]: bg[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not bg[ny, nx] and is_bg(a[ny, nx]):
                bg[ny, nx] = True; q.append((ny, nx))
    a[bg, 3] = 0
    out = Image.fromarray(a)
    bbox = out.getchannel("A").getbbox()
    if bbox: out = out.crop(bbox)
    side = max(out.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(out, ((side - out.width) // 2, (side - out.height) // 2))
    canvas = canvas.resize((SIZE, SIZE), Image.LANCZOS)
    canvas.save(dst / (f.stem + ".webp"), "WEBP", quality=92, method=6)
    print(f.stem)
