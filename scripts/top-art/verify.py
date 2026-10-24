import sys,json;sys.path.insert(0,'/home/claude/snickbar/measuringgame/scripts/top-art')
from reg import *
S='/tmp/claude-0/-home-claude/47953d5e-254c-5795-8d51-c35b8c53a913/scratchpad/'
def run(sc,p,b,box=None,k='hero'):
    r=solve_part(sc,p,b,k); ref=r['ref']; bw=warp_to_ref(r['base'],r['rb'],ref.shape)
    comp=composite(ref.shape,bw,r['part'],r['part_tf'])
    refi=Image.new('RGBA',(ref.shape[1],ref.shape[0]),(110,150,190,255));refi.alpha_composite(Image.fromarray(ref));refi=refi.convert('RGB')
    d=Image.fromarray(np.clip(np.abs(np.array(refi).astype(int)-np.array(comp).astype(int))*3,0,255).astype(np.uint8))
    nobase=Image.new('RGBA',(ref.shape[1],ref.shape[0]),(110,150,190,255));nobase.alpha_composite(Image.fromarray(bw));nobase=nobase.convert('RGB')
    if box is None:
        ys,xs=np.where(r['fp']>0); box=(max(0,xs.min()-40),max(0,ys.min()-40),min(ref.shape[1],xs.max()+40),min(ref.shape[0],ys.max()+40))
    tiles=[im.crop(box) for im in (refi,nobase,comp,d)]
    w,h=tiles[0].size; sc_=min(1.0, 460/h if h>460 else 1.0); 
    f=max(0.5,min(2.0,500/max(w,h)))
    tiles=[t.resize((int(w*f),int(h*f))) for t in tiles]
    o=Image.new('RGB',(sum(t.width for t in tiles)+18,tiles[0].height),(255,255,255));x=0
    for t in tiles:o.paste(t,(x,0));x+=t.width+6
    o.save(S+f'v-{sc}-{p}.png');print(sc,p,box,r['fit'])
if __name__=='__main__':
    sc,p,b=sys.argv[1:4];box=tuple(map(int,sys.argv[4].split(','))) if len(sys.argv)>4 else None;run(sc,p,b,box)
