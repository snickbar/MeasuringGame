#!/usr/bin/env python3
"""Cut a magenta-background pose sheet (grid of cols x rows) into transparent, same-size frames and one strip.
usage: cut-mascot-sheet.py SHEET.png COLS ROWS OUT_PREFIX [FRAME_W FRAME_H] [--count N]
Each frame keeps its place inside its cell (so feet stay on the same line), is cropped to the union box of every pose and scaled to fit the frame."""
import sys, numpy as np
from PIL import Image
a = [x for x in sys.argv[1:] if not x.startswith('--')]
sheet, cols, rows, prefix = a[0], int(a[1]), int(a[2]), a[3]
fw, fh = (int(a[4]), int(a[5])) if len(a) > 5 else (240, 255)
count = int(sys.argv[sys.argv.index('--count') + 1]) if '--count' in sys.argv else cols * rows
im = Image.open(sheet).convert('RGB'); W, H = im.size
arr = np.asarray(im).astype(np.float32)
d = np.sqrt((255 - arr[..., 0]) ** 2 + arr[..., 1] ** 2 + (255 - arr[..., 2]) ** 2)
alpha = np.clip((d - 70) / 90, 0, 1)
out = arr.copy()
edge = (alpha > 0) & (alpha < 1)
# despill: edge pixels lose their magenta cast (red and blue pulled down toward green)
spill = np.clip(np.minimum(out[..., 0], out[..., 2]) - out[..., 1], 0, None)
for c in (0, 2): out[..., c] = np.where(edge, out[..., c] - spill * 0.9, out[..., c])
rgba = np.dstack([np.clip(out, 0, 255), alpha * 255]).astype(np.uint8)
cw, ch = W / cols, H / rows
cells = []
for i in range(count):
    r, c = divmod(i, cols)
    cells.append(rgba[int(r * ch):int((r + 1) * ch), int(c * cw):int((c + 1) * cw)])
# union box over all poses (cell-relative), ignoring specks
x0 = y0 = 10 ** 9; x1 = y1 = 0
for cell in cells:
    ys, xs = np.where(cell[..., 3] > 40)
    if len(xs): x0, x1, y0, y1 = min(x0, xs.min()), max(x1, xs.max()), min(y0, ys.min()), max(y1, ys.max())
pad = 4; x0 = max(0, x0 - pad); y0 = max(0, y0 - pad); x1 += pad; y1 += pad
bw, bh = x1 - x0, y1 - y0
ys0, xs0 = np.where(cells[0][..., 3] > 40)
body_h = ys0.max() - ys0.min()
s = min((fw - 6) / bw, (fh - 4) / bh)
if '--match-height' in sys.argv: s = float(sys.argv[sys.argv.index('--match-height') + 1]) / body_h  # first pose's height in the frame
foot = ys0.max() + pad - y0  # the first pose's feet (cell-relative) stay on the frame's bottom line
frames = []
for cell in cells:
    crop = Image.fromarray(cell[y0:y1, x0:x1], 'RGBA').resize((max(1, round(bw * s)), max(1, round(bh * s))), Image.LANCZOS)
    f = Image.new('RGBA', (fw, fh), (0, 0, 0, 0)); f.paste(crop, ((fw - crop.width) // 2, fh - 2 - round(foot * s)), crop); frames.append(f)
strip = Image.new('RGBA', (fw * len(frames), fh), (0, 0, 0, 0))
for i, f in enumerate(frames): strip.paste(f, (i * fw, 0))
strip.save(prefix + '.webp', quality=88, method=6)
print(prefix, len(frames), 'frames', strip.size, 'union', (bw, bh), 'scale %.2f' % s)
