const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { runFixture } = require('./browser-fixture.cjs');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
const fixture = fs.readFileSync(path.join(__dirname, 'verify-game-polish-browser.cjs'), 'utf8');
const stubs = {};
vm.runInNewContext(fixture.slice(fixture.indexOf('const dbStub='), fixture.indexOf('let checks=')) +
  ';globalThis.parts={dbStub,authStub};', stubs);

const setup = String.raw`
window.showPigRound = (scenario, stage = 'reveal') => {
  ALL_SCREEN_ELS.forEach(el => el.classList.remove('active'));
  currentRoomCode = 'PIG'; currentPlayerId = 'me'; isHost = true;
  const ids = ['me', ...Array.from({length: 9}, (_, i) => 'p' + (i + 1))];
  currentPlayers = Object.fromEntries(ids.map((id, i) => [id, {
    name: i ? 'Player ' + i : 'My player', avatar: ['av07','av19','av06','av20'][i % 4],
    isHost: !i, isBot: !!i, connected: true,
  }]));
  const now = nowMs(), q = dailyQuestionFor({unitId: 'ant', targetId: 'door'});
  const game = HS.hsNewGame(ids);
  if (scenario === 'slip') game.chips.me = HS.hsAnteFor(1);
  let hs = stage === 'ready' ? game : HS.hsStartRound(game, { options: [12, 18, q.answer, 81], realIdx: 2, now });
  const picks = Object.fromEntries(ids.map((id, i) => [id, (scenario === 'salute' ? i < 3 : scenario !== 'shrug' && i === 1) ? 2 : 0]));
  if (scenario === 'incoming-picks') { delete picks.p1; delete picks.p2; }
  if (stage !== 'pick' && stage !== 'ready') hs = HS.hsBeginBetting(hs, picks, now);
  if (stage === 'reveal' || stage === 'standings') {
    hs = HS.hsResolve(hs);
    hs.animEndsAt = now - 1;
    if (stage === 'standings') hs.showStand = true;
  }
  if (scenario === 'large-pot') hs.pot = 1000;
  roomState = {phase: 'hs', gameId: 'pig-' + scenario, settings: {mode: 'highstakes'}, players: currentPlayers, hs, hsQ: q,
    hsPicks: picks, hsPickAt: stage === 'pick' ? {me: now - (scenario === 'locked' ? HS_CHANGE_MS + 5 : HS_CHANGE_MS - 2500)} : null};
  applyPhase(roomState);
  hsEnsureTicker(false);
  renderHighStakes(roomState);
  window.scrollTo(0, 0);
};
window.redrawPigRound = () => renderHighStakes(roomState);
window.receivePigRoundPick = id => {
  roomState = {...roomState, hsPicks: {...roomState.hsPicks, [id]: 0}};
  renderHighStakes(roomState);
};
window.refreshPigTimers = () => hsRefreshTimers();
window.pigFrame = sprite => Math.round(-4 * new DOMMatrix(getComputedStyle(sprite).transform).m41 / sprite.getBoundingClientRect().width);
window.pigSequence = (sprite, times = [100, 700, 850, 1050, 1450, 1630, 1900, 6150, 7450]) => {
  const animation = sprite.getAnimations().find(a => a.animationName === getComputedStyle(sprite).animationName);
  animation.pause();
  return times.map(time => {
    animation.currentTime = time;
    return window.pigFrame(sprite);
  });
};
`;
const html = source.replaceAll(/https:\/\/www\.gstatic\.com\/firebasejs\/10\.13\.0\/firebase-(app|database|auth)\.js/g,
  '/__fake/$1.mjs').replace('\n</script>\n</body>', setup + '\n</script>\n</body>');

runFixture({html, widths: [320, 390], out: 'output/high-stakes-pig', modules: {
  '/__fake/app.mjs': 'export const initializeApp=()=>({});',
  '/__fake/database.mjs': stubs.parts.dbStub,
  '/__fake/auth.mjs': stubs.parts.authStub,
}, check: async ({width, evaluate, screenshot, call, sessionId}) => {
  await evaluate(`(async()=>{
    while (!window.showPigRound || !document.getElementById('home-screen').classList.contains('active')) {
      await new Promise(r => setTimeout(r, 30));
    }
    document.getElementById('install-dismiss-btn').click();
  })()`);
  const deal = await evaluate(`(async()=>{
    localStorage.setItem('mg_motion', 'full');
    showPigRound('deal', 'ready');
    const heading = document.querySelector('.hs-dealer-heading');
    const sprite = heading.querySelector('.hs-dealer img');
    const button = document.getElementById('hs-deal');
    const startsAfterDecode = !heading.classList.contains('hs-dealer-loaded');
    await sprite.decode();
    const available = !button.disabled;
    const frames = pigSequence(sprite);
    redrawPigRound();
    const keptHeading = heading.isConnected;
    const potLabel = document.querySelector('.hs-pot-num');
    for (let i = 0; i < 180 && potLabel.textContent.trim() !== '0'; i++) {
      await new Promise(r => setTimeout(r, 40));
    }
    const pot = potLabel.textContent.trim();
    const playerStacks = [...document.querySelectorAll('.hs-pl-coins')].map(el => el.textContent.trim());
    const onlyDealerVisible = getComputedStyle(sprite).visibility === 'visible' &&
      getComputedStyle(heading.querySelector('.polish-banner-mascot')).visibility === 'hidden';
    return {startsAfterDecode, available, frames, keptHeading, onlyDealerVisible, pot, funded: playerStacks.every(s => s === '100')};
  })()`);
  assert.deepEqual(deal, {startsAfterDecode: true, available: true, frames: [0, 1, 2, 3, 2, 1, 0, 0, 3], keptHeading: true, onlyDealerVisible: true, pot: '0', funded: true});
  await screenshot(`dealer-tip-${width}.png`);
  const reducedDeal = await evaluate(`(async() => {
    localStorage.setItem('mg_motion', 'reduce');
    document.documentElement.dataset.motion = 'reduce';
    showPigRound('reduced-deal', 'ready');
    const sprite = document.querySelector('.hs-dealer img');
    await sprite.decode();
    return {animation: getComputedStyle(sprite).animationName, pose: getComputedStyle(sprite).transform,
      pot: document.querySelector('.hs-pot-num').textContent.trim()};
  })()`);
  assert.deepEqual(reducedDeal, {animation: 'none', pose: 'none', pot: '0'});
  await screenshot(`dealer-idle-${width}.png`);
  if (width === 320) await call('Emulation.setDeviceMetricsOverride', {width, height: 650, deviceScaleFactor: 1, mobile: true}, sessionId);
  const pick = await evaluate(`(async()=>{
    document.documentElement.dataset.motion = 'full';
    showPigRound('large-pot', 'pick');
    const sprite = document.querySelector('.hs-pig-fidget .hs-pig-frames img');
    await sprite.decode();
    const frames = pigSequence(sprite, [100, 700, 880, 1020, 1130, 1270, 1500, 3800, 5020]);
    await document.fonts.ready;
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    refreshPigTimers();
    const box = selector => document.querySelector(selector).getBoundingClientRect();
    const timer = box('.hs-mid .hs-pick-status'), pot = box('.hs-table-foot #hs-pot');
    const left = box('.hs-col.l'), right = box('.hs-col.r'), bottom = box('#bottom-toolbar');
    const number = box('.hs-pot-total .hs-pot-num'), label = box('.hs-table-foot .hs-pot-lab');
    const stack = box('.hs-pot-total img'), pig = box('.hs-table-pig');
    const bar = document.querySelector('.hs-pick-status .lock-bar');
    return {frames, timerFits: timer.left >= left.right && timer.right <= right.left && timer.bottom <= bottom.top,
      timerBeforePot: timer.bottom <= pot.top, tallPot: pot.height >= 62,
      largePig: pig.width > innerWidth * .15, number: document.querySelector('.hs-pot-num').textContent,
      potFits: label.bottom <= stack.top && stack.right <= number.left && number.right <= pot.right,
      countdownActive: bar.classList.contains('low') && parseFloat(bar.firstElementChild.style.transform.slice(7)) < 0.3};
  })()`);
  assert.deepEqual(pick, {frames: [0, 1, 2, 3, 2, 1, 0, 0, 3], timerFits: true, timerBeforePot: width === 320, tallPot: true, largePig: true,
    number: '1,000', potFits: true, countdownActive: true});
  await screenshot(`pick-pot-countdown-${width}.png`);
  const reducedPick = await evaluate(`(async()=>{
    await new Promise(r => setTimeout(r, 70));
    redrawPigRound();
    const pig = document.querySelector('.hs-pig-fidget'), sprite = pig.querySelector('.hs-pig-frames img');
    await sprite.decode();
    const resumes = parseFloat(pig.style.getPropertyValue('--hs-pig-offset')) < -60;
    document.documentElement.dataset.motion = 'reduce';
    return {resumes, reduced: getComputedStyle(sprite).animationName === 'none' && pigFrame(sprite) === 0};
  })()`);
  assert.deepEqual(reducedPick, {resumes: true, reduced: true});
  const incomingPicks = await evaluate(`(async()=>{
    document.documentElement.dataset.motion = 'full';
    showPigRound('incoming-picks', 'pick');
    const getSprite = () => document.querySelector('.hs-pig-fidget .hs-pig-frames img');
    const initial = getSprite();
    await initial.decode();
    for (let i = 0; i < 120 && pigFrame(initial) !== 3; i++) {
      await new Promise(r => requestAnimationFrame(r));
    }
    const airborne = pigFrame(initial) === 3;
    const updates = ['p1', 'p2'].map(id => {
      const before = document.querySelector('[data-hs-pl="' + id + '"] .hs-tag').textContent;
      receivePigRoundPick(id);
      const after = document.querySelector('[data-hs-pl="' + id + '"] .hs-tag').textContent;
      const sprite = getSprite();
      return {updatedCard: before === 'Thinking...' && after === 'Picked',
        visible: getComputedStyle(sprite).visibility === 'visible', frame: pigFrame(sprite)};
    });
    return {airborne, updates};
  })()`);
  assert.deepEqual(incomingPicks, {airborne: true, updates: Array.from({length: 2}, () => ({updatedCard: true, visible: true, frame: 3}))});
  assert.equal(await evaluate(`showPigRound('locked', 'pick'); document.querySelector('.hs-mid .hs-pick-status').textContent.includes('Locked in!') && !document.querySelector('[data-hs-bar]')`), true);
  if (width === 320) await call('Emulation.setDeviceMetricsOverride', {width, height: 840, deviceScaleFactor: 1, mobile: true}, sessionId);
  await evaluate("localStorage.setItem('mg_motion', 'full')");
  for (const pose of ['salute', 'tip', 'slip', 'shrug']) {
    const state = await evaluate(`(async()=>{
      document.documentElement.dataset.motion = 'full';
      showPigRound('${pose}');
      const pig = document.querySelector('.hs-pig-result'), sprite = pig.querySelector('.hs-pig-frames img');
      const startsAfterDecode = !pig.classList.contains('hs-pig-loaded');
      await sprite.decode();
      const frames = pigSequence(sprite);
      const result = {mood: pig.dataset.mood, startsAfterDecode, frames, next: document.getElementById('hs-skip').textContent};
      await new Promise(r => setTimeout(r, 70));
      redrawPigRound();
      const replacement = document.querySelector('.hs-pig-result'), replacementSprite = replacement.querySelector('.hs-pig-frames img');
      await replacementSprite.decode();
      result.resumes = parseFloat(replacement.style.getPropertyValue('--hs-pig-offset')) < -60;
      document.documentElement.dataset.motion = 'reduce';
      result.reduced = getComputedStyle(replacementSprite).animationName === 'none' && pigFrame(replacementSprite) === 3;
      const poseBox = document.querySelector('.hs-pig-result').getBoundingClientRect();
      const potBox = document.getElementById('hs-pot').getBoundingClientRect();
      result.fits = poseBox.width > 0 && poseBox.right <= potBox.left && potBox.right <= innerWidth;
      return result;
    })()`);
    assert.deepEqual(state, {mood: pose, startsAfterDecode: true, frames: [0, 1, 2, 3, 2, 1, 0, 0, 3],
      next: 'Show standings', resumes: true, reduced: true, fits: true});
    await screenshot(`${pose}-${width}.png`);
  }
  assert.equal(await evaluate(`showPigRound('salute', 'standings'); !!document.querySelector('.hs-stand') && !document.querySelector('.hs-table-pig')`), true);
  assert.equal(await evaluate(`showPigRound('salute', 'pick'); document.querySelector('.hs-table-pig')?.dataset.mood`), 'peek');
  assert.equal(await evaluate(`showPigRound('salute', 'bet'); !document.querySelector('.hs-table-pig, .hs-pot-total, .hs-pick-status')`), true);
  console.log(`High Stakes at ${width}px: chip fidget, reactions, pot, and visible pick countdown passed.`);
}}).catch(error => { console.error(error); process.exitCode = 1; });
