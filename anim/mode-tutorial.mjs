// Per-mode animated how-to-play slideshows. Self-contained dialog; the host app only supplies
// sample objects, and (for party use) a hook that lets the host end the slideshow for everyone.
import {mountHighLowTutorial} from './high-low-tutorial.mjs';
import {partyTutorialScene} from './party-tutorial.mjs';
import {MORE_MODE_TUTORIALS,extraTutorialScene} from './more-tutorials.mjs';
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const img = (src, cls = '') => `<img class="${cls}" src="${esc(src)}" alt="" draggable="false">`;

// Each scene is plain HTML whose CSS animations loop; changing slides re-renders it, so it restarts.
const bluffNums = s => { const ans = Math.max(2, Math.round(s.answer || 11)); return { ans, low: Math.max(1, Math.round(ans / 2)), high: ans * 2 }; };
const SCENES = {
  extraExample: s => extraTutorialScene(s.lesson,s),
  partyExample: s => partyTutorialScene(s.lesson,{team:s.lessonMode==='teamvteam',quick:s.lessonMode==='quick'}),
  hlRoles: () => `<div class="mt-hl-roles"><div><img src="anim/high-low-art/shark.webp" alt="LOW shark"><b>LOW ≤ answer</b><small>Close, without going over</small></div><div><img src="anim/high-low-art/bird.webp" alt="HIGH bird"><b>HIGH ≥ answer</b><small>Close, without going under</small></div></div><div class="mt-hl-lives">${[0,1,2].map(()=>img('icons/life-heart-full.webp','')).join('')}<span>Three shared lives</span></div>`,
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
    { scene: 'hlOcean', example: 'under', head: 'HIGH must not go under', text: 'HIGH picks 9, below the answer of 10. The bird gets wet, and the team loses a life.' },
    { scene: 'hlOcean', example: 'over', head: 'LOW must not go over', text: 'LOW picks 11, above the answer of 10. The shark leaves the water, and the team loses a life.' },
    { scene: 'hlOcean', example: 'wide', head: 'Stay close together, too', text: '5 and 20 surround 10, but their 4× gap is wider than 2.5×. You lose a life. The limit tightens as you survive.' },
    { scene:'extraExample',lesson:'hlShield',head:'Survive together to earn a shield',text:'Three survivals charge one shared shield. It blocks one lost life, then is used up. You can hold only one.' },
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

export function createModeTutorial({ owner, sample, storage }) {
  if (!storage) { try { storage = globalThis.localStorage; } catch {} }
  const sheet = document.createElement('link'); sheet.rel = 'stylesheet'; sheet.href = new URL('./mode-tutorial.css', import.meta.url); document.head.append(sheet);
  const dialog = document.createElement('dialog'); dialog.id = 'mode-tutorial'; dialog.setAttribute('aria-labelledby', 'mt-head'); document.body.append(dialog);
  const key = mode => `size-em-up:mode-tutorial:${owner()}:${mode}`;
  const seen = mode => { try { return storage.getItem(key(mode)) === '1'; } catch { return false; } };
  const mark = mode => { try { storage.setItem(key(mode), '1'); } catch {} };
  let finish = null, clearScene = () => {}, autoTimer = null, autoAt = 0, autoLeft = 0, advance = null;
  function stopScene() { clearTimeout(autoTimer);autoTimer=null;advance=null;clearScene();clearScene=()=>{}; }
  function armAuto() { if(advance&&!document.hidden){autoAt=performance.now();autoTimer=setTimeout(()=>advance?.(),autoLeft);} }
  document.addEventListener('visibilitychange',()=>{
    if(!advance)return;
    if(document.hidden){clearTimeout(autoTimer);autoTimer=null;autoLeft=Math.max(0,autoLeft-(performance.now()-autoAt));}
    else armAuto();
  });
  function startScene(sl) { if(sl.example)clearScene=mountHighLowTutorial(dialog.querySelector('.mt-hl-demo'),sl.example); }

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
      dialog.innerHTML = `<header><span>${esc(def.title)} &middot; ${i + 1} of ${def.slides.length}</span>${canSkip ? `<button type="button" class="mt-skip" data-skip>${controls === 'host' ? 'Skip for everyone' : 'Skip'}</button>` : ''}</header>
        <div class="mt-scene" data-scene="${sl.scene}">${SCENES[sl.scene]({...s,lesson:sl.lesson,lessonMode:mode})}</div>
        <h2 id="mt-head">${esc(sl.head)}</h2><p>${esc(sl.text)}</p>
        <div class="mt-dots">${def.slides.map((_, n) => `<i class="${n === i ? 'on' : ''}"></i>`).join('')}</div>
        ${controls === 'guest' ? '<p class="mt-wait">The host is showing how to play.</p>' : `<footer>${i > 0 ? '<button type="button" data-back>Back</button>' : ''}<button type="button" data-next class="mt-go">${last ? 'Got it' : 'Next'}</button></footer>`}`;
      dialog.querySelector('[data-skip]')?.addEventListener('click', () => { mark(mode); close('skipped'); });
      dialog.querySelector('[data-back]')?.addEventListener('click', () => { i--; render(); });
      dialog.querySelector('[data-next]')?.addEventListener('click', () => { if (last) { mark(mode); close('done'); } else { i++; render(); } });
      startScene(sl);
      if(def.autoplay&&controls==='self'){advance=()=>{if(last){mark(mode);close('done');}else{i++;render();}};autoLeft=def.slideMs;armAuto();}
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
    stopScene();
    const sl = def.slides[i];
    dialog.dataset.synced = mode;
    dialog.dataset.mode = mode;
    dialog.innerHTML = `<header><span>${esc(def.title)} &middot; ${i + 1} of ${def.slides.length}</span>${host ? '<button type="button" class="mt-skip" data-skip>Skip for everyone</button>' : ''}</header>
      <div class="mt-scene" data-scene="${sl.scene}">${SCENES[sl.scene]({...sample(),lesson:sl.lesson,lessonMode:mode})}</div>
      <h2 id="mt-head">${esc(sl.head)}</h2><p>${esc(sl.text)}</p>
      <div class="mt-dots">${def.slides.map((_, n) => `<i class="${n === i ? 'on' : ''}"></i>`).join('')}</div>
      <p class="mt-wait">${host ? 'Everyone is watching this together.' : 'The host is showing how to play.'}</p>`;
    dialog.querySelector('[data-skip]')?.addEventListener('click', onSkip);
    if (!dialog.open) dialog.showModal();
    startScene(sl);
    return true;
  }
  function endSynced() { if (dialog.dataset.synced) { stopScene();delete dialog.dataset.synced; syncedIdx = -1; if (dialog.open) dialog.close(); } }
  dialog.addEventListener('cancel', e => { e.preventDefault(); });
  return { play, synced, endSynced, seen, mark, duration: mode => MODE_TUTORIALS[mode]?.slideMs || 6500, count: mode => MODE_TUTORIALS[mode]?.slides.length || 0, has: mode => !!MODE_TUTORIALS[mode], close: () => close('closed'),
    // Plays once, the first time a solo mode opens.
    auto: mode => (!seen(mode) && MODE_TUTORIALS[mode]) ? play(mode) : Promise.resolve('seen') };
}
