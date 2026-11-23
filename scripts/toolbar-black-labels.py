"""Redraws the labels on the five bottom toolbar icons (Home, Stats, Style, Settings, Menu): thin dark-brown letters straight on the cream plate, no heavy outline.
Always starts from the saved originals in art-source/retired-2026-11-22/toolbar-white-labels."""
import pathlib, shutil
import numpy as np
from PIL import Image, ImageFilter
root = pathlib.Path(__file__).resolve().parent.parent
orig = root / "art-source/retired-2026-11-22/toolbar-white-labels"
INK = np.array([62, 36, 18], float)
for n in ["home", "stats", "cosmetics", "settings", "menu"]:
    f = root / f"icons/toolbar-{n}.webp"; keep = orig / f.name
    if not keep.exists(): shutil.copy(f, keep)
    im = Image.open(keep).convert("RGBA"); a = np.array(im).astype(float); h, w_ = a.shape[:2]
    zone = np.zeros((h, w_), bool); zone[int(h * .74):] = True
    fill = np.clip((a[..., 2] - 206) / 22, 0, 1) * np.clip((a[..., 0] - 225) / 15, 0, 1) * zone
    fillm = Image.fromarray((fill * 255).astype("uint8"))
    ring = np.array(fillm.filter(ImageFilter.MaxFilter(7))).astype(float) / 255          # within ~3px of a letter
    lum = a[..., :3].mean(axis=2)
    outline = np.clip((ring - fill), 0, 1) * np.clip((200 - lum) / 60, 0, 1) * zone        # dark pixels hugging the letters
    # plate colour: the lightest cream pixels of the label area
    plate = np.median(a[int(h * .8):int(h * .93), :, :3][(a[int(h * .8):int(h * .93), :, 2] > 150) & (a[int(h * .8):int(h * .93), :, 2] < 205)], axis=0)
    out = a.copy()
    for i in range(3):
        out[..., i] = out[..., i] * (1 - outline) + plate[i] * outline       # outline melts into the plate
        out[..., i] = out[..., i] * (1 - fill) + INK[i] * fill               # letter fill becomes ink
    Image.fromarray(out.clip(0, 255).astype("uint8"), "RGBA").save(f, quality=92, method=6); print(f.name, plate.astype(int))
