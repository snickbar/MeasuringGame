// The Supporter Pass, in a real browser with the real stylesheets, the real markup and the real pass code from index.html
// (Firebase is replaced by a tiny in-memory profile; the fake purchase is a stub that says yes or no):
//  - without the pass: a gold card with the perks, "Get the pass" opens the details sheet, Monthly/Yearly change the price, Buy grants the right time
//  - with the pass: the card shows ACTIVE and the days left; buying again adds time on top; an expired pass is not a pass
//  - the daily free pull: once a day, exactly one general free pull, then the buttons rest; the next day it works again
//  - double coins: supporters skip the ad (adOrPass), everyone else still sees it
//  - the labels at every double-coins button switch to "Double coins · Free" for supporters
//  - Party Mode stays on top of Offers until it is owned, then the pass goes first
//  - the cards fit on small phones
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'); let failed = 0;
const fail = (m) => { failed++; console.error('FAIL', m); }, ok = (m) => console.log('ok  ', m), check = (c, m) => (c ? ok(m) : fail(m));
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const between = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('marker not found: ' + a); return src.slice(i, j); };
const inlineCss = src.match(/<style>([\s\S]*?)<\/style>/)[1];
const links = [...src.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);

// Static checks: every double-coins button has a supporter wording, and the reward screen and the claim path use adOrPass
check((src.match(/isSupporter\(\) \?/g) || []).length >= 6, 'the double-coins labels have a supporter wording at every site');
check(/ad: adOrPass,\s*free: isSupporter,/.test(src), 'the game reward screen skips the ad for supporters and shows the free wording');
check(/const earned = await adOrPass\(\);\s*if \(earned !== true\) return "cancel";/.test(src), 'claimAdDouble skips the ad for supporters');
check(/supporterUntil: Math\.max\(0, \+data\.supporterUntil \|\| 0\)/.test(src) && /passPullDate: null,/.test(src), 'the pass fields are kept when a profile loads and exist in a new profile');

const passBox = '<div id="supporter-pass-box" class="supporter-pass-box"></div>';
const hostBox = '<div id="host-unlock-shop-box" class="host-unlock-shop-box"><h3>Party Mode</h3></div>';
const pullCard = between('<div id="pass-pull-card"', '<p id="gacha-status">');
const code = [between('  const SUPPORTER_DAY_MS', '  // ---- "Watch an ad to double your coins"'), between('  // ---- Supporter Pass UI', '  coinPackBtns.forEach((btn) => {'),
  between('  function todayDateStr()', '  // TEMP stand-in for a real rewarded ad')].join('\n');
const js = `
let store = { coins: 40, freePulls: 0, hostUnlocked: false }; let myProfile = { ...store }; const deviceId = 'me'; const db = {}; const ref = (d, p) => p;
let offset = 0; const nowMs = () => Date.now() + offset;
const defaultProfile = () => ({ coins: 0, freePulls: 0, supporterUntil: 0, supporterPlan: null, passPullDate: null });
import { isSupporterAura, SUPPORTER_AURAS, installAuras } from '/anim/avatar-auras.mjs';
installAuras(['#e04e4e', '#4e8ce0', '#4ec06e', '#e0b84e', '#a14ee0', '#e07a4e', '#4ee0d2', '#e04ea6', '#8a8a8a', '#4e4ee0']);
const escapeHtml = (t) => String(t).replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';'); let currentName = 'Maya'; const defaultAvatarId = () => 'av01';
const avatarHtml = (id, cls, pos, ov) => '<img src="avatars/' + id + '.webp" alt="" data-aura="' + ((ov && ov.aura) || '') + '">';
const update = async (_r, patch) => { store = { ...store, ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, v == null ? '' : v])) }; myProfile = { ...store }; };
let currentRoomCode = null, currentPlayerId = null, roomState = null; const equippedAvatarAura = () => supporterAuraNow(); const supporterAuraNow = () => isSupporter() && isSupporterAura(myProfile.supporterAura) ? myProfile.supporterAura : ''; const renderSettingsAvatarGrid = () => {};
const toasts = []; const showAchToast = (t) => toasts.push(t); let galleryRenders = 0; const renderGachaScreen = () => { galleryRenders++; };
let ads = 0; const showFakeAd = () => { ads++; return Promise.resolve(true); };
let buyAnswer = true; const bought = []; const purchase = async (d) => { bought.push(d); return buyAnswer; };
const runTransaction = async (_r, fn) => { const out = fn(store ? JSON.parse(JSON.stringify(store)) : null); if (out === undefined) return { committed: false }; store = out; myProfile = { ...store }; return { committed: true }; };
${code}
window.T = { store: () => store, set: (o) => { store = { ...store, ...o }; myProfile = { ...store }; }, toasts: () => toasts, bought: () => bought, ads: () => ads, galleries: () => galleryRenders, render: renderSupporterUi,
  isSupporter: () => isSupporter(), days: () => supporterDaysLeft(), adOrPass: () => adOrPass(), setBuy: (v) => { buyAnswer = v; }, setOffset: (ms) => { offset = ms; }, claim: () => claimPassPull(), nameHtml: (p, f) => nameHtml(p, f), setExtras: (x) => setSupporterExtras(x), roomLook: () => supporterRoomLook(), colours: NAME_COLOURS.length, auras: SUPPORTER_AURAS.length };
renderSupporterUi();`;
const page = `<!doctype html><html><head><meta charset="utf8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="/">${links.map((l) => `<link rel="stylesheet" href="${l}">`).join('')}<style>${inlineCss}</style></head><body>
<div id="shop-tab-hosting" class="shop-tab-panel active" style="display:block;padding:0 12px"><div class="shop-subpanel" id="sub">${passBox}${hostBox}</div></div>
<div id="shop-tab-capsules" class="shop-tab-panel active" style="display:block;padding:0 12px">${pullCard}</div><script type="module">${js}</script></body></html>`;
const types = { '.webp': 'image/webp', '.css': 'text/css', '.png': 'image/png', '.mjs': 'text/javascript', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { if (q.url.startsWith('/__t')) { r.setHeader('Content-Type', 'text/html'); return r.end(page); } const f = path.resolve(root, '.' + decodeURIComponent(q.url.split('?')[0])); try { r.setHeader('Content-Type', types[path.extname(f)] || 'application/octet-stream'); r.end(fs.readFileSync(f)); } catch { r.writeHead(404); r.end(); } });
srv.listen(0, async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[360, 640], [412, 915], [320, 568]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } }), tag = `${w}x${h}`, errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(`http://127.0.0.1:${srv.address().port}/__t`);
    try { await p.waitForFunction(() => window.T, null, { timeout: 5000 }); } catch (e) { fail(`${tag}: page did not start: ${errors[0]}`); continue; }
    const T = (fn, ...a) => p.evaluate(([f, args]) => window.T[f](...args), [fn, a]);
    const click = async (sel) => { await p.locator(sel).scrollIntoViewIfNeeded(); const r = await p.locator(sel).boundingBox(); await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2); await p.waitForTimeout(150); };
    const fits = (sel) => p.evaluate((s) => { const e = document.querySelector(s).getBoundingClientRect(); return e.left >= 0 && e.right <= innerWidth + 0.5; }, sel);
    // 1) no pass yet
    check(!(await T('isSupporter')), `${tag}: a new player is not a supporter`);
    check((await p.locator('#supporter-pass-box .sp-ribbon').count()) === 1 && /Get the pass/.test(await p.locator('#supporter-pass-box [data-sp-open]').textContent()) && /\$2\.99 a month/.test(await p.textContent('#supporter-pass-box')) && /\$19\.99 a year/.test(await p.textContent('#supporter-pass-box')), `${tag}: the card offers the pass with both prices`);
    check((await p.locator('#supporter-pass-box .sp-perks li').count()) === 3, `${tag}: the card lists the three perks`);
    check((await p.$eval('#sub', (e) => e.firstElementChild.id)) === 'host-unlock-shop-box', `${tag}: Party Mode is on top until it is owned`);
    check(await fits('#supporter-pass-box'), `${tag}: the card fits the screen width`);
    check((await p.$eval('#pass-pull-card', (e) => e.hidden)), `${tag}: the daily-pull card is hidden without the pass`);
    if (process.env.SHOT && w === 360) await p.screenshot({ path: process.env.SHOT + '/pass-a.png', fullPage: true });
    // 2) the sheet
    await click('#supporter-pass-box [data-sp-open]');
    check((await p.locator('#supporter-sheet').count()) === 1 && /\$2\.99/.test(await p.textContent('#ss-price')) && (await p.getAttribute('[data-plan="month"]', 'aria-pressed')) === 'true', `${tag}: the sheet opens on Monthly at $2.99`);
    await click('[data-plan="year"]');
    check(/\$19\.99/.test(await p.textContent('#ss-price')) && /year/.test(await p.textContent('#ss-price')) && (await p.getAttribute('[data-plan="year"]', 'aria-pressed')) === 'true', `${tag}: Yearly shows $19.99 / year`);
    const buyBox = await p.locator('#ss-buy').boundingBox();
    check(buyBox.y + buyBox.height <= h + 0.5 && buyBox.height >= 40, `${tag}: the Start button is fully on screen and a comfortable target`);
    // 3) cancel the purchase: nothing changes
    await T('setBuy', false); await click('#ss-buy');
    check(!(await T('isSupporter')) && (await p.locator('#supporter-sheet').count()) === 1, `${tag}: cancelling the purchase grants nothing and keeps the sheet`);
    // 4) buy yearly
    if (process.env.SHOT && w === 360) await p.screenshot({ path: process.env.SHOT + '/pass-sheet.png' });
    await T('setBuy', true); await click('#ss-buy');
    const bought = await T('bought');
    check(bought.length === 2 && /Yearly/.test(bought[1].title) && /19\.99/.test(bought[1].price), `${tag}: the purchase asks for the yearly price`);
    check((await T('isSupporter')) && (await T('days')) >= 364 && (await T('days')) <= 366 && (await T('store')).supporterPlan === 'year', `${tag}: the yearly pass lasts about 365 days`);
    check((await p.locator('#supporter-sheet').count()) === 0 && /ACTIVE/.test(await p.textContent('#supporter-pass-box')) && /36[4-6] days left/.test(await p.textContent('#supporter-pass-box')), `${tag}: the sheet closes and the card shows ACTIVE with the days left`);
    check((await p.$eval('#sub', (e) => e.firstElementChild.id)) === 'host-unlock-shop-box', `${tag}: the pass still sits under an unowned Party Mode`);
    await T('set', { hostUnlocked: true }); await T('render');
    check((await p.$eval('#sub', (e) => e.firstElementChild.id)) === 'supporter-pass-box', `${tag}: once Party Mode is owned the pass goes on top`);
    if (process.env.SHOT && w === 360) await p.screenshot({ path: process.env.SHOT + '/pass-b.png', fullPage: true });
    // 5) the daily pull
    check(!(await p.$eval('#pass-pull-card', (e) => e.hidden)) && !(await p.$eval('#pass-pull-btn', (e) => e.disabled)), `${tag}: supporters see the daily-pull card with the button ready`);
    check(await fits('#pass-pull-card') && await fits('#sp-claim-btn'), `${tag}: the pull card and claim button fit the screen width`);
    await click('#pass-pull-btn');
    let s = await T('store');
    check(s.freePulls === 1 && s.passPullDate && (await p.$eval('#pass-pull-btn', (e) => e.disabled)) && (await p.$eval('#sp-claim-btn', (e) => e.disabled)), `${tag}: claiming adds exactly one free pull and both buttons rest`);
    check((await T('toasts')).length >= 1 && (await T('galleries')) >= 1, `${tag}: a toast tells the player and the machine updates`);
    check((await T('claim')) === '' && (await T('store')).freePulls === 1, `${tag}: a second claim the same day (even a direct call) adds nothing`);
    await T('set', { passPullDate: '2000-01-01' }); await T('render');
    await click('#sp-claim-btn'); check((await T('store')).freePulls === 2, `${tag}: the next day it can be claimed again`);
    // 5b) supporter extras: auras and name colours
    check(/Choose your extras/.test(await p.textContent('#supporter-pass-box')), `${tag}: the active card has a Choose your extras button`);
    await click('#supporter-pass-box [data-sp-extras]');
    check((await p.locator('#supporter-extras').count()) === 1 && (await p.locator('#se-grid .se-tile').count()) === 7 && (await p.locator('#se-grid .se-tile.on').textContent()).trim() === '\u2205None', `${tag}: the extras sheet opens on Auras with None plus six auras, None selected`);
    check((await p.$eval('#se-equip', (e) => e.disabled)), `${tag}: nothing to equip until something else is picked`);
    await click('#se-grid [data-pick="golden"]');
    check(/Equip Golden glow/.test(await p.textContent('#se-equip')) && (await p.getAttribute('#se-av img', 'data-aura')) === 'golden', `${tag}: picking Golden glow previews it and offers Equip Golden glow`);
    const gridFit = await p.evaluate(() => { const g = document.getElementById('se-grid').getBoundingClientRect(), b = document.getElementById('se-equip').getBoundingClientRect(); return { inside: g.left >= 0 && g.right <= innerWidth + 0.5, btn: b.bottom <= innerHeight + 0.5 || document.querySelector('#supporter-extras .ss-card').scrollHeight > document.querySelector('#supporter-extras .ss-card').clientHeight }; });
    check(gridFit.inside && gridFit.btn, `${tag}: the tiles fit the width and the Equip button is reachable`);
    await click('#se-equip');
    await p.waitForTimeout(400); if (process.env.SHOT && w === 360) await p.screenshot({ path: process.env.SHOT + '/pass-extras.png' });
    check((await T('store')).supporterAura === 'golden' && /Equipped/.test(await p.textContent('#se-equip')) && (await p.$eval('#se-equip', (e) => e.disabled)), `${tag}: Equip saves the aura and the button says Equipped`);
    await click('[data-tab="names"]');
    check((await p.locator('#se-grid .se-tile').count()) === 7 && (await p.locator('#se-name .nc').count()) === 0 && (await p.locator('#se-name .sup-medal').count()) === 1, `${tag}: the Name color tab shows six colours, and the preview already has the medal`);
    await click('#se-grid [data-pick="golden"]'); await click('#se-equip');
    if (process.env.SHOT && w === 360) await p.screenshot({ path: process.env.SHOT + '/pass-extras-names.png' });
    check((await T('store')).supporterNameColor === 'golden' && (await p.locator('#se-name .nc-golden').count()) === 1, `${tag}: equipping the golden name colour saves it and the preview glows`);
    const nameFit = await p.evaluate(() => { const r = document.querySelector('#se-name').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 0.5; });
    check(nameFit, `${tag}: the preview name fits the screen`);
    // the look that goes into the room
    const look = await T('roomLook');
    check(look.supporter === true && look.nameColor === 'golden' && look.avatarAura === 'golden', `${tag}: the room entry carries the medal, name colour and aura`);
    // nameHtml for everyone else
    const html = await p.evaluate(() => ({ plain: window.T.nameHtml({ name: '<b>Bo</b>' }), medal: window.T.nameHtml({ name: 'Al', supporter: true }), full: window.T.nameHtml({ name: 'Al', supporter: true, nameColor: 'golden' }), spoof: window.T.nameHtml({ name: 'Al', supporter: true, nameColor: '"><script>' }), colourOnly: window.T.nameHtml({ name: 'Al', nameColor: 'golden' }), none: window.T.nameHtml(undefined, 'Gone') }));
    check(html.plain === '&#60;b&#62;Bo&#60;/b&#62;', `${tag}: a plain name is escaped and unchanged`);
    check(/^<span class="nmw"><img class="sup-medal"[^>]*><span class="nt">Al<\/span><\/span>$/.test(html.medal) && /sup-medal[^>]*><span class="nt nc nc-golden">Al<\/span><\/span>$/.test(html.full), `${tag}: the medal comes before the name, and the colour wraps the name`);
    check(!/script/.test(html.spoof) && /^<span class="nmw"><img class="sup-medal"[^>]*><span class="nt">Al<\/span><\/span>$/.test(html.spoof), `${tag}: a made-up colour id is ignored`);
    check(html.colourOnly === 'Al' && html.none === 'Gone', `${tag}: a colour without the pass flag shows nothing, and a missing player shows the fallback`);
    await click('#supporter-extras .ss-x');
    check((await p.locator('#supporter-extras').count()) === 0, `${tag}: the sheet closes`);
    // 6) buy again adds time on top
    const before = await T('days'); await click('#supporter-pass-box [data-sp-open]'); await click('#ss-buy');
    const after = await T('days'); check(after >= before + 360, `${tag}: buying again adds time on top (${before} -> ${after} days)`);
    // 7) double coins: no ad for supporters
    const ads0 = await T('ads'); check((await T('adOrPass')) === true && (await T('ads')) === ads0, `${tag}: a supporter's double coins plays no ad`);
    // 8) expired pass
    await T('setOffset', 800 * 86400000); await T('render');
    check((await T('setExtras', { supporterAura: 'golden' })) === false && (await T('roomLook')).supporter === null && (await T('roomLook')).nameColor === null && (await T('roomLook')).avatarAura === null, `${tag}: after the pass runs out the extras are refused and the room entry is empty`);
    check(!(await T('isSupporter')) && (await T('adOrPass')) === true && (await T('ads')) === ads0 + 1, `${tag}: after the pass runs out the ad comes back`);
    check((await p.$eval('#pass-pull-card', (e) => e.hidden)) && (await T('claim')) === '' && /Get the pass/.test(await p.textContent('#supporter-pass-box')), `${tag}: an expired pass gets no pull and the card offers the pass again`);
    check(!errors.length, `${tag}: no page errors${errors.length ? ' - ' + errors[0] : ''}`);
    await p.close();
  }
  await b.close(); srv.close();
  console.log(failed ? `\n${failed} supporter pass check(s) failed` : '\nAll supporter pass checks passed');
  process.exitCode = failed ? 1 : 0;
});
