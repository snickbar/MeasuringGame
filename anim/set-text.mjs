// Changing an element's words with `el.textContent = x` throws away its old text node and makes a new one. Every such
// swap makes the browser re-check the page-wide :has() rules (body:has(#home-screen.active) and friends), and those
// re-style dozens of elements that have nothing to do with the number: measured on a slow-phone setting, 12 number
// changes cost 112 ms of style work that way and 18 ms when the words are edited where they stand.
//
// Anything that changes text every frame or every tick (counting numbers up, countdown clocks) should use setText().
// Text that changes once in a while can keep using textContent.

// Puts `value` in `el` as its only text. Edits the text node in place when the element holds just one, so the page
// has nothing to re-check; otherwise does exactly what `el.textContent = value` does.
export function setText(el, value) {
  const text = String(value);
  const only = el.firstChild;
  if (text !== '' && only && only.nodeType === 3 && !only.nextSibling) {
    if (only.data !== text) only.data = text; // writing the same words again would still make the browser redo the layout
    return;
  }
  el.textContent = text;
}
