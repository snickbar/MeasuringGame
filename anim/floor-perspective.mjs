// Floor-only comparisons: keep every original scene setting and every prop anchor.
const previews = {
  restaurant: { amount: 1.55 },
  kitchen: { amount: 1.55 },
  living: { amount: 1.45, start: .20, sample: [.35,.63,.30,.30],
    clear: [[.33,.24,.66,.66],[.025,.60,.975,1]] },
  tabletop: { amount: 1.45, start: .425, sample: [.58,.43,.42,.57],
    clear: [[.54,.425,1,1],[.34,.56,.99,1],[.02,.92,.99,1]] },
};
export function installFloorOnlyV3(settings, variants) {
  for (const [id, floorPerspective] of Object.entries(previews)) {
    settings[id+'-v3'] = { ...structuredClone(settings[id]), floorPerspective };
    variants[id+'-v3'] = id;
    // Accepted tile floors are used in ordinary games too. Keep the v3 alias for saved previews.
    if(id==='restaurant'||id==='kitchen') settings[id].floorPerspective=floorPerspective;
  }
}
const cache = new WeakMap();
const canvas = (w,h) => { const c=document.createElement('canvas');c.width=w;c.height=h;return c; };
function depth(t, amount) { return t / (amount + (1-amount)*t); }
function anchorDepth(t, surface, amount) {
  // Keep both the back edge and the measured standing line exactly where they were.
  // Blend to the untouched foreground with a matching tangent, avoiding a tile-grid kink.
  return t < surface ? t-Math.min(.8,amount-1)*t*(1-t/surface)**2 : t;
}
export function floorPerspectiveImage(image, config, surface) {
  if(!config) return image;
  let versions=cache.get(image);if(!versions){versions=new Map();cache.set(image,versions);}
  const key=JSON.stringify([config,surface]);if(versions.has(key))return versions.get(key);
  const w=image.naturalWidth,h=image.naturalHeight,out=canvas(w,h),ctx=out.getContext('2d');
  if(!config.clear){
    // Project the existing tile artwork. Its colors, reflections and outline style survive.
    const slices=180;
    for(let i=0;i<slices;i++){
      const t=i/slices,t1=(i+1)/slices,y0=anchorDepth(t,surface,config.amount)*h,y1=anchorDepth(t1,surface,config.amount)*h;
      // The source already has converging tile columns. Preserve those and its horizontal joins.
      ctx.drawImage(image,0,t*h,w,h/slices,0,y0,w,y1-y0+.65);
    }
  }else{
    ctx.drawImage(image,0,0);
    const texture=canvas(w,h),tx=texture.getContext('2d'),[sx,sy,sw,sh]=config.sample;
    const start=config.start*h, extent=h-start, slices=160;
    for(let i=0;i<slices;i++){
      const t=i/slices,t1=(i+1)/slices,yy=start+depth(t,config.amount)*extent,yy1=start+depth(t1,config.amount)*extent;
      const scale=.65+.35*t, width=w*scale,left=(w-width)/2;
      for(let tile=-1;tile<=1;tile++)tx.drawImage(image,sx*w,(sy+t*sh)*h,sw*w,sh*h/slices,left+tile*width,yy,width+.5,yy1-yy+.6);
    }
    // Feather strictly INSIDE clear floor rectangles. Painted-in objects never enter the mask.
    const mask=canvas(w,h),mx=mask.getContext('2d'),pixels=mx.createImageData(w,h),edge=14;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      let a=0;
      for(const [x0,y0,x1,y1] of config.clear){
        const d=Math.min(x-x0*w,(x1*w)-x,y-y0*h,(y1*h)-y);
        if(d>0)a=Math.max(a,Math.min(1,d/edge));
      }
      const i=(y*w+x)*4;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=255;pixels.data[i+3]=Math.round(a*255);
    }
    mx.putImageData(pixels,0,0);tx.globalCompositeOperation='destination-in';tx.drawImage(mask,0,0);ctx.drawImage(texture,0,0);
  }
  // Match the image interface already used by the floor renderer; dimensions are unchanged.
  out.naturalWidth=w;out.naturalHeight=h;versions.set(key,out);return out;
}
