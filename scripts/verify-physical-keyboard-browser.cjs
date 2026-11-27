// Typing on a real keyboard (laptops / desktops), in a real browser with the real stylesheets, real markup and the real keypad code from index.html
// (the rest of the app is stubbed; the app itself needs Firebase). A physical key must press the same on-screen key a finger would:
//  - main number pad (#numpad): digits and "." type, Backspace deletes, Enter = Lock it in (only when it is enabled)
//  - the shared .dc-key pads (every other mode): digits/Backspace go through the real touch-down handler (tap sound + glow), Enter = Lock it in
//  - the name keyboard: letters and digits type, Backspace deletes, Enter = Save name (blocked names still cannot be saved)
//  - keys do nothing when the pad is covered by a popup, hidden, disabled, or a real text field has focus; Space never presses a focused key
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'); let failed = 0;
const fail = (m) => { failed++; console.error('FAIL', m); }, ok = (m) => console.log('ok  ', m), check = (c, m) => (c ? ok(m) : fail(m));
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const between = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('marker not found: ' + a); return src.slice(i, j); };
const inlineCss = src.match(/<style>([\s\S]*?)<\/style>/)[1];
const links = [...src.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);

// --- real pieces ---
const numpadMarkup = between('<div id="numpad">', '<div id="hl-role-hint"');           // the 12 keys
const nameMarkup = between('<div id="name-avatar-screen"', '<div id="lobby-screen"').replace('<div id="name-avatar-screen" class="screen">', '<div id="name-avatar-screen" class="screen active">');
const numpadCode = between('  function pressNumpadKey(', '  numpadEl.addEventListener("click"');          // press/backspace/feedback + both touch-down handlers + swallow
const keypadKeys = between('  const KEYPAD_KEYS', '\n').trim();
const kpKeys = between('  function kpKeysHtml()', '  function kpApply');
const kbCode = [between('  function renderCustomKeyboard(', '  const lobbyScreenEl'), between('  // The keyboard stays tucked away', '\n  // One-tap shortcut')].join('\n');

const stubs = `
const log = { sounds: 0, buzz: 0, glow: 0 };
const playSound = () => { log.sounds++; }; const vibrate = () => { log.buzz++; }; const prefersReducedMotion = () => false;
let guessLocked = false; const roomState = { paused: false, settings: { mode: 'highlow' } }; let currentGuessStr = '';
const guessDisplayEl = document.getElementById('guess-display') || document.createElement('div'), twGuessDisplayEl = document.createElement('div');
const renderGuessDisplay = () => { guessDisplayEl.textContent = currentGuessStr === '' ? '0' : currentGuessStr; };
const origAnimate = Element.prototype.animate; Element.prototype.animate = function () { log.glow++; return origAnimate.apply(this, arguments); };
window.T = { log, guess: () => currentGuessStr, setLocked: (v) => { guessLocked = v; } };`;

const scenes = {
  // the main number pad (High/Low style) with its Lock it in button
  numpad: () => ({
    body: `<div id="guess-display" class="answer-slot"></div>${numpadMarkup}<button id="submit-guess-btn" class="">Lock it in</button><div id="cover" style="display:none;position:fixed;inset:0;background:#000a;z-index:9999"></div>`,
    js: `${stubs}
const numpadEl = document.getElementById('numpad');
${numpadCode}
numpadEl.addEventListener('click', (e) => { if (performance.now() - numpadPressAt < 700) return; const key = e.target.closest('.num-btn, #backspace-btn'); if (!key) return; if (key.id === 'backspace-btn') pressBackspace(key); else pressNumpadKey(key); });
window.T.locks = 0; document.getElementById('submit-guess-btn').addEventListener('click', () => { window.T.locks++; });
installPhysicalKeyboard();`,
  }),
  // the shared .dc-key pad every other mode uses, with its own Lock it in
  dc: () => ({
    body: `<div id="dc-display" class="dc-display">0</div><div id="dc-pad"></div><div class="pin-bottom"><button type="button" class="dc-btn" id="dc-submit" disabled>Lock it in</button></div><div id="cover" style="display:none;position:fixed;inset:0;background:#000a;z-index:9999"></div>`,
    js: `${stubs}
const numpadEl = document.createElement('div'); const guessDisplayEl2 = null;
${keypadKeys}
${kpKeys}
${between('  // Brightness-only glow', '  // Keys fire the moment')}
${between('  let dcPressAt = 0;', '  installPhysicalKeyboard();')}
document.getElementById('dc-pad').innerHTML = kpKeysHtml();
let typed = ''; window.T.typed = () => typed; window.T.locks = 0;
document.getElementById('dc-pad').addEventListener('click', (e) => { const k = e.target.closest('.dc-key'); if (!k) return; const v = k.dataset.k; typed = v === 'back' ? typed.slice(0, -1) : (v === '.' && typed.includes('.') ? typed : typed + v); document.getElementById('dc-display').textContent = typed || '0'; document.getElementById('dc-submit').disabled = !(parseFloat(typed) > 0); });
document.getElementById('dc-submit').addEventListener('click', () => { window.T.locks++; });
installPhysicalKeyboard();`,
  }),
  // the name keyboard on the name/avatar screen
  name: () => ({
    body: nameMarkup + `<div id="cover" style="display:none;position:fixed;inset:0;background:#000a;z-index:9999"></div>`,
    js: `${stubs}
const nameInput = document.getElementById('name-input'), nameKeyboardEl = document.getElementById('name-keyboard'), nameAvatarStatusEl = document.getElementById('name-avatar-status');
const settingsNameInput = { value: '' }; let currentName = '';
const checkName = (n) => (/bad/i.test(n) ? 'That name is not allowed.' : '');
nameInput.addEventListener('input', () => { const bad = checkName(nameInput.value); nameAvatarStatusEl.textContent = bad || ''; if (bad) return; currentName = nameInput.value; });
${kbCode}
renderCustomKeyboard(nameKeyboardEl, nameInput, { maxLength: 12, charset: null, caps: true });
window.T.saved = () => currentName; window.T.setOpen = setNameKeyboardOpen;
installPhysicalKeyboard();`,
  }),
};
const pageFor = (s) => { const { body, js } = scenes[s](); return `<!doctype html><html><head><meta charset="utf8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="/">${links.map((l) => `<link rel="stylesheet" href="${l}">`).join('')}<style>${inlineCss}</style></head><body>${body}<script type="module">import { installPhysicalKeyboard } from '/anim/physical-keyboard.mjs';\n${js}</script></body></html>`; };
const types = { '.webp': 'image/webp', '.css': 'text/css', '.png': 'image/png', '.mjs': 'text/javascript', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => {
  const m = q.url.match(/^\/__t\/(\w+)/); if (m) { r.setHeader('Content-Type', 'text/html'); return r.end(pageFor(m[1])); }
  const f = path.resolve(root, '.' + decodeURIComponent(q.url.split('?')[0]));
  try { r.setHeader('Content-Type', types[path.extname(f)] || 'application/octet-stream'); r.end(fs.readFileSync(f)); } catch { r.writeHead(404); r.end(); }
});
srv.listen(0, async () => {
  const b = await chromium.launch();
  const open = async (scene, w, h) => {
    const p = await b.newPage({ viewport: { width: w, height: h } }); p.errors = [];
    p.on('pageerror', (e) => p.errors.push(e.message));
    await p.goto(`http://127.0.0.1:${srv.address().port}/__t/${scene}`);
    await p.waitForFunction(() => window.T, null, { timeout: 5000 }).catch(() => fail(`${scene}: page did not start: ${p.errors[0]}`));
    return p;
  };
  const type = async (p, keys) => { for (const k of keys) { await p.keyboard.press(k); await p.waitForTimeout(25); } };
  for (const [w, h] of [[360, 640], [412, 915]]) {
    // ---- main number pad ----
    let p = await open('numpad', w, h), tag = `numpad ${w}x${h}`;
    await type(p, ['1', '2', '.', '5']);
    check((await p.evaluate(() => window.T.guess())) === '12.5', `${tag}: digits and the decimal point type into the answer`);
    await type(p, ['Backspace']);
    check((await p.evaluate(() => window.T.guess())) === '12.', `${tag}: Backspace deletes the last key`);
    let log = await p.evaluate(() => window.T.log);
    check(log.sounds === 5 && log.buzz === 5 && log.glow >= 5, `${tag}: every typed key gives the tap sound, the buzz and the glow like a touch (${log.sounds}/${log.buzz}/${log.glow})`);
    await p.keyboard.down('7'); await p.keyboard.down('7'); await p.keyboard.down('7'); await p.keyboard.up('7');
    check((await p.evaluate(() => window.T.guess())) === '12.7', `${tag}: holding a digit down types it once`);
    await type(p, ['a', '!', 'Control+5', 'Meta+3', 'Alt+4']);
    check((await p.evaluate(() => window.T.guess())) === '12.7', `${tag}: letters, symbols and Ctrl/Alt/Meta shortcuts do nothing`);
    await type(p, ['Enter']);
    check((await p.evaluate(() => window.T.locks)) === 1, `${tag}: Enter presses Lock it in`);
    await p.evaluate(() => { document.getElementById('submit-guess-btn').disabled = true; });
    await type(p, ['Enter']);
    check((await p.evaluate(() => window.T.locks)) === 1, `${tag}: Enter does nothing while Lock it in is disabled`);
    await p.evaluate(() => { document.getElementById('submit-guess-btn').disabled = false; window.T.setLocked(true); });
    await type(p, ['4']);
    check((await p.evaluate(() => window.T.guess())) === '12.7', `${tag}: no typing after the answer is locked`);
    await p.evaluate(() => { window.T.setLocked(false); document.getElementById('cover').style.display = 'block'; });
    await type(p, ['4', 'Enter']);
    check((await p.evaluate(() => window.T.guess())) === '12.7' && (await p.evaluate(() => window.T.locks)) === 1, `${tag}: keys are ignored while a popup covers the pad`);
    await p.evaluate(() => { document.getElementById('cover').style.display = 'none'; document.getElementById('numpad').hidden = true; document.getElementById('numpad').style.display = 'none'; });
    await type(p, ['4']);
    check((await p.evaluate(() => window.T.guess())) === '12.7', `${tag}: keys are ignored while the pad is hidden`);
    await p.evaluate(() => { document.getElementById('numpad').style.display = ''; document.getElementById('numpad').hidden = false; });
    // Space on a key you clicked with the mouse must not press it again
    const r = await p.locator('#numpad .num-btn[data-val="3"]').boundingBox(); await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2); await p.waitForTimeout(800);
    const before = await p.evaluate(() => window.T.guess());
    await type(p, [' ', 'Enter']);
    check(before === '12.73' && (await p.evaluate(() => window.T.guess())) === before, `${tag}: Space on a clicked key does not press it again`);
    check(!p.errors.length, `${tag}: no page errors${p.errors.length ? ' - ' + p.errors[0] : ''}`);
    await p.close();

    // ---- shared .dc-key pad ----
    p = await open('dc', w, h); tag = `dc pad ${w}x${h}`;
    await type(p, ['Enter']);
    check((await p.evaluate(() => window.T.locks)) === 0, `${tag}: Enter does nothing while Lock it in is disabled`);
    await type(p, ['4', '0', '.', '.', '5', 'Backspace', '5', '2']);
    check((await p.evaluate(() => window.T.typed())) === '40.52', `${tag}: digits, one decimal point and Backspace type into the answer`);
    log = await p.evaluate(() => window.T.log);
    check(log.sounds === 8 && log.buzz === 8 && log.glow >= 8, `${tag}: every typed key goes through the touch-down handler (sound/buzz/glow ${log.sounds}/${log.buzz}/${log.glow})`);
    await type(p, ['Enter']);
    check((await p.evaluate(() => window.T.locks)) === 1, `${tag}: Enter presses Lock it in`);
    await p.evaluate(() => { document.getElementById('cover').style.display = 'block'; });
    await type(p, ['9', 'Enter']);
    check((await p.evaluate(() => window.T.typed())) === '40.52' && (await p.evaluate(() => window.T.locks)) === 1, `${tag}: keys are ignored while a popup covers the pad`);
    await p.evaluate(() => { document.getElementById('cover').style.display = 'none'; });
    const k = await p.locator('.dc-key[data-k="1"]').boundingBox(); await p.mouse.click(k.x + k.width / 2, k.y + k.height / 2); await p.waitForTimeout(800);
    await type(p, [' ']);
    check((await p.evaluate(() => window.T.typed())) === '40.521', `${tag}: Space on a clicked key does not press it again`);
    check(!p.errors.length, `${tag}: no page errors${p.errors.length ? ' - ' + p.errors[0] : ''}`);
    await p.close();

    // ---- name keyboard ----
    p = await open('name', w, h); tag = `name ${w}x${h}`;
    await type(p, ['b']);
    check((await p.inputValue('#name-input')) === '', `${tag}: typing does nothing while the keyboard is tucked away`);
    await type(p, ['Enter']);
    check((await p.locator('#name-edit-btn').innerText()) === 'Edit name', `${tag}: Enter does not open the keyboard by itself`);
    const e = await p.locator('#name-edit-btn').boundingBox(); await p.mouse.click(e.x + e.width / 2, e.y + e.height / 2); await p.waitForTimeout(80);
    await type(p, ['b', 'o', 'B', '7', '!']);
    check((await p.inputValue('#name-input')) === 'BOB7', `${tag}: letters and digits type (symbols are not on the keyboard)`);
    await type(p, ['Backspace']);
    check((await p.inputValue('#name-input')) === 'BOB', `${tag}: Backspace deletes`);
    await p.evaluate(() => document.activeElement && document.activeElement.blur());   // like a touch screen: nothing focused
    await type(p, ['Enter']);
    check((await p.locator('#name-edit-btn').innerText()) === 'Edit name' && (await p.evaluate(() => window.T.saved())) === 'BOB', `${tag}: Enter saves the name and tucks the keyboard away`);
    await p.mouse.click(e.x + e.width / 2, e.y + e.height / 2); await p.waitForTimeout(80);
    await p.evaluate(() => document.activeElement && document.activeElement.blur());
    await type(p, ['Backspace', 'Backspace', 'Backspace', 'Enter']);
    check((await p.locator('#name-edit-btn').innerText()) === 'Save name' && /name/i.test(await p.innerText('#name-avatar-status')), `${tag}: Enter on an empty name keeps the keyboard and shows the message`);
    await type(p, ['b', 'a', 'd', 'Enter']);
    check((await p.locator('#name-edit-btn').innerText()) === 'Save name' && /not allowed/.test(await p.innerText('#name-avatar-status')), `${tag}: Enter on a blocked name cannot save it`);
    await p.evaluate(() => { document.getElementById('cover').style.display = 'block'; });
    await type(p, ['x']);
    check(!/X/.test(await p.inputValue('#name-input')), `${tag}: keys are ignored while a popup covers the keyboard`);
    check(!p.errors.length, `${tag}: no page errors${p.errors.length ? ' - ' + p.errors[0] : ''}`);
    await p.close();
  }

  // a real text field keeps its own typing
  const p = await open('numpad', 360, 640);
  await p.evaluate(() => { const i = document.createElement('input'); i.id = 'free'; i.style.cssText = 'position:fixed;top:0;left:0;z-index:5'; document.body.appendChild(i); i.focus(); });
  await type(p, ['1', '2', 'Enter']);
  check((await p.inputValue('#free')) === '12' && (await p.evaluate(() => window.T.guess())) === '' && (await p.evaluate(() => window.T.locks)) === 0, 'a focused text field gets its own typing (the pad is not pressed)');
  await p.close();
  await b.close(); srv.close();
  console.log(failed ? `\n${failed} physical keyboard check(s) failed` : '\nAll physical keyboard checks passed');
  process.exitCode = failed ? 1 : 0;
});
