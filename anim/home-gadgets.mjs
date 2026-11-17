// Tools & Gadgets home: a chainsaw that hums and revs, a stack of light bulbs that light up, a weather vane,
// a squirrel, chimney smoke and eave lights.
import { place, img, hit, every, watchActive } from './home-worlds-util.mjs';
const D = 'anim/home-art/home-gadgets/';
const SAW = { x: 164, y: 826, w: 282, h: 881 }, BULBS = { x: 662, y: 819, w: 90, h: 985 };
const PIECES = ['plate', 'chainsaw', 'bulbs-off', 'bulbs-on', 'chain-strip-v', 'dust-l', 'dust-m', 'dust-s', 'chip-1', 'chip-2', 'chip-3', 'chip-4', 'chip-5', 'chip-6',
  'vane', 'squirrel-sit', 'squirrel-stand', 'squirrel-run', 'smoke-a', 'smoke-b', 'lights-off', 'lights-on', 'cloud-l'];
export const SIZE = { width: 1029, height: 2222 };

export async function build(home, load, current) {
  await Promise.all(PIECES.map(n => load(D + n + '.webp')));
  if (!current()) return null;
  const root = document.createElement('div');
  root.id = 'home-art'; root.dataset.scene = 'gadgets';
  const bulbs = Array.from({ length: 9 }, (_, i) => `<div class="g-bulb" data-i="${i}">
      ${img(D + 'bulbs-off.webp', 'g-seg', `top:${-i * 100}%`)}${img(D + 'bulbs-on.webp', 'g-seg g-on', `top:${-i * 100}%`)}</div>`).join('');
  const chainBox = (side, x) => `<div class="g-chain g-chain-${side}" style="left:${x / SAW.w * 100}%;width:${17 / SAW.w * 100}%;top:${72 / SAW.h * 100}%;height:${392 / SAW.h * 100}%"><i></i></div>`;
  root.innerHTML = `<div class="hs-stage">
    ${img(D + 'plate.webp', 'hs-plate')}
    ${img(D + 'cloud-l.webp', 'g-cloud', place(0, 640, 230))}
    ${img(D + 'vane.webp', 'g-vane', place(506, 1002, 84))}
    <div class="g-smoke" style="${place(430, 930, 90, 130)}">${img(D + 'smoke-a.webp', 'g-puff g-puff-a')}${img(D + 'smoke-b.webp', 'g-puff g-puff-b')}${img(D + 'smoke-a.webp', 'g-puff g-puff-c')}</div>
    <div class="g-lights" style="${place(436, 1232, 226)}">${img(D + 'lights-off.webp')}${img(D + 'lights-on.webp', 'g-lights-on')}</div>
    <div class="g-squirrel" style="${place(892, 1240, 112)}">${img(D + 'squirrel-sit.webp', 'g-sq g-sq-sit')}${img(D + 'squirrel-stand.webp', 'g-sq g-sq-stand')}</div>
    ${img(D + 'squirrel-run.webp', 'g-sq-run', place(892, 1400, 150))}
    <div class="g-bulbs" style="${place(BULBS.x, BULBS.y, BULBS.w, BULBS.h)}">${bulbs}</div>
    <div class="g-saw" style="${place(SAW.x, SAW.y, SAW.w, SAW.h)}">
      <div class="g-saw-body">${img(D + 'chainsaw.webp')}${chainBox('l', 88)}${chainBox('r', 199)}</div>
    </div>
    <div class="g-fx" style="${place(SAW.x, SAW.y, SAW.w, SAW.h)}"></div>
    ${hit('saw', SAW.x, SAW.y, SAW.w, SAW.h, 'Rev the chainsaw')}
    ${hit('bulbs', BULBS.x - 20, BULBS.y, BULBS.w + 40, BULBS.h, 'Light the light bulbs')}
    ${hit('squirrel', 892, 1240, 120, 100, 'Chase the squirrel')}
  </div>`;
  root.querySelectorAll('.g-chain i').forEach(i => i.style.backgroundImage = `url(${D}chain-strip-v.webp)`);

  function start(play, stopSound) {
    const q = s => root.querySelector(s), segs = [...root.querySelectorAll('.g-bulb')];
    const saw = q('.g-saw'), fx = q('.g-fx'), squirrel = q('.g-squirrel'), run = q('.g-sq-run');
    const timers = new Set(), stops = [];
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
    let revving = false, squirrelBusy = false;

    // Bulbs: a tap lights the tapped bulb and ripples out to its neighbours; each bobs a little and goes dark again.
    const lit = new Map();
    function light(i, delay = 0) {
      later(() => {
        const seg = segs[i]; if (!seg) return;
        seg.dataset.lit = ''; seg.classList.remove('g-bob'); void seg.offsetWidth; seg.classList.add('g-bob');
        clearTimeout(lit.get(i)); lit.set(i, setTimeout(() => { delete seg.dataset.lit; }, 2600 + delay));
      }, delay);
    }
    // Revving: chain spins fast, the saw shakes, sawdust and chips fly.
    function spawn(kind) {
      const left = Math.random() < .5, sheet = ['dust-l', 'dust-m', 'dust-s'], chip = Math.random() < .55;
      const src = chip ? `chip-${1 + Math.floor(Math.random() * 6)}` : sheet[Math.floor(Math.random() * 3)];
      const el = document.createElement('img');
      el.src = D + src + '.webp'; el.className = 'g-bit'; el.draggable = false;
      const w = chip ? 26 + Math.random() * 14 : 46 + Math.random() * 40, px = (left ? 82 : 218) + Math.random() * 12, py = 140 + Math.random() * 300;
      el.style.cssText = `left:${px / SAW.w * 100}%;top:${py / SAW.h * 100}%;width:${w / SAW.w * 100}%`;
      fx.appendChild(el);
      const dir = left ? -1 : 1, dx = dir * (50 + Math.random() * 110), fall = chip ? 120 + Math.random() * 90 : -30 - Math.random() * 50;
      const unit = fx.clientWidth / SAW.w;
      el.animate([
        { transform: 'translate(0,0) scale(.5) rotate(0)', opacity: 0 },
        { transform: `translate(${dx * .5 * unit}px,${(chip ? -40 : fall * .3) * unit}px) scale(1) rotate(${dir * 160}deg)`, opacity: 1, offset: .35 },
        { transform: `translate(${dx * unit}px,${fall * unit}px) scale(${chip ? 1 : 1.5}) rotate(${dir * 340}deg)`, opacity: 0 },
      ], { duration: 700 + Math.random() * 350, easing: 'ease-out' }).onfinish = () => el.remove();
    }
    function rev() {
      if (revving) return; revving = true; saw.dataset.rev = '';
      const burst = setInterval(spawn, 85); timers.add(burst);
      later(() => { clearInterval(burst); timers.delete(burst); delete saw.dataset.rev; revving = false; }, 1700);
    }
    // Squirrel: sits and nibbles, now and then stands up, and darts across the grass and back when poked.
    function dash() {
      if (squirrelBusy) return; squirrelBusy = true;
      squirrel.style.visibility = 'hidden'; const u = run.parentElement.clientWidth / 1029;
      run.style.display = 'block';
      run.animate([{ transform: 'translateX(0)', offset: 0 }, { transform: `translateX(${-520 * u}px)`, offset: .45 },
        { transform: `translateX(${-520 * u}px) scaleX(-1)`, offset: .5 }, { transform: 'translateX(0) scaleX(-1)', offset: 1 }], { duration: 4200, easing: 'ease-in-out' })
        .onfinish = () => { run.style.display = 'none'; squirrel.style.visibility = ''; squirrelBusy = false; };
    }
    root.addEventListener('click', e => {
      const kind = e.target.closest('[data-w]')?.dataset.w; if (!kind || !gate.isActive()) return;
      play(kind === 'saw' ? 1 : 0);
      if (kind === 'saw') rev();
      else if (kind === 'bulbs') {
        const r = q('.g-bulbs').getBoundingClientRect(), i = Math.max(0, Math.min(8, Math.floor((e.clientY - r.top) / r.height * 9)));
        for (let j = 0; j < 9; j++) light(j, Math.abs(j - i) * 80);
      } else dash();
    });
    const gate = watchActive(home, root, on => {
      if (on) {
        stops.push(every(7000, 12000, () => { if (!squirrelBusy) { squirrel.dataset.up = ''; later(() => delete squirrel.dataset.up, 1600); } }));
        stops.push(every(9000, 16000, () => { const i = Math.floor(Math.random() * 9); light(i); }));
        stops.push(every(30000, 50000, dash));
      } else { stops.splice(0).forEach(s => s()); stopSound(); }
    });
    return () => { gate.stop(); stops.forEach(s => s()); timers.forEach(clearTimeout); root.querySelectorAll('.g-bit').forEach(b => b.remove()); };
  }
  return { root, stage: root.firstElementChild, start, size: SIZE };
}
