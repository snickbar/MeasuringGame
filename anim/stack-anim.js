// The answer animation: a big object stands on the right, and copies of the small object hop in
// on the left and stack up end to end until they reach the same height. If the count is huge the
// camera zooms in on the stack, follows it up, then zooms back out. The last copy is cut off when
// the answer is not a whole number.
//
// How to use it:
//   const anim = createStackAnimation(containerElement, { imageUrl: (o) => o.image });
//   const scene = await anim.prepare(unitObject, targetObject);   // loads the two pictures
//   anim.start(scene, { startAt: performance.now(), onDone() { ... } });
//
// Everything is drawn from a time, so any moment can be drawn on its own (scene.render(t)). That is
// how a player who joins or reloads partway through jumps straight to the right place.
//
// An object is { id, name, plural, mm, image }. Which way each picture faces lives in VISUAL below.

// ---- How each picture is drawn ----
// turn180 / mirror: set with the orientation picker so the picture faces the right way when the
// object stands up on the left. noMirror: the picture has writing, so it is never mirrored.
// axis 'height': the picture already has the object's length running up and down (a door, a
// tower), so it is not turned. upright: stands upright but is stored lying down (Big Ben).
const VISUAL = {
  'grain-of-sand': { turn180: true, mirror: true },
  'poppy-seed': { turn180: false, mirror: false },
  'sesame-seed': { turn180: false, mirror: false },
  'ant': { turn180: true, mirror: true },
  'grain-of-rice': { turn180: true, mirror: true },
  'ladybug': { turn180: false, mirror: false },
  'human-eyelash': { turn180: false, mirror: false },
  'honeybee': { turn180: false, mirror: false },
  'die': { turn180: false, mirror: false },
  'quarter': { turn180: false, mirror: false, noMirror: true },
  'paperclip': { turn180: false, mirror: false },
  'chicken-nugget': { turn180: true, mirror: true },
  'cockroach': { turn180: false, mirror: false },
  'ping-pong-ball': { turn180: false, mirror: false },
  'golf-ball': { turn180: false, mirror: false },
  'cork': { turn180: false, mirror: false },
  'clown-nose': { turn180: false, mirror: false },
  'aa-battery': { turn180: false, mirror: false },
  'domino': { turn180: false, mirror: false },
  'rubiks-cube': { turn180: false, mirror: false },
  'tennis-ball': { turn180: false, mirror: false },
  'baseball': { turn180: false, mirror: false },
  'hockey-puck': { turn180: false, mirror: false },
  'credit-card': { turn180: false, mirror: false, noMirror: true },
  'playing-card': { turn180: false, mirror: false, noMirror: true, axis: 'height' },
  'rubber-duck': { turn180: true, mirror: true },
  'donut': { turn180: false, mirror: false },
  'toilet-paper-square': { turn180: false, mirror: false },
  'dvd': { turn180: false, mirror: false },
  'index-card': { turn180: false, mirror: false },
  'smartphone': { turn180: false, mirror: false, axis: 'height' },
  'hot-dog': { turn180: false, mirror: false, axis: 'height' },
  'pencil': { turn180: false, mirror: false, axis: 'height' },
  'toothbrush': { turn180: true, mirror: true },
  'banana': { turn180: true, mirror: true },
  'house-brick': { turn180: false, mirror: false },
  'bowling-ball': { turn180: false, mirror: false },
  'soccer-ball': { turn180: true, mirror: true },
  'basketball': { turn180: true, mirror: true },
  'football': { turn180: false, mirror: false },
  'sheet-of-paper-a4': { turn180: true, mirror: true, axis: 'height' },
  'vinyl-record': { turn180: false, mirror: false },
  'foot-long-sub': { turn180: true, mirror: false, axis: 'height' },
  'bowling-pin': { turn180: false, mirror: false },
  'rubber-chicken': { turn180: true, mirror: true },
  'dachshund': { turn180: false, mirror: false },
  'trumpet': { turn180: true, mirror: true },
  'violin': { turn180: false, mirror: false, axis: 'height' },
  'long-stem-rose': { turn180: false, mirror: false, axis: 'height' },
  'baguette': { turn180: false, mirror: false, axis: 'height' },
  'baseball-bat': { turn180: true, mirror: true },
  'traffic-cone': { turn180: false, mirror: false, axis: 'height' },
  'domestic-cat': { turn180: true, mirror: true },
  'skateboard': { turn180: false, mirror: false },
  'umbrella': { turn180: true, mirror: true },
  'acoustic-guitar': { turn180: false, mirror: false },
  'capybara': { turn180: true, mirror: true },
  'broom': { turn180: true, mirror: true },
  'pool-noodle': { turn180: false, mirror: false, axis: 'height' },
  'adult-human': { turn180: false, mirror: false, axis: 'height' },
  'yoga-mat': { turn180: false, mirror: false },
  'bicycle': { turn180: false, mirror: false },
  'surfboard': { turn180: true, mirror: true },
  'door': { turn180: false, mirror: false, axis: 'height' },
  'queen-size-bed': { turn180: false, mirror: false, axis: 'height' },
  'ostrich': { turn180: false, mirror: true, axis: 'height' },
  'polar-bear': { turn180: true, mirror: true },
  'komodo-dragon': { turn180: true, mirror: true },
  'grand-piano': { turn180: true, mirror: true },
  'alligator': { turn180: true, mirror: true },
  'moai': { turn180: false, mirror: true, axis: 'height' },
  'saltwater-crocodile': { turn180: true, mirror: true },
  'great-white-shark': { turn180: false, mirror: false },
  'car': { turn180: false, mirror: false },
  'canoe': { turn180: false, mirror: false },
  'green-anaconda': { turn180: true, mirror: true },
  'minivan': { turn180: true, mirror: true },
  'giraffe': { turn180: false, mirror: true, axis: 'height' },
  't-rex': { turn180: false, mirror: true, axis: 'height' },
  'shipping-container': { turn180: false, mirror: false },
  'elephant': { turn180: true, mirror: true },
  'killer-whale': { turn180: true, mirror: true },
  'fire-truck': { turn180: true, mirror: true },
  'palm-tree': { turn180: false, mirror: false, axis: 'height' },
  'double-decker-bus': { turn180: true, mirror: true },
  'school-bus': { turn180: true, mirror: true },
  'telephone-pole': { turn180: false, mirror: false, axis: 'height' },
  'giant-squid': { turn180: true, mirror: true },
  'fighter-jet': { turn180: true, mirror: true },
  'semi-truck': { turn180: true, mirror: true },
  'blue-whale': { turn180: true, mirror: true },
  'basketball-court': { turn180: false, mirror: false },
  'stonehenge': { turn180: false, mirror: false },
  'space-shuttle': { turn180: true, mirror: true },
  'boeing-737': { turn180: false, mirror: false },
  'statue-of-liberty': { turn180: false, mirror: false, axis: 'height' },
  'olympic-pool': { turn180: false, mirror: false, axis: 'height' },
  'leaning-tower-of-pisa': { turn180: false, mirror: false, axis: 'height' },
  'blimp': { turn180: true, mirror: true },
  'big-ben': { turn180: false, mirror: false, noMirror: true, upright: true },
  'football-field': { turn180: false, mirror: false, noMirror: true, axis: 'height' },
  'great-pyramid': { turn180: false, mirror: false, axis: 'height' },
  'washington-monument': { turn180: false, mirror: false, axis: 'height' },
  'space-needle': { turn180: false, mirror: false, axis: 'height' },
  'colosseum': { turn180: false, mirror: false },
  'gateway-arch': { turn180: false, mirror: false, axis: 'height' },
  'titanic': { turn180: true, mirror: true },
  'eiffel-tower': { turn180: false, mirror: false, axis: 'height' },
  'aircraft-carrier': { turn180: true, mirror: true },
  'empire-state-building': { turn180: false, mirror: false, axis: 'height' },
  'angel-falls': { turn180: false, mirror: false, axis: 'height' },
  'brooklyn-bridge': { turn180: false, mirror: false },
  'grand-canyon': { turn180: false, mirror: false, axis: 'height' },
  'mount-fuji': { turn180: false, mirror: false, axis: 'height' },
  'central-park': { turn180: false, mirror: false, axis: 'height' },
  'mount-everest': { turn180: false, mirror: false, axis: 'height' },
};

// How each object travels in: 'walk' bounces along, 'drive' rattles along, 'fly' lifts off and
// lands, 'sail' rocks gently, and anything else gives a few hops.
const MOTION = {
  'ant': 'walk', 'cockroach': 'walk', 'ladybug': 'walk', 'domestic-cat': 'walk', 'elephant': 'walk',
  'car': 'drive', 'bicycle': 'drive', 'double-decker-bus': 'drive',
  'boeing-737': 'fly', 'blimp': 'fly', 'honeybee': 'fly',
};

export const LIGHT_THEME = {
  stage: '#e6eefb', skyTop: '#a9cdf1', skyBottom: '#e6f2fd', ground: '#d3e5c3', cloudAlpha: 0.95,
  guide: '#6c86b4', ink: '#16223a', muted: '#55657f', warm: '#d96a06',
};
export const DARK_THEME = {
  stage: '#111b31', skyTop: '#0b1730', skyBottom: '#1c3158', ground: '#16261f', cloudAlpha: 0.28,
  guide: '#4a6490', ink: '#eaf0fb', muted: '#9db0cf', warm: '#ffa24d',
};

// ---- Layout and timing ----
const G = 14;              // side gutter inside the stage
const GAP = 26;            // space between the stack and the big object in the final view
const PAD_TOP = 18;
const PAD_BOTTOM = 52;
const H_MAX = 400;         // tallest the big object is drawn in the final view
const MIN_THICK = 14;      // thinnest a true-scale stack may be before the camera takes over
const STRIP_W = 18;        // width of the stack in the final view when it is too thin to see
const BIG_S = 1.1;         // seconds for an object that already stands upright (a door, a tower) to hop in
const BIG_WALK = 1.3;      // seconds the big object spends walking, driving or gliding in
const BIG_LEAN = 0.9;      // seconds it takes to lean back upright
const BIG_HOLD = 0.3;      // pause on the upright big object before the camera moves
const SM_WALK = 0.9;       // the same two steps for the first small object
const SM_LEAN = 0.7;
const HOP_S = 0.95;        // seconds one object spends hopping in
const ZOOM_S = 2.4;        // seconds for the final zoom out
const HOLD_S = 0.35;       // pause on the finished stack before zooming out
const FAST_TICK_MIN = 50;   // fast ticking only for answers over this many copies
const FAST_TICK_AT = 0.25;  // ...and only once this share of the stack-up has gone by
const K_MAX = 18;          // objects that hop in one by one before the stack starts to stream
const PEAK_RATE = 1500;    // fastest the stream normally goes, in objects per second
const PAN_PX = 450;        // fastest the stack may rise on screen (pixels per second) before the camera backs off
const GRASS_W = 220;       // width of one grass tile on screen
const GRASS_DIRT = 127 / 145;   // how far down the picture the dirt begins

const CLOUDS = [
  { x: 0.14, y: 0.10, s: 1.0 }, { x: 0.62, y: 0.18, s: 1.3 }, { x: 0.88, y: 0.42, s: 0.8 },
  { x: 0.30, y: 0.50, s: 1.1 }, { x: 0.72, y: 0.74, s: 0.9 }, { x: 0.10, y: 0.88, s: 0.7 },
];

// The hop: where the object is, as a share of the way in from the left, and how it squashes on landing.
const HOPS = [
  { o: 0,    x: 1,    y: -26, e: 'in' },
  { o: 0.16, x: 0.80, y: 0,   e: 'out' },
  { o: 0.30, x: 0.64, y: -34, e: 'in' },
  { o: 0.44, x: 0.48, y: 0,   e: 'out' },
  { o: 0.57, x: 0.32, y: -26, e: 'in' },
  { o: 0.69, x: 0.18, y: 0,   e: 'out' },
  { o: 0.80, x: 0.07, y: -16, e: 'in' },
  { o: 0.90, x: 0,    y: 0,   e: 'out', sx: 1.06, sy: 0.92 },
  { o: 1,    x: 0,    y: 0,   e: 'lin', sx: 1, sy: 1 },
];

function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
function smooth(x) { return x * x * (3 - 2 * x); }
function easeBy(kind, x) {
  if (kind === 'in') return x * x;
  if (kind === 'out') return 1 - (1 - x) * (1 - x);
  return x;
}
function hopAt(f) {
  let k = 0;
  while (k < HOPS.length - 2 && f >= HOPS[k + 1].o) k++;
  const a = HOPS[k];
  const b = HOPS[k + 1];
  const e = easeBy(a.e, clamp((f - a.o) / (b.o - a.o), 0, 1));
  const asx = a.sx == null ? 1 : a.sx;
  const asy = a.sy == null ? 1 : a.sy;
  const bsx = b.sx == null ? 1 : b.sx;
  const bsy = b.sy == null ? 1 : b.sy;
  return {
    x: a.x + (b.x - a.x) * e,
    y: a.y + (b.y - a.y) * e,
    sx: asx + (bsx - asx) * e,
    sy: asy + (bsy - asy) * e,
  };
}
// Lift off the floor, in pixels, while travelling in. u runs 0 to 1 and it settles to 0 at the end.
function travelLift(kind, u, thick, dist) {
  const env = clamp((1 - u) * 5, 0, 1);
  if (kind === 'walk') {
    const amp = clamp(thick * 0.05 + 2, 3, 9);
    const cycles = clamp(Math.round(dist / (thick + 30) * 1.5), 3, 14);
    return amp * Math.abs(Math.sin(Math.PI * cycles * u)) * env;
  }
  if (kind === 'drive') return 1.3 * Math.abs(Math.sin(Math.PI * 30 * u)) * env;
  if (kind === 'fly') return 12 * Math.sin(Math.PI * u) * (0.8 + 0.2 * Math.sin(Math.PI * 8 * u));
  if (kind === 'sail') return 2 * Math.abs(Math.sin(Math.PI * 4 * u)) * env;
  return 10 * Math.abs(Math.sin(Math.PI * 3 * u)) * env;
}

// How many objects long, written the way the answer is shown (more decimals for small answers).
export function decimalsFor(R) { return R >= 100 ? 0 : (R >= 10 ? 1 : 2); }
export function formatCount(v, R) { return v.toLocaleString('en-US', { maximumFractionDigits: decimalsFor(R) }); }

function visualOf(o) {
  const v = VISUAL[o.id] || {};
  return {
    turn180: !!v.turn180, mirror: !!v.mirror, noMirror: !!v.noMirror, leanFlip: !!v.leanFlip,
    axisHeight: v.axis === 'height', upright: !!v.upright,
  };
}

// Which way an object leans up from lying down. Small ones on the left lean back to the left
// and the big one on the right leans back to the right (that is what the saved settings give).
function leanOf(o, extraMirror) {
  const vis = visualOf(o);
  if (vis.axisHeight || vis.upright) return null;   // a door or a tower already stands upright
  const mirrored = !vis.noMirror && vis.mirror !== extraMirror;
  const turned = vis.turn180 !== (vis.noMirror && extraMirror && !vis.axisHeight && !vis.upright);
  let cw = turned !== mirrored;
  if (vis.leanFlip) cw = !cw;
  return cw ? 'cw' : 'ccw';
}

// The timeline (in seconds) depends only on the two objects and how many times the small one fits,
// never on the screen size. So the host can work out how long the animation lasts, and every
// player's screen plays it on the same clock.
function timelineFor(R, bigLean, smLean) {
    const starts = [];
    const tLeanStart = bigLean ? BIG_WALK : BIG_S;
    const tLeanEnd = bigLean ? BIG_WALK + BIG_LEAN : BIG_S;
    const tZ0 = tLeanEnd + BIG_HOLD;
    const tZ1 = tZ0 + 0.75;
    let tt = tZ1 - 0.1;
    const whole = Math.floor(R + 1e-9);
    const nHop = Math.min(K_MAX, whole);
    const durs = [];
    let gapLast = 0.07;
    for (let i = 0; i < nHop; i++) {
      starts.push(tt);
      if (i === 0 && smLean) {
        // The first object comes in like the big one: walks in, then leans up.
        durs.push(SM_WALK + SM_LEAN);
        tt += SM_WALK + SM_LEAN - 0.3;
        continue;
      }
      durs.push(Math.max(0.45, HOP_S * Math.pow(0.93, i)));
      gapLast = Math.max(0.07, 0.36 * Math.pow(0.86, i));
      tt += gapLast;
    }
    const lastLand = starts[nHop - 1] + durs[nHop - 1];

    let kk = 0, streamCap = 1;
    const G_TABLE = [0, 1];
    // The stream starts the moment the last hop lands, at the pace the landings had reached.
    const tB0 = lastLand;
    const M = Math.max(0, R - nHop);
    const rate0 = 1 / gapLast;
    let TB = Math.min(10, 2 + 1.6 * Math.log10(Math.max(1, R / nHop)));
    // The stream's pace: starts at the pace of the hops, speeds up smoothly (capped), then
    // eases off to a stop over the last quarter so the camera never halts or lurches.
    const FADE_AT = 0.75;
    const fadeW = (x) => (x <= FADE_AT ? 1 : 0.5 + 0.5 * Math.cos(Math.PI * (x - FADE_AT) / (1 - FADE_AT)));
    const STEPS = 400;
    const integral = (k, cap) => {
      let sum = 0;
      for (let i = 0; i < STEPS; i++) {
        const x = (i + 0.5) / STEPS;
        sum += Math.min(Math.exp(k * x), cap) * fadeW(x);
      }
      return sum / STEPS;
    };
    const I0 = integral(0, 1);
    if (M > 0 && M / (TB * rate0) > I0) {
      const need = M / (TB * rate0);
      const cap = Math.max(PEAK_RATE / rate0, need * 1.6);
      let lo = 0, hi = 40;
      for (let it = 0; it < 60; it++) {
        const mid = (lo + hi) / 2;
        if (integral(mid, cap) < need) lo = mid; else hi = mid;
      }
      kk = (lo + hi) / 2;
      streamCap = cap;
    } else {
      TB = Math.max(0.3, M / (rate0 * I0));
    }
    // Running total of the pace, as a table to read the count from.
    G_TABLE.length = 0;
    let acc = 0;
    G_TABLE.push(0);
    for (let i = 0; i < STEPS; i++) {
      const x = (i + 0.5) / STEPS;
      acc += Math.min(Math.exp(kk * x), streamCap) * fadeW(x);
      G_TABLE.push(acc);
    }
    for (let i = 0; i <= STEPS; i++) G_TABLE[i] /= acc;
    const tB1 = tB0 + TB;
    const tHoldEnd = tB1 + HOLD_S;
    const tEnd = tHoldEnd + ZOOM_S;

  return { starts, durs, nHop, gapLast, tLeanStart, tLeanEnd, tZ0, tZ1, tB0, tB1, tHoldEnd, tEnd, TB, M, G_TABLE };
}

export function animationDuration(unitIn, targetIn) {
  let unit = unitIn;
  let target = targetIn;
  if (unit.mm > target.mm) { [unit, target] = [target, unit]; }
  const bigLean = leanOf(target, true);
  const smLean = leanOf(unit, false);
  return timelineFor(target.mm / unit.mm, bigLean, smLean).tEnd;
}

export function createStackAnimation(container, options = {}) {
  const theme = { ...LIGHT_THEME, ...(options.theme || {}) };
  const imageUrl = options.imageUrl || ((o) => o.image);
  const reduceMotion = options.reduceMotion != null
    ? options.reduceMotion
    : !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const flipFacing = !!options.flipFacing;   // swaps which of the two pictures is mirrored

  // ---- The stage: a canvas, with the running count under the floor ----
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.background = theme.stage;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block;';
  const ctx = canvas.getContext('2d');
  const tally = document.createElement('div');
  tally.style.cssText = 'position:absolute;display:flex;align-items:baseline;gap:6px;white-space:nowrap;font-variant-numeric:tabular-nums;';
  const nEl = document.createElement('span');
  nEl.style.cssText = 'font-weight:700;font-size:26px;line-height:1;';
  const uEl = document.createElement('span');
  uEl.style.cssText = 'font-weight:700;';
  tally.append(nEl, uEl);
  container.append(canvas, tally);

  let raf = 0;
  let runId = 0;
  let destroyed = false;

  const sceneryBase = options.sceneryBase || new URL('.', import.meta.url).href;
  const grassImg = new Image();
  grassImg.src = sceneryBase + 'grass.png';
  const cloudImg = new Image();
  cloudImg.src = sceneryBase + 'cloud.png';

  // ---- Pictures: each is turned so the object's length runs up and down ----
  const pics = new Map();
  function loadPicture(o) {
    if (pics.has(o.id)) return pics.get(o.id).promise;
    const entry = {};
    entry.promise = new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => {
        const vis = visualOf(o);
        if (vis.axisHeight) {
          entry.base = im; entry.baseW = im.naturalWidth; entry.baseH = im.naturalHeight;
        } else {
          const c = document.createElement('canvas');
          c.width = im.naturalHeight;
          c.height = im.naturalWidth;
          const x = c.getContext('2d');
          x.translate(0, c.height);
          x.rotate(-Math.PI / 2);
          x.drawImage(im, 0, 0);
          entry.base = c; entry.baseW = c.width; entry.baseH = c.height;
        }
        entry.aspect = entry.baseW / entry.baseH;   // thickness divided by length
        resolve(entry);
      };
      im.onerror = () => reject(new Error('Could not load the picture for ' + o.id));
      im.src = imageUrl(o);
    });
    pics.set(o.id, entry);
    return entry.promise;
  }

  // The picture with its saved orientation, plus an optional extra mirror.
  const spriteCache = new Map();
  function spriteFor(o, extraMirror) {
    const key = o.id + (extraMirror ? ':m' : '');
    if (spriteCache.has(key)) return spriteCache.get(key);
    const p = pics.get(o.id);
    const vis = visualOf(o);
    const c = document.createElement('canvas');
    c.width = p.baseW;
    c.height = p.baseH;
    const x = c.getContext('2d');
    x.translate(p.baseW / 2, p.baseH / 2);
    // Writing is never mirrored: for those objects the second role is a half turn instead.
    const turned = vis.turn180 !== (vis.noMirror && extraMirror && !vis.axisHeight && !vis.upright);
    x.scale(!vis.noMirror && vis.mirror !== extraMirror ? -1 : 1, 1);
    x.rotate(turned ? Math.PI : 0);
    x.drawImage(p.base, -p.baseW / 2, -p.baseH / 2);
    spriteCache.set(key, c);
    return c;
  }
  const lyingCache = new Map();
  function lyingSprite(o, extraMirror, lean) {
    const key = o.id + (extraMirror ? ':m' : '') + lean;
    if (lyingCache.has(key)) return lyingCache.get(key);
    const up = spriteFor(o, extraMirror);
    const c = document.createElement('canvas');
    c.width = up.height;
    c.height = up.width;
    const x = c.getContext('2d');
    if (lean === 'cw') { x.translate(0, c.height); x.rotate(-Math.PI / 2); }
    else { x.translate(c.width, 0); x.rotate(Math.PI / 2); }
    x.drawImage(up, 0, 0);
    lyingCache.set(key, c);
    return c;
  }

  // Loads the two pictures and works out the whole animation for this pair at this width.
  // The container must be on screen (so it has a width) when this is called. sizing.hMax is the
  // tallest the big object may be drawn (the game passes less on short screens). sizing.minStageH is
  // the least height the stage may have (the game passes the space under the question).
  async function prepare(unitIn, targetIn, sizing = {}) {
    let unit = unitIn;
    let target = targetIn;
    if (unit.mm > target.mm) { [unit, target] = [target, unit]; }
    await Promise.all([loadPicture(unit), loadPicture(target)]);
    return buildScene(unit, target, sizing.hMax || H_MAX, sizing.minStageH || 0);
  }

  function buildScene(unit, target, hMax, minStageH) {
    const R = target.mm / unit.mm;
    const aBig = pics.get(target.id).aspect;
    const aSm = pics.get(unit.id).aspect;
    const smallSprite = spriteFor(unit, flipFacing);
    const bigSprite = spriteFor(target, !flipFacing);
    const bigLean = leanOf(target, !flipFacing);
    const smLean = leanOf(unit, flipFacing);
    const bigLying = bigLean ? lyingSprite(target, !flipFacing, bigLean) : null;
    const smLying = smLean ? lyingSprite(unit, flipFacing, smLean) : null;
    const bigKind = MOTION[target.id] || 'slide';
    const smKind = MOTION[unit.id] || 'slide';
    const { skyTop, skyBottom, ground: groundCol, cloudAlpha, guide } = theme;

    // ---- Final view: the big object at most H_MAX tall, the stack beside it ----
    const W = container.clientWidth || 360;

    let H = hMax;
    let fast = false;   // too thin to draw at true scale: the final stack is drawn as a wider strip
    for (let k = 0; k < 3; k++) {
      fast = (H / R) * aSm < MIN_THICK;
      const fit = fast
        ? (W - 2 * G - GAP - STRIP_W) / aBig
        : (W - 2 * G - GAP) / (aBig + aSm / R);
      H = Math.min(hMax, fit);
    }

    // The camera starts zoomed out on the big object, zooms in on the stack, follows it up and
    // zooms back out. Pairs that fit at true scale get a gentler zoom.
    // The stage is at least minStageH tall: when the scene is shorter than that (two round objects
    // are limited by the width), the extra height is sky above, so the floor stays at the bottom.
    const padTop = PAD_TOP + Math.max(0, (minStageH || 0) - (PAD_TOP + H + PAD_BOTTOM));
    const stageH = padTop + H + PAD_BOTTOM;
    const floorY = padTop + H;
    const bigThick = H * aBig;
    let bigX = W - G - bigThick;

    // ---- World: tile length l, stack height Hw, in the units of the close-up ----
    let l, Hw, cEnd;
    if (fast) {
      l = clamp(28 / aSm, 56, 120);
    } else {
      l = Math.max(H / R, Math.min(H / (R * 0.55), 110 / aSm));
    }
    Hw = l * R;
    cEnd = H / Hw;
    const tw = l * aSm;
    const Tw = Hw * aBig;
    const colWFinal = fast ? STRIP_W : tw * cEnd;
    // Centre the pair (stack and big object) across the stage in the final view.
    const pairW = colWFinal + GAP + bigThick;
    bigX = (W - pairW) / 2 + colWFinal + GAP;
    const colCenterX = bigX - GAP - colWFinal / 2;
    const bigLeftWorld = (colWFinal / 2 + GAP) / cEnd;
    const stripMin = fast ? STRIP_W : 0;

    const { starts, durs, nHop, gapLast, tLeanStart, tLeanEnd, tZ0, tZ1, tB0, tB1, tHoldEnd, tEnd, TB, M, G_TABLE } =
      timelineFor(R, bigLean, smLean);

    const streamG = (x) => {
      const pos = clamp(x, 0, 1) * (G_TABLE.length - 1);
      const k = Math.min(G_TABLE.length - 2, Math.floor(pos));
      return G_TABLE[k] + (G_TABLE[k + 1] - G_TABLE[k]) * (pos - k);
    };
    const streamCount = (t) => nHop + M * streamG(clamp((t - tB0) / TB, 0, 1));

    // ---- Sound cues: moments on the timeline where a sound belongs. The engine only announces
    // them (opts.onCue); the page decides what to play. ----
    const cues = [];
    cues.push({ t: 0.05, name: 'swipe', vol: 0.5, rate: 1 });                         // the big one arrives
    cues.push({ t: tZ0, name: 'swipe', vol: 0.35, rate: 1.25 });                      // camera zooms in
    for (let i = 0; i < nHop; i++) {                                                  // each hop lands
      cues.push({ t: starts[i] + durs[i], name: 'tap', vol: 0.45, rate: 0.9 + 0.5 * (i / Math.max(1, nHop - 1)) });
    }
    if (M >= 1) {                                                                     // the stream
      // Copies keep clicking one by one; the fast ticking only joins for big answers, partway through.
      const fastOn = R >= FAST_TICK_MIN;
      const fastFrom = tB0 + TB * FAST_TICK_AT;
      let tk = tB0;
      while (tk < tB1) {
        const rate = (streamCount(tk + 0.05) - streamCount(tk)) / 0.05;
        if (fastOn && tk >= fastFrom) {
          cues.push({ t: tk, name: 'tick', vol: 0.4, rate: 1 + 0.8 * ((tk - tB0) / TB) });
        } else {
          cues.push({ t: tk, name: 'tap', vol: 0.45, rate: 1.4 });
        }
        tk += 1 / Math.min(Math.max(rate, 1), 16);
      }
    }
    if (R - Math.floor(R + 1e-9) > 1e-6) cues.push({ t: tB1, name: 'cardflip', vol: 0.6, rate: 1.1 });   // the last copy gets cut
    cues.push({ t: tHoldEnd, name: 'zoomback', vol: 0.3, rate: 1 });                  // zoom back out
    cues.push({ t: tEnd, name: 'reveal', vol: 0.5, rate: 1 });                        // the answer appears
    cues.sort((p, q) => p.t - q.t);

    // Camera anchors for the climb.
    const axClimb = W * 0.42;
    const ay = stageH * 0.34;
    const floorStartY = stageH * 0.80;

    function climbTop(t) {
      // Follow the stack as it lands: average the landed count over a short window centred on t,
      // so the camera eases from the hops into the stream with no pause or jump. The window
      // narrows as the pace picks up, so the camera never gets ahead of the newest objects.
      const rate = Math.max(0, (stackCount(t + 0.15) - stackCount(t - 0.15)) / 0.3);
      const win = 0.3 * Math.min(1, (1 / gapLast) / Math.max(rate, 1e-9));
      const SAMPLES = 24;
      let sum = 0;
      let weights = 0;
      for (let k = 0; k < SAMPLES; k++) {
        const u = (k + 0.5) / SAMPLES;
        const w = 6 * u * (1 - u);
        sum += w * stackCount(t + win * (u - 0.5));
        weights += w;
      }
      return (sum / weights) * l;   // weights add up to a hair over 1, which at 100,000 objects is 100 objects off
    }
    function landedAt(t) {
      let n = 0;
      while (n < nHop && starts[n] + durs[n] <= t) n++;
      return n;
    }
    function stackCount(t) {
      if (t >= tB0) return t >= tB1 ? R : streamCount(t);
      return landedAt(t);
    }

    // The climb never rises faster than PAN_PX pixels a second on screen: when objects arrive too
    // quickly, the camera backs off (zooms out) so you can always see the newest ones arriving.
    // Worked out ahead of time, and only ever allowed to zoom out further, never back in.
    const cMin = Math.min(1, Math.max(0.01, 6 / tw));
    const C_STEP = 0.02;
    const cTable = [];
    {
      let cRun = 1;
      const tStart = tZ1;
      const tStop = Math.max(tB1, tStart);
      for (let k = 0; tStart + k * C_STEP <= tStop + C_STEP; k++) {
        const tk = tStart + k * C_STEP;
        const rate = Math.max(0, (stackCount(tk + 0.3) - stackCount(tk - 0.3)) / 0.6);
        const tgt = rate > 0 ? clamp(PAN_PX / (rate * l), cMin, 1) : 1;
        cRun = Math.min(cRun, tgt);
        cTable.push(cRun);
      }
      // The running minimum drops in little steps (each landing changes the rate), which reads as
      // stutter. Smooth it by averaging each value with the ones just ahead of it, twice over.
      // Looking only forward means the zoom can only get further out sooner, never later, so the
      // newest objects stay in view.
      const SMOOTH_N = Math.round(0.8 / C_STEP);
      let L = cTable.map(Math.log);
      for (let pass = 0; pass < 2; pass++) {
        const out = new Array(L.length);
        let run = 0;
        let hi = 0;
        for (let k = 0; k < L.length; k++) {
          const top = Math.min(L.length - 1, k + SMOOTH_N);
          while (hi <= top) { run += L[hi]; hi++; }
          if (k > 0) run -= L[k - 1];
          out[k] = run / (top - k + 1);
        }
        L = out;
      }
      for (let k = 0; k < L.length; k++) cTable[k] = Math.exp(L[k]);
    }
    function climbScale(t) {
      if (t <= tZ1) return 1;
      const x = (t - tZ1) / C_STEP;
      const k = Math.floor(x);
      if (k >= cTable.length - 1) return cTable[cTable.length - 1];
      const a = cTable[k];
      const b = cTable[k + 1];
      return Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * (x - k));
    }
    function cameraAt(t) {
      if (t < tZ0) return { c: cEnd, sx0: colCenterX, sy0: floorY };
      if (t < tZ1) {
        const u = (t - tZ0) / (tZ1 - tZ0);
        const e = 0.5 - 0.5 * Math.cos(Math.PI * u);
        return {
          c: Math.exp(Math.log(cEnd) * (1 - e)),
          sx0: colCenterX + (axClimb - colCenterX) * e,
          sy0: floorY + (floorStartY - floorY) * e,
        };
      }
      if (t < tHoldEnd) {
        const c = climbScale(t);
        return { c, sx0: axClimb, sy0: Math.max(floorStartY, ay + climbTop(t) * c) };
      }
      const u = clamp((t - tHoldEnd) / ZOOM_S, 0, 1);
      const e = 0.5 - 0.5 * Math.cos(Math.PI * u);
      const c0 = climbScale(tHoldEnd);
      const c = Math.exp(Math.log(c0) + (Math.log(cEnd) - Math.log(c0)) * e);
      const topY = ay + (padTop - ay) * e;
      return { c, sx0: axClimb + (colCenterX - axClimb) * e, sy0: topY + Hw * c };
    }

    // ---- Canvas ----
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    container.style.height = stageH + 'px';
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(stageH * dpr);
    tally.style.left = G + 'px';
    tally.style.top = (floorY + 10) + 'px';
    tally.style.fontFamily = 'inherit';
    nEl.style.color = theme.ink;
    uEl.style.color = theme.muted;
    uEl.textContent = unit.plural;
    nEl.textContent = '0';

    let shown = 0;

    // Draws the picture of time t (in seconds). dt is how long since the last frame, used only to
    // let the count under the floor catch up smoothly; leave it out to jump straight to the right count.
    function render(t, dt) {
      t = clamp(t, 0, tEnd);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, stageH);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const cam = cameraAt(t);
      const c = cam.c;
      const sx0 = cam.sx0;
      const sy0 = cam.sy0;
      // A stack too thin to see is drawn wider, but only as the final zoom out settles.
      const eOut = t < tHoldEnd ? 0 : 0.5 - 0.5 * Math.cos(Math.PI * clamp((t - tHoldEnd) / ZOOM_S, 0, 1));
      const wcol = Math.max(tw * c, stripMin * eOut);
      const Ls = wcol / aSm;
      const count = stackCount(t);

      // Background: sky, clouds that drift down gently as the camera climbs, and the ground.
      const sky = ctx.createLinearGradient(0, 0, 0, stageH);
      sky.addColorStop(0, skyTop);
      sky.addColorStop(1, skyBottom);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, stageH);
      const span = stageH + 160;
      const cloudScale = clamp(Math.pow(c, 0.12), 0.7, 1);
      if (cloudImg.complete && cloudImg.naturalWidth) {
        ctx.globalAlpha = cloudAlpha;
        for (const cl of CLOUDS) {
          const raw = cl.y * stageH + (sy0 - floorY) * 0.18;
          const cy = ((raw % span) + span) % span - 80;
          const cx = cl.x * W + (sx0 - colCenterX) * 0.1;
          const cw = 78 * cl.s * cloudScale;
          const ch = cw * cloudImg.naturalHeight / cloudImg.naturalWidth;
          ctx.drawImage(cloudImg, cx - cw / 2, cy - ch / 2, cw, ch);
        }
        ctx.globalAlpha = 1;
      }
      if (sy0 < stageH) {
        const gy = Math.max(0, sy0);
        ctx.fillStyle = groundCol;
        ctx.fillRect(0, gy, W, stageH - gy);
      }
      // Grass along the ground, behind everything that stands on it.
      if (grassImg.complete && grassImg.naturalWidth) {
        const gh = GRASS_W * grassImg.naturalHeight / grassImg.naturalWidth;
        const gTop = sy0 - gh * GRASS_DIRT;
        if (gTop < stageH && gTop + gh > 0) {
          const x0 = (((colCenterX - sx0) % GRASS_W) + GRASS_W) % GRASS_W - GRASS_W;
          for (let gx = x0; gx < W; gx += GRASS_W) ctx.drawImage(grassImg, gx, gTop, GRASS_W + 1, gh);
        }
      }

      // The dashed line at the big object's height.
      const topLineY = sy0 - Hw * c;
      ctx.strokeStyle = guide;
      if (topLineY > -4 && topLineY < stageH + 4) {
        ctx.globalAlpha = clamp((t - tLeanStart) / (tLeanEnd - tLeanStart + 0.3), 0, 1);
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(G, topLineY);
        ctx.lineTo(W - G, topLineY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      // The big object.
      const bw = Tw * c;
      const bh = Hw * c;
      const bx = sx0 + bigLeftWorld * c;
      const by = sy0 - bh;
      if (bigLean && t < tLeanEnd) {
        // Lying down it walks, drives or glides in from the right, then rears up to stand.
        // The view starts zoomed out so the lying object fits, and settles as it stands.
        const L = bh;
        const T = bw;
        const cw = bigLean === 'cw';
        const pvx = cw ? bx : bx + bw;
        const pvy = by + bh;
        const u = clamp((t - BIG_WALK) / BIG_LEAN, 0, 1);
        const zl = Math.min(1, (W - 2 * G) / L);
        const p0 = cw ? W - G : G;
        const ang = (Math.PI / 2) * smooth(u);
        // Zoom in as it rises, but never so far that part of it leaves the screen.
        const fitMax = (W - 8) / (L * Math.cos(ang) + T * Math.sin(ang));
        const sc = Math.min(zl + (1 - zl) * smooth(u), fitMax);
        // The view slides over as it rises, kept so the whole object stays on screen.
        const want = p0 + (pvx - p0) * smooth(u);
        const reachLie = sc * L * Math.cos(ang);
        const reachUp = sc * T * Math.sin(ang);
        const px = cw
          ? Math.min(W - 4 - reachUp, Math.max(reachLie + 4, want))
          : Math.min(W - 4 - reachLie, Math.max(reachUp + 4, want));
        const restLeft = cw ? p0 - sc * L : p0;
        const d0 = (W - restLeft) / zl + 2;
        const wu = clamp(t / BIG_WALK, 0, 1);
        const d = d0 * (1 - wu) * (1 - wu);
        const lift = travelLift(bigKind, wu, T, d0);
        ctx.save();
        ctx.translate(px, pvy);
        ctx.scale(sc, sc);
        ctx.translate(-pvx, -pvy);
        ctx.translate(pvx + d, pvy - lift);
        ctx.rotate((cw ? 1 : -1) * ang);
        ctx.drawImage(bigLying, cw ? -L : 0, -T, L, T);
        ctx.restore();
      } else {
        // Objects that already stand upright just hop in from the right.
        const hu = bigLean ? 1 : clamp(t / BIG_S, 0, 1);
        const slide = (1 - hu) * (1 - hu) * (W - bigX + 30);
        const hop = bigLean ? 0 : travelLift('slide', hu, bw, 0);
        if (bx + slide < W && bx + bw > 0 && by < stageH && by + bh > 0) {
          ctx.drawImage(bigSprite, bx + slide, by - hop, bw, bh);
        }
      }

      // Anything of the stack above the big object's height line is cut off.
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, Math.max(0, topLineY), W, stageH);
      ctx.clip();
      // The stack: whole objects, then the growing or cut-off one on top.
      const full = Math.floor(count + 1e-9);
      const frac = count - full;
      const iStart = Math.max(0, Math.floor((sy0 - stageH) / Ls) - 1);
      const iEnd = Math.min(full - 1, Math.ceil(sy0 / Ls));
      for (let i = iStart; i <= iEnd; i++) {
        if (i < nHop && t < starts[i] + durs[i]) continue;   // still hopping in
        const bottom = sy0 - i * Ls;
        ctx.drawImage(smallSprite, sx0 - wcol / 2, bottom - Ls - 0.5, wcol, Ls + 0.5);
      }
      if (frac > 1e-6) {
        const bottom = sy0 - full * Ls;
        const hv = frac * Ls;
        if (bottom > 0 && bottom - hv < stageH) {
          ctx.drawImage(smallSprite, 0, smallSprite.height * (1 - frac), smallSprite.width, smallSprite.height * frac,
            sx0 - wcol / 2, bottom - hv, wcol, hv);
        }
      }
      ctx.restore();

      // Objects hopping in.
      const dHop = sx0 + wcol / 2 + 24;
      const landed = landedAt(t);
      for (let i = landed; i < nHop && starts[i] <= t; i++) {
        if (t >= starts[i] + durs[i]) continue;
        if (i === 0 && smLean) {
          const local = t - starts[0];
          const cw = smLean === 'cw';
          const pvx = cw ? sx0 - wcol / 2 : sx0 + wcol / 2;
          const wu = clamp(local / SM_WALK, 0, 1);
          const u = clamp((local - SM_WALK) / SM_LEAN, 0, 1);
          const d0 = -(cw ? pvx : pvx + Ls) - 2;
          const d = d0 * (1 - wu) * (1 - wu);
          const lift = travelLift(smKind, wu, wcol, Math.abs(d0));
          // One that lies to the right of its pivot would sprawl over the big object: slide it
          // left just enough to stay clear (never off the stage), easing back as it stands.
          let off = 0;
          if (!cw) {
            const reach = Ls * Math.cos((Math.PI / 2) * smooth(u));
            off = Math.max(4 - pvx, Math.min(0, bx - 4 - (pvx + reach)));
          }
          ctx.save();
          ctx.translate(pvx + d + off, sy0 - lift);
          ctx.rotate((cw ? 1 : -1) * (Math.PI / 2) * smooth(u));
          ctx.drawImage(smLying, cw ? -Ls : 0, -wcol, Ls, wcol);
          ctx.restore();
          continue;
        }
        const h = hopAt((t - starts[i]) / durs[i]);
        const bottom = sy0 - i * Ls;
        ctx.save();
        ctx.translate(sx0 - dHop * h.x, bottom + h.y);
        ctx.scale(h.sx, h.sy);
        ctx.drawImage(smallSprite, -wcol / 2, -Ls, wcol, Ls);
        ctx.restore();
      }

      // The running count under the floor.
      if (t >= tB0 || !(dt > 0 && dt < 0.25)) {
        shown = count;
      } else {
        shown += (count - shown) * (1 - Math.exp(-dt / 0.08));
        if (Math.abs(count - shown) < 0.02) shown = count;
      }
      nEl.textContent = formatCount(shown, R);
      nEl.style.color = t >= tEnd ? theme.warm : theme.ink;
    }

    return {
      unit, target, R, fast, stageH, width: W,
      duration: tEnd,
      cues,
      render,
      renderEnd() { render(tEnd); },
    };
  }

  // Plays a prepared scene against a clock. startAt is when it began, on the clock that `now`
  // reads (performance.now() by default), so a player who arrives late starts partway through.
  function start(scene, opts = {}) {
    stop();
    const my = ++runId;
    const now = opts.now || (() => performance.now());
    const startAt = opts.startAt != null ? opts.startAt : now();
    const done = () => { if (!destroyed && my === runId && opts.onDone) opts.onDone(); };
    if (reduceMotion) {
      scene.render(scene.duration);
      done();
      return;
    }
    let last = now();
    const cues = scene.cues || [];
    let cueAt = 0;
    function frame() {
      if (destroyed || my !== runId) return;
      const clockNow = now();
      const t = Math.min(scene.duration, (clockNow - startAt) / 1000);
      const dt = Math.max(0, (clockNow - last) / 1000);
      last = clockNow;
      scene.render(t, dt);
      if (opts.onFrame) opts.onFrame(t);
      // Sound cues: each fires once as the clock passes it. Ones that are already well behind
      // (a late joiner, a throttled tab) are skipped rather than played in a burst.
      while (cueAt < cues.length && cues[cueAt].t <= t) {
        const c = cues[cueAt++];
        if (opts.onCue && t - c.t < 0.3) opts.onCue(c);
      }
      if (t < scene.duration) raf = requestAnimationFrame(frame);
      else done();
    }
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    runId++;
    cancelAnimationFrame(raf);
  }

  function destroy() {
    destroyed = true;
    stop();
    canvas.remove();
    tally.remove();
  }

  // Loads the pictures ahead of time (no stage needed), so the animation can start the moment it is wanted.
  function preload(a, b) { return Promise.all([loadPicture(a), loadPicture(b)]); }

  return { prepare, preload, start, stop, destroy, canvas };
}
