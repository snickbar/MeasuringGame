"""Rebuilds icons/mascot-poses/teamworlds.webp WITHOUT any rocket ship (the monkeys just float and react).
Rocket-free cells come from the original sheet (frames 1, 3, 4, 5); calm / happy / sad come from the older full pictures.
Frame order: 0 calm, 1 stars, 2 happy, 3 tumble, 4 gesture, 5 gesture, 6 sad, 7 sad (same as 6).
Needs art-source/retired-2026-11-22/teamworlds-with-rockets.webp (the original sheet)."""
import pathlib
from PIL import Image
root = pathlib.Path(__file__).resolve().parent.parent
old = Image.open(root / "art-source/retired-2026-11-22/teamworlds-with-rockets.webp").convert("RGBA")
cell = 256
def from_sheet(i): return old.crop((i * cell, 0, (i + 1) * cell, cell))
def from_picture(name, width=206):
    im = Image.open(root / f"anim/mode-mascots/teamworlds-monkeys-{name}.webp").convert("RGBA")
    h = round(im.height * width / im.width)
    im = im.resize((width, h), Image.LANCZOS)
    c = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
    c.alpha_composite(im, ((cell - width) // 2, (cell - h) // 2 + 6))
    return c
cells = [from_picture("calm"), from_sheet(1), from_picture("happy"), from_sheet(3), from_sheet(4), from_sheet(5), from_picture("sad"), from_picture("sad")]
sheet = Image.new("RGBA", (cell * 8, cell), (0, 0, 0, 0))
for i, c in enumerate(cells): sheet.alpha_composite(c, (i * cell, 0))
sheet.save(root / "icons/mascot-poses/teamworlds.webp", quality=92)
print("wrote teamworlds.webp", sheet.size)
