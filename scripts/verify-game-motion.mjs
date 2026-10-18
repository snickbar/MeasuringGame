import assert from 'node:assert/strict';
import { createSubmissionMotion, createLeadMotion, SUBMISSION_BOUNCE_MS } from '../anim/game-motion.mjs';

let now = 0;
const events = [];
const motion = createSubmissionMotion({ bounce: id => events.push({ id, at: now }), random: () => .99 });
const room = { roomCode: 'TEST', gameId: 'one', round: 1, phase: 'question',
  players: { human: {}, b1: { isBot: true }, b2: { isBot: true }, b3: { isBot: true } },
  currentQuestion: { powerupKey: 'q1' }, guesses: {}, questionEndsAt: 30000 };
function tick(at) { now = at; motion.update(room, now); }
room.guesses.human = 0; tick(1000);
assert.deepEqual(events, [{ id: 'human', at: 1000 }], 'zero is a real submission');
room.guesses.b1 = 2; tick(1100);
room.guesses.b2 = 3; tick(1500);
tick(2300); assert.equal(events[1].id, 'b1');
tick(2700); assert.equal(events[2].id, 'b2');
room.graceEndsAt = 4000;
room.guesses.b3 = 4; tick(3300); tick(3500);
assert.equal(events[3].id, 'b3', 'new grace deadline clamps a delayed bot bounce');
assert(events.every(e => e.at + SUBMISSION_BOUNCE_MS <= room.graceEndsAt));
tick(3600); assert.equal(events.length, 4, 'snapshots cannot replay submissions');
room.round = 2; room.guesses = { b1: 1 }; room.graceEndsAt = 10000; tick(5000);
room.phase = 'answers'; tick(5100); tick(8000);
assert.equal(events.length, 4, 'leaving question cancels pending reactions');
room.phase = 'question'; room.round = 3; room.paused = true; tick(9000); tick(9900);
assert.equal(events.length, 4, 'pause suppresses reactions');
room.paused = false; room.graceEndsAt = 14000; tick(11000);
assert.equal(events.length, 5, 'paused reaction resumes within extended deadline');
room.round = 4; room.guesses = { human: 2, b1: 1 }; room.graceEndsAt = 11100; tick(11050);
assert.equal(events.length, 5, 'no bounce that would finish after the deadline');

// Several random bot timings, a shortened grace timer, and 200ms HUD ticks.
for (const r of [0, .1, .5, .9, .999]) {
  const ends = [];
  const bots = createSubmissionMotion({ random: () => r, bounce: id => ends.push(now + SUBMISSION_BOUNCE_MS) });
  const state = { ...room, guesses: { b1: 1, b2: 2, b3: 3 }, graceEndsAt: 16000 };
  for (now = 15000; now <= 16000; now += 200) bots.update(state, now);
  assert.equal(ends.length, 3); assert(ends.every(end => end <= 16000));
}
const leader = createLeadMotion();
const ranks = (a,b) => [{ id: 'a', score: a, rank: a >= b ? 1 : 2 }, { id: 'b', score: b, rank: b >= a ? 1 : 2 }];
assert.equal(leader('g1', ranks(0,0)), null);
assert.equal(leader('g1', ranks(3,0)), 'a', 'first positive sole leader celebrates');
assert.equal(leader('g1', ranks(3,0)), null);
assert.equal(leader('g1', ranks(3,3)), null, 'ties do not announce a sole leader');
assert.equal(leader('g1', ranks(3,6)), 'b', 'overtaking celebrates');
assert.equal(leader('g2', ranks(3,6)), null, 'reconnect/new room establishes a baseline');
console.log('Game motion: submission timing, deadline clamps, pauses, cancellation, deduplication and lead changes passed.');
