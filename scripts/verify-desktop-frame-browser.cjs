// Wide windows (laptop/desktop browsers) show the real game inside a phone-shaped frame (the first script in index.html). In a real browser this checks:
//  - which windows get the frame and which never do (phones, portrait tablets, phones on their side, short windows, ?noframe)
//  - the game starts ONCE, inside the frame (the outer page holds only the frame, so there is one database connection per player, not two)
//  - inside the frame the game sees a phone-sized window, so every screen keeps its phone layout; the frame fits the window and stays at least 640 tall
//  - the shipped page (www/index.html, with its Content-Security-Policy) is allowed to frame itself (run npm run sync-www first)
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'); let failed = 0;
const fail = (m) => { failed++; console.error('FAIL', m); }, ok = (m) => console.log('ok  ', m), check = (c, m) => (c ? ok(m) : fail(m));
const types = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };
const serve = (dir) => new Promise((res) => { const s = http.createServer((q, r) => { let u = decodeURIComponent(q.url.split('?')[0]); if (u === '/') u = '/index.html'; const f = path.resolve(dir, '.' + u); try { r.setHeader('Content-Type', types[path.extname(f)] || 'application/octet-stream'); r.end(fs.readFileSync(f)); } catch { r.writeHead(404); r.end(); } }); s.listen(0, () => res(s)); });
// [width, height, query, expect framed, label]
const cases = [
  [1440, 900, '', true, 'laptop'], [1920, 1080, '', true, 'desktop'], [1366, 700, '', true, 'short laptop'], [1024, 768, '', true, 'tablet on its side'],
  [390, 844, '', false, 'phone'], [768, 1024, '', false, 'tablet upright'], [844, 390, '', false, 'phone on its side'], [1366, 600, '', false, 'very short window'],
  [1440, 900, '?noframe', false, 'laptop with ?noframe'], [390, 844, '?desktopframe=1', true, 'forced (for testing)'],
];
(async () => {
  const b = await chromium.launch();
  for (const [name, dir] of [['source', root], ['shipped', path.join(root, 'www')]]) {
    if (!fs.existsSync(path.join(dir, 'index.html'))) { console.log('skip', name, '(not built - run npm run sync-www)'); continue; }
    const srv = await serve(dir), origin = 'http://127.0.0.1:' + srv.address().port;
    for (const [w, h, query, want, label] of cases) {
      const tag = `${name} ${w}x${h} ${label}`, ctx = await b.newContext({ viewport: { width: w, height: h } }), p = await ctx.newPage(), problems = [];
      // act like a real browser (automated browsers are never framed unless asked to)
      await p.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });
      p.on('console', (m) => { if (/Content Security Policy|Refused to frame/i.test(m.text())) problems.push(m.text().slice(0, 100)); });
      await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
      await p.goto(`${origin}/${query}`, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(want ? 3500 : 2500);
      const top = await p.evaluate(() => { const f = document.getElementById('phone-frame'), r = f && f.getBoundingClientRect(); return { framed: !!f, kids: document.body.children.length, toolbar: !!document.getElementById('app-toolbar'), rect: r && { x: r.x, y: r.y, w: r.width, h: r.height }, ready: document.readyState }; });
      check(top.framed === want, `${tag}: ${want ? 'shows' : 'does not show'} the phone frame`);
      check(top.ready === 'complete', `${tag}: the page finishes loading`);
      if (want) {
        const inner = p.frames().find((f) => f !== p.mainFrame());
        const g = inner && await inner.evaluate(() => ({ toolbar: !!document.getElementById('app-toolbar'), w: innerWidth, h: innerHeight, home: !!document.querySelector('#home-art') })).catch(() => null);
        check(top.kids === 1 && !top.toolbar, `${tag}: the outer page holds only the frame (the game does not start twice)`);
        check(!!g && g.toolbar && g.home, `${tag}: the game starts inside the frame`);
        check(!!g && g.w >= 360 && g.w <= 430 && g.h >= 640, `${tag}: the game sees a phone-sized window (${g && g.w}x${g && g.h})`);
        const r = top.rect, midX = Math.abs(r.x + r.w / 2 - w / 2) < 1.5, fits = r.y >= -0.5 && r.y + r.h <= h + 0.5 && r.x >= -0.5 && r.x + r.w <= w + 0.5;
        check(midX && fits, `${tag}: the frame is centered and fits the window (${Math.round(r.w)}x${Math.round(r.h)} at ${Math.round(r.x)},${Math.round(r.y)})`);
      } else check(top.toolbar, `${tag}: the game starts normally in the window`);
      check(!problems.length, `${tag}: nothing blocked by the security policy${problems.length ? ' - ' + problems[0] : ''}`);
      await ctx.close();
    }
    srv.close();
  }
  await b.close();
  console.log(failed ? `\n${failed} desktop frame check(s) failed` : '\nAll desktop frame checks passed');
  process.exitCode = failed ? 1 : 0;
})();
