// Fit actual painted labels, including nested spans and artwork, rather than
// relying on scrollWidth (which can hide overflow behind a clipped child).
//
// Fitting is batched. A style write followed by a layout read forces the browser to
// recalculate on the spot, and every recalculation costs several milliseconds on a
// big page like this one. Fitting one button at a time therefore cost one recalculation
// per button per step (a quarter of a second when a menu with many buttons opened on a
// slow phone). Each step below writes to every box first and measures every box
// afterwards, so a whole screen costs a handful of recalculations instead of dozens.
export function installAutoFit({ document: doc = document, window: win = window } = {}) {
  const saved = new WeakMap(), pending = new Set(); let queued = false, running = false, fullFit = false;
  const properties = ['font-size', 'line-height', 'white-space', 'overflow-wrap', 'word-break', 'hyphens'];
  const selector = 'button,.polish-banner,.sh-banner .sh-tx';
  const visible = el => el.clientWidth > 0 && el.clientHeight > 0 && el.getClientRects().length;
  const force = (el, property, value) => el.style.setProperty(property, value, 'important');
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
  // Reads only: does this box need fitting, and which elements carry its text?
  function plan(box) {
    if (box.matches('[data-no-autofit]') || !visible(box)) return null;
    // Fixed-size numeric keys never need a page-wide text fitting pass.
    if (box.matches('.num-btn,.dc-key,.hs-key,#backspace-btn')) return null;
    // Illustrated menu cards have a fixed art box and a separate caption box.
    // Fit that caption once; fitting both parent and child resets the same labels twice.
    if (box.matches('.sh-banner') && box.querySelector('.sh-tx')) return null;
    const nodes = labelNodes(box); if (!nodes.length) return null;
    const singleLine = box.dataset.fitSingleLine === 'true' || box.matches('.bot-btn,.dc-btn,.coin-pack-buy-btn,.coin-reward-continue,#host-start-btn,#final-home-btn,#play-again-btn');
    const labels = [...new Set([box, ...nodes.map(n => n.parentElement)])];
    return { box, nodes, singleLine, labels, bases: [], sizes: null };
  }
  // Try keeping complete words first, even if an existing anywhere rule
  // has already split "Medium" into two technically-contained lines.
  function keepWords(job) {
    job.labels.forEach(el => {
      force(el, 'overflow-wrap', 'normal');
      force(el, 'word-break', 'normal');
      force(el, 'hyphens', 'none');
      if (job.singleLine) force(el, 'white-space', 'nowrap');
    });
  }
  function allowWrapping(job) {
    job.labels.forEach(el => {
      force(el, 'white-space', job.singleLine ? 'nowrap' : 'normal');
      force(el, 'overflow-wrap', 'normal');
    });
  }
  // Returns false once a step would leave every size exactly as the last one did: the label
  // is as small as it is allowed to get, so measuring the same layout again cannot help.
  function shrink(job, step) {
    const scale = Math.max(0, 1 - step * .04);
    const sizes = job.bases.map(base => Math.max(Math.min(base, 10), base * scale));
    if (job.sizes && sizes.every((size, i) => size === job.sizes[i])) return false;
    job.sizes = sizes;
    job.labels.forEach((el, i) => { force(el, 'font-size', sizes[i] + 'px'); force(el, 'line-height', '1.15'); });
    return true;
  }
  // Boxes that share a label element (one nested in another) must not be fitted together:
  // the second would reset the first one's work. They run in later waves instead.
  function fitWave(jobs) {
    for (const job of jobs) { job.labels.forEach(el => { remember(el); reset(el); }); keepWords(job); }
    for (const job of jobs) job.bases = job.labels.map(el => parseFloat(win.getComputedStyle(el).fontSize) || 14);
    let todo = jobs.filter(job => overflows(job.box, job.nodes));
    // Allowing wrapping only changes the layout of boxes that were not already wrapping normally.
    const wrap = todo.filter(job => !job.singleLine);
    const changes = new Set(wrap.filter(job => job.labels.some(el => win.getComputedStyle(el).whiteSpace !== 'normal')));
    wrap.forEach(allowWrapping);
    todo = todo.filter(job => !changes.has(job) || overflows(job.box, job.nodes));
    for (let step = 1; step <= 25 && todo.length; step++) {
      todo = todo.filter(job => shrink(job, step));
      todo = todo.filter(job => overflows(job.box, job.nodes));
    }
    // Keep words intact and artwork dimensions unchanged. Long copy should
    // be shortened rather than split into letters or stretched to fit.
  }
  function fitBoxes(boxes) {
    let jobs = [];
    for (const box of boxes) { const job = plan(box); if (job) jobs.push(job); }
    while (jobs.length) {
      const claimed = new Set(), wave = [], later = [];
      for (const job of jobs) {
        if (job.labels.some(el => claimed.has(el))) { later.push(job); continue; }
        job.labels.forEach(el => claimed.add(el)); wave.push(job);
      }
      fitWave(wave); jobs = later;
    }
  }
  function run() {
    queued = false; running = true;
    const boxes = fullFit ? doc.querySelectorAll(selector) : [...pending];
    pending.clear(); fullFit = false;
    try { fitBoxes(boxes); } finally { running = false; }
  }
  function queue(box) {
    if (box?.nodeType === 1) { if (box.hasAttribute('data-no-autofit')) return; pending.add(box); } else fullFit = true;
    if (!queued && !running) { queued = true; win.requestAnimationFrame(run); }
  }
  const fitWithin = el => { if (el?.matches?.(selector)) queue(el); el?.querySelectorAll?.(selector).forEach(queue); };
  const observer = new MutationObserver(records => {
    for (const r of records) {
      const el = r.target.nodeType === 1 ? r.target : r.target.parentElement;
      const button = el?.closest(selector);
      if (button) { queue(button); continue; }
      if (r.type === 'attributes') { fitWithin(el); continue; }
      const changedButtons = [...(r.addedNodes || []), ...(r.removedNodes || [])].some(n =>
        n.nodeType === 1 && (n.matches(selector) || n.querySelector(selector)));
      if (changedButtons) fitWithin(el);
    }
  });
  observer.observe(doc.documentElement, { childList: true, subtree: true, characterData: true, attributes: true,
    attributeFilter: ['class', 'hidden', 'data-large-text'] });
  const resize = new ResizeObserver(queue); resize.observe(doc.documentElement);
  win.addEventListener('resize', queue); win.visualViewport?.addEventListener('resize', queue);
  doc.fonts?.ready.then(queue); doc.fonts?.addEventListener?.('loadingdone', queue);
  queue();
  return { fit: box => fitBoxes([box]), refresh: queue, destroy() { observer.disconnect(); resize.disconnect(); win.removeEventListener('resize', queue); win.visualViewport?.removeEventListener('resize', queue); } };
}
