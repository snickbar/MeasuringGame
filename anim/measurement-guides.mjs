import {ORIENT} from './orient-data.js';

const VERTICAL_LENGTH = new Set('acorn tooth chocolate-drop whiskey-glass jack-in-the-box pigeon owl rabbit bald-eagle teddy-bear candy-corn easter-egg plastic-egg mothers-day-card valentines-card tie-dye-shirt serape vampire-cape school-desk ice-skates sunflower-bouquet fall-leaf'.split(' '));
const REGIONS = {'globe':[0,0,1,.78],'snow-globe':[0,0,1,.78],'clock':[.12,.17,.9,.87],'cauldron':[.15,.2,.85,.76],'cranberry':[.02,.4,.54,1],'black-cat':[0,.22,.83,1]};
export function measurementGuideAxis(object,bounds){
  const dimension=object.measurement?.dimension||'length';
  if(dimension==='height')return Math.abs(ORIENT[object.id]?.rot||0)%180===90?'horizontal':'vertical';
  if(dimension==='depth')return 'vertical';
  if(dimension==='length')return VERTICAL_LENGTH.has(object.id)||bounds.height>bounds.width*1.2?'vertical':'horizontal';
  return 'horizontal';
}
// Use visible artwork bounds, then follow the exact thumbnail rotation/mirror.
export function installMeasurementGuides({objects,document:doc=document}) {
  const byImage=new Map(objects.filter(o=>o.image).map(o=>[new URL(o.image,doc.baseURI).pathname,o]));
  const painted=new WeakMap(),observed=new Set(),boundsCache=new Map();let frame=0;
  const selectors='.dc-pic,.wb-card,.qp,.bl-objects figure';
  function artBounds(img){
    const key=img.currentSrc||img.src;if(boundsCache.has(key))return boundsCache.get(key);
    let bounds={left:0,top:0,right:1,bottom:1};
    try{
      const canvas=doc.createElement('canvas');canvas.width=canvas.height=96;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,96,96);
      const pixels=ctx.getImageData(0,0,96,96).data;let x0=96,y0=96,x1=-1,y1=-1;
      for(let y=0;y<96;y++)for(let x=0;x<96;x++)if(pixels[(y*96+x)*4+3]>40){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
      if(x1>=0)bounds={left:x0/96,top:y0/96,right:(x1+1)/96,bottom:(y1+1)/96};
    }catch{/* Non-canvas-readable images still get a direction guide. */}
    boundsCache.set(key,bounds);return bounds;
  }
  function draw(card){
    const img=card.querySelector('img');if(!img?.complete||!img.naturalWidth)return;
    const path=new URL(img.currentSrc||img.src,doc.baseURI).pathname;
    const object=byImage.get(path)||byImage.get(path.replace(/-2\.webp$/,'.webp'));if(!object)return;
    const b=card.getBoundingClientRect(),r=img.getBoundingClientRect();if(!b.width||!r.height)return;
    if(getComputedStyle(card).position==='static')card.style.position='relative';
    const style=getComputedStyle(img),w=parseFloat(style.width)||img.clientWidth,h=parseFloat(style.height)||img.clientHeight;
    const scale=Math.min(w/img.naturalWidth,h/img.naturalHeight),iw=img.naturalWidth*scale,ih=img.naturalHeight*scale;
    const original=artBounds(img),region=REGIONS[object.id]||[0,0,1,1];
    const left=(w-iw)/2+(original.left+(original.right-original.left)*region[0])*iw;
    const top=(h-ih)/2+(original.top+(original.bottom-original.top)*region[1])*ih;
    const right=(w-iw)/2+(original.left+(original.right-original.left)*region[2])*iw;
    const bottom=(h-ih)/2+(original.top+(original.bottom-original.top)*region[3])*ih;
    const axis=measurementGuideAxis(object,{width:right-left,height:bottom-top});
    const points=axis==='vertical'?[[Math.max(3,left-3),top],[Math.max(3,left-3),bottom]]:[[left,Math.min(h-3,bottom+3)],[right,Math.min(h-3,bottom+3)]];
    const matrix=new DOMMatrix(style.transform==='none'?undefined:style.transform);
    const sx=b.width/card.offsetWidth,sy=b.height/card.offsetHeight;
    const cx=(r.left+r.width/2-b.left)/sx-card.clientLeft,cy=(r.top+r.height/2-b.top)/sy-card.clientTop;
    const caption=card.querySelector('span,figcaption')?.getBoundingClientRect();
    const yMax=Math.min(card.clientHeight-3,caption?(caption.top-b.top)/sy-card.clientTop-3:card.clientHeight-3);
    const mapped=points.map(([x,y])=>{x-=w/2;y-=h/2;return [Math.max(3,Math.min(card.clientWidth-3,cx+matrix.a*x+matrix.c*y)),Math.max(3,Math.min(yMax,cy+matrix.b*x+matrix.d*y))];});
    const signature=JSON.stringify(mapped);if(painted.get(card)===signature)return;painted.set(card,signature);
    let svg=card.querySelector(':scope>.measurement-guide');if(!svg){svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('measurement-guide');svg.setAttribute('aria-hidden','true');card.append(svg);}
    svg.setAttribute('viewBox',`0 0 ${card.clientWidth} ${card.clientHeight}`);svg.style.cssText='position:absolute;pointer-events:none;left:0;top:0;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 0 1px white) drop-shadow(0 0 1px white)';
    const [[x1,y1],[x2,y2]]=mapped,dist=Math.hypot(x2-x1,y2-y1)||1,ux=(x2-x1)/dist,uy=(y2-y1)/dist;
    const heads=`M${x1+ux*4-uy*3} ${y1+uy*4+ux*3}L${x1} ${y1}L${x1+ux*4+uy*3} ${y1+uy*4-ux*3}M${x2-ux*4-uy*3} ${y2-uy*4+ux*3}L${x2} ${y2}L${x2-ux*4+uy*3} ${y2-uy*4-ux*3}`;
    svg.innerHTML=`<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="#4a2c12" stroke-width="1.5" stroke-dasharray="3 3"/><path d="${heads}" fill="none" stroke="#4a2c12" stroke-width="1.5" stroke-linejoin="round"/>`;
    card.title=`Measured by ${object.measurement?.dimension||'length'}`;
  }
  const resize=new ResizeObserver(entries=>entries.forEach(e=>draw(e.target)));
  function scan(){frame=0;for(const card of observed)if(!card.isConnected){resize.unobserve(card);observed.delete(card);}for(const card of doc.querySelectorAll(selectors)){if(!observed.has(card)){observed.add(card);resize.observe(card);}draw(card);}}
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(scan);};
  const mutation=new MutationObserver(records=>{if(records.some(r=>r.type==='attributes'?r.target.tagName==='IMG'&&r.target.closest(selectors):[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&!n.closest?.('.measurement-guide'))))schedule();});
  mutation.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src','style']});doc.addEventListener('load',e=>{if(e.target.tagName==='IMG'&&e.target.closest(selectors))schedule();},true);schedule();
}
