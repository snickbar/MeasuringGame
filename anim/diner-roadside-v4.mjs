// A finite roadside set: a visible freeway above the older, more expressive diner artwork.
export const DINER_REWORK_IMAGES = [
  'diner-v4-lot-v2','diner-v4-freeway-v2','diner-v4-road-verge','diner-v4-sky','diner-v4-cloud-long','diner-v4-cloud-small',
  'diner-v4-distant-town','diner-v4-water-tower','diner-v4-treeline',
  'diner-building','diner-pole-sign','diner-lamp','diner-phone-booth','diner-soda-machine','diner-pumps','diner-bench',
  'diner-car-wagon','diner-car-van','diner-car-convertible','diner-car-pickup',
  'diner-head-0','diner-head-1','diner-tail','diner-steam',
];
export function dinerPlacement(width,floorY,shiftY=0) {
  const lotBase=floorY+shiftY*.62;
  const freewayBase=Math.max(floorY-width*1.02+shiftY*.30,lotBase-width);
  return {lotBase,freewayBase,lotTop:lotBase-width*1.22};
}
function traffic(ctx,images,box,width,time,reduced,sprite) {
  if(!box||reduced)return;
  // Follow the two carriageways' diagonals in the painted road, not a horizontal line across its signs.
  for(let i=0;i<5;i++){
    const k=(time*(.105+i*.006)+i*.21)%1,near=i%2===0,u=near?1-k:k;
    const x=box.x+box.w*(.08+.79*u),y=box.y+box.h*((near?.96:.76)-u*(near?.36:.19));
    const size=width*(.025+.025*(1-u));
    sprite(ctx,images[near?'diner-tail':i%3?'diner-head-0':'diner-head-1'],x,y,size);
  }
}
export function drawDinerRoadside(ctx,kit,{width,height,floorY=height-45,shiftY=0,time=0,reduced=false},sprite) {
  const images=kit.images,t=reduced?0:time,{lotBase,freewayBase,lotTop}=dinerPlacement(width,floorY,shiftY);
  const base=Math.min(lotTop,freewayBase-width*.12);
  if(base<height){const wash=ctx.createLinearGradient(0,base,0,Math.max(base+1,lotBase));wash.addColorStop(0,'#433047');wash.addColorStop(1,'#39283e');ctx.fillStyle=wash;ctx.fillRect(0,Math.max(0,base),width,height-Math.max(0,base));}
  sprite(ctx,images['diner-v4-distant-town'],width*.5,freewayBase-width*.19,width*1.15);
  sprite(ctx,images['diner-v4-water-tower'],width*.91,freewayBase-width*.15,width*.12);
  sprite(ctx,images['diner-v4-treeline'],width*.5,freewayBase-width*.10,width*1.20);
  // One complete illustrated lot, no last-row stretch or repeated strips.
  sprite(ctx,images['diner-v4-lot-v2'],width*.5,lotBase+width*.34,width*1.04);
  const road=sprite(ctx,images['diner-v4-freeway-v2'],width*.5,freewayBase,width*1.15);
  traffic(ctx,images,road,width,t,reduced,sprite);
  sprite(ctx,images['diner-v4-road-verge'],width*.5,freewayBase+width*.07,width*1.04);
  const bw=width*.62,bottom=lotBase-width*.23,bh=bw*images['diner-building'].naturalHeight/images['diner-building'].naturalWidth;
  if(!reduced)for(let i=0;i<3;i++){const k=(t*.18+i/3)%1;ctx.save();ctx.globalAlpha=.32*(1-k);sprite(ctx,images['diner-steam'],width*.49+width*.018*k,bottom-bh*.61-width*.10*k,width*(.035+.02*k));ctx.restore();}
  const building=sprite(ctx,images['diner-building'],width*.33,bottom,bw);
  if(building&&!reduced){const strength=Math.pow(Math.max(0,Math.sin(t*.9)),10);ctx.save();ctx.globalAlpha=strength*.65;ctx.fillStyle='#fff4c3';ctx.beginPath();ctx.arc(building.x+building.w*.77,building.y+building.h*.21,width*.006,0,Math.PI*2);ctx.fill();ctx.restore();}
  // A small service corner and parked cars give the lot a purpose while the middle stays open.
  sprite(ctx,images['diner-pole-sign'],width*.89,lotBase-width*.42,width*.14);
  sprite(ctx,images['diner-pumps'],width*.83,lotBase-width*.34,width*.18);
  sprite(ctx,images['diner-lamp'],width*.04,lotBase-width*.14,width*.14);
  sprite(ctx,images['diner-phone-booth'],width*.95,lotBase-width*.11,width*.12);
  sprite(ctx,images['diner-soda-machine'],width*.72,lotBase-width*.16,width*.10);
  sprite(ctx,images['diner-bench'],width*.66,lotBase-width*.22,width*.15);
  sprite(ctx,images['diner-car-van'],width*.83,lotBase-width*.035,width*.205);
  sprite(ctx,images['diner-car-wagon'],width*.13,lotBase+width*.10,width*.245);
  sprite(ctx,images['diner-car-convertible'],width*.87,lotBase+width*.15,width*.25);
}
