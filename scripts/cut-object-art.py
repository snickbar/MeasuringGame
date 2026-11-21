#!/usr/bin/env python3
"""Cut single-object pictures drawn on a magenta (#FF00FF) background into trimmed transparent items/<id>.webp (longest side 512).
usage: cut-object-art.py OUT_DIR SRC.png [SRC.png ...] [--keep-canvas WIDTH]   (--keep-canvas: no trim, just resize to WIDTH, for backdrop layers)
The background is removed from the outside in (plus any enclosed pure-magenta hole, e.g. inside a handle), so pink parts of the object survive."""
import sys, os, numpy as np
from PIL import Image
from scipy import ndimage as ndi
keep = int(sys.argv[sys.argv.index('--keep-canvas') + 1]) if '--keep-canvas' in sys.argv else 0
args = [a for i, a in enumerate(sys.argv[2:], 2) if a != '--keep-canvas' and not (keep and sys.argv[i - 1] == '--keep-canvas')]
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
for src in args:
    arr = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
    d = np.sqrt((255 - arr[..., 0]) ** 2 + arr[..., 1] ** 2 + (255 - arr[..., 2]) ** 2)
    lab, n = ndi.label(d < 100)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    removed = np.isin(lab, list(border)) | (d < 40)
    near = ndi.binary_dilation(removed, iterations=3) & ~removed
    alpha = np.where(removed, 0.0, 1.0)
    alpha = np.where(near, np.clip((d - 55) / 85, 0, 1), alpha)
    rgb = arr.copy()
    spill = np.clip(np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1], 0, None)
    soft = near & (alpha < 1)
    for c in (0, 2): rgb[..., c] = np.where(soft, rgb[..., c] - spill * 0.9, rgb[..., c])
    im = Image.fromarray(np.dstack([np.clip(rgb, 0, 255), alpha * 255]).astype(np.uint8), 'RGBA')
    if not keep: im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox())
    s = (keep / im.width) if keep else 512 / max(im.size)
    im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    name = os.path.splitext(os.path.basename(src))[0] + '.webp'
    im.save(os.path.join(out, name), quality=90, method=6)
    print(name, im.size)
