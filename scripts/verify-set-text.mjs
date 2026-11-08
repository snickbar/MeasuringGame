// setText() (anim/set-text.mjs): numbers that change every frame are edited in place, and everything else behaves
// exactly like `el.textContent = value`.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { setText } from '../anim/set-text.mjs';

// A small stand-in for the parts of an element that setText touches.
function textNode(data) {
  const node = { nodeType: 3, parent: null, dataWrites: 0, _data: data };
  Object.defineProperty(node, 'data', { get() { return this._data; }, set(v) { this._data = v; this.dataWrites++; } });
  Object.defineProperty(node, 'nextSibling', { get() { const kids = this.parent ? this.parent.children : []; return kids[kids.indexOf(this) + 1] || null; } });
  return node;
}
function otherNode(nodeType, textContent = '') { return { nodeType, parent: null, textContent, get nextSibling() { const kids = this.parent.children; return kids[kids.indexOf(this) + 1] || null; } }; }
function fakeElement(...children) {
  const el = {
    children, replacements: 0,
    get firstChild() { return this.children[0] || null; },
    get textContent() { return this.children.map(c => c.nodeType === 3 ? c.data : c.textContent).join(''); },
    set textContent(v) { this.replacements++; this.children = v === '' ? [] : [textNode(v)]; this.children.forEach(c => { c.parent = this; }); },
  };
  children.forEach(c => { c.parent = el; });
  return el;
}

// One text node: edited where it stands, never replaced.
{
  const node = textNode('0'), el = fakeElement(node);
  setText(el, '125');
  assert.equal(el.textContent, '125');
  assert.equal(el.firstChild, node, 'The same text node is kept');
  assert.equal(el.replacements, 0, 'Nothing is thrown away and rebuilt');
  assert.equal(node.dataWrites, 1);
  setText(el, '125');
  assert.equal(node.dataWrites, 1, 'The same words are not written again');
  setText(el, 3400);
  assert.equal(el.textContent, '3400', 'Numbers become text');
  assert.equal(el.firstChild, node);
  assert.equal(node.dataWrites, 2);
}

// Everything else is what textContent does.
{
  const el = fakeElement();
  setText(el, '7');
  assert.equal(el.textContent, '7', 'An empty element gets its text');
  assert.equal(el.replacements, 1);
}
{
  const node = textNode('9'), el = fakeElement(node);
  setText(el, '');
  assert.equal(el.textContent, '', 'Empty words empty the element');
  assert.equal(el.children.length, 0, 'No empty text node is left behind');
  assert.equal(el.replacements, 1);
}
{
  const el = fakeElement(textNode('Level '), otherNode(1, '4'));
  setText(el, 'Level 5');
  assert.equal(el.children.length, 1, 'Mixed content collapses to one text node, like textContent');
  assert.equal(el.textContent, 'Level 5');
  assert.equal(el.replacements, 1);
}
{
  const el = fakeElement(otherNode(1, 'old'));
  setText(el, 'new');
  assert.equal(el.children.length, 1);
  assert.equal(el.children[0].nodeType, 3, 'A lone child element is replaced by text');
  assert.equal(el.textContent, 'new');
}
{
  const el = fakeElement(otherNode(8, 'a comment'));
  setText(el, 'x');
  assert.equal(el.replacements, 1, 'Only a text node is edited in place');
}
{
  const el = fakeElement(textNode('a'), textNode('b'));
  setText(el, 'c');
  assert.equal(el.children.length, 1, 'Two text nodes are merged into one, like textContent');
  assert.equal(el.textContent, 'c');
}

// The page: the count-up on the Awards screen uses it, and no other per-frame loop in that block swaps the text node.
const html = fs.readFileSync('index.html', 'utf8');
assert(html.includes('import { setText } from "./anim/set-text.mjs";'), 'The page imports setText');
const start = html.indexOf('// Stats motion: when a stats view is drawn'), end = html.indexOf('// Which Is Bigger has runs', start);
assert(start > 0 && end > start, 'Found the stats motion block');
const motion = html.slice(start, end);
const step = motion.slice(motion.indexOf('const step = '), motion.indexOf('requestAnimationFrame(step);'));
assert(/setText\(el,/.test(step), 'The count-up writes each frame with setText');
assert(!/textContent\s*=/.test(step), 'The count-up frame does not replace the text node');

// Every other number that counts up (or ticks) frame by frame is written the same way. A new count-up should be added here too.
const modules = file => fs.readFileSync(file, 'utf8');
const wired = [
  ['index.html', html, [
    'setText(el, fmt(to * (1 - Math.pow(1 - k, 3))))',                         // result numbers (+23 coins, ...)
    'shown = n; setText(toolbarCoinCountEl, formatCoinDisplay(n))',              // the toolbar coin counter, on every screen
    'setText(n, "+" + v)',                                                       // level-up coins
    'setText(el, formatAccuracy(to * e) + suffix)',                              // team average
    'setText(el, formatAccuracy(from + (to - from) * e) + suffix)',              // game average
    'setText(num, Math.round(from + (rank - from) * e))',                        // survival rank
    'setText(numEl, hsFmt(total - given))',                                      // High Stakes pot
    'setText(el, "+" + shown)',                                                  // Which Is Bigger run coins
  ]],
  ['anim/bluff-ui.mjs', modules('anim/bluff-ui.mjs'), ["import {setText} from './set-text.mjs'", 'setText(el,String(Math.round(to*(1-Math.pow(1-k,3)))))']],
  ['anim/mode-tutorial.mjs', modules('anim/mode-tutorial.mjs'), ["import {setText} from './set-text.mjs'", "setText(num, Math.round(to * (1 - Math.pow(1 - k, 3))) + '%')"]],
  ['anim/round-score-reveal.mjs', modules('anim/round-score-reveal.mjs'), ["import { setText } from './set-text.mjs'", 'setText(row.counter, text)']],
  ['anim/game-polish.mjs', modules('anim/game-polish.mjs'), ["import { setText } from './set-text.mjs'", 'setText(el, String(Math.round(from + (to - from) * (1 - (1 - t) ** 3))))']],
];
for (const [file, text, needles] of wired)
  for (const needle of needles) assert(text.includes(needle), `${file} writes its counting number with setText: ${needle}`);

console.log('setText: in-place edits, textContent-equivalent fallbacks and the count-up wiring passed.');
