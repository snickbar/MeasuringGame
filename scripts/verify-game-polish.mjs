import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createPolish } from '../anim/game-polish.mjs';

const timers = [], sounds = [], classes = () => {
  const values = new Set();
  return { add: value => values.add(value), remove: value => values.delete(value), has: value => values.has(value) };
};
const stars = Array.from({ length: 3 }, () => ({ classList: classes() }));
let showing = true, reduced = false;
const group = { dataset: { celebrationKey: 'one-attempt' }, isConnected: true, closest: () => null,
  getClientRects: () => showing ? [{}] : [], querySelectorAll: () => stars };
const value = { textContent: '5', isConnected: true, closest: () => null, getClientRects: () => [{}] };
const receipt = { isConnected: true, closest: () => null, getClientRects: () => [{}], querySelector: () => value };
const doc = { body: {}, querySelectorAll: selector => selector === '[data-result-stars]' ? [group] : [],
  createTreeWalker: () => ({ nextNode: () => false }), getElementById: () => null };
const originalTimer = globalThis.setTimeout, originalObserver = globalThis.MutationObserver;
globalThis.setTimeout = (fn, delay) => { timers.push({ fn, delay }); return timers.length; };
globalThis.MutationObserver = class { observe() {} disconnect() {} };
try {
  const effects = createPolish({ document: doc, reduced: () => reduced, sound: event => sounds.push(event) });
  assert.deepEqual(timers.map(t => t.delay), [350, 930, 1510]);
  assert(stars.every(s => s.classList.has('polish-star-wait')));
  effects.refresh(doc);
  assert.equal(timers.length, 3, 'rerender does not replay an earned result');
  timers[0].fn(); timers[1].fn(); timers[2].fn();
  assert.deepEqual(sounds, ['star', 'star', 'star']);
  assert(stars.every(s => s.classList.has('polish-star-earned')));
  reduced = true;
  effects.reward({ element: receipt, total: 10, added: 5, key: 'double' });
  assert.equal(value.textContent, '10', 'reduced motion shows the accurate total immediately');
  effects.reward({ element: receipt, total: 10, added: 5, key: 'double' });
  assert.equal(sounds.filter(s => s === 'coins').length, 1, 'receipt refresh never repeats its sound');
  group.dataset.celebrationKey = 'reduced-attempt'; effects.refresh(doc);
  assert.equal(timers.length, 3, 'reduced motion does not schedule bouncing stars');
  reduced = false; showing = false; group.dataset.celebrationKey = 'hidden-attempt'; effects.refresh(doc);
  assert.equal(timers.length, 3, 'hidden screen does not celebrate');
  showing = true; effects.refresh(doc);
  assert.equal(timers.length, 6, 'hidden attempt can celebrate when actually displayed');
  effects.destroy();
} finally { globalThis.setTimeout = originalTimer; globalThis.MutationObserver = originalObserver; }

const source = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert(source.includes('onReward: event => gamePolish?.reward(event)'));
assert(source.includes('data-celebration-key="${wl.runId}"'));
assert(source.includes('flairIdFor({ flair: p.flair })'));
assert(source.includes('playSound("lead")'));
assert(!source.includes('"icons/coin.png"'));
assert(fs.existsSync(new URL('../icons/coin-v2.png', import.meta.url)));
const fitting = fs.readFileSync(new URL('../anim/auto-fit.mjs', import.meta.url), 'utf8');
assert(!/setProperty\(['"](?:height|min-height|max-height)['"]/.test(fitting), 'label fitting must never resize illustrated button heights');
assert(!fitting.includes("'anywhere'"), 'label fitting must not split words into fragments');
console.log('Game polish: sequential stars, repeat suppression, hidden/reduced states, reward totals, sound deduplication, flair and repaired artwork passed.');
