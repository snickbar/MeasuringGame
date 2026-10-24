import sys
from PIL import Image
sys.path.insert(0,'/home/claude/snickbar/measuringgame/scripts/top-art')
from reg import *
S='/tmp/claude-0/-home-claude/47953d5e-254c-5795-8d51-c35b8c53a913/scratchpad/'
def peek(scene,names,out,kind='hero',h=700,crop=None):
    ims=[Image.fromarray(hero(scene,kind))]+[Image.fromarray(piece(f'{scene}-{n}')) for n in names]
    tiles=[]
    for im in ims:
        bg=Image.new('RGBA',im.size,(110,150,190,255));bg.alpha_composite(im.convert('RGBA'))
        if crop: bg=bg.crop(crop)
        r=h/bg.height; tiles.append(bg.resize((max(1,int(bg.width*r)),h)).convert('RGB'))
    W=sum(t.width for t in tiles)+8*len(tiles);o=Image.new('RGB',(W,h),(255,255,255));x=0
    for t in tiles:o.paste(t,(x,0));x+=t.width+8
    o.save(S+out)
if __name__=='__main__':
    scene=sys.argv[1];names=sys.argv[2].split(',');crop=tuple(map(int,sys.argv[4].split(','))) if len(sys.argv)>4 else None
    peek(scene,names,sys.argv[3],crop=crop)
