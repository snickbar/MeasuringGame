"""Copy generated artwork to lossless WebP; inspect alpha without editing art.

Original generated PNGs stay in art-source. Preview sheets are QA artifacts only.
Runtime images retain their full resolution and original transparency.
"""
from pathlib import Path
import argparse, json
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'art-source/monthly-expansion-55'
OUT=ROOT/'output/monthly-expansion-55'
parser=argparse.ArgumentParser();parser.add_argument('--available',action='store_true');args=parser.parse_args()
entries=json.loads((SOURCE/'requested-prompts.json').read_text(encoding='utf-8'))
assert len(entries)==55 and len({e['file'] for e in entries})==55
missing=[e['file'] for e in entries if not (SOURCE/(Path(e['file']).stem+'.png')).exists()]
if missing and not args.available:raise RuntimeError('Missing generated art: '+', '.join(missing))
OUT.mkdir(parents=True,exist_ok=True);report=[]
for e in entries:
    source=SOURCE/(Path(e['file']).stem+'.png')
    if not source.exists():continue
    target=(ROOT/e['file']).resolve()
    assert target.parent==ROOT/'items' and target.suffix=='.webp'
    with Image.open(source) as original:
        im=original.convert('RGBA');alpha=im.getchannel('A');bounds=alpha.getbbox()
        assert bounds and alpha.getextrema()==(0,255),'Missing transparency: '+e['file']
        # Preserve the generator's full canvas, including naturally wide icons.
        # The game renders icons with object-fit: contain; never crop or stretch.
        assert .33 <= im.width/im.height <= 3,'Unexpected canvas: '+e['file']
        assert all(im.getpixel(p)[3]<=2 for p in [(0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)]),'Opaque corner: '+e['file']
        im.save(target,lossless=True,method=6,exact=True)
        with Image.open(target) as check:
            assert check.size==im.size and check.convert('RGBA').tobytes()==im.tobytes(),'Lossless roundtrip failed: '+e['file']
        report.append({**{k:e[k] for k in ['month','name','file']},'width':im.width,'height':im.height,'alphaBounds':bounds,'bytes':target.stat().st_size})

for page in range(0,len(report),16):
    rows=report[page:page+16];sheet=Image.new('RGB',(880,((len(rows)+3)//4)*240),'#f5efd9');draw=ImageDraw.Draw(sheet)
    for i,row in enumerate(rows):
        x=i%4*220;y=i//4*240
        art=Image.open(ROOT/row['file']).convert('RGBA');art.thumbnail((200,200))
        sheet.paste(art,(x+(220-art.width)//2,y+(200-art.height)//2),art)
        draw.text((x+6,y+204),row['name'][:29],fill='#3d291c');draw.text((x+6,y+221),row['month'],fill='#6f6452')
    sheet.save(OUT/('review-'+str(page//16+1)+'.jpg'),quality=95)
(SOURCE/'runtime-assets.json').write_text(json.dumps({'assets':report,'missing':missing},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'converted':len(report),'missing':len(missing),'bytes':sum(r['bytes'] for r in report)}))
