import assert from 'node:assert/strict';
import { escalateSteps, makeChainGate, ROMAN_SUFFIX, MAX_TIERS, REWARD_CAP } from '../anim/award-tiers.mjs';

// Escalation keeps the hand-made tiers, then climbs without repeating or shrinking.
for (const [steps, opts] of [
  [[[1, 10], [10, 40], [50, 150]], {}], [[[3, 40], [5, 120]], { ratio: 1.35, total: 8 }],
  [[[1, 75], [5, 250]], { ratio: 1.8 }], [[[10, 20]], { ratio: 2, total: 6 }], [[[1, 25], [10, 100], [50, 300]], {}],
]) {
  const out = escalateSteps(steps, opts);
  assert.equal(out.length, opts.total || MAX_TIERS);
  steps.forEach((s, i) => assert.deepEqual(out[i], s, 'hand-made tiers (and their ids) never change'));
  out.forEach(([t, r], i) => {
    if (i) { assert(t > out[i - 1][0], 'targets strictly increase'); assert(r >= out[i - 1][1], 'rewards never shrink'); }
    if (i >= steps.length) assert(r <= Math.max(REWARD_CAP, steps[steps.length - 1][1]), 'new rewards stay capped');
  });
}
assert.equal(ROMAN_SUFFIX.length, MAX_TIERS);

// Only the next unclaimed tier of a chain is open, even when later targets are already reached.
const claimed = {};
const chain = [30, 45, 60].map((target, tier) => ({ id: 't' + tier, chain: 'c', tier, target }));
const solo = { id: 'solo' };
const open = makeChainGate([...chain, solo], a => !!claimed[a.id]);
assert(open(solo));
assert.deepEqual(chain.map(open), [true, false, false], 'progress 50 still shows only tier 1');
claimed.t0 = true;
assert.deepEqual(chain.map(open), [true, true, false], 'tier 2 appears next (and is claimable at once)');
claimed.t1 = true;
assert.deepEqual(chain.map(open), [true, true, true]);
console.log('PASS: escalating tiers keep old ids, never shrink, cap rewards and reveal one tier at a time.');
