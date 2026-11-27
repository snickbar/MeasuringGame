// The name box on the name/avatar screen (the page before almost every game mode), in a real browser with the real stylesheets, the real markup and the real keyboard code from index.html
// (the rest of the app is stubbed; the app itself needs Firebase):
//  - no "Your name" label; an "Edit name" button sits under the name box
//  - the keyboard is hidden until Edit name is tapped; while it is out the button says "Save name"
//  - typing works, Save name hides the keyboard again and the button goes back to "Edit name"
//  - an empty or blocked name cannot be saved (the keyboard stays and a message shows)
//  - the button and the name box stay fully on screen on small phones
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'); let failed = 0;
const fail = (m) => { failed++; console.error('FAIL', m); }, ok = (m) => console.log('ok  ', m), check = (c, m) => (c ? ok(m) : fail(m));
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const between = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('marker not found: ' + a); return src.slice(i, j); };
const inlineCss = src.match(/<style>([\s\S]*?)<\/style>/)[1];
const links = [...src.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);
const markup = between('<div id="name-avatar-screen"', '<div id="lobby-screen"').replace('<div id="name-avatar-screen" class="screen">', '<div id="name-avatar-screen" class="screen active">');
const code = [between('  function renderCustomKeyboard(', '  const lobbyScreenEl'), between('  // The keyboard stays tucked away', '\n  // One-tap shortcut')].join('\n');
const js = `
const nameInput = document.getElementById('name-input'), nameKeyboardEl = document.getElementById('name-keyboard'), nameAvatarStatusEl = document.getElementById('name-avatar-status');
const settingsNameInput = { value: '' }; let currentName = '';
const checkName = (n) => (/bad/i.test(n) ? 'That name is not allowed.' : '');
nameInput.addEventListener('input', () => { const bad = checkName(nameInput.value); nameAvatarStatusEl.textContent = bad || ''; if (bad) return; currentName = nameInput.value; });
${code}
renderCustomKeyboard(nameKeyboardEl, nameInput, { maxLength: 12, charset: null, caps: true });
window.T = { setNameKeyboardOpen, saved: () => currentName, savedLocal: () => localStorage.getItem('mg_name') };`;
const page = `<!doctype html><html><head><meta charset="utf8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="/">${links.map((l) => `<link rel="stylesheet" href="${l}">`).join('')}<style>${inlineCss}</style></head><body>${markup}<script type="module">${js}</script></body></html>`;
const types = { '.webp': 'image/webp', '.css': 'text/css', '.png': 'image/png', '.mjs': 'text/javascript', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { if (q.url.startsWith('/__t')) { r.setHeader('Content-Type', 'text/html'); return r.end(page); } const f = path.resolve(root, '.' + decodeURIComponent(q.url.split('?')[0])); try { r.setHeader('Content-Type', types[path.extname(f)] || 'application/octet-stream'); r.end(fs.readFileSync(f)); } catch { r.writeHead(404); r.end(); } });
srv.listen(0, async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[360, 640], [390, 780], [412, 915], [320, 568]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } }), tag = `${w}x${h}`, errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(`http://127.0.0.1:${srv.address().port}/__t`);
    try { await p.waitForFunction(() => window.T, null, { timeout: 5000 }); } catch (e) { fail(`${tag}: page did not start: ${errors[0]}`); continue; }
    const shown = (sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== 'none'; }, sel);
    const text = () => p.locator('#name-edit-btn').innerText();
    const tap = async (sel) => { const r = await p.locator(sel).first().boundingBox(); await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2); await p.waitForTimeout(60); };
    check(await p.evaluate(() => !document.querySelector('#name-avatar-screen .settings-profile-name label') && !/Your name/.test(document.querySelector('#name-avatar-screen .settings-profile-name').innerText)), `${tag}: no "Your name" text above the box`);
    const lay = await p.evaluate(() => { const i = document.getElementById('name-input').getBoundingClientRect(), bt = document.getElementById('name-edit-btn').getBoundingClientRect(); return { under: bt.top >= i.bottom - 1, onscreen: bt.bottom <= innerHeight && bt.left >= 0 && bt.right <= innerWidth && i.left >= 0 && i.right <= innerWidth, tall: Math.round(bt.height), inputTop: Math.round(i.top) }; });
    check(lay.under, `${tag}: the Edit name button sits under the name box`);
    check(lay.onscreen, `${tag}: the name box and button are fully on screen`);
    check(lay.tall >= 32, `${tag}: the button is a comfortable tap target (${lay.tall}px tall)`);
    check((await text()) === 'Edit name' && !(await shown('#name-keyboard')), `${tag}: starts with the keyboard hidden and the button saying Edit name`);
    await tap('#name-edit-btn');
    check((await text()) === 'Save name' && (await shown('#name-keyboard')), `${tag}: Edit name opens the keyboard and the button says Save name`);
    await tap('#name-keyboard [data-key="B"]'); await tap('#name-keyboard [data-key="O"]'); await tap('#name-keyboard [data-key="B"]');
    check((await p.inputValue('#name-input')) === 'BOB', `${tag}: the keyboard types into the name box`);
    await tap('#name-edit-btn');
    check((await text()) === 'Edit name' && !(await shown('#name-keyboard')), `${tag}: Save name hides the keyboard and the button says Edit name again`);
    check((await p.evaluate(() => window.T.saved())) === 'BOB' && (await p.evaluate(() => window.T.savedLocal())) === 'BOB', `${tag}: the name is kept`);
    await tap('#name-edit-btn');
    for (let i = 0; i < 3; i++) await tap('#name-keyboard [data-action="backspace"]');
    await tap('#name-edit-btn');
    check((await shown('#name-keyboard')) && (await text()) === 'Save name' && /name/i.test(await p.innerText('#name-avatar-status')), `${tag}: an empty name cannot be saved (keyboard stays, message shown)`);
    await tap('#name-keyboard [data-key="B"]'); await tap('#name-keyboard [data-key="A"]'); await tap('#name-keyboard [data-key="D"]');
    await tap('#name-edit-btn');
    check((await shown('#name-keyboard')) && /not allowed/.test(await p.innerText('#name-avatar-status')), `${tag}: a blocked name cannot be saved`);
    await p.evaluate(() => window.T.setNameKeyboardOpen(false));
    check((await text()) === 'Edit name' && !(await shown('#name-keyboard')), `${tag}: leaving and returning resets to the hidden keyboard`);
    check(!errors.length, `${tag}: no page errors${errors.length ? ' - ' + errors[0] : ''}`);
    await p.close();
  }
  await b.close(); srv.close();
  console.log(failed ? `\n${failed} name edit check(s) failed` : '\nAll name edit checks passed');
  process.exitCode = failed ? 1 : 0;
});
