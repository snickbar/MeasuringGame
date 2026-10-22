import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('index.html', 'utf8');
const hiddenRule = source.match(/#home-screen,[^\r\n]+\{ display: none; \}/)[0];
// Every top-level screen must actually become invisible when its active class is removed.
for (const tag of source.matchAll(/<div\b[^>]+>/g)) {
  const classes = tag[0].match(/class="([^"]*)"/)?.[1].split(/\s+/) || [];
  if (!classes.includes('screen')) continue;
  const id = tag[0].match(/id="([^"]+)"/)?.[1];
  assert(hiddenRule.includes(`#${id},`) || hiddenRule.includes(`#${id} {`), `Inactive screen missing hide rule: ${id}`);
}
assert(source.includes('#hs-screen.active'));

const active = () => {
  const classes = new Set(['active']);
  return {classList: {remove: c => classes.delete(c), add: c => classes.add(c), contains: c => classes.has(c)}};
};
const elements = new Map();
const docElement = id => {
  if (!elements.has(id)) elements.set(id, {...active(), dataset: {}, textContent: '', innerHTML: '', remove() {this.removed = true;}});
  return elements.get(id);
};
const board = active(), left = active(), overlay = active();
let stopped = null, scroll = null;
const context = vm.createContext({
  ALL_SCREEN_ELS: [board, left, overlay], leftScreenEl: left,
  hudRoomCodeGroupEl: active(), hudRoundLabelEl: active(), bottomToolbarEl: active(),
  kickModalEl: active(), pausedOverlayEl: active(), hudSubToolbarEl: active(), leftReasonEl: {},
  document: {getElementById: docElement}, fillExitStats() {},
  window: {scrollTo: (...args) => {scroll = args;}},
  hsTickHandle: 42, clearInterval: handle => {stopped = handle;},
  leavingGame: true,
});
for (const name of ['hsEnsureTicker', 'showLeftScreen', 'hsHostTick', 'renderHighStakes']) {
  const fn = source.match(new RegExp('  function ' + name + '\\([^\\n]+\\{[\\s\\S]*?\\n  \\}'));
  assert(fn, `Missing function ${name}`);
  vm.runInContext(fn[0], context);
}
context.showLeftScreen('Closed', {title: 'You ended the game'});
assert.equal(board.classList.contains('active'), false);
assert.equal(overlay.classList.contains('active'), false);
assert.equal(left.classList.contains('active'), true);
assert.equal(stopped, 42);
assert.equal(context.hsTickHandle, null);
assert.equal(docElement('hs-turn-toast').removed, true);
assert.deepEqual(scroll, [0, 0]);
// Late callbacks after leaving must not access room state or redraw the board.
context.hsHostTick();
context.renderHighStakes(null);
console.log('PASS: inactive-screen CSS coverage, exclusive exit recap, timer/toast cleanup, scroll reset and late High Stakes callback guards.');
