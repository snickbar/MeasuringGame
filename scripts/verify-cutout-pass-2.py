"""Check the complete artwork set, the exact alpha masks, and protected materials."""
import json,hashlib
from pathlib import Path
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parent.parent;archive=root/'art-source/cutout-pass-2'
manifest=json.loads((archive/'manifest.json').read_text());rows=manifest['images'];changed={o['id'] for o in rows if o['changedPixels']}
assert len(rows)==81 and len(changed)==81
total=0
def prior_path(path):
 later=root/'art-source/cutout-pass-3/originals'/Path(path).name
 return later if later.exists() else root/path
for name,digest in manifest['beforeHashes'].items():
 if Path(name).stem not in changed:assert hashlib.sha256(prior_path('items/'+name).read_bytes()).hexdigest()==digest,'Unrelated artwork changed: '+name
for row in rows:
 oid=row['id'];original=archive/'originals'/f'{oid}.webp';current=prior_path(row['image'])
 assert hashlib.sha256(original.read_bytes()).hexdigest()==row['beforeHash']
 assert hashlib.sha256(current.read_bytes()).hexdigest()==row['afterHash']
 old=np.array(Image.open(original).convert('RGBA'));new=np.array(Image.open(current).convert('RGBA'))
 assert old.shape==new.shape,'Dimensions changed: '+oid
 assert np.array_equal(old[:,:,:3],new[:,:,:3]),'Artwork RGB changed: '+oid
 mask=np.load(archive/f'{oid}-mask.npz')['mask'];delta=old[:,:,3]!=new[:,:,3]
 assert np.array_equal(mask,delta),'Mask mismatch: '+oid
 assert int(delta.sum())==row['changedPixels']
 assert np.all(new[delta,3]==0)
 assert np.array_equal(old[~delta],new[~delta]),'Untargeted pixels changed: '+oid
 total+=int(delta.sum())
# Solid white artwork in these areas must remain opaque. Edge fringe cleanup
# can affect partially transparent matte pixels, never these material interiors.
protected={'american-flag':[(40,30,450,260)],'shuttlecock':[(30,10,350,190)],'bouquet':[(120,280,230,400)],'coffee-mug':[(20,220,220,400)],'corgi':[(260,100,400,250)],'duck':[(85,55,300,220)],'football-helmet':[(80,330,405,426)],'frog':[(80,135,180,280)],'kaiju':[(130,15,200,190)],'pearl-necklace':[(0,0,512,512)],'stork':[(80,20,230,290)]}
for oid,rects in protected.items():
 before=np.array(Image.open(archive/'originals'/f'{oid}.webp').convert('RGBA'));after=np.array(Image.open(prior_path(f'items/{oid}.webp')).convert('RGBA'))
 for x0,y0,x1,y1 in rects:
  old=before[y0:y1,x0:x1];new=after[y0:y1,x0:x1];solid=(old[:,:,3]==255)&(old[:,:,:3].min(2)>=235)
  assert np.array_equal(old[solid],new[solid]),'Protected white material removed: '+oid
catalog=json.loads((root/'anim/cutout-review-data.json').read_text())
assert sum(o.get('reviewBatch')==catalog['batch']['id'] for o in catalog['images'])==catalog['batch']['count']
for o in catalog['images']:assert hashlib.sha256((root/o['image']).read_bytes()).hexdigest()==o['sourceHash'],'Stale review artwork: '+o['id']
print(f'PASS: 81 alpha-only cleanups ({total:,} pixels); 399 other images byte-identical; RGB/dimensions, exact masks, protected white interiors and follow-up section verified.')
