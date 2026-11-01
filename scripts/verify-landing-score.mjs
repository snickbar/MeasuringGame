import assert from 'node:assert/strict';
import {drawLandingEffect, landingSurfaceFor} from '../anim/landing-effects.mjs';
import {roundScoreFrame} from '../anim/round-score-reveal.mjs';

const render = (surface, age = .15, options = {}) => {
  const calls = [];
  const ctx = new Proxy({}, {
    set(_, key, value) { calls.push([key, value]); return true; },
    get(_, key) { return (...args) => { assert(args.every(v => typeof v !== 'number' || Number.isFinite(v))); calls.push([key, ...args]); }; }
  });
  drawLandingEffect(ctx, {surface, age, x:100, y:200, width:80, objectMm:1000, ...options});
  return calls;
};
const expected = {snow:'snow', desert:'sand', beach:'sand', space:'dust', underwater:'bubbles', forest:'grass', farm:'grass', stadium:'grass', enchanted:'grass', living:'hard', kitchen:'hard', tabletop:'hard', city:'hard'};
for (const [scene, surface] of Object.entries(expected)) assert.equal(landingSurfaceFor(scene), surface);
for (const surface of [...new Set(Object.values(expected)), 'water']) {
  assert(render(surface).some(c => c[0] === 'stroke' || c[0] === 'fill'));
  assert.deepEqual(render(surface), render(surface), 'seeking is deterministic');
  assert.deepEqual(render(surface, -1), []);
  assert.deepEqual(render(surface, 3), []);
  assert.deepEqual(render(surface, .15, {reduced:true}), []);
  assert.deepEqual(render(surface, .15, {stacked:true}), render('hard'), 'upper stack contacts never throw ground particles');
}
assert.notDeepEqual(render('snow'), render('sand'));
assert.notDeepEqual(render('bubbles'), render('water'));
assert.equal(roundScoreFrame([3,2,3],8,0).value, 0);
assert.equal(roundScoreFrame([3,2,3],8,500).value, 3);
assert.equal(roundScoreFrame([3,2,3],8,1000).value, 5);
assert.deepEqual(roundScoreFrame([3,2,3],8,500).steps.map(s=>s.visible), [true,false,false]);
assert.equal(roundScoreFrame([3,2,3],8,1700).value, 8);
assert(roundScoreFrame([3,2,3],8,1700).complete);
for (const [amounts,total] of [[[5],5],[[3,2,3],8],[[5,5],5],[[],0],[[],3],[Array(30).fill(2),60]]) {
  let previous = 0;
  for(let age=0;age<=4000;age+=10) {
    const frame = roundScoreFrame(amounts,total,age);
    assert(frame.value >= previous && frame.value <= total); previous=frame.value;
    assert(frame.finishAt < 3000, 'sequence fits existing summary auto timing');
  }
  assert.equal(previous,total);
}
console.log('PASS: surface-specific deterministic landings, reduced motion, stacked contacts, staged points, bounded tied team totals and existing summary timing.');
