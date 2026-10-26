"""Lossless format conversion and read-only alpha bounds for generated layers."""
from pathlib import Path
import json
from PIL import Image
root=Path(__file__).resolve().parents[1]
out=root/'anim/which-bigger-art';out.mkdir(exist_ok=True)
report={}
for name in ['elephant-open','elephant-closed','elephant-tail','elephant-trunk','mouse-body','mouse-foot']:
    source=root/'art-source/which-bigger-reactions'/(name+'.png')
    with Image.open(source) as original:
        im=original.convert('RGBA');alpha=im.getchannel('A')
        assert alpha.getextrema()==(0,255),name
        # Ignore barely visible generator edge noise when aligning the layers.
        box=alpha.point(lambda n:255 if n>=16 else 0).getbbox()
        assert box,name
        x,y,right,bottom=box
        target=out/(name+'.webp');im.save(target,lossless=True,method=6,exact=True)
        with Image.open(target) as check:assert check.convert('RGBA').tobytes()==im.tobytes(),name
        report[name]={'width':im.width,'height':im.height,'bounds':[x,y,right-x,bottom-y]}
(out/'assets.mjs').write_text('// Generated source dimensions; pixels retain original full resolution and alpha.\nexport const REACTION_ART = '+json.dumps(report,indent=2)+';\n')
print(json.dumps(report))
