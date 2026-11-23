// A shared perspective floor with a central diner and two distinct rows of parked cars.
export const DINER_REWORK_IMAGES = [
  'diner-v4-lot-v2','diner-v4-freeway-v2','diner-v4-road-verge','diner-v4-sky','diner-v4-cloud-long','diner-v4-cloud-small',
  'diner-v4-distant-town','diner-v4-water-tower','diner-v4-treeline','diner-v4-building','diner-sign-on',
  'diner-car-wagon','diner-car-van','diner-car-convertible','diner-car-pickup',
  'diner-head-0','diner-head-1','diner-tail','diner-steam',
];
export const DINER_CARS = [
  { img:'diner-car-van',x:-.43,z:.95 }, { img:'diner-car-pickup',x:.43,z:.95 },
  { img:'diner-car-wagon',x:-.43,z:.05 }, { img:'diner-car-convertible',x:.43,z:.05 },
];
export function dinerProjection(width,floorY,shiftY=0) {
  const horizon=floorY-width*1.15,d=1.7,unit=width*1.3,span=width*1.15;
  const at=(x,z)=>{const depth=d/(d+z);return{x:width/2+x*unit/(d+z),y:horizon+span*depth+shiftY*(.18+.82*depth),scale:unit/(d+z),parallax:.18+.82*depth};};
  return {horizon,at,plane:depth=>horizon+span*depth+shiftY*(.18+.82*depth)};
}
export function dinerPlacement(width,floorY,shiftY=0) {
  const p=dinerProjection(width,floorY,shiftY);
  return {lotBase:p.at(0,0).y,freewayBase:p.at(0,8).y,lotTop:p.plane(.18),projection:p};
}
function drawLot(ctx,image,{width,height},p) {
  const top=p.plane(.18);if(top>=height)return;
  ctx.fillStyle='#39283e';ctx.fillRect(0,Math.max(0,top),width,height-Math.max(0,top));
  const n=150;
  for(let i=0;i<n;i++){const d0=.18+.98*i/n,d1=.18+.98*(i+1)/n,y0=p.plane(d0),y1=p.plane(d1);
    if(y1<=y0||y1<0||y0>height)continue;
    ctx.drawImage(image,0,image.naturalHeight*i/n,image.naturalWidth,image.naturalHeight/n,0,y0,width,y1-y0+.6);}
}
function traffic(ctx,images,box,width,time,reduced,sprite) {
  if(!box||reduced)return;
  for(let i=0;i<5;i++){const k=(time*(.105+i*.006)+i*.21)%1,near=i%2===0,u=near?1-k:k;
    sprite(ctx,images[near?'diner-tail':i%3?'diner-head-0':'diner-head-1'],box.x+box.w*(.08+.79*u),box.y+box.h*((near?.96:.76)-u*(near?.36:.19)),width*(.025+.025*(1-u)));}
}
export function drawDinerRoadside(ctx,kit,{width,height,floorY=height-45,shiftY=0,time=0,reduced=false},sprite) {
  const images=kit.images,t=reduced?0:time,{freewayBase,projection:p}=dinerPlacement(width,floorY,shiftY);
  const top=Math.min(p.plane(.18),freewayBase-width*.12);
  if(top<height){ctx.fillStyle='#433047';ctx.fillRect(0,Math.max(0,top),width,height-Math.max(0,top));}
  sprite(ctx,images['diner-v4-distant-town'],width*.5,p.at(0,15).y-width*.12,width*1.15);
  sprite(ctx,images['diner-v4-water-tower'],width*.91,p.at(0,12).y-width*.08,width*.12);
  sprite(ctx,images['diner-v4-treeline'],width*.5,p.at(0,10).y-width*.05,width*1.2);
  drawLot(ctx,images['diner-v4-lot-v2'],{width,height},p);
  const road=sprite(ctx,images['diner-v4-freeway-v2'],width*.5,freewayBase,width*1.15);
  traffic(ctx,images,road,width,t,reduced,sprite);
  sprite(ctx,images['diner-v4-road-verge'],width*.5,freewayBase+width*.07,width*1.04);
  const q=p.at(0,1.6),bw=width*.96,bh=bw*images['diner-v4-building'].naturalHeight/images['diner-v4-building'].naturalWidth;
  if(!reduced)for(let i=0;i<3;i++){const k=(t*.18+i/3)%1;ctx.save();ctx.globalAlpha=.32*(1-k);sprite(ctx,images['diner-steam'],width*.69+width*.018*k,q.y-bh*.85-width*.10*k,width*(.035+.02*k));ctx.restore();}
  const building=sprite(ctx,images['diner-v4-building'],width*.5,q.y,bw);
  if(building){ctx.save();ctx.globalAlpha=reduced?1:.97+.03*Math.sin(t*2.1);sprite(ctx,images['diner-sign-on'],width*.5,building.y+width*.04,width*.44);ctx.restore();}
  for(const car of DINER_CARS){const c=p.at(car.x,car.z);sprite(ctx,images[car.img],c.x,c.y,c.scale*.48);}
}
