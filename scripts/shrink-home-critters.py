#!/usr/bin/env python3
"""Stores the Home screen's wandering creatures at the size they are actually drawn at.

Each creature used to be saved 1,000-1,500 px wide although the game never draws one wider than about 350 px, even
on a very sharp screen. The Home scene cannot appear until every picture on it has been downloaded and decoded, and a
slow phone spends most of that time on pixels nobody can see, so the creatures now carry only the pixels they need.

The size of each creature is its width on screen when the whole Home picture is 1700 device pixels wide (a 570 px
wide phone at 3x, or a large tablet), rounded up to a multiple of 16 and never narrower than 256. A normal phone shows
them smaller than that, so they are still drawn from more pixels than the screen has.

What does NOT change: the sizes in anim/home-art-layout.mjs stay those of the original pictures. The game places a
creature by percentages of that picture, so a smaller file with the same shape lands in exactly the same spot, and the
wing/leg shapes that are written in original-picture pixels still line up. Do not regenerate the layout from these
files (scripts/build-home-art-layout.cjs reads manifest.json, which has the original measurements, so that is safe).

Left alone on purpose: critter-holiday-mix-a.webp and critter-make-believe-a.webp are sprite sheets that the game
crops by pixel coordinates (anim/home-new-art.mjs), so they must keep their size.

The full-size originals are in Git history (before the commit that added this script).

Run from the repository root:   python3 scripts/shrink-home-critters.py          (shrink what is still too large)
                                python3 scripts/shrink-home-critters.py --check  (only report; exit 1 if any is too large)
"""
import os
import sys
from PIL import Image

ART = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'anim', 'home-art')

# critter-<name>.webp -> (width, height) it is stored at.
SIZES = {
    'ants-a': (352, 282), 'ants-b': (288, 263), 'sunflower-a': (288, 192), 'sunflower-b': (272, 227),
    'games-a': (288, 192), 'games-b': (304, 203), 'house-a': (272, 306), 'house-b': (256, 284),
    'snacks-a': (272, 227), 'snacks-b': (336, 304), 'town-a': (304, 253), 'town-b': (336, 269),
    'corgi-a': (256, 234), 'corgi-b': (272, 181), 'wheels-a': (352, 528), 'wheels-b': (272, 181),
    'lighthouse-a': (272, 181), 'lighthouse-b': (304, 253), 'underwater-a': (352, 235), 'underwater-b': (256, 384),
    'toy-box-a': (304, 313), 'toy-box-b': (272, 272), 'penguin-a': (336, 168), 'penguin-b': (256, 283),
    'cactus-a': (256, 269), 'cactus-b': (288, 192), 'giraffe-a': (336, 224), 'giraffe-b': (336, 224),
    'dragon-a': (256, 171), 'dragon-b': (304, 203), 'space-a': (256, 212), 'space-b': (256, 171),
}


def main():
    check_only = '--check' in sys.argv[1:]
    too_large, before_bytes, after_bytes, before_px, after_px = [], 0, 0, 0, 0
    for name, (width, height) in SIZES.items():
        path = os.path.join(ART, f'critter-{name}.webp')
        size_before = os.path.getsize(path)
        with Image.open(path) as source:
            source.load()
            current = source.size
            if current[0] <= width:  # already stored at (or below) its size
                before_bytes += size_before; after_bytes += size_before
                before_px += current[0] * current[1]; after_px += current[0] * current[1]
                continue
            too_large.append(name)
            before_bytes += size_before; before_px += current[0] * current[1]
            after_px += width * height
            if check_only:
                after_bytes += size_before
                print(f'{name}: {current[0]}x{current[1]} is larger than {width}x{height}')
                continue
            # Pillow resizes RGBA with premultiplied alpha, so the soft edges get no dark or light fringe.
            small = source.convert('RGBA').resize((width, height), Image.LANCZOS)
        small.save(path, 'WEBP', lossless=True, quality=100, method=6)
        after_bytes += os.path.getsize(path)
        print(f'{name}: {current[0]}x{current[1]} -> {width}x{height}  {size_before // 1024} KB -> {os.path.getsize(path) // 1024} KB')
    print(f'{len(too_large)} of {len(SIZES)} pictures {"are too large" if check_only else "were shrunk"}; '
          f'{before_px / 1e6:.1f} -> {after_px / 1e6:.2f} million pixels, {before_bytes / 1048576:.1f} -> {after_bytes / 1048576:.1f} MB')
    if check_only and too_large:
        sys.exit(1)


if __name__ == '__main__':
    main()
