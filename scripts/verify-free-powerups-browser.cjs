// Free power-ups through an ad, in a real browser with the real power-up controller (anim/powerup-ui.mjs) and the real ad guard from index.html
// (an isolated in-memory wallet; nothing connects to Firebase):
//  - a player who cannot afford a power-up sees a green "Free" tag on it; a player who can afford it sees the price
//  - tapping a free power-up plays one ad, applies the power-up, and charges nothing (the receipt costs 0 coins)
//  - an ad that does not finish uses nothing; a power-up that was already used is not offered again
//  - an affordable power-up still costs coins and shows no ad
//  - with no ad hook (older callers) an unaffordable power-up stays disabled
//  - for two seconds after an ad ends no new ad starts (a stray tap cannot start another)
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'); let failed = 0;
const fail = (m) => { failed++; console.error('FAIL', m); }, ok = (m) => console.log('ok  ', m), check = (c, m) => (c ? ok(m) : fail(m));
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const between = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('marker not found: ' + a); return src.slice(i, j); };
const adCode = between('  let lastAdEndedAt', '  // TEMP: simulated purchase confirmation');
const inlineCss = src.match(/<style>([\s\S]*?)<\/style>/)[1];
const links = [...src.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);
check(/showAd: async \(\) =>/.test(src), 'index.html hands the controller an ad hook (ports.showAd)');

const js = `
import { createPowerupController } from '/anim/powerup-ui.mjs';
${adCode}
const objects = [{ id: 'ant', mm: 10 }, { id: 'paperclip', mm: 30 }, { id: 'canoe', mm: 1000 }, { id: 'school-bus', mm: 3000 }];
let wallet = { coins: 3 }, ads = 0, adResult = true, state, withAd = true;
const fresh = () => ({ mode: 'worlds', phase: 'question', playerId: 'me', submitted: false, answers: [], objects, seen: new Set(), q: { unitId: 'ant', targetId: 'canoe', answer: 100, powerupKey: 'k' + Math.random() } });
state = fresh();
const ctx = () => ({ ...state, apply: (q) => { state = { ...state, q }; } });
const ports = { context: ctx, now: () => 1000, coins: () => wallet.coins, owner: () => 'me',
  question: (u, t) => ({ unitId: u.id, targetId: t.id, answer: t.mm / u.mm }), object: (id) => objects.find((o) => o.id === id),
  profileTransaction: async (_o, fn) => { const next = fn(structuredClone(wallet)); if (!next) return { committed: false }; wallet = next; return { committed: true }; },
  profile: async () => wallet, room: async () => null, quickApplied() {}, refresh() {}, finished() {},
  showAd: async () => { ads++; return adResult; } };
const c = createPowerupController(ports);
const host = document.getElementById('host');
const draw = () => { host.innerHTML = c.html(ctx()); };
const btn = (id) => host.querySelector('[data-powerup="' + id + '"]');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
window.T = {
  draw, btn: (id) => { const b = btn(id); return b && { free: b.dataset.free, disabled: b.disabled, text: b.querySelector('small').textContent.trim(), label: b.getAttribute('aria-label'), hasTag: !!b.querySelector('.pu-free') }; },
  click: async (id) => { btn(id).click(); await sleep(400); draw(); },
  state: () => ({ ads, coins: wallet.coins, receipts: Object.values(wallet.powerupReceipts || {}), used: state.q.powerups?.used || {} }),
  set: (o) => { if ('coins' in o) wallet = { coins: o.coins }; if ('adResult' in o) adResult = o.adResult; if ('withAd' in o) { withAd = o.withAd; if (!withAd) delete ports.showAd; } state = o.fresh ? fresh() : state; ads = o.fresh ? 0 : ads; },
  guard: async () => {
    const out = {};
    const first = showFakeAd(); await sleep(2300); document.getElementById('fake-ad-close').click(); out.first = await first;
    out.immediate = await showFakeAd();
    await sleep(2100);
    const third = showFakeAd(); out.thirdShown = !!document.getElementById('fake-ad-overlay');
    await sleep(2300); document.getElementById('fake-ad-close').click(); out.third = await third;
    return out;
  },
};
draw();`;
const page = `<!doctype html><html><head><meta charset="utf8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="/">${links.map((l) => `<link rel="stylesheet" href="${l}">`).join('')}<style>${inlineCss}</style></head><body><div id="hud"><div id="quick-powerups" hidden></div></div><div id="host" style="padding:12px;max-width:380px"></div><script type="module">${js}</script></body></html>`;
const types = { '.webp': 'image/webp', '.css': 'text/css', '.png': 'image/png', '.mjs': 'text/javascript', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { if (q.url.startsWith('/__t')) { r.setHeader('Content-Type', 'text/html'); return r.end(page); } const f = path.resolve(root, '.' + decodeURIComponent(q.url.split('?')[0])); try { r.setHeader('Content-Type', types[path.extname(f)] || 'application/octet-stream'); r.end(fs.readFileSync(f)); } catch { r.writeHead(404); r.end(); } });
srv.listen(0, async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 780 } }), errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`http://127.0.0.1:${srv.address().port}/__t`);
  try { await p.waitForFunction(() => window.T, null, { timeout: 5000 }); } catch (e) { fail('page did not start: ' + errors[0]); process.exit(1); }
  const T = (fn, ...a) => p.evaluate(([f, args]) => window.T[f](...args), [fn, a]);
  // 1) 3 coins: every power-up costs more, so each one is free with an ad
  for (const id of ['small', 'big', 'both', 'buffer', 'reveal']) { const v = await T('btn', id); check(v && v.free === 'true' && v.hasTag && /Free/.test(v.text) && !v.disabled && /free with a short ad/.test(v.label), `${id}: 3 coins -> green Free tag, tappable`); }
  // 2) the Free tag fits inside its button
  const fit = await p.evaluate(() => [...document.querySelectorAll('[data-powerup]')].every((b) => { const t = b.querySelector('.pu-free').getBoundingClientRect(), r = b.getBoundingClientRect(); return t.left >= r.left - 0.5 && t.right <= r.right + 0.5 && t.bottom <= r.bottom + 0.5; }));
  check(fit, 'the Free tag fits inside every button');
  // 3) use one free: one ad, applied, no coins, 0-coin receipt
  await T('click', 'buffer'); let s = await T('state');
  check(s.ads === 1 && s.coins === 3 && s.used.buffer === true, 'a free Buffer plays one ad, is applied, and costs nothing');
  check(s.receipts.length === 1 && s.receipts[0].cost === 0 && s.receipts[0].ad === true && s.receipts[0].status === 'applied', 'its receipt is a settled 0-coin ad receipt');
  let v = await T('btn', 'buffer'); check(v.disabled && /Used/.test(v.text) && !v.hasTag, 'a used power-up is not offered again');
  // 4) a reroll uses up the one reroll, free
  await T('click', 'small'); s = await T('state');
  check(s.ads === 2 && s.coins === 3 && s.used.reroll === true, 'a free reroll works too (one ad, no coins)');
  v = await T('btn', 'big'); check(v.disabled && /Reroll used/.test(v.text), 'after a reroll the other rerolls are used up for this question');
  // 5) the ad does not finish: nothing happens
  await T('set', { fresh: true, adResult: false, coins: 3 }); await T('draw'); await T('click', 'big'); s = await T('state');
  check(s.ads === 1 && s.coins === 3 && !s.used.reroll && s.receipts.length === 0, 'an ad that does not finish uses nothing and leaves no receipt');
  // 6) enough coins: normal purchase, no ad
  await T('set', { fresh: true, adResult: true, coins: 20 }); await T('draw');
  v = await T('btn', 'both'); check(v.free === 'false' && !v.hasTag && /10/.test(v.text), 'with enough coins the price shows, no Free tag');
  await T('click', 'both'); s = await T('state');
  check(s.ads === 0 && s.coins === 10 && s.receipts[0].cost === 10 && !s.receipts[0].ad, 'an affordable power-up still costs its coins and shows no ad');
  // 7) mix: 6 coins -> 5-coin rerolls cost coins, 10-coin ones are free
  await T('set', { fresh: true, coins: 6 }); await T('draw');
  const mix = [await T('btn', 'small'), await T('btn', 'buffer')];
  check(mix[0].free === 'false' && mix[1].free === 'true', 'with 6 coins a 5-coin power-up costs coins and a 10-coin one is free');
  // 8) older callers without an ad hook
  await T('set', { fresh: true, coins: 3, withAd: false }); await T('draw');
  v = await T('btn', 'buffer'); check(v.disabled && !v.hasTag, 'without an ad hook an unaffordable power-up stays disabled');
  // 9) the 2-second tap guard (real function from index.html)
  const g = await T('guard');
  check(g.first === true && g.immediate === false, 'right after an ad ends, no new ad starts');
  check(g.thirdShown && g.third === true, 'two seconds later an ad can start again');
  check(!errors.length, 'no page errors' + (errors.length ? ' - ' + errors[0] : ''));
  await b.close(); srv.close();
  console.log(failed ? `\n${failed} free power-up check(s) failed` : '\nAll free power-up checks passed');
  process.exitCode = failed ? 1 : 0;
});
