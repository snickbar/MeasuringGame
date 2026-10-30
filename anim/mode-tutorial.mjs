// Per-mode animated how-to-play slideshows. Self-contained dialog; the host app only supplies
// sample objects, and (for party use) a hook that lets the host end the slideshow for everyone.
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const img = (src, cls = '') => `<img class="${cls}" src="${esc(src)}" alt="" draggable="false">`;

// Each scene is plain HTML whose CSS animations loop; changing slides re-renders it, so it restarts.
const bluffNums = s => { const ans = Math.max(2, Math.round(s.answer || 11)); return { ans, low: Math.max(1, Math.round(ans / 2)), high: ans * 2 }; };
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
  teams: s => `<div class="mt-row mt-teams">${[0, 1].map(t => `<div class="mt-team t${t}">${(s.avatars || []).slice(t * 2, t * 2 + 2).map(a => img(a, 'mt-av sm')).join('')}<b>${t ? 'Blue' : 'Red'}</b></div>`).join('<span class="mt-vs">vs</span>')}</div><div class="mt-tag">Closest guess scores for the whole team</div>`,
  bracket: () => `<div class="mt-bar"><i class="mt-lo">LOW</i><i class="mt-ans">answer</i><i class="mt-hi">HIGH</i></div><div class="mt-tag">Answer sits between your picks</div>`,
  pot: () => `<div class="mt-row mt-chips">${[0, 1, 2, 3].map(i => img('icons/coin.png', 'mt-coin big k' + i)).join('')}</div><div class="mt-row"><span class="mt-btn">Bet</span><span class="mt-btn fold">Fold</span></div>`,
  bluff1: s => { const n = bluffNums(s); return `<div class="mt-q">${esc(s.prompt || 'How many pencils fit along the door?')}</div>
    <div class="mt-row mt-opts">${[['Too Low', n.low], ['Correct', n.ans], ['Too High', n.high]].map(([l, v], i) => `<div class="mt-opt${i === 2 ? ' pick' : ''}"><small>${l}</small><b>${v}</b>${i === 2 ? '<i class="mt-circle"></i>' : ''}</div>`).join('')}</div>
    <div class="mt-tag mt-late">You have to claim one</div>`; },
  bluff2: s => { const n = bluffNums(s); return `<div class="mt-q">${esc(s.prompt || 'How many pencils fit along the door?')}</div>
    <div class="mt-claim2">The maker says <b>${n.high}</b></div>
    <div class="mt-row mt-votes"><span class="mt-btn">Too Low</span><span class="mt-btn">Correct</span><span class="mt-btn sel">Too High</span></div>`; },
  bluff3: s => { const n = bluffNums(s); return `<div class="mt-reveal"><small>The answer</small><b>${n.ans}</b></div>
    <div class="mt-row mt-verdict"><span class="mt-chip">${n.high} was <b>Too High</b></span><span class="mt-chip good">Voters who said Too High: +2</span></div>`; },
  streak: () => `<div class="mt-row mt-streak">${[0, 1, 2].map(i => `<span class="mt-check c${i}">✓</span>`).join('')}${img('icons/survival-shield-full.webp', 'mt-shield')}</div>
    <div class="mt-row">${img('icons/coin.png', 'mt-coin k0')}${img('icons/coin.png', 'mt-coin k1')}${img('icons/coin.png', 'mt-coin k2')}</div>`,
};

export const MODE_TUTORIALS = {
  party: { title: 'Party', slides: [
    { scene: 'bots', head: 'Everyone guesses together', text: 'Each round, everyone guesses how many of the small object fit along the big one.' },
    { scene: 'guess', head: 'Lock in before time runs out', text: 'Type your guess before the timer ends. The closest guess wins the round.' },
    { scene: 'botsSC', head: 'Then a Second Chance', text: 'See everyone’s guesses, then back your own with Double Down or pick the one you think is real.' },
    { scene: 'wins', head: 'Closest scores points', text: 'The closest guess scores +3, or +5 if it is within 1% of the answer. Most points wins.' },
  ] },
  teamvteam: { title: 'Team vs Team', slides: [
    { scene: 'teams', head: 'Play as a team', text: 'Pick a team color with your partner. Whoever guesses closest wins the point for the whole team.' },
    { scene: 'guess', head: 'Everyone still guesses', text: 'Each player locks in their own guess every round.' },
    { scene: 'botsSC', head: 'Second Chance works the same', text: 'Back your guess or switch after seeing the table. Points go to your team.' },
  ] },
  teamworlds: { title: 'Team Worlds', slides: [
    { scene: 'teams', head: 'You and a partner', text: 'Work through a World together, one question at a time.' },
    { scene: 'guess', head: 'Both of you guess', text: 'Each question asks how many of the small thing fit along the big one.' },
    { scene: 'stars', head: 'Earn stars as a team', text: 'Your average accuracy sets your stars: 60%, 75% and 90%.' },
  ] },
  hl: { title: 'High / Low Survival', slides: [
    { scene: 'hearts', head: 'You share 3 lives', text: 'Survive together as long as you can.' },
    { scene: 'bracket', head: 'One high, one low', text: 'One player guesses at or below the answer and the other at or above it. The real answer must land between your picks.' },
    { scene: 'wins', head: 'Keep the bracket tight', text: 'Too wide a gap, crossed picks or a miss costs a life. The allowed gap shrinks every round you survive.' },
  ] },
  highstakes: { title: 'High Stakes', slides: [
    { scene: 'guess', head: 'Pick the real answer', text: 'Several numbers are on the table and only one is the real answer.' },
    { scene: 'pot', head: 'Bet your table coins', text: 'Put coins in the pot when you think you have it, or fold to keep what you have.' },
    { scene: 'coins', head: 'Win the pot', text: 'Whoever was right takes the pot. Watch it grow and know when to fold.' },
  ] },
  bluff: { title: 'Bluff the Room', slides: [
    { scene: 'bluff1', head: 'The maker sees three answers', text: 'One is too low, one is correct and one is too high. The maker must claim one of them, even a wrong one, to fool the room.' },
    { scene: 'bluff2', head: 'Everyone else votes', text: 'The rest of the room only sees the claim. Is it Too Low, Correct or Too High?' },
    { scene: 'bluff3', head: 'Then the answer is revealed', text: 'Correct votes earn +2. The maker earns +1 for every player they fool.' },
  ] },
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
  // Party playback: the app decides which slide is showing (from a shared clock), so every player
  // sees the same slide at the same moment. Only the host gets a button, and it ends it for everyone.
  let syncedIdx = -1;
  function synced(mode, i, { host = false, onSkip = () => {} } = {}) {
    const def = MODE_TUTORIALS[mode];
    if (!def) return false;
    i = Math.max(0, Math.min(def.slides.length - 1, i));
    if (finish) return false; // a solo slideshow is open
    if (dialog.open && syncedIdx === i && dialog.dataset.synced === mode) return true;
    syncedIdx = i;
    const sl = def.slides[i];
    dialog.dataset.synced = mode;
    dialog.innerHTML = `<header><span>${esc(def.title)} &middot; ${i + 1} of ${def.slides.length}</span>${host ? '<button type="button" class="mt-skip" data-skip>Skip for everyone</button>' : ''}</header>
      <div class="mt-scene" data-scene="${sl.scene}">${SCENES[sl.scene](sample())}</div>
      <h2 id="mt-head">${esc(sl.head)}</h2><p>${esc(sl.text)}</p>
      <div class="mt-dots">${def.slides.map((_, n) => `<i class="${n === i ? 'on' : ''}"></i>`).join('')}</div>
      <p class="mt-wait">${host ? 'Everyone is watching this together.' : 'The host is showing how to play.'}</p>`;
    dialog.querySelector('[data-skip]')?.addEventListener('click', onSkip);
    if (!dialog.open) dialog.showModal();
    return true;
  }
  function endSynced() { if (dialog.dataset.synced) { delete dialog.dataset.synced; syncedIdx = -1; if (dialog.open) dialog.close(); } }
  dialog.addEventListener('cancel', e => { e.preventDefault(); });
  return { play, synced, endSynced, seen, mark, count: mode => MODE_TUTORIALS[mode]?.slides.length || 0, has: mode => !!MODE_TUTORIALS[mode], close: () => close('closed'),
    // Plays once, the first time a solo mode opens.
    auto: mode => (!seen(mode) && MODE_TUTORIALS[mode]) ? play(mode) : Promise.resolve('seen') };
}
