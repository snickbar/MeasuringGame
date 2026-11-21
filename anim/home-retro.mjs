// Rec Room home (Retro Rewind): the old TV plays a little side-scrolling game on its screen. A tap on the TV flips the channel (a burst of static)
// and the game starts over. The picture the artwork was drawn on is the same 1029 x 2222 canvas as the other detailed Home scenes.
import { place, img, hit, watchActive } from './home-worlds-util.mjs';
import { drawRunnerGame } from './retro-runner.mjs';
const D = 'anim/home-art/home-retro/';
const TV = { x: 137, y: 757, w: 261, h: 225 }; // the green screen of the TV in the picture
export const SIZE = { width: 1029, height: 2222 };

export async function build(home, load, current) {
  const [, sprites] = await Promise.all([load(D + 'plate.webp'), load('anim/retro-runner.webp')]);
  if (!current()) return null;
  const root = document.createElement('div');
  root.id = 'home-art'; root.dataset.scene = 'retro';
  root.innerHTML = `<div class="hs-stage">
    ${img(D + 'plate.webp', 'hs-plate')}
    <div class="r-tv" style="${place(TV.x, TV.y, TV.w, TV.h)}"><canvas class="r-game" width="192" height="160" aria-hidden="true"></canvas><i class="r-static"></i><i class="r-glass"></i></div>
    ${hit('tv', TV.x - 10, TV.y - 10, TV.w + 150, TV.h + 100, 'Change the TV channel')}
  </div>`;
  const game = root.querySelector('.r-game'), tv = root.querySelector('.r-tv');
  const context = game.getContext('2d');
  const paint = time => drawRunnerGame(context, { width: game.width, height: game.height, time, sprites });
  paint(0);

  function start() {
    let raf = 0, elapsed = 0, last = 0, flicker = 0;
    const tick = now => {
      if (last) elapsed += Math.min(.08, (now - last) / 1000);
      last = now; paint(elapsed); raf = requestAnimationFrame(tick);
    };
    const gate = watchActive(home, root, on => {
      cancelAnimationFrame(raf); raf = 0; last = 0;
      if (on) raf = requestAnimationFrame(tick);
    });
    root.addEventListener('click', e => {
      if (!e.target.closest('[data-w="tv"]') || !gate.isActive()) return;
      elapsed = 0; last = 0; paint(0);
      delete tv.dataset.static; void tv.offsetWidth; tv.dataset.static = '';
      clearTimeout(flicker); flicker = setTimeout(() => { delete tv.dataset.static; }, 420);
    });
    return () => { gate.stop(); cancelAnimationFrame(raf); clearTimeout(flicker); };
  }
  return { root, stage: root.firstElementChild, start, size: SIZE };
}
