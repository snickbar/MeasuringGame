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
      const middle = owner.querySelector('.play-input-body') || owner.querySelector('.play-middle') || owner.querySelector('.main-col');
      if (middle && middle.scrollHeight > middle.clientHeight + 1) {
        owner.dataset.playDensity = 'compact';
        if (middle.scrollHeight > middle.clientHeight + 1) owner.dataset.playDensity = 'tight';
      }
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
  const resize = new win.ResizeObserver(measure);
  [toolbar, sub, bottom].filter(Boolean).forEach(el => resize.observe(el));
  win.addEventListener('resize', measure);
  win.visualViewport?.addEventListener('resize', measure);
  doc.fonts?.ready.then(measure);
  function track(owner, mode) { owners.add(owner); owner.dataset.playLayout = mode; measure(); }
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
    restoreHighLow();
    const header = doc.createElement('div'), footer = doc.createElement('div');
    header.className = 'play-status'; footer.className = 'play-actions'; header.dataset.playOwned = ''; footer.dataset.playOwned = '';
    for (const [node, target] of [[progress, header], [action, footer]]) {
      borrow(node, target);
    }
    owner.prepend(header); owner.append(footer); track(owner, mode);
  }
  function party(owner, question, action) {
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
  return {worlds, highLow, party, restoreHighLow, clear, measure};
}

