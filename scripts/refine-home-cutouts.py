"""Remove soft rectangular matte fringes; retain opaque illustrated outlines.

Run once on the approved source files. Originals are archived outside runtime.
The alpha remap leaves RGB and dimensions alone, and retains antialiasing at the
opaque silhouette. It is deliberately not used on smoke, flames or glass FX.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'anim/home-art'
SOURCE = ROOT / 'art-source/home-refinements'

def clean(im):
    im = im.convert('RGBA')
    im.putalpha(im.getchannel('A').point(lambda a: max(0, min(255, round((a-165)*255/75)))))
    return im

if __name__ == '__main__':
    backup = SOURCE / 'before-matte-cleanup'
    backup.mkdir(parents=True, exist_ok=True)
    files = list(ART.glob('hero2-*.webp')) + list((ART/'top').glob('*.webp')) + list(ART.glob('critter-*.webp'))
    for path in files:
        if '-fx' in path.name or '-crit' in path.name:
            continue
        original = backup / path.relative_to(ART)
        original.parent.mkdir(parents=True, exist_ok=True)
        if not original.exists():
            original.write_bytes(path.read_bytes())
        clean(Image.open(original)).save(path, 'WEBP', lossless=True, method=6)
    arm = clean(Image.open(SOURCE/'robot-arm-open.png'))
    arm = arm.crop(arm.getbbox()).resize((409,830), Image.Resampling.LANCZOS)
    arm.save(ART/'refined/robot-arm-open.webp', lossless=True, method=6)
    bowl = clean(Image.open(SOURCE/'corgi-bowl.png'))
    bowl = bowl.crop(bowl.getbbox()).rotate(18, resample=Image.Resampling.BICUBIC, expand=True)
    bowl = bowl.crop(bowl.getbbox()).resize((410,300), Image.Resampling.LANCZOS)
    # Same full source canvas as the stack, so the new top stays registered.
    canvas = Image.new('RGBA',(1024,1536)); canvas.alpha_composite(bowl,(345,108))
    canvas.save(ART/'refined/corgi-bowl.webp', lossless=True, method=6)
