import sys;sys.path.insert(0,'/home/claude/snickbar/measuringgame/scripts/top-art')
from reg import *
S='/tmp/claude-0/-home-claude/47953d5e-254c-5795-8d51-c35b8c53a913/scratchpad/'
def dbox(scene,frame,y0=0,y1=9999,x0=0,x1=9999,thr=60,ref_name=None):
    ref=hero(scene) if ref_name is None else piece(f'{scene}-{ref_name}')
    refreg=ref
    fr=piece(f'{scene}-{frame}');rf=register(fr,ref);w=warp_to_ref(fr,rf,ref.shape)
    d=np.abs(ref[:,:,:3].astype(int)-w[:,:,:3].astype(int)).max(axis=2);m=(d>thr).astype(np.uint8)
    m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,np.ones((9,9),np.uint8));m[:y0]=0;m[y1:]=0;m[:,:x0]=0;m[:,x1:]=0
    ys,xs=np.where(m>0)
    if len(xs)==0: print('no diff');return None
    box=(int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max()));print(scene,frame,'diff bbox',box,'n',int(m.sum()),'reg',round(rf['scale'],3),round(rf['tx'],1),round(rf['ty'],1))
    return box,ref,w
if __name__=='__main__':
    a=sys.argv;sc,fr=a[1],a[2];kw=dict(zip(['y0','y1','x0','x1'],map(int,a[3:7]))) if len(a)>6 else {}
    r=dbox(sc,fr,**kw)
    if r:
        box,ref,w=r;pad=40;c=(max(0,box[0]-pad),max(0,box[1]-pad),min(ref.shape[1],box[2]+pad),min(ref.shape[0],box[3]+pad))
        bg=lambda im:(lambda b:(b.alpha_composite(Image.fromarray(im).crop(c)),b.convert('RGB'))[1])(Image.new('RGBA',(c[2]-c[0],c[3]-c[1]),(110,150,190,255)))
        A,B=bg(ref),bg(w);f=min(3,600/max(A.size));A=A.resize((int(A.width*f),int(A.height*f)));B=B.resize(A.size)
        o=Image.new('RGB',(A.width*2+6,A.height),(255,255,255));o.paste(A,(0,0));o.paste(B,(A.width+6,0));o.save(S+f'd-{sc}-{fr}.png')
