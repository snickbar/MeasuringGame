// Room and leaderboard rules, against the real Firebase rules engine (the local database emulator):
//   npm run test:db-rules
// Every write the game itself makes must still be allowed, and the abuses the rules close must be refused.
// The writes below copy the game's own shapes: room creation and join, guesses, multi-path updates, Daily/Monthly/Survival posts.
import assert from 'node:assert/strict';
const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST;
assert(host && /^(127\.0\.0\.1|localhost):/.test(host), 'This test only runs against the local emulator');
const NS = 'demo-db-rules-default-rtdb';
const url = (p) => `http://${host}/${p}.json?ns=${NS}`;
async function req(method, path, body) {
  const r = await fetch(url(path), { method, body: body === undefined ? undefined : JSON.stringify(body) });
  return { ok: r.ok, status: r.status, body: await r.json().catch(() => null) };
}
const allowed = async (label, method, path, body) => { const r = await req(method, path, body); assert(r.ok, label + ' should be allowed, got ' + r.status + ' ' + JSON.stringify(r.body)); };
const denied = async (label, method, path, body) => { const r = await req(method, path, body); assert(!r.ok, label + ' should be refused'); };
const ID = '0123456789abcdef0123456789abcdef', OTHER = 'fedcba9876543210fedcba9876543210';

// ---- Rooms ----
await denied('listing every room', 'GET', 'rooms');
await allowed('creating a room', 'PUT', 'rooms/ABCD', { phase: 'waiting', round: 0, settings: { mode: 'classic' }, players: { p_host1234: { name: 'Sam', avatar: 'av12', isHost: true, score: 0, connected: true } } });
await allowed('reading one room', 'GET', 'rooms/ABCD');
await allowed('joining (a new seat)', 'PATCH', 'rooms/ABCD/players/p_guest567', { name: 'QuantumQuinn', avatar: 'av3', isHost: false, score: 0, connected: true });
await allowed('a bot seat', 'PATCH', 'rooms/ABCD/players/bot_abc12345', { name: 'Robo', avatar: 'av40', isBot: true, botDifficulty: 'hard' });
await allowed('a host multi-path update', 'PATCH', 'rooms/ABCD', { phase: 'question', round: 1, 'players/p_guest567/connected': false, guesses: null });
await allowed('locking in a guess', 'PUT', 'rooms/ABCD/guesses/p_guest567', 12.5);
await allowed('a bot guess', 'PUT', 'rooms/ABCD/guesses/bot_abc12345', 3);
await allowed('changing your avatar', 'PATCH', 'rooms/ABCD/players/p_guest567', { avatar: 'av7', name: 'Quinn' });
await allowed('a pick', 'PUT', 'rooms/ABCD/picks/p_guest567', 'p_host1234');
await allowed('a whole-room transaction-style rewrite with valid data', 'PUT', 'rooms/ABCD', { phase: 'waiting', players: { p_host1234: { name: 'Sam', avatar: 'av12', isHost: true } } });
await denied('an avatar that breaks out of the HTML', 'PATCH', 'rooms/ABCD/players/p_guest567', { avatar: 'x" onerror="alert(1)' });
await denied('a seat id with a quote in it', 'PUT', 'rooms/ABCD/players/' + encodeURIComponent('p_"x'), { name: 'X', avatar: 'av1' });
await denied('a 200-character name', 'PATCH', 'rooms/ABCD/players/p_guest567', { name: 'x'.repeat(200) });
await denied('a guess that is not a number', 'PUT', 'rooms/ABCD/guesses/p_guest567', '<img src=x>');
await denied('a bad room code', 'PUT', 'rooms/abcd', { phase: 'waiting' });
await allowed('removing a seat', 'DELETE', 'rooms/ABCD/players/p_guest567');
await allowed('deleting an empty room', 'DELETE', 'rooms/ABCD');

// ---- Daily ----
const day = '2026-11-25';
await allowed('a Daily score', 'PUT', `daily/${day}/${ID}`, { h: 1, n: 'Sam', s: 251.4, a: [88, 79, 85], t: Date.now() });
await denied('a second Daily score', 'PUT', `daily/${day}/${ID}`, { h: 1, n: 'Sam', s: 290, a: [99, 95, 96], t: Date.now() });
await denied('Daily over 300', 'PUT', `daily/${day}/${OTHER}`, { h: 1, n: 'Cheat', s: 301, a: [100, 100, 100], t: Date.now() });
await denied('Daily score above its own accuracies', 'PUT', `daily/${day}/${OTHER}`, { h: 1, n: 'Cheat', s: 300, a: [10, 10, 10], t: Date.now() });
await denied('Daily extra field', 'PUT', `daily/${day}/${OTHER}`, { h: 1, n: 'Cheat', s: 30, a: [10, 10, 10], t: Date.now(), x: 1 });
await denied('Daily 13-character name', 'PUT', `daily/${day}/${OTHER}`, { h: 1, n: 'x'.repeat(13), s: 30, a: [10, 10, 10], t: Date.now() });
await denied('Daily accuracy over 100', 'PUT', `daily/${day}/${OTHER}`, { h: 1, n: 'Cheat', s: 30, a: [150, 0, 0], t: Date.now() });
await denied('deleting a Daily score', 'DELETE', `daily/${day}/${ID}`);
assert.equal((await req('GET', `daily/${day}/${ID}`)).body.s, 251.4, 'the first Daily score stands');

// ---- Monthly (Mega level has 15 questions) ----
await allowed('a Monthly score', 'PUT', `monthly/2026-11-L4/${ID}`, { h: 1, n: 'Sam', s: 412.5, a: Array.from({ length: 15 }, () => 82), t: Date.now() });
await denied('Monthly over 500', 'PUT', `monthly/2026-11-L4/${OTHER}`, { h: 1, n: 'Cheat', s: 501, a: [100], t: Date.now() });
await denied('a second Monthly score', 'PUT', `monthly/2026-11-L4/${ID}`, { h: 1, n: 'Sam', s: 499, a: [100], t: Date.now() });

// ---- Old-style entries under a raw device id (no h:1) are refused for guests ----
await denied('a Daily score without the hashed-key marker', 'PUT', `daily/${day}/${OTHER}`, { n: 'Old', s: 30, a: [10, 10, 10], t: Date.now() });
await denied('a Survival score without the hashed-key marker', 'PUT', `survival/${OTHER}`, { n: 'Old', s: 3, t: Date.now() });

// ---- Survival (best score only) ----
await allowed('a Survival score', 'PUT', `survival/${ID}`, { h: 1, n: 'Sam', s: 10, t: Date.now() });
await denied('a lower Survival score over it', 'PUT', `survival/${ID}`, { h: 1, n: 'Faker', s: 5, t: Date.now() });
await denied('an equal Survival score over it', 'PUT', `survival/${ID}`, { h: 1, n: 'Faker', s: 10, t: Date.now() });
await allowed('a new Survival best', 'PUT', `survival/${ID}`, { h: 1, n: 'Sam', s: 12, t: Date.now() });
await denied('Survival over 5000', 'PUT', `survival/${OTHER}`, { h: 1, n: 'Cheat', s: 5001, t: Date.now() });
await denied('Survival extra field', 'PUT', `survival/${OTHER}`, { h: 1, n: 'Cheat', s: 3, t: Date.now(), x: 1 });
await denied('a Survival time far in the future', 'PUT', `survival/${OTHER}`, { h: 1, n: 'Cheat', s: 3, t: Date.now() + 7 * 86400000 });
await denied('deleting a Survival score', 'DELETE', `survival/${ID}`);
assert.equal((await req('GET', `survival/${ID}`)).body.s, 12, 'the best Survival score stands');

console.log('PASS: rooms keep every game write (create, join, bots, guesses, picks, host updates, cleanup) and refuse injected avatars, bad seat ids, huge names and non-number guesses; Daily/Monthly/Survival accept real scores and refuse out-of-range, inconsistent, extra-field, duplicate, lower and deleted entries.');
