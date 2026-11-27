// The avatar edit popups, in a real browser with the real stylesheets and the real popup code from index.html (the rest of the app is stubbed; the app itself needs Firebase):
//  - the avatar card (hold an avatar / tap in the collection) and the game-only Edit box must NOT close from a stray tap (picture, name, level text, blank space, the dim
//    background). They close only from the X or Done button; the arrows keep them open.
//  - a card with nothing to edit (an avatar you do not own yet) is only a preview, so a tap anywhere still closes it.
//  - the X and Done button stay fully on screen on small phones, even at Level 6 with every row open.
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'); let failed = 0;
const fail = (m) => { failed++; console.error('FAIL', m); }, ok = (m) => console.log('ok  ', m), check = (c, m) => (c ? ok(m) : fail(m));
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const between = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('marker not found: ' + a); return src.slice(i, j); };
const line = (start) => { const i = src.indexOf('\n' + start); if (i < 0) throw new Error('line not found: ' + start); return src.slice(i + 1, src.indexOf('\n', i + 1)); };
const inlineCss = src.match(/<style>([\s\S]*?)<\/style>/)[1];
const links = [...src.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);
const FAV_HEART = src.match(/const FAV_HEART = ('.*');/)[1];
const code = [
  between('  const AVATAR_PERKS = [', '  // Level 2 shows the play style'),
  line('  const colorArrowsHtml ='), line('  const auraArrowsHtml ='), line('  const stickerRowHtml ='),
  between('  function popupHost() {', '  function avatarIdFromTile('),
  between('  function avatarLevelHtml(', '  // Picker grids (join/name screen'),
  between('  function gameEditRowsHtml() {', '  document.getElementById("room-frame-edit")'),
].join('\n');
const js = `
import { avatarLevelFor, avatarLevelProgress } from '/anim/avatar-levels.mjs';
import { auraName } from '/anim/avatar-auras.mjs';
const FAV_HEART = ${FAV_HEART}; const DEBUG_TOOLS = false; window.__log = [];
const myProfile = { avatarPoints: { av01: 130, av02: 130 } };
const avatarPoints = (id) => Number(myProfile.avatarPoints[id]) || 0, avatarLevel = (id) => avatarLevelFor(avatarPoints(id)), FRAME_LEVEL = 3;
let currentAvatar = 'av01';
const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const BOT_NAME_BY_AVATAR = { av01: 'Biscuit', av02: 'Biscuit' }, AVATAR_TIERS = { av01: 'default', av02: 'default' };
const isAvatarUnlocked = (id) => id === 'av01', isFavAvatar = () => false, toggleFavAvatar = () => {};
const playerFrameCatalog = [{ id: 0, name: 'None' }, { id: 1, name: 'Gold' }, { id: 2, name: 'Leaf' }];
const framesFor = () => playerFrameCatalog, defaultFrameFor = () => 1, defaultColorFor = () => 'Blue', defaultStickerFor = () => '', defaultAuraFor = () => 'orbit';
const equippedPlayerFrame = () => 1, equippedAvatarColor = () => 'Blue', equippedAvatarSticker = () => '', equippedAvatarAura = () => 'orbit', equippedAvatarLook = () => '', defaultAvatarLook = () => '';
const colorLabel = (n) => n || 'Original', stickerInfo = () => null;
const factFor = () => 'Loves to nap in the sun and then nap some more.', personalityFor = () => ({ label: 'The Cautious One', blurb: 'Rarely guesses wildly.' }), personalityKnown = () => true;
const avatarHtml = (id) => '<img class="avatar avatar-icon" src="/avatars/' + id + '.webp" alt="">';
const showPlayerFrame = () => {}, preloadFrameArt = () => {}, paintZoomPic = () => {}, openStickerEditor = () => {}, myGameFrameIndex = () => 0;
const stepColor = (a, c, dir) => { window.__log.push('color' + dir); return 'Red'; }, stepAura = (a, c, dir) => { window.__log.push('aura' + dir); return 'glow'; };
const setDefaultColor = () => {}, setDefaultAura = () => {}, setDefaultFrame = (a, f) => window.__log.push('frame'), setDefaultSticker = () => {};
const setGameColor = () => {}, setGameAura = () => {}, setGameFrame = () => window.__log.push('gframe'), setGameSticker = () => {};
${code}
window.T = { openAvatarZoom, openGameEdit, closeAvatarZoom };`;
const page = `<!doctype html><html><head><meta charset="utf8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="/">${links.map((l) => `<link rel="stylesheet" href="${l}">`).join('')}<style>${inlineCss}</style></head><body style="background:#4a3a2a"><button id="tile" class="avatar-choice" style="position:fixed;left:4px;top:4px;width:30px"><img class="avatar-icon" src="/avatars/av01.webp"></button><button id="locked" class="avatar-choice locked" style="position:fixed;left:40px;top:4px;width:30px"><img class="avatar-icon" src="/avatars/av02.webp"></button><script type="module">${js}</script></body></html>`;
const types = { '.webp': 'image/webp', '.css': 'text/css', '.png': 'image/png', '.mjs': 'text/javascript', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { if (q.url.startsWith('/__t')) { r.setHeader('Content-Type', 'text/html'); return r.end(page); } const f = path.resolve(root, '.' + decodeURIComponent(q.url.split('?')[0])); try { r.setHeader('Content-Type', types[path.extname(f)] || 'application/octet-stream'); r.end(fs.readFileSync(f)); } catch { r.writeHead(404); r.end(); } });
srv.listen(0, async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[360, 640], [390, 780], [412, 915], [320, 568]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } }), tag = `${w}x${h}`, errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(`http://127.0.0.1:${srv.address().port}/__t`);
    try { await p.waitForFunction(() => window.T, null, { timeout: 5000 }); } catch (e) { fail(`${tag}: page did not start: ${errors[0]}`); continue; }
    const open = (what) => p.evaluate((what) => { window.T.closeAvatarZoom(); if (what === 'edit') window.T.openGameEdit(); else window.T.openAvatarZoom(document.getElementById(what), what === 'tile' ? 'av01' : 'av02'); }, what);
    const isOpen = () => p.evaluate(() => !!document.getElementById('avatar-zoom-overlay'));
    const click = async (sel) => { const r = await p.locator(sel).first().boundingBox(); await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2); await p.waitForTimeout(80); };
    const strays = ['#avatar-zoom-overlay .avatar-zoom-pic', '#avatar-zoom-overlay .avatar-zoom-name', '#avatar-zoom-overlay .avatar-zoom-rarity', '#avatar-zoom-overlay .avatar-zoom-perk em'];
    for (const [what, label] of [['tile', 'avatar card'], ['edit', 'Edit box']]) {
      await open(what); await p.waitForTimeout(350);
      const fit = await p.evaluate(() => { const rect = (s) => document.querySelector(s)?.getBoundingClientRect(); const d = rect('#avatar-zoom-overlay .avatar-zoom-done'), x = rect('#avatar-zoom-overlay .avatar-zoom-close'), c = rect('#avatar-zoom-overlay .avatar-zoom-card');
        return { done: !!d, x: !!x, inside: !!d && d.bottom <= innerHeight && d.top >= 0 && x.top >= 0 && c.top >= 0 && c.bottom <= innerHeight + 1, cardBottom: c && Math.round(c.bottom) }; });
      check(fit.done && fit.x, `${tag}: ${label} has a Done button and an X`);
      check(fit.inside, `${tag}: ${label}: Done and X fully on screen (card bottom ${fit.cardBottom} of ${h})`);
      for (const sel of strays) { await click(sel); check(await isOpen(), `${tag}: ${label} stays open when tapping ${sel.split(' ').pop()}`); }
      await p.mouse.click(4, h - 4); await p.waitForTimeout(80); check(await isOpen(), `${tag}: ${label} stays open when tapping the dim background`);
      for (const arrow of ['[data-zframe="1"]', '[data-zcolor="-1"]', '[data-zaura="1"]']) { await click('#avatar-zoom-overlay ' + arrow); check(await isOpen(), `${tag}: ${label} stays open after the ${arrow.slice(1, 7)} arrow`); }
      await click('#avatar-zoom-overlay .avatar-zoom-done'); check(!(await isOpen()), `${tag}: ${label}: Done closes it`);
      await open(what); await p.waitForTimeout(350); await click('#avatar-zoom-overlay .avatar-zoom-close'); check(!(await isOpen()), `${tag}: ${label}: the X closes it`);
    }
    await open('locked'); await p.waitForTimeout(350);
    const hasDone = await p.evaluate(() => !!document.querySelector('#avatar-zoom-overlay .avatar-zoom-done'));
    await click('#avatar-zoom-overlay .avatar-zoom-name'); check(!hasDone && !(await isOpen()), `${tag}: a preview card (avatar not owned) still closes on any tap`);
    check(!errors.length, `${tag}: no page errors${errors.length ? ' - ' + errors[0] : ''}`);
    await p.close();
  }
  await b.close(); srv.close();
  console.log(failed ? `\n${failed} avatar popup check(s) failed` : '\nAll avatar popup checks passed');
  process.exitCode = failed ? 1 : 0;
});
