"""Conservative, reviewed alpha-only cleanup. Never changes source RGB pixels.

Candidate mode writes previews only. --apply installs lossless WebP files after
review. Only the object IDs and bounded open areas below are eligible.
"""
import hashlib, json, sys
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'output'/'object-transparency-cleanup'
BACKUP=ROOT/'art-source'/'transparency-cleanup'/'originals'
OUT.mkdir(parents=True,exist_ok=True)

def components(mask):
    h,w=mask.shape; todo=mask.copy(); result=[]
    for y,x in zip(*np.where(mask)):
        if not todo[y,x]: continue
        points=[];queue=deque([(int(x),int(y))]);todo[y,x]=False
        while queue:
            px,py=queue.popleft();points.append((px,py))
            for nx,ny in ((px-1,py),(px+1,py),(px,py-1),(px,py+1)):
                if 0<=nx<w and 0<=ny<h and todo[ny,nx]:todo[ny,nx]=False;queue.append((nx,ny))
        result.append(points)
    return result

# All coordinates are normalized so original asset dimensions are retained.
# The masks cover open geometry, never a generic whole-image white threshold.
RULES={
 'soccer-goal':dict(boxes=[(.04,.10,.78,.85),(.82,.15,.985,.94)],min_area=3,max_area=1000,max_span=45,threshold=238),
 'tennis-racket':dict(boxes=[(.12,.045,.88,.51),(.35,.53,.65,.67)],min_area=15,max_area=1500,max_span=80,threshold=238),
 'teacup':dict(boxes=[(.79,.38,.93,.565)],min_area=10,max_area=5000,max_span=150,threshold=238),
 'power-line-tower':dict(boxes=[(.10,.035,.90,.72)],polygon=[(.5,0),(.05,1),(.95,1)],min_area=12,max_area=1600,max_span=70,threshold=235,compact=True),
 'tower-crane':dict(boxes=[(.35,.29,.51,.965),(.04,.13,.96,.17)],min_area=8,max_area=1000,max_span=55,threshold=235),
 'shuttlecock':dict(boxes=[(.12,.37,.87,.70)],min_area=80,max_area=1500,max_span=85,threshold=238,compact=True),
 'brooklyn-bridge':dict(boxes=[(.015,.07,.98,.63)],protect=[(58,0,148,209),(370,0,426,209),(431,0,445,209)],min_area=6,max_area=600,max_span=55,threshold=238),
}

report=[]
baseline={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((ROOT/'items').glob('*.webp'))}
for oid,rule in RULES.items():
    path=ROOT/'items'/f'{oid}.webp'
    original=BACKUP/f'{oid}.webp'
    im=Image.open(original if original.exists() else path).convert('RGBA')
    pixels=np.array(im);rgb=pixels[:,:,:3].astype(np.int16);alpha=pixels[:,:,3]
    eligible=(alpha>0)&(rgb.min(axis=2)>=rule['threshold'])&((rgb.max(axis=2)-rgb.min(axis=2))<=24)
    region=Image.new('1',im.size);draw=ImageDraw.Draw(region)
    for box in rule['boxes']:draw.rectangle(tuple(round(v*(im.width if i%2==0 else im.height)) for i,v in enumerate(box)),fill=1)
    allowed=np.asarray(region).astype(bool)
    if rule.get('polygon'):
        poly=Image.new('1',im.size);ImageDraw.Draw(poly).polygon([(round(x*im.width),round(y*im.height)) for x,y in rule['polygon']],fill=1)
        allowed &= np.asarray(poly).astype(bool)
    for x0,y0,x1,y1 in rule.get('protect',[]):allowed[y0:y1,x0:x1]=False
    erase=np.zeros_like(eligible);selected=[]
    for points in components(eligible):
        xs=np.array([p[0] for p in points]);ys=np.array([p[1] for p in points]);w=int(xs.max()-xs.min()+1);h=int(ys.max()-ys.min()+1)
        if not(rule['min_area']<=len(points)<=rule['max_area'] and max(w,h)<=rule['max_span']):continue
        if not np.all(allowed[ys,xs]):continue
        if rule.get('compact') and (min(w,h)<4 or max(w,h)>min(w,h)*4):continue
        if oid in ('soccer-goal','tennis-racket') and (max(w,h)>min(w,h)*4 or len(points)/(w*h)<.3):continue
        erase[ys,xs]=True;selected.append(dict(area=len(points),box=[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)]))
    result=pixels.copy();result[erase,3]=0
    assert np.array_equal(result[:,:,:3],pixels[:,:,:3]),'RGB must stay identical'
    cleaned=Image.fromarray(result)
    cleaned.save(OUT/f'{oid}.png')
    # Comparison keeps original dimensions and shows cutouts against colored ground.
    sheet=Image.new('RGB',(640,310),'#799486');d=ImageDraw.Draw(sheet)
    for index,image in enumerate((im,cleaned)):
        thumb=image.copy();thumb.thumbnail((300,265));sheet.paste(thumb,(index*320+(320-thumb.width)//2,5+(265-thumb.height)//2),thumb)
        d.text((index*320+10,280),'Before' if index==0 else 'After',fill='#ffffff')
    sheet.save(OUT/f'{oid}-comparison.png')
    report.append(dict(id=oid,changedPixels=int(erase.sum()),components=selected,dimensions=list(im.size)))
    if '--apply' in sys.argv and erase.any():
        BACKUP.mkdir(parents=True,exist_ok=True)
        if not original.exists():original.write_bytes(path.read_bytes())
        cleaned.save(path,format='WEBP',lossless=True,exact=True,method=6)
        reread=np.array(Image.open(path).convert('RGBA'))
        assert np.array_equal(reread,result),'Lossless encoding must preserve every RGBA pixel'
(OUT/'report.json').write_text(json.dumps(report,indent=2))
if '--apply' in sys.argv:
    manifest=ROOT/'art-source'/'transparency-cleanup'/'manifest.json'
    saved=json.loads(manifest.read_text()) if manifest.exists() else dict(audited=len(baseline),beforeHashes=baseline)
    saved['changes']=report
    manifest.write_text(json.dumps(saved,indent=2)+'\n')
print(json.dumps([{k:v for k,v in r.items() if k!='components'} for r in report]))
