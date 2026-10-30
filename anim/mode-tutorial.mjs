// Per-mode animated how-to-play slideshows. Self-contained dialog; the host app only supplies
// sample objects, and (for party use) a hook that lets the host end the slideshow for everyone.
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const img = (src, cls = '') => `<img class="${cls}" src="${esc(src)}" alt="" draggable="false">`;

// Each scene is plain HTML whose CSS animations loop; changing slides re-renders it, so it restarts.
const SCENES = {
  hearts: () => `<div class="mt-row">${[0, 1, 2].map(i => img('icons/life-heart-full.webp', 'mt-heart mt-bounce d' + i)).join('')}</div>`,
  guess: s => `<div class="mt-row mt-objs">${img(s.unit.image, 'mt-obj')}<span class="mt-vs">vs</span>${img(s.target.image, 'mt-obj big')}</div>
    <div class="mt-input"><span class="mt-type t1">1</span><span class="mt-type t2">2</span><span class="mt-type t3">0</span></div>`,
  gauge: () => `<div class="mt-gauge"><i class="mt-fill"></i><b class="mt-mark"><em>60%</em></b></div>
    <div class="mt-row mt-heartswap">${img('icons/life-heart-full.webp', 'mt-heart mt-h-full')}${img('icons/life-heart-cracked.webp', 'mt-heart mt-h-crack')}</div>`,
  streak: () => `<div class="mt-row mt-streak">${[0, 1, 2].map(i => `<span class="mt-check c${i}">✓</span>`).join('')}${img('icons/survival-shield-full.webp', 'mt-shield')}</div>
    <div class="mt-row">${img('icons/coin.png', 'mt-coin k0')}${img('icons/coin.png', 'mt-coin k1')}${img('icons/coin.png', 'mt-coin k2')}</div>`,
};

export const MODE_TUTORIALS = {
  survival: {
    title: 'Survival',
    slides: [
      { scene: 'hearts', head: 'You have 3 lives', text: 'Keep guessing as long as you have a life left. No timer, no Second Chance.' },
      { scene: 'guess', head: 'Guess how many', text: 'How many of the small thing fit along the big one? Type your best guess.' },
      { scene: 'gauge', head: 'Under 60% costs a life', text: 'The closer your guess, the better. Less than 60% accurate and a heart cracks.' },
      { scene: 'streak', head: 'Stack wins, earn coins', text: 'Every round you survive pays coins. Three in a row earns a shield that blocks one lost life.' },
    ],
  },
};

export function createModeTutorial({ owner, sample, storage }) {
  if (!storage) { try { storage = globalThis.localStorage; } catch {} }
  const sheet = document.createElement('link'); sheet.rel = 'stylesheet'; sheet.href = new URL('./mode-tutorial.css', import.meta.url); document.head.append(sheet);
  const dialog = document.createElement('dialog'); dialog.id = 'mode-tutorial'; dialog.setAttribute('aria-labelledby', 'mt-head'); document.body.append(dialog);
  const key = mode => `size-em-up:mode-tutorial:${owner()}:${mode}`;
  const seen = mode => { try { return storage.getItem(key(mode)) === '1'; } catch { return false; } };
  const mark = mode => { try { storage.setItem(key(mode), '1'); } catch {} };
  let finish = null;

  function close(result) {
    if (dialog.open) dialog.close();
    const f = finish; finish = null;
    if (f) f(result);
  }

  // controls: 'self' (solo: Skip + Back/Next) or 'host' (party host: can Skip for everyone) or 'guest' (watch only).
  function play(mode, { controls = 'self' } = {}) {
    const def = MODE_TUTORIALS[mode];
    if (!def || dialog.open) return Promise.resolve('none');
    let i = 0;
    const s = sample();
    function render() {
      const sl = def.slides[i], last = i === def.slides.length - 1;
      const canSkip = controls !== 'guest';
      dialog.innerHTML = `<header><span>${esc(def.title)} &middot; ${i + 1} of ${def.slides.length}</span>${canSkip ? `<button type="button" class="mt-skip" data-skip>${controls === 'host' ? 'Skip for everyone' : 'Skip'}</button>` : ''}</header>
        <div class="mt-scene" data-scene="${sl.scene}">${SCENES[sl.scene](s)}</div>
        <h2 id="mt-head">${esc(sl.head)}</h2><p>${esc(sl.text)}</p>
        <div class="mt-dots">${def.slides.map((_, n) => `<i class="${n === i ? 'on' : ''}"></i>`).join('')}</div>
        ${controls === 'guest' ? '<p class="mt-wait">The host is showing how to play.</p>' : `<footer>${i > 0 ? '<button type="button" data-back>Back</button>' : ''}<button type="button" data-next class="mt-go">${last ? 'Got it' : 'Next'}</button></footer>`}`;
      dialog.querySelector('[data-skip]')?.addEventListener('click', () => { mark(mode); close('skipped'); });
      dialog.querySelector('[data-back]')?.addEventListener('click', () => { i--; render(); });
      dialog.querySelector('[data-next]')?.addEventListener('click', () => { if (last) { mark(mode); close('done'); } else { i++; render(); } });
    }
    render();
    dialog.showModal();
    return new Promise(res => { finish = res; });
  }
  dialog.addEventListener('cancel', e => { e.preventDefault(); });
  return { play, seen, has: mode => !!MODE_TUTORIALS[mode], close: () => close('closed'),
    // Plays once, the first time a solo mode opens.
    auto: mode => (!seen(mode) && MODE_TUTORIALS[mode]) ? play(mode) : Promise.resolve('seen') };
}
