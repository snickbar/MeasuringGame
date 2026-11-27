// The avatar level curve (anim/avatar-levels.mjs) and the rule that bots only wear what the player unlocked on the avatar the bot has.
// The bot code is the real code from index.html, run with small stand-ins for the rest of the game.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AP_LEVEL_AT, MAX_AVATAR_LEVEL, PERK_LEVEL, avatarLevelFor, avatarLevelProgress } from '../anim/avatar-levels.mjs';

// --- the curve ---
assert.equal(MAX_AVATAR_LEVEL, 6);
const steps = AP_LEVEL_AT.map((t, i) => t - (AP_LEVEL_AT[i - 1] || 0));
for (let i = 1; i < steps.length; i++) assert.ok(steps[i] > steps[i - 1], `each level takes more AP than the one before (${steps})`);
assert.ok(steps[0] <= 8 && steps[1] <= 10, 'Levels 1 and 2 are fairly easy');
for (let i = 1; i < steps.length; i++) assert.ok(steps[i] <= steps[i - 1] * 1.4, `no step is a big jump over the one before it (${steps})`);
AP_LEVEL_AT.forEach((t, i) => assert.ok(t <= (i + 1) * 20, `Level ${i + 1} is no harder than the old 20-per-level ladder, so nobody loses a level`));
assert.equal(AP_LEVEL_AT[5], 80, 'the top level takes 80 AP');
assert.equal(avatarLevelFor(0), 0); assert.equal(avatarLevelFor(5), 0); assert.equal(avatarLevelFor(6), 1);
assert.equal(avatarLevelFor(13), 1); assert.equal(avatarLevelFor(14), 2); assert.equal(avatarLevelFor(79), 5);
assert.equal(avatarLevelFor(80), 6); assert.equal(avatarLevelFor(9999), 6, 'the top level is the cap');
assert.equal(avatarLevelFor(undefined), 0); assert.equal(avatarLevelFor(-4), 0);
assert.deepEqual(avatarLevelProgress(0), { level: 0, into: 0, span: 6, done: false });
assert.deepEqual(avatarLevelProgress(10), { level: 1, into: 4, span: 8, done: false });
assert.deepEqual(avatarLevelProgress(79), { level: 5, into: 22, span: 23, done: false });
assert.equal(avatarLevelProgress(500).done, true);

// --- index.html keeps the same look levels ---
const src = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const [name, key] of [['FRAME_LEVEL', 'frame'], ['COLOR_LEVEL', 'color'], ['STICKER_LEVEL', 'sticker'], ['AURA_LEVEL', 'aura']]) {
  assert.equal(Number(new RegExp(`const ${name} = (\\d+);`).exec(src)[1]), PERK_LEVEL[key], `${name} matches PERK_LEVEL.${key}`);
}
assert.ok(!/AP_PER_LEVEL/.test(src), 'the old flat AP_PER_LEVEL is gone');

// --- bots: only what this avatar's level allows ---
const a = src.indexOf('  // A bot only wears what this player has unlocked'), b = src.indexOf('  async function addBot');
assert.ok(a > 0 && b > a, 'bot look code found');
let level = 0;
const stubs = {
  avatarLevel: () => level, FRAME_LEVEL: PERK_LEVEL.frame, COLOR_LEVEL: PERK_LEVEL.color, STICKER_LEVEL: PERK_LEVEL.sticker, AURA_LEVEL: PERK_LEVEL.aura,
  defaultFrameFor: () => 4, defaultColorFor: () => 'Blue', defaultStickerFor: () => 'r:crown:50:12:30:10', defaultAuraFor: () => 'glow',
  playerFrameCatalog: [0, 1, 2, 3, 4, 5], colorChoices: () => [{ name: 'Pink' }, { name: 'Green' }], stickerChoices: () => ({ reactions: [{ kind: 'r', name: 'crown' }], objects: [{ kind: 'o', name: 'ball' }] }),
  randomStickerSpot: async () => ({ x: 50, y: 12, size: 30, rot: 10 }), stickerString: (k, n, x, y, s, r) => `${k}:${n}:${x}:${y}:${s}:${r}`, stickerInfo: () => true, AURAS: [{ id: 'glow' }, { id: 'flame' }],
};
const make = new Function(...Object.keys(stubs), `${src.slice(a, b)}\nreturn { savedBotLook, randomBotLook, botMayWear };`);
const { savedBotLook, randomBotLook, botMayWear } = make(...Object.values(stubs));
const allowed = { 0: [], 1: [], 2: [], 3: ['playerFrame'], 4: ['playerFrame', 'avatarColor'], 5: ['playerFrame', 'avatarColor', 'avatarSticker'], 6: ['playerFrame', 'avatarColor', 'avatarSticker', 'avatarAura'] };
const fields = ['playerFrame', 'avatarColor', 'avatarSticker', 'avatarAura'];
const has = (look, f) => (f === 'playerFrame' ? look[f] > 0 : !!look[f]);
for (let lv = 0; lv <= 6; lv++) {
  level = lv;
  const saved = savedBotLook('x');
  for (const f of fields) assert.equal(has(saved, f), allowed[lv].includes(f), `Saved looks at Level ${lv}: ${f}`);
  const seen = new Set();
  for (let i = 0; i < 400; i++) {
    const look = await randomBotLook('x');
    for (const f of fields) if (has(look, f)) { assert.ok(allowed[lv].includes(f), `Random looks at Level ${lv} must not have ${f}`); seen.add(f); }
  }
  for (const f of allowed[lv]) assert.ok(seen.has(f), `Random looks at Level ${lv} do use ${f} sometimes`);
}
assert.deepEqual(botMayWear('x'), { frame: true, color: true, sticker: true, aura: true });

console.log('Avatar levels check passed: the AP curve, the look levels and bots wearing only what their avatar level unlocks.');
