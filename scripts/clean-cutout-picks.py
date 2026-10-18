"""Apply only visually selected open-space masks from the user's second cutout review.
RGB and dimensions stay unchanged. Candidates are generated before --apply.
"""
import json,sys,hashlib,io,os,time
from pathlib import Path
from collections import deque
import numpy as np
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'output/cutout-pass-2';OUT.mkdir(parents=True,exist_ok=True)
ARCHIVE=ROOT/'art-source/cutout-pass-2';BACKUP=ARCHIVE/'originals'
source=Path(sys.argv[1]);picks=json.loads(source.read_text(encoding='utf-8'))
catalog=json.loads((ROOT/'anim/cutout-review-data.json').read_text(encoding='utf-8'))
known={o['id']:o for o in catalog['images']};seen=set()
assert picks['type']=='size-em-up-cutout-picks' and picks['version']==1
for row in picks['images']:
 assert row['id'] in known and row['id'] not in seen,'Unknown or repeated image'
 assert row['image']==known[row['id']]['image'],'Unexpected artwork path'
 assert row['decision'] in ('fix','okay',None)
 seen.add(row['id'])
assert len(seen)==len(known)==480
rules=json.loads((ARCHIVE/'rules.json').read_text(encoding='utf-8'))
flagged=[o for o in picks['images'] if o['decision']=='fix']
assert set(rules)<=set(o['id'] for o in flagged)

def components(mask):
 h,w=mask.shape;seen=np.zeros_like(mask);out=[]
 for sy,sx in zip(*np.where(mask)):
  if seen[sy,sx]:continue
  q=deque([(int(sx),int(sy))]);seen[sy,sx]=1;pts=[]
  while q:
   x,y=q.popleft();pts.append((x,y))
   for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
    if 0<=nx<w and 0<=ny<h and mask[ny,nx] and not seen[ny,nx]:seen[ny,nx]=1;q.append((nx,ny))
  if len(pts)>=3:out.append(pts)
 return sorted(out,key=lambda p:-len(p))

baseline={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((ROOT/'items').glob('*.webp'))}
old_manifest=ARCHIVE/'manifest.json'
if old_manifest.exists():baseline=json.loads(old_manifest.read_text())['beforeHashes']
report=[]
for o in flagged:
 oid=o['id'];path=ROOT/o['image'];original=BACKUP/(oid+'.webp')
 src=original if original.exists() else path
 assert hashlib.sha256(src.read_bytes()).hexdigest()==o['sourceHash'],'Source changed since review: '+oid
 im=Image.open(src).convert('RGBA');a=np.array(im);rgb=a[:,:,:3].astype(np.int16);h,w=a.shape[:2]
 neutral=(a[:,:,3]>50)&(rgb.min(2)>=220)&((rgb.max(2)-rgb.min(2))<=45)
 cc=components(neutral);erase=np.zeros((h,w),bool);rule=rules.get(oid,{})
 for index in rule.get('components',[]):
  assert index<len(cc),(oid,index)
  xs,ys=zip(*cc[index]);erase[ys,xs]=True
 if 'region' in rule:
  x0,y0,x1,y1=rule['region'];allowed=np.zeros_like(erase);allowed[round(y0*h):round(y1*h),round(x0*w):round(x1*w)]=True
  for x0,y0,x1,y1 in rule.get('protect',[]):allowed[round(y0*h):round(y1*h),round(x0*w):round(x1*w)]=False
  if rule.get('triangle'):
   yy,xx=np.indices(erase.shape);allowed &= np.abs(xx-w/2)<(yy/h)*w*.48
  for pts in cc:
   xs,ys=zip(*pts);xs=np.array(xs);ys=np.array(ys);cw=int(xs.max()-xs.min()+1);ch=int(ys.max()-ys.min()+1)
   if not (6<=len(pts)<=rule['maxArea'] and max(cw,ch)<=rule['maxSpan'] and np.all(allowed[ys,xs])):continue
   if rule.get('compact') and (min(cw,ch)<3 or max(cw,ch)>min(cw,ch)*3.5 or len(pts)/(cw*ch)<.3):continue
   erase[ys,xs]=True
 if rule.get('coolNet'):
  # Hand-bounded diamond interiors, rather than a color threshold across net
  # cords. Leave the original white strands and their soft shadows intact.
  holes=[[(253,337),(262,343),(253,350),(244,343)],[(222,350),(230,357),(222,364),(215,357)],[(282,351),(291,359),(282,366),(274,359)],[(253,365),(262,372),(253,379),(244,372)],[(222,380),(229,386),(220,395),(214,389)],[(282,380),(291,388),(282,395),(274,388)],[(253,396),(261,403),(252,411),(244,404)]]
  mask=Image.new('1',(w,h));draw=ImageDraw.Draw(mask)
  for polygon in holes:draw.polygon(polygon,fill=1)
  holemask=np.asarray(mask).astype(bool);padded=np.pad(holemask,3);near=np.zeros_like(holemask)
  for dy in range(7):
   for dx in range(7):near|=padded[dy:dy+h,dx:dx+w]
  holemask|=near&(rgb.min(2)>110)&(rgb.max(2)<235)&(rgb[:,:,2]>=rgb[:,:,0])
  erase|=holemask&(a[:,:,3]>0)
 # Only remove pale, partially transparent edge specks right beside a dark
 # outline. Solid white materials and highlights do not meet this test.
 def dilate(mask,radius):
  padded=np.pad(mask,radius);value=np.zeros_like(mask)
  for dy in range(radius*2+1):
   for dx in range(radius*2+1):value|=padded[dy:dy+h,dx:dx+w]
  return value
 dark=(a[:,:,3]>=220)&(rgb.max(2)<170)
 fringe=neutral&(a[:,:,3]<245)&dilate(a[:,:,3]==0,1)&dilate(dark,2)
 erase|=fringe
 for x0,y0,x1,y1 in rule.get('protectPixels',[]):erase[y0:y1,x0:x1]=False
 result=a.copy();result[erase,3]=0
 assert np.array_equal(result[:,:,:3],a[:,:,:3])
 count=int(np.count_nonzero(result[:,:,3]!=a[:,:,3]));cleaned=Image.fromarray(result)
 cleaned.save(OUT/(oid+'.png'))
 sheet=Image.new('RGB',(640,350),'#ff00ff');d=ImageDraw.Draw(sheet)
 for n,img in enumerate((im,cleaned)):
  thumb=img.copy();thumb.thumbnail((312,320));sheet.paste(thumb,(n*320+(320-thumb.width)//2,5+(320-thumb.height)//2),thumb);d.text((n*320+8,331),'Before' if n==0 else 'After',fill='#fff')
 sheet.save(OUT/(oid+'-compare.png'))
 if '--apply' in sys.argv:
  BACKUP.mkdir(parents=True,exist_ok=True)
  if not original.exists():original.write_bytes(path.read_bytes())
  if count:
   encoded=io.BytesIO();cleaned.save(encoded,format='WEBP',lossless=True,exact=True,method=6)
   if path.read_bytes()!=encoded.getvalue():
    temporary=path.with_suffix('.cutout-tmp');temporary.write_bytes(encoded.getvalue())
    for attempt in range(4):
     try:os.replace(temporary,path);break
     except OSError:
      if attempt==3:raise
      time.sleep(.2)
   assert np.array_equal(np.array(Image.open(path).convert('RGBA')),result),'Lossless pixel verification failed'
   np.savez_compressed(ARCHIVE/(oid+'-mask.npz'),mask=erase)
 note=rule.get('note','Cleaned pale edge specks beside the dark outline; white materials, highlights, glass and structural details were retained.' if count else 'No clearly separable white background found. White materials, highlights, glass and structural details were retained for your review.')
 report.append(dict(id=oid,name=o['name'],image=o['image'],changedPixels=count,fringePixels=int(fringe.sum()),dimensions=[w,h],note=note,beforeHash=o['sourceHash'],afterHash=hashlib.sha256(path.read_bytes()).hexdigest() if '--apply' in sys.argv else None))
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
if '--apply' in sys.argv:
 (ARCHIVE/'original-picks.json').write_text(json.dumps(picks,indent=2)+'\n')
 (ARCHIVE/'manifest.json').write_text(json.dumps(dict(beforeHashes=baseline,images=report),indent=2)+'\n')
print(json.dumps(dict(reviewed=len(report),changed=sum(o['changedPixels']>0 for o in report),pixels=sum(o['changedPixels'] for o in report),mode='applied' if '--apply' in sys.argv else 'candidates')))
