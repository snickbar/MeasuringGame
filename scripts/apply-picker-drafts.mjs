// Bakes choices copied from the in-game Object picker (Settings > Debug / Admin tools) into the game:
//   orientation -> anim/orient-data.js (ORIENT), entrance -> the MOTION table in anim/stack-anim.js.
// Usage: node scripts/apply-picker-drafts.mjs choices.json
import fs from 'node:fs';
import vm from 'node:vm';
import {ENTRY_KINDS} from '../anim/entry-styles.mjs';

const input = process.argv[2]; if (!input) throw Error('Provide the copied choices file.');
const data = JSON.parse(fs.readFileSync(input, 'utf8'));
if (!data || data.objectPickerChoices !== 1 || typeof data.drafts !== 'object') throw Error('That is not an Object picker export.');
const root = new URL('../', import.meta.url), read = p => fs.readFileSync(new URL(p, root), 'utf8');
let orientSource = read('anim/orient-data.js'), engine = read('anim/stack-anim.js');
const om = orientSource.match(/export const ORIENT = (\{[^\n]*\});/), mm = engine.match(/const MOTION = (\{[\s\S]*?\n\});/);
if (!om || !mm) throw Error('ORIENT or MOTION table not found.');
const orient = vm.runInNewContext('(' + om[1] + ')'), motions = vm.runInNewContext('(' + mm[1] + ')');
const LEAN = ['cw', 'ccw', 'none'];
let nO = 0, nM = 0;
for (const [id, d] of Object.entries(data.drafts)) {
  if (!/^[a-z0-9-]+$/.test(id)) throw Error('Bad object id: ' + id);
  if (d.orient) {
    const o = d.orient;
    if (![0, 90, 180, 270].includes(o.rot) || !LEAN.includes(o.leanL) || !LEAN.includes(o.leanR)) throw Error('Bad orientation for ' + id);
    orient[id] = { rot: o.rot, flip: !!o.flip, leanL: o.leanL, leanR: o.leanR, mirR: !!o.mirR }; nO++;
  }
  if (d.motion) {
    const ok = v => v === 'auto' || ENTRY_KINDS.includes(v);
    if (!ok(d.motion.small) || !ok(d.motion.big)) throw Error('Bad entrance for ' + id);
    const s = d.motion.small === 'auto' ? 'slide' : d.motion.small, b = d.motion.big === 'auto' ? 'slide' : d.motion.big;
    if (s === 'slide' && b === 'slide') delete motions[id]; else motions[id] = s === b ? s : { small: s, big: b };
    nM++;
  }
}
orientSource = orientSource.replace(om[0], () => 'export const ORIENT = ' + JSON.stringify(orient) + ';');
engine = engine.replace(mm[0], () => 'const MOTION = ' + JSON.stringify(motions, null, 2) + ';');
fs.writeFileSync(new URL('anim/orient-data.js', root), orientSource);
fs.writeFileSync(new URL('anim/stack-anim.js', root), engine);
console.log(`Applied ${nO} orientation and ${nM} entrance change(s).`);
