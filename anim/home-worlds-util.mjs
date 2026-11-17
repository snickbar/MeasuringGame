// Shared helpers for the four detailed Home scenes (Tools & Gadgets, Home & Bedroom, Zoo, Birds & Bugs).
// Every piece is placed in the 1029 x 2222 picture the artwork was drawn on, as percentages of that picture.
export const CANVAS = { width: 1029, height: 2222 };
export const place = (x, y, w, h) =>
  `left:${(x / CANVAS.width * 100).toFixed(3)}%;top:${(y / CANVAS.height * 100).toFixed(3)}%;width:${(w / CANVAS.width * 100).toFixed(3)}%;` +
  (h ? `height:${(h / CANVAS.height * 100).toFixed(3)}%;` : '');
export const img = (src, css = '', style = '') => `<img class="${css}" src="${src}" alt="" draggable="false"${style ? ` style="${style}"` : ''}>`;
export const hit = (kind, x, y, w, h, label) =>
  `<button class="w-hit" type="button" data-no-autofit data-w="${kind}" aria-label="${label}" style="${place(x, y, w, h)}"></button>`;
// Runs fn on a random delay (ms) until stopped. Returns a stop function.
export function every(min, max, fn) {
  let id; const next = () => { id = setTimeout(() => { fn(); next(); }, min + Math.random() * (max - min)); }; next();
  return () => clearTimeout(id);
}
// Keeps `active` true only while the Home screen is showing and motion is allowed, like the other custom scenes.
export function watchActive(home, root, onChange) {
  const doc = home.ownerDocument, media = matchMedia('(prefers-reduced-motion: reduce)');
  let active = false;
  const sync = () => {
    const mode = doc.documentElement.dataset.motion;
    const visible = !doc.hidden && home.classList.contains('active');
    root.classList.toggle('hs-paused', !visible);
    const next = visible && mode !== 'reduce' && (mode === 'full' || !media.matches);
    if (next !== active) { active = next; onChange(active); }
  };
  const observer = new MutationObserver(sync), ac = new AbortController();
  observer.observe(home, { attributes: true, attributeFilter: ['class'] });
  observer.observe(doc.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  doc.addEventListener('visibilitychange', sync, { signal: ac.signal });
  media.addEventListener('change', sync, { signal: ac.signal });
  sync();
  return { isActive: () => active, stop: () => { observer.disconnect(); ac.abort(); } };
}
