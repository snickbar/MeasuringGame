import pathlib
import numpy as np
from PIL import Image
from collections import deque
root = pathlib.Path(__file__).resolve().parent.parent
src = root / "art-source/highlow-bird-shark-2026-11-22"
CELL = 256
def key_out(im):
    a = np.array(im.convert("RGB")).astype(int)
    h, w, _ = a.shape
    d = np.abs(a - np.array([255, 0, 255])).sum(axis=2)
    near = d < 150
    mask = np.zeros((h, w), bool)
    dq = deque([(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)] + [(0, x) for x in range(0, w, 5)] + [(h - 1, x) for x in range(0, w, 5)] + [(y, 0) for y in range(0, h, 5)] + [(y, w - 1) for y in range(0, h, 5)])
    while dq:
        y, x = dq.popleft()
        if y < 0 or x < 0 or y >= h or x >= w or mask[y, x] or not near[y, x]: continue
        mask[y, x] = True
        dq.extend([(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)])
    # enclosed magenta holes (between a tail and a leg, say), kept only when strongly magenta
    mask |= d < 60
    from PIL import ImageFilter
    alpha = Image.fromarray(np.where(mask, 0, 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.1))
    out = im.convert("RGBA"); out.putalpha(alpha)
    # despill: edge pixels lose their magenta tint
    arr = np.array(out).astype(int)
    edge = (arr[..., 3] > 0) & (arr[..., 3] < 255)
    spill = np.minimum(arr[..., 0], arr[..., 2]) - arr[..., 1]
    arr[..., 0] = np.where(edge, arr[..., 0] - np.clip(spill, 0, 255) // 2, arr[..., 0])
    arr[..., 2] = np.where(edge, arr[..., 2] - np.clip(spill, 0, 255) // 2, arr[..., 2])
    return Image.fromarray(np.clip(arr, 0, 255).astype("uint8"), "RGBA")
def cells(name, cols):
    im = key_out(Image.open(src / name))
    w, h = im.size
    cw, ch = w / cols, h / 2
    out = []
    for r in range(2):
        for c in range(cols):
            tile = im.crop((round(c * cw), round(r * ch), round((c + 1) * cw), round((r + 1) * ch)))
            out.append(tile.resize((CELL, CELL), Image.LANCZOS))
    return out
def write(frames, name):
    sheet = Image.new("RGBA", (CELL * len(frames), CELL), (0, 0, 0, 0))
    for i, f in enumerate(frames): sheet.alpha_composite(f, (i * CELL, 0))
    sheet.save(root / "icons/mascot-poses" / name, quality=80, method=6)
    print(name, sheet.size)
for who in ("bird", "shark"):
    poses, mid = cells(who + "-poses.png", 3), cells(who + "-between.png", 4)
    between = {0: (poses[0], poses[0]), 1: (poses[0], poses[0])}
    for p in range(2, 6): between[p] = (mid[(p - 2) * 2], mid[(p - 2) * 2 + 1])
    strip = poses + [f for p in range(6) for f in between[p]]
    write(poses, "hl" + who + ".webp"); write(strip, "hl" + who + "-motion.webp")
