# Keep the fox's balloon on the same centre line in every frame of the worlds strip (the confetti frames used to
# shift it to the right because the confetti was counted in the centring). Run on the original strip in art-source.
from PIL import Image
import numpy as np
from scipy import ndimage
src='art-source/retired-2026-11-22/worlds-motion-uncentered.webp'; out='icons/mascot-poses/worlds-motion.webp'
im=Image.open(src).convert('RGBA'); W,H=im.size; n=18; cw=W//n
res=Image.new('RGBA',(W,H),(0,0,0,0))
for i in range(n):
    f=im.crop((i*cw,0,(i+1)*cw,H)); a=np.array(f)[:,:,3]>20
    lab,cnt=ndimage.label(a); sizes=ndimage.sum(a,lab,range(1,cnt+1)); main=lab==(1+int(np.argmax(sizes)))
    ys,xs=np.where(main[:100]); cx=(xs.min()+xs.max())/2; dx=round(cw/2-0.5-cx)
    print(i,round(cx,1),dx)
    cell=Image.new('RGBA',(cw,H),(0,0,0,0)); cell.paste(f,(dx,0)); res.paste(cell,(i*cw,0))
res.save(out,'WEBP',quality=82)
