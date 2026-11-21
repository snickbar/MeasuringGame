#!/usr/bin/env python3
"""Move the Rec Room picture down so the TV and boombox sit below the title ribbon on the Home screen.
The wall is vertical planks, so the thin band of bare wall above the posters is stretched upward to make the new headroom (nothing else is touched);
the same number of rows is cut from the empty carpet at the bottom so the picture keeps its size. usage: shift-home-retro.py SRC.png [SHIFT=230]"""
import sys
from PIL import Image
src = Image.open(sys.argv[1]).convert('RGB'); D = int(sys.argv[2]) if len(sys.argv) > 2 else 230
W, H = src.size
Y = 56                                                # first row below the ceiling corner: bare wall (planks and the corner line, all vertical)
band = src.crop((0, Y, W, Y + 4))
patch = src.crop((490, Y, 645, Y + 4)); band.paste(patch, (683, 0))   # the right poster starts at row ~50, so that stretch of wall is borrowed from the left of it
band.paste(src.crop((190, 72, 300, 76)), (190, 0))   # the corner's dark joint sits at row ~56, so the corner line is stretched from a little lower
top = band.resize((W, D + Y), Image.BICUBIC)          # stretched over the old ceiling rows too
out = Image.new('RGB', (W, H)); out.paste(top, (0, 0)); out.paste(src.crop((0, Y, W, H - D)), (0, D + Y))
out.save('/tmp/retro-home-shifted.png')
out.resize((1029, 2222), Image.LANCZOS).save('anim/home-art/home-retro/plate.webp', quality=86, method=6)
out.resize((704, 1520), Image.LANCZOS).save('home-retro.webp', quality=82, method=6)
print('shifted by', D, '->', round(D * 1029 / W), 'px on the 1029 canvas')
