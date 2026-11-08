// The bottom bar (Auto / Reveal next / Reveal all / Show summary / Next round / Play again /
// Finish) is laid out differently depending on which of its buttons are showing. The game shows
// and hides those buttons with inline `style.display`, and the CSS used to read that back with
// :has() selectors that looked for "display: none" inside each button's style attribute.
//
// Selectors like that are expensive: the browser has to re-check them whenever ANY element on the
// page changes its inline style, and on this page that made every single style change cost about
// 1.5 ms on a fast computer and several times that on an older phone. The same three facts now
// live as attributes on the bar, which are refreshed only when one of the bar's own buttons changes.
//
//   data-bar-empty   no button is showing, so the bar takes no space
//   data-bar-final   the "Finish game" button is showing (the Play again / Finish / ad row)
//   data-bar-reveal  the "Reveal all" button is showing (the solo Auto | Reveal next | Reveal all row)

export const BAR_FLAGS = { empty: 'data-bar-empty', final: 'data-bar-final', reveal: 'data-bar-reveal' };

// buttons: [{ id, hidden }] for the bar's direct button children, in any order.
export function bottomActionsState(buttons) {
  const showing = id => buttons.some(button => button.id === id && !button.hidden);
  return {
    empty: buttons.every(button => button.hidden),
    final: showing('final-home-btn'),
    reveal: showing('reveal-all-btn')
  };
}

export function installBottomActions({ document: doc = document } = {}) {
  const bar = doc.getElementById('bottom-actions');
  if (!bar) return { sync() {}, destroy() {} };
  function sync() {
    const buttons = [...bar.children]
      .filter(el => el.tagName === 'BUTTON')
      .map(el => ({ id: el.id, hidden: el.style.display === 'none' }));
    const state = bottomActionsState(buttons);
    // Only touch an attribute when its answer changed, so a repeat of the same state costs nothing.
    for (const key of Object.keys(BAR_FLAGS)) {
      if (bar.hasAttribute(BAR_FLAGS[key]) !== state[key]) bar.toggleAttribute(BAR_FLAGS[key], state[key]);
    }
  }
  // Runs as a microtask right after whichever script changed a button, so the bar is settled
  // before the browser next calculates styles or paints.
  const observer = new MutationObserver(sync);
  observer.observe(bar, { attributes: true, attributeFilter: ['style'], subtree: true, childList: true });
  sync();
  return { sync, destroy() { observer.disconnect(); } };
}
