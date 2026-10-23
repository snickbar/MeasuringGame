"""Optional offline optimization. Production builds need no Python/Pillow.

Retain the exact PNG header and every non-IDAT chunk, including color profiles.
Only replace the compressed pixel stream when dimensions, color mode and every
decoded channel match. Original files also remain in Git history.
"""
from pathlib import Path
from PIL import Image
import io,json,hashlib,struct,zlib,subprocess,sys,shutil,time
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/png-optimization'
def digest(data):return hashlib.sha256(data).hexdigest()
def chunks(data):
    assert data[:8]==b'\x89PNG\r\n\x1a\n'
    result=[];pos=8
    while pos<len(data):
        size=struct.unpack('>I',data[pos:pos+4])[0];end=pos+size+12
        assert end<=len(data)
        kind=data[pos+4:pos+8];payload=data[pos+8:pos+8+size]
        assert zlib.crc32(kind+payload)&0xffffffff==struct.unpack('>I',data[pos+8+size:end])[0]
        result.append((kind,payload,data[pos:end]));pos=end
    return result
def png_chunk(kind,payload):return struct.pack('>I',len(payload))+kind+payload+struct.pack('>I',zlib.crc32(kind+payload)&0xffffffff)
if '--apply' in sys.argv:
    rows=json.loads((OUT/'results.json').read_text())
    for row in rows:
        original=ROOT/row['path'];candidate=OUT/'optimized'/row['path']
        assert digest(original.read_bytes()) in [row['beforeSha256'],row['afterSha256']]
        assert digest(candidate.read_bytes())==row['afterSha256']
        shutil.copy2(candidate,original)
    print(f'Applied {len(rows)} verified PNG streams; original dimensions, pixels, profiles and format retained.')
    sys.exit()
paths=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('./scripts/production-files.cjs').list().filter(p=>p.endsWith('.png'))))"],cwd=ROOT))
rows=[];started=time.perf_counter()
for number,name in enumerate(paths):
    original=ROOT/name;before=original.read_bytes()
    try:old=chunks(before)
    except AssertionError:
        print('Retaining original PNG with nonstandard chunks: '+name,flush=True)
        continue
    if any(kind==b'acTL' for kind,_,_ in old):continue
    im=Image.open(io.BytesIO(before));im.load()
    if im.mode not in ['RGB','RGBA']:continue
    cached=OUT/'optimized'/name
    if cached.exists():new=chunks(cached.read_bytes())
    else:
        buf=io.BytesIO();im.save(buf,format='PNG',optimize=True,compress_level=9)
        new=chunks(buf.getvalue())
    if old[0][0]!=b'IHDR' or old[0][1]!=new[0][1]:continue
    payload=b''.join(data for kind,data,_ in new if kind==b'IDAT')
    candidate=before[:8];placed=False
    for kind,data,raw in old:
        if kind==b'IDAT':
            if not placed:candidate+=png_chunk(b'IDAT',payload);placed=True
        else:candidate+=raw
    if len(candidate)>=len(before):continue
    decoded=Image.open(io.BytesIO(candidate));decoded.load()
    assert decoded.mode==im.mode and decoded.size==im.size and decoded.tobytes()==im.tobytes(),name
    assert [raw for kind,_,raw in old if kind!=b'IDAT']==[raw for kind,_,raw in chunks(candidate) if kind!=b'IDAT'],name
    for folder,contents in [('original',before),('optimized',candidate)]:
        target=OUT/folder/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(contents)
    rows.append({'path':name,'before':len(before),'after':len(candidate),'beforeSha256':digest(before),'afterSha256':digest(candidate),'pixelSha256':digest(im.tobytes()),'width':im.width,'height':im.height,'mode':im.mode})
    if len(rows)%50==0:print(f'{number+1}/{len(paths)} checked; {len(rows)} smaller, pixel-identical PNGs',flush=True)
OUT.mkdir(parents=True,exist_ok=True);(OUT/'results.json').write_text(json.dumps(rows,indent=2)+'\n')
print(json.dumps({'files':len(rows),'before':sum(r['before'] for r in rows),'after':sum(r['after'] for r in rows),'seconds':round(time.perf_counter()-started,1)}),flush=True)
