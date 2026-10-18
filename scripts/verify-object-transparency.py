"""Verify reviewed alpha edits and preserve every unrelated asset byte-for-byte."""
import hashlib,json
from pathlib import Path
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parent.parent
source=root/'art-source'/'transparency-cleanup'
manifest=json.loads((source/'manifest.json').read_text())
changed={o['id'] for o in manifest['changes']}
# Verify the first pass against its state before the separately verified second pass.
def prior_path(name):
    later=root/'art-source'/'cutout-pass-2'/'originals'/name
    if later.exists():return later
    later=root/'art-source'/'cutout-pass-3'/'originals'/name
    return later if later.exists() else root/'items'/name
for name,digest in manifest['beforeHashes'].items():
    path=prior_path(name)
    if path.stem not in changed:
        assert hashlib.sha256(path.read_bytes()).hexdigest()==digest,'Unrelated asset changed: '+name
for entry in manifest['changes']:
    oid=entry['id']
    old=np.array(Image.open(source/'originals'/f'{oid}.webp').convert('RGBA'))
    new=np.array(Image.open(prior_path(f'{oid}.webp')).convert('RGBA'))
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
 'excavator':[(367,19,457,41),(484,101,496,175),(390,200,512,301),(110,70,230,190)],
 'barstool':[(98,120,138,440)],
 'folding-chair':[(30,216,300,291)],
 'motorcycle':[(170,140,330,245)],
}
for oid,rects in protected.items():
    a=np.array(Image.open(source/'originals'/f'{oid}.webp').convert('RGBA'))
    b=np.array(Image.open(prior_path(f'{oid}.webp')).convert('RGBA'))
    for x0,y0,x1,y1 in rects:
        assert np.array_equal(a[y0:y1,x0:x1],b[y0:y1,x0:x1]),'Protected material changed: '+oid
for oid,seeds in {'excavator':[(248,155)],'barstool':[(70,307),(160,307)],'folding-chair':[(155,304),(180,330)]}.items():
    pixels=np.array(Image.open(prior_path(f'{oid}.webp')).convert('RGBA'))
    for x,y in seeds:assert pixels[y,x,3]==0,'Missed reviewed opening: '+oid
old=np.array(Image.open(source/'originals/motorcycle.webp').convert('RGBA'))
new=np.array(Image.open(prior_path('motorcycle.webp')).convert('RGBA'))
yy,xx=np.indices(old.shape[:2]);allowed=np.zeros(old.shape[:2],dtype=bool)
for cx,cy in [(77,213),(439,213)]:
    r=(xx-cx)**2+(yy-cy)**2;allowed|=(r>=25**2)&(r<=56**2)
assert np.array_equal(old[~allowed],new[~allowed]),'Motorcycle hubs/rims/body must stay intact'
print(f"PASS: {manifest['audited']} images audited; {len(changed)} alpha-only corrections; {manifest['audited']-len(changed)} other images unchanged; RGB, dimensions and protected white materials preserved.")
