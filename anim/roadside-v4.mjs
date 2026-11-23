// Comparison scenes: every truck and scenic plane has its own depth, not a painted row.
import { foodGround, drawPark, parkLife } from './food-park-v4.mjs';
const food = name => 'food-v4-' + name;
const diner = name => 'diner-v4-' + name;
export const V4_TRUCKS = [
  { name: 'ramen', side: -1, depth: .25 }, { name: 'smoothie', side: 1, depth: .25 },
  { name: 'icecream', side: -1, depth: .40 }, { name: 'burger', side: 1, depth: .40 },
  { name: 'pizza', side: -1, depth: .59 }, { name: 'pretzel', side: 1, depth: .59 },
  { name: 'taco', side: -1, depth: .82 }, { name: 'coffee', side: 1, depth: .82 },
];
const FOOD_IMAGES = [...['sky','ground','city-skyline','park-treeline','tree-left','tree-right','lamp','bench','flowers-pink','flowers-white','menu','cafe','bunting','clouds','fountain-loop','path-connector','bush-left','bush-right','bush-back', ...V4_TRUCKS.map(t => 'truck-' + t.name)].map(food), '../../items/butterfly'];
const DINER_IMAGES = ['sky','asphalt','building','neon-sign','highway','distant-town','treeline','water-tower','car-left','car-right','lamp','pole-sign','flowerbed','flowers','neon-on','neon-off','cloud-small','cloud-long'].map(diner);
export function installRoadsideV4(settings, variants) {
  settings['foodtrucks-v4'] = { roadsideV4: 'food', floor: food('ground'), floorBehind: true, fittedFloor: true,
    sky: ['#168fe9','#80c6f8'], nightSky: ['#101c3d','#3e7291'], night: 'dark', parallax: [] };
  settings['diner-v4'] = { roadsideV4: 'diner', floor: diner('asphalt'), floorBehind: true, fittedFloor: true,
    sky: ['#3448ae','#f6aa7b'], night: true, parallax: [] };
  variants['foodtrucks-v4'] = 'foodtrucks'; variants['diner-v4'] = 'diner';
}
export function roadsideV4Images(scene) { return scene === 'food' ? FOOD_IMAGES : scene === 'diner' ? DINER_IMAGES : []; }

// One projection for contact points and floor slices. Depth 0 is the horizon, 1 the near plane.
export function roadsideProjection(width, floorY, shiftY = 0, scene = 'food') {
  const horizon = floorY - width * (scene === 'food' ? 1.10 : .95);
  const travel = depth => .20 + .80 * depth;
  return { horizon, travel, at: (depth, side = 0) => ({
    x: width / 2 + side * width * (.13 + .37 * depth),
    y: horizon + (floorY - horizon) * depth + shiftY * travel(depth),
    parallax: travel(depth),
  }) };
}
export function foodCityBase(width, projection, shiftY=0) {
  // The far skyline may lag, but the space behind this finite park cannot grow without bound.
  return Math.max(projection.horizon+width*.04+shiftY*.11,projection.at(.18).y-width*.30)-width*.065;
}
function sprite(ctx, img, x, bottom, width, flip = false) {
  if (!img) return null;
  const h = width * img.naturalHeight / img.naturalWidth, top = bottom - h;
  if (top > ctx.canvas.height || bottom < 0) return null;
  ctx.save();if(flip){ctx.translate(x*2,0);ctx.scale(-1,1);}
  ctx.drawImage(img, x - width / 2, top, width, h);ctx.restore();
  return { x: x - width / 2, y: top, w: width, h, bottom };
}
function steam(ctx, x, y, size, time, reduced) {
  if (reduced) return;
  ctx.save(); ctx.strokeStyle = '#fff5df'; ctx.lineWidth = Math.max(1,size*.08); ctx.lineCap = 'round';
  for (let i=0;i<3;i++) { const phase=(time*.22+i/3)%1; ctx.globalAlpha=.32*(1-phase); ctx.beginPath();
    ctx.moveTo(x+Math.sin(time+i)*size*.14,y-phase*size);ctx.bezierCurveTo(x-size*.25,y-size*(phase+.22),x+size*.25,y-size*(phase+.35),x,y-size*(phase+.55));ctx.stroke(); }
  ctx.restore();
}
function ground(ctx, img, { width, height, floorY, shiftY }, scene) {
  const p = roadsideProjection(width,floorY,shiftY,scene), horizonRow=scene==='food'?.403:.474;
  // Warp only the existing floor plane, so its far and near rows share the props' contact-point speeds.
  const slices=130, sourceY=img.naturalHeight*horizonRow, sourceH=img.naturalHeight-sourceY;
  for(let i=0;i<slices;i++) {const d0=i/slices,d1=(i+1)/slices,y0=p.at(d0).y,y1=p.at(d1).y;
    if(y1<0||y0>height||y1<=y0)continue;
    ctx.drawImage(img,0,sourceY+sourceH*d0,img.naturalWidth,sourceH/slices,0,y0,width,y1-y0+.7); }
  const edge=p.at(1).y;
  if(edge<height){const y=Math.max(0,edge-1);
    ctx.drawImage(img,0,img.naturalHeight*.96,img.naturalWidth,img.naturalHeight*.04,0,y,width,height-y);}
  return p;
}
export function drawRoadsideV4Sky(ctx,kit,{width,height,floorY=height-45,dark,time=0,reduced=false,shiftY=0}) {
  const scene=kit.config.roadsideV4,id=scene==='food'?food:diner,sky=kit.images[id('sky')];
  ctx.save();if(dark&&scene==='food')ctx.filter='brightness(.60) saturate(.80)';
  if(sky){const skyHeight=scene==='diner'?Math.max(height*.4,roadsideProjection(width,floorY,shiftY,scene).horizon+width*.20+shiftY*.1):height;
    ctx.fillStyle=scene==='diner'?'#f7ae83':'#52b9f4';ctx.fillRect(0,0,width,height);
    ctx.drawImage(sky,0,0,width,skyHeight);}
  const t=reduced?0:time;
  if(scene==='food'){const cloud=kit.images[food('clouds')];
    sprite(ctx,cloud,width*(.20+.018*Math.sin(t*.05)),height*.19+(shiftY*.035%height),width*.24);
    sprite(ctx,cloud,width*(.83+.016*Math.sin(t*.04)),height*.28+(shiftY*.025%height),width*.17);
  }else{sprite(ctx,kit.images[diner('cloud-long')],width*.14,height*.25+shiftY*.035,width*.46);
    sprite(ctx,kit.images[diner('cloud-small')],width*.82,height*.16+shiftY*.025,width*.28);}
  ctx.restore();
}
export function drawRoadsideV4(ctx,kit,options) {
  const {width,height,floorY=height-45,shiftY=0,time=0,reduced=false,dark=false}=options;
  const scene=kit.config.roadsideV4,images=kit.images,t=reduced?0:time;
  const p=roadsideProjection(width,floorY,shiftY,scene),h=p.horizon;
  ctx.save();if(dark&&scene==='food')ctx.filter='brightness(.63) saturate(.85)';
  if(scene==='food'){
    const cityBase=foodCityBase(width,p,shiftY);
    foodGround(ctx,images[food('ground')],{width,height,shiftY,projection:p,cityBase});
    sprite(ctx,images[food('city-skyline')],width*.5,cityBase,width*1.12);
    // The foreground hedge goes in front of the city's flat base, preserving its leafy silhouette.
    sprite(ctx,images[food('bush-back')],width*.5,cityBase+width*.12,width*1.15);
    drawPark(ctx,images,{width,projection:p,cityBase,time:t,reduced,sprite});
    const trees=p.at(.27);
    sprite(ctx,images[food('tree-left')],width*-.025,trees.y,width*.47);
    sprite(ctx,images[food('tree-right')],width*1.025,trees.y,width*.47);
    for(const side of [-1,1]){const l=p.at(.47,side);sprite(ctx,images[food('lamp')],l.x+side*width*.16,l.y,width*.073);}
    for(const truck of V4_TRUCKS){const q=p.at(truck.depth,truck.side),w=width*(.16+.42*truck.depth);
      const box=sprite(ctx,images[food('truck-'+truck.name)],q.x,q.y,w);
      if(box&&['ramen','coffee','pizza','taco'].includes(truck.name))steam(ctx,q.x-truck.side*w*.15,box.y+box.h*.51,width*.065,t+truck.depth*4,reduced);}
    for(const side of [-1,1]){const q=p.at(.98,side);sprite(ctx,images[food(side<0?'flowers-white':'flowers-pink')],q.x+side*width*.03,q.y,width*.13);}
    parkLife(ctx,images,{width,height,projection:p,cityBase,time:t,reduced});
  }else{
    sprite(ctx,images[diner('distant-town')],width*.5,h+width*.06+shiftY*.10,width*1.17);
    sprite(ctx,images[diner('water-tower')],width*.86,h+width*.09+shiftY*.14,width*.13);
    sprite(ctx,images[diner('treeline')],width*.5,h+width*.19+shiftY*.23,width*1.2);
    const highway=sprite(ctx,images[diner('highway')],width*.5,h+width*.22+shiftY*.30,width*1.18);
    if(highway&&!reduced){ctx.save();ctx.strokeStyle='#fff1b2';ctx.lineWidth=1.3;
      for(let i=0;i<3;i++){const x=((t*.055+i/3)%1)*width;ctx.beginPath();ctx.moveTo(x,highway.y+highway.h*.36);ctx.lineTo(x+width*.022,highway.y+highway.h*.36);ctx.stroke();}ctx.restore();}
    ground(ctx,images[diner('asphalt')],{width,height,floorY,shiftY},scene);
    const b=p.at(.54),building=sprite(ctx,images[diner('building')],width*.5,b.y,width*1.01);
    if(building){const pulse=reduced?1:.95+.05*Math.sin(t*2.5);ctx.save();ctx.globalAlpha=pulse;
      sprite(ctx,images[diner('neon-sign')],width*.48,building.y+building.h*.055,width*.43);ctx.restore();
      for(const x of [.19,.42])sprite(ctx,images[diner('flowerbed')],width*x,b.y+width*.008,width*.23);}
    const lamp=p.at(.55);sprite(ctx,images[diner('lamp')],width*.055,lamp.y,width*.16);
    sprite(ctx,images[diner('pole-sign')],width*.92,lamp.y,width*.13);
    for(const [side,key]of[[-1,'car-left'],[1,'car-right']]){const q=p.at(.70,side);sprite(ctx,images[diner(key)],width*(side<0?.025:.975),q.y,width*.28);}
  }
  ctx.restore();
}
