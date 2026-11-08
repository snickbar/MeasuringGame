// Per-mode animated how-to-play slideshows. Self-contained dialog; the host app only supplies
// sample objects, and (for party use) a hook that lets the host end the slideshow for everyone.
import {mountHighLowTutorial} from './high-low-tutorial.mjs';
import {HL_MESSAGE_BOTTLE} from './high-low-bottles.mjs';
import {partyTutorialScene} from './party-tutorial.mjs';
import {MORE_MODE_TUTORIALS,extraTutorialScene} from './more-tutorials.mjs';
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Each mode's mascot (or pair) stands on the dialog's top edge and points at the slide. It gets as tall as the room above the dialog allows.
// 'side' is the corner it stands in: the mascots point toward the slide, so a left-pointing one stands on the right.
const M = f => `anim/mode-mascots/${f}-tutorial.webp`;
const MODE_MASCOTS = {
  party: { srcs: [M('party-ant')] },
  hl: { srcs: [[M('hl-shark'), .66], [M('hl-bird'), .62]], compact: 1 },
  survival: { srcs: [M('survival-knight'), M('survival-dragon')] },
  wb: { srcs: [M('wb-elephant'), M('wb-mouse')] },
  teamvteam: { srcs: [M('team-dog'), M('team-cat')] },
  quick: { srcs: [M('quick-robot')], side: 'right' },
  worlds: { srcs: [M('worlds-fox')] },
  teamworlds: { srcs: [M('teamworlds-boy'), M('teamworlds-girl')] },
  bluff: { srcs: [M('bluff-raccoon')] },
  highstakes: { srcs: [M('highstakes-pig')] },
  daily: { srcs: [M('daily-rooster')] },
  monthly: { srcs: [M('monthly-squirrel')] },
};
// An entry is a picture, or [picture, size] when it should stand shorter than its partner. 'compact' is which one shows when there is little room.
const mascotList = def => def.mascots.srcs.map(m => Array.isArray(m) ? m : [m, 1]);
const mascotKey = def => def.mascots ? mascotList(def).map(m => m[0]).join('|') : '';
const mascotHtml = def => def.mascots ? `<span class="mt-mascots" data-side="${def.mascots.side || 'left'}" data-key="${esc(mascotKey(def))}">${mascotList(def).map(([src, k], n) => `<img class="mt-mascot${n === (def.mascots.compact || 0) ? ' mt-keep' : ''}" src="${esc(src)}" style="--s:${k}" alt="" draggable="false">`).join('')}</span>` : '';
function fitMascot(dialog) {
  if (!dialog.querySelector('.mt-mascots') || !dialog.open) return;
  const room = dialog.getBoundingClientRect().top - 8;
  // Too little room above (a tall dialog on a short phone): stand inside the top corner beside the title instead.
  dialog.toggleAttribute('data-compact', room < 46);
  dialog.style.setProperty('--mt-mh', Math.min(96, Math.max(46, room)) + 'px');
  // In the compact layout the title steps aside by the width of the mascot that is showing.
  const k = dialog.querySelector('.mt-keep');
  if (k) dialog.style.setProperty('--mt-mw', Math.max(40, k.naturalWidth ? Math.ceil(46 * (k.naturalWidth / k.naturalHeight)) + 6 : 0) + 'px');
}
// Replaces the dialog's content for a new slide but leaves the same mascots standing, so they do not pop in again on every slide.
function setSlideHtml(dialog, def, html) {
  const keep = def.mascots && [...dialog.children].find(c => c.classList.contains('mt-mascots') && c.dataset.key === mascotKey(def));
  [...dialog.children].forEach(c => { if (c !== keep) c.remove(); });
  dialog.insertAdjacentHTML('beforeend', (def.mascots && !keep ? mascotHtml(def) : '') + html);
  // The picture's width is only known once it has loaded, and the compact layout needs it to leave the title clear.
  for (const im of dialog.querySelectorAll('.mt-keep')) if (!im.complete) im.addEventListener('load', () => fitMascot(dialog), { once: true });
}
const img = (src, cls = '') => `<img class="${cls}" src="${esc(src)}" alt="" draggable="false">`;

// Each scene is plain HTML whose CSS animations loop; changing slides re-renders it, so it restarts.
const bluffNums = s => { const ans = Math.max(2, Math.round(s.answer || 11)); return { ans, low: Math.max(1, Math.round(ans / 2)), high: ans * 2 }; };
const SCENES = {
  extraExample: s => extraTutorialScene(s.lesson,s),
  partyExample: s => partyTutorialScene(s.lesson,{team:s.lessonMode==='teamvteam',quick:s.lessonMode==='quick'}),
  hlRoles: () => `<div class="mt-hl-roles"><div><img src="anim/high-low-art/shark.webp" alt="LOW shark"><b>LOW ≤ answer</b><small>Close, without going over</small></div><div><img src="anim/high-low-art/bird.webp" alt="HIGH bird"><b>HIGH ≥ answer</b><small>Close, without going under</small></div></div><div class="mt-hl-bottles">${[0,1,2].map(()=>img(HL_MESSAGE_BOTTLE,'')).join('')}<span>Three shared bottles</span></div>`,
  hlOcean: () => '<div class="mt-hl-demo"></div>',
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
  hs1: s => { const n = bluffNums(s), o = [Math.max(1, Math.round(n.ans / 2)), Math.round(n.ans * .75), n.ans, n.ans * 2]; return `<div class="mt-q">${esc(s.prompt || 'How many pencils fit along the door?')}</div>
    <div class="mt-row mt-opts four">${o.map((v, i) => `<div class="mt-opt${i === 2 ? ' pick' : ''}"><b>${v}</b>${i === 2 ? '<i class="mt-circle"></i>' : ''}</div>`).join('')}</div>
    <div class="mt-tag mt-late">Secretly pick the real one</div>`; },
  hs2: s => `<div class="mt-table"><div class="mt-pot">${img('icons/coin.png', 'mt-potcoin')}<span>Pot</span></div>
    ${[0, 1, 2].map(i => `<div class="mt-seat s${i}">${img((s.avatars || [])[i] || '', 'mt-av sm')}${[0, 1].map(k => img('icons/coin.png', `mt-fly up f${i} k${k}`)).join('')}</div>`).join('')}</div>
    <div class="mt-row mt-acts"><span>Fold</span><span>Check</span><span>Call</span><span>Raise</span></div>`,
  hs3: s => { const n = bluffNums(s), o = [Math.max(1, Math.round(n.ans / 2)), Math.round(n.ans * .75), n.ans, n.ans * 2]; return `<div class="mt-row mt-opts four small">${o.map((v, i) => `<div class="mt-opt${i === 2 ? ' real' : ' dim'}"><b>${v}</b>${i === 2 ? '<em>✓ real</em>' : ''}</div>`).join('')}</div>
    <div class="mt-table short"><div class="mt-pot">${img('icons/coin.png', 'mt-potcoin')}<span>Pot</span></div>
    ${[0, 1, 2].map(i => `<div class="mt-seat s${i}${i === 2 ? ' win' : ''}">${img((s.avatars || [])[i] || '', 'mt-av sm')}${i === 2 ? [0, 1, 2].map(k => img('icons/coin.png', `mt-fly down k${k}`)).join('') : ''}</div>`).join('')}</div>`; },
  partners: s => `<div class="mt-row mt-partners"><div class="mt-team t0">${(s.avatars || []).slice(0, 2).map(a => img(a, 'mt-av sm')).join('')}<b>Your team</b></div></div><div class="mt-tag">Always you and one partner</div>`,
  starmeter: () => `<div class="mt-sm"><div class="mt-sm-stars">${[60, 75, 90].map((n, i) => `<div class="mt-sm-star st${i}" style="left:${n}%">${img('icons/flair/star.png', 'mt-sm-img')}<small>${n}%</small></div>`).join('')}</div>
    <div class="mt-sm-bar"><i class="mt-sm-fill"></i></div><div class="mt-sm-label">Team accuracy <b>82%</b></div></div>`,
  hlLow: s => `<div class="mt-q">${esc(s.prompt || 'How many pencils fit along the door?')}</div><div class="mt-role">You are the <b>LOW</b>!</div><div class="mt-tag mt-late">Pick as close as you can without going over</div>`,
  hlReveal: s => { const n = bluffNums(s), lo = Math.round(n.ans * .8), hi = Math.round(n.ans * 1.3), g = (hi / lo).toFixed(1); return `<div class="mt-line"><span class="mt-pt lo" style="left:12%"><small>LOW</small><b>${lo}</b></span><span class="mt-pt ans" style="left:50%"><small>Answer</small><b>${n.ans}</b></span><span class="mt-pt hi" style="left:88%"><small>HIGH</small><b>${hi}</b></span><i class="mt-span"></i></div>
    <div class="mt-tag mt-late">Gap ${g}× &middot; limit 2.5× &middot; Survived!</div>`; },
  streak: () => `<div class="mt-row mt-streak">${[0, 1, 2].map(i => `<span class="mt-check c${i}">✓</span>`).join('')}${img('icons/survival-shield-full.webp', 'mt-shield')}</div>
    <div class="mt-row">${img('icons/coin.png', 'mt-coin k0')}${img('icons/coin.png', 'mt-coin k1')}${img('icons/coin.png', 'mt-coin k2')}</div>`,
};

export const MODE_TUTORIALS = {
  party: { title: 'Classic Party', autoplay:true, slideMs:7500, slides: [
    { scene:'partyExample',lesson:'players',head:'Same question. Your own guess.',text:'Everyone plays on their own device. Try to be the closest each round.' },
    { scene:'partyExample',lesson:'measure',head:'Think end to end',text:'Imagine lining up the smaller object along the bigger one. Here, two hot dogs fit along the sneaker.' },
    { scene:'partyExample',lesson:'guess',head:'Make your guess, then lock it in',text:'Alex guesses 1.8 before the timer ends. Decimal guesses are allowed.' },
    { scene:'partyExample',lesson:'chance',head:'A Second Chance to score',text:'One card is the hidden real answer. Sam picks 2 and earns +1 because Sam did not win. Picking the winner’s guess earns nothing.' },
    { scene:'partyExample',lesson:'double',head:'Confident in your own guess?',text:'Alex doubles down on 1.8. It wins closest: +3, plus +2 for Double Down. A losing guess gets no Double Down bonus.' },
    { scene:'partyExample',lesson:'score',head:'Build your score round by round',text:'Closest earns +3, or +5 within 1%. End-game accuracy bonuses also count. Most points wins.' },
  ] },
  teamvteam: { title: 'Team vs Team', autoplay:true, slideMs:7500, slides: [
    { scene:'partyExample',lesson:'players',head:'Pick a color with your partner',text:'Each team has two players. Everyone makes their own guess; points go to the team.' },
    { scene:'partyExample',lesson:'measure',head:'Same question for both teams',text:'Red and Blue both answer this question. Picture the small objects end to end: two hot dogs fit along this sneaker.' },
    { scene:'partyExample',lesson:'guess',head:'Your own guess. Your team’s points.',text:'Alex and Sam are Red; Lee and Jo are Blue. Each of the four players locks in their own number.' },
    { scene:'partyExample',lesson:'chance',head:'Your partner can score, too',text:'Sam picks the hidden answer, 2, and earns +1 for Red. Picking a winning teammate’s guess would earn nothing.' },
    { scene:'partyExample',lesson:'double',head:'Double Down can help your team',text:'Alex’s 1.8 is closest: +3 for Red. Double Down adds +2. It only pays when your own guess wins.' },
    { scene:'partyExample',lesson:'score',head:'The points go into one team total',text:'Alex earns 5 and Sam earns 1: Red gets 6. Tied teammates’ closest-win points count only once for their team.' },
  ] },
  hl: { title: 'High / Low Survival', autoplay: true, slideMs: 9500, slides: [
    { scene: 'hlRoles', head: 'Two roles. One team.', text: 'LOW stays at or below the answer. HIGH stays at or above it. Both aim as close as possible.' },
    { scene: 'hlOcean', example: 'safe', head: 'Keep the answer between you', text: 'Answer: 10. LOW picks 8; HIGH picks 12. The 1.5× gap fits the 2.5× limit. You survive!' },
    { scene: 'hlOcean', example: 'under', head: 'HIGH must not go under', text: 'HIGH picks 9, below the answer of 10. The bird gets wet, and the team loses a bottle.' },
    { scene: 'hlOcean', example: 'over', head: 'LOW must not go over', text: 'LOW picks 11, above the answer of 10. The shark leaves the water, and the team loses a bottle.' },
    { scene: 'hlOcean', example: 'wide', head: 'Stay close together, too', text: '5 and 20 surround 10, but their 4× gap is wider than 2.5×. You lose a bottle. The limit tightens as you survive.' },
    { scene:'extraExample',lesson:'hlShield',head:'Earn an empty bottle',text:'Survive three rounds to earn an empty bottle. It breaks in place of a message bottle the next time you miss. You can hold only one.' },
    { scene:'extraExample',lesson:'hlRewards',head:'Themed rounds mix things up',text:'Each player earns 2 coins per normal survival and 4 for a themed survival. Every fifth survival is themed.' },
  ] },
  quick: { title: 'Quick Game', autoplay:true, slideMs:7500, slides: [
    { scene:'partyExample',lesson:'players',head:'A quick game against bots',text:'Choose the bot difficulty, then play the same round format as Classic Party.' },
    { scene:'partyExample',lesson:'measure',head:'Picture the objects end to end',text:'How many small objects fit along the bigger one? In this example, two hot dogs fit along a sneaker.' },
    { scene:'partyExample',lesson:'guess',head:'Lock in your best guess',text:'Alex guesses 1.8. Decimals are allowed. Submit before the timer ends.' },
    { scene:'partyExample',lesson:'chance',head:'Find the hidden real answer',text:'One Second Chance card is the real answer. Sam chooses 2 and earns +1 as a non-winner. The winner’s guess gives no bonus.' },
    { scene:'partyExample',lesson:'double',head:'Or back your own guess',text:'Alex doubles down on 1.8 and wins closest: 3 + 2 = 5 points. Double Down adds nothing if your guess loses.' },
    { scene:'partyExample',lesson:'score',head:'Most points wins the game',text:'Closest earns +3, or +5 within 1%. Accuracy adds end-game bonuses. Power-ups are available in Quick Game.' },
  ] },
  ...MORE_MODE_TUTORIALS,
};
for (const [k, m] of Object.entries(MODE_MASCOTS)) if (MODE_TUTORIALS[k]) MODE_TUTORIALS[k].mascots = m;

export function createModeTutorial({ owner, sample, storage }) {
  if (!storage) { try { storage = globalThis.localStorage; } catch {} }
  const sheet = document.createElement('link'); sheet.rel = 'stylesheet'; sheet.href = new URL('./mode-tutorial.css', import.meta.url); document.head.append(sheet);
  const dialog = document.createElement('dialog'); dialog.id = 'mode-tutorial'; dialog.tabIndex = -1; dialog.setAttribute('aria-labelledby', 'mt-head'); document.body.append(dialog);
  const key = mode => `size-em-up:mode-tutorial:${owner()}:${mode}`;
  const seen = mode => { try { return storage.getItem(key(mode)) === '1'; } catch { return false; } };
  const mark = mode => { try { storage.setItem(key(mode), '1'); } catch {} };
  let finish = null, clearScene = () => {}, autoTimer = null, autoAt = 0, autoLeft = 0, advance = null, lastAutoAt = -1e9;
  function stopScene() { clearTimeout(autoTimer);autoTimer=null;advance=null;clearScene();clearScene=()=>{}; }
  function armAuto() { if(advance&&!document.hidden){autoAt=performance.now();autoTimer=setTimeout(()=>{autoTimer=null;lastAutoAt=performance.now();advance?.();},autoLeft);} }
  // Pressing a button pauses the countdown so it can't fire between the press and the click; if the press never becomes a click it resumes.
  dialog.addEventListener('pointerdown',e=>{
    if(!advance||!e.target.closest('footer button, [data-skip]')||!autoTimer)return;
    clearTimeout(autoTimer);autoTimer=null;autoLeft=Math.max(1500,autoLeft-(performance.now()-autoAt));
  });
  const resumeIfIdle=()=>setTimeout(()=>{if(advance&&!autoTimer&&dialog.open)armAuto();},80);
  dialog.addEventListener('pointerup',resumeIfIdle);dialog.addEventListener('pointercancel',resumeIfIdle);
  document.addEventListener('visibilitychange',()=>{
    if(!advance)return;
    if(document.hidden){clearTimeout(autoTimer);autoTimer=null;autoLeft=Math.max(0,autoLeft-(performance.now()-autoAt));}
    else armAuto();
  });
  // The star-meter slide uses the real in-game meter (balloon / rocket) and slides it to 85%, lighting stars as it passes them.
  function mountMeter(wrap) {
    const bar = wrap.querySelector('.wl-progress'), fill = wrap.querySelector('.wl-progress-fill'), num = wrap.querySelector('.wl-progress-heading strong');
    const marks = [...wrap.querySelectorAll('.wl-progress-marker')], to = Number(wrap.dataset.meterTo) || 85, DUR = 2200, AT = [60, 75, 90];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce';
    const timers = []; let raf = 0;
    const finish = () => { fill.style.setProperty('--accuracy', to + '%'); num.textContent = to + '%'; marks.forEach((m, i) => m.classList.toggle('earned', to > AT[i])); };
    if (reduced) { finish(); return () => {}; }
    bar.style.setProperty('--wl-t', DUR + 'ms cubic-bezier(.25,.8,.25,1)');
    timers.push(setTimeout(() => {
      fill.style.setProperty('--accuracy', to + '%');
      const t0 = performance.now();
      const tick = now => { const k = Math.min(1, (now - t0) / DUR); num.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))) + '%'; if (k < 1) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
      marks.forEach((m, i) => { if (to > AT[i]) timers.push(setTimeout(() => m.classList.add('earned'), DUR * Math.pow(AT[i] / to, 0.8))); });
    }, 700));
    return () => { timers.forEach(clearTimeout); cancelAnimationFrame(raf); };
  }
  function startScene(sl) {
    if (sl.example) clearScene = mountHighLowTutorial(dialog.querySelector('.mt-hl-demo'), sl.example);
    else { const w = dialog.querySelector('.xt-meter-wrap'); if (w) clearScene = mountMeter(w); }
  }

  function close(result) {
    stopScene();
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
      stopScene();
      const sl = def.slides[i], last = i === def.slides.length - 1;
      const canSkip = controls !== 'guest';
      dialog.dataset.mode=mode;
      dialog.toggleAttribute('data-mascot', !!def.mascots);
      setSlideHtml(dialog, def, `<header><span>${esc(def.title)} &middot; ${i + 1} of ${def.slides.length}</span>${canSkip ? `<button type="button" class="mt-skip" data-skip>${controls === 'host' ? 'Skip for everyone' : 'Skip'}</button>` : ''}</header>
        <div class="mt-scene" data-scene="${sl.scene}">${SCENES[sl.scene]({...s,lesson:sl.lesson,lessonMode:mode})}</div>
        <h2 id="mt-head">${esc(sl.head)}</h2><p>${esc(sl.text)}</p>
        <div class="mt-dots">${def.slides.map((_, n) => `<i class="${n === i ? 'on' : ''}"></i>`).join('')}</div>
        ${controls === 'guest' ? '<p class="mt-wait">The host is showing how to play.</p>' : `<footer>${i > 0 ? '<button type="button" data-back>Back</button>' : ''}<button type="button" data-next class="mt-go">${last ? 'Got it' : 'Next'}</button></footer>`}`);
      fitMascot(dialog);
      dialog.querySelector('[data-skip]')?.addEventListener('click', () => { mark(mode); close('skipped'); });
      dialog.querySelector('[data-back]')?.addEventListener('click', () => { if (performance.now() - lastAutoAt < 800) return; i--; render(); });
      dialog.querySelector('[data-next]')?.addEventListener('click', () => { if (performance.now() - lastAutoAt < 800) return; if (last) { mark(mode); close('done'); } else { i++; render(); } });
      startScene(sl);
      if(def.autoplay&&controls==='self'){advance=()=>{if(last){mark(mode);close('done');}else{i++;render();}};autoLeft=Math.round(def.slideMs*1.6);armAuto();}
    }
    render();
    dialog.showModal();
    dialog.focus({ preventScroll: true });
    fitMascot(dialog);
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
    stopScene();
    const sl = def.slides[i];
    dialog.dataset.synced = mode;
    dialog.dataset.mode = mode;
    dialog.toggleAttribute('data-mascot', !!def.mascots);
    setSlideHtml(dialog, def, `<header><span>${esc(def.title)} &middot; ${i + 1} of ${def.slides.length}</span>${host ? '<button type="button" class="mt-skip" data-skip>Skip for everyone</button>' : ''}</header>
      <div class="mt-scene" data-scene="${sl.scene}">${SCENES[sl.scene]({...sample(),lesson:sl.lesson,lessonMode:mode})}</div>
      <h2 id="mt-head">${esc(sl.head)}</h2><p>${esc(sl.text)}</p>
      <div class="mt-dots">${def.slides.map((_, n) => `<i class="${n === i ? 'on' : ''}"></i>`).join('')}</div>
      <p class="mt-wait">${host ? 'Everyone is watching this together.' : 'The host is showing how to play.'}</p>`);
    dialog.querySelector('[data-skip]')?.addEventListener('click', onSkip);
    if (!dialog.open) { dialog.showModal(); dialog.focus({ preventScroll: true }); }
    fitMascot(dialog);
    startScene(sl);
    return true;
  }
  function endSynced() { if (dialog.dataset.synced) { stopScene();delete dialog.dataset.synced; syncedIdx = -1; if (dialog.open) dialog.close(); } }
  dialog.addEventListener('cancel', e => { e.preventDefault(); });
  return { play, synced, endSynced, seen, mark, duration: mode => MODE_TUTORIALS[mode]?.slideMs || 6500, count: mode => MODE_TUTORIALS[mode]?.slides.length || 0, has: mode => !!MODE_TUTORIALS[mode], close: () => close('closed'),
    // Plays once, the first time a solo mode opens.
    auto: mode => (!seen(mode) && MODE_TUTORIALS[mode]) ? play(mode) : Promise.resolve('seen') };
}
