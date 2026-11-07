/* Size Em Up! monthly unlocks: the 12 reactions (r1-r12), 12 boards (b1-b12) and 12 flairs (f1-f12).
   Pure Web Animations on transparent cutouts from monthly/art. Exposes window.MM:
   MM.ready(key)         promise: loads shared metadata and only that effect’s pictures (no key = explicit full gallery preload)
   MM.build(key, stage)  builds animation `key` (e.g. "r4") inside the empty positioned element `stage`
   MM.info(key)          {kind, D} (D = length in ms of one pass; kind r = 240x240, b = 330x220, f = 300x440 design space)
   MM.rate(key)          playback-rate to apply to the stage's animations (1 unless a piece needs speeding up) */
(function () {
'use strict';
const A = {};
let manifestP = null;
const artLoads = new Map();
// External artwork required by each effect; shared helpers (such as sparkle) are included.
const ART_BY_EFFECT = {
  r1: ["01-flute-glass","02-clink-flash","04-gold-sparkle"],
  r3: ["10-four-leaf-clover","04-gold-sparkle"],
  r8: ["04-gold-sparkle","37-ice-cream-cone","38-cherry"],
  r9: ["42-apple","43-worm"],
  r10: ["47-lit-jack-o-lantern","48-unlit-jack-o-lantern"],
  r2: ["06-face-with-no-eyes","07-heart-eye"],
  r4: ["14-egg-bottom","15-chick","16-egg-cap","04-gold-sparkle"],
  r5: ["23-open-rose","24-rose-petal","04-gold-sparkle"],
  r11: ["04-gold-sparkle","wishbone"],
  r12: ["57-snowman","58-twig-arm"],
  r6: ["04-gold-sparkle","71-sun-face-disc","72-sun-rays-ring","73-cool-sunglasses"],
  r7: ["68-plain-hot-dog","69-ketchup-bottle","70-mustard-bottle","04-gold-sparkle"],
  b1: ["02-clink-flash","03-midnight-sky-board","04-gold-sparkle"],
  b2: ["07-heart-eye","08-love-letter-board","04-gold-sparkle"],
  b3: ["11-green-hills-board","04-gold-sparkle"],
  b4: ["17-spring-meadow-board","24-rose-petal","04-gold-sparkle"],
  b5: ["25-papel-picado-board","27-candy-sheet-0","27-candy-sheet-1","27-candy-sheet-2","27-candy-sheet-3","27-candy-sheet-4","27-candy-sheet-5","04-gold-sparkle"],
  b6: ["31-pool-deck-board","beach-ball","pool-ring","04-gold-sparkle"],
  b7: ["34-backyard-dusk-board"],
  b8: ["39-underwater-board"],
  b9: ["74-clean-notebook-board","75-chunky-pencil","04-gold-sparkle"],
  b10: ["49-haunted-window-board"],
  b11: ["54-harvest-table-board"],
  b12: ["59-fireplace-board"],
  f1: ["04-gold-sparkle","05-gold-and-silver-confetti-sheet-0","05-gold-and-silver-confetti-sheet-1","05-gold-and-silver-confetti-sheet-2","05-gold-and-silver-confetti-sheet-3","05-gold-and-silver-confetti-sheet-4","05-gold-and-silver-confetti-sheet-5","05-gold-and-silver-confetti-sheet-6","05-gold-and-silver-confetti-sheet-7"],
  f2: ["09-paper-hearts-sheet-0","09-paper-hearts-sheet-1","09-paper-hearts-sheet-2","09-paper-hearts-sheet-3"],
  f3: ["04-gold-sparkle","13-clover-sheet-0","13-clover-sheet-1","13-clover-sheet-2","13-clover-sheet-3"],
  f4: ["20-daffodil","daisy"],
  f5: ["26-star-pi-ata","27-candy-sheet-0","27-candy-sheet-1","27-candy-sheet-2","27-candy-sheet-3","27-candy-sheet-4","27-candy-sheet-5","62-donkey-pinata","04-gold-sparkle"],
  f6: ["04-gold-sparkle","beach-ball"],
  f7: ["35-water-balloon-sheet-0","35-water-balloon-sheet-1","35-water-balloon-sheet-2"],
  f8: ["40-surfboard-sheet-0","40-surfboard-sheet-1","40-surfboard-sheet-2","surfer","wave2"],
  f9: ["45-red-pen-marks-sheet-1","45-red-pen-marks-sheet-2","46-giant-a","great"],
  f10: ["50-smiling-ghost","51-boo-ghost","bat1","bat2","bat3","bat4"],
  f11: ["55-cornucopia","56-harvest-sheet-0","56-harvest-sheet-1","56-harvest-sheet-2","56-harvest-sheet-3","56-harvest-sheet-4","56-harvest-sheet-5"],
  f12: ["04-gold-sparkle","60-christmas-bulb-sheet-0","60-christmas-bulb-sheet-1","60-christmas-bulb-sheet-2","60-christmas-bulb-sheet-3","60-christmas-bulb-sheet-4","61-present-sheet-0","61-present-sheet-1","61-present-sheet-2","61-present-sheet-3","sleigh"],
};

const R = 240, BW = 330, BH = 220, FW = 300, FH = 440;
let SEED = 7;
const rnd = () => { SEED = (SEED * 16807) % 2147483647; return (SEED - 1) / 2147483646; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const lerp = (a, b, u) => a + (b - a) * u;
const T = (x = 0, y = 0, r = 0, sx = 1, sy = sx) => `translate(${x}px,${y}px) rotate(${r}deg) scale(${sx},${sy})`;

function mk(stage, name, cx, cy, w, o = {}) {
  const a = A[name], h = w * a.h / a.w, e = document.createElement('img');
  e.src = a.u; e.draggable = false; e.alt = '';
  Object.assign(e.style, { position: 'absolute', left: (cx - w / 2) + 'px', top: (cy - h / 2) + 'px', width: w + 'px', height: h + 'px', pointerEvents: 'none', maxWidth: 'none', maxHeight: 'none',
    transformOrigin: o.origin || '50% 50%', zIndex: o.z || 1, opacity: o.opacity == null ? 1 : o.opacity });
  if (o.clip) e.style.clipPath = o.clip;
  e.dataset.flip = o.flip ? '-1' : '1';
  stage.appendChild(e); return e;
}
function box(stage, css, z = 1) {
  const e = document.createElement('div');
  Object.assign(e.style, { position: 'absolute', pointerEvents: 'none', zIndex: z }); e.style.cssText += ';' + css;
  stage.appendChild(e); return e;
}
/* rows: [ms, x, y, rot, sx, opacity, easing, sy]  -> one animation spanning D ms */
function seq(e, D, rows, o = {}) {
  const f = parseFloat(e.dataset.flip || 1);
  return e.animate(rows.map((r) => ({
    offset: Math.min(1, r[0] / D), transform: T(r[1], r[2], r[3], (r[4] == null ? 1 : r[4]) * f, r[7] == null ? (r[4] == null ? 1 : r[4]) : r[7]),
    opacity: r[5] == null ? 1 : r[5], easing: r[6] || 'ease-in-out' })), { duration: D, fill: 'both', delay: o.delay || 0, iterations: o.iter || 1 });
}
/* a sampled path: fn(u) -> {x,y,r,sx,sy,op}, u from 0 to 1 across [t0,t1] inside total D */
function path(e, D, t0, t1, fn, n = 36, o = {}) {
  const f = parseFloat(e.dataset.flip || 1), fr = [];
  const tf = (p) => T(p.x, p.y, p.r || 0, (p.sx == null ? 1 : p.sx) * f, p.sy == null ? (p.sx == null ? 1 : p.sx) : p.sy);
  const first = fn(0), last = fn(1);
  fr.push([0, tf(first), 0]);
  if (t0 > 0) fr.push([t0 / D, tf(first), 0]);
  for (let i = 0; i <= n; i++) { const u = i / n, p = fn(u); fr.push([lerp(t0, t1, u) / D, tf(p), p.op == null ? 1 : p.op]); }
  fr.push([t1 / D, tf(last), 0]); fr.push([1, tf(last), 0]);
  let prev = 0; const rows = fr.map((x) => { prev = Math.min(1, Math.max(prev, x[0])); return { offset: prev, transform: x[1], opacity: x[2] }; });
  return e.animate(rows, { duration: D, fill: 'both', easing: 'linear' });
}
const fade = (u, a = .12, b = .12) => Math.min(1, u / a, (1 - u) / b);
/* a spark burst: n particles (image or css dot) from cx,cy */
function burst(stage, D, t0, cx, cy, n, r, mkp, life = 700) {
  for (let i = 0; i < n; i++) {
    const e = mkp(i), ang = (i / n) * Math.PI * 2 + rnd() * .4, rr = r * (.6 + rnd() * .6);
    path(e, D, t0, t0 + life, (u) => ({ x: Math.cos(ang) * rr * Math.sqrt(u), y: Math.sin(ang) * rr * Math.sqrt(u) + 18 * u * u, r: u * 90, sx: 1 - u * .6, op: fade(u, .05, .5) }), 14);
  }
}
const dot = (stage, color, size, cx, cy, glow = true, z = 3) => box(stage, `left:${cx - size / 2}px;top:${cy - size / 2}px;width:${size}px;height:${size}px;border-radius:50%;background:${color};${glow ? `box-shadow:0 0 ${size * 1.2}px ${color};` : ''}`, z);
const sparkle = (stage, cx, cy, w, D, t0, dur = 500, z = 4) => { const e = mk(stage, '04-gold-sparkle', cx, cy, w, { z }); seq(e, D, [[0, 0, 0, 0, 0, 0], [t0, 0, 0, 0, .1, 0], [t0 + dur * .45, 0, 0, 40, 1, 1], [t0 + dur, 0, 0, 90, .1, 0], [D, 0, 0, 90, .1, 0]]); return e; };
const hold = (D, t0, t1, rows) => rows;

const SC = { // stage sizes
  r: [R, R], b: [BW, BH], f: [FW, FH] };
const ANIM = {}; // key -> {kind, D, build(stage)}
const def = (key, kind, D, build) => { ANIM[key] = { kind, D, build }; };

/* ================= REACTIONS (240 x 240) ================= */
def('r1', 'r', 3200, (s) => { const D = 3200;
  const L = mk(s, '01-flute-glass', 92, 130, 120, { z: 2 }), Rr = mk(s, '01-flute-glass', 148, 130, 120, { z: 2, flip: true });
  seq(L, D, [[0, -120, 24, -30, 1, 0], [420, 0, 0, 8, 1, 1, 'ease-out'], [580, 12, -2, 17, 1, 1, 'ease-in'], [760, 2, 0, 4, 1, 1], [1050, 0, -6, 0, 1, 1], [2600, 0, -6, 0, 1, 1], [3200, 0, 14, 0, 1, 0]]);
  seq(Rr, D, [[0, 120, 24, 30, 1, 0], [420, 0, 0, -8, 1, 1, 'ease-out'], [580, -12, -2, -17, 1, 1, 'ease-in'], [760, -2, 0, -4, 1, 1], [1050, 0, -6, 0, 1, 1], [2600, 0, -6, 0, 1, 1], [3200, 0, 14, 0, 1, 0]]);
  const F = mk(s, '02-clink-flash', 120, 70, 96, { z: 4 });
  seq(F, D, [[0, 0, 0, 0, 0, 0], [560, 0, 0, 0, .2, 0], [660, 0, 0, 20, 1.25, 1], [980, 0, 0, 55, .3, 0], [D, 0, 0, 55, .3, 0]]);
  burst(s, D, 600, 120, 72, 8, 78, () => mk(s, '04-gold-sparkle', 120, 72, 30, { z: 4 }), 900);
  [[60, 110], [180, 120], [200, 60], [40, 60]].forEach((p, i) => sparkle(s, p[0], p[1], 22, D, 1300 + i * 330, 600));
});
def('r3', 'r', 3200, (s) => { const D = 3200;
  const c = mk(s, '10-four-leaf-clover', 120, 130, 150, { z: 2, origin: '50% 70%' });
  seq(c, D, [[0, 0, 10, -300, 0, 0], [650, 0, 0, 0, 1.18, 1, 'ease-out'], [850, 0, 0, 0, .94], [1000, 0, 0, 0, 1], [1400, 0, 0, -7, 1], [1800, 0, 0, 7, 1], [2200, 0, 0, -5, 1], [2600, 0, 0, 0, 1, 1], [D, 0, 0, 0, .5, 0]]);
  [[62, 72, 700], [178, 70, 1050], [58, 168, 1400], [184, 172, 1750], [120, 38, 2050]].forEach((p) => sparkle(s, p[0], p[1], 30, D, p[2] + 400, 650));
});
def('r8', 'r', 3600, (s) => { const D = 3600;
  const g = box(s, 'left:0;top:0;width:240px;height:240px;transform-origin:120px 213px;', 1);
  g.animate([{ transform: 'translateY(100px) scale(.7)', opacity: 0 }, { transform: 'scale(1.04)', opacity: 1, offset: .125, easing: 'ease-out' }, { transform: 'scale(1)', offset: .18 }, { transform: 'scale(1)', offset: .42 }, { transform: 'scale(1.06,.94)', offset: .45, easing: 'ease-in' }, { transform: 'scale(.98,1.03)', offset: .5, easing: 'ease-out' }, { transform: 'rotate(3deg)', offset: .56 }, { transform: 'rotate(-3deg)', offset: .64 }, { transform: 'rotate(2deg)', offset: .72 }, { transform: 'rotate(0)', opacity: 1, offset: .78 }, { transform: 'rotate(0)', opacity: 1, offset: .89 }, { transform: 'translateY(40px) scale(.8)', opacity: 0 }], { duration: D, fill: 'both' });
  mk(g, '37-ice-cream-cone', 120, 138, 150, { z: 1 });
  const ch = mk(g, '38-cherry', 118, 56, 54, { z: 3 });
  seq(ch, D, [[0, 0, -150, 0, 1, 0], [800, 0, -150, 0, 1, 0], [810, 0, -150, 0, 1, 1], [1500, 0, 6, 0, 1, 1, 'ease-in'], [1650, 0, -22, 4, 1, 1, 'ease-out'], [1800, 0, 2, 0, 1, 1, 'ease-in'], [1900, 0, -8, 0, 1, 1, 'ease-out'], [2000, 0, 0, 0, 1, 1], [D, 0, 0, 0, 1, 1]]);
  burst(s, D, 1520, 118, 66, 6, 44, () => mk(s, '04-gold-sparkle', 118, 66, 20, { z: 4 }), 600);
  [[40, 110], [200, 90], [170, 40]].forEach((p, i) => sparkle(s, p[0], p[1], 20, D, 2300 + i * 220, 600));
});
def('r9', 'r', 3800, (s) => { const D = 3800;
  const ap = mk(s, '42-apple', 104, 136, 172, { z: 1 });
  seq(ap, D, [[0, 0, 100, 0, .7, 0], [450, 0, 0, 0, 1.05, 1, 'ease-out'], [650, 0, 0, 0, 1], [3300, 0, 0, 0, 1, 1], [D, 0, 40, 0, .8, 0]]);
  // hole: centre (459.5,335) radius 46.5 of the 640px art; worm tail: width 235, rounded bottom centre (368,631) of its 640px art
  const k = 172 / 640, hx = 18 + 459.5 * k, hy = 50 + 335 * k, hr = 46.5 * k + .6, W = 172 * (93 / 235);
  const left = hx - .575 * W, top = hy + hr - .986 * W, pc = (X, Y) => (((X - left) / W) * 100).toFixed(2) + '% ' + (((Y - top) / W) * 100).toFixed(2) + '%';
  const hyp = (((hy - top) / W) * 100).toFixed(2) + '%', pts = ['-20% -20%', '120% -20%', '120% ' + hyp, pc(hx + hr, hy)]; for (let i = 1; i < 24; i++) { const a2 = i / 24 * Math.PI; pts.push(pc(hx + hr * Math.cos(a2), hy + hr * Math.sin(a2))); } pts.push(pc(hx - hr, hy), '-20% ' + (((hy - top) / W) * 100).toFixed(2) + '%');
  const w = mk(s, '43-worm', left + W / 2, top + W / 2, W, { z: 2, origin: '57.5% 98.6%', clip: 'polygon(' + pts.join(',') + ')' });
  seq(w, D, [[0, 0, 0, 0, .05, 0, 'ease-out', .05], [1000, 0, 0, 0, .05, 0, 'ease-out', .05], [1010, 0, 0, 0, .3, 1, 'ease-out', .1], [1450, 0, 0, 0, 1.02, 1, 'ease-out', 1.12], [1650, 0, 0, 0, 1, 1, 'ease-in-out', 1], [1950, 0, 0, 10, 1], [2250, 0, 0, -9, 1], [2550, 0, 0, 8, 1], [2850, 0, 0, 0, 1, 1], [3150, 0, 0, 0, .3, 1, 'ease-in', .06], [3170, 0, 0, 0, .05, 0, 'ease-in', .05], [D, 0, 0, 0, .05, 0]]);
});
def('r10', 'r', 3600, (s) => { const D = 3600;
  box(s, 'left:20px;top:30px;width:200px;height:190px;border-radius:50%;background:radial-gradient(circle,rgba(255,190,40,.55),rgba(255,140,0,0) 70%);', 0).animate([{ opacity: 0 }, { opacity: 0, offset: .16 }, { opacity: 1, offset: .22 }, { opacity: .7, offset: .3 }, { opacity: 1, offset: .38 }, { opacity: .8, offset: .55 }, { opacity: 1, offset: .7 }, { opacity: .85, offset: .85 }, { opacity: 0 }], { duration: D, fill: 'both' });
  const off = mk(s, '48-unlit-jack-o-lantern', 120, 132, 170, { z: 1 }), on = mk(s, '47-lit-jack-o-lantern', 120, 132, 170, { z: 2 });
  seq(off, D, [[0, 0, 80, 0, .7, 0], [450, 0, 0, 0, 1.05, 1, 'ease-out'], [650, 0, 0, 0, 1], [3200, 0, 0, 0, 1, 1], [D, 0, 30, 0, .8, 0]]);
  const rows = [[0, 0, 80, 0, .7, 0], [450, 0, 0, 0, 1.05, 0, 'ease-out'], [650, 0, 0, 0, 1, 0], [800, 0, 0, 0, 1, 0], [850, 0, 0, 0, 1, 1], [950, 0, 0, 0, 1, .4], [1050, 0, 0, 0, 1.03, 1], [1250, 0, 0, 0, 1, .75], [1450, 0, 0, 0, 1.03, 1], [1900, 0, 0, 0, 1, .85], [2200, 0, 0, -3, 1.02, 1], [2500, 0, 0, 3, 1.02, .9], [2800, 0, 0, 0, 1, 1], [3200, 0, 0, 0, 1, 1], [D, 0, 30, 0, .8, 0]];
  seq(on, D, rows);
});
const waiting = (s, title, msg) => { box(s, 'left:12px;top:12px;right:12px;bottom:12px;border:2px dashed var(--muted);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px;padding:14px;color:var(--muted);font:600 14px Fredoka,system-ui,sans-serif;line-height:1.35;', 1).innerHTML = '<b style="font-size:16px;color:var(--fg)">' + title + '</b><span>' + msg + '</span>'; };
def('r2', 'r', 3600, (s) => { const D = 3600;
  const g = box(s, 'left:0;top:0;width:240px;height:240px;transform-origin:120px 128px;', 1);
  g.animate([{ transform: 'translateY(20px) scale(.5)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 1, offset: .12, easing: 'ease-out' }, { transform: 'scale(.97)', offset: .18 }, { transform: 'scale(1)', offset: .23 }, { transform: 'scale(1)', opacity: 1, offset: .9 }, { transform: 'translateY(10px) scale(.9)', opacity: 0 }], { duration: D, fill: 'both' });
  mk(g, '06-face-with-no-eyes', 120, 128, 190, { z: 1 });
  [[88, 108, 1], [152, 108, -1]].forEach(([x, y, d]) => { const h = mk(g, '07-heart-eye', x, y, 56, { z: 3 });
    seq(h, D, [[0, 0, 0, 0, 1, 1], [850, 0, 0, 0, 1, 1], [1000, 0, 0, d * -6, 1.5, 1, 'ease-out'], [1160, 0, 0, d * 4, 1.05, 1, 'ease-in-out'], [1330, 0, 0, d * -6, 1.55, 1, 'ease-out'], [1500, 0, 0, 0, 1.02], [1760, 0, 0, d * -5, 1.45, 1, 'ease-out'], [1930, 0, 0, 0, 1.02], [2150, 0, 0, d * -5, 1.5, 1, 'ease-out'], [2320, 0, 0, 0, 1.02], [2600, 0, 0, d * -4, 1.35, 1, 'ease-out'], [2780, 0, 0, 0, 1, 1], [D, 0, 0, 0, 1, 1]]); });
  for (let i = 0; i < 6; i++) { const e = mk(s, '07-heart-eye', 70 + rnd() * 100, 60, 20 + rnd() * 10, { z: 5 }), t0 = 1100 + i * 300, sw = (rnd() - .5) * 40;
    path(e, D, t0, t0 + 1300, (u) => ({ x: sw * Math.sin(u * 6) * .4 + (u - .5) * 20, y: -u * 90, r: Math.sin(u * 5) * 15, op: fade(u, .15, .4), sx: .6 + u * .5 }), 20); }
});
def('r4', 'r', 4000, (s) => { const D = 4000, S = 168;
  const wob = (tail) => [[0, 0, 40, 0, .6, 0], [350, 0, 0, 0, 1.05, 1, 'ease-out'], [500, 0, 0, 0, 1], [650, -4, 0, -5, 1], [750, 4, 0, 5, 1], [850, -4, 0, -5, 1], [950, 4, 0, 5, 1], [1050, -3, 0, -4, 1], [1150, 0, 0, 0, 1], ...tail, [3500, 0, 0, 0, 1, 1], [D, 0, 30, 0, .8, 0]];
  const back = mk(s, '14-egg-bottom', 120, 160, S, { z: 1 }); seq(back, D, wob([[1250, 0, 0, 0, 1, 1]]));
  const chick = mk(s, '15-chick', 120, 126, 112, { z: 2, clip: 'inset(0 0 15% 0)' });
  seq(chick, D, [[0, 0, 74, 0, .95, 0], [1590, 0, 50, 0, .95, 0], [1600, 0, 48, 0, .95, 1], [1950, 0, -24, 0, 1.03, 1, 'ease-out', 1.07], [2150, 0, -10, 0, 1, 1, 'ease-in-out', .96], [2350, 0, -12, 0, 1, 1], [2650, 0, -12, -6, 1], [2950, 0, -12, 6, 1], [3250, 0, -12, -4, 1], [3500, 0, -12, 0, 1, 1], [D, 0, 40, 0, .9, 0]]);
  // front = the same shell, cut along its own zigzag line, so the chick sits behind the line and in front of the back wall
  const front = mk(s, '14-egg-bottom', 120, 160, S, { z: 3, clip: 'polygon(0.00% 33.59%,6.25% 31.72%,8.44% 31.25%,10.62% 30.16%,12.81% 29.06%,15.00% 27.97%,17.19% 27.81%,19.38% 29.84%,21.56% 32.81%,23.75% 35.62%,25.94% 37.66%,28.12% 36.25%,30.31% 34.84%,32.50% 33.44%,34.69% 32.03%,36.88% 30.78%,39.06% 30.16%,41.25% 30.94%,43.44% 32.81%,45.62% 34.84%,47.81% 37.03%,50.00% 39.06%,52.19% 40.62%,54.38% 38.91%,56.56% 37.19%,58.75% 35.31%,60.94% 33.59%,63.12% 31.88%,65.31% 30.78%,67.50% 30.78%,69.69% 32.03%,71.88% 33.44%,74.06% 35.00%,76.25% 36.41%,78.44% 36.56%,80.62% 33.44%,82.81% 30.16%,85.00% 27.81%,87.19% 28.12%,89.38% 28.75%,91.56% 31.25%,100.00% 33.59%,100% 100%,0 100%)' }); seq(front, D, wob([[1250, 0, 0, 0, 1, 1]]));
  const cap = mk(s, '16-egg-cap', 120, 122, S, { z: 5, origin: '50% 80%' });
  seq(cap, D, [[0, 0, 40, 0, .6, 0], [350, 0, 0, 0, 1.05, 1, 'ease-out'], [500, 0, 0, 0, 1], [650, -4, 0, -5, 1], [750, 4, 0, 5, 1], [850, -4, 0, -5, 1], [950, 4, 0, 5, 1], [1050, -3, 0, -4, 1], [1150, 0, 0, 0, 1, 1], [1230, 0, -10, 0, 1, 1, 'ease-out'], [1700, 70, -120, 160, .85, 1, 'ease-in'], [1900, 110, -60, 240, .8, 0], [D, 110, -60, 240, .8, 0]]);
  for (let i = 0; i < 5; i++) sparkle(s, 80 + i * 20, 56 + (i % 2) * 24, 22, D, 1700 + i * 120, 500);
});
def('r5', 'r', 3800, (s) => { const D = 3800;
  const gl = box(s, 'left:30px;top:30px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(255,120,120,.55),rgba(255,120,120,0) 70%);', 0);
  gl.animate([{ opacity: 0, transform: 'scale(.3)' }, { opacity: 0, offset: .2 }, { opacity: 1, transform: 'scale(1.1)', offset: .32 }, { opacity: 0, transform: 'scale(1.3)', offset: .5 }, { opacity: 0 }], { duration: D, fill: 'both', easing: 'ease-out' });
  const rose = mk(s, '23-open-rose', 120, 128, 172, { z: 2, origin: '50% 92%' });
  seq(rose, D, [[0, 0, 6, -16, .12, 0], [250, 0, 4, -10, .25, 1, 'ease-out'], [1150, 0, 0, 5, 1.1, 1, 'ease-in-out'], [1350, 0, 0, 0, .97, 1], [1500, 0, 0, 0, 1], [2000, 0, 0, -3, 1], [2500, 0, 0, 3, 1], [3000, 0, 0, 0, 1, 1], [3400, 0, 0, 0, 1, 1], [D, 0, 0, 0, .9, 0]]);
  for (let i = 0; i < 5; i++) { const e = mk(s, '24-rose-petal', 120, 70, 30, { z: 4 }), t0 = 1450 + i * 330, dir = i % 2 ? 1 : -1, sw = 25 + rnd() * 25;
    path(e, D, t0, t0 + 1600, (u) => ({ x: dir * (10 + u * 55) + Math.sin(u * 7 + i) * sw * u, y: u * 175, r: dir * u * 280, sx: .4 + .6 * Math.abs(Math.cos(u * 8 + i)), sy: 1, op: fade(u, .1, .25) }), 26); }
  sparkle(s, 66, 70, 26, D, 1250, 600); sparkle(s, 176, 62, 22, D, 1350, 600); sparkle(s, 190, 130, 18, D, 1500, 600);
});
def('r11', 'r', 3400, (s) => { const D = 3400, W = 130, Hh = W * 280 / 230, cx = 120, cy = 122;
  const zz = [[49, 0], [55, 7], [45, 14], [56, 21], [46, 28], [54, 35], [50, 42]], zs = zz.map((p) => p[0] + '% ' + p[1] + '%').join(',');
  const a = mk(s, 'wishbone', cx, cy, W, { z: 2, origin: '50% 84%', clip: `polygon(0 0,${zs},50% 100%,0 100%)` }), b = mk(s, 'wishbone', cx, cy, W, { z: 2, origin: '50% 84%', clip: `polygon(100% 0,${zs},50% 100%,100% 100%)` });
  const common = (d, big) => [[0, 0, 40, 0, .6, 0], [400, 0, 0, 0, 1.04, 1, 'ease-out'], [600, 0, 0, 0, 1], [900, 1.5, 0, 2, 1, 1, 'linear'], [980, -1.5, 0, -2, 1, 1, 'linear'], [1060, 2, 0, 3, 1, 1, 'linear'], [1140, -2, 0, -3, 1, 1, 'linear'], [1220, 2.5, 0, 4, 1, 1, 'linear'], [1300, 0, 0, 0, 1, 1, 'ease-in'], [1380, d * 12 * big, -6, d * 12 * big, 1, 1, 'ease-out'], [1700, d * 16 * big, 6, d * 18 * big, 1, 1], [2600, d * 18 * big, 8, d * 20 * big, 1, 1], [D, d * 22 * big, 80, d * 34 * big, 1, 0]];
  seq(a, D, common(-1, 1)); seq(b, D, common(1, 1.15));
  for (let i = 0; i < 7; i++) { const c = box(s, `left:0;top:0;width:${5 + rnd() * 4}px;height:${5 + rnd() * 4}px;background:#f6dcae;border:1.5px solid #6b3a1b;clip-path:polygon(0 0,100% 20%,60% 100%);`, 6), ang = -Math.PI * (.1 + .8 * rnd()), v = 40 + rnd() * 50;
    path(c, D, 1380, 2100, (u) => ({ x: cx + Math.cos(ang) * v * u, y: cy - 40 + Math.sin(ang) * v * u + 160 * u * u, r: u * 400, op: fade(u, .03, .3) }), 18); }
  burst(s, D, 1380, cx, cy - 40, 6, 36, () => mk(s, '04-gold-sparkle', cx, cy - 40, 18, { z: 6 }), 600);
});
def('r12', 'r', 4000, (s) => { const D = 4000;
  const g = box(s, 'left:0;top:0;width:240px;height:240px;transform-origin:120px 222px;', 1);
  g.animate([{ transform: 'translateY(80px) scale(.7)', opacity: 0 }, { transform: 'scale(1.05)', opacity: 1, offset: .11, easing: 'ease-out' }, { transform: 'scale(1)', offset: .16 }, { transform: 'rotate(1.5deg)', offset: .3 }, { transform: 'rotate(-1.5deg)', offset: .45 }, { transform: 'rotate(0)', offset: .6 }, { transform: 'rotate(0)', opacity: 1, offset: .88 }, { transform: 'translateY(40px) scale(.8)', opacity: 0 }], { duration: D, fill: 'both' });
  const sx = 150, sY = 57, base = [[96, 136, 1], [143, 136, 0]];
  const arm = (right) => { const W = 62, bx = right ? 143 : 96, by = 136; const e = mk(g, '58-twig-arm', bx + .36 * W, by - .45 * W, W, { z: 1, origin: '14% 95%', flip: !right });
    const d = right ? 1 : -1, rows = [[0, 0, 0, 0, 1, 1], [900, 0, 0, 0, 1, 1]]; for (let i = 0; i < 7; i++) rows.push([900 + (i + 1) * 300, 0, 0, d * (i % 2 ? (right ? 2 : 6) : (right ? 24 : 12)), 1, 1]); rows.push([3300, 0, 0, 0, 1, 1], [D, 0, 0, 0, 1, 1]); seq(e, D, rows); };
  arm(true); arm(false);
  mk(g, '57-snowman', 120, 132, 150, { z: 2 });
  for (let i = 0; i < 12; i++) { const e = dot(s, '#fff', 4 + rnd() * 3, 0, 0, true, 5), x0 = 20 + rnd() * 200, t0 = 400 + i * 220;
    path(e, D, t0, t0 + 2200, (u) => ({ x: x0 + Math.sin(u * 6 + i) * 10, y: -10 + u * 250, op: fade(u, .1, .2) * .9 }), 22); }
});

def('r6', 'r', 4400, (s) => { const D = 4400;
  const gl = box(s, 'left:10px;top:10px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(255,210,60,.7),rgba(255,160,0,0) 68%);', 0);
  gl.animate([{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1)', offset: .12 }, { opacity: .6, transform: 'scale(.95)', offset: .22 }, { opacity: 1, transform: 'scale(1.06)', offset: .34 }, { opacity: .6, transform: 'scale(.95)', offset: .46 }, { opacity: 1, transform: 'scale(1.06)', offset: .58 }, { opacity: .7, transform: 'scale(1)', offset: .8 }, { opacity: 0, transform: 'scale(.8)' }], { duration: D, fill: 'both', easing: 'ease-in-out' });
  const g = box(s, 'left:0;top:0;width:240px;height:240px;transform-origin:120px 120px;', 1);
  g.animate([{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1.06)', opacity: 1, offset: .1, easing: 'ease-out' }, { transform: 'scale(1)', offset: .15 }, { transform: 'scale(1)', opacity: 1, offset: .88 }, { transform: 'scale(.85)', opacity: 0 }], { duration: D, fill: 'both' });
  const ring = mk(g, '72-sun-rays-ring', 120, 120, 190, { z: 1 });
  const rr = []; for (let i = 0; i <= 12; i++) rr.push({ offset: i / 12, transform: `rotate(${i * 12}deg) scale(${1 + .06 * Math.sin(i / 12 * Math.PI * 6)})` }); ring.animate(rr, { duration: D, fill: 'both', easing: 'linear' });
  const disc = mk(g, '71-sun-face-disc', 120, 120, 114, { z: 2 });
  seq(disc, D, [[0, 0, 0, 0, 1, 1], [700, 0, 0, 0, 1, 1], [900, 0, -3, 0, 1.05, 1, 'ease-out'], [1100, 0, 0, 0, 1], [1700, 0, 2, 0, 1.0, 1, 'ease-in-out', .98], [2100, 0, -2, 0, 1, 1], [2600, 0, 2, 0, 1, 1, 'ease-in-out', .98], [3000, 0, 0, 0, 1, 1], [D, 0, 0, 0, 1, 1]]);
  const sg = mk(g, '73-cool-sunglasses', 120, 113, 94, { z: 3 });
  seq(sg, D, [[0, 0, -150, -12, 1, 0], [1000, 0, -150, -12, 1, 0], [1010, 0, -150, -12, 1, 1], [1450, 0, 6, 3, 1, 1, 'ease-in', 1], [1560, 0, -6, -2, 1.04, 1, 'ease-out', .94], [1680, 0, 0, 0, 1, 1, 'ease-in'], [1760, 0, 0, 0, 1, 1], [D, 0, 0, 0, 1, 1]]);
  const gt = mk(g, '04-gold-sparkle', 94, 106, 26, { z: 4 }); seq(gt, D, [[0, 0, 0, 0, 0, 0], [1900, 0, 0, 0, .1, 0], [2050, 0, 0, 30, 1.1, 1], [2300, 0, 0, 90, .1, 0], [D, 0, 0, 90, .1, 0]]);
  sparkle(g, 160, 100, 22, D, 2600, 500, 4);
  burst(s, D, 1450, 120, 112, 8, 70, () => mk(s, '04-gold-sparkle', 120, 112, 20, { z: 5 }), 700);
});
def('r7', 'r', 5400, (s) => { const D = 5400;
  const g = box(s, 'left:0;top:0;width:240px;height:240px;transform-origin:120px 200px;', 1);
  g.animate([{ transform: 'translateY(70px) scale(.8)', opacity: 0 }, { transform: 'scale(1.04)', opacity: 1, offset: .08, easing: 'ease-out' }, { transform: 'scale(1)', offset: .11 }, { transform: 'scale(1)', opacity: 1, offset: .85 }, { transform: 'translateY(30px) scale(.9)', opacity: 0 }], { duration: D, fill: 'both' });
  const W = 210, H = W * 352 / 640, cx = 120, cy = 150, L = cx - W / 2, Tp = cy - H / 2;
  mk(g, '68-plain-hot-dog', cx, cy, W, { z: 1 });
  const x0 = L + .15 * W, x1 = L + .85 * W, yb = Tp + .39 * H, A = 7, K = 4.5, N = 80;
  const pathD = (ph) => { let d = ''; for (let i = 0; i <= N; i++) { const u = i / N; d += (i ? 'L' : 'M') + (x0 + (x1 - x0) * u).toFixed(1) + ' ' + (yb + A * Math.sin(u * K * 6.2832 + ph)).toFixed(1); } return d; };
  const sq = (ph, outline, fillc, hi, t0, t1) => { const sv = box(g, 'left:0;top:0;width:240px;height:240px;', 2);
    sv.innerHTML = `<svg viewBox="0 0 240 240" width="240" height="240" style="overflow:visible">` + [[outline, 8.5], [fillc, 5.8], [hi, 1.6]].map(([c, w], i) => `<path d="${pathD(ph)}" pathLength="1" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1" stroke-dashoffset="1" ${i === 2 ? 'transform="translate(0,-1.4)" opacity=".7"' : ''}/>`).join('') + '</svg>';
    sv.querySelectorAll('path').forEach((p) => p.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 1, offset: t0 / D }, { strokeDashoffset: 0, offset: t1 / D }, { strokeDashoffset: 0 }], { duration: D, fill: 'both', easing: 'linear' })); };
  sq(0, '#7a1608', '#e3281a', '#ff8f7d', 1000, 2200); sq(Math.PI, '#7a5200', '#ffd21a', '#fff3a0', 2700, 3900);
  const bottle = (nm, t0, t1, ph, fromX) => { const bw = 44, bh = bw * 640 / 309, tipx0 = x0, tipy0 = yb - 5 - A;
    const e = mk(g, nm, tipx0, tipy0 - bh * .49, bw, { z: 4, origin: '50% 99%' });
    path(e, D, t0 - 500, t1 + 500, (u) => { const a = Math.min(1, u / (500 / (t1 - t0 + 1000))), b = Math.min(1, (1 - u) / (500 / (t1 - t0 + 1000))), v = Math.max(0, Math.min(1, (u * (t1 - t0 + 1000) - 500) / (t1 - t0)));
      const tx = x0 + (x1 - x0) * v, ty = yb + A * Math.sin(v * K * 6.2832 + ph) - 6;
      const ex = (1 - Math.min(1, a)) * fromX, ey = (1 - Math.min(1, a)) * -50 + (1 - Math.min(1, b)) * -50;
      return { x: tx - tipx0 + ex, y: ty - tipy0 + ey, r: -18 + 6 * Math.sin(v * 20), op: Math.min(1, a * 2, b * 2) }; }, 70); };
  bottle('69-ketchup-bottle', 1000, 2200, 0, -80); bottle('70-mustard-bottle', 2700, 3900, Math.PI, 80);
  sparkle(g, 60, 128, 22, D, 4100, 500, 5); sparkle(g, 176, 118, 20, D, 4250, 500, 5); sparkle(g, 118, 108, 22, D, 4400, 500, 5);
});

/* ================= BOARDS (330 x 248, 4:3): the board art stays; a living layer and the question play on top ================= */
const BH2 = 248, QS = 'How many bananas tall is a giraffe?';
/* board facts for the game: art, where the question text sits (fractions of the picture: left, top, right, bottom), its colour and glow, and when the question has finished writing in and settled (settle ms for a 43-letter question, plus per ms for each letter more or fewer): the answer waits for that */
const BOARD_META = [
  { img: '03-midnight-sky-board', rect: [.08, .3, .92, .82], color: '#ffeaa8', css: 'text-shadow:0 0 8px rgba(255,200,80,.85),0 0 18px rgba(255,160,40,.5);' , settle: 3200, per: 0 },
  { img: '08-love-letter-board', rect: [.14, .2, .86, .78], color: '#a8174a', css: 'text-shadow:0 1px 0 #fff,0 0 8px rgba(255,255,255,.9);' , settle: 2900, per: 45 },
  { img: '11-green-hills-board', rect: [.08, .12, .92, .7], color: '#fff', css: '-webkit-text-stroke:3.5px #fff;paint-order:stroke fill;text-shadow:0 2px 5px rgba(0,70,130,.35);' , settle: 2500, per: 0 },
  { img: '17-spring-meadow-board', rect: [.1, .12, .9, .7], color: '#5a2d8c', css: '-webkit-text-stroke:3px #fff7c9;paint-order:stroke fill;text-shadow:0 2px 4px rgba(60,20,110,.25);' , settle: 3400, per: 40 },
  { img: '25-papel-picado-board', rect: [.12, .24, .88, .8], color: '#7a1030', css: '-webkit-text-stroke:2.5px #fff6cf;paint-order:stroke fill;' , settle: 2900, per: 45 },
  { img: '31-pool-deck-board', rect: [.06, .16, .8, .76], color: '#fff', css: 'font-weight:600;letter-spacing:.4px;-webkit-text-stroke:1.8px #fff;paint-order:stroke fill;text-shadow:0 2px 0 #dcebfa,0 5px 7px rgba(90,150,215,.45),0 0 10px rgba(255,255,255,.9);' , settle: 3600, per: 0 },
  { img: '34-backyard-dusk-board', rect: [.1, .22, .9, .8], color: '#fff3d6', css: 'text-transform:uppercase;font-weight:700;letter-spacing:1.4px;text-shadow:1px 0 0 #7a3510,-1px 0 0 #7a3510,0 1px 0 #7a3510,0 -1px 0 #7a3510,0 2px 0 #7a3510,0 3px 2px rgba(60,25,5,.45);' , settle: 5500, per: 105 },
  { img: '39-underwater-board', rect: [.14, .18, .86, .8], color: '#fff', css: 'text-shadow:0 2px 6px rgba(0,70,140,.65),0 0 12px rgba(180,235,255,.7);' , settle: 4400, per: 0 },
  { img: '74-clean-notebook-board', rect: [.14, .1, .92, .88], color: '#2f3b55', css: 'filter:url(#penc);' , settle: 6200, per: 120 },
  { img: '49-haunted-window-board', rect: [.19, .33, .81, .83], color: '#efeaff', css: 'text-shadow:0 0 6px #b9a6ff,0 0 15px rgba(160,130,255,.85);' , settle: 2100, per: 0 },
  { img: '54-harvest-table-board', rect: [.15, .2, .85, .72], color: '#6b3410', css: 'text-shadow:0 1px 0 rgba(255,246,222,.9),0 0 6px rgba(255,246,222,.7);' , settle: 3300, per: 40 },
  { img: '59-fireplace-board', rect: [.1, .35, .9, .72], color: '#7a1c1c', css: 'text-shadow:0 1px 0 rgba(255,255,255,.75),0 0 6px rgba(255,255,255,.6);' , settle: 2900, per: 45 },
];
let HOOK = null; // in the game: {text, body, letters} = the real question text elements, whose letters the board animations drive
const penHost = (g) => (HOOK && HOOK.over) || g; // in the game the pen/brush lives in a layer above the question text
const baseBoard = (s, name) => (HOOK ? null : mk(s, name, BW / 2, BH2 / 2, BW, { z: 0 }));
const kOf = (el) => (el.getBoundingClientRect().width / (el.offsetWidth || 1)) || 1; // on-screen px per design px (the host is scaled in the game)
const grp = (s, D) => { const g = box(s, 'left:0;top:0;width:330px;height:248px;', 1); g.animate([{ opacity: 1 }, { opacity: 1, offset: (D - 700) / D }, { opacity: 0 }], { duration: D, fill: 'both' }); return g; };
function qtext(stage, rect, o) {
  if (HOOK) { // use the game's own text: same colour and glow, its letters, its layout
    const fl = (o.css || '').match(/filter:[^;]*/); if (fl) HOOK.text.style.cssText += ';' + fl[0]; // only the effect that needs the animation; the colour and type style come from the game's own stylesheet rule for this board, so nothing stays behind on the shared text element
    HOOK.letters.forEach((l) => { l.style.opacity = 1; }); // the game hides letters until its own kind shows them; here the animation decides
    return { el: HOOK.body, t: HOOK.text, letters: HOOK.letters, stage: HOOK.stage };
  }
  const el = box(stage, `left:${rect[0] * BW}px;top:${rect[1] * BH2}px;width:${(rect[2] - rect[0]) * BW}px;height:${(rect[3] - rect[1]) * BH2}px;display:flex;align-items:center;justify-content:center;text-align:center;`, o.z || 6);
  const t = document.createElement('div'); t.style.cssText = `font:700 ${o.size || 25}px/1.16 'Fredoka',system-ui,sans-serif;color:${o.color};${o.css || ''}`;
  const letters = [], words = QS.split(' ');
  words.forEach((wd, wi) => { const w = document.createElement('span'); w.style.cssText = 'display:inline-block;white-space:nowrap;'; [...wd].forEach((ch) => { const sp = document.createElement('span'); sp.textContent = ch; sp.style.display = 'inline-block'; w.appendChild(sp); letters.push(sp); }); t.appendChild(w); if (wi < words.length - 1) t.appendChild(document.createTextNode(' ')); });
  el.appendChild(t); return { el, t, letters, stage };
}
const lrect = (q, l) => { const a = l.getBoundingClientRect(), b = q.stage.getBoundingClientRect(), k = kOf(q.stage); return { x: (a.left - b.left + a.width / 2) / k, y: (a.top - b.top + a.height / 2) / k, w: a.width / k, h: a.height / k, bt: (a.bottom - b.top) / k, l: (a.left - b.left) / k }; };
const popLetters = (letters, t0, step, dur = 420, rise = 10) => letters.forEach((l, i) => l.animate([{ opacity: 0, transform: `translateY(${rise}px) scale(.3)` }, { opacity: 1, transform: 'translateY(-2px) scale(1.18)', offset: .6 }, { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration: dur, delay: t0 + i * step, fill: 'both', easing: 'ease-out' }));
const hideLetters = (letters) => letters.forEach((l) => { l.style.opacity = 0; });

def('b1', 'b', 7600, (s) => { const D = 7600; baseBoard(s, '03-midnight-sky-board'); const g = grp(s, D);
  const q = qtext(g, [.1, .3, .9, .78], { color: '#ffeaa8', size: 26, css: 'text-shadow:0 0 8px rgba(255,200,80,.85),0 0 18px rgba(255,160,40,.5);' }); hideLetters(q.letters);
  const R = q.letters.map((l) => lrect(q, l)), P = [[.2, .52], [.42, .4], [.64, .56], [.82, .44]].map((p) => [p[0] * BW, p[1] * BH2]), arr = [];
  P.forEach((p, i) => { const t0 = 300 + i * 280, rise = 700, x = p[0];
    const st = box(g, `left:${x - 1.5}px;top:0;width:3px;height:52px;background:linear-gradient(to top,rgba(255,255,255,0),#fff 45%,#ffd34d);border-radius:2px;box-shadow:0 0 8px #ffd34d;`, 4);
    st.animate([{ transform: 'translateY(262px)', opacity: 0 }, { transform: 'translateY(262px)', opacity: 0, offset: t0 / D }, { transform: 'translateY(262px)', opacity: 1, offset: (t0 + 10) / D }, { transform: `translateY(${p[1] - 26}px)`, opacity: 1, offset: (t0 + rise) / D, easing: 'ease-out' }, { transform: `translateY(${p[1] - 26}px)`, opacity: 0, offset: (t0 + rise + 60) / D }, { opacity: 0 }], { duration: D, fill: 'both' });
    arr.push(t0 + rise); const f = mk(g, '02-clink-flash', p[0], p[1], 60, { z: 5 }); seq(f, D, [[0, 0, 0, 0, 0, 0], [t0 + rise - 20, 0, 0, 0, .2, 0], [t0 + rise + 60, 0, 0, 20, 1.2, 1], [t0 + rise + 360, 0, 0, 55, .3, 0], [D, 0, 0, 55, .3, 0]]);
    burst(g, D, t0 + rise, p[0], p[1], 14, 62, () => dot(g, i % 2 ? '#fff4c0' : '#ffc93a', 4, p[0], p[1], true, 5), 900); });
  q.letters.forEach((l, i) => { let bi = 0, bd = 1e9; P.forEach((p, k) => { const d = Math.hypot(R[i].x - p[0], R[i].y - p[1]); if (d < bd) { bd = d; bi = k; } });
    const dl = arr[bi] + 40 + bd * 2.4; l.animate([{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1.35)', offset: .55 }, { opacity: 1, transform: 'scale(1)' }], { duration: 420, delay: dl, fill: 'both', easing: 'ease-out' });
    for (let k = 0; k < 2; k++) l.animate([{ textShadow: '0 0 0 rgba(255,255,255,0)', transform: 'scale(1)' }, { textShadow: '0 0 6px #fff,0 0 16px #ffd34d', transform: 'scale(1.14)', offset: .5 }, { textShadow: '0 0 0 rgba(255,255,255,0)', transform: 'scale(1)' }], { duration: 700, delay: 2900 + rnd() * (D - 4600) + k * 1200, fill: 'none', easing: 'ease-in-out', composite: 'replace' }); });
  for (let i = 0; i < 12; i++) { const r = R[Math.floor(rnd() * R.length)]; sparkle(g, r.x + (rnd() - .5) * 14, r.y - 8 - rnd() * 8, 13 + rnd() * 6, D, 2800 + i * 330, 500, 7); }
});
def('b2', 'b', 6400, (s) => { const D = 6400; baseBoard(s, '08-love-letter-board'); const g = grp(s, D);
  for (let i = 0; i < 16; i++) { const e = mk(g, '07-heart-eye', 0, 0, 12 + rnd() * 12, { z: 3 }), x0 = 40 + rnd() * 250, t0 = i * 330, sw = 6 + rnd() * 10;
    path(e, D, t0, t0 + 2900, (u) => ({ x: x0 + Math.sin(u * 7 + i) * sw, y: 236 - u * 200, r: Math.sin(u * 6 + i) * 20, op: fade(u, .15, .3) * .9 }), 24); }
  const q = qtext(g, [.16, .24, .84, .76], { color: '#a8174a', size: 26, css: 'text-shadow:0 1px 0 #fff,0 0 8px rgba(255,255,255,.9);' }); hideLetters(q.letters); popLetters(q.letters, 500, 45);
  sparkle(g, 165, 20, 22, D, 600, 700, 7); sparkle(g, 40, 40, 14, D, 1900, 600, 7); sparkle(g, 292, 42, 14, D, 3000, 600, 7);
});
def('b3', 'b', 7000, (s) => { const D = 7000; baseBoard(s, '11-green-hills-board'); const g = grp(s, D);
  const q = qtext(g, [.1, .16, .9, .62], { color: '#fff', size: 27, css: '-webkit-text-stroke:3.5px #fff;paint-order:stroke fill;text-shadow:0 2px 5px rgba(0,70,130,.35);' });
  const cols = [[255, 59, 48], [255, 149, 0], [255, 214, 10], [52, 199, 89], [10, 132, 255], [191, 90, 242]], eb = q.el.getBoundingClientRect(), st = s.getBoundingClientRect(), kk = kOf(s);
  const x0 = q.letters.reduce((m, l) => Math.min(m, l.getBoundingClientRect().left), 1e9), x1 = q.letters.reduce((m, l) => Math.max(m, l.getBoundingClientRect().right), 0);
  q.letters.forEach((l) => { const r = l.getBoundingClientRect(), f = Math.max(0, Math.min(1, ((r.left + r.width / 2) - x0) / (x1 - x0))) * 5, i = Math.min(4, Math.floor(f)), u = f - i, c = cols[i].map((v, k) => Math.round(v + (cols[i + 1][k] - v) * u)); l.style.color = `rgb(${c})`; });
  const TS = 400, TE = 2100, ex0 = (x0 - st.left) / kk - 6, ex1 = (x1 - st.left) / kk + 6;
  q.t.animate([{ clipPath: 'inset(-10px 100% -10px 0)' }, { clipPath: 'inset(-10px 100% -10px 0)', offset: TS / D, easing: 'ease-in-out' }, { clipPath: 'inset(-10px -6px -10px 0)', offset: TE / D }, { clipPath: 'inset(-10px -6px -10px 0)' }], { duration: D, fill: 'both' });
  const bar = box(g, `left:0;top:${(eb.top - st.top) / kk}px;width:3px;height:${eb.height / kk}px;background:linear-gradient(to bottom,transparent,#fff,transparent);box-shadow:0 0 10px #fff,0 0 20px #ffe27a;`, 8);
  bar.animate([{ transform: `translateX(${ex0}px)`, opacity: 0 }, { transform: `translateX(${ex0}px)`, opacity: 1, offset: TS / D, easing: 'ease-in-out' }, { transform: `translateX(${ex1}px)`, opacity: 1, offset: TE / D }, { transform: `translateX(${ex1}px)`, opacity: 0, offset: (TE + 80) / D }, { opacity: 0 }], { duration: D, fill: 'both' });
  q.letters.forEach((l, i) => l.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-2.5px)' }, { transform: 'translateY(0)' }], { duration: 1300, delay: TE + 200 + i * 70, iterations: 3, easing: 'ease-in-out' }));
  for (let i = 0; i < 9; i++) sparkle(g, 262 + rnd() * 50, 156 + rnd() * 30, 11 + rnd() * 10, D, 300 + i * 520, 600, 3);
});
def('b4', 'b', 7000, (s) => { const D = 7000; baseBoard(s, '17-spring-meadow-board'); const g = grp(s, D);
  // April: a soft spring shower, pink petals, and letters that sprout up like new shoots
  for (let i = 0; i < 34; i++) { const e = box(g, 'left:0;top:0;width:2.2px;height:15px;background:linear-gradient(to bottom,rgba(255,255,255,0),rgba(70,140,215,.95));border-radius:1px;', 2), x0 = 10 + rnd() * 310, t0 = rnd() * 4200, dur = 650 + rnd() * 250;
    path(e, D, t0, t0 + dur, (u) => ({ x: x0 - u * 22, y: -12 + u * 262, r: 14, op: u > .93 ? (1 - u) / .07 : 1 }), 6); }
  for (let i = 0; i < 6; i++) { const e = mk(g, '24-rose-petal', 0, 0, 14 + rnd() * 6, { z: 3 }), x0 = 20 + rnd() * 290, t0 = 500 + i * 900, sw = 14 + rnd() * 12;
    e.style.filter = 'hue-rotate(-20deg) saturate(.6) brightness(1.5)'; path(e, D, t0, t0 + 3400, (u) => ({ x: x0 + Math.sin(u * 5 + i) * sw, y: -10 + u * 256, r: u * 300, sx: .5 + .5 * Math.abs(Math.cos(u * 6 + i)), op: fade(u, .06, .1) * .9 }), 30); }
  const q = qtext(g, [.1, .14, .9, .62], { color: '#5a2d8c', size: 27, css: '-webkit-text-stroke:3px #fff7c9;paint-order:stroke fill;text-shadow:0 2px 4px rgba(60,20,110,.25);' }); hideLetters(q.letters);
  q.letters.forEach((l, i) => { l.style.transformOrigin = '50% 100%'; l.animate([{ opacity: 0, transform: 'scaleY(.05) scaleX(.8)' }, { opacity: 1, transform: 'scaleY(1.2) scaleX(1)', offset: .65 }, { opacity: 1, transform: 'scaleY(1)' }], { duration: 560, delay: 600 + i * 52, fill: 'both', easing: 'ease-out' }); });
  const R = q.letters.map((l) => lrect(q, l)); for (let i = 0; i < 10; i++) { const r = R[Math.floor(rnd() * R.length)]; sparkle(g, r.x, r.y - 10, 14, D, 1200 + i * 450, 500, 7); }
});
def('b5', 'b', 6400, (s) => { const D = 6400; baseBoard(s, '25-papel-picado-board'); const g = grp(s, D);
  const top = mk(g, '25-papel-picado-board', BW / 2, BH2 / 2, BW, { z: 1, clip: 'inset(0 0 72% 0)', origin: '50% 0' });
  top.animate([{ transform: 'skewX(0deg)' }, { transform: 'skewX(1.8deg)', offset: .25 }, { transform: 'skewX(-1.8deg)', offset: .75 }, { transform: 'skewX(0deg)' }], { duration: 3200, iterations: 2, easing: 'ease-in-out' });
  [[40, 36], [100, 30], [165, 34], [230, 30], [292, 36]].forEach((p, i) => sparkle(g, p[0], p[1], 16, D, 500 + i * 700, 600, 3));
  for (let i = 0; i < 6; i++) { const e = mk(g, '27-candy-sheet-' + i, 0, 0, 22, { z: 3 }), x0 = i % 2 ? 24 + i * 3 : 306 - i * 3, t0 = 800 + i * 760;
    path(e, D, t0, t0 + 1600, (u) => ({ x: x0, y: 205 - Math.sin(u * Math.PI) * 60 + u * 10, r: u * 360 * (i % 2 ? 1 : -1), op: fade(u, .1, .2) }), 22); }
  const q = qtext(g, [.1, .26, .9, .78], { color: '#7a1030', size: 27, css: '-webkit-text-stroke:2.5px #fff6cf;paint-order:stroke fill;' }); hideLetters(q.letters); popLetters(q.letters, 500, 45);
});
def('b6', 'b', 7000, (s) => { const D = 7000; baseBoard(s, '31-pool-deck-board'); const g = grp(s, D);
  const ring = mk(g, 'pool-ring', .855 * BW, .877 * BH2, .2656 * BW, { z: 2 });
  ring.animate([{ transform: 'translateY(0) rotate(0deg)' }, { transform: 'translateY(-4px) rotate(3deg)', offset: .25 }, { transform: 'translateY(2px) rotate(-3deg)', offset: .75 }, { transform: 'translateY(0) rotate(0deg)' }], { duration: 2400, iterations: 3, easing: 'ease-in-out' });
  const bg = box(g, 'left:36px;top:196px;width:44px;height:44px;', 2);
  bg.animate([{ transform: 'translateY(2px)' }, { transform: 'translateY(-4px)', offset: .5 }, { transform: 'translateY(2px)' }], { duration: 2000, iterations: 4, easing: 'ease-in-out' });
  const ball = mk(bg, 'beach-ball', 22, 20, 40, { z: 1 }); ball.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 9000, iterations: 1, easing: 'linear' });
  box(g, 'left:262px;top:-30px;width:110px;height:110px;border-radius:50%;background:radial-gradient(circle,rgba(255,245,160,.9),rgba(255,230,90,0) 70%);', 1).animate([{ opacity: .3, transform: 'scale(.9)' }, { opacity: .8, transform: 'scale(1.15)' }, { opacity: .3, transform: 'scale(.9)' }], { duration: 1800, iterations: 4, easing: 'ease-in-out' });
  for (let i = 0; i < 12; i++) sparkle(g, 10 + rnd() * 310, 216 + rnd() * 24, 9 + rnd() * 6, D, 200 + i * 430, 500, 3);
  const q = qtext(g, [.08, .16, .8, .66], { color: '#fff', size: 27, css: 'font-weight:600;letter-spacing:.4px;-webkit-text-stroke:1.8px #fff;paint-order:stroke fill;text-shadow:0 2px 0 #dcebfa,0 5px 7px rgba(90,150,215,.45),0 0 10px rgba(255,255,255,.9);' }); hideLetters(q.letters);
  q.letters.forEach((l, i) => l.animate([{ opacity: 0, transform: 'translateY(10px) scale(.55)' }, { opacity: 1, transform: 'translateY(-2px) scale(1.1)', offset: .6 }, { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration: 700, delay: 500 + i * 55, fill: 'both', easing: 'ease-out' }));
  q.letters.forEach((l, i) => l.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-2px)' }, { transform: 'translateY(0)' }], { duration: 2200, delay: 2600 + (i % 7) * 160, iterations: 2, easing: 'ease-in-out' }));
});
def('b7', 'b', 7600, (s) => { const D = 7600; baseBoard(s, '34-backyard-dusk-board'); const g = grp(s, D);
  for (let i = 0; i < 12; i++) { const x = 28 + i * 24.8, y = 22 + 11 * Math.sin((i / 11) * Math.PI), gl = box(g, `left:${x - 13}px;top:${y - 11}px;width:26px;height:26px;border-radius:50%;background:radial-gradient(circle,rgba(255,225,120,.95),rgba(255,200,60,0) 70%);`, 3), rows = [];
    for (let k = 0; k <= 20; k++) rows.push({ offset: k / 20, opacity: .35 + .65 * Math.pow(Math.max(0, Math.sin((k / 20) * Math.PI * 4 - i * .55)), 2) }); gl.animate(rows, { duration: D, fill: 'both', easing: 'linear' }); }
  for (let i = 0; i < 9; i++) { const e = dot(g, '#fff4a0', 4, 0, 0, true, 2), x0 = 40 + rnd() * 250, y0 = 90 + rnd() * 100, t0 = i * 420;
    path(e, D, t0, t0 + 2800, (u) => ({ x: x0 + Math.sin(u * 5 + i) * 18, y: y0 - u * 24 + Math.cos(u * 4 + i) * 10, op: fade(u, .2, .2) * (.5 + .5 * Math.sin(u * 22)) }), 40); }
  g.insertAdjacentHTML('beforeend', '<svg width="0" height="0" style="position:absolute"><filter id="paintJ" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="d"/><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="9" result="n2"/><feColorMatrix in="n2" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3.4 0 0 0 -.62" result="m"/><feComposite in="d" in2="m" operator="in"/></filter></svg>');
  const q = qtext(g, [.1, .22, .9, .72], { color: '#fff3d6', size: 25, css: 'text-transform:uppercase;font-weight:700;letter-spacing:1.4px;text-shadow:1px 0 0 #7a3510,-1px 0 0 #7a3510,0 1px 0 #7a3510,0 -1px 0 #7a3510,0 2px 0 #7a3510,0 3px 2px rgba(60,25,5,.45);' }); const R = q.letters.map((l) => lrect(q, l)), T0 = 800, ST = writingStep(7, R.length), N = R.length;
  q.letters.forEach((l, i) => l.animate([{ clipPath: 'inset(-4px 100% -4px 0)' }, { clipPath: 'inset(-4px -2px -4px 0)' }], { duration: 190, delay: T0 + i * ST, fill: 'both', easing: 'ease-out' }));
  // the paintbrush: tip at the bottom-left of the drawing, handle up and to the right
  const br = box(penHost(g), 'left:0;top:0;width:40px;height:66px;transform-origin:20px 64px;', 9);
  br.innerHTML = '<svg width="40" height="66" viewBox="0 0 40 66"><g stroke="#4a2a12" stroke-width="2" stroke-linejoin="round"><rect x="13" y="1" width="14" height="25" rx="6" fill="#d9482b"/><rect x="5" y="25" width="30" height="14" rx="2" fill="#c9ced6"/><path d="M4 39 H36 L37 58 Q36 64 30 64 H10 Q4 64 3 58Z" fill="#d8b27a"/><path d="M3.6 53 H36.4 L37 58 Q36 64 30 64 H10 Q4 64 3 58Z" fill="#fff3d6" stroke="none"/></g><path d="M9 28 V36 M16 28 V36 M24 28 V36 M31 28 V36" stroke="#8b929c" stroke-width="1.4"/><path d="M9 41 V52 M16 41 V52 M24 41 V52 M31 41 V52" stroke="#a9825a" stroke-width="1.2" stroke-opacity=".7"/></svg>';
  const ROT = 26, rows = [{ offset: 0, transform: `translate(380px,60px) rotate(${ROT}deg)`, opacity: 0 }, { offset: (T0 - 400) / D, transform: `translate(380px,60px) rotate(${ROT}deg)`, opacity: 0 }, { offset: (T0 - 330) / D, transform: `translate(${R[0].x + 80}px,${R[0].y + 20}px) rotate(${ROT}deg)`, opacity: 1 }];
  R.forEach((r, i) => { const t = T0 + i * ST + 95; rows.push({ offset: t / D, transform: `translate(${(r.x - 20).toFixed(1)}px,${(r.y + 4 - 64 + (i % 2 ? 2 : -2)).toFixed(1)}px) rotate(${ROT + (i % 2 ? 3 : -3)}deg)`, opacity: 1 }); });
  rows.push({ offset: (T0 + N * ST + 450) / D, transform: `translate(380px,20px) rotate(${ROT}deg)`, opacity: 1 }, { offset: (T0 + N * ST + 520) / D, transform: `translate(380px,20px) rotate(${ROT}deg)`, opacity: 0 }, { offset: 1, opacity: 0, transform: `translate(380px,20px) rotate(${ROT}deg)` });
  br.animate(rows, { duration: D, fill: 'both', easing: 'linear' });
  // little paint drips run down from the letters on the last line, each starting just after its letter is painted
  const lastBt = Math.max(...R.map((r) => r.bt)); let dk = 0;
  q.letters.forEach((l, i) => { const r = R[i]; if (r.bt < lastBt - 3 || /[?.,!]/.test(l.textContent) || (i * 7 + 3) % 3) return;
    const h = 7 + (dk % 3) * 4 + (i % 2) * 2, ts = (T0 + i * ST + 350 + dk * 40) / D, te = Math.min(.999, ts + (900 + (dk % 3) * 250) / D); dk++;
    const d = box(g, `left:${(r.x - 1.6).toFixed(1)}px;top:${(r.bt - 5).toFixed(1)}px;width:3.2px;height:0;background:#fff3d6;border-radius:0 0 2px 2px;box-shadow:0 1px 0 rgba(90,35,5,.5);`, 6);
    d.insertAdjacentHTML('beforeend', '<i style="position:absolute;left:-.9px;bottom:-3px;width:5px;height:5px;border-radius:50%;background:#fff3d6;box-shadow:0 1px 0 rgba(90,35,5,.5)"></i>');
    d.animate([{ height: '0px', opacity: 0, offset: 0 }, { height: '0px', opacity: 0, offset: ts }, { height: h + 'px', opacity: 1, offset: te, easing: 'ease-in' }, { height: h + 'px', opacity: 1, offset: 1 }], { duration: D, fill: 'both' }); });
});
def('b8', 'b', 8200, (s) => { const D = 8200; baseBoard(s, '39-underwater-board'); const g = grp(s, D);
  for (let i = 0; i < 3; i++) { const r = box(g, `left:${60 + i * 95}px;top:-10px;width:46px;height:260px;background:linear-gradient(180deg,rgba(255,255,255,.3),rgba(255,255,255,0));transform-origin:50% 0;`, 1);
    r.animate([{ transform: 'rotate(-8deg)', opacity: .2 }, { transform: 'rotate(8deg)', opacity: .5 }, { transform: 'rotate(-8deg)', opacity: .2 }], { duration: 3200 + i * 500, iterations: 3, easing: 'ease-in-out', delay: i * 300 }); }
  const q = qtext(g, [.14, .2, .86, .74], { color: '#fff', size: 28, css: 'text-shadow:0 2px 6px rgba(0,70,140,.65),0 0 12px rgba(180,235,255,.7);' });
  const cv = document.createElement('canvas'); cv.width = BW; cv.height = BH2; const cx = cv.getContext('2d'); cx.font = `700 28px 'Fredoka',system-ui,sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = '#000';
  q.letters.forEach((l) => { const r = lrect(q, l); cx.fillText(l.textContent, r.x, r.y + 1); });
  const data = cx.getImageData(0, 0, BW, BH2).data, pts = []; for (let y = 0; y < BH2; y += 4) for (let x = 0; x < BW; x += 4) if (data[(y * BW + x) * 4 + 3] > 140) pts.push([x, y]);
  const TF = 3700; q.el.animate([{ opacity: 0 }, { opacity: 0, offset: (TF - 100) / D }, { opacity: 1, offset: (TF + 600) / D }, { opacity: 1 }], { duration: D, fill: 'both' });
  pts.forEach((p, i) => { const sz = 8, e = box(g, `left:${-sz / 2}px;top:${-sz / 2}px;width:${sz}px;height:${sz}px;border-radius:50%;border:1.2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.3);box-sizing:border-box;`, 4);
    const t0 = rnd() * 1500, arr = 1500 + rnd() * 1500, t1 = TF + 500, sx = Math.max(10, Math.min(320, p[0] + (rnd() - .5) * 90)), ph = rnd() * 6, af = (arr - t0) / (t1 - t0);
    path(e, D, t0, t1, (u) => { if (u < af) { const v = u / af, e2 = 1 - Math.pow(1 - v, 2); return { x: lerp(sx, p[0], e2) + Math.sin(v * 7 + ph) * 9 * (1 - v), y: lerp(262, p[1], e2), sx: lerp(1.1 + rnd() * 0, .42, v), op: Math.min(1, v * 6) }; } return { x: p[0], y: p[1], sx: .42, op: u > .93 ? (1 - u) / .07 : 1 }; }, 40); });
  for (let i = 0; i < 16; i++) { const sz = 3 + rnd() * 4, e = box(g, `left:${-sz / 2}px;top:${-sz / 2}px;width:${sz}px;height:${sz}px;border-radius:50%;border:1px solid rgba(255,255,255,.9);background:rgba(255,255,255,.25);box-sizing:border-box;`, 3), x0 = 25 + rnd() * 280, t0 = TF + 200 + i * 250;
    path(e, D, t0, t0 + 2600, (u) => ({ x: x0 + Math.sin(u * 8 + i) * 7, y: 258 - u * 270, op: fade(u, .06, .2) }), 26); }
});
def('b9', 'b', 7600, (s) => { const D = 7600; baseBoard(s, '74-clean-notebook-board'); const g = grp(s, D);
  g.insertAdjacentHTML('beforeend', '<svg width="0" height="0" style="position:absolute"><filter id="penc" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="2" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="d"/><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="2" result="n2"/><feColorMatrix in="n2" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -.15" result="m"/><feComposite in="d" in2="m" operator="in"/></filter></svg>');
  const q = qtext(g, [.17, .2, .9, .78], { color: '#2f3b55', size: 29, css: 'filter:url(#penc);' }); const R = q.letters.map((l) => lrect(q, l)), T0 = 900, ST = writingStep(9, R.length), N = R.length;
  q.letters.forEach((l, i) => l.animate([{ clipPath: 'inset(-4px 100% -4px 0)' }, { clipPath: 'inset(-4px -2px -4px 0)' }], { duration: 210, delay: T0 + i * ST, fill: 'both', easing: 'ease-out' }));
  const pw = 50, ph = pw * 640 / 517, tx = .04 * pw, ty = .995 * ph, pc = box(penHost(g), `left:0;top:0;width:${pw}px;height:${ph}px;transform-origin:${tx}px ${ty}px;`, 9);
  const pi = mk(pc, '75-chunky-pencil', pw / 2, ph / 2, pw, {});
  const rows = [{ offset: 0, transform: 'translate(380px,40px) rotate(0deg)', opacity: 0 }, { offset: (T0 - 400) / D, transform: 'translate(380px,40px) rotate(0deg)', opacity: 0 }, { offset: (T0 - 330) / D, transform: `translate(${R[0].x + 90}px,${R[0].y + 10}px) rotate(0deg)`, opacity: 1 }];
  R.forEach((r, i) => { const t = T0 + i * ST + 110; rows.push({ offset: t / D, transform: `translate(${(r.x - tx).toFixed(1)}px,${(r.bt - 3 - ty + (i % 2 ? 2 : -1)).toFixed(1)}px) rotate(${i % 2 ? 3 : -2}deg)`, opacity: 1 }); });
  rows.push({ offset: (T0 + N * ST + 500) / D, transform: 'translate(380px,20px) rotate(0deg)', opacity: 1 }, { offset: (T0 + N * ST + 570) / D, transform: 'translate(380px,20px) rotate(0deg)', opacity: 0 }, { offset: 1, opacity: 0, transform: 'translate(380px,20px)' });
  pc.animate(rows, { duration: D, fill: 'both', easing: 'linear' });
  for (let i = 0; i < 5; i++) sparkle(g, R[R.length - 1].x + (rnd() - .5) * 120, R[R.length - 1].y - 14 - rnd() * 30, 14, D, T0 + N * ST + 700 + i * 260, 500, 7);
});
def('b10', 'b', 7800, (s) => { const D = 7800; baseBoard(s, '49-haunted-window-board'); const g = grp(s, D);
  const WD = !!(HOOK && HOOK.wide), BWX = WD ? 496 : BW, W0 = (WD ? .12 : .17) * BWX, W1 = (WD ? .88 : .83) * BWX, T0 = (WD ? .14 : .3) * BH2, T1 = (WD ? .86 : .85) * BH2; /* WD: the game's 2:1 board (496 x 248 units) */
  const q = qtext(g, [.19, .33, .81, .8], { color: '#efeaff', size: 26, css: 'text-shadow:0 0 6px #b9a6ff,0 0 15px rgba(160,130,255,.85);', z: 6 });
  const kk = kOf(s), x0 = (q.letters.reduce((m, l) => Math.min(m, l.getBoundingClientRect().left), 1e9) - s.getBoundingClientRect().left) / kk - 4, x1 = (q.letters.reduce((m, l) => Math.max(m, l.getBoundingClientRect().right), 0) - s.getBoundingClientRect().left) / kk + 4;
  const TS = 1000, TE = 1700; q.t.animate([{ clipPath: 'inset(-10px 100% -10px 0)' }, { clipPath: 'inset(-10px 100% -10px 0)', offset: TS / D, easing: 'cubic-bezier(.6,0,.9,.5)' }, { clipPath: 'inset(-10px -6px -10px 0)', offset: TE / D }, { clipPath: 'inset(-10px -6px -10px 0)' }], { duration: D, fill: 'both' });
  const bar = box(g, `left:0;top:${T0 + 6}px;width:4px;height:${T1 - T0 - 6}px;background:linear-gradient(to bottom,transparent,#fff 20%,#fff 80%,transparent);box-shadow:0 0 10px #fff,0 0 22px #b9a6ff,0 0 40px #8b6cff;transform-origin:50% 50%;`, 8);
  bar.animate([{ transform: `translateX(${x0}px) skewX(-18deg)`, opacity: 0 }, { transform: `translateX(${x0}px) skewX(-18deg)`, opacity: 1, offset: TS / D, easing: 'cubic-bezier(.6,0,.9,.5)' }, { transform: `translateX(${x1}px) skewX(-18deg)`, opacity: 1, offset: TE / D }, { transform: `translateX(${x1}px) skewX(-18deg)`, opacity: 0, offset: (TE + 60) / D }, { opacity: 0 }], { duration: D, fill: 'both' });
  const flashAt = (t, bolt) => { const fl = box(g, `left:${W0}px;top:${T0}px;width:${W1 - W0}px;height:${T1 - T0}px;background:rgba(205,195,255,.55);mix-blend-mode:screen;`, 2);
    fl.animate([{ opacity: 0 }, { opacity: 0, offset: t / D }, { opacity: .95, offset: (t + 40) / D }, { opacity: .15, offset: (t + 120) / D }, { opacity: .8, offset: (t + 200) / D }, { opacity: 0, offset: (t + 420) / D }, { opacity: 0 }], { duration: D, fill: 'both' });
    if (bolt) { let x = bolt * BWX / 330, y = T0, d = `M${x} ${y}`; while (y < T0 + 100) { x += (rnd() - .5) * 26; y += 14 + rnd() * 12; d += ` L${x.toFixed(1)} ${y.toFixed(1)}`; }
      const b = box(g, `left:0;top:0;width:${BWX}px;height:248px;filter:drop-shadow(0 0 4px #c9b8ff) drop-shadow(0 0 9px #8b6cff);`, 3); b.innerHTML = `<svg width="${BWX}" height="248"><path d="${d}" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="miter"/></svg>`;
      b.animate([{ opacity: 0 }, { opacity: 0, offset: t / D }, { opacity: 1, offset: (t + 30) / D }, { opacity: .2, offset: (t + 130) / D }, { opacity: 1, offset: (t + 190) / D }, { opacity: 0, offset: (t + 320) / D }, { opacity: 0 }], { duration: D, fill: 'both' }); } };
  flashAt(TS - 40, 0); flashAt(3300, 140); flashAt(4900, 210); flashAt(6300, 110);
});
def('b11', 'b', 7000, (s) => { const D = 7000; baseBoard(s, '54-harvest-table-board'); const g = grp(s, D);
  const cols = ['#e8501a', '#f2a31b', '#c8321e', '#d98a14', '#b5481a'];
  for (let i = 0; i < 16; i++) { const sz = 9 + rnd() * 6, e = box(g, `left:0;top:0;width:${sz}px;height:${sz}px;background:${pick(cols)};border-radius:0 100% 0 100%;border:1px solid rgba(90,40,10,.6);`, 2), left = i % 2 === 0, x0 = left ? 16 + rnd() * 34 : 280 + rnd() * 36, t0 = i * 400, d = rnd() > .5 ? 1 : -1;
    path(e, D, t0, t0 + 3000, (u) => ({ x: x0 + Math.sin(u * 5 + i) * 10 * d, y: -14 + u * 270, r: u * 400 * d + Math.sin(u * 9) * 40, op: fade(u, .06, .15) }), 32); }
  const q = qtext(g, [.17, .24, .83, .7], { color: '#6b3410', size: 27, css: 'text-shadow:0 1px 0 rgba(255,246,222,.9),0 0 6px rgba(255,246,222,.7);' }); hideLetters(q.letters);
  q.letters.forEach((l, i) => l.animate([{ opacity: 0, transform: 'translateY(-10px) scale(1.2)' }, { opacity: 1, transform: 'translateY(2px) scale(1)', offset: .65 }, { opacity: 1, transform: 'translateY(0)' }], { duration: 650, delay: 500 + i * 50, fill: 'both', easing: 'ease-out' }));
});
def('b12', 'b', 7000, (s) => { const D = 7000; baseBoard(s, '59-fireplace-board'); const g = grp(s, D);
  const WD = !!(HOOK && HOOK.wide), gl = box(g, `left:${WD ? -25 : 70}px;top:${WD ? 135 : 172}px;width:190px;height:130px;border-radius:50%;background:radial-gradient(circle,rgba(255,150,40,.85),rgba(255,100,0,0) 70%);`, 1), rows = [];
  for (let k = 0; k <= 30; k++) rows.push({ offset: k / 30, opacity: .35 + .5 * Math.abs(Math.sin(k * 1.7)) * (.6 + .4 * Math.sin(k * .5)), transform: `scale(${.92 + .12 * Math.abs(Math.sin(k * 1.1))})` }); gl.animate(rows, { duration: D, fill: 'both', easing: 'linear' });
  for (let i = 0; i < 10; i++) { const e = dot(g, i % 2 ? '#ffb347' : '#ff7a2b', 3 + rnd() * 2, 0, 0, true, 3), x0 = (WD ? 50 : 140) + rnd() * 50, t0 = i * 520;
    path(e, D, t0, t0 + 1800, (u) => ({ x: x0 + Math.sin(u * 7 + i) * 12, y: (WD ? 228 : 232) - u * 70, op: fade(u, .05, .45) }), 24); }
  const gc = ['#ff4b4b', '#5bd66b', '#ffd23f', '#4aa3ff']; for (let i = 0; i < (WD ? 21 : 14); i++) { const x = 18 + i * 23, y = 18 + 7 * Math.sin(i * .9), dd = dot(g, gc[i % 4], 7, x, y, true, 3), r = []; for (let k = 0; k <= 20; k++) r.push({ offset: k / 20, opacity: .3 + .7 * Math.pow(Math.max(0, Math.sin(k / 20 * Math.PI * 5 - i * .6)), 2) }); dd.animate(r, { duration: D, fill: 'both', easing: 'linear' }); }
  const q = qtext(g, [.1, .4, .9, .7], { color: '#7a1c1c', size: 26, css: 'text-shadow:0 1px 0 rgba(255,255,255,.75),0 0 6px rgba(255,255,255,.6);' }); hideLetters(q.letters); popLetters(q.letters, 500, 45);
});

const flap = (s, D, nameA, nameB, w, x0, y0, x1, y1, t0, t1, bob = 6, flip = false) => {
  const a = mk(s, nameA, 0, 0, w, { z: 4, flip }), b = mk(s, nameB, 0, 0, w, { z: 4, flip }), n = Math.max(2, Math.round((t1 - t0) / 150));
  const mkp = (u) => ({ x: lerp(x0, x1, u), y: lerp(y0, y1, u) + Math.sin(u * 12) * bob, r: Math.sin(u * 12 + 1) * 4, op: fade(u, .05, .05) });
  const pa = path(a, D, t0, t1, mkp, 40), pb = path(b, D, t0, t1, mkp, 40);
  // alternate wings: a visible on even beats, b on odd
  [[a, 0], [b, 1]].forEach(([e, k]) => { const f = []; const total = Math.round(D / 140); for (let i = 0; i <= total; i++) f.push({ offset: Math.min(1, i / total), opacity: (i % 2 === k) ? 1 : 0, easing: 'steps(1, end)' }); e.style.opacity = '';
    e.animate(f, { duration: D, fill: 'both', composite: 'accumulate' }); });
  return [a, b];
};

/* ================= FLAIRS (300 x 440): items circle the player card, then a big burst, like the game's own flairs ================= */
const FD = 2300, FC = { x: 150, y: 215, w: 184, h: 84, vt: -24, vb: 466, vl: 10, vr: 290 }; // vt/vb/vl/vr: the screen's top, bottom, left and right in flair units (falling items cross all of it)
let NOCARD = false; // in the game the real winner card is on screen, so the stand-in card is not drawn
function fcard(g, D) { if (NOCARD) return null; const c = box(g, `left:${FC.x - FC.w / 2}px;top:${FC.y - FC.h / 2}px;width:${FC.w}px;height:${FC.h}px;border-radius:16px;background:var(--cardbg);border:3px solid var(--cardline);display:flex;align-items:center;gap:12px;padding:0 14px;box-sizing:border-box;font:700 15px Fredoka,system-ui,sans-serif;color:var(--cardfg);`, 5);
  c.innerHTML = '<span style="width:50px;height:50px;border-radius:11px;background:linear-gradient(135deg,#ffd9a0,#ff9f6a);display:block;flex:none"></span><span style="line-height:1.25">Alex<br><small style="font-weight:600;opacity:.65">1st place</small></span>';
  c.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1.05)', opacity: 1, offset: 350 / D }, { transform: 'scale(1)', offset: 500 / D }, { transform: 'scale(1)', offset: (FD - 160) / D }, { transform: 'scale(1.06,.96)', offset: (FD - 40) / D }, { transform: 'scale(0,1)', offset: (FD + 90) / D }, { transform: 'scale(1.04)', offset: (FD + 260) / D }, { transform: 'scale(1)', offset: (FD + 340) / D }, { transform: 'scale(1)', opacity: 1, offset: (D - 700) / D }, { transform: 'scale(1)', opacity: 0 }], { duration: D, fill: 'both' }); return c; }
function forbit(g, D, sp) {
  const x0 = FC.x - FC.w / 2 - 9, y0 = FC.y - FC.h / 2 - 9, w = FC.w + 18, h = FC.h + 18, P = 2 * (w + h);
  const at = (u) => { let d = (((u % 1) + 1) % 1) * P; if (d < w) return [d, 0]; if ((d -= w) < h) return [w, d]; if ((d -= h) < w) return [w - d, h]; d -= w; return [0, h - d]; };
  for (let k = 0; k < sp.items; k++) { const e = mk(g, sp.pics[k % sp.pics.length], 0, 0, sp.size, { z: 6 }), off = k / sp.items, ph = rnd() * 6.28;
    path(e, D, 0, FD, (u) => { const t = u * FD, [px, py] = at(off + t / sp.lap), s2 = t / 1000 * 6 + ph; let sc = 1, rot = 0, sx = 1, dy = 0, op = 1;
      switch (sp.move) { case 'twinkle': sc = .85 + .25 * Math.sin(s2 * 1.6); rot = Math.sin(s2) * 25; break; case 'pulse': sc = .85 + .25 * Math.abs(Math.sin(s2 * 1.2)); break;
        case 'spin': rot = t / 1000 * 120 + ph * 20; break; case 'bob': dy = Math.sin(s2 * 1.5) * 4; rot = Math.sin(s2) * 10; break; case 'glow': op = .55 + .45 * Math.abs(Math.sin(s2 * .9)); sc = .95 + .1 * Math.sin(s2 * 2); dy = Math.sin(s2) * 3; break;
        case 'tangent': { const A = at(off + t / sp.lap + .015), B = at(off + t / sp.lap - .015); rot = Math.atan2(A[1] - B[1], A[0] - B[0]) * 180 / Math.PI + (sp.tang || 0); dy = Math.sin(s2 * 2) * 2; break; } }
      return { x: x0 + px, y: y0 + py + dy, r: rot, sx: sc * sx, sy: sc, op: op * Math.min(1, u * 14, (1 - u) * 16) }; }, Math.round(FD / 14)); }
}
/* burst helpers: t0 = burst start (ms), each particle is a function of time */
function fradial(g, D, t0, o) { for (let i = 0; i < o.n; i++) { const e = mk(g, pick(o.pics), 0, 0, o.size * (.7 + rnd() * .6), { z: 7 }), ang = rnd() * 6.2832, v = (o.r || 200) * (.35 + rnd() * .75), sp = (rnd() > .5 ? 1 : -1) * (200 + rnd() * 500), L = o.life * (.75 + rnd() * .5), dl = rnd() * (o.stagger || 120);
  path(e, D, t0 + dl, t0 + dl + L, (u) => { const tt = u * L / 1000; return { x: FC.x + Math.cos(ang) * v * Math.min(1, tt * 1.4) * (o.spread || 1.2), y: FC.y + Math.sin(ang) * v * Math.min(1, tt * 1.4) + (o.grav || 0) * tt * tt, r: tt * sp, sx: 1 - u * .25, op: fade(u, .02, .3) }; }, 24); } }
function fup(g, D, t0, o) { for (let i = 0; i < o.n; i++) { const e = mk(g, pick(o.pics), 0, 0, o.size * (.7 + rnd() * .6), { z: 7 }), x0 = 20 + rnd() * 260, dl = rnd() * (o.stagger || 900), L = (o.life || 3000) * (.8 + rnd() * .4), sw = 14 + rnd() * 22, ph = rnd() * 6;
  path(e, D, t0 + dl, t0 + dl + L, (u) => ({ x: x0 + Math.sin(u * 7 + ph) * sw, y: lerp(FC.y + 40 + rnd() * 0, -30, u) + (o.start || 0) * (1 - u), r: Math.sin(u * 5 + ph) * 18, sx: .7 + .3 * u, op: fade(u, .12, .25) }), 30); } }
function ffall(g, D, t0, o) { for (let i = 0; i < o.n; i++) { const e = mk(g, pick(o.pics), 0, 0, o.size * (.75 + rnd() * .5), { z: 7 }), x0 = FC.vl + rnd() * (FC.vr - FC.vl), dl = rnd() * (o.stagger || 1200), L = (o.life || 3000) * (.8 + rnd() * .4) * Math.max(1, (FC.vb - FC.vt) / 490), sw = o.sway == null ? 18 : o.sway, ph = rnd() * 6, tum = o.tumble;
  path(e, D, t0 + dl, t0 + dl + L, (u) => ({ x: x0 + Math.sin(u * 5 + ph) * sw, y: lerp(FC.vt, FC.vb, u), r: u * (o.spin == null ? 280 : o.spin) * (i % 2 ? 1 : -1), sx: tum ? Math.cos(u * 9 + ph) : 1, sy: 1, op: fade(u, .05, .03) }), 34); } }
const FL = {};

/* temporary code-drawn daisy (real art to replace) */
(() => { const pet = Array.from({ length: 12 }, (_, i) => `<ellipse cx="50" cy="24" rx="9.5" ry="22" transform="rotate(${i * 30} 50 50)" fill="#fff" stroke="#b9c7dc" stroke-width="2.2"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${pet}<circle cx="50" cy="50" r="12" fill="#ffcf2e" stroke="#c98a00" stroke-width="2.5"/></svg>`;
  if (A['daisy2']) A['daisy'] = A['daisy2']; })();
/* a big rainbow band that fills in left to right across the sky (temporary code-drawn art) */
function frainbow(g, D, t0, t1) {
  /* a curved slice of a half rainbow sweeping from the top left down to the bottom right, running off the edges at both ends */
  const cols = ['#ff3b3b', '#ff8a1f', '#ffd21f', '#3fcf5a', '#2f9bff', '#8a4bff'], cx = -200, cy = 600, wrap = box(g, 'left:0;top:0;width:300px;height:440px;', 4), rad = Math.PI / 180;
  const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 300 440'); svg.setAttribute('width', 300); svg.setAttribute('height', 440); svg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible';
  cols.forEach((c, i) => { const r = 600 - i * 17, a0 = -76 * rad, a1 = -12 * rad, p = document.createElementNS(ns, 'path'); p.setAttribute('d', `M ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}`); p.setAttribute('pathLength', '1'); p.setAttribute('fill', 'none'); p.setAttribute('stroke', c); p.setAttribute('stroke-width', '17.5'); svg.appendChild(p); });
  wrap.appendChild(svg); wrap.animate([{ clipPath: 'inset(0 100% 0 0)', offset: 0 }, { clipPath: 'inset(0 100% 0 0)', offset: t0 / D, easing: 'ease-out' }, { clipPath: 'inset(0 0% 0 0)', offset: (t0 + 1300) / D }, { clipPath: 'inset(0 0% 0 0)', offset: 1 }], { duration: D, fill: 'both' }); wrap.animate([{ opacity: 1, offset: 0 }, { opacity: 1, offset: (t1 - 700) / D }, { opacity: 0, offset: t1 / D }, { opacity: 0, offset: 1 }], { duration: D, fill: 'both' }); return wrap; }
/* temporary code-drawn poofy dandelion puff, no stem */
(() => { const cs = []; for (let i = 0; i < 11; i++) { const a = i / 11 * 6.2832; cs.push([50 + 29 * Math.cos(a), 50 + 29 * Math.sin(a), 17]); } for (let i = 0; i < 6; i++) { const a = i / 6 * 6.2832 + .5; cs.push([50 + 14 * Math.cos(a), 50 + 14 * Math.sin(a), 17]); } cs.push([50, 50, 19]);
  const out = cs.map(([x, y, r]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r + 3.4}" fill="#7a3b17"/>`).join(''), fill = cs.map(([x, y, r]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#fff"/>`).join('');
  const sh = '<defs><radialGradient id="pg" cx=".4" cy=".35" r=".8"><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#b9b3dc" stop-opacity=".55"/></radialGradient></defs><circle cx="50" cy="50" r="46" fill="url(#pg)"/><circle cx="50" cy="50" r="5.5" fill="#d8a066" stroke="#7a3b17" stroke-width="2"/>';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${out}${fill}${sh}</svg>`; A['puff'] = { w: 100, h: 100, u: 'data:image/svg+xml;utf8,' + encodeURIComponent(svg) }; })();
/* two-frame wing flap on a group, so the fade of the flight path and the frame swap don't fight */
function flap2(g, D, names, w, x0, y0, x1, y1, t0, t1, bob, flip) {
  const grp = box(g, 'left:0;top:0;width:0;height:0;', 12); grp.dataset.flip = flip ? '-1' : '1';
  const fr = names.map((n) => mk(grp, n, 0, 0, w, { z: 1 })), n = fr.length, cyc = []; for (let i = 0; i < n; i++) cyc.push(i); for (let i = n - 2; i > 0; i--) cyc.push(i);
  path(grp, D, t0, t1, (u) => ({ x: lerp(x0, x1, u), y: lerp(y0, y1, u) + Math.sin(u * 10) * bob, r: Math.sin(u * 10 + 1) * 5, op: fade(u, .05, .05) }), 48);
  const beat = 85, total = Math.ceil(D / beat);
  fr.forEach((e, k) => { const f = []; for (let i = 0; i <= total; i++) f.push({ offset: Math.min(1, i / total), opacity: cyc[i % cyc.length] === k ? 1 : 0, easing: 'steps(1, end)' }); e.animate(f, { duration: D, fill: 'both' }); });
}
def('f1', 'f', FD + 4300, (s) => { const D = FD + 4300, g = box(s, 'left:0;top:0;width:300px;height:440px;', 1), cf = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => '05-gold-and-silver-confetti-sheet-' + i); fcard(g, D);
  forbit(g, D, { pics: cf, move: 'twinkle', lap: 2400, size: 18, items: 14 });
  fradial(g, D, FD, { pics: cf, n: 46, size: 14, r: 250, grav: 520, life: 2000 });
  /* fireworks in the sky, one after another */
  [[70, 90, 0], [232, 120, 380], [150, 55, 760], [60, 330, 1100], [240, 320, 1400]].forEach(([cx, cy, dl]) => { const t0 = FD + 150 + dl, c = sparkle(g, cx, cy, 46, D, t0, 500, 8);
    for (let i = 0; i < 10; i++) { const e = mk(g, '04-gold-sparkle', 0, 0, 16 + rnd() * 6, { z: 8 }), a = i / 10 * 6.283 + rnd() * .3, v = 44 + rnd() * 26;
      path(e, D, t0, t0 + 900, (u) => ({ x: cx + Math.cos(a) * v * Math.sqrt(u), y: cy + Math.sin(a) * v * Math.sqrt(u) + 30 * u * u, r: u * 120, sx: 1 - u * .5, op: fade(u, .05, .45) }), 14); } });
  ffall(g, D, FD + 200, { pics: cf, n: 26, size: 14, life: 2400, stagger: 1300, tumble: true, spin: 360 }); });
def('f2', 'f', FD + 5000, (s) => { const D = FD + 5000, g = box(s, 'left:0;top:0;width:300px;height:440px;', 1), hs = [0, 1, 2, 3].map((i) => '09-paper-hearts-sheet-' + i); fcard(g, D);
  forbit(g, D, { pics: hs, move: 'pulse', lap: 2400, size: 28, items: 8 });
  ffall(g, D, FD, { pics: hs, n: 38, size: 24, life: 3300, stagger: 1500, sway: 26, spin: 120 }); });
def('f3', 'f', FD + 5200, (s) => { const D = FD + 5200, g = box(s, 'left:0;top:0;width:300px;height:440px;', 1), cl = [0, 1, 2, 3].map((i) => '13-clover-sheet-' + i); fcard(g, D);
  forbit(g, D, { pics: cl, move: 'spin', lap: 2800, size: 26, items: 10 });
  frainbow(g, D, FD, FD + 4600);
  fradial(g, D, FD, { pics: ['04-gold-sparkle'], n: 14, size: 24, r: 120, life: 900 });
  ffall(g, D, FD + 100, { pics: cl, n: 32, size: 24, life: 3300, stagger: 1500, sway: 22 }); });
def('f4', 'f', FD + 5600, (s) => { const D = FD + 5600, g = box(s, 'left:0;top:0;width:300px;height:440px;', 1); fcard(g, D);
  forbit(g, D, { pics: ['daisy', '20-daffodil'], move: 'bob', lap: 3000, size: 28, items: 10 });
  /* rain falls from the top of the screen to the bottom while flowers pop up from the bottom edge, then sink back down */
  const vt = FC.vt, vb = FC.vb, vl = FC.vl, vr = FC.vr, fall = (vb - vt + 30) / 0.85;
  for (let i = 0; i < 280; i++) { const x0 = vl - 20 + rnd() * (vr - vl + 40), t0 = FD + rnd() * 3500, L = fall * (.85 + rnd() * .3), len = 15 + rnd() * 10, sl = 14 + rnd() * 10;
    const e = box(g, `left:${-2}px;top:${-len / 2}px;width:4px;height:${len}px;background:linear-gradient(rgba(190,230,255,.15),#6ec0ff 70%,#3d97f0);border-radius:2px 2px 3px 3px;`, 6);
    path(e, D, t0, t0 + L, (u) => ({ x: x0 + sl * u * (L / 1000) * .6, y: lerp(vt - 30, vb + 10, u), r: 9, op: u > .96 ? 0 : .85 }), 4); }
  // drawn flowers in different colours, each centred on its stem
  const cols = ['#ff6fa5', '#b57bff', '#ff9a3c', '#ff4b5c', '#ffd23f', '#5aa7ff', '#ffffff', '#ff8fd0'], OL = '#4a2434';
  const flowerSvg = (k, c) => { let b;
    if (k === 0) b = Array.from({ length: 6 }, (_, i) => `<circle cx="${50 + 24 * Math.cos(i * 1.0472)}" cy="${50 + 24 * Math.sin(i * 1.0472)}" r="19" fill="${c}" stroke="${OL}" stroke-width="3.5"/>`).join('') + `<circle cx="50" cy="50" r="13" fill="#ffd23f" stroke="${OL}" stroke-width="3.5"/><circle cx="46" cy="46" r="4" fill="#fff6b0"/>`;
    else if (k === 1) b = `<path d="M27 62 Q20 32 31 22 L42 38 L50 18 L58 38 L69 22 Q80 32 73 62 Q50 86 27 62Z" fill="${c}" stroke="${OL}" stroke-width="3.5" stroke-linejoin="round"/><path d="M38 44 Q36 58 42 68" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="5" stroke-linecap="round"/>`;
    else b = Array.from({ length: 10 }, (_, i) => `<ellipse cx="50" cy="26" rx="9" ry="21" transform="rotate(${i * 36} 50 50)" fill="${c}" stroke="${OL}" stroke-width="3"/>`).join('') + `<circle cx="50" cy="50" r="12" fill="#ffb61e" stroke="${OL}" stroke-width="3.5"/>`;
    return `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow:visible">${b}</svg>`; }, N = 9;
  for (let i = 0; i < N; i++) { const sz = 54 + rnd() * 22, x = vl + 26 + (i + .15 + rnd() * .7) / N * (vr - vl - 52), H = sz * 1.05 + 16 + rnd() * 46, t0 = FD + 300 + rnd() * 1900, R = 520, T1 = t0 + R + 1500 + rnd() * 700, T2 = T1 + 650, ph = rnd() * 6;
    const e = box(g, `left:${-sz / 2}px;top:${-sz / 2}px;width:${sz}px;height:${sz}px;`, 7); e.innerHTML = `<i style="position:absolute;left:${sz / 2 - 2.5}px;top:${sz / 2}px;width:5px;height:700px;background:linear-gradient(90deg,#3f9b3c,#7bd05a,#3f9b3c);border-radius:3px"></i><div style="position:absolute;inset:0">${flowerSvg(i % 3, cols[(i * 3 + 1) % cols.length])}</div>`; // the stem is part of the flower, so it can never lag behind it (it runs on down past the bottom of the screen)
    path(e, D, t0, T2, (u) => { const ms = u * (T2 - t0); let y, sc = 1;
      if (ms < R) { const q = ms / R, bk = 1 + 2.2 * Math.pow(q - 1, 3) + 1.2 * Math.pow(q - 1, 2); y = lerp(vb + sz * .7, vb - H, bk); sc = .5 + .5 * Math.min(1, q * 1.4); }
      else if (ms < T1 - t0) { y = vb - H + Math.sin((ms - R) / 1000 * 3 + ph) * 3; }
      else { const q = (ms - (T1 - t0)) / (T2 - T1); y = lerp(vb - H, vb + sz * .7, q * q); }
      return { x: x + Math.sin(ms / 1000 * 2.2 + ph) * 3, y, r: Math.sin(ms / 1000 * 2 + ph) * 4, sx: sc, op: 1 }; }, Math.round((T2 - t0) / 18)); } });
def('f5', 'f', FD + 4800, (s) => { const D = FD + 4800, g = box(s, 'left:0;top:0;width:300px;height:440px;', 1), cd = [0, 1, 2, 3, 4, 5].map((i) => '27-candy-sheet-' + i); fcard(g, D);
  forbit(g, D, { pics: ['26-star-pi-ata', '62-donkey-pinata'], move: 'bob', lap: 3000, size: 32, items: 6 });
  /* big donkey pinata: drops in and keeps hanging from its string, swings, then splits from the top of its back down; both halves keep dangling while candy spills */
  const W = 190, H = W * A['62-donkey-pinata'].h / A['62-donkey-pinata'].w, PX = 150, PY = 18, tc = 1500, L = 4300, BK = .27;
  const pl = 'polygon(38% -5%,56% -5%,56% 27%,38% 27%)', cl = 'polygon(-5% -5%,38% -5%,38% 27%,51% 27%,57% 36%,47% 48%,58% 62%,48% 80%,55% 105%,-5% 105%)', cr = 'polygon(56% -5%,105% -5%,105% 105%,55% 105%,48% 80%,58% 62%,47% 48%,57% 36%,51% 27%,56% 27%)';
  const rot = (x, y, d) => { const a = d * Math.PI / 180; return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]; };
  /* whole piñata state at time tt: swing angle about the string pivot; halves additionally open about the crack's top (the back) */
  const st = (tt, open) => { const e = Math.min(1, tt / 480), ee = 1 - Math.pow(1 - e, 3), sc = .35 + .65 * ee, py = PY + lerp(-170, 0, ee); let th = 0;
    if (tt > 480) th = 11 * Math.exp(-(tt - 480) / 1500) * Math.sin((tt - 480) / 150); if (tt > tc - 240 && tt < tc + 40) th += Math.sin(tt * .09) * 3;
    const Lc = H / 2 * sc, vb = BK * H * sc, vc = [0, Lc], dv = rot(0, Lc - vb, open), v = [dv[0], vb + dv[1]], [wx, wy] = rot(v[0], v[1], th); return { x: PX + wx, y: py + wy, r: th + open, sc }; };
  const opn = (tt) => { const q = Math.max(0, (tt - tc) / 700); return 14 * (1 - Math.pow(1 - Math.min(1, q), 2)) + (q > 1 ? Math.sin((tt - tc) / 260) * 2.5 * Math.exp(-(tt - tc - 700) / 900) : 0); };
  [[pl, 0], [cl, 1], [cr, -1]].forEach(([clip, dir]) => { const e = mk(g, '62-donkey-pinata', 0, 0, W, { z: 9, clip });
    path(e, D, FD, FD + L, (u) => { const tt = u * L, b = st(tt, dir * opn(tt)), op = (dir && tt > tc + 2300) ? Math.max(0, 1 - (tt - tc - 2300) / 400) : (!dir && tt > tc + 2300 ? Math.max(0, 1 - (tt - tc - 2300) / 400) : 1); return { x: b.x, y: b.y, r: b.r, sx: b.sc, op }; }, 150); });
  const cx0 = PX, cy0 = PY + H * .62;
  sparkle(g, cx0, PY + H * .3, 90, D, FD + tc, 600, 10);
  for (let i = 0; i < 80; i++) { const e = mk(g, pick(cd), 0, 0, 15 + rnd() * 6, { z: 8 }), t0 = FD + tc + 100 + rnd() * 1500, vx = (rnd() - .5) * 330, vy = -30 + rnd() * 110, x0 = cx0 + (rnd() - .5) * 90, y0 = cy0 + rnd() * 60, sp = (rnd() - .5) * 700, LL = 1500;
    path(e, D, t0, t0 + LL, (u) => { const tt = u * LL / 1000; return { x: x0 + vx * tt, y: y0 + vy * tt + 640 * tt * tt, r: tt * sp, op: u > .9 ? (1 - u) / .1 : 1 }; }, 28); } });
def('f6', 'f', FD + 4800, (s) => { const D = FD + 4800, g = box(s, 'left:0;top:0;width:300px;height:440px;', 1); fcard(g, D);
  forbit(g, D, { pics: ['beach-ball'], move: 'spin', lap: 2800, size: 28, items: 8 });
  fradial(g, D, FD, { pics: ['04-gold-sparkle'], n: 12, size: 22, r: 110, life: 800 });
  [[0, 46, 3, 1], [350, 36, 4, -1], [700, 56, 3, 1], [1100, 30, 5, -1], [1500, 42, 3, 1]].forEach(([dl, sz, k, dir], i) => { const e = mk(g, 'beach-ball', 0, 0, sz, { z: 7 }), L = 3000;
    path(e, D, FD + dl, FD + dl + L, (u) => { const b = Math.abs(Math.sin(u * Math.PI * k)); return { x: dir > 0 ? lerp(-40, 340, u) : lerp(340, -40, u), y: 420 - sz / 2 - b * (190 * (1 - u * .4)), r: u * 800 * dir, op: fade(u, .03, .03) }; }, 80); }); });
def('f7', 'f', FD + 4200, (s) => { const D = FD + 4200, g = box(s, 'left:0;top:0;width:300px;height:440px;', 1); fcard(g, D);
  const bl = [0, 1, 2].map((i) => '35-water-balloon-sheet-' + i);
  forbit(g, D, { pics: bl, move: 'bob', lap: 3200, size: 30, items: 9 });
  /* single balloons fly in diagonally from either side at different times, heights and angles, and each bursts on its own */
  [[0, -1, 40, 105, 190, 1], [380, 1, 130, 205, 90, 0], [900, 1, 20, 120, 300, 0], [1250, -1, 180, 95, 330, 1], [1800, -1, 20, 170, 120, 0], [2150, 1, 90, 190, 250, 0], [2600, -1, 100, 130, 215, 0]].forEach(([dl, side, sy, px, py, splat], k) => {
    const T0 = FD + dl, TL = 650 + (k % 3) * 120, sx = side < 0 ? -34 : 334, e = mk(g, bl[k % 3], 0, 0, 40, { z: 8 });
    path(e, D, T0, T0 + TL, (u) => { const v = u * u * .55 + u * .45; return { x: lerp(sx, px, v), y: lerp(sy, py, v), r: side * -14 + Math.sin(u * 8) * 6, sx: 1 + .25 * Math.max(0, (u - .85) / .15), op: u > .97 ? 0 : 1 }; }, 30);
    const tp = T0 + TL;
    for (let i = 0; i < 16; i++) { const sz = 5 + rnd() * 5, d = dot(g, '#54b9ff', sz, px, py, false, 8), a = rnd() * 6.283, v = 60 + rnd() * 90, LL = 700 + rnd() * 300;
      path(d, D, tp, tp + LL, (u) => { const tt = u * LL / 1000; return { x: Math.cos(a) * v * tt, y: Math.sin(a) * v * tt + 380 * tt * tt, op: fade(u, .02, .45) }; }, 16); } }); });
def('f8', 'f', FD + 4400, (s) => { const D = FD + 4400, g = box(s, 'left:0;top:0;width:300px;height:440px;', 1), sb = [0, 1, 2].map((i) => '40-surfboard-sheet-' + i); fcard(g, D);
  forbit(g, D, { pics: sb, move: 'tangent', tang: 90, lap: 2600, size: 24, items: 7 });
  /* one big wave rolls across with a single surfboard riding it */
  const WW = 400, WH = WW * A['wave2'].h / A['wave2'].w, L = 3500, wp = (u) => ({ x: lerp(-230, 530, u), y: 330 + Math.sin(u * 9) * 5 });
  const wv = mk(g, 'wave2', 0, 0, WW, { z: 7 });
  { const m = 'linear-gradient(to right,transparent 0,#000 11%,#000 89%,transparent 100%),linear-gradient(to bottom,#000 74%,transparent 98%)'; // the art is cut flat at its left, right and bottom edges: melt those edges away so no hard crop shows
    wv.style.webkitMaskImage = wv.style.maskImage = m; wv.style.webkitMaskComposite = 'source-in'; wv.style.maskComposite = 'intersect'; } path(wv, D, FD, FD + L, (u) => { const p = wp(u); return { x: p.x, y: p.y, r: Math.sin(u * 8) * 2, op: fade(u, .06, .06) }; }, 70);
  const sf = mk(g, 'surfer', 0, 0, 96, { z: 8 }); path(sf, D, FD, FD + L, (u) => { const p = wp(u); return { x: p.x - WW * .04, y: p.y - WH * .46 + Math.sin(u * 20) * 2, r: -10 + Math.sin(u * 12) * 3, op: fade(u, .06, .06) }; }, 90);
  for (let i = 0; i < 22; i++) { const sz = 5 + rnd() * 5, u0 = rnd() * .8, e = dot(g, '#e8f6ff', sz, 0, 0, false, 8), a = -Math.PI * (.15 + rnd() * .7), v = 50 + rnd() * 80, LL = 800;
    path(e, D, FD + u0 * L, FD + u0 * L + LL, (u) => { const tt = u * LL / 1000, p = wp(u0 + u * LL / L); return { x: p.x + WW * .3 + Math.cos(a) * v * tt, y: p.y - WH * .4 + Math.sin(a) * v * tt + 420 * tt * tt, op: fade(u, .05, .4) }; }, 16); } });
def('f9', 'f', FD + 4500, (s) => { const D = FD + 4500, g = box(s, 'left:0;top:0;width:300px;height:440px;', 1); fcard(g, D);
  forbit(g, D, { pics: ['45-red-pen-marks-sheet-2'], move: 'pulse', lap: 2400, size: 28, items: 9 });
  const stamp = (e, t0, rot, big) => seq(e, D, [[0, 0, 0, rot, 3, 0], [t0, 0, 0, rot, 3, 0], [t0 + 110, 0, 0, rot, 1, 1, 'ease-in'], [t0 + 190, 0, 0, rot, 1.12, 1, 'ease-out'], [t0 + 300, 0, 0, rot, 1], [t0 + 380, big ? 4 : 0, 0, rot, 1], [t0 + 460, big ? -4 : 0, 0, rot, 1], [t0 + 540, 0, 0, rot, 1], [D - 900, 0, 0, rot, 1, 1], [D - 400, 0, 0, rot, 1, 0], [D, 0, 0, rot, 1, 0]]);
  stamp(mk(g, '45-red-pen-marks-sheet-1', 78, 318, 120, { z: 8 }), FD + 300, -10);
  const gr = mk(g, 'great', 150, 392, 190, { z: 8 });
  stamp(gr, FD + 1100, -5);
  stamp(mk(g, '46-giant-a', FC.x, 100, 210, { z: 9 }), FD + 1900, -8, true); });
def('f10', 'f', FD + 5400, (s) => { const D = FD + 5400, g = box(s, 'left:0;top:0;width:300px;height:440px;', 1), gh = ['50-smiling-ghost', '51-boo-ghost']; fcard(g, D);
  forbit(g, D, { pics: gh, move: 'glow', lap: 3000, size: 30, items: 8 });
  /* ghosts fly in from both the left and the right, cross the screen, and drift out the far side */
  for (let i = 0; i < 12; i++) { const side = i % 2 ? 1 : -1, e = mk(g, gh[i % 2], 0, 0, 38 + rnd() * 8, { z: 7 }), y0 = 50 + rnd() * 330, dy = (rnd() - .5) * 120, dl = Math.floor(i / 2) * 330 + rnd() * 200, L = 2900 + rnd() * 500, ph = rnd() * 6;
    path(e, D, FD + dl, FD + dl + L, (u) => ({ x: side < 0 ? lerp(-44, 344, u) : lerp(344, -44, u), y: y0 + dy * u + Math.sin(u * 8 + ph) * 18, r: Math.sin(u * 6 + ph) * 10, sx: side < 0 ? -1 : 1, sy: 1, op: fade(u, .05, .05) }), 56); }
  [[60, 1], [230, -1], [130, 1], [290, -1]].forEach(([x, side], b) => flap2(g, D, ['bat1', 'bat2', 'bat3', 'bat4'], 50, x, 480, x + side * 50, -50, FD + 150 + b * 600, FD + 3200 + b * 600, 14, false)); });
def('f11', 'f', FD + 5200, (s) => { const D = FD + 5200, g = box(s, 'left:0;top:0;width:300px;height:440px;', 1), pr = [0, 1, 2, 3, 4, 5].map((i) => '56-harvest-sheet-' + i); fcard(g, D);
  forbit(g, D, { pics: pr, move: 'bob', lap: 3000, size: 28, items: 10 });
  /* cornucopia slides in and sits; produce rises out of its mouth (hidden inside the hole until clear), then tumbles out and lands */
  const W = 150, H = W * A['55-cornucopia'].h / A['55-cornucopia'].w, cc = { x: 88, y: 372 }, rc = -8 * Math.PI / 180, rot = (x, y) => [x * Math.cos(rc) - y * Math.sin(rc), x * Math.sin(rc) + y * Math.cos(rc)];
  const [hx, hy] = rot((.675 - .5) * W, (.55 - .5) * H), hole = { x: cc.x + hx, y: cc.y + hy }, rx = .165 * W, ry = .2 * H;
  const ell = (k) => 'polygon(' + Array.from({ length: 20 }, (_, i) => { const a = i / 20 * 6.2832, [ex, ey] = rot(k * rx * Math.cos(a), k * ry * Math.sin(a)); return `${hole.x + ex}px ${hole.y + ey}px`; }).join(',') + ')';
  const c = mk(g, '55-cornucopia', 0, 0, W, { z: 7 });
  path(c, D, FD, FD + 4300, (u) => { const e = Math.min(1, u / .16), out = Math.max(0, (u - .88) / .12); return { x: lerp(-100, cc.x, 1 - Math.pow(1 - e, 3)) - out * 170, y: cc.y, r: lerp(0, -8, e), op: 1 }; }, 60);
  for (let i = 0; i < 12; i++) { const t0 = FD + 800 + i * 170, wr = box(g, 'left:0;top:0;width:300px;height:440px;', 8), e = mk(wr, pr[i % 6], 0, 0, 34, { z: 1 }), vx = 35 + rnd() * 80, vy = -(120 + rnd() * 120), gv = 520, P = 320;
    const p1 = { x: hole.x + rx * .9, y: hole.y - ry * .35 }, tl = (-vy + Math.sqrt(vy * vy + 2 * gv * (418 - p1.y))) / gv, LL = P + (tl + .9) * 1000;
    wr.animate([{ clipPath: ell(1.15), offset: 0 }, { clipPath: ell(1.15), offset: (t0 + P - 80) / D }, { clipPath: ell(80), offset: (t0 + P + 80) / D }, { clipPath: 'none', offset: (t0 + P + 100) / D }, { clipPath: 'none', offset: 1 }], { duration: D, fill: 'both' });
    path(e, D, t0, t0 + LL, (u) => { const ms = u * LL; let x, y, sc, r;
      if (ms < P) { const q = ms / P, qq = q * q * (3 - 2 * q); x = lerp(hole.x - rx * .2, p1.x, qq); y = lerp(hole.y + ry * .1, p1.y, qq); sc = .45 + .4 * qq; r = q * 40; }
      else { const tt = (ms - P) / 1000; x = p1.x + vx * Math.min(tt, tl) + (tt > tl ? vx * .3 * (tt - tl) : 0); y = p1.y + vy * tt + .5 * gv * tt * tt; if (tt > tl) y = 418 - Math.abs(Math.sin((tt - tl) * 7)) * 20 * Math.max(0, 1 - (tt - tl) * 1.3); y = Math.min(y, 420); sc = .85 + .15 * Math.min(1, tt / .3); r = 40 + Math.min(tt, tl) * 260 * (i % 2 ? 1 : -1); }
      return { x, y, r, sx: sc, op: u > .88 ? (1 - u) / .12 : 1 }; }, Math.round(LL / 16)); } });
def('f12', 'f', FD + 5000, (s) => { const D = FD + 5000, g = box(s, 'left:0;top:0;width:300px;height:440px;', 1), pn = [0, 1, 2, 3].map((i) => '61-present-sheet-' + i); fcard(g, D);
  forbit(g, D, { pics: [0, 1, 2, 3, 4].map((i) => '60-christmas-bulb-sheet-' + i), move: 'twinkle', lap: 3000, size: 24, items: 14 });
  const sl = mk(g, 'sleigh', 0, 0, 130, { z: 8, flip: true }); path(sl, D, FD, FD + 3300, (u) => ({ x: lerp(-100, 400, u), y: 80 + Math.sin(u * 8) * 8 - u * 20, r: -6 + Math.sin(u * 8) * 3, op: fade(u, .05, .05) }), 50);
  for (let i = 0; i < 8; i++) { const e = mk(g, pn[i % 4], 0, 0, 30, { z: 7 }), u0 = .14 + i * .095, sx = lerp(-100, 400, u0) - 18, t0 = FD + u0 * 3300, ph = rnd() * 4;
    path(e, D, t0, t0 + 1500, (u) => ({ x: sx + 40 * u + Math.sin(u * 6 + ph) * 8, y: 90 + 330 * u * u, r: u * 220 * (i % 2 ? 1 : -1), op: u > .9 ? (1 - u) / .1 : 1 }), 30); }
  ffall(g, D, FD, { pics: ['04-gold-sparkle'], n: 14, size: 14, life: 2600, stagger: 1800, sway: 12, spin: 90 }); });




const RATE = { r7: 1.4, r10: 1, r6: 1.15 };
const writingStep = (month, count) => Math.min(month === 7 ? 105 : 120, (month === 7 ? 4600 : 4300) / Math.max(1, count));
const MM = window.MM = {
  ready(key) {
    if (key != null && !ART_BY_EFFECT[key]) return Promise.reject(Error('Unknown monthly effect: ' + key));
    if (!manifestP) manifestP = new Promise((resolve, reject) => {
      const controller = new AbortController();
      let settled = false;
      const finish = (error, manifest) => {
        if (settled) return;
        settled = true; clearTimeout(timeout);
        error ? reject(error) : resolve(manifest);
      };
      const timeout = setTimeout(() => { finish(Error('Monthly art manifest timed out')); controller.abort(); }, 8000);
      fetch('monthly/art-manifest.json', { signal: controller.signal }).then(r => {
        if (!r.ok) throw Error('Monthly art manifest unavailable');
        return r.json();
      }).then(m => finish(null, m), error => finish(error));
    }).then(m => {
      for (const [name, size] of Object.entries(m)) A[name] = { ...size, u: 'monthly/art/' + name + '.webp' };
      if (A.daisy2) A.daisy = A.daisy2;
      return m;
    }).catch(error => { manifestP = null; throw error; });
    return manifestP.then(m => Promise.all((key == null ? Object.keys(m) : ART_BY_EFFECT[key]).map(name => {
      if (!A[name]) throw Error('Monthly artwork is not registered: ' + name);
      if (!artLoads.has(name)) {
        const load = new Promise((resolve, reject) => {
          const im = new Image();
          const timeout = setTimeout(() => finish(Error('Monthly artwork timed out: ' + name)), 8000);
          function finish(error) { clearTimeout(timeout); im.onload = im.onerror = null; error ? reject(error) : resolve(); }
          im.onload = () => finish();
          im.onerror = () => finish(Error('Monthly artwork unavailable: ' + name));
          im.src = A[name].u;
        }).catch(error => { artLoads.delete(name); throw error; });
        artLoads.set(name, load);
      }
      return artLoads.get(name);
    })));
  },
  build(key, stage) { SEED = 7; stage.innerHTML = ''; ANIM[key].build(stage); const r = RATE[key] || 1; if (r !== 1) stage.getAnimations({ subtree: true }).forEach((a) => { a.playbackRate = r; }); },
  /* a flair on the real winner card: host is a 300x440 box whose point (150,215) sits at the card centre; cardW/cardH are the card's size in host units */
  buildFlair(key, host, cardW, cardH, view) { NOCARD = true; FC.w = cardW; FC.h = cardH; if (view) Object.assign(FC, { vt: view.vt - 24, vb: view.vb + 26, vl: view.vl, vr: view.vr }); try { MM.build(key, host); } finally { NOCARD = false; FC.w = 184; FC.h = 84; Object.assign(FC, { vt: -24, vb: 466, vl: 10, vr: 290 }); } },
  /* a board animation over the real question: host = 330x248 box (scaled to the board picture) inside the board stage;
     text = the game's question element, body = its container, letters = the per-letter spans the game made (empty = no letter animation) */
  buildBoard(key, host, hook) { // Keep explicit offsets valid and ordered, including decorative tails on long questions.
    const orig = Element.prototype.animate;
    Element.prototype.animate = function (kf, o) { let previous = 0; return orig.call(this, Array.isArray(kf) ? kf.map((k) => { if (typeof k.offset !== 'number') return k; previous = Math.max(previous, Math.min(1, Math.max(0, k.offset))); return Object.assign({}, k, { offset: previous }); }) : kf, o); };
    HOOK = Object.assign({ stage: host }, hook);
    try { MM.build(key, host); } finally { HOOK = null; Element.prototype.animate = orig; }
  },
  boardSettle(month, count) { const meta = BOARD_META[month - 1]; return month === 7 || month === 9 ? (month === 7 ? 1100 : 1250) + Math.max(0, count - 1) * writingStep(month, count) : Math.max(600, meta.settle + meta.per * (count - 43)); },
  info(key) { const a = ANIM[key]; return a ? { kind: a.kind, D: a.D / (RATE[key] || 1) } : null; },
  keys: () => Object.keys(ANIM),
  boards: BOARD_META,
  sizes: { r: [R, R], b: [BW, BH], f: [FW, FH] },
};
})();
