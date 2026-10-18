"""Local pixel repairs for seven objects in the user's fourth cutout review.

Default produces candidates; --apply saves lossless replacements and originals.
Only the pearl glare holes need RGB repair: their missing RGB pixels become white.
All other changes remove alpha from explicitly selected enclosed background gaps.
"""
import hashlib, io, json, os, sys
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parent.parent
ARCHIVE=ROOT/'art-source/cutout-pass-4'; OUT=ROOT/'output/cutout-pass-4'
ARCHIVE.mkdir(parents=True,exist_ok=True); OUT.mkdir(parents=True,exist_ok=True)
BACKUP=ARCHIVE/'originals'
picks=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
assert picks['type']=='size-em-up-cutout-picks' and picks['version']==1
catalog=json.loads((ROOT/'anim/cutout-review-data.json').read_text())
known={o['id']:o for o in catalog['images']}
assert len(picks['images'])==len(known)==480 and len({o['id'] for o in picks['images']})==480
flagged=[o for o in picks['images'] if o['decision']=='fix']
rules={
 'carousel':{'seeds':[[128,326],[211,326]],'maxArea':250,'note':'Cleared both remaining gaps: below the white horse head and between the brown horse neck and the central column.'},
 'excavator':{'seeds':[[485,193]],'maxArea':160,'note':'Cleared the small triangular opening between the linkage pieces above the shovel.'},
 'fishing-boat':{'seeds':[[328,190],[338,179],[302,207]],'maxArea':150,'note':'Cleared the narrow enclosed spaces between the mast and rigging ropes.'},
 'motorcycle':{'seeds':[[185,142]],'maxArea':250,'note':'Cleared the small gap to the left of the engine, under the fuel tank; kept the chrome engine casing.'},
 'pearl-necklace':{'note':'Repaired 24 transparent glare spots as opaque highlights. Missing color inside the tiny holes is white; the clasp opening stays transparent.'},
 'reindeer':{'seeds':[[258,410]],'maxArea':70,'note':'Cleared the tiny white gap between the two front legs.'},
 'water-tower':{'seeds':[[114,350]],'maxArea':600,'note':'Cleared the narrow white strip between the right side of the ladder and the central support; kept the ladder rail and the pole.'},
}
assert set(rules)=={o['id'] for o in flagged}
for o in picks['images']:
 assert o['id'] in known and o['image']==known[o['id']]['image'] and o['decision'] in ('fix','okay',None)

def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def flood(mask,x,y):
 h,w=mask.shape; assert mask[y,x],(x,y)
 q=deque([(x,y)]);seen={(x,y)}
 while q:
  x,y=q.popleft()
  for p in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
   nx,ny=p
   if 0<=nx<w and 0<=ny<h and mask[ny,nx] and p not in seen:seen.add(p);q.append(p)
 return seen
def dilate(m):
 h,w=m.shape;p=np.pad(m,1)
 return m|p[1:h+1,:w]|p[1:h+1,2:]|p[:h,1:w+1]|p[2:,1:w+1]

baseline={p.name:digest(p) for p in sorted((ROOT/'items').glob('*.webp'))}
if (ARCHIVE/'manifest.json').exists():baseline=json.loads((ARCHIVE/'manifest.json').read_text())['beforeHashes']
report=[]
for o in flagged:
 oid=o['id'];path=ROOT/o['image'];backup=BACKUP/(oid+'.webp');src=backup if backup.exists() else path
 assert digest(src)==o['sourceHash'],'Source changed: '+oid
 a=np.array(Image.open(src).convert('RGBA'));b=a.copy();h,w=a.shape[:2];rgb=a[:,:,:3].astype(int)
 erase=np.zeros((h,w),bool);glare=np.zeros((h,w),bool);glare_count=0
 if oid=='pearl-necklace':
  # Small enclosed alpha holes are highlight centers; exclude the clasp by its
  # explicit bounds. Outside transparency and the large necklace center remain.
  eligible=a[:,:,3]<250;seen=np.zeros((h,w),bool)
  for sy,sx in zip(*np.where(eligible)):
   if seen[sy,sx]:continue
   pts=flood(eligible,int(sx),int(sy));xs,ys=zip(*pts);seen[ys,xs]=True
   x0,y0,x1,y1=min(xs),min(ys),max(xs)+1,max(ys)+1
   if x0>=390 and x1<=440 and y0>=40 and y1<=85:continue
   if 100<=len(pts)<=500 and x1-x0<=30 and y1-y0<=25:
    assert x0>0 and y0>0 and x1<w and y1<h
    glare[ys,xs]=True;glare_count+=1
  assert glare_count==24
  b[:,:,3][glare]=255
  missing=glare&(a[:,:,3]==0)
  b[:,:,:3][missing]=255
 else:
  eligible=(a[:,:,3]>0)&(rgb.min(2)>175)&((rgb.max(2)-rgb.min(2))<65)
  for x,y in rules[oid]['seeds']:
   pts=flood(eligible,x,y);assert 10<len(pts)<=rules[oid]['maxArea'],(oid,len(pts))
   xs,ys=zip(*pts);erase[ys,xs]=True
  pale=(a[:,:,3]>0)&(rgb.min(2)>160)&((rgb.max(2)-rgb.min(2))<65)
  for _ in range(2):erase|=dilate(erase)&pale
  b[:,:,3][erase]=0
 delta=np.any(a!=b,axis=2);assert delta.any()
 Image.fromarray(b).save(OUT/(oid+'-candidate.png'))
 preview=Image.new('RGB',(1040,550),'#faf6eb');ImageDraw.Draw(preview).text((10,5),oid+' : before / after',fill='black')
 for n,arr in enumerate((a,b)):
  im=Image.fromarray(arr);im.thumbnail((500,500));bg=Image.new('RGBA',(510,510),'magenta');bg.alpha_composite(im,((510-im.width)//2,(510-im.height)//2));preview.paste(bg.convert('RGB'),(n*520,30))
 preview.save(OUT/(oid+'-comparison.png'))
 row={'id':oid,'name':o['name'],'image':o['image'],'note':rules[oid]['note'],'changedPixels':int(delta.sum()),'rgbChangedPixels':int(np.any(a[:,:,:3]!=b[:,:,:3],axis=2).sum()),'glareCount':glare_count,'beforeHash':o['sourceHash'],'dimensions':[w,h]}
 if '--apply' in sys.argv:
  BACKUP.mkdir(exist_ok=True)
  if not backup.exists():backup.write_bytes(path.read_bytes())
  data=io.BytesIO();Image.fromarray(b).save(data,format='WEBP',lossless=True,exact=True,method=6)
  temp=path.with_suffix('.cutout-tmp');temp.write_bytes(data.getvalue());os.replace(temp,path)
  assert np.array_equal(np.array(Image.open(path).convert('RGBA')),b)
  np.savez_compressed(ARCHIVE/(oid+'-patch.npz'),mask=delta,before=a[delta],after=b[delta],glare=glare,erase=erase)
  row['afterHash']=digest(path)
 report.append(row)
if '--apply' in sys.argv:
 (ARCHIVE/'original-picks.json').write_text(json.dumps(picks,indent=2)+'\n',encoding='utf-8')
 (ARCHIVE/'rules.json').write_text(json.dumps(rules,indent=2)+'\n',encoding='utf-8')
 (ARCHIVE/'manifest.json').write_text(json.dumps({'beforeHashes':baseline,'images':report},indent=2)+'\n',encoding='utf-8')
(OUT/'candidate-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'images':len(report),'changedPixels':sum(o['changedPixels'] for o in report),'applied':'--apply' in sys.argv}))
