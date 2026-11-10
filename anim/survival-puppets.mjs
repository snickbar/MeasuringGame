// Puppet rigs for the Survival result scene. Each character is a stack of separate
// pictures (limbs, head, wings, tail) nested in groups, so every joint can turn
// around its own pivot instead of the whole picture being pushed around.
export const PUPPET_SCENES = new Set(['safe']);

const KNIGHT = { w: 1217, h: 1292 };
const DRAGON = { w: 1536, h: 1024 };

// [file number, centre x, centre y, scale, rotation, native width]
const kp = {
  plume: [12, 290, 282, 2.095, 2.0, 246],
  torso: [1, 478, 809, 1.455, 5, 271],
  shieldArm: [6, 666, 748, 1.18, 2, 207],
  helmet: [0, 426, 377, 2.285, -2, 306],
  shield: [2, 839, 785, 1.455, -2, 205]
};
// Crops use the original knight's coordinates. The fist and sword are one
// picture so the handle stays inside the fingers as the wrist turns.
const knightCrops = {
  shoulder: ['pz-knight-shoulder', 239, 591, 239],
  forearm: ['pz-knight-forearm', 176, 708, 180],
  grip: ['pz-knight-grip', 110, 827, 714],
  nearLeg: ['pz-knight-near-leg', 173, 961, 290],
  farLeg: ['pz-knight-far-leg', 543, 959, 253],
  hips: ['pz-khip', 276, 907, 420],
};
const dbox = {
  base: ['pz-db', 124, 331, 985, 1016], farWing: ['pz-dfw', 545, 290, 748, 503],
  wing: ['pz-dnw', 598, 21, 1334, 581], tail: ['pz-dt', 868, 379, 1405, 827]
};
const FACE = [390, 214, 0.98, 449];

const pct = (n, total) => +(n / total * 100).toFixed(3);
function img(file, [, x, y, s, r, w], frame, cls = '') {
  return `<img class="pz-i ${cls}" src="icons/${file}" alt="" draggable="false" style="left:${pct(x, frame.w)}%;top:${pct(y, frame.h)}%;width:${pct(w * s, frame.w)}%;transform:translate(-50%,-50%)${r ? ` rotate(${r}deg)` : ''}">`;
}
const group = (cls, pivot, frame, inner) =>
  `<span class="pg ${cls}" style="transform-origin:${pct(pivot[0], frame.w)}% ${pct(pivot[1], frame.h)}%">${inner}</span>`;
const k = (name, cls) => img(`pz-k${String(kp[name][0]).padStart(2, '0')}.webp`, kp[name], KNIGHT, cls);
function knightCrop(name) {
  const [file, x, y, w] = knightCrops[name];
  return `<img class="pz-i" src="icons/${file}.webp" alt="" draggable="false" style="left:${pct(x, KNIGHT.w)}%;top:${pct(y, KNIGHT.h)}%;width:${pct(w, KNIGHT.w)}%">`;
}
const d = (name, cls = '') => { const [file, x0, y0, x1, y1] = dbox[name]; return `<img class="pz-i ${cls}" src="icons/${file}.webp" alt="" draggable="false" style="left:${pct(x0, DRAGON.w)}%;top:${pct(y0, DRAGON.h)}%;width:${pct(x1 - x0, DRAGON.w)}%">`; };

function knightHtml() {
  const f = KNIGHT;
  const wrist = group('k-wrist', [256, 862], f,
    '<img class="pz-swipe" src="icons/pz-fx-swipe.webp" alt="" draggable="false">' + knightCrop('grip'));
  const fore = group('k-fore', [269, 759], f, knightCrop('forearm') + wrist);
  const sarm = group('k-sarm', [354, 665], f, fore + knightCrop('shoulder'));
  const head = group('k-head', [460, 560], f, group('k-plume', [420, 360], f, k('plume')) + k('helmet'));
  const upper = group('k-shieldarm', [610, 650], f, k('shieldArm')) + k('torso', 'k-chest') + head + group('k-shield', [610, 650], f, k('shield')) + sarm;
  // The cloth under the waist plates covers the hip joints throughout the lunge.
  const legs = knightCrop('hips') + group('k-farleg', [588, 988], f, knightCrop('farLeg')) +
    group('k-nearleg', [389, 992], f, knightCrop('nearLeg'));
  return `<span class="pz-char pz-knight" style="aspect-ratio:${f.w}/${f.h}">${group('k-body', [480, 1230], f,
    legs + group('k-torso', [480, 960], f, upper))}</span>`;
}

function dragonHtml() {
  const f = DRAGON;
  const faces = [0, 1, 2, 3, 4].map(i => img(`pz-f${i}.webp`, [0, FACE[0], FACE[1], FACE[2], 0, FACE[3]], f, `pz-face pz-face-${i}`)).join('');
  const head = group('d-head', [450, 400], f, faces + img('pz-d13.webp', [13, 330, 160, 1.3, 0, 85], f, 'pz-sweat'));
  return `<span class="pz-char pz-dragon" style="aspect-ratio:${f.w}/${f.h}">${group('d-body', [600, 980], f,
    group('d-farwing', [610, 340], f, d('farWing')) + group('d-torso', [600, 650], f, d('base')) +
    group('d-tail', [880, 690], f, d('tail')) + group('d-wing', [715, 150], f, d('wing')) + head)}</span>`;
}

export function puppetBattleHtml(mood) {
  return `<span class="pz-scene" data-puppet="${mood}">${knightHtml()}${dragonHtml()}` +
    `<img class="pz-burst" src="icons/pz-fx-burst.webp" alt="" draggable="false"></span>`;
}

export function puppetArtFiles() {
  const files = [];
  for (const [n] of Object.values(kp)) files.push(`pz-k${String(n).padStart(2, '0')}.webp`);
  for (const [file] of Object.values(knightCrops)) files.push(`${file}.webp`);
  files.push('pz-db.webp', 'pz-dnw.webp', 'pz-dfw.webp', 'pz-dt.webp');
  for (let i = 0; i < 5; i++) files.push(`pz-f${i}.webp`);
  files.push('pz-d13.webp', 'pz-fx-burst.webp', 'pz-fx-swipe.webp');
  return files;
}
