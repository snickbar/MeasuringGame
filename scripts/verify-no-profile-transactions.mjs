// Guard: whole-profile transactions froze saves, award claims and lobby creation ("maxretry"). Every profile transaction must go
// through the app's runTransaction wrapper, which turns it into a read + small update. Fail if anything bypasses it.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const direct = [...html.matchAll(/fbRunTransaction\(/g)];
assert.equal(direct.length, 1, 'only the runTransaction wrapper may call Firebase transactions directly (found ' + direct.length + ')');
assert.match(html, /\/\^profiles\\\/\[\^\/\]\+\$\/\.test\(r\.__path\)\) return changeProfile\(/, 'the wrapper must route whole-profile transactions to changeProfile');
assert.doesNotMatch(html, /fbRunTransaction\(fbRef\(db, *`profiles\/\$\{[a-zA-Z]+\}`\), *offlineProfile\.mergeInto/, 'offline merge must not use a transaction');
for (const f of fs.readdirSync(new URL('../anim/', import.meta.url)).filter(f => f.endsWith('.mjs'))) {
  const text = fs.readFileSync(new URL('../anim/' + f, import.meta.url), 'utf8');
  assert(!/firebase-database/.test(text) || !/runTransaction/.test(text), f + ' must not use Firebase transactions directly');
}
console.log('PASS: no code path sends a whole-profile transaction to Firebase.');
