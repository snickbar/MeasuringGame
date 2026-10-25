import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { electedHost, transferHost, returnHost, admitPlayer, commitHsState, hsRoundRecord } from '../anim/room-safety.mjs';
import * as HS from '../anim/high-stakes.mjs';
import { applyCareerRecord } from '../anim/career-ledger.mjs';
import { deleteIfStale } from './cleanup-stale-rooms.mjs';

const copy = x => structuredClone(x);
const party = { phase: 'question', settings: { hostTransferMode: 'reassign' }, players: {
  old: { isHost: true, connected: false, joinedAt: 1, disconnectedAt: 0 },
  guest: { connected: true, joinedAt: 2 }, later: { connected: true, joinedAt: 3 },
  bot: { isBot: true, joinedAt: 0 }
} };
assert.equal(electedHost(party), 'guest');
for(const elapsed of [0,10000,59999]){
 assert.equal(electedHost(party,elapsed),null,'Brief absence keeps host: '+elapsed);
 assert.equal(transferHost(party,'guest',elapsed),undefined,'Transaction enforces the same grace');
}
assert.equal(electedHost(party,60000),'guest','Elect after a full minute');
const back=copy(party);back.players.old.connected=true;back.players.old.disconnectedAt=null;
assert.equal(transferHost(back,'guest',60001),undefined,'Reconnect defeats a pending transfer');
const left=copy(party);delete left.players.old;assert.equal(electedHost(left,0),'guest','Explicit departure transfers immediately');
const unknown=copy(party);delete unknown.players.old.disconnectedAt;assert.equal(electedHost(unknown,60001),null,'Unknown disconnect time is not permission for instant transfer');
const transferred = transferHost(party, 'guest');
assert.equal(transferred.players.old.isHost, false);
assert.equal(transferred.players.guest.isHost, true);
assert.equal(transferred.hostOriginal, 'old', 'remember the real host');
assert.equal(returnHost(transferred, 'old'), undefined, 'cannot take it back while still disconnected');
const comeback = copy(transferred); comeback.players.old.connected = true; comeback.players.old.disconnectedAt = null;
const restored = returnHost(comeback, 'old');
assert.equal(restored.players.old.isHost, true); assert.equal(restored.players.guest.isHost, false); assert.equal(restored.hostOriginal, null);
assert.equal(returnHost(comeback, 'guest'), undefined, 'only the original host takes it back');
assert.equal(transferHost(transferred, 'later'), undefined, 'second election retries against the promoted host');
assert.equal(electedHost({ ...party, settings: { hostTransferMode: 'reclaim' } }), null);
assert.equal(transferHost({ ...party, phase: 'ended' }, 'guest'), undefined);
assert.equal(electedHost({ ...party, players: { old: party.players.old } }), null);

const duo = { phase: 'waiting', settings: { mode: 'teamworlds' }, players: {
  host: { name: 'Host', frameIndex: 1, connected: true, isHost: true }
} };
const friend = { name: 'Friend', connected: true, frameIndex: 1 };
const joined = admitPlayer(duo, 'friend', friend);
assert.equal(joined.players.friend.frameIndex, 2, 'allocate a free frame inside the transaction');
assert.equal(admitPlayer(joined, 'third', friend), undefined, 'concurrent human loses the final-seat race');
assert.equal(admitPlayer(joined, 'bot', { ...friend, isBot: true }), undefined, 'bot cannot exceed duo cap');
assert.equal(admitPlayer({ ...joined, settings: { mode: 'teamworlds', variant: 'hl' } }, 'third', friend), undefined);
const away = copy(joined); away.players.friend.connected = false; away.players.friend.score = 17;
assert.equal(admitPlayer(away, 'friend', friend, true).players.friend.score, 17, 'rejoin full room preserves progress');
assert.equal(admitPlayer(joined, 'friend', friend, true), undefined, 'cannot reclaim an active seat');
const oldReturning = copy(transferred); oldReturning.players.old.name = 'Old';
assert.equal(admitPlayer(oldReturning, 'old', { name: 'Old', connected: true, isHost: true }, true).players.old.isHost, false);
let classic = { ...duo, settings: { mode: 'classic' } };
for (let i = 2; i <= 10; i++) classic = admitPlayer(classic, 'p' + i, { name: 'P' + i });
assert.equal(Object.keys(classic.players).length, 10);
assert.equal(admitPlayer(classic, 'eleven', friend), undefined);

let hs = HS.hsStartRound(HS.hsNewGame(['a', 'b', 'c']), { options: [100, 200, 300, 400], realIdx: 0, now: 0 });
hs = HS.hsBeginBetting(hs, { a: 0, b: 0, c: 1 }, 0);
hs = HS.hsApplyAction(hs, 'a', 'raise', 1);
const betRoom = { phase: 'hs', gameId: 'game', hs, hsQ: { answer: 100, unitId: 'ant', targetId: 'door' }, players: { a: {}, b: {}, c: {} } };
const timeout = HS.hsTimeoutAction(hs, hs.bet.turnEndsAt + 1);
const call = HS.hsApplyAction(hs, 'b', 'call', 2);
const accepted = commitHsState(betRoom, 'game', hs, { hs: call });
assert.equal(accepted.hs.chips.b, 85);
assert.equal(commitHsState(accepted, 'game', hs, { hs: timeout }), undefined, 'stale timeout cannot undo the committed call');
assert.equal(commitHsState({ ...betRoom, gameId: 'rematch' }, 'game', hs, { hs: timeout }), undefined);
const timedOut = commitHsState(betRoom, 'game', hs, { hs: timeout });
assert.equal(commitHsState(timedOut, 'game', hs, { hs: call }), undefined, 'late call cannot undo a committed timeout');
const resolved = HS.hsApplyAction(call, 'c', 'call', 3);
assert.equal(resolved.stage, 'reveal');
const revealed = commitHsState(accepted, 'game', call, { hs: resolved });
assert.ok(revealed.hsRounds.r1, 'completed round is archived atomically with its result');
const rec = hsRoundRecord('match', 1, revealed.hsRounds.r1, 'b', betRoom.players, 123);
let profile = { coins: 0, stats: {}, xp: 0 };
profile = applyCareerRecord(profile, rec);
assert.equal(profile.stats.rounds, 1);
assert.equal(profile.hsStats.roundsPlayed, 1);
assert.equal(profile.hsStats.roundsWon, 1);
assert.ok(profile.seenObjects.ant && profile.seenObjects.door && profile.seenCombos['ant|door']);
assert.ok(!profile.stats.gamesPlayed && !profile.stats.gamesWon, 'abandoning does not complete or win a game');
assert.deepEqual(applyCareerRecord(profile, rec), profile, 'reconnect/replayed receipt does not duplicate progress');
const final = { kind: 'attempt', mode: 'highstakes', key: 'match_hs', coins: 10, rounds: 1, roundsWon: 1, roundsRecorded: true, t: 123 };
const finished = applyCareerRecord(profile, final);
assert.equal(finished.hsStats.roundsPlayed, 1);
assert.equal(finished.hsStats.roundsWon, 1);
assert.equal(finished.coins, 10);
assert.equal(hsRoundRecord('match', 1, revealed.hsRounds.r1, 'spectator', betRoom.players, 123), null);
const missed = copy(revealed.hsRounds.r1); delete missed.hs.picks.b;
assert.equal(hsRoundRecord('match', 1, missed, 'b', betRoom.players, 123).history.answered, false);

// Exercise the actual host driver, holding its transaction until a human call commits.
const source = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
function actual(name) {
  const start = source.indexOf('  function ' + name + '(');
  assert.ok(start >= 0, name);
  return source.slice(start, source.indexOf('\n  }', start) + 4);
}
let pending, dbRoom = copy(betRoom);
const context = vm.createContext({ HS, commitHsState, electedHost, transferHost, console,
  db: {}, ref: (_, path) => path, currentRoomCode: 'TEST', currentPlayerId: 'a', roomState: betRoom,
  isHost: true, hsBusy: false, leavingGame: false, nowMs: () => hs.bet.turnEndsAt + 1,
  hsHash: () => 0, hsEnsureTicker: () => {}, hostTransfers: new Set(),
  runTransaction: (_ref, callback) => { pending = callback; return Promise.resolve({ committed: false }); },
  update: () => { throw Error('bet state must use a transaction'); }
});
dbRoom.players.a.isHost = true;
vm.runInContext(actual('hsWrite') + '\n' + actual('hsHostTick') + '\nhsHostTick();', context);
assert.equal(typeof pending, 'function');
assert.equal(pending(dbRoom).hs.bet.folded.b, true, 'timeout works if nobody acted');
dbRoom = { ...dbRoom, hs: call };
assert.equal(pending(dbRoom), undefined, 'actual host driver rejects timeout after a human call');
let armed = [], botGuesses = 0;
const hostContext = vm.createContext({ console, electedHost, transferHost, db: {}, ref: (_, path) => path,
  nowMs: () => 100000, isHost: false, currentPlayerId: 'guest', hostTransfers: new Set(),
  runTransaction: (_ref, callback, options) => {
    assert.equal(options.applyLocally, false);
    assert.equal(callback(party).players.guest.isHost, true);
    return Promise.resolve({ committed: true });
  },
  scheduleHostDeadline: (deadline, callback) => armed.push([deadline, callback]),
  checkQuestionAdvance: () => {}, checkAnswersAdvance: () => {}, checkCountdownAdvance: () => {},
  checkAnimationAdvance: () => {}, checkRevealAdvance: () => {}, checkSummaryAdvance: () => {},
  scheduleBotGuesses: () => { botGuesses++; }, scheduleBotPicks: () => {}, hsEnsureTicker: () => {}
});
vm.runInContext(actual('maybeReassignHost'), hostContext);
hostContext.room = party;
vm.runInContext('maybeReassignHost(room, "TEST")', hostContext);
assert.equal(hostContext.isHost, false, 'wait for a confirmed host election before driving the game');
hostContext.room = { ...transferred, questionEndsAt: 200, currentQuestion: {} };
vm.runInContext('maybeReassignHost(room, "TEST")', hostContext);
assert.equal(hostContext.isHost, true);
assert.equal(armed[0][0], 200);
assert.equal(botGuesses, 1);
hostContext.isHost = false; hostContext.room = { ...transferred, phase: 'countdown', countdownEndsAt: 300 };
vm.runInContext('maybeReassignHost(room, "TEST")', hostContext);
assert.equal(armed.at(-1)[0], 300, 'countdown also resumes after a transfer');
// Confirm the client uses the same atomic archive and waits for committed state.
const human = actual('hsAct');
assert.ok(human.includes('commitHsState(cur, gameId, state, { hs: next })'));
assert.ok(human.includes('applyLocally: false'));
assert.ok(source.includes('cur => admitPlayer(cur, id, player, !!staleOwnId)'));
assert.ok(source.includes('return admitPlayer(cur, botId, newPlayer)'));
assert.ok(source.includes('hsRounds: null'), 'rematches clear old round archives');

const now = 1e12, oldRoom = { lastActive: now - 26 * 3600000 };
let deletion;
await deleteIfStale({ transaction: async fn => { deletion = fn; return { committed: true }; } }, () => now);
assert.equal(deletion(oldRoom), null);
assert.equal(deletion({ ...oldRoom, players: { a: { connected: true } } }), undefined, 'reconnected room survives cleanup retry');
assert.equal(deletion({ lastActive: now }), undefined, 'recently reused room code survives cleanup retry');
assert.equal(deletion(null), undefined);
console.log('Room safety: host transfer, concurrent capacity, bet/timeout races, durable HS progress, and cleanup retries passed.');

assert(source.includes('maybeReassignHost(roomState, roomCode);'),'Periodic sweep retries election after grace without needing another room write');
