# Keep the rooster the same size in every frame of his strip: scale each frame so the amount of rooster
# (opaque pixels) matches the resting frame, feet staying on the same line. Run on the original strip in art-source.
from PIL import Image
import numpy as np
from scipy import ndimage
src='art-source/retired-2026-11-22/rooster-motion-unnormalized.webp'; out='icons/mascot-poses/rooster-motion.webp'
im=Image.open(src).convert('RGBA'); W,H=im.size; n=33; cw=W//n
alpha=np.array(im.getchannel('A')); area=[(alpha[:,i*cw:(i+1)*cw]>128).sum() for i in range(n)]
res=Image.new('RGBA',(W,H),(0,0,0,0))
for i in range(n):
    f=im.crop((i*cw,0,(i+1)*cw,H))
    if i in (3,18): # the little drawn sun beside his head (he already has the sunrise behind him): drop every loose blob above his shoulders
        a=np.array(f); lab,cnt=ndimage.label(a[:,:,3]>20); sizes=ndimage.sum(a[:,:,3]>20,lab,range(1,cnt+1)); big=1+int(np.argmax(sizes))
        for j in range(1,cnt+1):
            if j!=big: a[lab==j]=0
        f=Image.fromarray(a)
    k=min(1.25,max(.85,(area[0]/area[i])**.5))
    foot=H*248/256; nw,nh=round(cw*k),round(H*k)
    g=f.resize((nw,nh),Image.LANCZOS); ox=round(cw/2-nw/2); oy=round(foot-foot*k)
    cell=Image.new('RGBA',(cw,H),(0,0,0,0)); cell.alpha_composite(g,(max(ox,0),max(oy,0))) if ox>=0 and oy>=0 else cell.paste(g.crop((max(-ox,0),max(-oy,0),nw,nh)),(max(ox,0),max(oy,0)))
    res.paste(cell,(i*cw,0))
res.save(out,'WEBP',quality=82)
