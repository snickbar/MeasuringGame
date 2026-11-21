// Rec Room home (Retro Rewind): the old TV plays a little side-scrolling game on its screen. A tap on the TV flips the channel (a burst of static)
// and the game starts over. The picture the artwork was drawn on is the same 1029 x 2222 canvas as the other detailed Home scenes.
import { place, img, hit, watchActive } from './home-worlds-util.mjs';
import { drawRunnerGame } from './retro-runner.mjs';
const D = 'anim/home-art/home-retro/';
const TV = { x: 137, y: 757, w: 261, h: 225 }; // the green screen of the TV in the picture
export const SIZE = { width: 1029, height: 2222 };

export async function build(home, load, current) {
  const names = ['plate', 'clean', 'phone', 'boombox', 'joystick', 'notes'];
  const loaded = await Promise.all([...names.map(n => load(D + n + '.webp')), load('anim/retro-runner.webp')]);
  const art = Object.fromEntries(names.map((n, i) => [n, loaded[i]])), sprites = loaded[names.length];
  if (!current()) return null;
  // Only these little edited patches cover the baked-in props; all other original room pixels stay untouched.
  const patches = [[574, 541, 300, 188], [831, 884, 198, 124], [201, 1225, 33, 75], [447, 1207, 33, 76]];
  const patch = ([x, y, w, h]) => img(D + 'clean.webp', 'hs-plate r-clean',
    `clip-path:inset(${y / SIZE.height * 100}% ${(SIZE.width - x - w) / SIZE.width * 100}% ${(SIZE.height - y - h) / SIZE.height * 100}% ${x / SIZE.width * 100}%);`);
  const prop = (name, cls, x, bottom, width, extra = '') => {
    const height = width * art[name].naturalHeight / art[name].naturalWidth;
    return `<div class="r-prop ${cls}" style="${place(x, bottom - height, width, height)}">${img(D + name + '.webp', 'r-part')}${extra}</div>`;
  };
  const root = document.createElement('div');
  root.id = 'home-art'; root.dataset.scene = 'retro';
  root.innerHTML = `<div class="hs-stage">
    ${img(D + 'plate.webp', 'hs-plate')}
    ${patches.map(patch).join('')}
    ${prop('phone', 'r-phone', 833, 1006, 193)}
    ${prop('boombox', 'r-boombox', 580, 728, 292, img(D + 'notes.webp', 'r-notes n0') + img(D + 'notes.webp', 'r-notes n1') + '<i class="r-led"></i>')}
    ${prop('joystick', 'r-joystick r-stick-left', 208, 1300, 17)}
    ${prop('joystick', 'r-joystick r-stick-right', 453, 1280, 17)}
    <i class="r-cassette-glint" style="${place(879, 595, 108, 130)}"></i>
    <div class="r-tv" style="${place(TV.x, TV.y, TV.w, TV.h)}"><canvas class="r-game" width="192" height="160" aria-hidden="true"></canvas><i class="r-static"></i><i class="r-glass"></i></div>
    ${hit('tv', TV.x - 10, TV.y - 10, TV.w + 150, TV.h + 100, 'Change the TV channel')}
    ${hit('phone', 825, 874, 204, 141, 'Ring the telephone')}
    ${hit('boombox', 574, 536, 300, 197, 'Play the boombox')}
    ${hit('joystick-left', 155, 1216, 134, 127, 'Wiggle the left joystick')}
    ${hit('joystick-right', 399, 1196, 128, 123, 'Wiggle the right joystick')}
  </div>`;
  const game = root.querySelector('.r-game'), tv = root.querySelector('.r-tv');
  const context = game.getContext('2d');
  const paint = time => drawRunnerGame(context, { width: game.width, height: game.height, time, sprites });
  paint(0);

  function start() {
    let raf = 0, elapsed = 0, last = 0, flicker = 0;
    const timers = new Map(), actions = new Map();
    const abort = new AbortController();
    const animate = (selector, cls, duration) => {
      const element = root.querySelector(selector); clearTimeout(timers.get(selector));
      element.classList.remove(cls); void element.offsetWidth; element.classList.add(cls);
      actions.set(selector, cls);
      timers.set(selector, setTimeout(() => { element.classList.remove(cls); timers.delete(selector); actions.delete(selector); }, duration));
    };
    const stopEffects = () => {
      for (const timer of timers.values()) clearTimeout(timer); timers.clear();
      for (const [selector, cls] of actions) root.querySelector(selector)?.classList.remove(cls); actions.clear();
      clearTimeout(flicker); delete tv.dataset.static;
    };
    const tick = now => {
      if (last) elapsed += Math.min(.08, (now - last) / 1000);
      last = now; paint(elapsed); raf = requestAnimationFrame(tick);
    };
    const gate = watchActive(home, root, on => {
      cancelAnimationFrame(raf); raf = 0; last = 0;
      root.classList.toggle('r-motion', on);
      if (on) raf = requestAnimationFrame(tick);
      else stopEffects();
    });
    root.addEventListener('click', e => {
      if (!gate.isActive()) return;
      const action = e.target.closest('[data-w]')?.dataset.w;
      if (action === 'phone') return animate('.r-phone', 'r-ringing', 1700);
      if (action === 'boombox') return animate('.r-boombox', 'r-playing', 4800);
      if (action === 'joystick-left') return animate('.r-stick-left', 'r-wiggle', 1000);
      if (action === 'joystick-right') return animate('.r-stick-right', 'r-wiggle', 1000);
      if (action !== 'tv') return;
      elapsed = 0; last = 0; paint(0);
      delete tv.dataset.static; void tv.offsetWidth; tv.dataset.static = '';
      clearTimeout(flicker); flicker = setTimeout(() => { delete tv.dataset.static; }, 420);
    }, { signal: abort.signal });
    return () => { gate.stop(); abort.abort(); cancelAnimationFrame(raf); stopEffects(); root.classList.remove('r-motion'); };
  }
  return { root, stage: root.firstElementChild, start, size: SIZE };
}
