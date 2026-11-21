// Comparison-only indoor rooms. Floors and props share one camera projection.
const prop = (img, x, z, w, extra = {}) => ({ img, x, z, w, ...extra });
const definitions = {
  workshop: { material: 'concrete', colors: ['#b69b83', '#a58c77'], props: [
    prop('workshop-climb-garage-door', -1.8, 7, 4.5), prop('workshop-climb-storage', 1.05, 3.5, 2.6),
    prop('workshop-climb-board', -.2, 7, 2.5, { lift: 2.6 }), prop('workshop-climb-fan', 2.4, 7, 1.3, { lift: 2.8 }),
    prop('workshop-climb-straight-bench', .55, .4, 1.9, { bench: true }), prop('workshop-climb-offcuts', -.65, -.05, .7),
  ] },
  library: { material: 'wood', colors: ['#ab713f', '#bd844b'], props: [
    prop('library-v2-back', 0, 7, 7.3),
    ...[5.2, 3.1].flatMap((z, i) => [prop('library-v2-case-' + (i + 1), -1.55, z, 2.3), prop('library-v2-case-' + (2 - i), 1.55, z, 2.3)]),
    prop('library-v2-furn-0', .9, 1.25, 1.5), prop('library-v2-furn-3', -.9, 1.6, .65),
    prop('library-v2-furn-1', -.58, .02, .94), prop('library-v2-furn-4', .95, .05, .62),
  ] },
  restaurant: { material: 'tile', colors: ['#e2c8a1', '#cda982'], props: [
    prop('restaurant-n-far', 0, 7, 7.4),
    ...[5.2, 3.2, 1.5].flatMap((z, i) => [prop('restaurant-table-' + (i * 2), -1.13, z, 1.65), prop('restaurant-table-' + (i * 2 + 1), 1.13, z, 1.65)]),
    prop('restaurant-table-6', -.66, -.05, 1.35), prop('restaurant-table-7', .88, .08, 1.35),
  ] },
  kitchen: { material: 'checker', colors: ['#fff0cf', '#4d5149'], props: [
    prop('kitchen-v2-back', 0, 7, 7.4), prop('kitchen-v2-furn-5', -1.9, 4.6, .8),
    prop('kitchen-v2-furn-6', 1.7, 4.1, 1.1), prop('kitchen-v2-furn-0', -.95, 2.2, 1.35),
    prop('kitchen-v2-furn-3', 1.1, 2.2, .9), prop('kitchen-v2-furn-2', -.76, .22, 1.4),
    prop('kitchen-v2-furn-1', .79, .05, 1.45),
  ] },
  living: { material: 'wood', colors: ['#c3955c', '#d5ab72'], rug: true, props: [
    prop('living-v2-back', 0, 7, 7.3), prop('living-v2-furn-7', -1.7, 4, 1.1),
    prop('living-v2-furn-0', -.55, 2.3, 2.05), prop('living-v2-furn-4', 1.38, 3.4, .55),
    prop('living-v2-furn-3', -1.1, 1.4, .8), prop('living-v2-furn-1', .85, .6, 1.15),
    prop('living-v2-furn-2', -.25, .55, 1.2), prop('living-v2-furn-6', -.74, -.18, .8),
    prop('living-v2-furn-5', .85, -.18, .62),
  ] },
  tabletop: { material: 'desk', colors: ['#ce9554', '#dba664'], props: [
    prop('tabletop-climb-rocket-board', -.8, 7, 3.2, { lift: 1 }),
    prop('tabletop-n-big-0', 1.32, 3, 1.6), prop('tabletop-climb-pencil-cup', -1.12, 2.5, .72),
    prop('tabletop-n-loose-2', .8, .15, .62), prop('tabletop-n-loose-4', -.75, .1, .58),
    prop('tabletop-n-loose-0', -.9, 1.1, .2, { angle: -.8 }),
  ] },
};
export function installIndoorV3(settings, variants) {
  for (const [id, room] of Object.entries(definitions)) {
    const c = structuredClone(settings[id]);
    Object.assign(c, { projectedRoom: room, parallax: [], floorDepth: undefined, floorBehind: false,
      fittedFloor: true, floorProp: undefined, bookcase: undefined, workshop: undefined,
      deskLamp: undefined, roomPlant: undefined, roomBackGlint: undefined,
      overlapTerrain: false });
    settings[id + '-v3'] = c; variants[id + '-v3'] = id;
  }
}
export function projectedRoomImages(room) {
  return room ? [...room.props.map(p => p.img), ...(room.props.some(p => p.bench) ?
    ['workshop-climb-saw', 'workshop-climb-blade', 'workshop-climb-vise', 'workshop-climb-rotor'] : [])] : [];
}
export function drawProjectedIndoor(ctx, kit, { width, height, floorY, shiftY = 0, time = 0, reduced = false, dark = false }) {
  const room = kit.config.projectedRoom;
  if (!room) return;
  const unit = width * 1.2, d = 1.5, horizon = floorY - unit * 2 / d;
  const P = (x, z) => ({ x: width / 2 + x * unit / (d + z),
    y: horizon + unit * 2 / (d + z) + shiftY * (.3 + .7 * d / (d + z)), s: unit / (d + z) });
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
    const q = P(p.x,p.z), w = p.w*q.s, h = w*im.naturalHeight/im.naturalWidth, y = q.y-(p.lift||0)*q.s;
    if (y-h>height || y<0) continue;
    ctx.save();
    if (!p.lift) { ctx.fillStyle='#38281918';ctx.beginPath();ctx.ellipse(q.x,q.y-1,w*.38,Math.max(2,q.s*.035),0,0,Math.PI*2);ctx.fill(); }
    if (p.z>3) ctx.filter=`saturate(${1-p.z*.018}) brightness(${1-p.z*.008})`;
    ctx.translate(q.x,y);if(p.angle)ctx.rotate(p.angle);
    ctx.drawImage(im,-w/2,-h,w,h);ctx.filter='none';
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
