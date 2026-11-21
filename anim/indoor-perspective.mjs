// Comparison-only indoor rooms. Floors and props share one camera projection.
const prop = (img, x, z, w, extra = {}) => ({ img, x, z, w, ...extra });
const definitions = {
  workshop: { material: 'concrete', colors: ['#b69b83', '#a58c77'], props: [
    prop('workshop-climb-garage-door', -1.8, 7, 4.5), prop('workshop-climb-storage', 1.05, 3.5, 2.6),
    prop('workshop-climb-board', 2.35, 7, 2.3, { lift: 2.9 }), prop('workshop-climb-fan', 2.4, 7, 1.3, { lift: 6.3 }),
    prop('workshop-climb-straight-bench', .55, .4, 1.9, { bench: true }), prop('workshop-climb-offcuts', -.65, -.05, .7),
  ] },
  library: { material: 'wood', colors: ['#ab713f', '#bd844b'], floorTexture: 'library-v2-floor',
    floorRise: [[0, 0], [3.1, .04], [5.2, .32], [7, .60]], props: [
    prop('library-v2-back', 0, 7, 7.3, { fire: true }),
    ...[5.2, 3.1].flatMap((z, i) => [
      prop('library-v2-case-' + (i + 1), -1.55, z, 2.3),
      prop('library-v2-case-' + (2 - i), 1.55, z, 2.3),
    ]),
    prop('library-v2-furn-0', .9, 1.25, 1.5), prop('library-v2-furn-3', -.9, 1.6, .65),
    prop('library-v2-furn-1', -.58, .02, .94), prop('library-v2-furn-4', .95, .05, .62),
  ] },

};
export function installIndoorV3(settings, variants) {
  for (const [id, room] of Object.entries(definitions)) {
    const c = structuredClone(settings[id]);
    Object.assign(c, { projectedRoom: room, parallax: [], floorDepth: undefined, floorBehind: false,
      fittedFloor: true, floorProp: undefined, bookcase: undefined, workshop: undefined,
      deskLamp: undefined, roomPlant: undefined, roomBackGlint: undefined,
      overlapTerrain: false, finishedWorkshopCeiling: id === 'workshop' });
    settings[id + '-v3'] = c; variants[id + '-v3'] = id;
  }
}
export function projectedRoomImages(room) {
  return room ? [room.floorTexture, ...room.props.map(p => p.img), ...(room.props.some(p => p.bench) ?
    ['workshop-climb-saw', 'workshop-climb-blade', 'workshop-climb-vise', 'workshop-climb-rotor'] : [])].filter(Boolean) : [];
}
export function indoorProjection(room, width, floorY, shiftY = 0) {
  const unit=width*1.2,d=1.5,horizon=floorY-unit*2/d;
  const rise=z=>{
    const stops=room.floorRise;if(!stops || z<=stops[0][0])return 0;
    for(let i=1;i<stops.length;i++)if(z<=stops[i][0]){const [z0,y0]=stops[i-1],[z1,y1]=stops[i];return y0+(y1-y0)*(z-z0)/(z1-z0);}
    return stops.at(-1)[1];
  };
  return (x,z)=>({x:width/2+x*unit/(d+z),y:horizon+unit*2/(d+z)+shiftY*(.3+.7*d/(d+z))-rise(z)*width,s:unit/(d+z)});
}
export function drawProjectedIndoor(ctx, kit, { width, height, floorY, shiftY = 0, time = 0, reduced = false, dark = false }) {
  const room = kit.config.projectedRoom;
  if (!room) return;
  const P = indoorProjection(room, width, floorY, shiftY);
  const polygon = (points, fill, stroke) => {
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = .7; ctx.stroke(); }
  };
  ctx.save();
  // One unbroken floor: cells get wider and deeper as they approach the camera.
  const top = P(0, 7).y;
  if (top < height) {
    ctx.fillStyle = room.colors[0]; ctx.fillRect(0, Math.max(0, top), width, height - Math.max(0, top));
    for (let z = 6.8, row = 0; z >= -.65; z -= .35, row++) {
      const wood = room.material === 'wood' || room.material === 'desk';
      const step = wood ? 1.35 : room.material === 'concrete' ? 2 : .65;
      for (let x = -12, col = 0; x < 12; x += step, col++) {
        const offset = wood && row % 2 ? step / 2 : 0, a = x + offset;
        const tone = room.material === 'checker' ? (row + col) % 2 : wood ? (row * 7 + col * 3) % 5 === 0 ? 1 : 0 : row % 3 === 0 ? 1 : 0;
        polygon([P(a,z), P(a+step,z), P(a+step,z+.35), P(a,z+.35)], room.colors[tone], wood ? '#8d603b55' : '#6c554b30');
      }
    }
    const texture=kit.images[room.floorTexture];
    if(texture){
      // The same continuous floor runs underneath every shelf row and down the aisle.
      const slices=180;
      for(let i=0;i<slices;i++){
        const t=i/slices,t1=(i+1)/slices,y0=P(0,7-7.65*t).y,y1=P(0,7-7.65*t1).y;
        if(y1<0||y0>height)continue;
        ctx.drawImage(texture,0,t*texture.naturalHeight,texture.naturalWidth,texture.naturalHeight/slices,0,y0,width,y1-y0+.7);
      }
    }
    const wash = ctx.createLinearGradient(0, top, 0, floorY + shiftY);
    wash.addColorStop(0, '#654b382d'); wash.addColorStop(.55, '#fff2ce08'); wash.addColorStop(1, '#fff0cf00');
    ctx.fillStyle = wash; ctx.fillRect(0, Math.max(top,0), width, height - Math.max(top,0));
    // A back edge fixes the room's vanishing depth against the original climbing wall.
    ctx.strokeStyle = '#71513c';ctx.lineWidth = 3;ctx.beginPath();ctx.moveTo(0,top);ctx.lineTo(width,top);ctx.stroke();
    if (room.rug) polygon([P(-1.5,-.35),P(1.5,-.35),P(1.5,2.3),P(-1.5,2.3)], '#a853435c', '#82463b70');
    if (room.material === 'desk') { const lip = P(0,-.35).y;ctx.fillStyle='#89542e';ctx.fillRect(0,lip,width,14);ctx.fillStyle='#efbf7a';ctx.fillRect(0,lip,width,3); }
  }
  for (const p of [...room.props].sort((a,b)=>b.z-a.z)) {
    const im = kit.images[p.img]; if (!im) continue;
    const q = P(p.x,p.z);
    const w = p.w*q.s, h = w*im.naturalHeight/im.naturalWidth, y = q.y-(p.lift||0)*q.s;
    if (y-h>height || y<0) continue;
    ctx.save();
    if (!p.lift) { ctx.fillStyle='#38281918';ctx.beginPath();ctx.ellipse(q.x,q.y-1,w*.38,Math.max(2,q.s*.035),0,0,Math.PI*2);ctx.fill(); }
    if (p.z>3) ctx.filter=`saturate(${1-p.z*.018}) brightness(${1-p.z*.008})`;
    ctx.translate(q.x,y);if(p.angle)ctx.rotate(p.angle);
    ctx.drawImage(im,-w/2,-h,w,h);ctx.filter='none';
    if(p.fire && !reduced) drawLibraryFire(ctx,im,w,h,time);
    if (p.bench) {
      const draw = (name, x, yy, ww) => {const a=kit.images[name];if(!a)return;const hh=ww*a.naturalHeight/a.naturalWidth;ctx.drawImage(a,x-ww/2,yy-hh,ww,hh);};
      draw('workshop-climb-vise',-w*.34,-h*.88,w*.23);
      draw('workshop-climb-saw',-w*.035,-h*.89,w*.33);
      const blade=kit.images['workshop-climb-blade'], saw=kit.images['workshop-climb-saw'];
      if(blade && saw){
        const sw=w*.33, sh=sw*saw.naturalHeight/saw.naturalWidth, bw=sw*.31;
        ctx.save();ctx.translate(-w*.035+sw*.008,-h*.89-sh*.71);
        ctx.beginPath();ctx.rect(-sw*.17,-sw*.17,sw*.34,sh*.032+sw*.17);ctx.clip();
        ctx.rotate(reduced?0:time*24);ctx.drawImage(blade,-bw/2,-bw/2,bw,bw);ctx.restore();
      }
    }
    if(p.img==='workshop-climb-fan'){
      const rotor=kit.images['workshop-climb-rotor'];
      if(rotor){ctx.save();ctx.translate(0,-h/2);ctx.rotate(reduced?0:time*8);const rw=w*.72;ctx.drawImage(rotor,-rw/2,-rw/2,rw,rw);ctx.restore();}
    }
    ctx.restore();
  }
  if(dark){ctx.fillStyle='#12223833';ctx.fillRect(0,Math.max(0,top),width,height-Math.max(0,top));}
  ctx.restore();
}

// Animate only the fire pixels within the existing hearth; the mantel and logs stay still.
function drawLibraryFire(ctx, image, w, h, time) {
  const sx=image.naturalWidth/2172, sy=image.naturalHeight/630;
  const x=-w/2+w*951/2172, y=-h+h*386/630, fw=w*259/2172, fh=h*151/630;
  const pulse=.5+.5*Math.sin(time*7.1)+.13*Math.sin(time*13.3);
  ctx.save();ctx.beginPath();ctx.rect(x,y,fw,fh);ctx.clip();
  const grow=1.05+.13*pulse;
  ctx.drawImage(image,951*sx,386*sy,259*sx,151*sy,x-fw*.025,y+fh-fh*grow,fw*1.05,fh*grow);
  const glow=ctx.createRadialGradient(x+fw*.52,y+fh*.8,0,x+fw*.52,y+fh*.8,fw*.7);
  glow.addColorStop(0,`rgba(255,177,45,${.08+.06*pulse})`);glow.addColorStop(1,'rgba(255,125,20,0)');
  ctx.fillStyle=glow;ctx.fillRect(x,y,fw,fh);
  for(let i=0;i<3;i++){const t=(time*.48+i*.33)%1;ctx.globalAlpha=(1-t)*.7;ctx.fillStyle='#ffdd79';ctx.beginPath();ctx.ellipse(x+fw*(.35+i*.14)+Math.sin(time*2+i)*fw*.04,y+fh*(.92-t*.72),Math.max(.4,w*.0018),Math.max(.7,w*.003),0,0,Math.PI*2);ctx.fill();}
  ctx.restore();
}

export function drawWorkshopCeiling(ctx, { width, bottom, dark }) {
  // The rafters artwork is transparent above its lower beam; complete the roof behind it.
  ctx.save();ctx.beginPath();ctx.rect(0,0,width,bottom);ctx.clip();
  const wood=ctx.createLinearGradient(0,0,0,bottom);wood.addColorStop(0,dark?'#53341e':'#79502c');wood.addColorStop(1,dark?'#8a5628':'#c98a42');
  ctx.fillStyle=wood;ctx.fillRect(0,0,width,bottom);
  for(let y=bottom-12;y>0;y-=Math.max(10,width*.045)){ctx.strokeStyle='#55321c88';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();ctx.strokeStyle='#efbe7433';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,y+2);ctx.lineTo(width,y+2);ctx.stroke();}
  ctx.strokeStyle='#523119';ctx.lineWidth=Math.max(3,width*.014);
  for(let i=0;i<5;i++){const x=width*(i/4);ctx.beginPath();ctx.moveTo(width/2+(x-width/2)*.65,0);ctx.lineTo(x,bottom);ctx.stroke();}
  ctx.restore();
}
