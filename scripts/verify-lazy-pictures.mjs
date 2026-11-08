// The avatar collection (Style > Avatars) draws 300+ pictures; only the first screenful loads at once and the rest wake
// as they scroll near (anim/lazy-pictures.mjs). Opening Style used to start 311 image requests, about 1.8 s of main-thread
// work on a slow phone.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EAGER_PICTURES, WAKE_MARGIN, pictureSrcAttr, pictureSrc, installLazyPictures } from '../anim/lazy-pictures.mjs';

// Which pictures load straight away.
assert.equal(pictureSrcAttr('avatars/fox.png', 0), 'src="avatars/fox.png"');
assert.equal(pictureSrcAttr('avatars/fox.png', EAGER_PICTURES - 1), 'src="avatars/fox.png"');
assert.equal(pictureSrcAttr('avatars/fox.png', EAGER_PICTURES), 'data-src="avatars/fox.png" decoding="async"', 'Past the first screenful the picture waits');
assert.equal(pictureSrcAttr('a.png', 5, 5), 'data-src="a.png" decoding="async"');
assert.equal(pictureSrcAttr('a.png', 4, 5), 'src="a.png"');

// Reading a picture's address, awake or asleep.
const fakeImg = attrs => ({ attrs: { ...attrs }, getAttribute(n) { return n in this.attrs ? this.attrs[n] : null; }, setAttribute(n, v) { this.attrs[n] = v; }, removeAttribute(n) { delete this.attrs[n]; } });
assert.equal(pictureSrc(fakeImg({ src: 'avatars/a.png' })), 'avatars/a.png');
assert.equal(pictureSrc(fakeImg({ 'data-src': 'avatars/b.png' })), 'avatars/b.png', 'A sleeping picture still says which avatar it is');
assert.equal(pictureSrc(fakeImg({})), '');
assert.equal(pictureSrc(null), '');

// Waking: nothing before the picture is near, the real src when it is, once.
const sleepers = ['a', 'b', 'c'].map(n => fakeImg({ 'data-src': `avatars/${n}.png`, decoding: 'async' }));
const awake = fakeImg({ src: 'avatars/z.png' });
const root = { querySelectorAll: selector => { assert.equal(selector, 'img[data-src]', 'Only sleeping pictures are watched'); return sleepers.filter(i => i.getAttribute('data-src')); } };
const made = [];
class FakeObserver {
  constructor(callback, options) { this.callback = callback; this.options = options; this.watching = new Set(); this.unobserved = []; this.disconnected = false; made.push(this); }
  observe(target) { this.watching.add(target); }
  unobserve(target) { this.watching.delete(target); this.unobserved.push(target); }
  disconnect() { this.disconnected = true; }
}
const scroller = { name: 'the panel the grid scrolls in' };
const stop = installLazyPictures(root, { scroller, observer: FakeObserver });
assert.equal(made.length, 1);
assert.deepEqual(made[0].options, { root: scroller, rootMargin: WAKE_MARGIN }, 'The lead-in is measured from the element that scrolls');
assert.equal(made[0].watching.size, 3);
made[0].callback([{ target: sleepers[0], isIntersecting: false }]);
assert.equal(sleepers[0].getAttribute('src'), null, 'A picture that is not near stays asleep');
made[0].callback([{ target: sleepers[1], isIntersecting: true }, { target: sleepers[2], isIntersecting: false }]);
assert.equal(sleepers[1].getAttribute('src'), 'avatars/b.png', 'A picture that comes near gets its src');
assert.equal(sleepers[1].getAttribute('data-src'), null);
assert.deepEqual(made[0].unobserved, [sleepers[1]], 'It is not watched again');
assert.equal(sleepers[2].getAttribute('src'), null);
made[0].callback([{ target: sleepers[1], isIntersecting: true }]);
assert.equal(sleepers[1].getAttribute('src'), 'avatars/b.png', 'A repeat notice changes nothing');
stop();
assert(made[0].disconnected, 'Stopping ends the watching (the grid was drawn again)');

// Without an observer every picture loads at once; with nothing asleep nothing is created.
const solo = [fakeImg({ 'data-src': 'avatars/q.png' })];
installLazyPictures({ querySelectorAll: () => solo }, { observer: undefined });
assert.equal(solo[0].getAttribute('src'), 'avatars/q.png', 'No way to tell what is near, so nothing is left blank');
made.length = 0;
installLazyPictures({ querySelectorAll: () => [] }, { observer: FakeObserver })();
assert.equal(made.length, 0, 'Nothing asleep, nothing watched');
assert.equal(awake.getAttribute('src'), 'avatars/z.png');

// The page: the collection grid uses all of it, and the stop handle exists before the grid can first be drawn.
const html = fs.readFileSync('index.html', 'utf8');
assert(html.includes('import { pictureSrcAttr, pictureSrc, installLazyPictures } from "./anim/lazy-pictures.mjs";'), 'The page loads the helper');
assert(html.includes('avatarHtml(a, "", position++)'), 'The collection tiles count their position across all groups');
assert(html.includes('installLazyPictures(collectionContentEl, { scroller: document.getElementById("shop-tab-avatars") })'), 'The grid wakes pictures relative to its own scroll panel');
assert(html.includes('pictureSrc(img).match(/avatars'), 'Tapping a picture that is still asleep still finds its avatar');
assert(html.indexOf('let stopCollectionLazy') > 0 && html.indexOf('let stopCollectionLazy') < html.indexOf('function renderCollectionScreen'), 'The stop handle is declared before the grid can be drawn');

console.log('Lazy pictures: eager window, wake on approach, once only, stop, no-observer fallback, and the avatar collection wiring passed.');
