// A single projected floor gives the rink, skaters and furniture a shared vanishing point.
const atlasCache = new WeakMap();
function cell(image, columns, rows, column, row) {
  let cache = atlasCache.get(image);
  if (!cache) atlasCache.set(image, cache = new Map());
  const key = `${columns}:${rows}:${column}:${row}`;
  if (cache.has(key)) return cache.get(key);
  const cw = image.naturalWidth / columns, ch = image.naturalHeight / rows;
  const x0 = Math.round(column * cw), y0 = Math.round(row * ch);
  const c = document.createElement('canvas'); c.width = Math.floor(cw); c.height = Math.floor(ch);
  const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(image, -x0, -y0);
  const pixels = ctx.getImageData(0, 0, c.width, c.height).data;
  let left = c.width, top = c.height, right = -1, bottom = -1;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
    if (pixels[(y * c.width + x) * 4 + 3] < 24) continue;
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  const bounds = right < 0 ? [x0, y0, cw, ch] : [x0 + left, y0 + top, right - left + 1, bottom - top + 1];
  cache.set(key, bounds); return bounds;
}
function sprite(ctx, image, bounds, x, y, width, flip = false) {
  if (!image) return;
  const h = width * bounds[3] / bounds[2];
  ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
  ctx.drawImage(image, ...bounds, -width / 2, -h, width, h); ctx.restore();
}
export function drawRetroSky(ctx, { width, height, shiftY = 0, dark }) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, dark ? '#09122b' : '#162548'); gradient.addColorStop(1, '#6676b4');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#fff2c9';
  for (let i = 0; i < 42; i++) {
    const x = ((i * 137.51 + 23) % 997) / 997 * width;
    const y = (((i * 79.31 + shiftY * .025) % height) + height) % height;
    ctx.globalAlpha = .28 + (i % 4) * .12; ctx.beginPath(); ctx.arc(x, y, i % 7 === 0 ? 1.3 : .65, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
export function drawRetroRink(ctx, kit, { width, height, floorY = height - 50, shiftY = 0, time = 0, reduced = false, dark }) {
  const art = kit.config.retroRink, images = kit.images;
  const front = images[art.front], track = images[art.track], back = images[art.back], props = images[art.props], skaters = images[art.skaters];
  if (!front || !track || !back || !props || !skaters) return;
  const t = reduced ? 0 : time, unit = width * 1.15, horizon = floorY - width * 1.12;
  const par = z => .30 + .70 / (1 + z * .3);
  const project = (x, z) => ({ x: width / 2 + x * unit / (z + 1.8), y: horizon + unit * 1.65 / (z + 1.8) + shiftY * par(z), scale: unit / (z + 1.8) });
  ctx.save(); if (dark) ctx.filter = 'brightness(72%)';
  // This entire low hall (including its roof) leaves the screen on a high climb.
  const far = project(0, 9.5), bw = width * 1.25, bh = bw * back.naturalHeight / back.naturalWidth;
  const ceiling = images[art.ceiling], ceilingBottom = far.y - bh * .55;
  const ceilingTop = -width * .25 + shiftY * .48;
  if (ceiling && ceilingTop < height && ceilingBottom > ceilingTop) {
    // The near roof fills tall screens at ground level, then leaves with the rest of the building.
    ctx.drawImage(ceiling, 0, 0, ceiling.naturalWidth, ceiling.naturalHeight * .40,
      0, ceilingTop, width, ceilingBottom - ceilingTop);
  }
  if (far.y - bh < height) {
    ctx.save(); ctx.filter = dark ? 'brightness(72%) blur(.4px)' : 'blur(.4px)';
    // End the wall at the stools, before the painted checker strip. The shared projected floor starts here.
    const wallRows = back.naturalHeight * .88;
    ctx.drawImage(back, 0, 0, back.naturalWidth, wallRows, (width - bw) / 2, far.y - bh * .88, bw, bh * .88); ctx.restore();
  }
  const woodTop = project(0, 3.45).y;
  if (woodTop < height) {
    const wood = ctx.createLinearGradient(0, woodTop, 0, Math.max(woodTop + 1, height));
    wood.addColorStop(0, '#d48a39'); wood.addColorStop(1, '#ebaa56');
    ctx.fillStyle = wood; ctx.fillRect(0, woodTop, width, height - woodTop);
    ctx.strokeStyle = 'rgba(102,49,17,.16)'; ctx.lineWidth = .65;
    for (let z = 3.45; z > -.05; z -= .14) {
      const y = project(0, z).y; if (y > height) continue;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
  }
  // Each checker is projected separately: squares shrink into the distance, with no mirrored filler strips.
  for (let z = 8.8; z > 3.35; z -= .45) for (let x = -5.4; x < 5.4; x += .45) {
    const points = [project(x, z), project(x + .45, z), project(x + .45, z - .45), project(x, z - .45)];
    if (points[0].y > height && points[3].y > height) continue;
    ctx.fillStyle = (Math.round((x + 5.4) / .45) + Math.round(z / .45)) % 2 ? '#e9c89e' : '#ba665b';
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.fill();
  }
  // Exactly two rows of two long bench tables, sorted far to near.
  const table = cell(props, 2, 2, 0, 0);
  for (const z of [6.7, 4.1]) for (const x of [-.82, .82]) {
    const p = project(x, z); sprite(ctx, props, table, p.x, p.y, p.scale * 1.25);
  }
  // Draw a top-down painted track as a perspective plane, not an image stretched over the wall.
  const slices = Math.max(260, Math.ceil(width * .65)), nearZ = .3, farZ = 3.4;
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  for (let i = 0; i < slices; i++) {
    const z0 = farZ - (farZ - nearZ) * i / slices, z1 = farZ - (farZ - nearZ) * (i + 1) / slices;
    const p0 = project(0, z0), p1 = project(0, z1), w = (p0.scale + p1.scale) * 1.30;
    if (p1.y < 0 || p0.y > height || p1.y <= p0.y) continue;
    ctx.drawImage(track, 0, i * track.naturalHeight / slices, track.naturalWidth, track.naturalHeight / slices + .15,
      width / 2 - w / 2, p0.y, w, p1.y - p0.y + .35);
  }
  const dj = project(0, 1.9), ball = { x: dj.x, y: dj.y - dj.scale * .86 };
  const radius = width * .036;
  if (ball.y - radius < height) {
    ctx.strokeStyle = '#273342'; ctx.lineWidth = Math.max(1, width * .003);
    ctx.beginPath(); ctx.moveTo(ball.x, ball.y - width * .65); ctx.lineTo(ball.x, ball.y - radius); ctx.stroke();
    if (!reduced) {
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      for (let j = 0; j < 3; j++) {
        const end = project(Math.sin(t * .55 + j * 2.1) * 1.05, 1.9 + Math.cos(t * .55 + j * 2.1));
        const gradient = ctx.createLinearGradient(ball.x, ball.y, end.x, end.y);
        gradient.addColorStop(0, ['#ff73c92b', '#53e9f72b', '#ffe9872b'][j]); gradient.addColorStop(1, '#ffffff00');
        ctx.fillStyle = gradient; ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(end.x - width * .10, end.y); ctx.lineTo(end.x + width * .10, end.y); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    sprite(ctx, props, cell(props, 2, 2, 1, 1), ball.x, ball.y + radius, radius * 2);
    ctx.save(); ctx.beginPath(); ctx.arc(ball.x, ball.y, radius * .87, 0, Math.PI * 2); ctx.clip();
    for (let i = 0; i < 12; i++) {
      const a = t * .9 + i * 2.399, x = ball.x + Math.sin(a) * radius * .8, y = ball.y + ((i % 4) / 3 - .5) * radius * 1.3;
      ctx.globalAlpha = .18 + .5 * Math.max(0, Math.cos(a)); ctx.fillStyle = ['#fff8b9', '#96faff', '#ff9fdf'][i % 3];
      ctx.fillRect(x, y, radius * .21, radius * .15);
    }
    ctx.restore();
  }
  const people = Array.from({ length: 4 }, (_, i) => {
    const a = t * .32 + i * Math.PI / 2;
    return { i, a, z: 1.85 + Math.sin(a) * 1.14, x: Math.cos(a) * .98 };
  }).sort((a, b) => b.z - a.z);
  const drawPerson = p => {
    const at = project(p.x, p.z), pose = reduced ? 0 : Math.floor(t * 3.5 + p.i * .5) % 2;
    if (at.y > height + width * .2) return;
    sprite(ctx, skaters, cell(skaters, 4, 2, p.i, pose), at.x, at.y, at.scale * .27, Math.sin(p.a) > 0);
  };
  people.filter(p => p.z >= 1.9).forEach(drawPerson);
  sprite(ctx, props, cell(props, 2, 2, reduced || Math.floor(t * 1.6) % 2 === 0 ? 1 : 0, reduced || Math.floor(t * 1.6) % 2 === 0 ? 0 : 1), dj.x, dj.y, dj.scale * .78);
  people.filter(p => p.z < 1.9).forEach(drawPerson);
  // One painted machine-and-carpet asset: preserve the machines, extend only its attached carpet.
  const ground = floorY + shiftY, fw = width * 1.04, fh = fw * front.naturalHeight / front.naturalWidth;
  const surface = .58, y = ground - fh * surface;
  if (y < height) {
    const cut = Math.round(front.naturalHeight * surface), topH = fh * surface;
    ctx.drawImage(front, 0, 0, front.naturalWidth, cut, (width - fw) / 2, y, fw, topH);
    ctx.drawImage(front, 0, cut, front.naturalWidth, front.naturalHeight - cut, (width - fw) / 2, ground - .5, fw, Math.max(fh - topH, height - ground + 1));
    if (!reduced) {
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      for (const screen of [{ x: .045, y: .32, w: .14, h: .10 }, { x: .27, y: .32, w: .14, h: .10 }]) {
        const sx = (width - fw) / 2 + screen.x * fw, sy = y + screen.y * fh, sw = screen.w * fw, sh = screen.h * fh;
        ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip();
        ctx.globalAlpha = .12; ctx.fillStyle = '#83f7ff';
        ctx.fillRect(sx + ((t * .3) % 1) * sw, sy, sw * .18, sh);
        for (let j = 0; j < 5; j++) {
          ctx.globalAlpha = .3; ctx.fillStyle = j % 2 ? '#fff99b' : '#85f8ff';
          const px = sx + ((j * .19 + t * .075) % 1) * sw, py = sy + ((j * .23 + t * .12) % 1) * sh;
          ctx.fillRect(px, py, width * .004, width * .004);
        }
        ctx.restore();
      }
      for (let i = 0; i < 8; i++) {
        ctx.globalAlpha = .12 + .18 * Math.max(0, Math.sin(t * 2 + i));
        ctx.fillStyle = ['#7af7ff', '#fff48a', '#ff86e5'][i % 3];
        ctx.beginPath(); ctx.arc(width * (.045 + i * .125), ground - width * .10, width * .007, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }
  ctx.restore();
}
