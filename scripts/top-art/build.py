"""Builds runtime rig assets for the animated Home scenes from art-source/top-character-art (sources stay untouched).
   python3 scripts/top-art/build.py ants sunflower ...   -> writes anim/home-art/top/*.webp (lossless) and anim/home-art-rig.mjs"""
import sys,json,os;sys.path.insert(0,os.path.dirname(__file__))
from reg import *
from rigs import RIGS
OUT=ROOT+'anim/home-art/top/'
os.makedirs(OUT,exist_ok=True)
SUPER=1.35   # runtime pixels per hero-canvas pixel for small parts (hero itself is shown well below its full size)
def save(arr,name):
    Image.fromarray(arr).save(OUT+name,'WEBP',lossless=True,quality=100,method=4,exact=True); return name
def r1(v): return round(float(v),2)
def place_crop(img,tf,name,down=True):
    """Crop to opaque bounds, optionally down-sample to SUPER x hero resolution; returns rig placement dict."""
    c,x0,y0=crop_alpha(img); s=tf['scale']; f=min(1.0,SUPER*s) if down else 1.0
    if f<1: c=cv2.resize(c,(max(1,round(c.shape[1]*f)),max(1,round(c.shape[0]*f))),interpolation=cv2.INTER_AREA)
    h0,w0=img.shape[:2]
    cw_src=crop_alpha(img)[0].shape[1]; ch_src=crop_alpha(img)[0].shape[0]
    return dict(file=save(c,name),x=r1(tf['tx']+x0*s),y=r1(tf['ty']+y0*s),w=r1(cw_src*s),h=r1(ch_src*s))

def refine_piece(full,tf,ref):
    """Nudge (dx,dy,scale,rot) of one split piece so its colours match the original hero where it covers it."""
    H,W=ref.shape[:2]; a=(full[:,:,3]>8)
    ys,xs=np.nonzero(a); cx0,cy0=xs.mean(),ys.mean()
    rgb=ref[:,:,:3].astype(np.float32); ra=ref[:,:,3]>200
    def cost(q):
        dx,dy,ds,rot=q; sc=tf['scale']*ds
        M=cv2.getRotationMatrix2D((cx0,cy0),rot,1.0); M=np.vstack([M,[0,0,1]])
        T=np.array([[sc,0,tf['tx']+dx+(1-ds)*0],[0,sc,tf['ty']+dy],[0,0,1]],np.float64)
        A=(T@M)[:2]; w=cv2.warpAffine(full,A,(W,H),flags=cv2.INTER_LINEAR,borderValue=(0,0,0,0))
        m=(w[:,:,3]>250); m=cv2.erode(m.astype(np.uint8),np.ones((5,5),np.uint8))>0
        if m.sum()<200: return 1e9
        d=np.abs(w[:,:,:3].astype(np.float32)-rgb).mean(2); outside=(~ra)&m
        return d[m&ra].mean()+ 80.0*outside.sum()/m.sum()
    q=[0.0,0.0,1.0,0.0]; best=cost(q); steps=[8,8,.04,3]
    for _ in range(5):
        for i in range(4):
            for sg in (1,-1):
                while True:
                    t=list(q); t[i]+=sg*steps[i]; c=cost(t)
                    if c<best-1e-3: best,q=c,t
                    else: break
        steps=[x/2 for x in steps]
    print('  refine',[round(v,2) for v in q],round(best,2)); return q
def split_parts(c,min_area=60,dil=9):
    a=(c[:,:,3]>8).astype(np.uint8); m=cv2.dilate(a,np.ones((dil,dil),np.uint8)); n,lab,st,_=cv2.connectedComponentsWithStats(m)
    comps=[]
    for i in range(1,n):
        x,y,w,h,ar=st[i]
        if ar<min_area: continue
        piece_=c.copy(); piece_[:,:,3]=np.where(lab==i,c[:,:,3],0); comps.append((x,y,w,h,piece_))
    comps.sort(key=lambda t:t[0]); return comps
def pivot_of(plc,mode):
    x,y,w,h=plc['x'],plc['y'],plc['w'],plc['h']
    if isinstance(mode,tuple) and len(mode)==3 and mode[0]=='frac': return (x+w*mode[1],y+h*mode[2])
    if isinstance(mode,(list,tuple)): return mode
    if mode=='bottom': return (x+w/2,y+h)
    if mode=='top': return (x+w/2,y)
    if mode=='left': return (x,y+h/2)
    if mode=='right': return (x+w,y+h/2)
    if mode=='top-left': return (x,y)
    if mode=='top-right': return (x+w,y)
    if mode=='bottom-left': return (x,y+h)
    if mode=='bottom-right': return (x+w,y+h)
    return (x+w/2,y+h/2)
def build(scene):
    cfg=RIGS[scene]; ref=hero(scene,'hero'); H,W=ref.shape[:2]
    rig=dict(W=W,H=H,base=None,parts=[],patches=[],fx=[])
    if cfg.get('base'):
        b=piece(f"{scene}-{cfg['base']}"); rb=register(b,ref); rig['base']=place_crop(b,rb,f'{scene}-base.webp',down=False)
        bw=warp_to_ref(b,rb,ref.shape)
    else: bw=ref
    if cfg.get('base_fix') and rig['base']:
        # paint over a region of the base with the original hero's pixels (e.g. erase a baked-in tail), feathered
        bf=cfg['base_fix']; x0,y0,x1,y1=bf['region']; fe=bf.get('feather',10)
        full=np.zeros((H,W,4),np.uint8); b=piece(f"{scene}-{cfg['base']}"); full=warp_to_ref(b,register(b,ref),ref.shape).astype(np.float32)
        if bf.get('src'): sp=piece(f"{scene}-{bf['src']}"); src=warp_to_ref(sp,register(sp,ref),ref.shape).astype(np.float32)
        else: src=ref.astype(np.float32)
        m=np.zeros((H,W),np.float32); m[y0+fe:y1-fe,x0+fe:x1-fe]=1; m=cv2.GaussianBlur(m,(0,0),fe/2.5)[:,:,None]
        full=(full*(1-m)+src*m).astype(np.uint8)
        rig['base']=place_crop(full,dict(scale=1.0,tx=0.0,ty=0.0),f'{scene}-base.webp',down=False)
    if cfg.get('erase') and not rig['base']:
        # drop small detached bits (a baked-in splash) from the hero: components whose box lies inside a rectangle
        full=ref.copy(); a=(full[:,:,3]>8).astype(np.uint8); n,lab,st,_=cv2.connectedComponentsWithStats(a,connectivity=8)
        for (x0,y0,x1,y1) in cfg.get('wipe',[]): full[y0:y1,x0:x1,3]=0
        for (x0,y0,x1,y1) in cfg['erase']:
            for i in range(1,n):
                x,y,w,h,ar=st[i]
                if x>=x0 and y>=y0 and x+w<=x1 and y+h<=y1: full[lab==i,3]=0
        rig['base']=place_crop(full,dict(scale=1.0,tx=0.0,ty=0.0),f'{scene}-base.webp',down=False)
    if cfg.get('hero2_erase'):
        # the second object with some baked-in detached bit removed (e.g. a static steam wisp that an animated one replaces)
        h2=hero(scene,'hero2').copy(); a=(h2[:,:,3]>8).astype(np.uint8); n,lab,st,_=cv2.connectedComponentsWithStats(a,connectivity=8)
        for (x0,y0,x1,y1) in cfg['hero2_erase']:
            for i in range(1,n):
                x,y,w,h,ar=st[i]
                if x>=x0 and y>=y0 and x+w<=x1 and y+h<=y1: h2[lab==i,3]=0
        for (x0,y0,x1,y1) in cfg.get('hero2_wipe',[]): h2[y0:y1,x0:x1,3]=0
        for (x0,y0,x1,y1) in cfg.get('hero2_soft',[]):
            sub=h2[y0:y1,x0:x1,3]; sub[sub<250]=0
        rig['hero2']=dict(file=save(h2,f'{scene}-hero2.webp'))
    for pi,p in enumerate(cfg.get('parts',[])):
        pname=p['name']
        if 'place' in p:   # manual: centre (cx,cy) and width w in hero pixels, optional rotation (degrees, counter-clockwise)
            img=piece(f'{scene}-{pname}')
            if p.get('rotate'):
                h_,w_=img.shape[:2]; d=int(np.hypot(h_,w_)); M=cv2.getRotationMatrix2D((w_/2,h_/2),p['rotate'],1.0); M[0,2]+=(d-w_)/2; M[1,2]+=(d-h_)/2
                img=cv2.warpAffine(img,M,(d,d),flags=cv2.INTER_AREA if False else cv2.INTER_LINEAR,borderValue=(0,0,0,0))
            c_,x0_,y0_=crop_alpha(img); cx,cy,pw=p['place']; s_=pw/c_.shape[1]
            tf=dict(scale=s_,tx=cx-s_*(x0_+c_.shape[1]/2),ty=cy-s_*(y0_+c_.shape[0]/2))
        elif 'tf' in p: img=piece(f'{scene}-{pname}'); tf=p['tf']
        else:
            r=solve_part2(scene,pname,p['base'],'hero',mode=p.get('mode','sil'),rots=p.get('rots',(0,)),scales=p.get('scales'),colthr=p.get('thr',40),ref_piece=p.get('ref_piece')); img=r['part']; tf=r['part_tf']
            print(scene,pname,'fit',r['fit'])
        tf=dict(tf); 
        if 'dx' in p: tf['tx']+=p['dx']
        if 'dy' in p: tf['ty']+=p['dy']
        if p.get('split'):
            c,x0,y0=crop_alpha(img)
            for k,(x,y,w,h,pc) in enumerate(split_parts(c)):
                full=np.zeros_like(img); full[y0:y0+c.shape[0],x0:x0+c.shape[1]]=pc
                tfk=tf
                if p.get('refine'):
                    q=refine_piece(full,tf,ref); import math
                    M=cv2.getRotationMatrix2D((float(np.nonzero(full[:,:,3]>8)[1].mean()),float(np.nonzero(full[:,:,3]>8)[0].mean())),q[3],1.0)
                    full=cv2.warpAffine(full,M,(full.shape[1],full.shape[0]),flags=cv2.INTER_LINEAR,borderValue=(0,0,0,0))
                    tfk=dict(tf,scale=tf['scale']*q[2],tx=tf['tx']+q[0],ty=tf['ty']+q[1])
                plc=place_crop(full,tfk,f'{scene}-{pname}{k}.webp'); pv=pivot_of(plc,p['pivot'][k] if isinstance(p['pivot'],list) and isinstance(p['pivot'][0],(list,tuple,str)) else p['pivot'])
                an=p['anim'][k%len(p['anim'])] if isinstance(p['anim'],list) else p['anim']
                plc.update(ox=r1((pv[0]-plc['x'])/plc['w']*100),oy=r1((pv[1]-plc['y'])/plc['h']*100),anim=an,z=p.get('z','front')); rig['parts'].append(plc)
        else:
            plc=place_crop(img,tf,f'{scene}-{pname}.webp'); pv=pivot_of(plc,p['pivot'])
            plc.update(ox=r1((pv[0]-plc['x'])/plc['w']*100),oy=r1((pv[1]-plc['y'])/plc['h']*100),anim=p['anim'],z=p.get('z','front')); rig['parts'].append(plc)
    for q in cfg.get('patches',[]):
        fr=piece(f"{scene}-{q['frame']}"); rf=register(fr,ref); w=warp_to_ref(fr,rf,ref.shape)
        x0,y0,x1,y1=q['region']; fe=q.get('feather',8)
        m=np.zeros((H,W),np.float32); m[y0:y1,x0:x1]=1; m=cv2.GaussianBlur(m,(0,0),fe/2); m=np.clip((m-0.5)*2+0.5,0,1) if False else m
        # keep the feather inside the region: shrink first
        m2=np.zeros((H,W),np.float32); m2[y0+fe:y1-fe,x0+fe:x1-fe]=1; m2=cv2.GaussianBlur(m2,(0,0),fe/2.5)
        out=w.copy(); out[:,:,3]=(w[:,:,3].astype(np.float32)*m2).astype(np.uint8)
        for (ux0,uy0,ux1,uy1) in q.get('unred',[]):   # drop strongly red pixels (a baked-in flag that is animated separately)
            sub=out[uy0:uy1,ux0:ux1]; rr=sub[:,:,0].astype(int); gg=sub[:,:,1].astype(int); bb=sub[:,:,2].astype(int)
            msk=(rr>140)&(gg<110)&(bb<110); msk=cv2.dilate(msk.astype(np.uint8),np.ones((9,9),np.uint8))>0; sub[msk,3]=0
        crop=out[y0:y1,x0:x1]
        plc=dict(file=save(crop,f"{scene}-{q['frame']}.webp"),x=x0,y=y0,w=x1-x0,h=y1-y0,anim=q['anim']); rig['patches'].append(plc)
    for fi,q in enumerate(cfg.get('fx',[])):
        # effect sheets: cut the frames apart (reading order), pad to one common cell, place the cell at (x,y) with the anchor point q['at'] inside it
        sh=piece(f"{scene}-{q['sheet']}")
        if q.get('crop'):
            hh,ww=sh.shape[:2]; a_,b_,c_,d_=q['crop']; sh=sh[int(b_*hh):int(d_*hh),int(a_*ww):int(c_*ww)]
        c,_,_=crop_alpha(sh)
        comps=split_parts(c,min_area=q.get('min_area',200),dil=q.get('dil',41))
        if q.get('frames'): comps=[comps[i] for i in q['frames']]
        else:
            hs=sorted(t[3] for t in comps); mh=hs[len(hs)//2]; comps.sort(key=lambda t:(round((t[1]+t[3]/2)/(mh*.8)),t[0]))
        cw=max(t[2] for t in comps); ch=max(t[3] for t in comps); al=q.get('align','center')
        sc_=q['w']/cw; f=min(1.0,SUPER*sc_); frames=[]
        for k,(x,y,w,h,pc) in enumerate(comps):
            cell=np.zeros((ch,cw,4),np.uint8); crop=pc[y:y+h,x:x+w]
            ox_=(cw-w)//2; oy_={'top':0,'bottom':ch-h}.get(al,(ch-h)//2)
            cell[oy_:oy_+h,ox_:ox_+w]=crop
            if f<1: cell=cv2.resize(cell,(max(1,round(cw*f)),max(1,round(ch*f))),interpolation=cv2.INTER_AREA)
            frames.append(dict(file=save(cell,f"{scene}-fx{fi}-{k}.webp")))
        ax,ay=q.get('at',(.5,.5)); bw_=cw*sc_; bh_=ch*sc_
        rig['fx'].append(dict(frames=frames,x=r1(q['x']-ax*bw_),y=r1(q['y']-ay*bh_),w=r1(bw_),h=r1(bh_),anim=q['anim'],dur=q.get('dur',3),delay=q.get('delay',0),z=q.get('z','front'),**({'ref':True} if q.get('ref') else {})))
    return rig
def build_crit(scene,entries,rig):
    """Critter frame sheets: each entry swaps (or adds) one critter's picture for stacked frames; frames are scaled so the creature
       keeps the size of the original critter picture's visible part. Cell boxes are percentages of the critter picture."""
    man=json.load(open(ROOT+'anim/home-art/manifest.json'))['assets']; info={a['name']:a for a in man if a.get('scene')==scene and a['name'].startswith('critter-')}
    out=[]
    for k,q in enumerate(entries):
        sh=piece(f"{scene}-{q['sheet']}"); c,_,_=crop_alpha(sh)
        comps=split_parts(c,min_area=q.get('min_area',500),dil=q.get('dil',31))
        hs=sorted(t[3] for t in comps); mh=hs[len(hs)//2]; comps.sort(key=lambda t:(round((t[1]+t[3]/2)/(mh*.8)),t[0]))
        if q.get('frames'): comps=[comps[i] for i in q['frames']]
        cw=max(t[2] for t in comps); ch=max(t[3] for t in comps)
        if q['i']<2 and f"critter-{scene}-{'ab'[q['i']]}.png" in info:
            a=info[f"critter-{scene}-{'ab'[q['i']]}.png"]; W_,H_=a['width'],a['height']; ab=a['alphaBounds']; ex=False
            sc_=min(ab['width']/cw,ab['height']/ch)
            bx=ab['x']+ab['width']/2; by=ab['y']+ab['height']/2
        else: # extra critter: its own canvas
            sc_=q.get('scale',0.5); W_=round(cw*sc_*1.1); H_=round(ch*sc_*1.1); ab=dict(x=round(W_*.05),y=round(H_*.05),width=round(cw*sc_),height=round(ch*sc_)); bx=W_/2; by=H_/2; ex=True
        cell_w=cw*sc_; cell_h=ch*sc_; f=min(1.0,SUPER*q.get('px',1.0)*(0.35))   # runtime critters are tiny on screen: keep frames light
        frames=[]
        for j,(x,y,w,h,pc) in enumerate(comps):
            cell=np.zeros((ch,cw,4),np.uint8); crop=pc[y:y+h,x:x+w]; cell[(ch-h)//2:(ch-h)//2+h,(cw-w)//2:(cw-w)//2+w]=crop
            if q.get('flip'): cell=cell[:,::-1].copy()
            tw=max(1,round(cell_w*q.get('keep',0.5))); th=max(1,round(cell_h*q.get('keep',0.5)))
            cell=cv2.resize(cell,(tw,th),interpolation=cv2.INTER_AREA)
            frames.append(dict(file=save(cell,f"{scene}-crit{k}-{j}.webp")))
        ent=dict(i=q['i'],frames=frames,dur=q.get('dur',.5),
                 cell=dict(x=r1((bx-cell_w/2)/W_*100),y=r1((by-cell_h/2)/H_*100),w=r1(cell_w/W_*100),h=r1(cell_h/H_*100)))
        if ex: ent['c']=dict(w=W_,h=H_,ab=ab)
        out.append(ent)
    rig['critFrames']=out

if __name__=='__main__':
    rigs={}
    path=ROOT+'anim/home-art/top/rig.json'
    if os.path.exists(path): rigs=json.load(open(path))
    from rigs import CRIT
    for sc in sys.argv[1:]:
        rigs[sc]=build(sc)
        if sc in CRIT: build_crit(sc,CRIT[sc],rigs[sc])
        print(sc,'ok',len(rigs[sc]['parts']),'parts',len(rigs[sc]['patches']),'patches')
    json.dump(rigs,open(path,'w'),indent=1)
    open(ROOT+'anim/home-art-rig.mjs','w').write('// Generated by scripts/top-art/build.py - do not edit by hand.\nexport const HOME_RIG = '+json.dumps(rigs,separators=(",",":"))+';\n')
