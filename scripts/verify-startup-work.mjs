// Work that must not happen while the app loads. Home cannot show until the page has finished loading, and a slow phone takes
// several times longer than a computer over every millisecond of it, so something expensive is paid for where it is first used.
//
// The first Intl.NumberFormat in a page loads the locale data: about 12 ms here, about 50 ms at 4x slower. It used to be built
// at the top of two files, so every launch paid it, for the High Stakes betting mode, before Home appeared.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 1. Loading the High Stakes rules builds no formatter; the first answer shown builds one, and later ones reuse it.
let built = 0;
const RealNumberFormat = Intl.NumberFormat;
Intl.NumberFormat = new Proxy(RealNumberFormat, { construct(target, args, newTarget) { built++; return Reflect.construct(target, args, newTarget); } });
const { hsFormatAnswer } = await import('../anim/high-stakes.mjs');
assert.equal(built, 0, 'Loading anim/high-stakes.mjs must not build an Intl.NumberFormat');
assert.equal(hsFormatAnswer(1234.5), '1,234.50', 'Answers are still shown with a comma and two decimals');
assert.equal(built, 1, 'The first answer shown builds the formatter');
assert.equal(hsFormatAnswer(0.456), '0.46');
assert.equal(hsFormatAnswer(Infinity), '0.00', 'A number that is not finite is still shown as 0.00');
assert.equal(built, 1, 'Later answers reuse it');
Intl.NumberFormat = RealNumberFormat;

// 2. No file builds a formatter as it loads. A statement at the top of a module that is just `const x = new Intl...` runs on
// every launch; inside a function it runs when that function is called. (The page's own module is indented two spaces.)
const topLevel = (source, indent, firstLine = 1) => {
  const found = [];
  const pattern = new RegExp(`^${indent}(?:export\\s+)?(?:const|let|var)\\s+[\\w$]+\\s*=\\s*new\\s+Intl\\.`);
  source.split('\n').forEach((line, i) => { if (pattern.test(line)) found.push(`line ${firstLine + i}: ${line.trim().slice(0, 90)}`); });
  return found;
};
const offenders = [];
for (const name of fs.readdirSync(path.join(root, 'anim')).filter(n => n.endsWith('.mjs'))) {
  for (const hit of topLevel(fs.readFileSync(path.join(root, 'anim', name), 'utf8'), '')) offenders.push(`anim/${name} ${hit}`);
}
const page = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
const moduleStart = page.lastIndexOf('<script type="module">');
assert(moduleStart > 0, 'index.html has its inline module');
for (const hit of topLevel(page.slice(moduleStart), '  ', page.slice(0, moduleStart).split('\n').length)) offenders.push(`index.html ${hit}`);
assert.deepEqual(offenders, [], 'These build an Intl formatter every time the game loads; build it when first used instead:\n' + offenders.join('\n'));

console.log('Startup work: High Stakes builds its number formatter on first use (not at load), and no file builds an Intl formatter as it loads.');
