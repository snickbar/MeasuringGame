// Puppet rigs for the Survival result scene. Each character is a stack of separate
// pictures (limbs, head, wings, tail) nested in groups, so every joint can turn
// around its own pivot instead of the whole picture being pushed around.
export const PUPPET_SCENES = new Set(['safe']);

const KNIGHT = { w: 1217, h: 1292 };
const DRAGON = { w: 1536, h: 1024 };

// [file number, centre x, centre y, scale, rotation, native width]
const kp = {
  plume: [12, 293, 305, 1.9, 0, 246],
  farShin: [11, 680, 1150, 1.0, 0, 187], farThigh: [10, 610, 1070, 1.1, 20, 156],
  nearShin: [9, 275, 1170, 1.1, 20, 168], nearThigh: [8, 330, 1060, 1.1, -30, 177],
  torso: [1, 470, 810, 1.45, -10, 271], shieldArm: [6, 650, 735, 1.2, 0, 207],
  upperArm: [4, 355, 711, 1.25, -10, 182], fist: [5, 245, 915, 1.1, 70, 234],
  sword: [3, 464, 952, 2.1, 7, 338], helmet: [0, 393, 385, 2.46, -14, 306], shield: [2, 837, 783, 1.45, 4, 205]
};
const dp = {
  farWing: [5, 670, 400, 1.3, 0, 228], farShin: [11, 620, 870, 1.4, 0, 125], farFore: [9, 280, 820, 1.4, 0, 137],
  tailBase: [7, 1014, 722, 1.5, 0, 313], tailTip: [4, 1210, 640, 1.35, 0, 278],
  wing: [2, 1006, 307, 1.3, 6, 401], hind: [10, 837, 810, 1.5, 0, 186],
  body: [1, 564, 450, 1.9, 0, 351], fore: [8, 240, 820, 1.4, 0, 161]
};
const FACE = [367, 180, 0.82, 449];

const pct = (n, total) => +(n / total * 100).toFixed(3);
function img(file, [, x, y, s, r, w], frame, cls = '') {
  return `<img class="pz-i ${cls}" src="icons/${file}" alt="" draggable="false" style="left:${pct(x, frame.w)}%;top:${pct(y, frame.h)}%;width:${pct(w * s, frame.w)}%;transform:translate(-50%,-50%)${r ? ` rotate(${r}deg)` : ''}">`;
}
const group = (cls, pivot, frame, inner) =>
  `<span class="pg ${cls}" style="transform-origin:${pct(pivot[0], frame.w)}% ${pct(pivot[1], frame.h)}%">${inner}</span>`;
const k = (name, cls) => img(`pz-k${String(kp[name][0]).padStart(2, '0')}.webp`, kp[name], KNIGHT, cls);
const d = (name, cls) => img(`pz-d${String(dp[name][0]).padStart(2, '0')}.webp`, dp[name], DRAGON, cls);

function knightHtml() {
  const f = KNIGHT;
  const sarm = group('k-sarm', [335, 650], f, k('upperArm') + group('k-fore', [262, 880], f, k('sword') + k('fist')));
  const head = group('k-head', [460, 560], f, group('k-plume', [420, 360], f, k('plume')) + k('helmet'));
  const shield = group('k-shield', [610, 650], f, k('shieldArm') + k('shield'));
  const torso = group('k-torso', [480, 960], f, k('torso') + sarm + head + shield);
  return `<span class="pz-char pz-knight" style="aspect-ratio:${f.w}/${f.h}">${group('k-body', [480, 1230], f,
    group('k-farleg', [610, 1000], f, k('farThigh') + k('farShin')) + group('k-nearleg', [330, 1000], f, k('nearThigh') + k('nearShin')) + torso)}</span>`;
}

function dragonHtml() {
  const f = DRAGON;
  const faces = [0, 1, 2, 3, 4].map(i => img(`pz-f${i}.webp`, [0, FACE[0], FACE[1], FACE[2], 0, FACE[3]], f, `pz-face pz-face-${i}`)).join('');
  const head = group('d-head', [450, 430], f, faces + img('pz-d13.webp', [13, 330, 160, 1.3, 0, 85], f, 'pz-sweat'));
  const tail = group('d-tail', [830, 700], f, d('tailBase') + group('d-tailtip', [1090, 660], f, d('tailTip')));
  return `<span class="pz-char pz-dragon" style="aspect-ratio:${f.w}/${f.h}">${group('d-body', [600, 960], f,
    group('d-farwing', [690, 400], f, d('farWing')) + group('d-farleg', [600, 700], f, d('farShin')) + group('d-farfore', [280, 700], f, d('farFore')) + tail +
    group('d-wing', [725, 150], f, d('wing')) + group('d-hind', [830, 640], f, d('hind')) + group('d-torso', [600, 650], f, d('body')) + group('d-fore', [250, 700], f, d('fore')) + head)}</span>`;
}

export function puppetBattleHtml(mood) {
  return `<span class="pz-scene" data-puppet="${mood}">${knightHtml()}${dragonHtml()}` +
    `<img class="pz-burst" src="icons/pz-fx-burst.webp" alt="" draggable="false">` +
    `<img class="pz-swipe" src="icons/pz-fx-swipe.webp" alt="" draggable="false"></span>`;
}

export function puppetArtFiles() {
  const files = [];
  for (const [n] of Object.values(kp)) files.push(`pz-k${String(n).padStart(2, '0')}.webp`);
  for (const [n] of Object.values(dp)) files.push(`pz-d${String(n).padStart(2, '0')}.webp`);
  for (let i = 0; i < 5; i++) files.push(`pz-f${i}.webp`);
  files.push('pz-d13.webp', 'pz-fx-burst.webp', 'pz-fx-swipe.webp');
  return files;
}
