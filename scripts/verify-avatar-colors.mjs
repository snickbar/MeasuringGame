// Avatar colours are painted on the phone from masks (anim/avatar-colors.mjs). Every avatar must have its recolor data and a
// mask cell, and painting must really move the colour to the chosen hue. Rebuild the data with: python scripts/build-avatar-colors.py
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { AVATAR_COLOR_DATA, COLOR_MASK_CELL, COLOR_MASK_COLS } from '../anim/avatar-colors-data.mjs';
import { COLOR_SHADES, recolorPixels } from '../anim/avatar-colors.mjs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const tiers = html.slice(html.indexOf('const AVATAR_TIERS'));
const ids = [...tiers.slice(0, tiers.indexOf('};')).matchAll(/(av\d+):\s*"/g)].map((m) => m[1]);
assert.ok(ids.length > 300, 'could not read the avatar list');
const missing = ids.filter((id) => !AVATAR_COLOR_DATA[id]);
assert.deepEqual(missing, [], `avatars without colour data (run scripts/build-avatar-colors.py): ${missing.join(', ')}`);
const stray = Object.keys(AVATAR_COLOR_DATA).filter((id) => !ids.includes(id));
assert.deepEqual(stray, [], `colour data for avatars that do not exist: ${stray.join(', ')}`);
for (const [id, data] of Object.entries(AVATAR_COLOR_DATA)) {
  const [layers, shades] = data.split('|');
  const list = layers.split(',');
  assert.ok(list.length >= 1 && list.length <= 2 && list.every((l) => /^[hbfwgkcGtF]\d*$/.test(l)), `${id}: bad layers "${layers}"`);
  assert.ok(shades.length >= 3 && new Set(shades).size === shades.length && [...shades].every((s) => COLOR_SHADES[s]), `${id}: bad colours "${shades}"`);
}
const png = readFileSync(new URL('../anim/avatar-color-masks.png', import.meta.url));
const w = png.readUInt32BE(16), h = png.readUInt32BE(20), n = Object.keys(AVATAR_COLOR_DATA).length;
assert.equal(w, COLOR_MASK_COLS * COLOR_MASK_CELL, 'mask sheet width');
assert.equal(h, Math.ceil(n / COLOR_MASK_COLS) * COLOR_MASK_CELL, 'mask sheet height');
// Painting: a clothes-coloured (orange) pixel under a hue layer must come out at the chosen hue; a pixel outside the mask must not change.
const px = new Uint8ClampedArray([230, 120, 40, 255, 10, 200, 90, 255]);
recolorPixels(px, [Float32Array.of(1, 0)], [{ kind: 'h', cen: 24 }], 215);
const hue = (r, g, b) => { const mx = Math.max(r, g, b), d = mx - Math.min(r, g, b); return ((mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60 + 360) % 360; };
assert.ok(Math.abs(hue(px[0], px[1], px[2]) - 215) < 6, `painted hue ${hue(px[0], px[1], px[2])}`);
assert.deepEqual([...px.slice(4)], [10, 200, 90, 255], 'a pixel outside the mask changed');
console.log(`Avatar colours check passed: ${n} avatars, mask sheet ${w}x${h}.`);
