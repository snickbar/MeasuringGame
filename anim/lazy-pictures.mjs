// A long grid of pictures (the 300+ avatars in Style) used to ask for every picture the moment it was drawn. On a slow
// phone that meant hundreds of requests and decodes, about 1.8 s of main-thread work, before the screen settled, even
// though only the first few rows can be seen. Pictures after the first screenful are written as `data-src` and get their
// real `src` when they scroll near the visible part.
//
// The browser's own loading="lazy" is not enough here: it still loads everything within about 1250 px of the screen,
// which for a grid this dense is more than half of it.

export const EAGER_PICTURES = 36; // roughly the first screenful of the avatar grid
export const WAKE_MARGIN = '450px 0px'; // start loading when a picture is this close to the visible part

// The src attribute for the picture at `position` in a long grid.
export function pictureSrcAttr(src, position, eager = EAGER_PICTURES) {
  return position < eager ? `src="${src}"` : `data-src="${src}" decoding="async"`;
}

// The address of a picture, whether it has woken up yet or not.
export function pictureSrc(img) {
  return (img && (img.getAttribute('src') || img.getAttribute('data-src'))) || '';
}

// Wakes the sleeping pictures inside `root` as they come near the visible part. Returns a function that stops watching.
// `scroller` is the element the grid scrolls inside (the margin only reaches past the edge of the element that scrolls,
// so without it a picture would wake only once it is already on screen).
export function installLazyPictures(root, { scroller = null, observer = globalThis.IntersectionObserver, margin = WAKE_MARGIN } = {}) {
  const sleeping = [...root.querySelectorAll('img[data-src]')];
  if (!sleeping.length) return () => {};
  const wake = img => {
    const src = img.getAttribute('data-src');
    if (!src) return;
    img.setAttribute('src', src);
    img.removeAttribute('data-src');
  };
  if (typeof observer !== 'function') { sleeping.forEach(wake); return () => {}; } // no way to tell what is near: load them all
  const watcher = new observer(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      watcher.unobserve(entry.target);
      wake(entry.target);
    }
  }, { root: scroller, rootMargin: margin });
  sleeping.forEach(img => watcher.observe(img));
  return () => watcher.disconnect();
}
