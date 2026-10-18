"""Apply hand-selected alpha corrections from the third user cutout review.

Run without --apply to produce candidates. Original RGB and dimensions are never
changed. Saved originals and exact before/after alpha arrays make this reversible.
"""
import hashlib, io, json, os, sys, time
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
ARCHIVE = ROOT / 'art-source/cutout-pass-3'
BACKUP = ARCHIVE / 'originals'
OUT = ROOT / 'output/cutout-pass-3'
OUT.mkdir(parents=True, exist_ok=True)
rules = json.loads((ARCHIVE / 'rules.json').read_text())
source = Path(sys.argv[1])
picks = json.loads(source.read_text(encoding='utf-8'))
assert picks['type'] == 'size-em-up-cutout-picks' and picks['version'] == 1
catalog = json.loads((ROOT / 'anim/cutout-review-data.json').read_text())
known = {o['id']: o for o in catalog['images']}
assert len(picks['images']) == len(known) == 480
assert len({o['id'] for o in picks['images']}) == 480
flagged = [o for o in picks['images'] if o['decision'] == 'fix']
assert set(rules) == {o['id'] for o in flagged}
for o in picks['images']:
    assert o['id'] in known and o['image'] == known[o['id']]['image']
    assert o['decision'] in ('fix', 'okay', None)

def components(mask):
    h, w = mask.shape
    seen = np.zeros_like(mask)
    result = []
    for sy, sx in zip(*np.where(mask)):
        if seen[sy, sx]: continue
        q = deque([(int(sx), int(sy))]); seen[sy, sx] = True; pts = []
        while q:
            x, y = q.popleft(); pts.append((x, y))
            for nx, ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                if 0 <= nx < w and 0 <= ny < h and mask[ny,nx] and not seen[ny,nx]:
                    seen[ny,nx] = True; q.append((nx,ny))
        if len(pts) >= 3: result.append(pts)
    return sorted(result, key=lambda p: -len(p))

def dilate(mask):
    h,w=mask.shape; p=np.pad(mask,1)
    return p[1:h+1,:w] | p[1:h+1,2:] | p[:h,1:w+1] | p[2:,1:w+1] | mask

def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()

baseline = {p.name: digest(p) for p in sorted((ROOT/'items').glob('*.webp'))}
if (ARCHIVE/'manifest.json').exists():
    baseline=json.loads((ARCHIVE/'manifest.json').read_text())['beforeHashes']
report=[]
for o in flagged:
    oid=o['id']; path=ROOT/o['image']; original=BACKUP/(oid+'.webp')
    src=original if original.exists() else path
    assert digest(src)==o['sourceHash'], 'Artwork changed since review: '+oid
    a=np.array(Image.open(src).convert('RGBA')); result=a.copy()
    rgb=a[:,:,:3].astype(int); h,w=a.shape[:2]; rule=rules[oid]
    neutral=(a[:,:,3]>40)&(rgb.min(2)>=205)&((rgb.max(2)-rgb.min(2))<=55)
    cc=components(neutral); erase=np.zeros((h,w),bool)
    for index in rule['components']:
        xs,ys=zip(*cc[index]); erase[ys,xs]=True
    for x0,y0,x1,y1 in rule.get('componentBounds',[]):
        for pts in cc:
            xs,ys=zip(*pts)
            if min(xs)>=x0 and max(xs)<x1 and min(ys)>=y0 and max(ys)<y1:
                erase[ys,xs]=True
    for x0,y0,x1,y1 in rule.get('extraRegions',[]):
        erase[y0:y1,x0:x1] |= neutral[y0:y1,x0:x1]
    # Extend a selected hole by at most two pale edge pixels, bounded by the
    # existing dark outlines. Never threshold the whole artwork.
    pale=(a[:,:,3]>0)&(rgb.min(2)>=180)&((rgb.max(2)-rgb.min(2))<=60)
    for _ in range(rule.get('grow',2)): erase |= dilate(erase)&pale
    result[:,:,3][erase]=0
    if any(k in rule for k in ('restoreAll','restoreOpaque','restoreRects','restorePriorComponents')):
        prior=np.array(Image.open(ROOT/'art-source/cutout-pass-2/originals'/f'{oid}.webp').convert('RGBA'))
        assert prior.shape==a.shape and np.array_equal(prior[:,:,:3],a[:,:,:3])
        restore=np.zeros((h,w),bool)
        if rule.get('restoreAll'): restore[:]=True
        if rule.get('restoreOpaque'): restore=(prior[:,:,3]==255)&(a[:,:,3]==0)
        for x0,y0,x1,y1 in rule.get('restoreRects',[]): restore[y0:y1,x0:x1]=True
        if 'restorePriorComponents' in rule:
            prgb=prior[:,:,:3].astype(int)
            pcc=components((prior[:,:,3]>50)&(prgb.min(2)>=220)&((prgb.max(2)-prgb.min(2))<=45))
            for index in rule['restorePriorComponents']:
                xs,ys=zip(*pcc[index]); restore[ys,xs]=True
        result[:,:,3][restore]=prior[:,:,3][restore]
        result[:,:,3][erase]=0
    changed=result[:,:,3]!=a[:,:,3]
    assert changed.any(), 'No correction selected for '+oid
    Image.fromarray(result).save(OUT/(oid+'-candidate.png'))
    preview=Image.new('RGB',(1040,560),'#faf6eb'); d=ImageDraw.Draw(preview)
    d.text((10,5),oid+' — before / after',fill='black')
    for n,arr in enumerate((a,result)):
        im=Image.fromarray(arr); im.thumbnail((500,500))
        bg=Image.new('RGBA',(510,510),'magenta');bg.alpha_composite(im,((510-im.width)//2,(510-im.height)//2))
        preview.paste(bg.convert('RGB'),(n*520,30))
    preview.save(OUT/(oid+'-comparison.png'))
    row={'id':oid,'name':o['name'],'image':o['image'],'note':rule['note'],
         'changedPixels':int(changed.sum()),'removedPixels':int((result[:,:,3]<a[:,:,3]).sum()),
         'restoredPixels':int((result[:,:,3]>a[:,:,3]).sum()),
         'dimensions':[w,h],'beforeHash':o['sourceHash']}
    if '--apply' in sys.argv:
        BACKUP.mkdir(parents=True,exist_ok=True)
        if not original.exists(): original.write_bytes(path.read_bytes())
        buf=io.BytesIO();Image.fromarray(result).save(buf,format='WEBP',lossless=True,exact=True,method=6)
        content=buf.getvalue()
        if path.read_bytes()!=content:
            temp=path.with_suffix('.cutout-tmp'); temp.write_bytes(content)
            for attempt in range(4):
                try: os.replace(temp,path); break
                except OSError:
                    if attempt==3: raise
                    time.sleep(.2)
        assert np.array_equal(np.array(Image.open(path).convert('RGBA')),result)
        np.savez_compressed(ARCHIVE/(oid+'-alpha.npz'),before=a[:,:,3],after=result[:,:,3])
        row['afterHash']=digest(path)
    report.append(row)
if '--apply' in sys.argv:
    (ARCHIVE/'original-picks.json').write_text(json.dumps(picks,indent=2)+'\n',encoding='utf-8')
    (ARCHIVE/'manifest.json').write_text(json.dumps({'beforeHashes':baseline,'images':report},indent=2)+'\n',encoding='utf-8')
(OUT/'candidate-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'images':len(report),'changedPixels':sum(o['changedPixels'] for o in report),'applied':'--apply' in sys.argv}))
