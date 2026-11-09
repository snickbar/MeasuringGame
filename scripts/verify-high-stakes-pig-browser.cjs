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
  if (stage !== 'pick' && stage !== 'ready') hs = HS.hsBeginBetting(hs, picks, now);
  if (stage === 'reveal' || stage === 'standings') {
    hs = HS.hsResolve(hs);
    hs.animEndsAt = now - 1;
    if (stage === 'standings') hs.showStand = true;
  }
  roomState = {phase: 'hs', gameId: 'pig-' + scenario, settings: {mode: 'highstakes'}, players: currentPlayers, hs, hsQ: q, hsPicks: picks};
  applyPhase(roomState);
  hsEnsureTicker(false);
  renderHighStakes(roomState);
  window.scrollTo(0, 0);
};
window.redrawPigRound = () => renderHighStakes(roomState);
`;
const html = source.replaceAll(/https:\/\/www\.gstatic\.com\/firebasejs\/10\.13\.0\/firebase-(app|database|auth)\.js/g,
  '/__fake/$1.mjs').replace('\n</script>\n</body>', setup + '\n</script>\n</body>');

runFixture({html, widths: [320, 390], out: 'output/high-stakes-pig', modules: {
  '/__fake/app.mjs': 'export const initializeApp=()=>({});',
  '/__fake/database.mjs': stubs.parts.dbStub,
  '/__fake/auth.mjs': stubs.parts.authStub,
}, check: async ({width, evaluate, screenshot}) => {
  await evaluate(`(async()=>{
    while (!window.showPigRound || !document.getElementById('home-screen').classList.contains('active')) {
      await new Promise(r => setTimeout(r, 30));
    }
    document.getElementById('install-dismiss-btn').click();
  })()`);
  const deal = await evaluate(`(async()=>{
    localStorage.setItem('mg_motion', 'full');
    showPigRound('deal', 'ready');
    const heading = document.querySelector('[data-hs-dealer]');
    const tip = heading.querySelector('.hs-dealer-tip');
    const button = document.getElementById('hs-deal');
    await tip.decode();
    const whileDealing = heading.dataset.hsDealer === 'dealing' && !button.disabled;
    const original = heading.querySelector('.polish-banner-mascot');
    const watchesDeal = original.getAnimations().some(animation => animation.animationName === 'hsDealerWatch');
    redrawPigRound();
    const keptHeading = heading.isConnected;
    for (let i = 0; i < 180 && heading.dataset.hsDealer !== 'ready'; i++) {
      await new Promise(r => setTimeout(r, 40));
    }
    for (const node of [original, tip]) for (const animation of node.getAnimations()) {
      animation.pause(); animation.currentTime = 450;
    }
    const pot = document.querySelector('.hs-pot-num').textContent.trim();
    const playerStacks = [...document.querySelectorAll('.hs-pl-coins')].map(el => el.textContent.trim());
    const onlyTipVisible = getComputedStyle(tip).opacity === '1' && getComputedStyle(original).opacity === '0';
    return {whileDealing, watchesDeal, keptHeading, onlyTipVisible, pot, funded: playerStacks.every(s => s === '100')};
  })()`);
  assert.deepEqual(deal, {whileDealing: true, watchesDeal: true, keptHeading: true, onlyTipVisible: true, pot: '0', funded: true});
  await screenshot(`dealer-tip-${width}.png`);
  const reducedDeal = await evaluate(`(() => {
    localStorage.setItem('mg_motion', 'reduce');
    document.documentElement.dataset.motion = 'reduce';
    showPigRound('reduced-deal', 'ready');
    return {state: document.querySelector('[data-hs-dealer]').dataset.hsDealer, pot: document.querySelector('.hs-pot-num').textContent.trim()};
  })()`);
  assert.deepEqual(reducedDeal, {state: 'idle', pot: '0'});
  await evaluate("localStorage.setItem('mg_motion', 'full')");
  for (const pose of ['salute', 'tip', 'slip', 'shrug']) {
    const state = await evaluate(`(async()=>{
      document.documentElement.dataset.motion = 'full';
      showPigRound('${pose}');
      const pig = document.querySelector('.hs-pig-result'), image = pig.querySelector('.hs-pig-pose');
      const idle = pig.querySelector('.hs-pig-idle');
      const seek = time => {
        for (const node of [pig, idle, image]) for (const animation of node.getAnimations()) {
          animation.pause(); animation.currentTime = time;
        }
        return Number(getComputedStyle(image).opacity);
      };
      const before = seek(100), after = seek(650);
      await image.decode();
      const result = {mood: pig.dataset.mood, before, after, next: document.getElementById('hs-skip').textContent};
      await new Promise(r => setTimeout(r, 70));
      redrawPigRound();
      result.resumes = parseFloat(document.querySelector('.hs-pig-result').style.getPropertyValue('--hs-pig-offset')) < -60;
      document.documentElement.dataset.motion = 'reduce';
      result.reduced = Number(getComputedStyle(document.querySelector('.hs-pig-pose')).opacity);
      const poseBox = document.querySelector('.hs-pig-result').getBoundingClientRect();
      const potBox = document.getElementById('hs-pot').getBoundingClientRect();
      result.fits = poseBox.width > 0 && poseBox.right <= potBox.left && potBox.right <= innerWidth;
      return result;
    })()`);
    assert.deepEqual(state, {mood: pose, before: 0, after: 1, next: 'Show standings', resumes: true, reduced: 1, fits: true});
    await screenshot(`${pose}-${width}.png`);
  }
  assert.equal(await evaluate(`showPigRound('salute', 'standings'); !!document.querySelector('.hs-stand') && !document.querySelector('.hs-table-pig')`), true);
  assert.equal(await evaluate(`showPigRound('salute', 'pick'); document.querySelector('.hs-table-pig')?.dataset.mood`), 'peek');
  assert.equal(await evaluate(`showPigRound('salute', 'bet'); !document.querySelector('.hs-table-pig')`), true);
  console.log(`High Stakes piggy at ${width}px: opening deal, four results poses, motion, redraw, layout and stage scope passed.`);
}}).catch(error => { console.error(error); process.exitCode = 1; });
