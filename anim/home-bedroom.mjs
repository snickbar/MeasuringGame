// Home & Bedroom home: a stone fireplace whose fire grows when tapped, a lava lamp, a stack of nine red alarm clocks
// whose hands keep time and which rattle when tapped, plus curtains, a plant and a pendulum.
import { place, img, hit, every, watchActive } from './home-worlds-util.mjs';
const D = 'anim/home-art/home-bedroom/';
export const SIZE = { width: 1029, height: 2222 };
const CLOCK = { x: 604, y: 669, w: 144 };
const SLICES = [[0, 125], [124, 240], [233, 349], [343, 459], [452, 568], [559, 675], [665, 781], [771, 887], [876, 1015]];
const FACE_Y = [75, 190, 299, 409, 518, 625, 731, 837, 942], FACE_X = 70;
// Hands: [piece width, height, scale, pivot y inside the piece, seconds per turn]
const HANDS = { hour: [107, 504, .047, 444, 1500], min: [53, 744, .0457, 690, 150], sec: [101, 747, .05, 603, 24] };
const NAMES = ['plate', 'clocks', 'hand-hour', 'hand-min', 'hand-sec', 'hand-hub', 'lamp', 'blob-1', 'blob-2', 'blob-3', 'blob-4', 'blob-5', 'curtain-1',
  'plant-1', 'pendulum', 'fp-front', ...['s1', 's2', 's3', 'm1', 'm2', 'm3', 'l1', 'l2', 'l3'].map(n => 'flame-' + n), ...[1, 2, 3, 4, 5, 6].map(n => 'spark-' + n),
  ...SLICES.map((_, i) => 'clock-' + i)];
// The fireplace was moved 55 px lower in the background picture (the clocks stand on the floor level with its hearth); everything on it follows.
const RATTLE = [{ transform: 'none' }, { transform: 'translate(-2.2%,0) rotate(-3.5deg)', offset: .1 }, { transform: 'translate(2.2%,0) rotate(3.5deg)', offset: .25 }, { transform: 'translate(-2.2%,0) rotate(-3deg)', offset: .4 }, { transform: 'translate(1.8%,0) rotate(3deg)', offset: .55 }, { transform: 'translate(-1.1%,0) rotate(-1.5deg)', offset: .7 }, { transform: 'translate(.7%,0) rotate(1deg)', offset: .85 }, { transform: 'none' }];
const FIRE_DY = 55;
const FIRE = { x: 212, y: 1316 + FIRE_DY, w: 262, h: 186 };

export async function build(home, load, current) {
  await Promise.all(NAMES.map(n => load(D + n + '.webp')));
  if (!current()) return null;
  const root = document.createElement('div');
  root.id = 'home-art'; root.dataset.scene = 'bedroom';
  const pct = (v, total) => (v / total * 100).toFixed(3) + '%';
  const clocks = SLICES.map(([t, b], i) => {
    const h = b - t, cx = FACE_X, cy = FACE_Y[i] - t, start = [40, 200, 320, 110, 250, 80, 290, 160, 10][i];
    const hand = (kind, spin) => {
      const [w0, h0, s, py, secs] = HANDS[kind], w = w0 * s, hh = h0 * s, px = w / 2, pyy = py * s;
      return `<div class="l-hand l-${kind}" style="left:${pct(cx - px, 144)};top:${pct(cy - pyy, h)};width:${pct(w, 144)};height:${pct(hh, h)};transform-origin:50% ${(py / h0 * 100).toFixed(1)}%;--a:${spin}deg;--d:${secs}s">${img(D + 'hand-' + (kind === 'min' ? 'min' : kind) + '.webp')}</div>`;
    };
    return `<div class="l-clock" data-i="${i}" style="${place(CLOCK.x, CLOCK.y + t, CLOCK.w, h)}z-index:${i + 1}">
      ${img(D + 'clock-' + i + '.webp', 'l-clock-img' + (i === 0 ? ' l-first' : i === 8 ? ' l-last' : ''))}${hand('hour', start)}${hand('min', start * 7 % 360)}${hand('sec', start * 3 % 360)}
      <img class="l-hub" src="${D}hand-hub.webp" alt="" draggable="false" style="left:${pct(cx - 4.5, 144)};top:${pct(cy - 4.5, h)};width:${pct(9, 144)}">
      ${hit('clock', CLOCK.x, CLOCK.y + t, CLOCK.w, h, 'Rattle alarm clock ' + (i + 1)).replace('class="w-hit"', `class="w-hit l-clock-hit" data-i="${i}"`)}</div>`;
  }).join('');
  const frames = (set, cls) => [1, 2, 3].map(n => img(D + `flame-${set}${n}.webp`, `l-fl ${cls} l-fl-${n}`)).join('');
  root.innerHTML = `<div class="hs-stage">
    ${img(D + 'plate.webp', 'hs-plate')}
    ${img(D + 'curtain-1.webp', 'l-curtain', place(-5, 692, 200, 547))}
    ${img(D + 'fp-front.webp', 'l-fp-front', place(100, 734, 481, 964))}
    ${img(D + 'plant-1.webp', 'l-plant', place(-109, 1181, 238))}
    <div class="l-glow" style="${place(-60, 1150 + FIRE_DY, 800, 760)}"></div>
    <div class="l-fire" style="${place(FIRE.x, FIRE.y, FIRE.w, FIRE.h)}">${frames('m', 'l-fl-m')}${frames('l', 'l-fl-l')}</div>
    <div class="l-sparks" style="${place(FIRE.x, FIRE.y - 60, FIRE.w, FIRE.h + 60)}"></div>
    <div class="l-lamp" style="${place(289, 966 + FIRE_DY, 98)}">${img(D + 'lamp.webp', 'l-lamp-img')}<div class="l-blobs">${[1, 2, 3, 4, 5].map(n => img(D + `blob-${n}.webp`, 'l-blob l-blob-' + n)).join('')}</div></div>
    <div class="l-pend-clip" style="${place(922, 906, 82, 86)}"><div class="l-pendulum" style="left:${(936 - 922) / 82 * 100}%;top:${(844 - 906) / 86 * 100}%;width:${48 / 82 * 100}%">${img(D + 'pendulum.webp')}</div></div>
    ${SLICES.map(([t, b], i) => `<div class="l-static" data-i="${i}" style="${place(CLOCK.x, CLOCK.y + t, CLOCK.w, b - t)}overflow:hidden">${img(D + 'clocks.webp', 'l-static-img', `left:0;top:${(-t / (b - t) * 100).toFixed(3)}%;width:100%;`)}</div>`).join('')}
    ${clocks}
    ${hit('fire', FIRE.x, FIRE.y - 40, FIRE.w, FIRE.h + 80, 'Stoke the fire')}
    ${hit('lamp', 280, 960 + FIRE_DY, 116, 210, 'Shake the lava lamp')}
  </div>`;

  function start(play, stopSound) {
    const q = s => root.querySelector(s), fire = q('.l-fire'), sparks = q('.l-sparks'), lamp = q('.l-lamp');
    const timers = new Set(), stops = [];
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
    const flash = (el, name, ms) => { delete el.dataset[name]; void el.offsetWidth; el.dataset[name] = ''; later(() => delete el.dataset[name], ms); };
    function spark() {
      const el = img(D + `spark-${1 + Math.floor(Math.random() * 6)}.webp`, 'l-spark'), tpl = document.createElement('template'); tpl.innerHTML = el;
      const s = tpl.content.firstElementChild, w = 12 + Math.random() * 10;
      s.style.cssText = `left:${15 + Math.random() * 70}%;bottom:${22 + Math.random() * 18}%;width:${w / FIRE.w * 100}%`; sparks.appendChild(s);
      const u = sparks.clientWidth / FIRE.w, dx = (Math.random() - .5) * 70 * u;
      s.animate([{ transform: 'translate(0,0) scale(.7)', opacity: 0 }, { opacity: 1, offset: .2 }, { transform: `translate(${dx}px,${-(110 + Math.random() * 90) * u}px) scale(.4)`, opacity: 0 }], { duration: 1500 + Math.random() * 700, easing: 'ease-out' }).onfinish = () => s.remove();
    }
    root.addEventListener('click', e => {
      const kind = e.target.closest('[data-w]')?.dataset.w; if (!kind || !gate.isActive()) return;
      play(kind === 'clock' ? 1 : 0);
      if (kind === 'fire') { flash(root, 'stoked', 2800); for (let i = 0; i < 6; i++) later(spark, i * 160); }
      else if (kind === 'clock') { const c = e.target.closest('.l-clock'), st = q(`.l-static[data-i="${c.dataset.i}"]`); st.dataset.hole = ''; clearTimeout(st._t); st._t = later(() => { delete st.dataset.hole; }, 900); c.dataset.rattle = ''; clearTimeout(c._t); c._t = later(() => { delete c.dataset.rattle; }, 900); c.animate(RATTLE, { duration: 900, easing: 'ease-in-out' }); }
      else if (kind === 'lamp') flash(lamp, 'shake', 1500);
    });
    const gate = watchActive(home, root, on => {
      if (on) { stops.push(every(2500, 5000, spark));
      } else { stops.splice(0).forEach(s => s()); stopSound(); }
    });
    return () => { gate.stop(); stops.forEach(s => s()); timers.forEach(clearTimeout); };
  }
  return { root, stage: root.firstElementChild, start, size: SIZE };
}
