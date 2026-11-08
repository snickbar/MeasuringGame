// The bottom button bar's layout switches (anim/bottom-actions.mjs) and the rule that keeps
// style-attribute selectors out of :has(), which made every inline style change on the page slow.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bottomActionsState, installBottomActions, BAR_FLAGS } from '../anim/bottom-actions.mjs';

const ids = ['hud-auto-toggle', 'reveal-next-btn', 'reveal-all-btn', 'show-summary-btn', 'next-round-btn', 'play-again-btn', 'final-home-btn', 'final-double-coins-btn'];
const buttons = showing => ids.map(id => ({ id, hidden: !showing.includes(id) }));

// Which layout each part of a game gets.
assert.deepEqual(bottomActionsState(buttons([])), { empty: true, final: false, reveal: false }, 'Nothing showing: the bar takes no space');
assert.deepEqual(bottomActionsState(buttons(['hud-auto-toggle', 'reveal-next-btn', 'reveal-all-btn'])), { empty: false, final: false, reveal: true }, 'Solo reveal row');
assert.deepEqual(bottomActionsState(buttons(['play-again-btn', 'final-home-btn', 'final-double-coins-btn'])), { empty: false, final: true, reveal: false }, 'Final results row');
assert.deepEqual(bottomActionsState(buttons(['next-round-btn'])), { empty: false, final: false, reveal: false }, 'A lone button keeps the default layout');
assert.deepEqual(bottomActionsState(buttons(['final-double-coins-btn', 'play-again-btn'])), { empty: false, final: false, reveal: false }, 'Final row needs the Finish button itself');
assert.deepEqual(bottomActionsState(buttons(['reveal-next-btn', 'show-summary-btn'])), { empty: false, final: false, reveal: false }, 'Reveal row needs the Reveal all button itself');
assert.deepEqual(bottomActionsState(ids.map(id => ({ id, hidden: false }))), { empty: false, final: true, reveal: true }, 'Both can hold at once, exactly as the old selectors allowed');
assert.deepEqual(bottomActionsState([]), { empty: true, final: false, reveal: false }, 'An empty bar is empty');

// The install: starts in sync, follows later changes, and writes an attribute only when its answer changed.
const observers = [];
globalThis.MutationObserver = class { constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); } observe(target, options) { this.target = target; this.options = options; } disconnect() { this.disconnected = true; } };
const flags = new Set(), writes = [];
const bar = {
  children: ids.map(id => ({ tagName: 'BUTTON', id, style: { display: 'none' } })).concat([{ tagName: 'SPAN', id: 'decoration', style: { display: '' } }]),
  hasAttribute: name => flags.has(name),
  toggleAttribute(name, on) { writes.push(name); on ? flags.add(name) : flags.delete(name); }
};
const doc = { getElementById: id => id === 'bottom-actions' ? bar : null };
const button = id => bar.children.find(el => el.id === id);
const handle = installBottomActions({ document: doc });
assert.deepEqual([...flags], [BAR_FLAGS.empty], 'Starts empty: every button is hidden, and the span is not a button');
assert.deepEqual(observers[0].options, { attributes: true, attributeFilter: ['style'], subtree: true, childList: true }, 'Only the bar\'s own buttons are watched, and only their inline style');
assert.equal(observers[0].target, bar);

writes.length = 0;
button('reveal-all-btn').style.display = 'flex'; observers[0].callback([]);
assert.deepEqual([...flags].sort(), [BAR_FLAGS.reveal], 'Showing Reveal all switches on the reveal layout and clears empty');
button('reveal-all-btn').style.display = 'block'; observers[0].callback([]);
writes.length = 0;
observers[0].callback([]);
assert.equal(writes.length, 0, 'Repeating the same state writes nothing');
button('final-home-btn').style.display = 'flex'; button('reveal-all-btn').style.display = 'none'; observers[0].callback([]);
assert.deepEqual([...flags], [BAR_FLAGS.final], 'Moving from the reveal row to the final row swaps the layouts');
button('final-home-btn').style.display = 'none'; observers[0].callback([]);
assert.deepEqual([...flags], [BAR_FLAGS.empty], 'Hiding everything empties the bar again');
button('next-round-btn').style.display = ''; handle.sync();
assert.deepEqual([...flags], [], 'A button with no inline display counts as showing');
handle.destroy();
assert(observers[0].disconnected, 'destroy stops watching');
assert.equal(installBottomActions({ document: { getElementById: () => null } }).sync(), undefined, 'A page without the bar is left alone');

// The page itself: bar starts empty for the first paint, uses the switches, and nothing uses style selectors inside :has().
const html = fs.readFileSync('index.html', 'utf8');
assert(/<div id="bottom-actions" data-bar-empty>/.test(html), 'The bar starts empty in the markup, before any script runs');
assert(html.includes('import { installBottomActions } from "./anim/bottom-actions.mjs";') && /\n\s*installBottomActions\(\);/.test(html), 'The page starts the bar switches');
for (const rule of ['#bottom-actions[data-bar-empty] { display: none; }', '#bottom-actions[data-bar-final] button {', '#bottom-actions[data-bar-reveal] #hud-auto-toggle {', '#bottom-actions[data-bar-reveal] :is(#reveal-next-btn,#reveal-all-btn) {'])
  assert(html.includes(rule), 'Bar layout rule present: ' + rule);

// An attribute selector on "style" inside :has() makes the browser re-check the whole page whenever any element's
// inline style changes. Measured at 1.5 ms per change on a fast computer; keep such selectors out of every stylesheet.
function hasArguments(css) {
  const found = [];
  for (let i = css.indexOf(':has('); i >= 0; i = css.indexOf(':has(', i + 1)) {
    let depth = 0, j = i + 4;
    for (; j < css.length; j++) { if (css[j] === '(') depth++; else if (css[j] === ')' && --depth === 0) break; }
    found.push(css.slice(i, j + 1));
  }
  return found;
}
const sheets = [['index.html', html], ...fs.readdirSync('anim').filter(name => name.endsWith('.css')).map(name => ['anim/' + name, fs.readFileSync('anim/' + name, 'utf8')])];
for (const [name, css] of sheets)
  for (const argument of hasArguments(css))
    assert(!/\[\s*style\b/.test(argument), `${name}: ${argument.slice(0, 90)}… tests the style attribute inside :has(); toggle a data attribute instead (see anim/bottom-actions.mjs)`);

console.log('Bottom actions: layout switches, observer wiring, initial markup and the no-style-selector-in-:has() guard passed.');
