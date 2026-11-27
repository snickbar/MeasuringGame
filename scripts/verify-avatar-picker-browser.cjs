// Settings > Your avatar picker (a modal <dialog>) in a real browser, with the real stylesheets, the real dialog markup and the real grid + long-press code
// from index.html (the rest of the app is stubbed; the app itself needs Firebase). It checks:
//  - holding an avatar opens its card INSIDE the open dialog, visible on top (a card added to the page would sit hidden under the dialog),
//  - lifting the finger after a hold does not pick that avatar or close the picker, and a tap on the card closes only the card,
//  - a normal tap still picks an avatar and closes the picker,
//  - Random and Done keep their white text (Settings forces black text inside a .settings-card, so the dialog must not be inside one) and sit side by side,
//  - the equipped frame still draws on the current avatar.
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'); let failed = 0;
const fail = (m) => { failed++; console.error('FAIL', m); }, ok = (m) => console.log('ok  ', m), check = (c, m) => (c ? ok(m) : fail(m));
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const between = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('marker not found: ' + a); return src.slice(i, j); };
const inlineCss = src.match(/<style>([\s\S]*?)<\/style>/)[1];
const links = [...src.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);
const dialog = between('<dialog id="settings-avatar-picker"', '</dialog>') + '</dialog>';
const hostCode = between('  let avatarZoomTimer = null', '  function addAvatarPoints') + between('  // Picker grids (join/name screen', '  // The "View All" collection grid');
const renderFn = between('  function renderSettingsAvatarGrid()', '\n  mountSettingsNameEditor(');
const FAV_HEART = src.match(/const FAV_HEART = ('.*');/)[1];
const avatars = fs.readdirSync(path.join(root, 'avatars')).filter((f) => /^av\d+\.webp$/.test(f)).slice(0, 60).map((f) => f.slice(0, -5));
const frameId = fs.readdirSync(path.join(root, 'anim/player-frames')).find((f) => f.endsWith('.png')).slice(0, -4);
const js = `
const FAV_HEART = ${FAV_HEART}; const AV = ${JSON.stringify(avatars)}; let currentAvatar = AV[2]; window.__picked = [];
const defaultAvatarId = () => currentAvatar;
const settingsAvatarBigEl = document.createElement('div'), settingsAvatarGridEl = document.getElementById('settings-avatar-grid'), settingsAvatarPickerEl = document.getElementById('settings-avatar-picker');
const avatarHtml = (id) => '<img class="avatar avatar-icon" src="avatars/' + id + '.webp" alt="">';
const pictureSrc = (img) => img.getAttribute('src');
const defaultFrameFor = () => '${frameId}';
const showPlayerFrame = (t, id) => { t.classList.toggle('player-frame-host', !!id); t.querySelector(':scope > .player-frame-art')?.remove(); if (id) t.insertAdjacentHTML('beforeend', '<span class="player-frame-art" style="--player-frame-art:url(/anim/player-frames/' + id + '.png)"></span>'); };
const myGameFrameIndex = () => 0, avatarsSortedForPicker = () => AV, isAvatarUnlocked = () => true, isFavAvatar = (a) => AV.indexOf(a) < 5;
const setDefaultAvatar = (a) => { window.__picked.push(a); }, renderAvatarGrid = () => {}, playSound = () => {};
const openAvatarZoom = (tile, id) => { const ov = document.createElement('div'); ov.id = 'avatar-zoom-overlay'; ov.innerHTML = '<div class="avatar-zoom-card"><div class="avatar-zoom-pic"><img src="avatars/' + id + '.webp"></div></div>'; ov.addEventListener('click', () => ov.remove()); popupHost().appendChild(ov); };
${hostCode}
${renderFn}
settingsAvatarPickerEl.addEventListener('close', () => {});
settingsAvatarPickerEl.showModal(); renderSettingsAvatarGrid(); document.title = 'ready';`;
const page = `<!doctype html><html><head><meta charset="utf8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="/">${links.map((l) => `<link rel="stylesheet" href="${l}">`).join('')}<style>${inlineCss}</style>${links.filter((l) => /avatar-picker|game-polish|equipped|cozy|settings-page|game-setup/.test(l)).map((l) => `<link rel="stylesheet" href="${l}">`).join('')}</head><body style="background:#4a3a2a"><div id="settings-screen" class="screen" style="display:block!important;opacity:1!important;visibility:visible!important;animation:none!important"><div class="settings-card"><h3>Profile</h3></div>${dialog}</div><script>${js}</script></body></html>`;
const types = { '.webp': 'image/webp', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { if (q.url.startsWith('/__t')) { r.setHeader('Content-Type', 'text/html'); return r.end(page); } const f = path.resolve(root, '.' + decodeURIComponent(q.url.split('?')[0])); try { r.setHeader('Content-Type', types[path.extname(f)] || 'application/octet-stream'); r.end(fs.readFileSync(f)); } catch { r.writeHead(404); r.end(); } });
srv.listen(0, async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[320, 640], [360, 740], [412, 915]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } }), tag = `${w}x${h}`, errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(`http://127.0.0.1:${srv.address().port}/__t`);
    try { await p.waitForFunction(() => document.title === 'ready', null, { timeout: 5000 }); } catch (e) { fail(`${tag}: page did not start: ${errors[0]}`); continue; }
    await p.waitForTimeout(400);
    const s = await p.evaluate((w) => {
      const d = document.getElementById('settings-avatar-picker'), art = d.querySelector('#settings-avatar-current > .player-frame-art'), btn = (c) => getComputedStyle(d.querySelector(c)).color;
      const [r1, r2] = [...d.querySelectorAll('.ap-actions button')].map((x) => x.getBoundingClientRect());
      return { open: d.open, insideCard: !!d.closest('.settings-card'), rand: btn('.avatar-random-btn'), done: btn('.avatar-done-btn'), side: Math.abs(r1.top - r2.top) < 4 || w < 351, frame: !!art && art.getBoundingClientRect().width > 20, hscroll: document.documentElement.scrollWidth > innerWidth, cur: !!d.querySelector('#settings-avatar-current img') };
    }, w);
    check(s.open && !s.insideCard, `${tag}: picker open, not inside a settings card`);
    check(s.rand === 'rgb(255, 255, 255)' && s.done === 'rgb(255, 255, 255)', `${tag}: Random and Done text stays white`);
    check(s.side, `${tag}: Random and Done side by side (stacked only on very small phones)`);
    check(s.frame, `${tag}: equipped frame drawn on the current avatar`);
    check(!s.hscroll, `${tag}: no sideways scroll`);
    const tile = p.locator('#settings-avatar-grid .avatar-choice').nth(8); await tile.scrollIntoViewIfNeeded(); const bb = await tile.boundingBox();
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.waitForTimeout(700);
    const held = await p.evaluate(() => { const ov = document.getElementById('avatar-zoom-overlay'); if (!ov) return null; const c = ov.querySelector('.avatar-zoom-card').getBoundingClientRect(); return { parent: ov.parentElement.id, top: ov.contains(document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2)) }; });
    check(held && held.parent === 'settings-avatar-picker' && held.top, `${tag}: holding an avatar shows its card inside the picker, on top`);
    await p.mouse.up(); await p.waitForTimeout(300);
    const rel = await p.evaluate(() => ({ open: document.getElementById('settings-avatar-picker').open, card: !!document.getElementById('avatar-zoom-overlay'), picked: window.__picked.length }));
    check(rel.open && rel.card && rel.picked === 0, `${tag}: lifting the finger after a hold keeps the picker open, the card up, and picks nothing`);
    await p.mouse.click(w / 2, h / 2); await p.waitForTimeout(200);
    const tapCard = await p.evaluate(() => ({ open: document.getElementById('settings-avatar-picker').open, card: !!document.getElementById('avatar-zoom-overlay'), picked: window.__picked.length }));
    check(tapCard.open && !tapCard.card && tapCard.picked === 0, `${tag}: tapping the card closes only the card`);
    const t2 = p.locator('#settings-avatar-grid .avatar-choice').nth(3); await t2.scrollIntoViewIfNeeded(); const b2 = await t2.boundingBox();
    await p.mouse.click(b2.x + b2.width / 2, b2.y + b2.height / 2); await p.waitForTimeout(200);
    const tap = await p.evaluate(() => ({ open: document.getElementById('settings-avatar-picker').open, picked: window.__picked.length }));
    check(!tap.open && tap.picked === 1, `${tag}: a normal tap still picks an avatar and closes the picker`);
    check(!errors.length, `${tag}: no page errors${errors.length ? ' - ' + errors[0] : ''}`);
    await p.close();
  }
  await b.close(); srv.close();
  console.log(failed ? `\n${failed} avatar picker check(s) failed` : '\nAll avatar picker checks passed');
  process.exitCode = failed ? 1 : 0;
});
