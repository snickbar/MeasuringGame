// Avatar achievements are worked out from plain facts (anim/avatar-awards.mjs). Checks the counts behind them.
import assert from 'node:assert/strict';
import { avatarAwardStats } from '../anim/avatar-awards.mjs';
import { avatarLevelFor } from '../anim/avatar-levels.mjs';
const levelOf = (pts) => (i) => avatarLevelFor(pts(i));

const pts = { a: 120, b: 40, c: 0, d: 400, e: 8 };      // levels 6, 3, 0, 6 (the top), 1
const looks = { a: { frame: 3, color: 'Blue', sticker: 'r:crown:50:12:30:10:m', aura: 'glow' }, b: { aura: 'flame' }, c: {}, d: { aura: 'glow', frame: 2 }, e: { color: 'Pink' } };
const tier = { a: 'rare', b: 'default', c: 'common', d: 'ultra', e: 'default' };
const s = avatarAwardStats({ ids: Object.keys(pts), points: (i) => pts[i], levelOf: levelOf((i) => pts[i]), looks: (i) => looks[i], tier: (i) => tier[i] });
assert.equal(s.rising, 3, 'level 3 or more: a, b, d');
assert.equal(s.maxed, 2, 'level 6 or more: a, d');
assert.equal(s.styled, 4, 'a, b, d, e have a saved look; c has none');
assert.equal(s.totalAp, 568);
assert.equal(s.auras, 2, 'glow and flame');
assert.equal(s.fullLook, true, 'a has all four');
assert.equal(s.mirrored, true, 'a has a mirrored sticker');
assert.equal(s.luckyStar, true, 'd is an ultra-rare avatar at level 6 or more');

const none = avatarAwardStats({ ids: ['x'], points: () => 0, levelOf: () => 0, looks: () => ({}), tier: () => 'default' });
assert.deepEqual(none, { rising: 0, maxed: 0, styled: 0, totalAp: 0, auras: 0, fullLook: false, mirrored: false, luckyStar: false });
const almost = avatarAwardStats({ ids: ['x'], points: () => 100, levelOf: levelOf(() => 100), looks: () => ({ frame: 1, color: 'Red', sticker: 'r:crown:1:1:30:0', aura: '' }), tier: () => 'ultra' });
assert.equal(almost.fullLook, false, 'three of four is not a full look');
assert.equal(almost.luckyStar, false, 'level 5 is not level 6');
assert.equal(almost.mirrored, false);

console.log('Avatar awards check passed: the counts behind the achievements.');
