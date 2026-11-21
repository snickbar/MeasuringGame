// Shared by the Rec Room TV and rink cabinet: characters swap poses, but level geometry never morphs.
export const RUNNER_GAME = Object.freeze({ width: 192, height: 160, heroX: 96, groundY: 125, pitWidth: 48, spacing: 260, speed: 54 });
export function runnerState(time) {
  const { heroX, pitWidth, spacing, speed } = RUNNER_GAME;
  const scroll = Math.max(0, time) * speed, first = 184 - scroll % spacing;
  const pits = [first - spacing, first, first + spacing];
  const nearest = pits.reduce((a, b) => Math.abs(a - heroX) < Math.abs(b - heroX) ? a : b);
  const phase = (heroX + pitWidth / 2 + 16 - nearest) / (pitWidth + 32);
  const airborne = phase > 0 && phase < 1;
  const jump = airborne ? 4 * phase * (1 - phase) * 52 : 0;
  const pose = airborne ? phase < .10 ? 2 : phase > .86 ? 4 : 3 : phase >= 1 && phase < 1.09 ? 4 : [0, 5, 1, 5][Math.floor(time * 7) % 4];
  return { heroX, pitWidth, pits, jump, pose, scroll, phase };
}
const sheets = new WeakMap();
function framesFor(image) {
  if (sheets.has(image)) return sheets.get(image);
  const w = image.naturalWidth, h = image.naturalHeight, canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, w, h).data, result = [];
  for (let cell = 0; cell < 8; cell++) {
    const sx = Math.round(cell % 4 * w / 4), sy = Math.round(Math.floor(cell / 4) * h / 2);
    const ex = Math.round((cell % 4 + 1) * w / 4), ey = Math.round((Math.floor(cell / 4) + 1) * h / 2);
    let l = ex, r = sx, top = ey, bottom = sy;
    for (let y = sy; y < ey; y++) for (let x = sx; x < ex; x++) if (pixels[(y * w + x) * 4 + 3] > 32) {
      l = Math.min(l, x); r = Math.max(r, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    result.push([l, top, Math.max(1, r - l + 1), Math.max(1, bottom - top + 1)]);
  }
  const data = { frames: result, heroHeight: Math.max(...result.slice(0, 6).map(r => r[3])), enemyHeight: Math.max(...result.slice(6).map(r => r[3])) };
  sheets.set(image, data); return data;
}
function actor(ctx, image, frame, x, feet, scale) {
  const width = frame[2] * scale, height = frame[3] * scale;
  ctx.drawImage(image, ...frame, x - width / 2, feet - height, width, height);
}
export function drawRunnerGame(ctx, { x = 0, y = 0, width, height, time = 0, sprites }) {
  const state = runnerState(time), config = RUNNER_GAME;
  const scale = Math.min(width / config.width, height / config.height);
  const ox = x + (width - config.width * scale) / 2, oy = y + (height - config.height * scale) / 2;
  const left = (x - ox) / scale, right = (x + width - ox) / scale, bottom = (y + height - oy) / scale;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, width, height); ctx.clip();
  ctx.fillStyle = '#27b0ea'; ctx.fillRect(x, y, width, height);
  ctx.translate(ox, oy); ctx.scale(scale, scale); ctx.imageSmoothingEnabled = false;
  // Distant clouds travel more slowly than the ground.
  ctx.fillStyle = '#e5f8ff';
  for (let i = -1; i < 4; i++) {
    const cx = i * 92 + 28 - state.scroll * .15 % 92, cy = 24 + (i % 2 === 0 ? 14 : 0);
    ctx.fillRect(cx, cy, 25, 6); ctx.fillRect(cx + 5, cy - 5, 14, 5);
  }
  ctx.fillStyle = '#9b6550'; ctx.fillRect(left, config.groundY, right - left, bottom - config.groundY);
  ctx.fillStyle = '#60cd37'; ctx.fillRect(left, config.groundY, right - left, 7);
  ctx.fillStyle = '#304123'; ctx.fillRect(left, config.groundY + 7, right - left, 3);
  const tile = 24, start = Math.floor((left + state.scroll) / tile) * tile - state.scroll;
  for (let tx = start; tx < right; tx += tile) {
    ctx.fillStyle = '#754736'; ctx.fillRect(tx, config.groundY + 10, 1, bottom - config.groundY);
    ctx.fillStyle = '#c18e67'; ctx.fillRect(tx + 5, config.groundY + 15, 5, 3); ctx.fillRect(tx + 14, config.groundY + 27, 4, 3);
    ctx.fillStyle = '#479b2c'; ctx.fillRect(tx + 4, config.groundY + 5, 5, 3);
  }
  const art = sprites && framesFor(sprites);
  for (const center of state.pits) {
    const px = center - config.pitWidth / 2;
    if (px > right || px + config.pitWidth < left) continue;
    ctx.fillStyle = '#0d2547'; ctx.fillRect(px, config.groundY, config.pitWidth, bottom - config.groundY + 1);
    ctx.fillStyle = '#123554'; ctx.fillRect(px + 2, config.groundY + 15, config.pitWidth - 4, bottom - config.groundY);
    if (art) actor(ctx, sprites, art.frames[6 + Math.floor(time * 3) % 2], center, config.groundY + 22, 18 / art.enemyHeight);
  }
  if (art) actor(ctx, sprites, art.frames[state.pose], state.heroX, config.groundY - state.jump, 32 / art.heroHeight);
  ctx.restore();
  return state;
}
