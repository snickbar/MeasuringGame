// Every tracked file must be checkout-able on Windows: no ? " < > | * : in any name (a stray file named after a snippet of
// script once made `git pull` fail there).
import { execFileSync } from 'node:child_process';
const bad = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter((f) => /[?"<>|*:]/.test(f));
if (bad.length) { console.error('Tracked files Windows cannot check out:\n' + bad.map((f) => '  ' + JSON.stringify(f)).join('\n')); process.exit(1); }
console.log('Windows-safe file names: every tracked file can be checked out on Windows.');
