// Wing polygons are in percent of the visible artwork bounds, not the padded canvas.
// Keep the original artwork, routes, facing and occlusion. Only wing layers hinge.
const butterfly=(left,right)=>({kind:'bug',wings:[{pivot:left,poly:[[0,0],[40,0],[left[0],left[1]],[30,94],[0,100]]},{pivot:right,poly:[[100,0],[100,100],[44,100],[right[0],right[1]],[65,34]]}]});
export const HOME_FLIGHT={
  'ants:1':butterfly([44,62],[54,66]),
  'sunflower:1':butterfly([44,62],[54,65]),
  'snacks:0':butterfly([44,58],[55,63]),
  'corgi:0':butterfly([47,58],[57,64]),
  'giraffe:0':butterfly([45,58],[56,62]),
  'wheels:1':{kind:'bird',wings:[{pivot:[43,56],poly:[[0,0],[45,0],[47,49],[43,63],[20,66],[0,40]]},{pivot:[70,64],poly:[[70,64],[74,35],[100,8],[100,73],[81,82]]}]},
  'lighthouse:0':{kind:'bird',wings:[{pivot:[43,60],poly:[[0,0],[32,0],[43,38],[48,56],[38,72],[17,52],[0,30]]},{pivot:[64,77],poly:[[64,73],[100,76],[100,103],[57,103],[55,88]]}]},
  'cactus:1':{kind:'bird',wings:[{pivot:[42,61],poly:[[0,0],[27,0],[43,48],[47,61],[35,76],[10,55],[0,30]]},{pivot:[70,73],poly:[[70,69],[100,72],[100,103],[64,103],[61,85]]}]},
  'giraffe:1':{kind:'bird',wings:[{pivot:[45,61],poly:[[0,0],[40,0],[48,42],[48,67],[24,71],[0,44]]}]},
  'dragon:0':{kind:'bat',wings:[{pivot:[43,65],poly:[[0,0],[34,0],[44,59],[43,72],[19,78],[0,60]]},{pivot:[61,73],poly:[[61,71],[80,38],[100,39],[100,100],[61,100]]}]},
  'dragon:1':{kind:'bird',wings:[{pivot:[49,52],poly:[[0,0],[43,0],[52,44],[49,62],[17,64],[0,40]]},{pivot:[78,52],poly:[[78,52],[85,28],[100,20],[100,63],[80,69]]}]},
};
export const FRAMED_HOME_BIRDS=new Set(['games:0','town:1']);
let flightId=0;
export function makeHomeFlight(scene,index,img,spec){
  const rig=HOME_FLIGHT[scene+':'+index];if(!rig)return null;
  const {w:W,h:H,ab}=spec;
  const point=([x,y])=>`${(ab.x+x/100*ab.width)/W*100}% ${(ab.y+y/100*ab.height)/H*100}%`;
  const wrapper=document.createElement('div');wrapper.className='hs-wingbox hs-flight hs-flight-'+rig.kind;wrapper.style.aspectRatio=W+'/'+H;
  const holes=rig.wings.map(wing=>{const poly=wing.poly.map(point);return poly.join(', ')+', '+poly[0]+', 0 0';});
  const body=img.cloneNode();body.alt='';body.className='hs-part hs-flight-body';body.style.clipPath=`polygon(evenodd, 0 0,100% 0,100% 100%,0 100%,0 0,${holes.join(',')})`;
  // A protected body silhouette keeps antennae, face and feet out of both wing masks.
  // Wings can overlap at their roots behind this complete, steady foreground body.
  let masks;
  if(rig.kind==='bug'){
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),defs=document.createElementNS(ns,'defs'),id='home-flight-'+(++flightId);
    svg.setAttribute('width','0');svg.setAttribute('height','0');svg.style.position='absolute';svg.appendChild(defs);wrapper.appendChild(svg);
    const protect=[
      [[39,3],[51,3],[56,13],[58,34],[54,40],[51,33],[51,18],[47,12],[39,12]],
      [[57,39],[62,40],[71,28],[85,30],[89,23],[82,18],[69,21],[61,29]],
      [[42,34],[58,32],[66,44],[65,58],[57,64],[58,71],[65,80],[57,83],[53,75],[47,95],[30,94],[32,78],[38,65],[38,50]],
    ];
    const pts=poly=>poly.map(([x,y])=>[(ab.x+x/100*ab.width)/W,(ab.y+y/100*ab.height)/H].join(',')).join(' ');
    const polygon=(poly,fill)=>{const el=document.createElementNS(ns,'polygon');el.setAttribute('points',pts(poly));el.setAttribute('fill',fill);return el;};
    masks=[-1,...rig.wings.keys()].map(n=>{const mask=document.createElementNS(ns,'mask');mask.id=id+'-'+n;mask.setAttribute('maskContentUnits','objectBoundingBox');mask.setAttribute('x','0');mask.setAttribute('y','0');mask.setAttribute('width','1');mask.setAttribute('height','1');
      const rect=document.createElementNS(ns,'rect');rect.setAttribute('width','1');rect.setAttribute('height','1');rect.setAttribute('fill',n===-1?'white':'black');mask.appendChild(rect);
      if(n===-1)rig.wings.forEach(w=>mask.appendChild(polygon(w.poly,'black')));else mask.appendChild(polygon(rig.wings[n].poly,'white'));
      protect.forEach(poly=>mask.appendChild(polygon(poly,n===-1?'white':'black')));defs.appendChild(mask);return mask.id;});
    body.style.clipPath='none';body.style.mask=`url(#${masks[0]})`;
  }
  rig.wings.forEach((wing,i)=>{
    const part=img.cloneNode();part.alt='';part.className='hs-part hs-flight-wing';part.style.clipPath=`polygon(${wing.poly.map(point).join(',')})`;
    if(masks){part.style.clipPath='none';part.style.mask=`url(#${masks[i+1]})`;}
    part.style.transformOrigin=point(wing.pivot);part.style.setProperty('--wing-side',i===0?1:-1);wrapper.appendChild(part);
  });
  wrapper.appendChild(body);return wrapper;
}
