// Standing check: every number keypad keeps the touch-down press, the tap sound, the buzz and the key/number glow.
const fs = require('fs');
const html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
const need = [
  ['team keypad touch-down', 'numpadEl.addEventListener("pointerdown"'],
  ['shared keypad touch-down (.dc-key, .hs-key)', 'const key = e.target.closest?.(".dc-key, .hs-key");'],
  ['feedback helper', 'function numpadFeedback(key, lightDisplay)'],
  ['buzz', 'vibrate(8);'],
  ['glow', 'brightness(1.3) drop-shadow'],
  ['team keys call feedback', 'numpadFeedback(key, true);'],
  ['team backspace calls feedback', 'numpadFeedback(key, false);'],
  ['shared keys call feedback', 'numpadFeedback(key, (key.dataset.k || key.dataset.hsKey) !== "back");'],
];
let bad = 0;
for (const [name, text] of need) if (!html.includes(text)) { console.log('MISSING: ' + name); bad++; }
// Any new keypad of a kind this check does not know about must be added to it.
const kinds = new Set([...html.matchAll(/class="(num-btn|dc-key|hs-key)"/g)].map(m => m[1]));
for (const k of kinds) console.log('ok   keypad kind covered: ' + k);
const other = [...html.matchAll(/<button[^>]*class="([^"]*(?:key|pad)[^"]*)"/g)].map(m => m[1].split(' ')[0]).filter(c => !['num-btn', 'dc-key', 'hs-key'].includes(c) && !c.startsWith('kbd-key') && !c.startsWith('hs-key'));
if (other.length) { console.log('NEW KEYPAD CLASS? ' + [...new Set(other)].join(', ') + ' - add the touch-down press and numpadFeedback to it'); bad++; }
console.log(bad ? 'Numpad feedback check FAILED' : 'Numpad feedback check passed');
process.exit(bad ? 1 : 0);
