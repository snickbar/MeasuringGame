import assert from 'node:assert/strict';
import { createOfflineProfile, mergeProfile } from '../anim/offline-profile.mjs';

const mem = () => { const d = {}; return { getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = String(v); }, d }; };
const storage = mem();
const P = createOfflineProfile({ storage, now: () => 5 });

// A server profile arrives and is remembered as both "last synced" and "local".
const server0 = { coins: 100, stats: { rounds: 4 }, seenObjects: { ant: true }, history: [{ u: 'ant', g: 'door' }] };
assert.deepEqual(P.serverSnapshot('me', server0), { data: server0, pending: false });

// Offline: the game's own transaction functions run against the local copy.
let r = P.transaction('me', 'coins', (c) => (c || 0) + 25);
assert(r.committed && r.value === 125);
r = P.transaction('me', '', (p) => { p.gameRewards = { g1: { coins: 25 } }; p.stats.rounds += 3; return p; });
assert(r.committed && P.local('me').gameRewards.g1.coins === 25 && P.local('me').stats.rounds === 7 && P.local('me').coins === 125);
r = P.transaction('me', 'coins', () => undefined); assert(!r.committed, 'aborted transactions change nothing');
P.update('me', '', { 'seenObjects/nail': true, 'cosmetics/equipped/board': 'chalk' });
assert(P.local('me').seenObjects.nail === true && P.local('me').cosmetics.equipped.board === 'chalk');
P.set('me', 'freePulls', 2); assert.equal(P.local('me').freePulls, 2);
assert(P.isDirty('me'));

// While changes are waiting, a server snapshot must not wipe them from view.
const shown = P.serverSnapshot('me', { ...server0, coins: 130 });
assert(shown.pending && shown.data.coins === 125, 'local copy stays on screen until merged');

// Reconnect: the server moved on (another device earned 30 coins and an object) - coins ADD, nothing double counts.
const serverNow = { coins: 130, stats: { rounds: 4 }, seenObjects: { ant: true, hammer: true }, history: [{ u: 'ant', g: 'door' }] };
const merged = P.mergeInto('me')(serverNow);
assert(Object.keys(merged.offlineSyncs).length === 1);
assert.equal(merged.coins, 155, '130 on the server + 25 earned offline');
assert.equal(merged.stats.rounds, 7);
assert.deepEqual(Object.keys(merged.seenObjects).sort(), ['ant', 'hammer', 'nail']);
assert.equal(merged.gameRewards.g1.coins, 25); assert.equal(merged.cosmetics.equipped.board, 'chalk'); assert.equal(merged.freePulls, 2);

// Replaying the merge against an already-merged server must not add the coins again.
assert.equal(P.mergeInto('me')(merged), undefined, 'a retried sync is recognised by its token and skipped');
P.markSynced('me', merged);
assert.equal(P.state('me').token, null);
assert(!P.isDirty('me')); assert.equal(P.serverSnapshot('me', merged).pending, false);

// A fresh install offline (no server data at all) still works and merges into an empty server profile later.
const Q = createOfflineProfile({ storage: mem() });
Q.transaction('new', '', (cur) => ({ ...(cur || { coins: 100 }), coins: ((cur || { coins: 100 }).coins) + 10 }));
assert.equal(Q.local('new').coins, 110);
assert.equal(Q.mergeInto('new')(null).coins, 110, 'merging into a brand new server profile');

// Persistence: a restart keeps the waiting changes.
P.update('me', '', { 'seenObjects/saw': true }); P.flush('me');
const P2 = createOfflineProfile({ storage });
assert(P2.isDirty('me') && P2.local('me').seenObjects.saw === true, 'offline changes survive the app being closed');

// Never synced before (no base): starting defaults must not be added onto the real balance.
assert.equal(mergeProfile({ coins: 500, stats: { rounds: 9 } }, null, { coins: 100, stats: { rounds: 0 } }).coins, 500, 'no base: keep the larger');
assert.equal(createOfflineProfile({ storage: mem() }).hasBase('x'), false);
assert.equal(P.hasBase('me'), true);

// mergeProfile basics
assert.equal(mergeProfile({ a: 1 }, { a: 1 }, { a: 1 }).a, 1);
assert.equal(mergeProfile({ a: 5 }, { a: 1 }, { a: 1 }).a, 5, 'unchanged here: take the server');
assert.deepEqual(mergeProfile({ l: [1, 2] }, { l: [1] }, { l: [1, 3] }).l, [1, 2, 3], 'lists changed on both sides keep both sets of entries');
const Z = createOfflineProfile({ storage: mem() }); Z.seedIfEmpty('z', { coins: 0, stats: {} });
assert.equal(Z.transaction('z', '', (p) => (p ? { ...p, coins: p.coins + 5 } : undefined)).committed, true, 'a seeded new profile accepts transactions');
console.log('Offline profile: local transactions/updates, safe three-way merge (coins add, no double credit), persistence passed.');
