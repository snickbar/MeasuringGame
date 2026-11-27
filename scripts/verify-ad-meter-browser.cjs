// The ad meter on the Capsules tab (3 ads a day = 1 random free pull), in a real browser with the real stylesheets, the real markup and the real meter code from index.html
// (Firebase is replaced by a tiny in-memory profile; the fake ad is skipped):
//  - starts at 0 of 3, each ad fills one pip, the third ad adds exactly one general (random-only) free pull and the button rests
//  - nothing more can be earned that day, even with a direct call; the next day the meter starts again
//  - the Coins tab no longer has the old "watch an ad for 25 coins" card
//  - the card and its button stay fully on screen on small phones, and the title is not clipped
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'); let failed = 0;
const fail = (m) => { failed++; console.error('FAIL', m); }, ok = (m) => console.log('ok  ', m), check = (c, m) => (c ? ok(m) : fail(m));
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const between = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('marker not found: ' + a); return src.slice(i, j); };
const inlineCss = src.match(/<style>([\s\S]*?)<\/style>/)[1];
const links = [...src.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);

check(!/id="ad-reward-card"/.test(src), 'the Coins tab no longer has the 25-coin ad card');
check(/tab === "coins"\) \{/.test(src), 'the Coins tab still has its own branch in renderShopTab (it must not fall through to the cosmetics shop)');

const markup = between('<div id="ad-meter-card"', '<p id="gacha-status">');
const code = [between('  const AD_METER_STEPS = 3;', '  // Local calendar date'), between('  function todayDateStr()', '  // TEMP stand-in for a real rewarded ad'),
  between('  // One step of the ad meter.', '  // TEMP: cosmetics are purely cosmetic'), between('  // The ad meter on the Capsules tab', '  document.querySelectorAll("button[data-boost]")')].join('\n');
const js = `
const watchAdBtn = document.getElementById('watch-ad-btn'), watchAdStatusEl = document.getElementById('watch-ad-status');
let store = { coins: 40, freePulls: 0 }; let myProfile = { ...store }; const deviceId = 'me'; const db = {}; const ref = (d, p) => p;
const defaultProfile = () => ({ coins: 0, freePulls: 0 });
const stats = { adsWatched: 0 }; const bumpStats = (o) => { stats.adsWatched += o.adsWatched || 0; };
const toasts = []; const showAchToast = (t) => toasts.push(t); let galleryRenders = 0; const renderGachaScreen = () => { galleryRenders++; };
const showFakeAd = () => Promise.resolve(true);
const runTransaction = async (_r, fn) => { const out = fn(store ? JSON.parse(JSON.stringify(store)) : null); if (out === undefined) return { committed: false }; store = out; myProfile = { ...store }; return { committed: true }; };
${code}
renderWatchAdStatus();
window.T = { store: () => store, stats, toasts, galleryRenders: () => galleryRenders, setDay: (d) => { store = { ...store, adsWatchedDate: d }; myProfile = { ...store }; }, direct: () => watchAdForMeter(), render: renderWatchAdStatus };`;
const page = `<!doctype html><html><head><meta charset="utf8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="/">${links.map((l) => `<link rel="stylesheet" href="${l}">`).join('')}<style>${inlineCss}</style></head><body><div id="shop-tab-capsules" class="shop-tab-panel active" style="display:block;padding:0 12px">${markup}</div><script type="module">${js}</script></body></html>`;
const types = { '.webp': 'image/webp', '.css': 'text/css', '.png': 'image/png', '.mjs': 'text/javascript', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { if (q.url.startsWith('/__t')) { r.setHeader('Content-Type', 'text/html'); return r.end(page); } const f = path.resolve(root, '.' + decodeURIComponent(q.url.split('?')[0])); try { r.setHeader('Content-Type', types[path.extname(f)] || 'application/octet-stream'); r.end(fs.readFileSync(f)); } catch { r.writeHead(404); r.end(); } });
srv.listen(0, async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[360, 640], [412, 915], [320, 568]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } }), tag = `${w}x${h}`, errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(`http://127.0.0.1:${srv.address().port}/__t`);
    try { await p.waitForFunction(() => window.T, null, { timeout: 5000 }); } catch (e) { fail(`${tag}: page did not start: ${errors[0]}`); continue; }
    const view = () => p.evaluate(() => ({ on: document.querySelectorAll('#am-pips i.on').length, title: document.getElementById('am-title').textContent, status: document.getElementById('watch-ad-status').textContent, disabled: document.getElementById('watch-ad-btn').disabled, pulls: window.T.store().freePulls, count: window.T.store().adsWatchedCount || 0 }));
    const tap = async () => { const r = await p.locator('#watch-ad-btn').boundingBox(); await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2); await p.waitForTimeout(120); };
    let v = await view();
    check(v.on === 0 && /0 of 3/.test(v.status) && !v.disabled && /3 ads/.test(v.title), `${tag}: starts at 0 of 3 with the button ready`);
    const lay = await p.evaluate(() => { const c = document.getElementById('ad-meter-card').getBoundingClientRect(), bt = document.getElementById('watch-ad-btn').getBoundingClientRect(), t = document.getElementById('am-title'), s = document.getElementById('watch-ad-status'); return { inside: c.left >= 0 && c.right <= innerWidth && bt.right <= c.right + 0.5 && bt.left >= c.left, btnH: Math.round(bt.height), titleClipped: t.scrollWidth > t.clientWidth + 1, statusClipped: s.scrollWidth > s.clientWidth + 1, tall: Math.round(c.height) }; });
    check(lay.inside && !lay.titleClipped && !lay.statusClipped, `${tag}: the card, its button and its text fit on screen (card ${lay.tall}px tall)`);
    check(lay.btnH >= 34, `${tag}: the button is a comfortable tap target (${lay.btnH}px tall)`);
    await tap(); v = await view();
    check(v.on === 1 && /1 of 3/.test(v.status) && v.pulls === 0 && !v.disabled, `${tag}: one ad fills one pip and gives nothing else yet`);
    await tap(); v = await view();
    check(v.on === 2 && v.pulls === 0, `${tag}: two ads fill two pips`);
    await tap(); v = await view();
    check(v.on === 3 && v.pulls === 1 && v.disabled && /earned/.test(v.title) && /tomorrow/.test(v.status), `${tag}: the third ad adds exactly one free pull and the meter rests`);
    check((await p.evaluate(() => window.T.toasts.length)) === 1 && (await p.evaluate(() => window.T.galleryRenders())) === 1, `${tag}: a toast tells the player and the machine updates`);
    check((await p.evaluate(() => window.T.stats.adsWatched)) === 3, `${tag}: each ad still counts toward the Ad watcher achievement`);
    await p.evaluate(() => window.T.direct()); v = await view();
    check(v.pulls === 1 && v.count === 3, `${tag}: a fourth ad the same day (even a direct call) earns nothing`);
    check((await p.evaluate(() => window.T.direct())) === '', `${tag}: the fourth ad is refused`);
    await p.evaluate(() => { window.T.setDay('2000-01-01'); window.T.render(); }); v = await view();
    check(v.on === 0 && !v.disabled && /0 of 3/.test(v.status), `${tag}: the next day the meter starts again`);
    for (let i = 0; i < 3; i++) await tap(); v = await view();
    check(v.pulls === 2 && v.disabled, `${tag}: another three ads earn another pull`);
    check(!errors.length, `${tag}: no page errors${errors.length ? ' - ' + errors[0] : ''}`);
    await p.close();
  }
  await b.close(); srv.close();
  console.log(failed ? `\n${failed} ad meter check(s) failed` : '\nAll ad meter checks passed');
  process.exitCode = failed ? 1 : 0;
});
