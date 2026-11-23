// Continuous ground beneath independently moving artwork. Sky may only appear above the skyline.
const textures = new WeakMap();
function grassTexture(image) {
  if (textures.has(image)) return textures.get(image);
  const tile=document.createElement('canvas'), size=Math.min(150,Math.floor(image.naturalWidth*.22));tile.width=tile.height=size*2;
  const ctx=tile.getContext('2d'),sx=(image.naturalWidth-size)/2,sy=Math.floor(image.naturalHeight*.76);
  // Mirror the quiet lawn sample at its native resolution: no stretched final row or visible tile join.
  for(let y=0;y<2;y++)for(let x=0;x<2;x++){ctx.save();ctx.translate(x?size*2:0,y?size*2:0);ctx.scale(x?-1:1,y?-1:1);ctx.drawImage(image,sx,sy,size,size,0,0,size,size);ctx.restore();}
  textures.set(image,tile);return tile;
}
const polygon=(ctx,pts,fill)=>{ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();};
export function foodGround(ctx,image,{width,height,shiftY=0,projection,cityBase}) {
  const start=cityBase-width*.04;if(start>=height)return;
  ctx.save();ctx.beginPath();ctx.rect(0,Math.max(0,start),width,height-Math.max(0,start));ctx.clip();
  ctx.fillStyle='#89b933';ctx.fillRect(0,start,width,height-start);
  const pattern=ctx.createPattern(grassTexture(image),'repeat');
  pattern.setTransform(new DOMMatrix().translate(0,shiftY*.8));ctx.fillStyle=pattern;ctx.fillRect(0,start,width,height-start);
  const wash=ctx.createLinearGradient(0,start,0,Math.max(start+1,projection.at(1).y));
  wash.addColorStop(0,'#456b3ba8');wash.addColorStop(.25,'#8ab52c30');wash.addColorStop(1,'#b6cc3d10');ctx.fillStyle=wash;ctx.fillRect(0,start,width,height-start);
  const at=(d,side,outer=false)=>[width/2+side*width*((outer?.15:.055)+(outer?.45:.24)*d),projection.at(d).y];
  // Converging paths and curbs cover the whole visible plane, including below the object baseline.
  const end=Math.max(1.4,(height-projection.at(0).y)/Math.max(1,projection.at(1).y-projection.at(0).y)+.1);
  for(const side of [-1,1]){
    const stop=.18;
    polygon(ctx,[at(stop,side),at(end,side),at(end,side,true),at(stop,side,true)],'#edc28e');
    ctx.save();ctx.strokeStyle='#b2835980';ctx.lineWidth=.7;
    for(let z=0;z<28;z++){const d=1/(.7+z*.55);if(d<stop)continue;const a=at(d,side),b=at(d,side,true);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
    for(const t of [.33,.66]){const a=at(stop,side),b=at(stop,side,true),c=at(end,side),d=at(end,side,true);ctx.beginPath();ctx.moveTo(a[0]+(b[0]-a[0])*t,a[1]);ctx.lineTo(c[0]+(d[0]-c[0])*t,c[1]);ctx.stroke();}
    ctx.strokeStyle='#fae1b6';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(...at(stop,side));ctx.lineTo(...at(end,side));ctx.stroke();ctx.restore();
  }
  ctx.restore();
}
export function drawPark(ctx,images,{width,projection,cityBase,time=0,reduced=false,sprite}) {
  const img=name=>images['food-v4-'+name],t=reduced?0:time;
  const front=projection.at(.18).y;
  // This is one finite garden, not foliage generated to fill a camera-dependent gap.
  // Furniture and shrubs share its near-edge anchor, keeping their ground contacts together.
  const at=depth=>({y:front+width*1.10*(depth-.18)});
  for(const [row,offset] of [-.19,-.14].entries())sprite(ctx,img('bush-back'),width*(row?.512:.5),front+width*offset,width*(row?1.12:1.18));
  for(const [row,offset] of [-.12,-.055,.015].entries()){const y=front+width*offset;
    const w=width*(.32+row*.01),outside=-width*.015;
    sprite(ctx,img('bush-left'),outside,y,w);sprite(ctx,img('bush-right'),width-outside,y,w);}
  const f=sprite(ctx,img('fountain-loop'),width*.5,at(.15).y,width*.50);
  for(const side of [-1,1]){
    flutterBunting(ctx,img('bunting'),width*(side<0?.22:.78),at(.04).y,width*.16,t,reduced);
    sprite(ctx,img('cafe'),width*(side<0?.22:.78),at(.07).y,width*.16);
    // Both the bench and its neighboring flowers are nearer than their table, never perched behind it.
    sprite(ctx,img('bench'),width*(side<0?.20:.80),at(.17).y,width*.14);
    sprite(ctx,img('flowers-white'),width*(side<0?.10:.90),at(.17).y,width*.06);
  }
  if(f&&!reduced){ctx.save();ctx.strokeStyle='#d6fdff';ctx.lineWidth=1.25;
    for(let i=0;i<3;i++){const k=(t*.45+i/3)%1;ctx.globalAlpha=(1-k)*.7;ctx.beginPath();ctx.ellipse(f.x+f.w*.5,f.y+f.h*.45,f.w*(.03+.09*k),f.h*(.008+.018*k),0,0,Math.PI*2);ctx.stroke();}
    for(const side of [-1,1]){const k=(t*.8+(side<0?.2:.7))%1;ctx.globalAlpha=.85;ctx.fillStyle='#efffff';ctx.beginPath();ctx.arc(f.x+f.w*(.5+side*(.025+.08*k)),f.y+f.h*(.07+.38*k*k),1,0,Math.PI*2);ctx.fill();}ctx.restore();}
}
export function flutterBunting(ctx,image,x,bottom,width,time,reduced) {
  const h=width*image.naturalHeight/image.naturalWidth,top=bottom-h;
  if(top>ctx.canvas.height||bottom<0)return;
  for(let i=0;i<16;i++){const u=i/16,w=image.naturalWidth/16,dy=reduced?0:Math.sin(time*2.3-u*Math.PI*2)*h*.018*Math.sin(u*Math.PI);
    ctx.drawImage(image,w*i,0,w,image.naturalHeight,x-width/2+width*u,top+dy,width/16+.4,h);}
}
export function parkLife(ctx,images,{width,height,projection,cityBase,time=0,reduced=false}) {
  const t=reduced?2:time;
  // Small birds flap and cross behind the park, safely away from the stack's foreground.
  ctx.save();ctx.strokeStyle='#405448';ctx.lineWidth=1.25;ctx.lineCap='round';
  for(let i=0;i<3;i++){const x=((t*.018+i*.31)%1.15-.075)*width,y=cityBase-width*(.19+i*.055)+Math.sin(t*.5+i)*width*.012;
    if(y<0||y>height)continue;const wing=(reduced?.2:Math.sin(t*6+i))*width*.009;ctx.beginPath();ctx.moveTo(x-width*.014,y-wing);ctx.quadraticCurveTo(x-width*.005,y-width*.007,x,y);ctx.quadraticCurveTo(x+width*.005,y-width*.007,x+width*.014,y-wing);ctx.stroke();}
  const butterfly=images['../../items/butterfly'];
  if(butterfly)for(const side of [-1,1]){const q=projection.at(.87,side),x=q.x+Math.sin(t*.8+side)*width*.025,y=q.y-width*.09-Math.cos(t*.65+side)*width*.025;
    if(y<0||y>height)continue;ctx.save();ctx.translate(x,y);ctx.scale((reduced?.8:.30+.70*Math.abs(Math.sin(t*6.5+side)))*side,1);ctx.drawImage(butterfly,-width*.018,-width*.022,width*.036,width*.044);ctx.restore();}
  ctx.restore();
}
