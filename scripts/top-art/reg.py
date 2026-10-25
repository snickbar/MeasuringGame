"""Registration helpers for the top-character art: find where a generated piece sits on the original hero canvas."""
import os, cv2, numpy as np
from PIL import Image
ROOT='/home/claude/snickbar/measuringgame/'
def load_rgba(p): return np.array(Image.open(p).convert('RGBA'))
def hero(scene,kind='hero'):
    p=f'{ROOT}anim/home-art/{kind}-{scene}.webp'
    if not os.path.exists(p): p=f'{ROOT}art-source/home-hero-originals/{kind}-{scene}.webp'   # originals replaced by rig bases at runtime
    return load_rgba(p)
def piece(name): return load_rgba(f'{ROOT}art-source/top-character-art/top-{name}.png')
def gray(a):
    g=cv2.cvtColor(a[:,:,:3],cv2.COLOR_RGB2GRAY); return g
def register(part,ref,mask_part=None,ratio=0.75,verbose=False):
    """Similarity transform (scale, tx, ty) mapping part pixels -> ref pixels using SIFT matches inside the part's opaque area."""
    sift=cv2.SIFT_create(nfeatures=4000)
    ap=(part[:,:,3]>200).astype(np.uint8)*255; ar=(ref[:,:,3]>200).astype(np.uint8)*255
    ap=cv2.erode(ap,np.ones((5,5),np.uint8))
    k1,d1=sift.detectAndCompute(gray(part),ap); k2,d2=sift.detectAndCompute(gray(ref),ar)
    if d1 is None or d2 is None or len(k1)<4: return None
    m=cv2.BFMatcher().knnMatch(d1,d2,k=2); good=[a for a,b in (x for x in m if len(x)==2) if a.distance<ratio*b.distance]
    if len(good)<4: return None
    src=np.float32([k1[g.queryIdx].pt for g in good]); dst=np.float32([k2[g.trainIdx].pt for g in good])
    M,inl=cv2.estimateAffinePartial2D(src,dst,method=cv2.RANSAC,ransacReprojThreshold=3.0,maxIters=5000)
    if M is None: return None
    s=float(np.hypot(M[0,0],M[1,0])); rot=float(np.degrees(np.arctan2(M[1,0],M[0,0])))
    return dict(scale=s,rot=rot,tx=float(M[0,2]),ty=float(M[1,2]),inliers=int(inl.sum()),matches=len(good))
if __name__=='__main__':
    import sys
    scene=sys.argv[1]; kind=sys.argv[2] if len(sys.argv)>2 else 'hero'
    ref=hero(scene,kind)
    import glob,os
    for f in sorted(glob.glob(f'{ROOT}art-source/top-character-art/top-{scene}-*.png')):
        n=os.path.basename(f)[4:-4]; r=register(load_rgba(f),ref); print(n,r)

def crop_alpha(a,pad=0):
    ys,xs=np.where(a[:,:,3]>8); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    return a[y0:y1,x0:x1],x0,y0
def match_part(part,ref,scales=np.arange(0.5,1.6,0.02),rots=(0,),region=None):
    """Masked multi-scale template match of a part picture inside ref (RGB). Returns best dict(scale,tx,ty,score) mapping part px -> ref px."""
    c,x0,y0=crop_alpha(part)
    best=None
    refg=cv2.cvtColor(ref[:,:,:3],cv2.COLOR_RGB2BGR)
    for rot in rots:
        for s in scales:
            h,w=c.shape[:2]; nw,nh=int(w*s),int(h*s)
            if nw<8 or nh<8 or nw>=refg.shape[1] or nh>=refg.shape[0]: continue
            t=cv2.resize(c,(nw,nh),interpolation=cv2.INTER_AREA)
            if rot:
                M=cv2.getRotationMatrix2D((nw/2,nh/2),rot,1); t=cv2.warpAffine(t,M,(nw,nh),flags=cv2.INTER_LINEAR,borderValue=(0,0,0,0))
            m=(t[:,:,3]>200).astype(np.uint8)*255
            if m.sum()<500: continue
            tb=cv2.cvtColor(t[:,:,:3],cv2.COLOR_RGB2BGR)
            r=cv2.matchTemplate(refg,tb,cv2.TM_CCORR_NORMED,mask=cv2.merge([m,m,m]))
            r=np.nan_to_num(r,nan=0,posinf=0,neginf=0)
            _,mx,_,loc=cv2.minMaxLoc(r)
            if best is None or mx>best['score']:
                best=dict(scale=float(s),rot=rot,score=float(mx),x=loc[0],y=loc[1],cw=nw,ch=nh,x0=x0,y0=y0)
    return best

def warp_to_ref(img,r,shape,flags=cv2.INTER_LANCZOS4):
    """Warp a registered full-canvas picture into ref pixel space."""
    M=np.array([[r['scale'],0,r['tx']],[0,r['scale'],r['ty']]],np.float32)
    return cv2.warpAffine(img,M,(shape[1],shape[0]),flags=flags,borderMode=cv2.BORDER_CONSTANT,borderValue=(0,0,0,0))
def footprint(ref,base_w,thr=40,open_k=3):
    """Pixels where the reference (hero) differs from the part-less base (both in ref space) = where the moving part is."""
    a=ref[:,:,:3].astype(np.int16); b=base_w[:,:,:3].astype(np.int16)
    d=np.abs(a-b).max(axis=2); alpha_d=np.abs(ref[:,:,3].astype(np.int16)-base_w[:,:,3].astype(np.int16))
    m=((d>thr)|(alpha_d>100))&(ref[:,:,3]>40)
    m=m.astype(np.uint8)*255
    m=cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((open_k,open_k),np.uint8))
    return m
def fit_mask(part_alpha_mask,foot,scales=np.arange(0.5,1.8,0.02),roi=None):
    """Find scale+translation maximising IoU between the (scaled) part mask and footprint mask, via FFT correlation."""
    f=(foot>0).astype(np.float32)
    best=None
    for s in scales:
        t=cv2.resize(part_alpha_mask,(max(4,int(part_alpha_mask.shape[1]*s)),max(4,int(part_alpha_mask.shape[0]*s))),interpolation=cv2.INTER_AREA)
        t=(t>127).astype(np.float32)
        if t.shape[0]>=f.shape[0] or t.shape[1]>=f.shape[1]: continue
        inter=cv2.matchTemplate(f,t,cv2.TM_CCORR)
        union=f.sum()+t.sum()-inter  # global union (footprint may hold other pieces; use part-relative score below)
        score=inter/np.maximum(t.sum()+0*union,1)  # fraction of the part covered by footprint
        iou=inter/np.maximum(t.sum()+cv2.matchTemplate(f*0+1,t*0+1,cv2.TM_CCORR)*0,1)
        # penalise covering non-footprint: use local footprint sum in the window as the union estimate
        win=cv2.matchTemplate(f,np.ones_like(t),cv2.TM_CCORR)
        iou=inter/np.maximum(t.sum()+win-inter,1)
        _,mx,_,loc=cv2.minMaxLoc(iou)
        if best is None or mx>best['iou']: best=dict(scale=float(s),iou=float(mx),x=int(loc[0]),y=int(loc[1]))
    return best

def solve_part(scene,part_name,base_name,kind='hero',scales=None,thr=40,keep=None):
    """Register base (part-less) and part layers to the hero canvas; returns dict with transforms + footprint + fit score."""
    ref=hero(scene,kind); base=piece(f'{scene}-{base_name}'); rb=register(base,ref)
    bw=warp_to_ref(base,rb,ref.shape); fp=footprint(ref,bw,thr=thr)
    if keep is not None:   # keep only connected components that touch this box (x0,y0,x1,y1)
        n,lab,st,_=cv2.connectedComponentsWithStats((fp>0).astype(np.uint8)); out=np.zeros_like(fp)
        for i in range(1,n):
            x,y,w,h,a=st[i]
            if a>30 and x<keep[2] and x+w>keep[0] and y<keep[3] and y+h>keep[1]: out[lab==i]=255
        fp=out
    part=piece(f'{scene}-{part_name}'); c,x0,y0=crop_alpha(part)
    if scales is None: scales=np.exp(np.linspace(np.log(0.12),np.log(2.2),110))
    # footprint bounding size gives a good scale hint
    best=fit_mask(c[:,:,3],fp,scales=scales)
    s=best['scale']
    return dict(ref=ref,base=base,rb=rb,fp=fp,part=part,crop=(c,x0,y0),fit=best,
                part_tf=dict(scale=s,tx=best['x']-x0*s,ty=best['y']-y0*s))
def composite(ref_shape,base_w,part,part_tf,bg=(110,150,190)):
    pw=warp_to_ref(part,part_tf,ref_shape)
    out=Image.new('RGBA',(ref_shape[1],ref_shape[0]),bg+(255,)); out.alpha_composite(Image.fromarray(base_w)); out.alpha_composite(Image.fromarray(pw)); return out.convert('RGB')

def fit_f1(part_mask,foot,base_sil,scales,rots=(0,)):
    """Fit part mask to a footprint: F1 between the part's pixels that stick out of the base silhouette and the footprint."""
    A=(foot>0).astype(np.float32); Bs=(base_sil>0).astype(np.float32); notB=1-Bs; Asum=max(A.sum(),1)
    best=None
    for rot in rots:
        for s in scales:
            t=cv2.resize(part_mask,(max(4,int(part_mask.shape[1]*s)),max(4,int(part_mask.shape[0]*s))),interpolation=cv2.INTER_AREA)
            if rot:
                h,w=t.shape;M=cv2.getRotationMatrix2D((w/2,h/2),rot,1);t=cv2.warpAffine(t,M,(w,h))
            t=(t>127).astype(np.float32)
            if t.shape[0]>=A.shape[0] or t.shape[1]>=A.shape[1] or t.sum()<30: continue
            inter=cv2.matchTemplate(A,t,cv2.TM_CCORR); out=cv2.matchTemplate(notB,t,cv2.TM_CCORR)
            f1=2*inter/np.maximum(out+Asum,1)
            _,mx,_,loc=cv2.minMaxLoc(f1)
            if best is None or mx>best['iou']: best=dict(scale=float(s),rot=rot,iou=float(mx),x=int(loc[0]),y=int(loc[1]))
    return best
def silhouette_footprint(ref,base_w,dil=2):
    r=(ref[:,:,3]>128).astype(np.uint8); b=(base_w[:,:,3]>128).astype(np.uint8)
    b=cv2.dilate(b,np.ones((2*dil+1,2*dil+1),np.uint8))
    f=(r&(1-b))*255
    return cv2.morphologyEx(f.astype(np.uint8),cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
def solve_part2(scene,part_name,base_name,kind='hero',scales=None,mode='sil',rots=(0,),colthr=40,ref_piece=None):
    ref=hero(scene,kind)
    if ref_piece:   # the part only exists in another picture (e.g. an added tail): use that as the target, the original hero as the part-less base
        base=ref.copy(); rb=dict(scale=1.0,tx=0.0,ty=0.0); bw=ref.copy(); rp=piece(f'{scene}-{ref_piece}'); ref=warp_to_ref(rp,register(rp,ref),ref.shape)
    else:
        base=piece(f'{scene}-{base_name}');rb=register(base,ref)
        bw=warp_to_ref(base,rb,ref.shape)
    fp=silhouette_footprint(ref,bw) if mode=='sil' else footprint(ref,bw,thr=colthr)
    part=piece(f'{scene}-{part_name}');c,x0,y0=crop_alpha(part)
    if scales is None: scales=np.exp(np.linspace(np.log(0.12),np.log(2.2),90))
    best=fit_f1(c[:,:,3],fp,bw[:,:,3],scales,rots)
    s=best['scale'];rot=best.get('rot',0)
    return dict(ref=ref,base=base,rb=rb,fp=fp,part=part,crop=(c,x0,y0),fit=best,part_tf=dict(scale=s,tx=best['x']-x0*s,ty=best['y']-y0*s))
