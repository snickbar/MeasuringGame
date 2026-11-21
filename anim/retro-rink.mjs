import { drawRunnerGame } from './retro-runner.mjs';
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
function arcadeGames(ctx, game, left, top, width, height, time) {
  const screens = [{ x: .070, y: .333, w: .135, h: .080 }, { x: .291, y: .335, w: .128, h: .078 }];
  screens.forEach((s, index) => {
    const x = left + s.x * width, y = top + s.y * height, w = s.w * width, h = s.h * height;
    ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.max(2, w * .06)); ctx.clip();
    ctx.fillStyle = '#071d48'; ctx.fillRect(x, y, w, h); ctx.imageSmoothingEnabled = false;
    if (index === 1 && game) {
      drawRunnerGame(ctx, { x, y, width: w, height: h, time, sprites: game });
    } else {
      const pixel = w / 29, stride = Math.floor(time * 4) % 2;
      const shape = stride ? [14, 31, 21, 17, 10] : [14, 31, 21, 17, 17];
      for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
        const ax = x + w * (.10 + col * .29 + .055 * Math.sin(time * 1.8)), ay = y + h * (.12 + row * .24);
        ctx.fillStyle = row ? '#38daff' : '#b6ed37';
        shape.forEach((bits, py) => { for (let px = 0; px < 5; px++) if (bits & (1 << px)) ctx.fillRect(ax + px * pixel, ay + py * pixel, pixel + .1, pixel + .1); });
      }
      const shipX = x + w * (.50 + .25 * Math.sin(time * 1.15)), shipY = y + h * .87;
      ctx.fillStyle = '#edf8ff'; ctx.fillRect(shipX - pixel * 2, shipY, pixel * 5, pixel * 2); ctx.fillRect(shipX, shipY - pixel * 2, pixel, pixel * 2);
      ctx.fillStyle = '#ffef61'; ctx.fillRect(shipX, y + h * (.80 - (time * .95 % 1) * .77), pixel, pixel * 2);
    }
    ctx.globalAlpha = .10; ctx.fillStyle = '#001029';
    for (let sy = y; sy < y + h; sy += 3) ctx.fillRect(x, sy, w, 1);
    ctx.restore();
  });
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
  const front = images[art.front], track = images[art.track], back = images[art.back], props = images[art.props], skaters = images[art.skaters], tableImage = images[art.table];
  if (!front || !track || !back || !props || !skaters || !tableImage) return;
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
  const roof = images[art.roof];
  if (roof) {
    const rw = width * 1.06, rh = rw * roof.naturalHeight / roof.naturalWidth;
    const bottom = ceilingTop + width * .08;
    if (bottom > 0 && bottom - rh < height) ctx.drawImage(roof, (width - rw) / 2, bottom - rh, rw, rh);
  }
  if (far.y - bh < height) {
    ctx.save(); ctx.filter = dark ? 'brightness(72%) blur(.4px)' : 'blur(.4px)';
    // End the wall at the stools, before the painted checker strip. The shared projected floor starts here.
    const wallRows = back.naturalHeight * .88;
    ctx.drawImage(back, 0, 0, back.naturalWidth, wallRows, (width - bw) / 2, far.y - bh * .88, bw, bh * .88); ctx.restore();
  }
  const woodTop = project(0, 4.25).y;
  if (woodTop < height) {
    const wood = ctx.createLinearGradient(0, woodTop, 0, Math.max(woodTop + 1, height));
    wood.addColorStop(0, '#d48a39'); wood.addColorStop(1, '#ebaa56');
    ctx.fillStyle = wood; ctx.fillRect(0, woodTop, width, height - woodTop);
    ctx.strokeStyle = 'rgba(102,49,17,.16)'; ctx.lineWidth = .65;
    for (let z = 4.25; z > -.05; z -= .14) {
      const y = project(0, z).y; if (y > height) continue;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
  }
  // Each checker is projected separately: squares shrink into the distance, with no mirrored filler strips.
  for (let z = 8.8; z > 4.15; z -= .45) for (let x = -5.4; x < 5.4; x += .45) {
    const points = [project(x, z), project(x + .45, z), project(x + .45, z - .45), project(x, z - .45)];
    if (points[0].y > height && points[3].y > height) continue;
    ctx.fillStyle = (Math.round((x + 5.4) / .45) + Math.round(z / .45)) % 2 ? '#e9c89e' : '#ba665b';
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.fill();
  }
  // Exactly two rows of two long bench tables, sorted far to near.
  const table = cell(tableImage, 1, 1, 0, 0);
  for (const z of [7.4, 4.9]) for (const x of [-.96, .96]) {
    const p = project(x, z); sprite(ctx, tableImage, table, p.x, p.y, p.scale * 1.63);
  }
  // Draw a top-down painted track as a perspective plane, not an image stretched over the wall.
  const slices = Math.max(300, Math.ceil(width * .7)), nearZ = .1, farZ = 4.2;
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  for (let i = 0; i < slices; i++) {
    const z0 = farZ - (farZ - nearZ) * i / slices, z1 = farZ - (farZ - nearZ) * (i + 1) / slices;
    const p0 = project(0, z0), p1 = project(0, z1), w = (p0.scale + p1.scale) * 1.65;
    if (p1.y < 0 || p0.y > height || p1.y <= p0.y) continue;
    ctx.drawImage(track, 0, i * track.naturalHeight / slices, track.naturalWidth, track.naturalHeight / slices + .15,
      width / 2 - w / 2, p0.y, w, p1.y - p0.y + .35);
  }
  // Low solid guard walls follow the same floor projection. The far middle is the entrance.
  const walls = [];
  for (let i = 0; i < 64; i++) {
    const a = i / 64 * Math.PI * 2, b = (i + 1) / 64 * Math.PI * 2, mid = (a + b) / 2;
    if (Math.abs(mid - Math.PI / 2) < .17) continue;
    walls.push({ a, b, z: 2.15 + Math.sin(mid) * 1.75 });
  }
  const wall = segment => {
    const points = [segment.a, segment.b].map(a => project(Math.cos(a) * 1.52, 2.15 + Math.sin(a) * 1.75));
    const [a, b] = points, h0 = a.scale * .15, h1 = b.scale * .15;
    if (Math.min(a.y - h0, b.y - h1) > height || Math.max(a.y, b.y) < 0) return;
    ctx.fillStyle = segment.z > 2.15 ? '#e5dfc3' : '#c8d8cf'; ctx.strokeStyle = '#385b56'; ctx.lineWidth = Math.max(.65, width * .0015);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(b.x, b.y - h1); ctx.lineTo(a.x, a.y - h0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#cf4383'; ctx.lineWidth = Math.max(2, width * .007); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a.x, a.y - h0); ctx.lineTo(b.x, b.y - h1); ctx.stroke();
  };
  walls.filter(w => w.z >= 2.15).sort((a, b) => b.z - a.z).forEach(wall);
  const dj = project(0, 2.15), ball = { x: dj.x, y: dj.y - dj.scale * .78 };
  const radius = width * .036;
  if (ball.y - radius < height) {
    ctx.strokeStyle = '#273342'; ctx.lineWidth = Math.max(1, width * .003);
    ctx.beginPath(); ctx.moveTo(ball.x, ball.y - width * .65); ctx.lineTo(ball.x, ball.y - radius); ctx.stroke();
    if (!reduced) {
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      for (let j = 0; j < 3; j++) {
        const end = project(Math.sin(t * .55 + j * 2.1) * 1.30, 2.15 + Math.cos(t * .55 + j * 2.1) * 1.45);
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
    return { i, a, z: 2.15 + Math.sin(a) * 1.45, x: Math.cos(a) * 1.25 };
  }).sort((a, b) => b.z - a.z);
  const drawPerson = p => {
    const at = project(p.x, p.z), pose = reduced ? 1 : Math.floor(t * 5 + p.i) % 4;
    if (at.y > height + width * .2) return;
    // Keep a common pixel scale across all four leg poses: a narrow coasting stance must not enlarge the head.
    const bounds = cell(skaters, 4, 4, p.i, pose);
    const widest = Math.max(...[0, 1, 2, 3].map(row => cell(skaters, 4, 4, p.i, row)[2]));
    const scale = at.scale * .32 / widest, flip = Math.sin(p.a) > 0;
    const centerOffset = (bounds[0] - (p.i + .5) * skaters.naturalWidth / 4 + bounds[2] / 2) * scale;
    sprite(ctx, skaters, bounds, at.x + centerOffset * (flip ? -1 : 1), at.y, bounds[2] * scale, flip);
  };
  people.filter(p => p.z >= 2.15).forEach(drawPerson);
  sprite(ctx, props, cell(props, 2, 2, reduced || Math.floor(t * 1.6) % 2 === 0 ? 1 : 0, reduced || Math.floor(t * 1.6) % 2 === 0 ? 0 : 1), dj.x, dj.y, dj.scale * .53);
  people.filter(p => p.z < 2.15).forEach(drawPerson);
  walls.filter(w => w.z < 2.15).sort((a, b) => b.z - a.z).forEach(wall);
  // One painted machine-and-carpet asset: preserve the machines, extend only its attached carpet.
  const ground = floorY + shiftY, fw = width * 1.04, fh = fw * front.naturalHeight / front.naturalWidth;
  const surface = .58, y = ground - fh * surface;
  if (y < height) {
    const cut = Math.round(front.naturalHeight * surface), topH = fh * surface;
    ctx.drawImage(front, 0, 0, front.naturalWidth, cut, (width - fw) / 2, y, fw, topH);
    ctx.drawImage(front, 0, cut, front.naturalWidth, front.naturalHeight - cut, (width - fw) / 2, ground - .5, fw, Math.max(fh - topH, height - ground + 1));
    arcadeGames(ctx, images[art.game], (width - fw) / 2, y, fw, fh, t);
    if (!reduced) {
      ctx.save(); ctx.globalCompositeOperation = 'screen';
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
