// Three-part play layout. Shared Party nodes return to their original DOM
// positions before another mode/phase renders; listeners stay on the real nodes.
export function fitRevealStage(stage) {
  const doc = stage.ownerDocument, win = doc.defaultView;
  const owner = stage.closest('.screen,#hud');
  const footer = owner?.querySelector('.play-actions');
  const reactions = doc.getElementById('bottom-toolbar');
  const visible = el => el && el.getClientRects().length && win.getComputedStyle(el).display !== 'none';
  let bottom = win.visualViewport ? win.visualViewport.height + win.visualViewport.offsetTop : win.innerHeight;
  if (visible(footer)) bottom = Math.min(bottom, footer.getBoundingClientRect().top);
  if (visible(reactions)) bottom = Math.min(bottom, reactions.getBoundingClientRect().top);
  const height = Math.max(120, Math.floor(bottom - stage.getBoundingClientRect().top - 4));
  // The drawing keeps its proportions; extra height extends the scenery.
  return { hMax: Math.max(50, Math.min(400, height - 70)), minStageH: height };
}

export function createPlayLayout(doc = document) {
  const win = doc.defaultView, owners = new Set();
  let borrowed = [];
  const toolbar = doc.getElementById('app-toolbar');
  const sub = doc.getElementById('hud-sub-toolbar');
  const bottom = doc.getElementById('bottom-toolbar');
  const visible = el => el && win.getComputedStyle(el).display !== 'none';
  let fitFrame = 0;
  function fit() {
    fitFrame = 0;
    for (const owner of owners) {
      if (!visible(owner)) continue;
      delete owner.dataset.playDensity;
      // While the round's papers are being revealed, the thing that has to fit is the whole answer column (not the hidden keypad area):
      // the papers get a little narrower, which also makes them shorter, only as much as needed.
      if (owner.dataset.playLayout !== 'party' && owner.querySelector('.play-middle')) {
        // Any scrolling middle section reaches up behind the status row and down behind the see-through buttons, so its edges never cut content.
        owner.style.removeProperty('--pm-top'); owner.style.removeProperty('--pm-bot');
        const mid = owner.querySelector('.play-middle'), st = owner.querySelector('.play-status'), ac = owner.querySelector('.play-actions');
        if (mid.getClientRects().length) {
          const mr = mid.getBoundingClientRect();
          if (st && st.getClientRects().length) owner.style.setProperty('--pm-top', `${Math.min(24, Math.max(0, Math.round(mr.top - st.getBoundingClientRect().top)))}px`);
          if (ac && ac.getClientRects().length) owner.style.setProperty('--pm-bot', `${Math.min(24, Math.max(0, Math.round(ac.getBoundingClientRect().bottom - mr.bottom)))}px`);
        }
      }
      if (owner.id === 'bluff-screen' || owner.id === 'hs-screen') {
        // The Bluff / High Stakes player columns reach down behind the see-through button, so measure how far.
        owner.style.removeProperty('--pm-down'); owner.style.removeProperty('--pm-up');
        const mid = owner.querySelector('.play-middle'), act = owner.querySelector('.play-actions'), tbl = mid && mid.querySelector(':scope > .hs-board');
        if (mid && tbl) owner.style.setProperty('--pm-up', `${Math.max(0, Math.round(tbl.getBoundingClientRect().top - mid.getBoundingClientRect().top))}px`);
        if (mid && act && act.getClientRects().length) owner.style.setProperty('--pm-down', `${Math.max(0, Math.round(act.getBoundingClientRect().bottom - mid.getBoundingClientRect().bottom))}px`);
      }
      if (owner.dataset.playLayout === 'party') {
        // The player/team score column scrolls up behind the board row (the board and timer stay on top), in every phase, instead of being cut by a flat edge under it.
        owner.style.removeProperty('--sc-up');
        const row = owner.querySelector('.hud-timer-row'), side = owner.querySelector('.score-sidebar');
        if (row && side && side.getClientRects().length) owner.style.setProperty('--sc-up', `${Math.max(0, Math.round(side.getBoundingClientRect().top - row.getBoundingClientRect().top))}px`);
      }
      if (owner.dataset.playLayout === 'party' && owner.querySelector('#reveal-view.active, #summary-view.active, #animation-view.active')) {
        const col = owner.querySelector('.main-col');
        owner.style.removeProperty('--rv-fit');
        owner.style.removeProperty('--an-fit');
        owner.style.removeProperty('--rv-up');
        owner.style.removeProperty('--rv-pad');
        // The papers scroll BEHIND the question board (no clip edge floating under it): the column reaches up to the board's top,
        // and its own top padding starts the first paper right under the board's art. A picture board draws its art centred inside
        // a taller box, so the papers also start up inside the empty band under the art.
        const board = owner.querySelector('.question-prompt'), stage = board && board.querySelector('#q-stage');
        if (board && col) {
          const boardRect = board.getBoundingClientRect();
          const up = Math.max(0, Math.round(col.getBoundingClientRect().top - boardRect.top));
          let pull = 0;
          if (stage && stage.getClientRects().length) { const slack = boardRect.bottom - stage.getBoundingClientRect().bottom; if (slack > 6) pull = Math.round(slack - 3); }
          owner.style.setProperty('--rv-up', `${up}px`);
          owner.style.setProperty('--rv-pad', `${Math.max(0, up - pull)}px`);
        }
        let k = 1;
        const reveal = !!owner.querySelector('#reveal-view.active');
        for (let i = 0; reveal && i < 3 && col && col.scrollHeight > col.clientHeight + 1; i++) {
          k = Math.max(0.66, k * (col.clientHeight / col.scrollHeight) * 0.99);
          owner.style.setProperty('--rv-fit', k.toFixed(3));
        }
        // The reveal scene shrinks a little (never below 70%) so it rarely needs to scroll; whatever is left scrolls behind the board.
        const anim = !!owner.querySelector('#animation-view.active');
        for (let i = 0; anim && i < 3 && col && col.scrollHeight > col.clientHeight + 14; i++) { // (a few px of overflow is just the bottom padding: the scene already sizes itself to the space)
          k = Math.max(0.7, k * (col.clientHeight / col.scrollHeight) * 0.99);
          owner.style.setProperty('--an-fit', k.toFixed(3));
        }
        continue; // the question board keeps its size here; only the papers adapt
      }
      owner.style.removeProperty('--rv-fit');
      const middle = owner.querySelector('.play-input-body') || owner.querySelector('.play-middle') || owner.querySelector('.main-col');
      if (middle && middle.scrollHeight > middle.clientHeight + 1) {
        owner.dataset.playDensity = 'compact';
        if (middle.scrollHeight > middle.clientHeight + 1) owner.dataset.playDensity = 'tight';
      }
      owner.dispatchEvent(new win.CustomEvent('playfit', {bubbles: true})); // lets the borrowed question card shrink too if the layout still does not fit
    }
  }
  function measure() {
    for (const owner of owners) {
      const top = ['hud','bluff-screen'].includes(owner.id) && visible(sub) ? sub.getBoundingClientRect().bottom : toolbar.getBoundingClientRect().bottom;
      owner.style.setProperty('--play-top', `${top}px`);
      owner.style.setProperty('--play-bottom', `${['hud','hs-screen','bluff-screen'].includes(owner.id) && visible(bottom) ? bottom.getBoundingClientRect().height : 0}px`);
    }
    if (!fitFrame) fitFrame = win.requestAnimationFrame(fit);
  }
  // Re-measure whenever the reveal / summary screen opens or its papers change, so the behind-the-board scroll area never depends on who happened to call measure().
  let watchFrame = 0;
  const remeasure = () => { if (watchFrame) return; watchFrame = win.requestAnimationFrame(() => { watchFrame = 0; measure(); }); };
  // The board can still be changing size when the reveal opens (scene art loads, text refits, answer line appears), so also re-measure when it resizes and shortly after the screen opens.
  const boardResize = new win.ResizeObserver(remeasure);
  { const hudEl = doc.getElementById('hud'); hudEl?.querySelectorAll('.hud-timer-row, .question-prompt, #q-stage, #anim-stage, .score-sidebar').forEach(el => boardResize.observe(el)); }
  const lateMeasure = () => { for (const ms of [250, 700, 1500]) win.setTimeout(remeasure, ms); };
  const watch = new win.MutationObserver(muts => { if (muts.some(m => m.type === 'attributes' && m.target.id && /view$/.test(m.target.id))) lateMeasure(); remeasure(); });
  for (const id of ['reveal-view', 'summary-view']) { const el = doc.getElementById(id); if (el) watch.observe(el, {attributes: true, attributeFilter: ['class']}); }
  for (const id of ['reveal-list', 'summary-list']) { const el = doc.getElementById(id); if (el) watch.observe(el, {childList: true}); }
  { const hudEl = doc.getElementById('hud'); if (hudEl) watch.observe(hudEl, {attributes: true, attributeFilter: ['data-phase', 'data-play-layout']}); }
  const resize = new win.ResizeObserver(measure);
  [toolbar, sub, bottom].filter(Boolean).forEach(el => resize.observe(el));
  win.addEventListener('resize', measure);
  win.visualViewport?.addEventListener('resize', measure);
  doc.fonts?.ready.then(measure);
  // Boxes only scroll when the content really cannot fit, so the fit check must also run when a screen's content changes.
  const contentWatch = new win.MutationObserver(() => { if (!fitFrame) fitFrame = win.requestAnimationFrame(fit); });
  function track(owner, mode) { owners.add(owner); owner.dataset.playLayout = mode; contentWatch.observe(owner, {childList: true, subtree: true}); measure(); }
  // Result screens: the question card is already handed back, but the party result layout (behind-the-board scroll area, paper fit) must stay on.
  function keepParty(owner) { if (owner.dataset.playLayout !== 'party' || !owners.has(owner)) track(owner, 'party'); }
  function clear(owner) { owners.delete(owner); delete owner.dataset.playLayout; delete owner.dataset.playDensity; }
  function shell(owner, content, {mode = 'solo', force = false} = {}) {
    if (owner.classList.contains('wb-playing')) { clear(owner); content.classList.remove('play-shell-content'); return; }
    // Intro menus use page scrolling beneath transparent sticky banners. Reserving
    // a gameplay status row here clips cards at the banner's rectangular bounds.
    const menuTitle = content.querySelector(':scope > .dc-title');
    const menuHeader = content.querySelector(':scope > .mode-menu-header,:scope > .wl-menu-header');
    if (!force && (menuHeader || (menuTitle && /^(Survival|Which Is Bigger|Daily Challenge|.+ Challenge)$/.test(menuTitle.textContent.trim())))) {
      clear(owner); content.classList.remove('play-shell-content'); return;
    }
    if (content.querySelector(':scope > .play-middle')) return;
    clear(owner); content.classList.remove('play-shell-content');
    let header = content.querySelector(':scope > .pin-top,:scope > .hs-top,:scope > .dc-title,:scope > .mode-menu-header,:scope > .wl-menu-header');
    let footer = content.querySelector('.pin-bottom,:scope > .bl-dock,[data-send-claim],#hs-skip,#hs-deal,#hs-again,#hs-fake-send,#dc-share');
    if (!footer && !force) return;
    if (!header) { header = doc.createElement('div'); header.hidden = true; }
    if (!footer) { footer = doc.createElement('div'); footer.hidden = true; }
    if (footer.tagName === 'BUTTON') { const wrap = doc.createElement('div'); footer.before(wrap); wrap.append(footer); footer = wrap; }
    header.classList.add('play-status'); footer.classList.add('play-actions');
    header.remove(); footer.remove();
    const overlays = [...content.querySelectorAll(':scope > .bl-reveal-overlay')]; overlays.forEach(el => el.remove());
    const middle = doc.createElement('div'); middle.className = 'play-middle';
    middle.append(...content.childNodes); content.replaceChildren(header, middle, footer, ...overlays);
    content.classList.add('play-shell-content'); track(owner, mode);
  }
  const worlds = (owner, content) => shell(owner, content, {mode:'worlds'});
  function borrow(node, target) {
    const anchor = doc.createComment('shared Party node home');
    node.before(anchor); borrowed.push({node, anchor}); target.append(node);
  }
  function restoreHighLow() {
    if (!borrowed.length) return;
    for (const {node, anchor} of borrowed) { anchor.replaceWith(node); }
    borrowed = [];
    const owner = doc.getElementById('hud');
    owner.querySelectorAll('[data-play-owned]').forEach(el => el.remove());
    clear(owner);
  }
  function highLow(owner, progress, action, mode = 'highlow') {
    if (borrowed.length && owner.dataset.playLayout === mode) return;
    restoreHighLow();
    const header = doc.createElement('div'), footer = doc.createElement('div');
    header.className = 'play-status'; footer.className = 'play-actions'; header.dataset.playOwned = ''; footer.dataset.playOwned = '';
    for (const [node, target] of [[progress, header], [action, footer]]) {
      borrow(node, target);
    }
    owner.prepend(header); owner.append(footer); track(owner, mode);
  }
  function party(owner, question, action) {
    if (borrowed.length && owner.dataset.playLayout === 'party') return;
    restoreHighLow();
    const body = doc.createElement('div'), footer = doc.createElement('div');
    body.className = 'play-input-body'; footer.className = 'play-actions';
    body.dataset.playOwned = ''; footer.dataset.playOwned = '';
    [...question.childNodes].forEach(node => borrow(node, node === action ? footer : body));
    question.append(body, footer); track(owner, 'party');
  }
  // Render functions replace their content roots. Watch only direct children,
  // so timers, input updates and animation frames never remount a screen.
  for (const [id,mode,force] of [['worlds','worlds',false],['daily','solo',false],['monthly','solo',false],['survival','solo',false],['wb','solo',false],['hs','highstakes',true],['bluff','bluff',true]]) {
    const owner = doc.getElementById(id+'-screen'), content = doc.getElementById(id === 'wb' ? 'wb-content' : id+'-content');
    if (!owner || !content) continue;
    const observer = new win.MutationObserver(() => shell(owner,content,{mode,force}));
    observer.observe(content,{childList:true});
    shell(owner,content,{mode,force});
  }
  return {worlds, highLow, party, keepParty, restoreHighLow, clear, measure};
}

