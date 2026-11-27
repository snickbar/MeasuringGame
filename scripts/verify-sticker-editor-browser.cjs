// The sticker editor (Avatar Level 5) must fit small phones with its on-screen keyboard open, search with the app's own keyboard
// (never the phone's), and move / resize / turn / save a sticker. It runs the real editor code from index.html in a real browser with the
// rest of the app stubbed (the app itself needs Firebase), against the real stylesheet.
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'); let failed = 0;
const fail = (m) => { failed++; console.error('FAIL', m); }, ok = (m) => console.log('ok  ', m);
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const grab = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error('marker not found: ' + a); return src.slice(i, j); };
const code = [
  grab('  function avatarHtml(id, extraClass, position, colorOverride) {', '  // Escapes any free-text value'),
  grab('  const COLOR_LEVEL = 4;', "  // Each player's border is recoloured"),
  grab('  // ---- The sticker editor', '  // Choose your avatar shows the avatar'),
  grab('  function renderCustomKeyboard(', '  const lobbyScreenEl'),
].join('\n');
const items = fs.readdirSync(path.join(root, 'items')).filter((f) => f.endsWith('.webp')).map((f) => f.slice(0, -5)).slice(0, 90);
const worlds = [0, 1, 2].map((k) => ({ name: ['Tiny Things', 'Toys & Games', 'Wild Animals'][k], ids: items.slice(k * 30, k * 30 + 30) }));
const reactions = ['crown', 'fire', 'heart', 'trophy', 'clap', 'wave'];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png' };
const srv = http.createServer((q, r) => { let f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });
srv.listen(0, async () => {
  const origin = `http://localhost:${srv.address().port}`;
  const b = await chromium.launch();
  for (const [w, h] of [[320, 568], [360, 640], [412, 915]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } }), tag = `${w}x${h}`, errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
    await p.goto(`${origin}/index.html`, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1200);
    await p.evaluate(() => { for (const c of [...document.body.children]) c.style.display = 'none'; });
    await p.addScriptTag({ type: 'module', content: `
      import { colorChoices, colorHue, recoloredAvatar, makeRecoloredAvatar, colorKey } from "${origin}/anim/avatar-colors.mjs";
      import { AURAS, isAura, auraName } from "${origin}/anim/avatar-auras.mjs";
      const WORLDS = ${JSON.stringify(worlds)}; const OBJECT_BY_ID = new Map(); const seen = {}; const disc = {};
      WORLDS.forEach((wd, wi) => wd.ids.forEach((id, k) => { OBJECT_BY_ID.set(id, { id, name: id.replace(/-/g, " "), image: "items/" + id + ".webp" }); seen[id] = true; if (k % 5 === 0) disc[id] = { t: 1000 + wi * 10 + k }; }));
      const REACTIONS = {}; const REACTION_BY_ID = {}; for (const n of ${JSON.stringify(reactions)}) { REACTIONS[n] = { id: n, label: n }; REACTION_BY_ID[n] = { id: n }; }
      const reactionPic = (e) => "icons/reactions/" + REACTIONS[e].id + ".webp"; const ownsEmoji = () => true;
      const recentDiscoveries = (prof, { limit, allowed }) => Object.entries(prof.objectDiscoveries).filter(([id]) => allowed.has(id)).sort((a, b) => b[1].t - a[1].t).slice(0, limit).map(([id]) => ({ id }));
      const AVATARS = ["av01"], AVATAR_TIERS = { av01: "default" }, AVATAR_FACE = {};
      let currentAvatar = "av01", currentRoomCode = null, currentPlayers = {};
      let myProfile = { avatarPoints: { av01: 100 }, avatarColors: {}, avatarStickers: {}, seenObjects: seen, objectDiscoveries: disc };
      const avatarLevel = (id) => Math.floor((Number(myProfile.avatarPoints[id]) || 0) / 20);
      const pictureSrcAttr = (u) => 'data-src="' + u + '"';
      const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
      const nameKeyboardEl = null;
      ${code}
      window.T = { openStickerEditor, stickerInfo };` });
    await p.waitForFunction(() => window.T);
    const saved = []; await p.exposeFunction('onSaved', (v) => saved.push(v));
    await p.evaluate(() => window.T.openStickerEditor({ avId: 'av01', title: 'Ursa', sub: 'Default sticker', value: 'r:crown:60:14:32:12', color: 'Blue', onSave: (v) => window.onSaved(v) }));
    await p.waitForTimeout(300);
    const inView = (sel) => p.evaluate((s) => { const r = document.querySelector(s)?.getBoundingClientRect(); return !!r && r.top >= -1 && r.bottom <= innerHeight + 1 && r.left >= -1 && r.right <= innerWidth + 1; }, sel);
    for (const s of ['.stk-head', '.stk-box', '.stk-tabs', '.stk-chips', '.stk-scroll', '[data-sdone]']) (await inView(s)) ? 0 : fail(`${tag}: ${s} is off screen`);
    const trayRows = await p.evaluate(() => document.querySelector('.stk-scroll').getBoundingClientRect().height);
    trayRows >= 80 ? ok(`${tag}: tray keeps ${Math.round(trayRows)}px`) : fail(`${tag}: tray only ${Math.round(trayRows)}px tall`);
    // layout: the key above the picture; Remove and Mirror on the Reactions/Objects row, right of a divider
    const lay = await p.evaluate(() => { const r = (q) => document.querySelector(q).getBoundingClientRect(); return { legendBottom: r('.stk-legend').bottom, boxTop: r('.stk-box').top, objRight: r('[data-stab=o]').right, sepLeft: r('.stk-sep').left, sepRight: r('.stk-sep').right, remLeft: r('[data-sremove]').left, remTop: r('[data-sremove]').top, tabTop: r('[data-stab=o]').top, mirLeft: r('[data-smirror]').left, mirRight: r('[data-smirror]').right, rowRight: r('.stk-tabs').right }; });
    lay.legendBottom <= lay.boxTop ? ok(`${tag}: key sits above the picture`) : fail(`${tag}: key is not above the picture`);
    lay.sepLeft >= lay.objRight && lay.remLeft >= lay.sepRight && lay.mirLeft >= lay.remLeft && lay.mirRight <= lay.rowRight + 1 && Math.abs(lay.remTop - lay.tabTop) < 12 ? ok(`${tag}: divider, Remove, Mirror follow Objects`) : fail(`${tag}: bad Remove/Mirror row ${JSON.stringify(lay)}`);
    await p.click('[data-smirror]');
    (await p.evaluate(() => document.querySelector('.stk-sticker img').style.transform)) === 'scaleX(-1)' ? ok(`${tag}: Mirror flips the sticker`) : fail(`${tag}: Mirror did not flip`);
    await p.click('[data-smirror]');
    (await p.evaluate(() => document.querySelector('.stk-sticker img').style.transform)) === '' ? ok(`${tag}: Mirror flips it back`) : fail(`${tag}: second Mirror did not flip back`);
    // move
    const before = await p.evaluate(() => document.querySelector('.stk-sticker').style.left + '/' + document.querySelector('.stk-sticker').style.top);
    const bb = await p.locator('.stk-sticker').boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.mouse.move(bb.x + bb.width / 2 - 30, bb.y + bb.height / 2 + 40, { steps: 4 }); await p.mouse.up();
    const after = await p.evaluate(() => document.querySelector('.stk-sticker').style.left + '/' + document.querySelector('.stk-sticker').style.top);
    before !== after ? ok(`${tag}: dragging moves the sticker`) : fail(`${tag}: drag did not move the sticker`);
    // resize
    const s0 = await p.evaluate(() => parseFloat(document.querySelector('.stk-sticker').style.width));
    const sz = await p.locator('.stk-size').boundingBox(); await p.mouse.move(sz.x + 14, sz.y + 14); await p.mouse.down(); await p.mouse.move(sz.x + 50, sz.y + 46, { steps: 4 }); await p.mouse.up();
    const s1 = await p.evaluate(() => parseFloat(document.querySelector('.stk-sticker').style.width));
    s1 > s0 ? ok(`${tag}: the corner handle resizes (${s0}% to ${s1}%)`) : fail(`${tag}: resize did not grow the sticker (${s0} to ${s1})`);
    // turn
    const r0 = await p.evaluate(() => document.querySelector('.stk-sticker').style.transform);
    const kn = await p.locator('.stk-knob').boundingBox(); await p.mouse.move(kn.x + 14, kn.y + 14); await p.mouse.down(); await p.mouse.move(kn.x + 90, kn.y + 40, { steps: 4 }); await p.mouse.up();
    (await p.evaluate(() => document.querySelector('.stk-sticker').style.transform)) !== r0 ? ok(`${tag}: the knob turns the sticker`) : fail(`${tag}: knob did not turn the sticker`);
    // pick an object, then search with the app's keyboard
    await p.click('.stk-tabs button[data-stab=o]'); await p.click('.stk-chips button:nth-child(4)'); await p.click('.stk-tray button:nth-child(2)');
    await p.click('#sticker-search-edit'); await p.waitForTimeout(150);
    const kbd = await p.evaluate(() => { const k = document.querySelector('.stk-kbd'), r = k.getBoundingClientRect(), t = document.querySelector('.stk-scroll').getBoundingClientRect(), s = document.querySelector('.stk-box').getBoundingClientRect(); return { hidden: k.hidden, bottom: r.bottom, vh: innerHeight, tray: t.height, boxTop: s.top, readonly: document.getElementById('sticker-search').readOnly, mode: document.getElementById('sticker-search').inputMode }; });
    !kbd.hidden && kbd.bottom <= kbd.vh + 1 ? ok(`${tag}: keyboard opens inside the screen`) : fail(`${tag}: keyboard hidden or off screen (${JSON.stringify(kbd)})`);
    kbd.tray >= 50 ? ok(`${tag}: results stay visible above the keyboard (${Math.round(kbd.tray)}px)`) : fail(`${tag}: results squeezed to ${Math.round(kbd.tray)}px by the keyboard`);
    kbd.readonly && kbd.mode === 'none' ? ok(`${tag}: search uses the in-app keyboard only`) : fail(`${tag}: the search box could bring up the phone's keyboard`);
    const all = await p.locator('.stk-tray button').count();
    for (const k of ['Z', 'Z', 'Z']) await p.click(`.stk-kbd button.kbd-key[data-key="${k}"]`);
    const none = await p.locator('.stk-tray button').count();
    none === 0 && all > 0 ? ok(`${tag}: typing narrows the results (${all} to ${none})`) : fail(`${tag}: search did not narrow (${all} to ${none})`);
    await p.click('#sticker-search-clear'); await p.click('.stk-kbd [data-action=done]');
    // cancel saves nothing, Done saves a valid sticker
    await p.click('[data-sx]'); saved.length === 0 ? ok(`${tag}: Cancel saves nothing`) : fail(`${tag}: Cancel saved ${saved[0]}`);
    await p.evaluate(() => window.T.openStickerEditor({ avId: 'av01', title: 'Ursa', sub: 'This game only', value: '', color: '', onSave: (v) => window.onSaved(v) }));
    await p.click('.stk-tabs button[data-stab=r]'); await p.click('.stk-tray button:nth-child(1)'); await p.click('[data-sdone]');
    /^r:[A-Za-z0-9_-]+:\d{1,3}:\d{1,3}:\d{1,2}:-?\d{1,3}(:m)?$/.test(saved[0] || '') ? ok(`${tag}: Done saves ${saved[0]}`) : fail(`${tag}: Done saved ${JSON.stringify(saved[0])}`);
    await p.evaluate(() => window.T.openStickerEditor({ avId: 'av01', title: 'Ursa', sub: 'Default sticker', value: 'r:crown:60:14:32:12', color: '', onSave: (v) => window.onSaved(v) }));
    await p.click('[data-smirror]'); await p.click('[data-sdone]');
    saved[1] === 'r:crown:60:14:32:12:m' ? ok(`${tag}: a mirrored sticker saves with :m`) : fail(`${tag}: mirrored save was ${JSON.stringify(saved[1])}`);
    errors.length ? fail(`${tag}: page errors ${errors.join('; ')}`) : 0;
    await p.close();
  }
  await b.close(); srv.close();
  if (failed) { console.error(`\n${failed} sticker editor check(s) failed`); process.exit(1); }
  console.log('\nAll sticker editor checks passed');
});
