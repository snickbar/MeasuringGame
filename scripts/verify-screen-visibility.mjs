import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {enforceSingleScreen} from '../anim/screen-visibility.mjs';

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
assert(source.includes('.screen:not(.active), #hud:not(.active) { display: none !important; }'),'Inactive screens override inline layout styles');
assert(source.includes('phase === "final" && !overlayStillOpen'),'Late final updates respect the open menu');
assert(source.includes('phase === "ended" && !overlayStillOpen'),'Late ended updates respect the open menu');

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
// Every kind of menu wins over every kind of room/terminal screen, including
// delayed renders and inline layout styles left behind by animation code.
for(const menuId of ['settings','shop','style','stats','objects','awards','howto','worlds','survival']){
 for(const gameId of ['lobby','hud','final-screen','hs-screen','bluff-screen','left-screen','ended-screen']){
  const menu={...active(),id:menuId},game={...active(),id:gameId},bar={...active(),id:'bar'};
  const args={screens:[game,menu],menus:[menu],terminals:[game],chrome:[bar]};
  assert.equal(enforceSingleScreen(args),menu);assert(!game.classList.contains('active'));assert(!bar.classList.contains('active'));
  game.classList.add('active');assert.equal(enforceSingleScreen(args),menu,'Late callback cannot show old game behind menu');
  menu.classList.remove('active');game.classList.add('active');assert.equal(enforceSingleScreen(args),game,'Explicit return restores game normally');
 }
}
{const game={...active(),id:'hud'},end={...active(),id:'ended-screen'};assert.equal(enforceSingleScreen({screens:[game,end],menus:[],terminals:[end]}),end);assert(!game.classList.contains('active'));}
let stopped = null, scroll = null, revealCancelled = 0;
const context = vm.createContext({
  ALL_SCREEN_ELS: [board, left, overlay], leftScreenEl: left,
  hudRoomCodeGroupEl: active(), hudRoundLabelEl: active(), bottomToolbarEl: active(),
  kickModalEl: active(), pausedOverlayEl: active(), hudSubToolbarEl: active(), leftReasonEl: {},
  document: {getElementById: docElement}, fillExitStats() {},
  window: {scrollTo: (...args) => {scroll = args;}},
  hsTickHandle: 42, clearInterval: handle => {stopped = handle;},
  leavingGame: true,
  cancelRevealEffects: () => {revealCancelled++;},
  currentPlayers: {me: {avatar: 'av07'}}, currentPlayerId: 'me', currentAvatar: 'av01',
});
for (const name of ['avatarHtml', 'gameOutcomeArt', 'hsEnsureTicker', 'showLeftScreen', 'hsHostTick', 'renderHighStakes']) {
  const fn = source.match(new RegExp('  function ' + name + '\\([^\\n]+\\{[\\s\\S]*?\\n  \\}'));
  assert(fn, `Missing function ${name}`);
  vm.runInContext(fn[0], context);
}
context.showLeftScreen('Closed', {title: 'You ended the game'});
assert.equal(revealCancelled, 1, 'Leaving cancels active reveal animations and callbacks');
assert.equal(board.classList.contains('active'), false);
assert.equal(overlay.classList.contains('active'), false);
assert.equal(left.classList.contains('active'), true);
assert.equal(stopped, 42);
assert.equal(context.hsTickHandle, null);
assert.equal(docElement('hs-turn-toast').removed, true);
assert.match(docElement('left-icon').innerHTML, /avatars\/av07\.png/);
assert.match(docElement('left-icon').innerHTML, /icons\/reactions\/wave\.png/);
assert.match(context.gameOutcomeArt('icons/reactions/trophy.png', 'av19'), /avatars\/av19\.png/);
assert.deepEqual(scroll, [0, 0]);
// Late callbacks after leaving must not access room state or redraw the board.
context.hsHostTick();
context.renderHighStakes(null);
console.log('PASS: inactive-screen CSS coverage, exclusive exit recap, timer/toast cleanup, scroll reset and late High Stakes callback guards.');
