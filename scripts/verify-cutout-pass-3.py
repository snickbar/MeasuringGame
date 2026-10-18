"""Verify exact third-review alpha corrections and all untouched artwork."""
import hashlib, json
from pathlib import Path
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parent.parent
archive=root/'art-source/cutout-pass-3'
manifest=json.loads((archive/'manifest.json').read_text())
picks=json.loads((archive/'original-picks.json').read_text())
rows=manifest['images']; ids={o['id'] for o in rows}
assert len(rows)==len(ids)==36
assert ids=={o['id'] for o in picks['images'] if o['decision']=='fix'}
assert sum(o['decision']=='okay' for o in picks['images'])==444
total=0
restorable={'basketball-backboard','pearl-necklace','space-needle','tower-crane'}
for name,digest in manifest['beforeHashes'].items():
    if Path(name).stem not in ids:
        assert hashlib.sha256((root/'items'/name).read_bytes()).hexdigest()==digest, name
for row in rows:
    oid=row['id']; original=archive/'originals'/f'{oid}.webp'
    later=root/'art-source/cutout-pass-4/originals'/f'{oid}.webp'
    current=later if later.exists() else root/row['image']
    assert hashlib.sha256(original.read_bytes()).hexdigest()==row['beforeHash']
    assert hashlib.sha256(current.read_bytes()).hexdigest()==row['afterHash']
    old=np.array(Image.open(original).convert('RGBA')); new=np.array(Image.open(current).convert('RGBA'))
    assert old.shape==new.shape and list(new.shape[1::-1])==row['dimensions']
    assert np.array_equal(old[:,:,:3],new[:,:,:3]), 'RGB changed: '+oid
    alpha=np.load(archive/f'{oid}-alpha.npz')
    assert np.array_equal(old[:,:,3],alpha['before']) and np.array_equal(new[:,:,3],alpha['after'])
    delta=old[:,:,3]!=new[:,:,3]
    assert int(delta.sum())==row['changedPixels']>0
    assert int((new[:,:,3]<old[:,:,3]).sum())==row['removedPixels']
    restore=new[:,:,3]>old[:,:,3]
    assert int(restore.sum())==row['restoredPixels']
    if restore.any():
        assert oid in restorable, 'Unexpected restoration: '+oid
        prior=np.array(Image.open(root/'art-source/cutout-pass-2/originals'/f'{oid}.webp').convert('RGBA'))
        assert np.array_equal(new[restore],prior[restore]), 'Restoration must match saved artwork: '+oid
    if oid=='basketball-backboard':
        assert np.array_equal(new,np.array(Image.open(root/'art-source/cutout-pass-2/originals/basketball-backboard.webp').convert('RGBA')))
    total+=row['changedPixels']
# Explicit material and corrected-gap samples, independent of rule indices.
transparent={'cranberry':[(340,121)],'pearl-necklace':[(420,66)],'reindeer':[(355,142)],
 'statue-of-liberty':[(52,106)],'water-tower':[(96,455),(39,430),(221,430)],
 'cupid':[(412,300)],'corgi':[(96,365)]}
for oid,points in transparent.items():
    a=np.array(Image.open(root/f'items/{oid}.webp').convert('RGBA'))
    for x,y in points: assert a[y,x,3]==0, f'Missed opening: {oid} {x},{y}'
for oid,points in {'space-needle':[(70,250),(69,480)],'grand-piano':[(254,403)],
                   'snorkel-mask':[(180,220),(340,220)],'shuttlecock':[(190,120)]}.items():
    before=np.array(Image.open(archive/'originals'/f'{oid}.webp').convert('RGBA'))
    after=np.array(Image.open(root/f'items/{oid}.webp').convert('RGBA'))
    for x,y in points:
        if oid=='space-needle': assert after[y,x,3]>0
        else: assert np.array_equal(before[y,x],after[y,x]), 'Protected material changed: '+oid
catalog=json.loads((root/'anim/cutout-review-data.json').read_text())
assert sum(o.get('reviewBatch')==catalog['batch']['id'] for o in catalog['images'])==catalog['batch']['count']
for o in catalog['images']:
    assert hashlib.sha256((root/o['image']).read_bytes()).hexdigest()==o['sourceHash']
print(f'PASS: 36 exact alpha corrections ({total:,} pixels), 444 other files byte-identical; original RGB/dimensions, saved restorations, protected materials and fresh-review catalog verified.')
