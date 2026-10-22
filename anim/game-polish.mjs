// Cosmetic only: none of these effects grant rewards or change game state.
export function createPolish({ document: doc = document, reduced = () => false, sound = () => {} } = {}) {
  const celebrated = new Set(), receiptTargets = new WeakMap();
  const visible = el => el?.isConnected && !el.closest('[hidden]') && !!el.getClientRects().length;
  function count(el, from, to, duration = 900) {
    if (!el) return;
    const ticket = {}; receiptTargets.set(el, ticket);
    if (reduced()) { el.textContent = String(to); return; }
    const start = performance.now();
    function frame(now) {
      if (receiptTargets.get(el) !== ticket || !visible(el)) { el.textContent = String(to); return; }
      const t = Math.min(1, (now - start) / duration);
      el.textContent = String(Math.round(from + (to - from) * (1 - (1 - t) ** 3)));
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  function trail(from, to) {
    if (!visible(from) || !visible(to) || reduced()) return;
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    for (let i = 0; i < 6; i++) {
      const coin = doc.createElement('img'); coin.src = 'icons/coin-v2.png'; coin.alt = ''; coin.className = 'polish-coin';
      coin.style.left = a.left + a.width / 2 - 13 + 'px'; coin.style.top = a.top + a.height / 2 - 13 + 'px';
      doc.body.appendChild(coin);
      const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
      const animation = coin.animate([{ transform: 'translate(0,0) scale(.7)', opacity: 0 },
        { transform: `translate(${dx * .4}px,${dy * .4 - 28}px) scale(1)`, opacity: 1, offset: .45 },
        { transform: `translate(${dx}px,${dy}px) scale(.4)`, opacity: 0 }],
      { duration: 720, delay: i * 85, easing: 'ease-in-out', fill: 'both' });
      animation.onfinish = () => coin.remove();
    }
  }
  function reward({ element, total, added, key }) {
    if (!visible(element)) return;
    const value = element.querySelector('[data-total]');
    count(value, Math.max(0, total - added), total);
    trail(element.querySelector('.coin-reward-hero'), doc.getElementById('toolbar-coin-balance'));
    if (!celebrated.has('coin:' + key)) { celebrated.add('coin:' + key); sound('coins'); }
  }
  function stars(el) {
    const key = 'stars:' + el.dataset.celebrationKey;
    if (!visible(el) || celebrated.has(key)) return;
    celebrated.add(key);
    const earned = [...el.querySelectorAll('.wl-stars > span:not(.off)')];
    if (reduced()) return;
    earned.forEach((star, i) => {
      star.classList.add('polish-star-wait');
      setTimeout(() => {
        if (!visible(el)) { star.classList.remove('polish-star-wait'); return; }
        star.classList.remove('polish-star-wait'); star.classList.add('polish-star-earned'); sound('star');
      }, 350 + i * 580);
    });
  }
  const headers = {
    'worlds-content': ['blue', 'items/hot-air-balloon.webp'],
    'daily-content': ['orange', 'icons/toolbar-daily.png'],
    'monthly-content': ['purple', 'icons/banner-monthly.png'],
    'survival-content': ['red', 'items/t-rex.webp'],
    'teamworlds-content': ['blue', 'items/hot-air-balloon.webp'],
    'teamvteam-content': ['green', 'items/soccer-ball.webp'],
    'hs-content': ['purple', 'items/poker-chip.webp'],
  };
  const icons = { '🪙': ['icons/coin-v2.png', 'coins'], '💰': ['icons/coin-v2.png', 'coins'],
    '🏆': ['icons/reactions/trophy.png', 'trophy'], '⭐': ['icons/flair/star.png', 'star'],
    '★': ['icons/flair/star.png', 'star'], '☆': ['icons/flair/star.png', 'star'],
    '🔥': ['icons/reactions/fire.png', 'streak'], '🎉': ['icons/reactions/popper.png', 'celebration'],
    '❤️': ['icons/flair/heart.png', 'heart'], '♥': ['icons/flair/heart.png', 'heart'],
    '🎬': ['icons/btn-watch-ad.png', 'watch ad'], '🔒': ['icons/reactions/padlock.png', 'locked'],
    '⚡': ['icons/flair/bolt.png', 'quick'], '✨': ['icons/flair/star.png', 'sparkle'],
    '🎁': ['icons/shop-starter-gift.webp', 'gift'],
    '🎯': ['icons/reactions/trophy.png', 'accuracy'], '👑': ['icons/reactions/crown.png', 'winner'] };
  const symbolPattern = new RegExp(Object.keys(icons).join('|'), 'gu');
  function artwork(root) {
    const walker = doc.createTreeWalker(root, 4); const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    for (const text of texts) {
      if (text.parentElement?.closest('script,style,textarea,input,option,.name,.hs-pl-name,.settings-name-value')) continue;
      symbolPattern.lastIndex = 0;
      if (!symbolPattern.test(text.nodeValue)) continue;
      symbolPattern.lastIndex = 0;
      const fragment = doc.createDocumentFragment(); let last = 0;
      for (const match of text.nodeValue.matchAll(symbolPattern)) {
        fragment.append(text.nodeValue.slice(last, match.index));
        const img = doc.createElement('img'), [src, alt] = icons[match[0]];
        img.src = src; img.alt = alt; img.className = 'polish-inline-art'; fragment.append(img); last = match.index + match[0].length;
      }
      fragment.append(text.nodeValue.slice(last)); text.replaceWith(fragment);
    }
  }
  function refresh(root) {
    for (const title of root.querySelectorAll('.dc-title:not(.wl-run-title):not(.polish-banner)')) {
      const host = title.parentElement, config = headers[host.id];
      if (!config || /^(Question|Round |After round)/.test(title.textContent)) continue;
      title.classList.add('polish-banner'); title.style.setProperty('--banner', `url(icons/banner-blank-${config[0]}.png)`);
      const img = doc.createElement('img'); img.src = config[1]; img.alt = ''; title.prepend(img);
    }
    root.querySelectorAll('[data-result-stars]').forEach(stars);
    root.querySelectorAll('[data-personal-best]').forEach(el => {
      const key = 'best:' + el.dataset.personalBest;
      if (!visible(el) || celebrated.has(key)) return;
      celebrated.add(key); el.classList.add('polish-personal-best'); sound('best');
    });
    artwork(root);
  }
  let queued = false;
  const roots = new Set();
  const observer = new MutationObserver(records => {
    for (const record of records) if (record.target.nodeType === 1) roots.add(record.target);
    if (queued) return; queued = true;
    requestAnimationFrame(() => { queued = false; observer.disconnect(); for (const root of roots) if (root.isConnected) refresh(root); roots.clear(); observer.observe(doc.body, { childList: true, subtree: true }); });
  });
  refresh(doc); observer.observe(doc.body, { childList: true, subtree: true });
  return { reward, trail, count, refresh, destroy: () => observer.disconnect() };
}
