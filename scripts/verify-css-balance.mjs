// A missing "}" silently swallows every rule after it, so check each stylesheet's braces balance.
import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const files = fs.readdirSync(path.join(root, 'anim')).filter(f => f.endsWith('.css')).map(f => 'anim/' + f);
const bad = [];
for (const f of files) {
  const s = fs.readFileSync(path.join(root, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(["'])(?:\\.|(?!\1)[^\\\n])*\1/g, '""').replace(/url\([^)]*\)/g, 'url()');
  let d = 0, neg = false;
  for (const ch of s) { if (ch === '{') d++; else if (ch === '}') { d--; if (d < 0) neg = true; } }
  if (d !== 0 || neg) bad.push(f + ' (' + (d > 0 ? d + ' unclosed' : neg ? 'extra }' : d) + ')');
}
if (bad.length) { console.error('Unbalanced braces: ' + bad.join(', ')); process.exit(1); }
console.log('css braces balanced in ' + files.length + ' files');
