import sys;sys.path.insert(0,'/home/claude/snickbar/measuringgame/scripts/top-art')
from reg import *
from PIL import ImageDraw
S='/tmp/claude-0/-home-claude/47953d5e-254c-5795-8d51-c35b8c53a913/scratchpad/'
def cmp(scene,frames,box,out,ref_name=None,grid=True):
    ref=hero(scene) if not ref_name else piece(f'{scene}-{ref_name}')
    tiles=[ref]
    for f in frames:
        fr=piece(f'{scene}-{f}');rf=register(fr,hero(scene));tiles.append(warp_to_ref(fr,rf,hero(scene).shape))
    x0,y0,x1,y1=box;ims=[]
    for t in tiles:
        im=Image.new('RGBA',(x1-x0,y1-y0),(110,150,190,255));im.alpha_composite(Image.fromarray(t).crop(box))
        if grid:
            d=ImageDraw.Draw(im)
            for gx in range((x0//100+1)*100,x1,100):d.line([(gx-x0,0),(gx-x0,im.height)],fill=(255,255,255,120));d.text((gx-x0+2,2),str(gx),fill=(255,255,0,255))
            for gy in range((y0//100+1)*100,y1,100):d.line([(0,gy-y0),(im.width,gy-y0)],fill=(255,255,255,120));d.text((2,gy-y0+2),str(gy),fill=(255,255,0,255))
        ims.append(im.convert('RGB'))
    f=min(2.5,520/max(ims[0].size))
    ims=[i.resize((int(i.width*f),int(i.height*f))) for i in ims]
    o=Image.new('RGB',(sum(i.width for i in ims)+6*len(ims),ims[0].height),(255,255,255));x=0
    for i in ims:o.paste(i,(x,0));x+=i.width+6
    o.save(S+out)
if __name__=='__main__':
    from PIL import ImageDraw
    a=sys.argv;cmp(a[1],a[2].split(','),tuple(map(int,a[3].split(','))),a[4],a[5] if len(a)>5 and a[5]!='-' else None)
