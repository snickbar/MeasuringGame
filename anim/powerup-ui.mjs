import { POWERUPS, REROLLS, availablePowerups, quickEligible, replacementPairs, eliminationChoices, debitPowerup, settlePowerup, powerupPlacement } from './powerups.mjs';

// The controller owns immediate purchases and the reveal; the game owns scoring.
export function createPowerupController(ports) {
  let busy = false, toastTimer, messagePhase = null;
  const active = new Set(), recovering = new Set();
  const tray = document.getElementById('quick-powerups');
  const headerTray = document.getElementById('header-powerups');
  const gapTray = document.getElementById('gap-powerups');
  const help = document.getElementById('howto-powerup-list');
  if (help) help.innerHTML = Object.values(POWERUPS).map(p => `<p><b>${p.name} · ${p.cost} coins:</b> ${p.description}</p>`).join('');
  const message = document.createElement('div');
  message.className = 'pu-toast'; message.setAttribute('role', 'status'); document.body.append(message);
  const say = text => { messagePhase = context()?.phase; message.textContent = text; message.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { message.hidden = true; }, 4000); };
  message.hidden = true;
  function context() {
    const c = ports.context();
    if (c?.q && !c.q.powerupKey && c.mode !== 'quick') c.q.powerupKey = crypto.randomUUID();
    return c;
  }
  function ids(c) {
    if (!c?.q?.powerupKey || c.paused || (c.deadline && c.deadline <= ports.now())) return [];
    return availablePowerups(c.q, c.phase, c.submitted).filter(id =>
      (id !== 'fifty' || eliminationChoices(c.answers || [], c.playerId, c.q.answer).length > 0) &&
      (id !== 'reveal' || !c.deadline || c.deadline - ports.now() >= 4000));
  }
  function button(id, compact) {
    const p = POWERUPS[id];
    return `<button type="button" class="pu-button${compact ? ' pu-inline' : ''}" data-powerup="${id}" aria-label="Use ${p.name}, ${p.cost} coins" ${busy || ports.coins() < p.cost ? 'disabled' : ''}><img src="icons/powerups/${p.icon}.png" alt=""><span>${compact ? (id === 'buffer' ? 'Add 10% buffer' : p.label) : p.label}</span><small>${p.cost} coins</small></button>`;
  }
  function html(c) {
    const available = ids(c);
    return available.length ? `<div class="pu-row" aria-label="Power-ups">${available.map(id => button(id, false)).join('')}</div>` : '';
  }
  function render() {
    const c = context(), quick = c?.mode === 'quick';
    if (messagePhase && messagePhase !== c?.phase) message.hidden = true;
    tray.hidden = true;
    if (headerTray) headerTray.hidden = true;
    if (gapTray) gapTray.hidden = true;
    if (!quick) return;
    const available = ids(c);
    const row = document.querySelector('.hud-timer-row'), col = document.querySelector('.hud-timer-col');
    const main = document.querySelector('.main-col'), side = document.querySelector('.score-sidebar'), pics = document.getElementById('q-preview');
    const rowRect = row.getBoundingClientRect(), colRect = col.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect(), sideRect = side.getBoundingClientRect();
    const placement = powerupPlacement(available, rowRect.bottom - colRect.bottom - 2, sideRect.left - mainRect.right - 12, pics.getBoundingClientRect().height);
    const fill = (host, list) => {
      if (!host) return;
      const content = list.map(id => button(id, false)).join('');
      if (host.innerHTML !== content) host.innerHTML = content;
      host.hidden = !list.length;
    };
    fill(headerTray, placement.header); fill(gapTray, placement.gap);
    if (headerTray) headerTray.style.top = `${colRect.bottom - rowRect.top + 2}px`;
    if (gapTray) gapTray.style.left = `${mainRect.right - main.parentElement.getBoundingClientRect().left + 6}px`;
    const content = placement.sidebar.length ? `<div class="pu-row" aria-label="Power-ups">${placement.sidebar.map(id => button(id, false)).join('')}</div>` : '';
    if (tray.innerHTML !== content) tray.innerHTML = content;
    tray.hidden = !placement.sidebar.length;
    tray.classList.toggle('pu-scrollable', placement.sidebar.length > 3);
  }
  function same(c) {
    const live = context();
    return live && live.mode === c.mode && live.q.powerupKey === c.q.powerupKey &&
      live.q.unitId === c.q.unitId && live.q.targetId === c.q.targetId && live.phase === c.phase && live.playerId === c.playerId;
  }
  function effect(c, id) {
    let replacement = null, removed = null;
    if (REROLLS.includes(id)) {
      const candidates = replacementPairs(c.q, id, c.objects, c.allowed);
      const unseen = candidates.filter(([u, t]) => !c.seen?.has(`${u.id}|${t.id}`));
      const choices = unseen.length ? unseen : candidates;
      if (!choices.length) throw Error('No replacement is available for this object. No coins spent.');
      const [u, t] = choices[Math.floor(Math.random() * choices.length)];
      replacement = ports.question(u, t);
      // An object we keep also keeps its selected artwork.
      if (id === 'small') replacement.targetArt = c.q.targetArt || 0;
      if (id === 'big') replacement.unitArt = c.q.unitArt || 0;
    }
    if (id === 'fifty') {
      removed = eliminationChoices(c.answers, c.playerId, c.q.answer);
      if (!removed.length) throw Error('There are not enough choices for 50/50. No coins spent.');
    }
    return q => ({ ...q, ...(replacement || {}), powerupKey: q.powerupKey,
      powerups: { ...(q.powerups || {}), owner: c.playerId,
        used: { ...(q.powerups?.used || {}), [id]: true, ...(REROLLS.includes(id) ? { reroll: true } : {}) },
        ...(removed ? { removed } : {}),
      } });
  }
  async function settle(owner, id, applied) {
    return ports.profileTransaction(owner, p => settlePowerup(p, id, applied));
  }
  async function purchase(id, c) {
    if (busy || !c || !same(c) || !ids(context()).includes(id) || ports.coins() < POWERUPS[id].cost) return;
    const owner = ports.owner(), operation = crypto.randomUUID();
    let charged = false, applied = false;
    busy = true; active.add(operation); render();
    try {
      const transform = effect(c, id);
      // Decode before spending: missing artwork must not sell an empty preview.
      const previewImages = id === 'reveal' ? await Promise.all([c.q.unitId, c.q.targetId].map(async (key, i) => {
        const object = ports.object(key, i ? c.q.targetArt : c.q.unitArt);
        const img = new Image(); img.src = object.image; await img.decode();
        const canvas = document.createElement('canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let left = canvas.width, right = -1, top = canvas.height, bottom = -1;
        for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
          if (pixels[(y * canvas.width + x) * 4 + 3] < 16) continue;
          left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
        }
        if (right < left) throw Error('The preview artwork is unavailable. No coins spent.');
        return { object, img, crop: [left, top, right - left + 1, bottom - top + 1] };
      })) : null;
      if (!same(c) || !ids(context()).includes(id)) throw Error('That power-up is no longer available. No coins spent.');
      const receipt = { cost: POWERUPS[id].cost, at: Date.now(), mode: c.mode, ...(c.roomCode ? { room: c.roomCode } : {}) };
      const paid = await ports.profileTransaction(owner, p => debitPowerup(p, operation, receipt));
      if (!paid.committed) throw Error('Not enough coins, or this purchase could not be completed.');
      charged = true;
      if (ports.owner() !== owner || !same(c) || !ids(context()).includes(id)) throw Error('The question changed. Your coins will be returned.');
      if (c.mode === 'quick') {
        const result = await ports.roomTransaction(c.roomCode, room => {
          if (!room || !quickEligible(room, c.playerId, true) || room.paused || room.phase !== c.phase ||
            room.powerupReceipts?.[operation] === 'refunded' ||
            room.currentQuestion?.powerupKey !== c.q.powerupKey || room.currentQuestion.unitId !== c.q.unitId || room.currentQuestion.targetId !== c.q.targetId) return;
          const deadline = room.phase === 'answers' ? room.answersEndsAt : (room.graceEndsAt || room.questionEndsAt);
          if (deadline && deadline <= ports.now()) return;
          if (id === 'reveal' && deadline && deadline - ports.now() < 4000) return;
          const submitted = room.guesses?.[c.playerId] !== undefined;
          if (!availablePowerups(room.currentQuestion, room.phase, submitted).includes(id)) return;
          const next = { ...room, currentQuestion: transform(room.currentQuestion), powerupReceipts: { ...(room.powerupReceipts || {}), [operation]: true } };
          if (REROLLS.includes(id)) {
            next.guesses = null; next.graceEndsAt = null;
            next.questionEndsAt = room.questionEndsAt ? ports.now() + (room.settings.timerSeconds || 30) * 1000 : null;
          }
          return next;
        });
        applied = result.committed;
        if (!applied) throw Error('That power-up is no longer available. Your coins will be returned.');
        ports.quickApplied(id, result.snapshot.val());
      } else {
        // Claim the receipt before touching ephemeral local state. Another tab
        // may already have recovered/refunded an interrupted purchase.
        const claimed = await settle(owner, operation, true);
        if (!claimed.committed) throw Error('This purchase was already recovered. No power-up was used.');
        if (ports.owner() !== owner || !same(c)) {
          await ports.profileTransaction(owner, p => {
            const r = p?.powerupReceipts?.[operation];
            if (r?.status !== 'applied') return;
            return { ...p, coins: Number(p.coins || 0) + r.cost, powerupReceipts: { ...p.powerupReceipts, [operation]: { ...r, status: 'refunded' } } };
          });
          throw Error('The question changed. Your coins were returned.');
        }
        c.apply(transform(c.q), id); applied = true;
      }
      if (id === 'reveal') await preview(previewImages);
      await settle(owner, operation, true);
      say(`${POWERUPS[id].name} used · ${POWERUPS[id].cost} coins`);
    } catch (err) {
      // A network failure can leave an acknowledged debit or room write uncertain.
      // Reconcile from server state before refunding; never guess about a debit.
      try {
        const p = await ports.profile(owner);
        charged = !!p?.powerupReceipts?.[operation];
        if (c.roomCode && charged) applied = (await ports.room(c.roomCode))?.powerupReceipts?.[operation] === true;
        if (charged) await settle(owner, operation, applied);
      } catch { say('Connection interrupted. Your purchase will be checked when you reconnect.'); }
      say(applied ? 'Power-up applied.' : (err.message || 'Could not use this power-up.'));
    } finally {
      active.delete(operation); busy = false; ports.refresh(c.mode); render(); ports.finished();
    }
  }
  async function preview(images) {
    const [u, t] = images.map(x => x.object);
    const layer = document.createElement('div'); layer.className = 'pu-preview';
    layer.setAttribute('role', 'status'); layer.setAttribute('aria-label', 'Four-second relative size preview');
    layer.innerHTML = '<p>Look closely!</p><canvas class="pu-stage" width="1200" height="620"></canvas>';
    document.body.append(layer);
    // The shared stage uses measured edges, not arbitrary equal-size thumbnails.
    // Log interpolation gives extreme ratios time to zoom without extending the view.
    const ratio = t.mm / u.mm, canvas = layer.querySelector('canvas'), ctx = canvas.getContext('2d');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    await new Promise(resolve => {
      let began;
      function frame(now) {
        if (began === undefined) began = now;
        const elapsed = now - began, f = Math.min(1, elapsed / 4000);
        const scale = reduced ? 1 : Math.exp(Math.log(Math.min(ratio, 1e8)) * (1 - Math.min(1, f / 0.75)));
        ctx.clearRect(0, 0, 1200, 620);
        const draw = ({ object, img, crop }, edge, x) => {
          const dimension = object.measurement?.dimension;
          const vertical = ['height', 'depth'].includes(dimension) || (dimension === 'length' && crop[3] > crop[2]);
          const width = vertical ? edge * crop[2] / crop[3] : edge;
          const height = vertical ? edge : edge * crop[3] / crop[2];
          ctx.drawImage(img, ...crop, x, 590 - height, width, height);
        };
        // Both images share the same measured-edge scale throughout the camera zoom.
        draw(images[0], 500 * scale / ratio, 30);
        draw(images[1], 500 * scale, 630);
        if (elapsed >= 4000) { layer.remove(); resolve(); } else requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }
  async function recover(data, owner) {
    for (const [id, receipt] of Object.entries(data?.powerupReceipts || {})) {
      if (receipt.status !== 'charged' || active.has(id) || recovering.has(id) || Date.now() - receipt.at < 60000) continue;
      recovering.add(id);
      try {
        let applied = false;
        if (receipt.room) {
          // A cancellation marker serializes recovery with a late room write.
          // Once a refund wins this transaction, that old purchase cannot apply.
          const result = await ports.roomTransaction(receipt.room, room => {
            if (!room || room.powerupReceipts?.[id] === true) return;
            return { ...room, powerupReceipts: { ...(room.powerupReceipts || {}), [id]: 'refunded' } };
          });
          applied = result.snapshot.val()?.powerupReceipts?.[id] === true;
        }
        await settle(owner, id, applied);
      } catch { /* Keep the pending receipt for the next connection. */ }
      finally { recovering.delete(id); }
    }
  }
  document.addEventListener('click', e => {
    if (busy) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    const b = e.target.closest('[data-powerup]');
    if (b && !b.disabled) { e.preventDefault(); e.stopImmediatePropagation(); purchase(b.dataset.powerup, context()); }
  }, true);
  document.addEventListener('keydown', e => {
    if (busy) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(() => render());
    for (const el of [document.querySelector('.hud-timer-row'), document.querySelector('.hud-timer-col'), document.querySelector('.game-body')]) if (el) observer.observe(el);
  }
  return { get busy() { return busy; }, html, render, recover };
}
