// Guard: player cards must keep wearing the player's equipped frame. Run after ANY change to card layout, borders, glows or
// player-card CSS. It checks (1) every card template still renders the frame, and (2) in a real browser the frame picture is
// drawn, visible and not covered or turned off by another rule, on every kind of card.
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'); let failed = 0;
const fail = (m) => { failed++; console.error('FAIL', m); }, ok = (m) => console.log('ok  ', m);

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const lines = html.split('\n');
const needs = [
  ['class="hs-pl${', ['hsFrameCls(', 'hsFrameArt(']],
  ['class="tw-qs-half', ['hsFrameCls(', 'hsFrameArt(']],
  ['class="hs-final-row', ['playerFrameArt(', 'frameEdgeHtml(']],
];
for (const [marker, calls] of needs) {
  const hits = lines.filter((l) => l.includes(marker) && l.includes('${'));
  if (!hits.length) { fail(`no template found for ${marker}`); continue; }
  const text = hits.join('\n') + lines.slice(0).join('\n').slice(0, 0);
  // the frame art may be on the next line or two of the same template
  let good = true;
  for (const l of hits) {
    const i = lines.indexOf(l), block = lines.slice(i, i + 4).join('\n');
    if (!calls.every((c) => block.includes(c))) good = false;
  }
  good ? ok(`${marker} template renders the frame`) : fail(`${marker} template no longer calls ${calls.join(' + ')}`);
}
{ const bl = fs.readFileSync(path.join(root, 'anim', 'bluff-ui.mjs'), 'utf8'), n = (bl.match(/customFrameEdge\(/g) || []).length, m = (bl.match(/customFrameClass\(/g) || []).length;
  n >= 3 && m >= 2 ? ok(`Bluff cards still draw the frame (${n} frame art, ${m} frame class)`) : fail(`Bluff card templates lost their frame (${n} frame art calls, ${m} frame class calls)`); }
for (const [name, re, min] of [['score cards', /showPlayerFrame\(box,/g, 2], ['lobby cards', /showPlayerFrame\(li,/g, 2]]) {
  const n = (html.match(re) || []).length; n >= min ? ok(`${name} still call showPlayerFrame (${n})`) : fail(`${name}: showPlayerFrame calls dropped to ${n}`);
}
// No stylesheet may switch the frame art off or hide it.
const css = [path.join(root, 'index.html'), ...fs.readdirSync(path.join(root, 'anim')).filter((f) => f.endsWith('.css')).map((f) => path.join(root, 'anim', f))];
for (const f of css) {
  const t = fs.readFileSync(f, 'utf8');
  for (const chunk of t.split('}')) {
    const i = chunk.lastIndexOf('{'); if (i < 0) continue;
    const sel = chunk.slice(Math.max(0, chunk.lastIndexOf('\n', i - 1)), i).trim(), body = chunk.slice(i + 1);
    if (!sel.includes('.player-frame-art') || sel.length > 300) continue;
    if (/display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?![.\d])|border-image\s*:\s*none/.test(body) && !/avatar|picker|\[hidden\]/.test(sel)) fail(`${path.basename(f)}: "${sel}" hides the frame art`);
  }
}

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png' };
const srv = http.createServer((q, r) => { let f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0, async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 392, height: 830 } });
  await p.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
  await p.goto(`http://localhost:${srv.address().port}/index.html`, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000);
  const res = await p.evaluate(() => {
    const out = []; const art = '<span class="player-frame-art" style="--player-frame-art:url(' + location.origin + '/anim/player-frames/equipped-1.png)"></span>';
    document.querySelectorAll('.screen.active').forEach((e) => e.classList.remove('active'));
    const hud = document.getElementById('hud'); hud.classList.add('active'); hud.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#fff;display:block';
    const qv = document.getElementById('question-view'); qv.classList.add('active', 'tw-mode'); qv.style.display = 'block';
    const lobbyScreen = document.getElementById('lobby-screen'), lobbyList = document.getElementById('player-list');
    lobbyScreen.style.cssText = 'position:fixed;left:0;top:0;width:392px;z-index:99999;display:block'; lobbyList.style.display = 'block';
    const bluffScreen = document.getElementById('bluff-screen'), bluffContent = document.getElementById('bluff-content'), finalScreen = document.getElementById('final-screen'), finalList = document.getElementById('final-list');
    if (bluffScreen) bluffScreen.style.cssText = 'position:fixed;left:0;top:0;width:392px;z-index:99999;display:block';
    if (finalScreen) { finalScreen.classList.add('bluff-final'); finalScreen.style.cssText = 'position:fixed;left:0;top:0;width:392px;z-index:99999;display:block'; }
    const cases = [
      ['High Stakes card', '<div class="hs-pl player-frame-host">X' + art + '</div>', hud],
      ['High Stakes card, your turn', '<div class="hs-pl turn player-frame-host">X' + art + '</div>', hud],
      ['High/Low player card', '<div class="tw-qs-half player-frame-host hl-mine hl-mine-high">X' + art + '</div>', qv],
      ['Score card', '<div class="score-card player-frame-host">X' + art + '</div>', hud],
      ['High Stakes final row', '<div class="hs-final-row player-frame-host">X' + art + '</div>', hud],
      ['Lobby card', '<li class="lobby-player-card player-frame-host">X' + art + '</li>', lobbyList],
      ['Bluff player card', '<div class="hs-pl bl-player bl-custom-frame player-frame-host">X' + art + '</div>', bluffContent],
      ['Bluff player card, your turn', '<div class="hs-pl bl-player bl-custom-frame turn player-frame-host">X' + art + '</div>', bluffContent],
      ['Bluff standings row', '<div class="hs-srow bl-standing bl-custom-frame player-frame-host">X' + art + '</div>', bluffContent],
      ['Bluff final card', '<ul style="margin:0;padding:0;list-style:none"><li class="final-row bl-final-card bl-custom-frame player-frame-host">X' + art + '</li></ul>', finalList],
    ];
    for (const [name, markup, parent] of cases) {
      const box = document.createElement('div'); box.style.cssText = 'width:150px;height:110px;margin:6px;position:relative'; box.innerHTML = markup; parent.appendChild(box);
      const host = box.querySelector('.player-frame-host'), a = box.querySelector('.player-frame-art'), cs = getComputedStyle(a), hr = host.getBoundingClientRect(), ar = a.getBoundingClientRect();
      out.push({ name, display: cs.display, visibility: cs.visibility, opacity: cs.opacity, pos: cs.position, img: cs.borderImageSource, edge: cs.borderTopWidth,
        covers: ar.width >= hr.width - 6 && ar.height >= hr.height - 6, dbg: [hr.width, hr.height, ar.width, ar.height].map(Math.round).join('x'), hostPos: getComputedStyle(host).position, z: cs.zIndex });
    }
    return out;
  });
  for (const r of res) {
    const bad = [];
    if (r.display === 'none') bad.push('display:none'); if (r.visibility !== 'visible') bad.push('hidden'); if (+r.opacity < 1) bad.push('faded');
    if (r.pos !== 'absolute') bad.push('not positioned over the card'); if (!/url\(/.test(r.img)) bad.push('no frame picture (border-image lost)');
    if (!(parseFloat(r.edge) > 0)) bad.push('zero-width border'); if (!r.covers) bad.push('does not cover the card ' + r.dbg); if (r.hostPos === 'static') bad.push('card is not a positioning parent');
    bad.length ? fail(`${r.name}: ${bad.join(', ')}`) : ok(`${r.name}: frame drawn`);
  }
  await b.close(); srv.close(); console.log(failed ? `\n${failed} frame check(s) FAILED` : '\nAll frame checks passed'); process.exit(failed ? 1 : 0);
});
