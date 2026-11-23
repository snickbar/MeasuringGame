import assert from 'node:assert/strict';
import { chooseHost } from '../anim/room-safety.mjs';
import { SOLO_WAIT_MS, soloWaitState, startSoloWait, clearSoloWait, holdForLobby, keepPlaying, lobbyReady, takeLobbyHost, clearLobbyHold } from '../anim/solo-wait.mjs';
const room = (over = {}, a = true, b = true) => ({ phase: 'question', settings: {}, players: {
  h1: { name: 'A', isHost: true, connected: a }, h2: { name: 'B', connected: b }, bot: { name: 'Bot', isBot: true, connected: true } }, ...over });
// two humans present: nothing to do
assert.equal(startSoloWait(room(), 1000), undefined);
// one drops: the timer starts, and the game is not paused
let r = startSoloWait(room({}, true, false), 1000);
assert.deepEqual(r.soloWait, { since: 1000, ids: ['h2'] }); assert.notEqual(r.paused, true);
assert.equal(startSoloWait(r, 2000), undefined, 'already running');
// back in time: cleared; not cleared while still alone
assert.equal(clearSoloWait(r), undefined);
assert.equal(clearSoloWait({ ...r, players: { ...r.players, h2: { ...r.players.h2, connected: true } } }).soloWait, null);
// too early / on time
assert.equal(holdForLobby(r, 1000 + SOLO_WAIT_MS - 1), undefined);
const kept = keepPlaying(r);
assert.equal(kept.soloWait.dismissed, true);
assert.equal(keepPlaying(kept), undefined);
assert.equal(startSoloWait(kept, 5), undefined);
const held = holdForLobby(r, 1000 + SOLO_WAIT_MS);
assert.equal(held.paused, true); assert.equal(held.pausedAt, 1000 + SOLO_WAIT_MS); assert.ok(held.lobbyHold); assert.equal(held.soloWait, null);
// rules that do not apply: lobby, finished, Quick Game, one human + bots, a human who left for good
for (const bad of [room({ phase: 'waiting' }, true, false), room({ phase: 'final' }, true, false), room({ settings: { solo: true } }, true, false)]) assert.equal(startSoloWait(bad, 1), undefined);
const oneHuman = room({}, true, true); delete oneHuman.players.h2; assert.equal(soloWaitState(oneHuman), null);
assert.deepEqual(startSoloWait(room({}, false, false), 1).soloWait.ids, ['h1', 'h2']); // both gone: still a valid wait (the first to come back runs it)
// two humans connected = ready, whichever they are (a third human alone is not enough); host takeover only when the host is away
assert.equal(lobbyReady(held), false);
const three = { ...held, players: { ...held.players, h3: { name: 'C', connected: true } } };
assert.equal(lobbyReady(three), true, 'any one more human is enough, even if the one who left stays away');
assert.equal(lobbyReady({ ...three, players: { ...three.players, h1: { ...three.players.h1, connected: false } } }), false);
assert.equal(lobbyReady({ ...held, players: { ...held.players, h2: { ...held.players.h2, connected: true } } }), true);
const hostAway = { ...held, players: { ...held.players, h1: { ...held.players.h1, connected: false }, h2: { ...held.players.h2, connected: true } } };
const taken = takeLobbyHost(hostAway, 'h2'); assert.equal(taken.players.h2.isHost, true); assert.equal(taken.players.h1.isHost, false); assert.equal(taken.hostOriginal, 'h1');
assert.equal(takeLobbyHost(held, 'h1'), undefined); assert.equal(takeLobbyHost(held, 'h2'), undefined, 'host is here');
assert.equal(clearLobbyHold(held).lobbyHold, null);
// lobby host switch: host -> a human who is here, lobby only
const lobby = { phase: 'waiting', hostOriginal: 'x', players: { h1: { isHost: true, connected: true }, h2: { connected: true }, bot: { isBot: true, connected: true }, h3: { connected: false } } };
const sw = chooseHost(lobby, 'h1', 'h2'); assert.equal(sw.players.h2.isHost, true); assert.equal(sw.players.h1.isHost, false); assert.equal(sw.hostOriginal, null);
for (const [f, t] of [['h2', 'h1'], ['h1', 'bot'], ['h1', 'h3'], ['h1', 'h1'], ['h1', 'nobody']]) assert.equal(chooseHost(lobby, f, t), undefined);
assert.equal(chooseHost({ ...lobby, phase: 'question' }, 'h1', 'h2'), undefined, 'only before the game starts');
console.log('Last-human-standing wait: timer, freeze, lobby readiness, host takeover verified.');
