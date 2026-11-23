"""Turns the white label letters on the five bottom toolbar icons (Home, Stats, Style, Settings, Menu) black so they read on the cream plate."""
import pathlib, shutil
import numpy as np
from PIL import Image
root = pathlib.Path(__file__).resolve().parent.parent
orig = root / "art-source/retired-2026-11-22/toolbar-white-labels"
for n in ["home", "stats", "cosmetics", "settings", "menu"]:
    f = root / f"icons/toolbar-{n}.webp"; keep = orig / f.name
    if not keep.exists(): shutil.copy(f, keep)
    im = Image.open(keep).convert("RGBA"); a = np.array(im).astype(float); h = a.shape[0]
    w = np.clip((a[..., 2] - 206) / 22, 0, 1) * np.clip((a[..., 0] - 225) / 15, 0, 1)   # letter fill is whiter (more blue) than the cream plate
    w[: int(h * .74)] = 0                                   # only the label plate along the bottom
    for i, v in enumerate((26, 17, 10)): a[..., i] = a[..., i] * (1 - w) + v * w
    Image.fromarray(a.clip(0, 255).astype("uint8"), "RGBA").save(f, quality=90, method=6); print(f.name)
