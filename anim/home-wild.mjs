// Zoo home: an elephant that raises its trunk when tapped (ears and tail sway), a stack of nine meerkats whose top one
// looks around and stands tall when tapped (a tap lower down wobbles the stack), plus bamboo, flags, balloons,
// a giraffe peeking over the rock and one butterfly.
import { place, img, hit, every, watchActive } from './home-worlds-util.mjs';
const D = 'anim/home-art/home-wild/';
export const SIZE = { width: 1029, height: 2222 };
const POSES = ['cheer', 'cheer2', 'look-a', 'look-b', 'chirp', 'laugh', 'smile'];
const NAMES = ['plate', 'elephant', 'elephant-up', 'ear-1', 'tail-1', 'meerkats-base', 'bamboo-a', 'giraffe-a', 'giraffe-b', 'flags-a', 'flags-b',
  'balloons-a', 'butterfly-a', ...POSES.map(n => 'm-' + n)];
const EL = { x: 63, y: 835, w: 588 }, ELUP = { x: 64, y: 646, w: 638 };
const MK = { x: 722, y: 637, w: 156 };
// Position of an image inside a box, in percent of the box.
const at = (b, x, y, w) => `left:${((x - b.x) / b.w * 100).toFixed(3)}%;top:${((y - b.y) / b.h * 100).toFixed(3)}%;width:${(w / b.w * 100).toFixed(3)}%;`;
const MKB = { x: 690, y: 620, w: 220, h: 1060 };
const TOP = { x: 676, y: 628, w: 204, h: 132 }, POSE_S = .41, POSE_CX = 778, POSE_Y = 638;
// Piece width and the x of the head's centre inside each pose picture, so every pose lines up with the stack's own top meerkat.
const POSE_DIM = { 'cheer': [394, 196.5], 'cheer2': [412, 206], 'look-a': [306, 152], 'look-b': [312, 155.5], 'chirp': [334, 158], 'laugh': [294, 136], 'smile': [298, 133.5] };

export async function build(home, load, current) {
  await Promise.all(NAMES.map(n => load(D + n + '.webp')));
  if (!current()) return null;
  const root = document.createElement('div');
  root.id = 'home-art'; root.dataset.scene = 'wild';
  const BAM = { x: -152, y: 750, w: 450, h: 430 }, GIR = { x: 890, y: 870, w: 125, h: 160 }, FLG = { x: 486, y: 1090, w: 180, h: 64 }, BAL = { x: 622, y: 962, w: 120, h: 160 };
  const E = { x: 40, y: 636, w: 690, h: 1040 };
  const pose = n => { const [pw, cx] = POSE_DIM[n]; return img(D + `m-${n}.webp`, 'z-pose z-pose-' + n, at(TOP, POSE_CX - cx * POSE_S, POSE_Y, pw * POSE_S)); };
  root.innerHTML = `<div class="hs-stage">
    ${img(D + 'plate.webp', 'hs-plate')}
    <div class="z-bamboo" style="${place(BAM.x, BAM.y, BAM.w, BAM.h)}">${img(D + 'bamboo-a.webp', 'z-bam-a', at(BAM, -100, 760, 340))}</div>
    <div class="z-giraffe" style="${place(GIR.x, GIR.y, GIR.w, GIR.h)}">${img(D + 'giraffe-a.webp', 'z-gir-a', at(GIR, 903, 881, 93))}${img(D + 'giraffe-b.webp', 'z-gir-b', at(GIR, 893, 881, 113))}</div>
    <div class="z-flags" style="${place(FLG.x, FLG.y, FLG.w, FLG.h)}">${img(D + 'flags-a.webp', 'z-flag-a', at(FLG, 489, 1097, 170))}${img(D + 'flags-b.webp', 'z-flag-b', at(FLG, 488, 1096, 172))}</div>
    <div class="z-balloons" style="${place(BAL.x, BAL.y, BAL.w, BAL.h)}">${img(D + 'balloons-a.webp', 'z-bal-a', at(BAL, 630, 967, 100))}</div>
    <div class="z-shadow" style="${place(24, 1618, 590, 70)}"></div>
    <div class="z-shadow" style="${place(700, 1640, 250, 34)}"></div>
    <div class="z-elephant" style="${place(E.x, E.y, E.w, E.h)}">
      <div class="z-tail">${img(D + 'tail-1.webp', '', at(E, 77, 1352, 32))}</div>
      ${img(D + 'elephant.webp', 'z-el-down', at(E, EL.x, EL.y, EL.w))}${img(D + 'elephant-up.webp', 'z-el-up', at(E, ELUP.x, ELUP.y, ELUP.w))}
      <div class="z-ear">${img(D + 'ear-1.webp', '', at(E, 52, 884, 241))}</div>
    </div>
    <div class="z-mk" style="${place(690, 620, 220, 1060)}">
      ${img(D + 'meerkats-base.webp', 'z-stack', `left:${(MK.x - 690) / 220 * 100}%;top:${(MK.y - 620) / 1060 * 100}%;width:${MK.w / 220 * 100}%;`)}
      <div class="z-top" data-pose="smile" style="${at(MKB, TOP.x, TOP.y, TOP.w)}height:${(TOP.h / MKB.h * 100).toFixed(3)}%;">${POSES.map(pose).join('')}</div>
    </div>
    <div class="z-butterfly" style="${place(880, 1380, 84, 66)}">${img(D + 'butterfly-a.webp')}</div>
    ${hit('elephant', 60, 700, 600, 960, 'Make the elephant raise its trunk')}
    ${hit('top', 700, 628, 110, 125, 'Make the top meerkat stand tall')}
    ${hit('stack', 700, 752, 150, 910, 'Wobble the meerkat stack')}
    ${hit('giraffe', 895, 875, 120, 150, 'Make the giraffe chew')}
    ${hit('balloons', 625, 962, 110, 150, 'Bob the balloons')}
  </div>`;

  function start(play, stopSound) {
    const q = s => root.querySelector(s), top = q('.z-top'), eleph = q('.z-elephant'), stack = q('.z-mk'), giraffe = q('.z-giraffe'), balloons = q('.z-balloons'), bf = q('.z-butterfly');
    const timers = new Set(), stops = [];
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
    let poseTimer, busy = false, upTimer;
    const setPose = (name, ms) => { clearTimeout(poseTimer); top.dataset.pose = name; poseTimer = setTimeout(() => { top.dataset.pose = 'smile'; }, ms); };
    const flagged = (el, key, ms) => { el.dataset[key] = ''; clearTimeout(el['_' + key]); el['_' + key] = later(() => { delete el.dataset[key]; }, ms); };
    const WOBBLE = [{ transform: 'rotate(0)' }, { transform: 'rotate(-2.6deg)', offset: .14 }, { transform: 'rotate(2.4deg)', offset: .32 }, { transform: 'rotate(-1.6deg)', offset: .5 }, { transform: 'rotate(1.1deg)', offset: .68 }, { transform: 'rotate(-.5deg)', offset: .84 }, { transform: 'rotate(0)' }];
    function wobble() { stack.animate(WOBBLE, { duration: 1300, easing: 'ease-out' }); if (!busy) setPose(Math.random() < .5 ? 'cheer2' : 'smile', 1200); }
    function standTall() {
      if (busy) return; busy = true; setPose(Math.random() < .5 ? 'cheer' : 'cheer2', 1700);
      top.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)', offset: .22 }, { transform: 'scale(1.03)', offset: .6 }, { transform: 'scale(1)' }], { duration: 1700, easing: 'ease-in-out' });
      later(() => { busy = false; }, 1800);
    }
    function raiseTrunk() {
      flagged(eleph, 'up', 2600);
      eleph.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(1.012,.985)', offset: .15 }, { transform: 'scale(.994,1.008)', offset: .4 }, { transform: 'scale(1,1)' }], { duration: 700, easing: 'ease-out' });
      if (!busy) { setPose('cheer', 2400); }
    }
    // One butterfly drifts across the whole scene, flapping its wings, and is out of sight before and after (so it never fades in or out).
    function flutter() {
      if (bf.dataset.flying) return; bf.dataset.flying = '1'; bf.style.visibility = 'visible';
      const dir = Math.random() < .5 ? 1 : -1, y0 = 1250 + Math.random() * 180, pts = [];
      for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push({ x: (dir > 0 ? -120 + 1260 * t : 1140 - 1260 * t) - 880, y: y0 - 1380 + Math.sin(t * Math.PI * 3.2) * 70 - t * 40, a: Math.sin(t * Math.PI * 3.2 + 1) * 14 }); }
      const u = 84 / 100;
      const anim = bf.animate(pts.map((p, i) => ({ transform: `translate(${(p.x / u).toFixed(0)}%, ${(p.y / .66).toFixed(0)}%) rotate(${p.a.toFixed(1)}deg)`, offset: i / 12 })), { duration: 11000, easing: 'linear' });
      anim.onfinish = anim.oncancel = () => { bf.style.visibility = 'hidden'; delete bf.dataset.flying; };
    }
    root.addEventListener('click', e => {
      const kind = e.target.closest('[data-w]')?.dataset.w; if (!kind || !gate.isActive()) return;
      play(kind === 'giraffe' || kind === 'balloons' ? 1 : 0);
      if (kind === 'elephant') raiseTrunk();
      else if (kind === 'top') standTall();
      else if (kind === 'stack') wobble();
      else if (kind === 'giraffe') flagged(giraffe, 'chew', 2800);
      else if (kind === 'balloons') balloons.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-7deg)', offset: .2 }, { transform: 'rotate(6deg)', offset: .45 }, { transform: 'rotate(-3deg)', offset: .7 }, { transform: 'rotate(0)' }], { duration: 1200, easing: 'ease-out' });
    });
    const gate = watchActive(home, root, on => {
      if (on) {
        stops.push(every(2600, 4800, () => { if (!busy) setPose('laugh', 190); }));
        stops.push(every(7000, 12000, () => { if (!busy) setPose(Math.random() < .5 ? 'look-a' : 'look-b', 1700); }));
        stops.push(every(15000, 24000, () => { if (!busy) setPose('chirp', 1100); }));
        stops.push(every(9000, 16000, () => flagged(giraffe, 'chew', 2600)));
        stops.push(every(16000, 26000, flutter));
        later(flutter, 3000);
      } else { stops.splice(0).forEach(s => s()); stopSound(); }
    });
    return () => { gate.stop(); stops.forEach(s => s()); timers.forEach(clearTimeout); };
  }
  return { root, stage: root.firstElementChild, start, size: SIZE };
}
