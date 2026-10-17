"""Verify reviewed alpha edits and preserve every unrelated asset byte-for-byte."""
import hashlib,json
from pathlib import Path
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parent.parent
source=root/'art-source'/'transparency-cleanup'
manifest=json.loads((source/'manifest.json').read_text())
changed={o['id'] for o in manifest['changes']}
for name,digest in manifest['beforeHashes'].items():
    path=root/'items'/name
    if path.stem not in changed:
        assert hashlib.sha256(path.read_bytes()).hexdigest()==digest,'Unrelated asset changed: '+name
for entry in manifest['changes']:
    oid=entry['id']
    old=np.array(Image.open(source/'originals'/f'{oid}.webp').convert('RGBA'))
    new=np.array(Image.open(root/'items'/f'{oid}.webp').convert('RGBA'))
    assert old.shape==new.shape,'Image dimensions changed: '+oid
    assert np.array_equal(old[:,:,:3],new[:,:,:3]),'Artwork RGB changed: '+oid
    delta=old[:,:,3]!=new[:,:,3]
    assert int(delta.sum())==entry['changedPixels'],'Unexpected mask changes: '+oid
    assert np.all(new[delta,3]==0),'Cleanup may only remove alpha: '+oid
    assert np.array_equal(old[~delta],new[~delta]),'Untargeted pixels changed: '+oid

# Deliberately white/material-bearing regions that must not be cut out.
protected={
 'soccer-goal':[(0,0,22,305),(395,20,420,280)],
 'tennis-racket':[(70,340,160,512)],
 'teacup':[(80,120,390,390)],
 'power-line-tower':[(20,65,65,160),(157,65,210,160)],
 'tower-crane':[(0,90,190,145)],
 'shuttlecock':[(0,0,385,190),(184,190,201,350)],
 'brooklyn-bridge':[(58,0,148,209),(370,0,426,209),(431,0,445,209)],
}
for oid,rects in protected.items():
    a=np.array(Image.open(source/'originals'/f'{oid}.webp').convert('RGBA'))
    b=np.array(Image.open(root/'items'/f'{oid}.webp').convert('RGBA'))
    for x0,y0,x1,y1 in rects:
        assert np.array_equal(a[y0:y1,x0:x1],b[y0:y1,x0:x1]),'Protected material changed: '+oid
print(f"PASS: {manifest['audited']} images audited; {len(changed)} alpha-only corrections; {manifest['audited']-len(changed)} other images unchanged; RGB, dimensions and protected white materials preserved.")
