// Pond home: a flamingo that swaps between standing on one leg and two and spreads its wings when tapped, a stack of nine caterpillars
// whose top one blinks, nibbles a leaf and perks up when tapped (a tap lower down makes the stack wobble), plus a frog that croaks and
// hops between lily pads, a leaping fish, ripples, a dragonfly, swaying reeds and drifting clouds.
import { place, img, hit, every, watchActive } from './home-worlds-util.mjs';
const D = 'anim/home-art/home-birds-bugs/';
export const SIZE = { width: 1029, height: 2222 };
const NAMES = ['plate', 'flamingo-1', 'flamingo-2', 'flamingo-up', 'caterpillars-base', 'cat-top', 'leaf', 'frog-sit', 'frog-croak', 'frog-jump', 'fish', 'dragonfly-up', 'dragonfly-down',
  'reeds-l', 'reeds-r', 'cloud-1', 'cloud-2', 'cloud-3', 'ripple-2'];
// Position of an image inside a box, in percent of the box.
const at = (b, x, y, w) => `left:${((x - b.x) / b.w * 100).toFixed(3)}%;top:${((y - b.y) / b.h * 100).toFixed(3)}%;width:${(w / b.w * 100).toFixed(3)}%;`;
const FOOT = { x: 309, y: 1677 };
const FL = { x: 0, y: 440, w: 640, h: 1260 };
const CAT = { x: 592, y: 847, w: 267, h: 858 }, TOPC = { x: 641, y: 847, w: 193, h: 197 };
const FROG = { x: 340, y: 1340, w: 180, h: 140 };

export async function build(home, load, current) {
  await Promise.all(NAMES.map(n => load(D + n + '.webp')));
  if (!current()) return null;
  const root = document.createElement('div');
  root.id = 'home-art'; root.dataset.scene = 'birds-bugs';
  const eye = (cx, cy) => `<i class="p-lid" style="left:${((cx - 11 - 49) / TOPC.w * 100).toFixed(2)}%;top:${((cy - 11) / TOPC.h * 100).toFixed(2)}%;width:${(22 / TOPC.w * 100).toFixed(2)}%;height:${(22 / TOPC.h * 100).toFixed(2)}%"></i>`;
  root.innerHTML = `<div class="hs-stage">
    ${img(D + 'plate.webp', 'hs-plate')}
    ${img(D + 'cloud-1.webp', 'p-cloud p-cloud-1', place(0, 522, 304))}${img(D + 'cloud-2.webp', 'p-cloud p-cloud-2', place(789, 474, 240))}${img(D + 'cloud-3.webp', 'p-cloud p-cloud-3', place(811, 642, 218))}
    ${img(D + 'reeds-l.webp', 'p-reeds p-reeds-l', place(-60, 1105, 210))}
    <div class="p-ripples" style="${place(FOOT.x - 80, FOOT.y - 22, 160, 44)}"><i></i><i></i><i></i></div>
    <div class="p-frog" style="${place(FROG.x, FROG.y, FROG.w, FROG.h)}" data-pose="sit">${img(D + 'frog-sit.webp', 'p-fr p-fr-sit', at(FROG, 388, 1393, 75))}${img(D + 'frog-croak.webp', 'p-fr p-fr-croak', at(FROG, 388, 1389, 75))}${img(D + 'frog-jump.webp', 'p-fr p-fr-jump', at(FROG, 375, 1380, 101))}</div>
    <div class="p-fish" style="${place(380, 1570, 75, 36)}">${img(D + 'fish.webp')}</div>
    <div class="p-flamingo" data-pose="one" style="${place(FL.x, FL.y, FL.w, FL.h)}">${img(D + 'flamingo-1.webp', 'p-fl p-fl-one', at(FL, 68, 829, 428))}${img(D + 'flamingo-2.webp', 'p-fl p-fl-two', at(FL, 69, 827, 426))}${img(D + 'flamingo-up.webp', 'p-fl p-fl-up', at(FL, 68, 681, 485))}</div>
    <div class="p-stack" style="${place(CAT.x, CAT.y, CAT.w, CAT.h)}">
      ${img(D + 'caterpillars-base.webp', 'p-base')}
      <div class="p-top" style="${at(CAT, TOPC.x, TOPC.y, TOPC.w)}height:${(TOPC.h / CAT.h * 100).toFixed(3)}%">${img(D + 'cat-top.webp', 'p-top-img')}${eye(80, 76)}${eye(127, 83)}${img(D + 'leaf.webp', 'p-leaf', 'left:-12%;top:38%;width:28%')}</div>
    </div>
    ${img(D + 'reeds-r.webp', 'p-reeds p-reeds-r', place(800, 1295, 250))}
    <div class="p-dragon" style="${place(60, 960, 110, 80)}">${img(D + 'dragonfly-down.webp', 'p-dg p-dg-a', 'left:0;top:30%;width:100%')}${img(D + 'dragonfly-up.webp', 'p-dg p-dg-b', 'left:22%;top:0;width:66%')}</div>
    ${hit('flamingo', 60, 830, 480, 860, 'Make the flamingo spread its wings')}
    ${hit('top', 641, 847, 193, 200, 'Make the top caterpillar perk up')}
    ${hit('stack', 600, 1040, 270, 670, 'Wobble the caterpillar stack')}
    ${hit('frog', 380, 1385, 90, 80, 'Make the frog hop')}
    ${hit('reeds', 800, 1295, 229, 380, 'Rustle the reeds')}
  </div>`;

  function start(play, stopSound) {
    const q = s => root.querySelector(s), fl = q('.p-flamingo'), top = q('.p-top'), stack = q('.p-stack'), frog = q('.p-frog'), fish = q('.p-fish'), ripples = q('.p-ripples'), dragon = q('.p-dragon');
    const timers = new Set(), stops = [];
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
    const flag = (el, key, ms) => { el.dataset[key] = ''; clearTimeout(el['_' + key]); el['_' + key] = later(() => { delete el.dataset[key]; }, ms); };
    let busy = false, hopping = false;
    // Flamingo: now and then it swaps legs; a tap spreads its wings (with a bounce and a ring of ripples).
    function swapLegs() { if (fl.dataset.pose === 'up') return; const two = fl.dataset.pose === 'one'; fl.dataset.pose = two ? 'two' : 'one'; if (two) later(() => { if (fl.dataset.pose === 'two') fl.dataset.pose = 'one'; }, 4500 + Math.random() * 2500); }
    function wings() {
      if (fl.dataset.pose === 'up') return; fl.dataset.pose = 'up';
      fl.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-1.2%)', offset: .18 }, { transform: 'translateY(.2%)', offset: .4 }, { transform: 'translateY(-.6%)', offset: .62 }, { transform: 'translateY(0)' }], { duration: 1300, easing: 'ease-out' });
      splash(); later(splash, 500);
      later(() => { fl.dataset.pose = 'one'; }, 2600);
    }
    function splash() { ripples.dataset.burst = ''; flag(ripples, 'burst', 1500); }
    // Top caterpillar: blinks, now and then nibbles a leaf, and perks up when tapped.
    const WOBBLE = [{ transform: 'rotate(0)' }, { transform: 'rotate(-2.4deg)', offset: .14 }, { transform: 'rotate(2.2deg)', offset: .32 }, { transform: 'rotate(-1.5deg)', offset: .5 }, { transform: 'rotate(1deg)', offset: .68 }, { transform: 'rotate(-.4deg)', offset: .84 }, { transform: 'rotate(0)' }];
    function wobble() { stack.animate(WOBBLE, { duration: 1300, easing: 'ease-out' }); }
    function perk() {
      if (busy) return; busy = true;
      top.animate([{ transform: 'translateY(0) rotate(0) scale(1)' }, { transform: 'translateY(-3%) rotate(-3deg) scale(1.05)', offset: .2 }, { transform: 'translateY(-1.5%) rotate(3deg) scale(1.04)', offset: .4 }, { transform: 'translateY(-3%) rotate(-3deg) scale(1.05)', offset: .6 }, { transform: 'translateY(-1%) rotate(2deg) scale(1.02)', offset: .8 }, { transform: 'translateY(0) rotate(0) scale(1)' }], { duration: 1500, easing: 'ease-in-out' });
      flag(top, 'blink', 260); later(() => { busy = false; }, 1600);
    }
    function nibble() {
      if (busy) return; busy = true; top.dataset.eat = '';
      top.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-2.5deg) translateY(.8%)', offset: .15 }, { transform: 'rotate(1.2deg)', offset: .3 }, { transform: 'rotate(-2.5deg) translateY(.8%)', offset: .45 }, { transform: 'rotate(1.2deg)', offset: .6 }, { transform: 'rotate(-2deg) translateY(.6%)', offset: .78 }, { transform: 'rotate(0)' }], { duration: 3000, easing: 'ease-in-out' });
      later(() => { delete top.dataset.eat; busy = false; }, 3100);
    }
    // Frog: croaks, and hops to the other lily pad and back.
    function croak() { if (hopping) return; frog.dataset.pose = 'croak'; later(() => { if (!hopping) frog.dataset.pose = 'sit'; }, 1300); }
    const fp = (x, y) => `translate(${(x / FROG.w * 100).toFixed(2)}%,${(y / FROG.h * 100).toFixed(2)}%)`;
    function hop() {
      if (hopping) return; hopping = true; frog.dataset.pose = 'jump';
      const far = frog.dataset.at === 'far', from = far ? [75, 52] : [0, 0], to = far ? [0, 0] : [75, 52];
      const a = frog.animate([{ transform: fp(...from) }, { transform: fp((from[0] + to[0]) / 2, (from[1] + to[1]) / 2 - 70), offset: .5 }, { transform: fp(...to) }], { duration: 800, easing: 'ease-in-out' });
      a.onfinish = () => { frog.dataset.at = far ? 'near' : 'far'; frog.style.transform = far ? '' : fp(...to); frog.dataset.pose = 'sit'; hopping = false; splash(); };
    }
    // Fish: leaps out of the water and back in.
    function leap() {
      fish.style.visibility = 'visible';
      const a = fish.animate([{ transform: 'translate(0,0) rotate(-55deg)' }, { transform: 'translate(70%,-210%) rotate(-10deg)', offset: .5 }, { transform: 'translate(150%,0) rotate(55deg)' }], { duration: 1000, easing: 'ease-in-out' });
      a.onfinish = a.oncancel = () => { fish.style.visibility = 'hidden'; };
    }
    const DART = [{ transform: 'translate(0,0)' }, { transform: 'translate(160%,-70%)', offset: .35 }, { transform: 'translate(110%,-20%)', offset: .65 }, { transform: 'translate(0,0)' }];
    function dart() { dragon.animate(DART, { duration: 1800, easing: 'ease-in-out' }); }
    root.addEventListener('click', e => {
      const kind = e.target.closest('[data-w]')?.dataset.w; if (!kind || !gate.isActive()) return;
      play(kind === 'frog' || kind === 'reeds' ? 1 : 0);
      if (kind === 'flamingo') wings();
      else if (kind === 'top') perk();
      else if (kind === 'stack') { wobble(); if (!busy) flag(top, 'blink', 260); }
      else if (kind === 'frog') (Math.random() < .5 ? hop : croak)();
      else if (kind === 'reeds') { flag(root, 'rustle', 1600); dart(); }
    });
    const gate = watchActive(home, root, on => {
      if (on) {
        stops.push(every(2800, 5200, () => flag(top, 'blink', 190)));
        stops.push(every(14000, 22000, nibble));
        stops.push(every(7000, 12000, swapLegs));
        stops.push(every(8000, 14000, croak));
        stops.push(every(16000, 26000, hop));
        stops.push(every(12000, 20000, leap));
        stops.push(every(10000, 18000, dart));
        stops.push(every(5000, 9000, splash));
      } else { stops.splice(0).forEach(s => s()); stopSound(); }
    });
    return () => { gate.stop(); stops.forEach(s => s()); timers.forEach(clearTimeout); };
  }
  return { root, stage: root.firstElementChild, start, size: SIZE };
}
