"""Avatar recolor rules (dev tool; used by scripts/build-avatar-colors.py).
The rules say which pixels of each avatar are its clothes/colour so the phone can recolor them at runtime."""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import os
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
def load(n,size=120):
    im=Image.open(os.path.join(ROOT,'avatars',n+'.webp')).convert('RGBA'); im.thumbnail((size,size)); return im
def hsv(a):
    rgb=a[...,:3]; mx=rgb.max(-1); mn=rgb.min(-1); d=mx-mn+1e-9; s=d/(mx+1e-9)
    r,g,b=rgb[...,0],rgb[...,1],rgb[...,2]
    h=np.where(mx==r,((g-b)/d)%6,np.where(mx==g,(b-r)/d+2,(r-g)/d+4))*60
    return h,s,mx

class _RC: pass
rc=_RC();rc.hsv=hsv;rc.CENS=[]

def hr(h,lo,hi): return ((h-lo)%360)<=((hi-lo)%360)
class C: pass
def ctx(a):
    c=C();c.h,c.s,c.v=rc.hsv(a);c.H,c.W=c.h.shape
    c.y=np.broadcast_to(np.arange(c.H)[:,None]/c.H,c.h.shape);c.x=np.broadcast_to(np.arange(c.W)[None,:]/c.W,c.h.shape);return c
def white(c): return (c.s<.15)&(c.v>.84)
def cream(c): return (c.s<.32)&(c.v>.72)&hr(c.h,20,65)
def gray(c): return (c.s<.22)&(c.v>.36)&(c.v<.86)
def black(c): return (c.v<.4)&(c.s<.3)
def hue(c,lo,hi,s=.15,v=0): return hr(c.h,lo,hi)&(c.s>s)&(c.v>v)
PINK=lambda c,s=.15:hue(c,320,360,s)
# spec = list of (kind, predicate)  kind: hue | flat | tint:white|gray|black|cream
S={
 21:[("hue",lambda c:(hue(c,320,360,.4)|hue(c,0,15,.4))&(c.y>.65))],
 25:[("fillwhite",lambda c:white(c))],
 26:[("hue",lambda c:hue(c,70,170,.2)&(c.y>.5))],
 27:[("tint:white",lambda c:white(c))],
 31:[("tint:black",lambda c:black(c))],
 35:[("tint:gray",lambda c:hue(c,190,250,.06)&(c.s<.4)&(c.v>.45))],
 45:[("hue",lambda c:PINK(c,.12))],
 49:[("flat",lambda c:(c.s>.5)&(c.v>.6)&(c.y>.84))],
 50:[("hueb",lambda c:hue(c,40,110,.12))],
 51:[("tint:black",lambda c:black(c)&(c.y>.5))],
 53:[("tint:cream",lambda c:cream(c)&(c.v>.62))],
 54:[("hue",lambda c:hue(c,15,75,.1)&(c.y>.72))],
 55:[("tint:gray",lambda c:(c.s<.3)&(c.v>.33)&(c.v<.92)),("hue",lambda c:hue(c,8,50,.35))],
 57:[("hue",lambda c:hue(c,8,45,.45,.7))],
 60:[("tint:white",lambda c:(c.s<.25)&(c.v>.7))],
 63:[("tint:gray",lambda c:gray(c))],
 64:[("tint:white",lambda c:white(c))],
 67:[("tint:black",lambda c:black(c))],
 68:[("hue",lambda c:PINK(c,.12))],
 74:[("tint:cream",lambda c:cream(c)&(c.v>.78))],
 77:[("hue",lambda c:hue(c,38,65,.5)|(hue(c,20,60,.2)&(c.y>.6)&(c.v<.75)))],
 78:[("hue",lambda c:hue(c,10,45,.7,.65))],
 88:[("flat",lambda c:(c.s>.45)&(c.v>.4)&~hr(c.h,15,40)&((c.y<.3)|(c.y>.6)))],
 183:[("tint:gray2",lambda c:gray(c)&(c.y<.35)),("tint:black",lambda c:black(c)&(c.y>.45)&(c.y<.68)&(c.x>.25)&(c.x<.7))],
 90:[("hue",lambda c:hue(c,8,40,.5,.6)&(c.y>.5))],
 91:[("tint:white",lambda c:(c.s<.25)&(c.v>.8))],
 99:[("hue",lambda c:hue(c,40,65,.6))],
 103:[("tint:white",lambda c:white(c))],
 104:[("hue",lambda c:PINK(c,.15)&(c.y>.55))],
 108:[("tint:white",lambda c:white(c))],
 122:[("tint:white",lambda c:white(c)&((c.x<.35)|(c.x>.65)))],
 128:[("hue",lambda c:hue(c,10,65,.7,.6))],
 129:[("tint:white",lambda c:white(c)&(c.y>.5))],
 133:[("hue",lambda c:hue(c,330,360,.4)&(c.y<.3)),("tint:white",lambda c:white(c)&(c.y>.8))],
 148:[("flat",lambda c:(c.s>.55)&(c.v>.5))],
 150:[("tint:black",lambda c:black(c))],
 151:[("tint:white",lambda c:white(c))],
 152:[("flat",lambda c:hue(c,190,250,.3)|hue(c,40,65,.5))],
 159:[("tint:white",lambda c:(c.s<.45)&(c.v>.62)&(c.y<.5)&(c.x>.42))],
 168:[("hue",lambda c:hue(c,34,65,.4))],
 171:[("hue",lambda c:hue(c,70,130,.15)&(c.y>.45))],
 172:[("hue",lambda c:(c.y<.3)&hue(c,30,55,.2)),("flat",lambda c:(c.s>.45)&(c.v>.6)&(c.y>.45)&(c.x>.4))],
 173:[("hue",lambda c:hue(c,15,40,.3)&(c.v<.55)&(c.y>.6))],
 174:[("hue",lambda c:hue(c,100,170,.1)&(c.y>.6))],
 175:[("hue",lambda c:(hue(c,330,360,.2)&(c.y>.55))|hue(c,40,60,.4))],
 176:[("hue",lambda c:hue(c,120,180,.1))],
 177:[("hue",lambda c:hue(c,20,45,.65)&(c.y>.68))],
 182:[("tint:white",lambda c:((c.s<.3)&(c.v>.8))&(c.y>.5))],
 186:[("tint:cream",lambda c:cream(c)&(c.y>.6))],
 187:[("hue",lambda c:hue(c,25,40,.8)&(c.y<.3)),("tint:black",lambda c:black(c)&(c.y>.8))],
 190:[("tint:black",lambda c:black(c)&((c.y<.3)|(c.y>.8)))],
 192:[("tint:gray",lambda c:gray(c))],
 197:[("hue",lambda c:PINK(c,.12))],
 4:[("hue",lambda c:hue(c,8,45,.5,.6))],
 70:[("tint:white",lambda c:white(c)|(hue(c,170,260,.02)&(c.s<.3)&(c.v>.8)))],
 193:[("hue",lambda c:hue(c,8,35,.5,.3))],
 205:[("hue",lambda c:hue(c,8,40,.4,.3))],
 208:[("tint:gray",lambda c:hue(c,190,260,.05)&(c.s<.4)&(c.v>.4))],
 209:[("tint:black",lambda c:(c.v<.42))],
 220:[("hueb",lambda c:hue(c,240,320,.15))],
 223:[("tint:gray",lambda c:ndi.binary_opening(hue(c,190,260,.04)&(c.s<.3)&(c.v>.35)&(c.v<.72),iterations=2))],
 224:[("hueb",lambda c:hue(c,325,360,.12,.8))],
 229:[("hueb",lambda c:hue(c,190,250,.1)&(c.s<.5)&(c.v>.35))],
 246:[("hueb",lambda c:hue(c,320,360,.2,.7)&(c.y>.5))],
 255:[("tint:white",lambda c:white(c))],
 260:[("hue",lambda c:hue(c,35,55,.35,.6))],
 263:[("hueb",lambda c:hue(c,15,40,.2,.45)&(c.v<.92)&(c.y>.38))],
 274:[("hueb",lambda c:(hue(c,325,360,.1)|hue(c,0,12,.1))&(c.v>.7))],
 291:[("hue",lambda c:hue(c,10,40,.35,.5))],
 301:[("hue",lambda c:hue(c,35,60,.4,.55)),("hue",lambda c:hue(c,335,360,.5)|hue(c,0,10,.5))],
 308:[("hue",lambda c:hue(c,8,35,.5,.25))],
 309:[("tint:white",lambda c:white(c))],
 310:[("hueb",lambda c:hue(c,190,250,.08)&(c.y>.55))],
 311:[("hue",lambda c:hue(c,15,45,.45,.5))],
 314:[("hueb",lambda c:hue(c,10,40,.7,.75)&(c.y>.6))],
 317:[("hueb",lambda c:(hue(c,335,360,.4)|hue(c,0,12,.4))&(c.y>.6))],
 319:[("hue",lambda c:hue(c,30,55,.3,.5)&(c.y>.6))],
 320:[("hue",lambda c:hue(c,8,35,.42,.3)&(c.v<.8))],
 322:[("tint:black",lambda c:(c.v<.42)&(c.s<.6))],
 325:[("hue",lambda c:hue(c,25,45,.35,.6)&(c.s<.7))],
 331:[("hue",lambda c:hue(c,5,30,.5,.3))],
 332:[("hue",lambda c:hue(c,10,40,.3,.2)&(c.v<.6))],
 333:[("hue",lambda c:hue(c,10,40,.6)),("tint:black",lambda c:black(c))],
 334:[("hue",lambda c:hue(c,15,35,.35,.28)&(c.v<.62)&((c.y<.35)|(c.y>.55)))],
 335:[("hue",lambda c:hue(c,15,35,.35,.28)&(c.v<.62)&((c.y<.35)|(c.y>.55)))],
 338:[("tint:gray",lambda c:(c.s<.25)&(c.v>.18)&(c.v<.8))],
 101:[("hue",lambda c:hue(c,70,170,.2)&(c.y>.5))],
 201:[("tint:white",lambda c:ndi.binary_closing((c.s<.3)&(c.v>.72),iterations=2)&(c.v>.5))],
 203:[("hueb",lambda c:(hue(c,330,360,.12)|hue(c,0,12,.12))&(c.s<.38)&(c.v>.7))],
}
def hsv2rgb(h,s,v):
    hh=(h%360)/60;i=np.floor(hh).astype(int)%6;f=hh-np.floor(hh);p=v*(1-s);q=v*(1-f*s);t=v*(1-(1-f)*s)
    return np.choose(i,[v,q,p,p,t,v]),np.choose(i,[t,v,v,q,p,p]),np.choose(i,[p,p,t,v,v,q])
def apply(a,c,kind,m,target):
    if m.sum()<20: return
    h,s,v=c.h[m],c.s[m],c.v[m]
    if kind.startswith("tint"):
        t=kind.split(":")[1];add={"white":.36,"gray":.46,"black":.5,"cream":.42,"gray2":.64}[t]
        fade=1 if t=="black" else np.clip((v-.5)/.25,0,1)
        nh=np.full(h.shape,float(target));ns=np.clip(s+add*fade,0,.75)
        nv=np.minimum(1,v*1.5+.1) if t=="black" else v*.97
    elif kind=="flat":
        ang=np.deg2rad(h);rc.CENS.append(np.rad2deg(np.arctan2(np.sin(ang).mean(),np.cos(ang).mean()))%360)
        nh=(target+((h+180)%360-180)*.1)%360;ns=s;nv=v
    else:
        ang=np.deg2rad(h);cen=np.rad2deg(np.arctan2(np.sin(ang).mean(),np.cos(ang).mean()))%360
        tg=target;rc.CENS.append(cen)
        nh=(tg+((h-cen+180)%360-180)*.6)%360;ns=s;nv=v
        if kind=="hueb": ns=np.maximum(s,.55)
    r,g,b=hsv2rgb(nh,ns,nv);a[m,0]=r;a[m,1]=g;a[m,2]=b
def clean(m): return ndi.binary_opening(m,iterations=1)  # drops one-pixel outline slivers
def shift(im,k,target):
    spec=S.get(k)
    if not spec: return rc3.shift(im,k,target)
    a=np.array(im).astype(float)/255;c=ctx(a);op=a[...,3]>.5;out=a.copy()
    for kind,f in spec:
        m=op&f(c)
        if kind=="tint:black": m=clean(m&ndi.binary_erosion(op,iterations=3))
        elif kind.startswith("tint") or kind=="fillwhite":
            m=m|(ndi.binary_dilation(m,iterations=2)&op&(c.v>.42)&(c.s<.45)&~(hr(c.h,5,60)&(c.s>.12)))  # edge pixels between body and outline
        if kind=="fillwhite":
            rows=np.zeros_like(op)
            for y in range(int(.5*c.H),c.H):
                xs=np.where(op[y])[0]
                if len(xs)>2: rows[y,xs[0]:xs[-1]+1]=True
            hole=rows&~op;a2=out
            apply_fill(out,c,hole,target)
            kind="tint:white"
        apply(out,c,kind,m,target)
    return Image.fromarray((out*255).astype("uint8"),"RGBA")
def apply_fill(out,c,hole,target):
    r,g,b=hsv2rgb(np.full(hole.sum(),float(target)),np.full(hole.sum(),.36),np.full(hole.sum(),.97))
    out[hole,0]=r;out[hole,1]=g;out[hole,2]=b;out[hole,3]=1

def cfg(n):
    # each returns mask(h,s,v,Y,H) ; mode 'hue' shifts, 'tint' sets a flat hue, 'flat' compresses variation
    return {
     7:("hue",lambda h,s,v,y,H:hr(h,320,360)&(s>.3)&(y>.7*H)),
     8:("tint",lambda h,s,v,y,H:(v<.5)&(s<.15)),
     9:("hue",lambda h,s,v,y,H:hr(h,70,170)&(s>.25)),
     15:("hue",lambda h,s,v,y,H:hr(h,195,265)&(s>.2)),
     24:("hue",lambda h,s,v,y,H:hr(h,24,60)&(s>.15)&(v<.9)&(y>.5*H)),
     27:("hue",lambda h,s,v,y,H:hr(h,190,260)&(s>.3)),
     32:("hue",lambda h,s,v,y,H:hr(h,20,50)&(s>.18)&(v>.6)),
     33:("hue",lambda h,s,v,y,H:hr(h,22,58)&(s>.3)&(v>.55)),
     39:("hue",lambda h,s,v,y,H:hr(h,235,315)&(s>.2)),
     40:("hue",lambda h,s,v,y,H:hr(h,75,175)&(s>.2)),
     43:("hue",lambda h,s,v,y,H:hr(h,245,310)&(s>.2)),
     49:("flat",lambda h,s,v,y,H:(s>.45)&(v>.5)&(y>.72*H)),
    }.get(n)

def auto2(im,target):
    a=np.array(im).astype(float)/255;c=ctx(a);op=a[...,3]>.5;N=max(1,op.sum());out=a.copy()
    warm=(c.h>=8)&(c.h<62);base=op&(c.s>.3)&(c.v>.3)
    pinkred=((c.h>=320)|(c.h<8))&(c.s>.45)&(c.v>.5)
    cloth=base&(((~warm)&~((c.h>=320)|(c.h<8)))|pinkred)
    if cloth.sum()/N>.05:
        hist=[(cloth&(((c.h-b-5+180)%360-180)**2<=25**2)).sum() for b in range(0,360,10)]
        cen=int(np.argmax(hist))*10+5;m=cloth&(abs((c.h-cen+180)%360-180)<40)
        apply(out,c,"hue",m,target);return Image.fromarray((out*255).astype("uint8"),"RGBA")
    for kind,f,frac in [("tint:white",white(c),.06),("tint:gray",gray(c),.08),("tint:black",black(c)&ndi.binary_erosion(op,iterations=3),.12)]:
        m=op&f
        if kind=="tint:black": m=clean(m&ndi.binary_erosion(m,iterations=2))
        if m.sum()/N>frac:
            apply(out,c,kind,m,target);return Image.fromarray((out*255).astype("uint8"),"RGBA")
    body=op&warm&(c.s>.15)&(c.v>.5)
    if body.sum()/N>.6:
        ang=np.deg2rad(c.h[body]);cen=np.rad2deg(np.arctan2(np.sin(ang).mean(),np.cos(ang).mean()))%360
        apply(out,c,"hue",body&(abs((c.h-cen+180)%360-180)<30),target)
    return Image.fromarray((out*255).astype("uint8"),"RGBA")
