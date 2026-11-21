// Rec Room home (Retro Rewind): the old TV plays a little side-scrolling game on its screen. A tap on the TV flips the channel (a burst of static)
// and the game starts over. The picture the artwork was drawn on is the same 1029 x 2222 canvas as the other detailed Home scenes.
import { place, img, hit, watchActive } from './home-worlds-util.mjs';
const D = 'anim/home-art/home-retro/';
const TV = { x: 137, y: 757, w: 261, h: 225 }; // the green screen of the TV in the picture
const FRAMES = 4, FRAME_MS = 230;
export const SIZE = { width: 1029, height: 2222 };

export async function build(home, load, current) {
  await Promise.all(['plate', 'game'].map(n => load(D + n + '.webp')));
  if (!current()) return null;
  const root = document.createElement('div');
  root.id = 'home-art'; root.dataset.scene = 'retro';
  root.innerHTML = `<div class="hs-stage">
    ${img(D + 'plate.webp', 'hs-plate')}
    <div class="r-tv" style="${place(TV.x, TV.y, TV.w, TV.h)}"><i class="r-game"></i><i class="r-static"></i><i class="r-glass"></i></div>
    ${hit('tv', TV.x - 10, TV.y - 10, TV.w + 150, TV.h + 100, 'Change the TV channel')}
  </div>`;
  const game = root.querySelector('.r-game'), tv = root.querySelector('.r-tv');
  game.style.backgroundImage = `url(${D}game.webp)`;
  const setFrame = i => { game.style.backgroundPosition = `${i / (FRAMES - 1) * 100}% 0`; };
  setFrame(0);

  function start() {
    let timer = 0, frame = 0, flicker = 0;
    const gate = watchActive(home, root, on => {
      clearInterval(timer); timer = 0;
      if (on) timer = setInterval(() => { frame = (frame + 1) % FRAMES; setFrame(frame); }, FRAME_MS);
    });
    root.addEventListener('click', e => {
      if (!e.target.closest('[data-w="tv"]') || !gate.isActive()) return;
      frame = 0; setFrame(0);
      delete tv.dataset.static; void tv.offsetWidth; tv.dataset.static = '';
      clearTimeout(flicker); flicker = setTimeout(() => { delete tv.dataset.static; }, 420);
    });
    return () => { gate.stop(); clearInterval(timer); clearTimeout(flicker); };
  }
  return { root, stage: root.firstElementChild, start, size: SIZE };
}
