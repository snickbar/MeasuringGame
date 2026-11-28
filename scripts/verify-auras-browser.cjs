// Avatar auras (Level 6) are drawn by anim/avatar-auras.mjs as a layer behind each avatar picture. They must never change a card's layout, must
// sit exactly behind their picture (picture on top), skip the tiny stamps, use the player's card color, and come and go with the picture.
// Runs the real avatarHtml code and the real aura module in a real browser against the real stylesheet (the app itself needs Firebase).
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'); let failed = 0;
const fail = (m) => { failed++; console.error('FAIL', m); }, ok = (m) => console.log('ok  ', m);
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const grab = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error('marker not found: ' + a); return src.slice(i, j); };
const code = [
  grab('  function avatarHtml(id, extraClass, position, colorOverride) {', '  // Escapes any free-text value'),
  grab('  const COLOR_LEVEL = 4;', "  // Each player's border is recoloured"),
].join('\n');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png' };
const srv = http.createServer((q, r) => { let f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });
srv.listen(0, async () => {
  const origin = `http://localhost:${srv.address().port}`;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 800 } }), errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
  await p.goto(`${origin}/index.html`, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1200);
  await p.evaluate(() => { for (const c of [...document.body.children]) c.style.display = 'none'; });
  await p.addScriptTag({ type: 'module', content: `
    import { colorChoices, colorHue, recoloredAvatar, makeRecoloredAvatar, colorKey } from "${origin}/anim/avatar-colors.mjs";
    import { AURAS, SUPPORTER_AURAS, isAura, auraName, installAuras } from "${origin}/anim/avatar-auras.mjs";
    const AVATARS = ["av01", "av02"], AVATAR_TIERS = { av01: "default", av02: "default" }, AVATAR_FACE = {};
    let currentAvatar = "av01", currentRoomCode = null, currentPlayers = {}, currentPlayerId = "me";
    let myProfile = { avatarPoints: { av01: 200 }, avatarColors: {}, avatarStickers: {}, avatarAuras: {} };
    const avatarLevel = (id) => Math.floor((Number(myProfile.avatarPoints[id]) || 0) / 20);
    const pictureSrcAttr = (u) => 'data-src="' + u + '"';
    const myGameFrameIndex = () => 0;
    const REACTION_BY_ID = {}, OBJECT_BY_ID = new Map(), REACTIONS = {}, reactionPic = () => '', ownsEmoji = () => false;
    ${code}
    window.T = { avatarHtml, roomAvatarLooks, setRoom: (on) => { currentRoomCode = on ? "ROOM" : null; }, installAuras, AURAS, SUPPORTER_AURAS };` });
  await p.waitForFunction(() => window.T, null, { timeout: 8000 }).catch((e) => { console.error('page errors:', errors.join('; ')); throw e; });

  // ---- avatarHtml asks for an aura only when one is set, and only on the full-size picture ----
  const html = await p.evaluate(() => {
    const T = window.T; T.setRoom(true); T.roomAvatarLooks.set("av02", { color: "", sticker: "", aura: "ripple", slot: 7 });
    return {
      set: T.avatarHtml("av01", "", undefined, { aura: "glow", slot: 4 }), plain: T.avatarHtml("av01", "", undefined, ""), grid: T.avatarHtml("av01", "", 3),
      bad: T.avatarHtml("av01", "", undefined, { aura: "x\" onerror=\"1", slot: 4 }), room: T.avatarHtml("av02"), roomOther: T.avatarHtml("av01"),
    };
  });
  /data-aura="glow" data-aura-slot="4"/.test(html.set) ? ok('avatarHtml carries the aura and slot') : fail('no aura attributes: ' + html.set);
  !/data-aura/.test(html.plain) && !/data-aura/.test(html.grid) ? ok('pickers and long grids get no aura') : fail('aura leaked into a picker or grid');
  !/data-aura/.test(html.bad) ? ok('an unknown aura name never reaches the HTML') : fail('unvalidated aura in HTML: ' + html.bad);
  /data-aura="ripple" data-aura-slot="7"/.test(html.room) && !/data-aura/.test(html.roomOther) ? ok('in a room the aura comes from that avatar\'s player') : fail('room aura wrong: ' + html.room + ' / ' + html.roomOther);

  // ---- the layer, on card-like layouts ----
  await p.evaluate(() => {
    const css = document.createElement('style');
    css.textContent = '#fx{position:absolute;left:0;top:0;width:360px;display:flex;flex-direction:column;gap:14px;padding:12px;background:#fff} #fx .row{display:flex;align-items:center;gap:10px;padding:8px;border:1px solid #ccc} #fx .avatar{display:grid;place-items:center;font-size:30px} #fx .a80 img{width:80px;height:80px} #fx .a44 img{width:44px;height:44px} #fx .a28 img{width:28px;height:28px} #fx .rel{position:relative;width:64px;height:64px} #fx .rel img{width:100%;height:100%} #fx .abs{position:relative;width:60px;height:60px} #fx .abs img{position:absolute;inset:0;width:100%;height:100%}';
    document.head.append(css);
    const box = document.createElement('div'); box.id = 'fx';
    const a = (cls, id, look) => `<div class="row"><span class="avatar ${cls}">${window.T.avatarHtml(id, '', undefined, look)}<small class="badge" style="position:absolute;margin:30px 0 0 30px;width:8px;height:8px;background:red"></small></span><b>Name</b></div>`;
    box.innerHTML = a('a80', 'av01', { aura: 'glow', slot: 4 }) + a('a44', 'av01', { aura: 'sparkle', slot: 1 }) + a('a28', 'av01', { aura: 'flame', slot: 2 }) + a('a80', 'av01', '') +
      `<div class="row"><span class="rel">${window.T.avatarHtml('av01', '', undefined, { aura: 'orbit', slot: 9 })}</span><span class="abs">${window.T.avatarHtml('av01', '', undefined, { aura: 'halo', slot: 10 })}</span></div>`;
    document.body.append(box);
  });
  const rects = () => p.evaluate(() => [...document.querySelectorAll('#fx img, #fx .row, #fx')].map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)].join(','); }));
  const before = await rects();
  await p.evaluate(() => window.T.installAuras(['#d4825f', '#f0b98a', '#a8a0a0', '#4fb0e0', '#3a9d90', '#4cc035', '#f26fa0', '#8fd98a', '#e84a55', '#f4b94a']));
  await p.waitForTimeout(600);
  const after = await rects();
  JSON.stringify(before) === JSON.stringify(after) ? ok('adding auras moves and resizes nothing') : fail('layout changed:\n' + before.join(' | ') + '\n' + after.join(' | '));

  const info = await p.evaluate(() => [...document.querySelectorAll('#fx img[data-aura]')].map((img) => {
    const fx = img.previousElementSibling, r = img.getBoundingClientRect(), f = fx && fx.classList.contains('aura-fx') ? fx.getBoundingClientRect() : null;
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { kind: img.dataset.aura, w: Math.round(r.width), hasFx: !!f, hidden: fx?.hidden, same: f ? [r.left - f.left, r.top - f.top, r.width - f.width, r.height - f.height].every((d) => Math.abs(d) < 1.5) : false, pieces: fx ? fx.children.length : 0, onTop: top === img, c: fx ? fx.style.getPropertyValue('--c') : '', pos: getComputedStyle(img).position };
  }));
  const by = Object.fromEntries(info.map((i) => [i.kind, i]));
  by.glow && by.glow.hasFx && by.glow.same ? ok('the aura sits exactly behind a flex/grid card picture') : fail('glow layer wrong: ' + JSON.stringify(by.glow));
  Object.values(by).filter((i) => i.hasFx && !i.hidden).every((i) => i.onTop) ? ok('every picture paints over its own aura') : fail('a picture is covered: ' + JSON.stringify(info));
  by.sparkle && by.sparkle.hasFx && by.sparkle.same ? ok('a 44px picture gets an aura too') : fail('sparkle layer wrong: ' + JSON.stringify(by.sparkle));
  by.flame && (!by.flame.hasFx || by.flame.hidden) ? ok('a 28px stamp gets no aura') : fail('tiny picture got an aura: ' + JSON.stringify(by.flame));
  by.orbit && by.orbit.same && by.halo && by.halo.same ? ok('works in relative boxes and with an absolutely placed picture') : fail('orbit/halo layers wrong: ' + JSON.stringify([by.orbit, by.halo]));
  by.halo && by.halo.pos === 'absolute' ? ok('a picture that is already positioned keeps its own position') : fail('halo picture position changed to ' + (by.halo && by.halo.pos));
  by.glow.c.toLowerCase() === '#4fb0e0' && by.sparkle.c.toLowerCase() === '#d4825f' ? ok('the color is the player\'s card color for the slot') : fail('colors wrong: ' + by.glow.c + ' ' + by.sparkle.c);
  // no slot (the card, Edit, pickers): each effect shows its own color; a slot always wins
  const own = await p.evaluate(() => {
    const mk = (kind, slot) => { const i = document.createElement('img'); i.className = 'avatar-icon'; i.src = 'avatars/av01.webp'; i.dataset.aura = kind; i.dataset.auraSlot = slot; i.style.cssText = 'width:80px;height:80px'; document.querySelector('#fx').append(i); return i; };
    const imgs = [mk('bubble', 0), mk('flame', 0), mk('flame', 4)];
    return new Promise((res) => setTimeout(() => res(imgs.map((i) => i.previousElementSibling.style.getPropertyValue('--c').toLowerCase())), 300));
  });
  own[0] === '#4fb0e0' && own[1] === '#ff4b2b' ? ok('without a game color: blue bubbles, red flames') : fail('own colors wrong: ' + own.join(' '));
  own[2] === '#4fb0e0' ? ok('with a game color the effect uses it') : fail('slot color ignored: ' + own[2]);
  const calm = await p.evaluate(() => { const s = (k) => document.querySelector(`#fx img[data-aura="${k}"]`).previousElementSibling.children.length; return { big: s('glow'), calmSparkle: s('sparkle') }; });
  calm.calmSparkle === 4 ? ok('a 44px picture gets the calmer set (4 sparkles)') : fail('expected 4 sparkles on the 44px picture, got ' + calm.calmSparkle);
  const badge = await p.evaluate(() => { const bd = document.querySelector('#fx .badge'), fxEl = bd.parentElement.querySelector('.aura-fx'); const r = bd.getBoundingClientRect(), top = document.elementFromPoint(r.left + 4, r.top + 4); return top === bd; });
  badge ? ok('a badge placed over the picture still paints over it') : fail('a badge was covered by the picture or its aura');

  // ---- change and removal ----
  const kinds = await p.evaluate(async () => {
    const out = {}, img = document.querySelector('#fx img[data-aura="glow"]');
    for (const a of window.T.AURAS) {
      img.dataset.aura = a.id; await new Promise((r) => setTimeout(r, 120));
      const fx = img.previousElementSibling; out[a.id] = fx.classList.contains('a-' + a.id) && fx.children.length > 0;
    }
    return out;
  });
  const bad = Object.entries(kinds).filter(([, v]) => !v).map(([k]) => k);
  bad.length === 0 ? ok('all ' + Object.keys(kinds).length + ' effects build when the aura is changed') : fail('effects that did not build: ' + bad.join(', '));
  // Supporter aura (Eclipse): drawn by its own pieces, in its own fixed colour even when the picture has a card slot colour
  const sup = await p.evaluate(async () => {
    const out = {}, img = document.querySelector('#fx img[data-aura]');
    img.dataset.auraSlot = '3';
    for (const a of window.T.SUPPORTER_AURAS) {
      img.dataset.aura = a.id; await new Promise((r) => setTimeout(r, 120));
      const fx = img.previousElementSibling, box = fx.getBoundingClientRect();
      const disc = fx.querySelector('.disc'), cor = fx.querySelectorAll('.cor'), dr = disc && disc.getBoundingClientRect();
      out[a.id] = { built: fx.classList.contains('a-' + a.id) && !!disc && cor.length === 2 && !!fx.querySelector('.flare'), colour: fx.style.getPropertyValue('--c') === a.colour, sized: !!dr && dr.width > box.width && box.width > 0 };
    }
    img.dataset.aura = 'glow'; delete img.dataset.auraSlot;
    return out;
  });
  const supBad = Object.entries(sup).filter(([, v]) => !(v.built && v.colour && v.sized)).map(([k, v]) => k + ' ' + JSON.stringify(v));
  Object.keys(sup).length === 1 && supBad.length === 0 ? ok('the Eclipse supporter aura builds a disc, two ray layers and a flare, keeps its own colour and has a size') : fail('supporter aura: ' + supBad.join('; '));
  // Gyroscope: three rings on a full-size picture, two on a small one, each really turning in 3D
  const gy = await p.evaluate(async () => {
    const img = document.querySelector('#fx img[data-aura]'); img.dataset.aura = 'gyro'; await new Promise((r) => setTimeout(r, 150));
    const fx = img.previousElementSibling, rings = [...fx.querySelectorAll('.gy')];
    return { n: rings.length, persp: getComputedStyle(fx).perspective, anim: rings.every((r) => /auraGyro/.test(getComputedStyle(r).animationName)), bead: getComputedStyle(rings[0], '::after').width };
  });
  gy.n >= 2 && gy.persp !== 'none' && gy.anim ? ok('Gyroscope builds its tilted rings with a 3D spin (' + gy.n + ' rings)') : fail('Gyroscope: ' + JSON.stringify(gy));
  const gone = await p.evaluate(async () => {
    const img = document.querySelector('#fx img[data-aura]'), row = img.closest('.row');
    delete img.dataset.aura; await new Promise((r) => setTimeout(r, 150));
    const removedAura = !img.previousElementSibling?.classList.contains('aura-fx');
    const n0 = document.querySelectorAll('.aura-fx').length; row.remove(); await new Promise((r) => setTimeout(r, 150));
    return { removedAura, n0, n1: document.querySelectorAll('.aura-fx').length };
  });
  gone.removedAura ? ok('taking the aura off a picture removes its layer') : fail('layer stayed after data-aura was removed');
  gone.n1 <= gone.n0 ? ok('no stray layers after a card is removed') : fail('layers left behind');
  // moves with the picture when something above it grows
  const follow = await p.evaluate(async () => {
    const img = document.querySelector('#fx img[data-aura="orbit"]'), fx = img.previousElementSibling, pad = document.createElement('div'); pad.style.height = '40px'; document.querySelector('#fx').prepend(pad);
    await new Promise((r) => setTimeout(r, 1300)); const a = img.getBoundingClientRect(), f = fx.getBoundingClientRect(); return Math.abs(a.top - f.top) < 1.5 && Math.abs(a.left - f.left) < 1.5;
  });
  follow ? ok('the layer follows its picture when the page above it changes') : fail('layer did not follow its picture');
  errors.length ? fail('page errors ' + errors.join('; ')) : ok('no page errors');
  await b.close(); srv.close();
  if (failed) { console.error(`\n${failed} aura check(s) failed`); process.exit(1); }
  console.log('\nAll aura checks passed');
});
