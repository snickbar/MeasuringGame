// Fit actual painted labels, including nested spans and artwork, rather than
// relying on scrollWidth (which can hide overflow behind a clipped child).
export function installAutoFit({ document: doc = document, window: win = window } = {}) {
  const saved = new WeakMap(); let queued = false, running = false;
  const properties = ['font-size', 'line-height', 'white-space', 'overflow-wrap', 'word-break', 'hyphens'];
  const selector = 'button,.polish-banner,.sh-banner .sh-tx';
  const visible = el => el.clientWidth > 0 && el.clientHeight > 0 && el.getClientRects().length;
  function remember(el) {
    if (!saved.has(el)) saved.set(el, properties.map(p => [p, el.style.getPropertyValue(p), el.style.getPropertyPriority(p)]));
  }
  function reset(el) {
    for (const [p, value, priority] of saved.get(el) || []) {
      if (value) el.style.setProperty(p, value, priority); else el.style.removeProperty(p);
    }
  }
  function labelNodes(box) {
    const walker = doc.createTreeWalker(box, 4), nodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeValue.trim() && !node.parentElement.closest('[hidden],svg,script,style')) nodes.push(node);
    }
    return nodes;
  }
  function overflows(box, nodes) {
    const outer = box.getBoundingClientRect(), style = win.getComputedStyle(box);
    const sx = outer.width / box.offsetWidth || 1, sy = outer.height / box.offsetHeight || 1;
    const edge = p => parseFloat(style[p]) || 0;
    const left = outer.left + (edge('borderLeftWidth') + edge('paddingLeft')) * sx - 1;
    const right = outer.right - (edge('borderRightWidth') + edge('paddingRight')) * sx + 1;
    const top = outer.top + edge('borderTopWidth') * sy - 1, bottom = outer.bottom - edge('borderBottomWidth') * sy + 1;
    const range = doc.createRange();
    return nodes.some(node => {
      range.selectNodeContents(node);
      return [...range.getClientRects()].some(r => r.width && (r.left < left || r.right > right || r.top < top || r.bottom > bottom));
    });
  }
  function fit(box) {
    if (!visible(box) || box.matches('[data-no-autofit]')) return;
    // Illustrated menu cards have a fixed art box and a separate caption box.
    // Fit that caption once; fitting both parent and child resets the same labels twice.
    if (box.matches('.sh-banner') && box.querySelector('.sh-tx')) return;
    const nodes = labelNodes(box); if (!nodes.length) return;
    const singleLine = box.dataset.fitSingleLine === 'true' || box.matches('.bot-btn,.dc-btn,.coin-pack-buy-btn,.coin-reward-continue,#host-start-btn,#final-home-btn,#play-again-btn');
    const labels = [...new Set([box, ...nodes.map(n => n.parentElement)])];
    labels.forEach(el => { remember(el); reset(el); });
    // Try keeping complete words first, even if an existing anywhere rule
    // has already split "Medium" into two technically-contained lines.
    labels.forEach(el => {
      el.style.setProperty('overflow-wrap', 'normal', 'important');
      el.style.setProperty('word-break', 'normal', 'important');
      el.style.setProperty('hyphens', 'none', 'important');
      if (singleLine) el.style.setProperty('white-space', 'nowrap', 'important');
    });
    const bases = labels.map(el => parseFloat(win.getComputedStyle(el).fontSize) || 14);
    if (!overflows(box, nodes)) return;
    labels.forEach(el => {
      el.style.setProperty('white-space', singleLine ? 'nowrap' : 'normal', 'important');
      el.style.setProperty('overflow-wrap', 'normal', 'important');
    });
    if (!overflows(box, nodes)) return;
    for (let step = 1; step <= 25; step++) {
      const scale = Math.max(0, 1 - step * .04);
      labels.forEach((el, i) => {
        el.style.setProperty('font-size', Math.max(Math.min(bases[i], 10), bases[i] * scale) + 'px', 'important');
        el.style.setProperty('line-height', '1.15', 'important');
      });
      if (!overflows(box, nodes)) return;
    }
    // Keep words intact and artwork dimensions unchanged. Long copy should
    // be shortened rather than split into letters or stretched to fit.
  }
  function run() {
    queued = false; running = true;
    try { doc.querySelectorAll(selector).forEach(fit); } finally { running = false; }
  }
  function queue() { if (!queued && !running) { queued = true; win.requestAnimationFrame(run); } }
  const observer = new MutationObserver(queue);
  observer.observe(doc.documentElement, { childList: true, subtree: true, characterData: true, attributes: true,
    attributeFilter: ['class', 'hidden', 'data-large-text'] });
  const resize = new ResizeObserver(queue); resize.observe(doc.documentElement);
  win.addEventListener('resize', queue); win.visualViewport?.addEventListener('resize', queue);
  doc.fonts?.ready.then(queue); doc.fonts?.addEventListener?.('loadingdone', queue);
  queue();
  return { fit, refresh: queue, destroy() { observer.disconnect(); resize.disconnect(); win.removeEventListener('resize', queue); win.visualViewport?.removeEventListener('resize', queue); } };
}
