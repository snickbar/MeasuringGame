import assert from 'node:assert/strict';
import { createLocalRooms } from '../anim/local-rooms.mjs';

const mem = () => { const d = {}; return { getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = String(v); }, d }; };
let clock = 1_000_000;
const storage = mem();
const L = createLocalRooms({ storage, now: () => clock });
const tick = () => new Promise((r) => setTimeout(r, 0));

assert(!L.owns('rooms/ABCD'), 'unknown rooms belong to the server');
L.create('ABCD', { phase: 'waiting', round: 0, settings: { solo: true, totalRounds: 3 } });
assert(L.owns('rooms/ABCD') && L.owns('rooms/ABCD/players/p1') && !L.owns('rooms/ZZZZ') && !L.owns('profiles/ABCD'));

// get / set / update with multi-path keys, nulls dropped
const r = L.ref('rooms/ABCD');
await L.update(r, { phase: 'question', 'players/p1': { name: 'ALEX', score: 0 }, 'players/p2': { name: 'Bot', isBot: true }, junk: null });
let v = (await L.get(r)).val();
assert.equal(v.phase, 'question'); assert.equal(v.players.p1.name, 'ALEX'); assert(!('junk' in v));
await L.set(L.ref('rooms/ABCD/players/p2/isBot'), null);
assert(!('isBot' in (await L.get(L.ref('rooms/ABCD/players/p2'))).val()));

// arrays round-trip as arrays; empty containers vanish; serverTimestamp resolves
await L.set(L.ref('rooms/ABCD/answers'), [{ a: 1 }, { a: 2 }]);
assert(Array.isArray((await L.get(L.ref('rooms/ABCD/answers'))).val()));
await L.set(L.ref('rooms/ABCD/answers/1/a'), 9);
assert.equal((await L.get(L.ref('rooms/ABCD/answers'))).val()[1].a, 9);
await L.set(L.ref('rooms/ABCD/empty'), {}); assert(!(await L.get(L.ref('rooms/ABCD/empty'))).exists());
await L.set(L.ref('rooms/ABCD/players/p1/joinedAt'), { '.sv': 'timestamp' });
assert.equal((await L.get(L.ref('rooms/ABCD/players/p1/joinedAt'))).val(), clock);

// onValue: initial value, then only real changes
const seen = []; const off = L.onValue(L.ref('rooms/ABCD/phase'), (s) => seen.push(s.val()));
await tick(); await L.set(L.ref('rooms/ABCD/phase'), 'question'); await tick();
await L.set(L.ref('rooms/ABCD/phase'), 'answers'); await tick();
await L.update(L.ref('rooms/ABCD'), { round: 1 }); await tick();
assert.deepEqual(seen, ['question', 'answers'], 'fires once initially and once per change, not for unrelated writes');
off(); await L.set(L.ref('rooms/ABCD/phase'), 'reveal'); await tick(); assert.equal(seen.length, 2, 'unsubscribed');

// onlyOnce reads once and stops
let once = 0; L.onValue(L.ref('rooms/ABCD/phase'), () => once++, { onlyOnce: true }); await tick();
await L.set(L.ref('rooms/ABCD/phase'), 'summary'); await tick(); assert.equal(once, 1, 'onlyOnce fires one time');

// whole-room listener sees child writes
let roomSeen = 0; L.onValue(r, () => roomSeen++); await tick(); const before = roomSeen;
await L.set(L.ref('rooms/ABCD/players/p1/score'), 5); await tick(); assert.equal(roomSeen, before + 1);

// onChildAdded: existing then new
const kids = []; L.onChildAdded(L.ref('rooms/ABCD/reactions'), (s) => kids.push(s.val().e)); await tick();
await L.set(L.ref('rooms/ABCD/reactions/k1'), { e: 'a' }); await tick();
await L.set(L.ref('rooms/ABCD/reactions/k2'), { e: 'b' }); await tick();
assert.deepEqual(kids, ['a', 'b']);
const pushed = L.push(L.ref('rooms/ABCD/reactions'), { e: 'c' }); await tick();
assert.deepEqual(kids, ['a', 'b', 'c']); assert(pushed.path.startsWith('rooms/ABCD/reactions/'));

// transactions: commit, abort, mutate-in-place
let res = await L.runTransaction(L.ref('rooms/ABCD/count'), (c) => (c || 0) + 1); assert(res.committed && res.snapshot.val() === 1);
res = await L.runTransaction(L.ref('rooms/ABCD/count'), (c) => { c; return undefined; }); assert(!res.committed);
res = await L.runTransaction(r, (room) => { room.round = 7; return room; }); assert((await L.get(r)).val().round === 7);
res = await L.runTransaction(L.ref('rooms/NEWC'), (cur) => (cur === null ? { phase: 'waiting' } : undefined)); assert(res.committed);
assert(L.owns('rooms/NEWC'), 'a transaction that creates a room makes it local');

// snapshots behave like Firebase's
const snap = await L.get(L.ref('rooms/ABCD/players'));
const names = []; snap.forEach((c) => { names.push(c.key + ':' + c.val().name); });
assert.deepEqual(names, ['p1:ALEX', 'p2:Bot']); assert.equal(snap.size, 2); assert.equal(snap.child('p1/name').val(), 'ALEX');

// onDisconnect is a harmless no-op chain
await L.onDisconnect(L.ref('rooms/ABCD/players/p1')).update({ connected: false }); await L.onDisconnect(L.ref('x')).cancel();

// remove deletes the room; persistence survives a "restart" and old rooms are pruned
L.flush();
const L2 = createLocalRooms({ storage, now: () => clock + 1000 });
assert(L2.owns('rooms/ABCD') && (await L2.get(L2.ref('rooms/ABCD'))).val().round === 7, 'restored after restart');
const L3 = createLocalRooms({ storage, now: () => clock + 25 * 3600 * 1000 });
assert(!L3.owns('rooms/ABCD'), 'rooms older than a day are dropped');
await L.remove(r); assert(!L.owns('rooms/ABCD'), 'removing the room releases it');
console.log('Local rooms: Firebase-style reads/writes, arrays, nulls, timestamps, listeners, transactions, restore and prune passed.');
