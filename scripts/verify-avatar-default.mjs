// The saved default avatar ("mg_avatar") must only change from Settings (or Equip in the shop), never from picking an avatar for one game.
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const writes = [...src.matchAll(/localStorage\.setItem\("mg_avatar"/g)].length;
const helper = src.includes('const setDefaultAvatar = (id) => { try { localStorage.setItem("mg_avatar", id); }');
const calls = [...src.matchAll(/setDefaultAvatar\(/g)].length;
const errors = [];
if (!helper) errors.push('setDefaultAvatar helper is missing');
if (writes !== 2) errors.push(`expected 2 writes to mg_avatar (first-run validation + setDefaultAvatar), found ${writes}`);
if (calls !== 3) errors.push(`expected 3 setDefaultAvatar callers (shop Equip, Settings random via pickRandomAvatar, Settings pick), found ${calls}`);
if (errors.length) { console.error('Avatar default check failed:\n- ' + errors.join('\n- ')); process.exit(1); }
console.log('Avatar default check passed: only Settings and shop Equip change the saved default.');
