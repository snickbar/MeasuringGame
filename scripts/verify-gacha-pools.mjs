// The capsule machine's pools: what each category can give, who counts as "owned", the odds, and the profile writes.
// Evaluates the real <gacha-pools> block from index.html against the real pack catalogs, with ownership stubbed by sets.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const arraySource = (name) => { const m = html.match(new RegExp('const ' + name + ' = (\\[[\\s\\S]*?\\n  \\]);')); assert(m, 'Missing ' + name); return `const ${name} = ${m[1]};`; };
const line = (re, what) => { const m = html.match(re); assert(m, 'Missing ' + what); return m[0]; };
const start = html.indexOf('  // <gacha-pools>'), end = html.indexOf('  // </gacha-pools>');
assert(start > 0 && end > start, 'gacha-pools markers');
const block = html.slice(start, end);
const sb = {};
vm.createContext(sb);
const src = [
  `const MONTHLY_BOARD_ITEMS = Array.from({length:12}, (_,i)=>({id:'mb'+String(i+1).padStart(2,'0')}));`,
  ...['EMOJI_PACK_CATALOG', 'FLAIR_PACK_CATALOG', 'BOARD_PACK_CATALOG', 'BACKGROUND_PACK_CATALOG', 'MONTH_BACKGROUNDS'].map(arraySource),
  line(/  const GACHA_TIER_WEIGHTS = \{[^}]*\};/, 'GACHA_TIER_WEIGHTS'),
  line(/  const emojiKey = [^\n]*/, 'emojiKey'),
  line(/  function emojiPackOf\(e\) \{[^\n]*\}/, 'emojiPackOf'),
  line(/  function flairPackOf\(id\) \{[^\n]*\}/, 'flairPackOf'),
  line(/  function boardPackOf\(id\) \{[^\n]*\}/, 'boardPackOf'),
  line(/  function backgroundPackOf\(id\) \{[^\n]*\}/, 'backgroundPackOf'),
  line(/  function allBoards\(\) \{[^\n]*\}/, 'allBoards'),
  // Mode scenes come from anim/mode-identity.mjs; their ids all start with "mode-".
  `const MODE_BACKGROUNDS = [{ id: "mode-worlds" }, { id: "mode-daily" }];`,
  // Stubs: three default avatars and a few in each tier, plus a profile whose ownership the test controls.
  `const AVATARS = ["d1","d2","c1","c2","c3","c4","r1","r2","u1"];
   const AVATAR_TIERS = { d1: "default", d2: "default", c1: "common", c2: "common", c3: "common", c4: "common", r1: "rare", r2: "rare", u1: "ultra" };
   const DEFAULT_EMOJIS = ["a"];
   let P = {};
   const isAvatarUnlocked = (a) => AVATAR_TIERS[a] === "default" || !!(P.unlockedAvatars || {})[a];
   const COSMETIC_CATALOG = { effects: [{ id: "classic", cost: 0 }].concat(FLAIR_PACK_CATALOG.flatMap((p) => p.flairs).map((id) => ({ id, cost: 100 }))) };
   const ownsEmoji = (e) => gachaOwnedIn(P, "reaction", e);
   const ownsFlair = (it) => it.cost === 0 || gachaOwnedIn(P, "flair", it.id);
   const ownsBoard = (id) => gachaOwnedIn(P, "board", id);
   const ownsBackground = (id) => gachaOwnedIn(P, "scene", id);
   const defaultCosmeticState = () => ({ owned: {}, equipped: {} });`,
  block,
  'globalThis.api = { gachaPool, gachaRemaining, gachaAnyRemaining, gachaPick, gachaPickId, gachaOwnedIn, gachaGrant, GACHA_CATEGORIES, ITEM_TIERS, itemTier, itemCoinCost, setProfile: (p) => { P = p; }, MONTH_BACKGROUNDS, MODE_BACKGROUNDS, BACKGROUND_PACK_CATALOG, EMOJI_PACK_CATALOG, FLAIR_PACK_CATALOG, BOARD_PACK_CATALOG };',
].join('\n');
vm.runInContext(src, sb);
const a = sb.api;

// Fresh player: everything in the old paid packs is in the machine, nothing else.
a.setProfile({});
assert.deepEqual([...a.GACHA_CATEGORIES], ['avatar', 'reaction', 'flair', 'board', 'scene']);
assert.equal(a.gachaRemaining('avatar'), 7, 'default avatars are not in the machine');
assert.equal(a.gachaRemaining('reaction'), 24);
assert.equal(a.gachaRemaining('flair'), 20);
assert.equal(a.gachaRemaining('board'), 12);
assert.equal(a.gachaRemaining('scene'), 24);
const sceneIds = new Set(a.gachaPool('scene'));
for (const b of [...a.MONTH_BACKGROUNDS, ...a.MODE_BACKGROUNDS]) assert(!sceneIds.has(b.id), 'earned or free scene must not be in the machine: ' + b.id);
assert(!a.gachaPool('flair').includes('classic'), 'the free flair is not in the machine');
assert(!a.gachaPool('reaction').includes('a'), 'default reactions are not in the machine');

// Ownership removes items, including whole packs and each of the four ways an item can be owned.
a.setProfile({ emojiOwned: { '1f624': true } });
assert.equal(a.gachaRemaining('reaction'), 23, 'one reaction owned');
a.setProfile({ emojiPacks: { pack1: true } });
assert.equal(a.gachaRemaining('reaction'), 18, 'a whole reaction pack owned');
a.setProfile({ flairPacks: { fpack1: true }, cosmetics: { owned: { effects: { fire: true } } } });
assert.equal(a.gachaRemaining('flair'), 14, 'a flair pack plus a single flair');
a.setProfile({ boardPacks: { boardpack1: true }, cosmetics: { owned: { boards: { terminal: true } } } });
assert.equal(a.gachaRemaining('board'), 7);
a.setProfile({ backgroundPacks: { bgpack3: true }, cosmetics: { owned: { backgrounds: { 'table-card': true } } } });
assert.equal(a.gachaRemaining('scene'), 17);
a.setProfile({ unlockedAvatars: { c1: true, u1: true } });
assert.equal(a.gachaRemaining('avatar'), 5);

// A pick is always one you do not own, for every category, across many draws.
a.setProfile({ emojiPacks: { pack1: true, pack2: true }, flairPacks: { fpack1: true }, boardPacks: { boardpack1: true }, backgroundPacks: { bgpack3: true }, unlockedAvatars: { c1: true } });
for (const cat of a.GACHA_CATEGORIES) {
  const pool = new Set(a.gachaPool(cat));
  for (let i = 0; i < 300; i++) { const p = a.gachaPick(cat); assert.equal(p.cat, cat); assert(pool.has(p.id), cat + ' pick must be unowned: ' + p.id); }
}

// Avatar odds keep the rarity weights: 65% common, 25% rare, 10% ultra.
a.setProfile({});
assert.equal(a.gachaPickId('avatar', () => 0), 'c1');
assert.equal(a.gachaPickId('avatar', () => 0.7).startsWith('r'), true);
assert.equal(a.gachaPickId('avatar', () => 0.95), 'u1');
// With no ultra left, the weights are shared by the tiers that remain.
a.setProfile({ unlockedAvatars: { u1: true } });
assert.equal(a.gachaPickId('avatar', () => 0.99).startsWith('r'), true);

// Rarity for every category: the planned splits, every listed id is a real machine item, and picks follow 65/25/10.
a.setProfile({});
const tierCount = (cat) => a.gachaPool(cat).reduce((m, id) => { const t = a.itemTier(cat, id); m[t] = (m[t] || 0) + 1; return m; }, {});
assert.deepEqual(tierCount('reaction'), { common: 14, rare: 7, ultra: 3 });
assert.deepEqual(tierCount('flair'), { common: 11, rare: 6, ultra: 3 });
assert.deepEqual(tierCount('board'), { common: 7, rare: 3, ultra: 2 });
assert.deepEqual(tierCount('scene'), { common: 14, rare: 7, ultra: 3 });
for (const cat of ['reaction', 'flair', 'board', 'scene']) {
  const pool = new Set(a.gachaPool(cat));
  for (const t of ['rare', 'ultra']) a.ITEM_TIERS[cat][t].forEach((id) => assert(pool.has(id), cat + ' ' + t + ' lists an id that is not in the machine: ' + id));
  assert.equal(a.gachaPickId(cat, () => 0) && a.itemTier(cat, a.gachaPickId(cat, () => 0)), 'common', cat + ': low roll is common');
  assert.equal(a.itemTier(cat, a.gachaPickId(cat, () => 0.7)), 'rare', cat + ': 0.7 roll is rare');
  assert.equal(a.itemTier(cat, a.gachaPickId(cat, () => 0.95)), 'ultra', cat + ': 0.95 roll is ultra');
}
assert.deepEqual([a.itemCoinCost('flair', 'fireflies'), a.itemCoinCost('board', 'phone'), a.itemCoinCost('scene', 'tile-dots')], [200, 150, 100]);
assert.equal(a.itemCoinCost('reaction', '\u2620\uFE0F'), 150);
// An emptied tier hands its odds to the others.
a.setProfile({ cosmetics: { owned: { effects: { fireworks: true, lightning: true, fireflies: true } } } });
assert.equal(a.itemTier('flair', a.gachaPickId('flair', () => 0.99)), 'rare');

// "Any": each open category is equally likely, an empty category is skipped, and nothing left gives null.
a.setProfile({});
assert.equal(a.gachaPick('any', () => 0).cat, 'avatar');
assert.equal(a.gachaPick('any', () => 0.99).cat, 'scene');
a.setProfile({ emojiPacks: { pack1: true, pack2: true, pack3: true, pack4: true } });
assert.equal(a.gachaRemaining('reaction'), 0);
const seen = new Set(); for (let i = 0; i < 400; i++) seen.add(a.gachaPick('any').cat);
assert(!seen.has('reaction') && seen.size === 4, 'an emptied category is skipped');
assert.equal(a.gachaPick('reaction'), null);
const all = { emojiPacks: { pack1: true, pack2: true, pack3: true, pack4: true }, flairPacks: Object.fromEntries(a.FLAIR_PACK_CATALOG.map((p) => [p.id, true])),
  boardPacks: Object.fromEntries(a.BOARD_PACK_CATALOG.map((p) => [p.id, true])), backgroundPacks: Object.fromEntries(a.BACKGROUND_PACK_CATALOG.map((p) => [p.id, true])), unlockedAvatars: Object.fromEntries(['c1','c2','c3','c4','r1','r2','u1'].map((x) => [x, true])) };
a.setProfile(all);
assert.equal(a.gachaAnyRemaining(), false);
assert.equal(a.gachaPick('any'), null);

// Granting writes exactly one item, leaves the input alone, and counts as owned afterwards.
for (const [cat, id] of [['avatar', 'c2'], ['reaction', '\u{1F624}'], ['flair', 'fire'], ['board', 'neon'], ['scene', 'tile-dots']]) {
  const before = {}; const frozen = JSON.stringify(before);
  const after = a.gachaGrant(before, cat, id);
  assert.equal(JSON.stringify(before), frozen, cat + ': the input profile is not changed');
  assert.equal(a.gachaOwnedIn(before, cat, id), false);
  assert.equal(a.gachaOwnedIn(after, cat, id), true, cat + ': owned after the grant');
  a.setProfile(after);
  assert(!a.gachaPool(cat).includes(id), cat + ': gone from the pool after the grant');
}
console.log('PASS: capsule machine pools, odds, ownership and grants.');
