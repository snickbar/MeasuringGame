// Per-mode animated how-to-play slideshows. Self-contained dialog; the host app only supplies
// sample objects, and (for party use) a hook that lets the host end the slideshow for everyone.
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const img = (src, cls = '') => `<img class="${cls}" src="${esc(src)}" alt="" draggable="false">`;

// Each scene is plain HTML whose CSS animations loop; changing slides re-renders it, so it restarts.
const SCENES = {
  hearts: () => `<div class="mt-row">${[0, 1, 2].map(i => img('icons/life-heart-full.webp', 'mt-heart mt-bounce d' + i)).join('')}</div>`,
  guess: s => `<div class="mt-row mt-objs"><div class="mt-many">${[0, 1, 2].map(() => img(s.unit.image, 'mt-obj tiny')).join('')}</div><span class="mt-vs">fit along</span>${img(s.target.image, 'mt-obj big')}</div>
    <div class="mt-input"><span class="mt-type t1">1</span><span class="mt-type t2">2</span><span class="mt-type t3">0</span></div>`,
  gauge: () => `<div class="mt-gauge"><i class="mt-fill"></i><b class="mt-mark"><em>60%</em></b></div>
    <div class="mt-row mt-heartswap">${img('icons/life-heart-full.webp', 'mt-heart mt-h-full')}${img('icons/life-heart-cracked.webp', 'mt-heart mt-h-crack')}</div>`,
  stars: () => `<div class="mt-row mt-stars">${[60, 75, 90].map((n, i) => `<div class="mt-star s${i}">${img('icons/flair/star.png', 'mt-starimg')}<b>${n}%</b></div>`).join('')}</div><div class="mt-tag">Average of 5 questions</div>`,
  daily: () => `<div class="mt-row">${[1, 2, 3].map(n => `<span class="mt-check q c${n - 1}">${n}</span>`).join('')}</div><div class="mt-tag mt-once">One try</div>`,
  month: s => `<div class="mt-grid">${(s.items || []).slice(0, 6).map((it, i) => `<span class="mt-cell" style="animation-delay:${(i * .35).toFixed(2)}s">${img(it.image, 'mt-cellimg')}</span>`).join('')}</div><div class="mt-tag">Each one shows up once</div>`,
  pick: s => `<div class="mt-row mt-objs"><div class="mt-cand">${img(s.unit.image, 'mt-obj')}</div><span class="mt-vs">or</span><div class="mt-cand win">${img(s.target.image, 'mt-obj big')}<i class="mt-ring"></i><b class="mt-tick">✓</b></div></div>`,
  bots: s => SCENES.botsBase(s),
  botsSC: s => SCENES.botsBase({ ...s, sc: true }),
  botsBase: s => `<div class="mt-row mt-bots">${(s.avatars || []).slice(0, 3).map((a, i) => `<div class="mt-bot b${i}">${img(a, 'mt-av')}<span>${[80, 130, 120][i]}</span></div>`).join('')}</div>${s.sc ? '<div class="mt-tag mt-sc">Second Chance</div>' : ''}`,
  wins: () => `<div class="mt-row mt-streak">${[0, 1, 2].map(i => `<span class="mt-check c${i}">✓</span>`).join('')}</div>`,
  coins: () => `<div class="mt-row mt-streak">${[0, 1, 2].map(i => `<span class="mt-check c${i}">✓</span>`).join('')}</div>
    <div class="mt-row">${img('icons/coin.png', 'mt-coin k0')}${img('icons/coin.png', 'mt-coin k1')}${img('icons/coin.png', 'mt-coin k2')}</div>`,
  streak: () => `<div class="mt-row mt-streak">${[0, 1, 2].map(i => `<span class="mt-check c${i}">✓</span>`).join('')}${img('icons/survival-shield-full.webp', 'mt-shield')}</div>
    <div class="mt-row">${img('icons/coin.png', 'mt-coin k0')}${img('icons/coin.png', 'mt-coin k1')}${img('icons/coin.png', 'mt-coin k2')}</div>`,
};

export const MODE_TUTORIALS = {
  worlds: { title: 'Worlds', slides: [
    { scene: 'guess', head: 'Five questions a level', text: 'Guess how many of the small thing fit along the big one. No timer, so take your time.' },
    { scene: 'stars', head: 'Earn up to 3 stars', text: 'Your average accuracy across the five questions sets your stars: 60%, 75% and 90%.' },
    { scene: 'wins', head: 'Unlock the next level', text: 'Earn 1 star on a level to open the next one, and keep collecting stars to fill each world.' },
  ] },
  daily: { title: 'Daily Challenge', slides: [
    { scene: 'daily', head: 'Three questions, one try', text: 'A fresh set every day. Once you finish it, come back tomorrow for a new one.' },
    { scene: 'guess', head: 'Guess how many', text: 'Everyone gets the same questions, so your score goes on the daily leaderboard.' },
    { scene: 'coins', head: 'Earn coins', text: 'The closer your guesses, the more coins you earn.' },
  ] },
  monthly: { title: 'Monthly Challenge', slides: [
    { scene: 'month', head: 'A new pack every month', text: 'Every object in this month’s pack shows up exactly once.' },
    { scene: 'guess', head: 'Guess how many', text: 'Each question asks how many of one object fit along another.' },
    { scene: 'coins', head: 'Climb the board', text: 'Your results go on the monthly leaderboard and earn coins.' },
  ] },
  wb: { title: 'Which Is Bigger', slides: [
    { scene: 'pick', head: 'Tap the bigger one', text: 'Two objects appear. Tap the one that is really bigger.' },
    { scene: 'hearts', head: 'A wrong pick costs a life', text: 'You have three lives. Lose them all and the run is over.' },
    { scene: 'coins', head: 'It gets trickier', text: 'The objects get closer in size the further you go. Keep going for coins.' },
  ] },
  quick: { title: 'Quick Game', slides: [
    { scene: 'bots', head: 'Play against bots', text: 'Pick how sharp the bots are, then everyone guesses the same question.' },
    { scene: 'guess', head: 'Guess how many', text: 'Type how many of the small thing fit along the big one, then lock it in.' },
    { scene: 'botsSC', head: 'Take a Second Chance', text: 'After seeing everyone’s guesses you can back your own guess or switch to a better one.' },
  ] },
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
