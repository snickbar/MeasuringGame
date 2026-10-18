"""Exact pixel preservation and specific gap/highlight checks for review four."""
import hashlib,json
from pathlib import Path
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parent.parent;archive=root/'art-source/cutout-pass-4'
manifest=json.loads((archive/'manifest.json').read_text());rows=manifest['images'];ids={r['id'] for r in rows}
picks=json.loads((archive/'original-picks.json').read_text())
assert len(rows)==len(ids)==7 and ids=={r['id'] for r in picks['images'] if r['decision']=='fix'}
assert sum(r['decision']=='okay' for r in picks['images'])==473
for name,digest in manifest['beforeHashes'].items():
 if Path(name).stem not in ids:assert hashlib.sha256((root/'items'/name).read_bytes()).hexdigest()==digest,name
for row in rows:
 oid=row['id'];oldpath=archive/'originals'/f'{oid}.webp';path=root/row['image']
 assert hashlib.sha256(oldpath.read_bytes()).hexdigest()==row['beforeHash']
 assert hashlib.sha256(path.read_bytes()).hexdigest()==row['afterHash']
 a=np.array(Image.open(oldpath).convert('RGBA'));b=np.array(Image.open(path).convert('RGBA'))
 assert a.shape==b.shape and list(b.shape[1::-1])==row['dimensions']
 patch=np.load(archive/(oid+'-patch.npz'));m=patch['mask']
 assert np.array_equal(a[m],patch['before']) and np.array_equal(b[m],patch['after'])
 assert np.array_equal(a[~m],b[~m]) and int(m.sum())==row['changedPixels']
 if oid=='pearl-necklace':
  glare=patch['glare'];assert row['glareCount']==24 and np.all(b[:,:,3][glare]==255)
  assert np.array_equal(a[~glare],b[~glare])
  visible=a[:,:,3]>0;assert np.array_equal(a[:,:,:3][visible],b[:,:,:3][visible])
  missing=glare&(a[:,:,3]==0);assert np.all(b[:,:,:3][missing]==255)
  assert b[66,420,3]==0,'Clasp opening must stay transparent'
 else:
  assert np.array_equal(a[:,:,:3],b[:,:,:3]) and row['rgbChangedPixels']==0
  assert np.array_equal(m,patch['erase']) and np.all(b[:,:,3][m]==0)
samples={'carousel':[(128,326),(211,326)],'excavator':[(485,193)],'fishing-boat':[(328,190),(338,179),(302,207)],'motorcycle':[(185,142)],'reindeer':[(258,410)],'water-tower':[(114,350)]}
for oid,pts in samples.items():
 a=np.array(Image.open(root/f'items/{oid}.webp').convert('RGBA'))
 for x,y in pts:assert a[y,x,3]==0,(oid,x,y)
catalog=json.loads((root/'anim/cutout-review-data.json').read_text())
assert catalog['batch']['id']=='cutout-pass-4' and catalog['batch']['count']==7
assert {o['id'] for o in catalog['images'] if o.get('reviewBatch')=='cutout-pass-4'}==ids
for o in catalog['images']:assert hashlib.sha256((root/o['image']).read_bytes()).hexdigest()==o['sourceHash']
print('PASS: 7 exact pixel repairs, 24 opaque pearl highlights, 473 other files byte-identical; original dimensions, six alpha-only corrections and the seven-image review section verified.')
