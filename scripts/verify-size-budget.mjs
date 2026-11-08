// The package a phone downloads for every update is about 225 MB, nearly all of it pictures. This keeps that from growing without
// anyone choosing it. scripts/size-budget.json records what is accepted today:
//   - the package total and the game page's size,
//   - every picture over 600 KB (each may not grow more than 5%).
// A new picture over 600 KB, a bigger one, or a package more than 2% over the record fails. If the growth is wanted (new art), run
//   node scripts/verify-size-budget.mjs --update
// and commit the new record; if it is a stray full-size export, store it at the size it is drawn instead (see scripts/shrink-home-critters.py).
// Shrinking never fails: --update after a shrink lowers the record so it cannot creep back up.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const { list } = createRequire(import.meta.url)('./production-files.cjs');
const recordFile = fileURLToPath(new URL('./size-budget.json', import.meta.url));
const LARGE = 600 * 1024;

const files = list().map(path => ({ path, size: fs.statSync(path).size }));
const now = {
  total: files.reduce((sum, f) => sum + f.size, 0),
  page: fs.statSync('index.html').size,
  large: Object.fromEntries(files.filter(f => /\.(png|webp|jpe?g|gif)$/.test(f.path) && f.size > LARGE).sort((a, b) => a.path.localeCompare(b.path)).map(f => [f.path, f.size])),
};
if (process.argv.includes('--update')) {
  fs.writeFileSync(recordFile, JSON.stringify(now, null, 1) + '\n');
  console.log(`Recorded ${(now.total / 1048576).toFixed(1)} MB, ${Object.keys(now.large).length} pictures over 600 KB.`);
  process.exit(0);
}
const record = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
const mb = n => (n / 1048576).toFixed(1) + ' MB';
const fix = ' If the growth is wanted, run `node scripts/verify-size-budget.mjs --update` and commit scripts/size-budget.json.';
assert(now.total <= record.total * 1.02, `The package is ${mb(now.total)}, over the recorded ${mb(record.total)} by more than 2%. Every phone downloads the whole package on each update.` + fix);
assert(now.page <= record.page * 1.05, `index.html is ${mb(now.page)}, over the recorded ${mb(record.page)} by more than 5%; the phone reads all of it before the game starts.` + fix);
for (const [path, size] of Object.entries(now.large)) {
  assert(record.large[path] !== undefined, `New picture over 600 KB: ${path} (${Math.round(size / 1024)} KB). Store it at the size it is drawn (about 3x its on-screen pixels for sharp phones) rather than the full export.` + fix);
  assert(size <= record.large[path] * 1.05, `${path} grew from ${Math.round(record.large[path] / 1024)} KB to ${Math.round(size / 1024)} KB.` + fix);
}
console.log(`Size budget: package ${mb(now.total)} (record ${mb(record.total)}), page ${mb(now.page)}, ${Object.keys(now.large).length} pictures over 600 KB, none new or grown.`);
