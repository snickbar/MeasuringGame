// Overlay the measurement direction without changing image/card dimensions.
export function installMeasurementGuides({objects, document:doc=document}) {
  const byImage=new Map(objects.filter(o=>o.image).map(o=>[new URL(o.image,doc.baseURI).pathname,o]));
  const painted=new WeakMap(),observed=new Set();let frame=0;
  const selectors='.dc-pic,.wb-card,.qp,.bl-objects figure';
  function draw(card){
    const img=card.querySelector('img');if(!img?.complete||!img.naturalWidth)return;
    const path=new URL(img.currentSrc||img.src,doc.baseURI).pathname;
    const object=byImage.get(path)||byImage.get(path.replace(/-2\.webp$/,'.webp'));if(!object)return;
    const b=card.getBoundingClientRect(),r=img.getBoundingClientRect();if(!b.width||!r.height)return;
    if(getComputedStyle(card).position==='static')card.style.position='relative';
    const dimension=object.measurement?.dimension||'length';
    const vertical=['height','depth'].includes(dimension)||(dimension==='length'&&img.naturalHeight>img.naturalWidth*1.25);
    const caption=card.querySelector('span,figcaption')?.getBoundingClientRect();
    const end=caption&&caption.top<r.bottom?Math.max(12,caption.top-r.top-5):r.height-4;
    const signature=[object.id,r.width,r.height,r.left-b.left,r.top-b.top,vertical,end].join(':');if(painted.get(card)===signature)return;painted.set(card,signature);
    let svg=card.querySelector(':scope>.measurement-guide');if(!svg){svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('measurement-guide');svg.setAttribute('aria-hidden','true');card.append(svg);}
    const w=r.width,h=r.height;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.style.cssText=`position:absolute;pointer-events:none;left:${r.left-b.left-card.clientLeft}px;top:${r.top-b.top-card.clientTop}px;width:${w}px;height:${h}px;overflow:visible;filter:drop-shadow(0 0 1px white) drop-shadow(0 0 1px white)`;
    const x=4,y=end,x2=w-4,y1=5,y2=Math.min(h-5,end);
    const line=vertical?`M${x} ${y1}V${y2}`:`M${x} ${y}H${x2}`;
    const heads=vertical?`M${x-3} ${y1+4}L${x} ${y1}L${x+3} ${y1+4}M${x-3} ${y2-4}L${x} ${y2}L${x+3} ${y2-4}`:`M${x+4} ${y-3}L${x} ${y}L${x+4} ${y+3}M${x2-4} ${y-3}L${x2} ${y}L${x2-4} ${y+3}`;
    svg.innerHTML=`<path d="${line}" fill="none" stroke="#4a2c12" stroke-width="1.5" stroke-dasharray="3 3"/><path d="${heads}" fill="none" stroke="#4a2c12" stroke-width="1.5" stroke-linejoin="round"/>`;
    card.title=`Measured by ${dimension}`;
  }
  const resize=new ResizeObserver(entries=>entries.forEach(e=>draw(e.target)));
  function scan(){frame=0;for(const card of observed)if(!card.isConnected){resize.unobserve(card);observed.delete(card);}for(const card of doc.querySelectorAll(selectors)){if(!observed.has(card)){observed.add(card);resize.observe(card);}draw(card);}}
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(scan);};
  const mutation=new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&!n.closest?.('.measurement-guide'))))schedule();});
  mutation.observe(doc.body,{childList:true,subtree:true});doc.addEventListener('load',e=>{if(e.target.tagName==='IMG'&&e.target.closest(selectors))schedule();},true);schedule();
}
