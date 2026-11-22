"""High Stakes pig: a few frames (poses 1 and 3 and their connecting frames) had gold coins while every other pose uses the red and white poker chip.
Recolors those coins into poker chips in icons/mascot-poses/pig.webp and pig-motion.webp. Originals are kept in art-source/retired-2026-11-22/pig-gold-coins/.
Search boxes are in 256px cell coordinates: (cell, x0, y0, x1, y1). A gold blob inside a box that is big enough to be a coin becomes a chip; hat band, monocle and sparkles are left alone."""
import pathlib, math
import numpy as np
from PIL import Image
from scipy import ndimage
root = pathlib.Path(__file__).resolve().parent.parent
S = 256
BOXES = {  # motion strip cell -> search box
    1: (55, 65, 125, 135), 9: (55, 65, 125, 135),
    3: (130, 40, 256, 160), 12: (130, 50, 256, 160), 13: (130, 40, 256, 160),
}
def is_gold(a):
    r, g, b, al = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int), a[..., 3]
    return (al > 128) & (r > 200) & (g > 150) & (b < 120) & (r - b > 110)
def to_chip(arr, mask):
    ys, xs = np.nonzero(mask)
    cy, cx = ys.mean(), xs.mean()
    pts = np.stack([xs - cx, ys - cy])
    vals, vecs = np.linalg.eigh(np.cov(pts))
    ax = np.sqrt(np.maximum(vals, 1e-6)) * 2.0  # semi-axes of a filled ellipse
    u = (vecs.T @ pts) / ax[:, None]
    ang = np.arctan2(u[1], u[0]); rad = np.hypot(u[0], u[1])
    lum = arr[ys, xs, :3].astype(float).mean(axis=1) / 255.0
    shade = np.clip(1.0 + (lum - lum.mean()) * 0.9, 0.82, 1.08)
    sector = (np.floor((ang + math.pi) / (2 * math.pi) * 12).astype(int)) % 2
    white = ((rad > 0.60) & (sector == 0)) | ((rad > 0.36) & (rad < 0.50))
    col = np.where(white[:, None], np.array([250, 246, 240]), np.array([222, 52, 56])).astype(float) * shade[:, None]
    arr[ys, xs, :3] = np.clip(col, 0, 255).astype("uint8")
    # the coin's gold-brown rim becomes the same dark outline the chips have
    ring = ndimage.binary_dilation(mask, iterations=2) & ~mask & (arr[..., 3] > 40)
    r, g, b = arr[..., 0].astype(int), arr[..., 1].astype(int), arr[..., 2].astype(int)
    ring &= (r > 120) & (b < 110) & (g < 200) & (g > 60) & (r - b > 60) & ~((r > 235) & (g > 200))
    arr[ring, 0], arr[ring, 1], arr[ring, 2] = 96, 30, 32
def fix(path, cells):
    im = Image.open(path).convert("RGBA"); arr = np.array(im)
    n = 0
    for c, (x0, y0, x1, y1) in cells.items():
        tile = arr[:, c * S:(c + 1) * S]
        gold = is_gold(tile)
        box = np.zeros_like(gold); box[y0:y1, x0:x1] = True
        lab, num = ndimage.label(gold & box)
        for i in range(1, num + 1):
            m = lab == i
            if m.sum() < 110: continue  # sparkles and glints
            yy, xx = np.nonzero(m)
            if max(np.ptp(yy), np.ptp(xx)) > 2.4 * max(1, min(np.ptp(yy), np.ptp(xx))): continue  # thin rays
            to_chip(tile, m); n += 1
        arr[:, c * S:(c + 1) * S] = tile
    Image.fromarray(arr, "RGBA").save(path, quality=80, method=6)
    print(path.name, "coins turned into chips:", n)
fix(root / "icons/mascot-poses/pig-motion.webp", BOXES)
fix(root / "icons/mascot-poses/pig.webp", {1: BOXES[1], 3: BOXES[3]})
