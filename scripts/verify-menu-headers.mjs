import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MENU_BANNERS, applyMenuBanner, createPolish} from '../anim/game-polish.mjs';

const source = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('anim/game-polish.css', 'utf8');
function element(mode, baseURI = 'https://example.test/game/index.html') {
  const children = [], styles = {}, classes = new Set();
  const doc = {baseURI, createElement: () => ({remove() {children.splice(children.indexOf(this), 1);}})};
  return {ownerDocument: doc, dataset: {}, styles, children, classes,
    classList: {add: cls => classes.add(cls)}, style: {setProperty: (key, value) => {styles[key] = value;}},
    querySelector: () => children.find(c => c.className === 'polish-banner-icon'), prepend: img => children.unshift(img),
    parentElement: {id: 'teamvteam-content'}, textContent: mode};
}
for (const [mode, [banner, icon]] of Object.entries(MENU_BANNERS)) {
  assert(fs.existsSync(banner));
  if (icon) assert(fs.existsSync(icon));
  assert(source.includes(`"${banner}"`), `${mode} header must reuse the menu graphic`);
  const header = element(mode);
  applyMenuBanner(header, mode); applyMenuBanner(header, mode);
  assert.equal(header.dataset.menuBanner, mode);
  assert.equal(header.dataset.fitSingleLine, 'true', 'shrink title text rather than wrap or stretch the banner');
  assert.equal(header.styles['--menu-banner'], `url("https://example.test/game/${banner}")`, 'resolve relative to app, not the CSS folder');
  assert.equal(header.children.length, icon ? 1 : 0, 'embedded artwork must not receive a duplicate icon');
  if (icon) assert.equal(header.children[0].src, icon);
  const local = element(mode, 'file:///C:/Projects/MeasuringGame/index.html');
  applyMenuBanner(local, mode);
  assert(local.styles['--menu-banner'].includes(`file:///C:/Projects/MeasuringGame/${banner}`));
}

// Party intro pages share a container; its last-used mode must never leak into the next title.
const titles = ['Classic Party', 'High/Low Survival', 'High Stakes', 'Team vs Team'].map(name => element(name));
const doc = {body: {}, querySelectorAll: selector => selector.startsWith('.dc-title') ? titles : [],
  createTreeWalker: () => ({nextNode: () => false})};
const previous = globalThis.MutationObserver;
globalThis.MutationObserver = class {observe() {} disconnect() {}};
try {
  const polish = createPolish({document: doc});
  assert.deepEqual(titles.map(t => t.dataset.menuBanner), ['classic', 'hlsurvival', 'highstakes', 'teamvteam']);
  polish.destroy();
} finally {globalThis.MutationObserver = previous;}
assert.match(css, /aspect-ratio:1000\/222/);
assert.match(css, /\.dc-title\.polish-banner\.matching-mode-banner \+ \.dc-sub,/);
assert(source.includes('applyMenuBanner(createRoomBtn, createMode === "solo" ? "quick" : createMode)'));
console.log('PASS: ten matching menu headers, app-relative and local-file artwork, no duplicate icons, shared Party containers and Quick Game action.');
