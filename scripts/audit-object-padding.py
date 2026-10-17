"""Read-only alpha/white-border audit of the actual object catalog."""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

root=Path(__file__).resolve().parent.parent
out=root/'output'/'object-padding-audit'
out.mkdir(parents=True,exist_ok=True)
objects=json.loads((root/'anim/scenery-object-data.json').read_text())['objects']
known_paths={o['image'] for o in objects}
objects += [dict(id=p.stem,name=p.stem+' (alternate artwork)',image=p.relative_to(root).as_posix())
            for p in sorted((root/'items').glob('*.webp')) if p.relative_to(root).as_posix() not in known_paths]
rows=[]
for obj in objects:
    path=root/obj['image']
    with Image.open(path) as src:
        im=src.convert('RGBA'); a=np.asarray(im); alpha=a[:,:,3]
        ys,xs=np.where(alpha>0)
        bounds=[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)] if len(xs) else None
        rgb=a[:,:,:3].astype(np.int16)
        white=(alpha>240)&(rgb.min(axis=2)>=240)&((rgb.max(axis=2)-rgb.min(axis=2))<=16)
        edge=np.concatenate([white[0],white[-1],white[:,0],white[:,-1]])
        margin=1-(bounds[2]-bounds[0])*(bounds[3]-bounds[1])/(im.width*im.height) if bounds else 1
        rows.append(dict(id=obj['id'],name=obj['name'],image=obj['image'],width=im.width,height=im.height,bounds=bounds,
                         emptyArea=round(margin,4),whiteBorder=round(float(edge.mean()),4),opaque=bool(np.all(alpha==255))))
(out/'audit.json').write_text(json.dumps(rows,indent=2))
suspects=[r for r in rows if r['whiteBorder']>.03]
padding=sorted([r for r in rows if r['emptyArea']>.08],key=lambda r:-r['emptyArea'])
for name,group in [('white-border',suspects),('padding',padding)]:
    for page in range(0,len(group),60):
        chunk=group[page:page+60]; sheet=Image.new('RGB',(900,((len(chunk)+5)//6)*130),'#d5e5dd'); d=ImageDraw.Draw(sheet)
        for i,r in enumerate(chunk):
            x=(i%6)*150;y=(i//6)*130
            im=Image.open(root/r['image']).convert('RGBA'); im.thumbnail((140,100))
            sheet.paste(im,(x+(150-im.width)//2,y),im)
            d.text((x+4,y+101),r['id'][:22],fill='#252525')
            d.text((x+4,y+114),f"empty {r['emptyArea']:.0%} white {r['whiteBorder']:.0%}",fill='#555555')
        sheet.save(out/f'{name}-{page//60+1}.jpg')
print(json.dumps(dict(total=len(rows),whiteBorderSuspects=len(suspects),largeTransparentPadding=len(padding),
                     whiteIDs=[r['id'] for r in suspects],largestPadding=[(r['id'],r['emptyArea']) for r in padding[:20]])))
