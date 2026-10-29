import { POWERUPS, REROLLS, availablePowerups, quickEligible, replacementPairs, eliminationChoices, debitPowerup, settlePowerup } from './powerups.mjs';

// The controller owns immediate purchases and the reveal; the game owns scoring.
export function createPowerupController(ports) {
  let busy = false, messageTimer, messagePhase = null, messageQuestion = null;
  const active = new Set(), recovering = new Set();
  const tray = document.getElementById('quick-powerups');
  const hud = document.getElementById('hud');
  if (hud && tray.parentElement !== hud) hud.append(tray);
  const help = document.getElementById('howto-powerup-list');
  if (help) help.innerHTML = Object.values(POWERUPS).map(p => `<p class="pu-help-item"><img src="icons/powerups/${p.icon}.png" alt=""><span><b>${p.name} · ${p.cost} <img class="pu-coin" src="icons/coin-v2.png" alt="coins">:</b> ${p.description}</span></p>`).join('');
  const message = document.createElement('div');
  message.className = 'pu-feedback'; message.setAttribute('role', 'status'); document.body.append(message);
  const say = (text, origin, id) => {
    const c = context(); messagePhase = c?.phase; messageQuestion = c?.q?.powerupKey;
    clearTimeout(messageTimer); message.getAnimations?.().forEach(a => a.cancel());
    message.textContent = '';
    if (POWERUPS[id]) {
      const icon = document.createElement('img'); icon.src = `icons/powerups/${POWERUPS[id].icon}.png`; icon.alt = ''; message.append(icon);
    }
    const copy = document.createElement('span'); copy.textContent = text; message.append(copy); message.hidden = false;
    const rect = message.getBoundingClientRect();
    const start = origin || { x: innerWidth / 2, y: innerHeight / 2 };
    const left = Math.max(10, Math.min(innerWidth - rect.width - 10, start.x - rect.width / 2));
    const toolbarBottom = document.getElementById('app-toolbar')?.getBoundingClientRect().bottom || 0;
    const top = Math.max(toolbarBottom + 34, Math.min(innerHeight - rect.height - 12, start.y - rect.height - 18));
    message.style.left = `${left}px`; message.style.top = `${top}px`;
    message.style.transformOrigin = `${start.x - left}px ${start.y - top}px`;
    if (message.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) message.animate([
      { transform: 'translateY(0) scale(.035)', borderRadius: '50%', opacity: .4, offset: 0 },
      { transform: 'translateY(0) scale(1)', borderRadius: '10px', opacity: 1, offset: .13 },
      { transform: 'translateY(-12px) scale(1)', borderRadius: '10px', opacity: 1, offset: .82 },
      { transform: 'translateY(-28px) scale(1)', borderRadius: '10px', opacity: 0, offset: 1 },
    ], { duration: 2500, easing: 'ease-out', fill: 'forwards' });
    messageTimer = setTimeout(() => { message.hidden = true; }, 2500);
  };
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
  function visibleIds(c) {
    if (!c?.q) return [];
    if (c.phase === 'question') return ['small', 'big', 'both', 'buffer', 'reveal'];
    return c.phase === 'answers' ? ['fifty'] : [];
  }
  function button(id, compact, c) {
    const p = POWERUPS[id];
    const used = !!c.q.powerups?.used?.[id], rerollLocked = REROLLS.includes(id) && c.q.powerups?.used?.reroll;
    const status = used ? 'Used' : rerollLocked ? 'Reroll used' : `${p.cost} <img class="pu-coin" src="icons/coin-v2.png" alt="coins">`;
    const disabled = busy || !ids(c).includes(id) || ports.coins() < p.cost;
    return `<button type="button" class="pu-button${compact ? ' pu-inline' : ''}${used ? ' pu-used' : ''}" data-powerup="${id}" aria-label="${p.name}, ${used ? 'already used' : rerollLocked ? 'reroll already used' : p.cost + ' coins'}" ${disabled ? 'disabled' : ''}><img src="icons/powerups/${p.icon}.png" alt=""><span>${compact ? (id === 'buffer' ? 'Add 10% buffer' : p.label) : p.label}</span><small>${status}</small></button>`;
  }
  function html(c) {
    const visible = visibleIds(c);
    return visible.length ? `<div class="pu-row" aria-label="Power-ups">${visible.map(id => button(id, false, c)).join('')}</div>` : '';
  }
  function render() {
    const c = context(), quick = c?.mode === 'quick';
    if (messagePhase && (messagePhase !== c?.phase || messageQuestion !== c?.q?.powerupKey)) message.hidden = true;
    tray.hidden = true;
    const side = document.querySelector('.score-sidebar');
    if (side) side.style.paddingTop = '';
    if (!quick) { tray.innerHTML = ''; return; }
    const available = visibleIds(c);
    if (!available.length) { tray.innerHTML = ''; return; }
    const col = document.querySelector('.hud-timer-col'), main = document.querySelector('.main-col');
    const pics = document.getElementById('q-preview'), body = document.querySelector('.game-body');
    const hudRect = hud.getBoundingClientRect(), colRect = col.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect(), sideRect = side.getBoundingClientRect();
    const raised = available.includes('buffer') && available.length > 1;
    const lower = ['reveal', 'small', 'big', 'both', 'fifty'].filter(id => available.includes(id));
    const ordered = raised ? ['buffer', ...lower] : available;
    const width = sideRect.right - mainRect.right - 6;
    const cell = (width - 10) / 4;
    const top = raised ? Math.max(colRect.bottom + 2, pics.getBoundingClientRect().top - 46) : body.getBoundingClientRect().top + 4;
    const content = ordered.map(id => button(id, false, c)).join('');
    if (tray.innerHTML !== content) tray.innerHTML = content;
    tray.classList.toggle('pu-l-shape', raised);
    tray.style.width = `${available.length === 1 ? cell + 4 : width}px`;
    tray.style.left = `${(available.length === 1 ? sideRect.right - cell - 4 : mainRect.right + 6) - hudRect.left}px`;
    tray.style.top = `${top - hudRect.top}px`;
    tray.hidden = false;
    side.style.paddingTop = `${Math.max(0, top + (raised ? 92 : 48) - body.getBoundingClientRect().top + 6)}px`;
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
  async function purchase(id, c, origin) {
    if (busy || !c || !same(c) || !ids(context()).includes(id) || ports.coins() < POWERUPS[id].cost) return;
    const owner = ports.owner(), operation = crypto.randomUUID();
    let charged = false, applied = false, sounded = false;
    const successSound = () => { if (!sounded) { sounded = true; ports.onUsed?.(id); } };
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
      successSound();
      if (id === 'reveal') await preview(previewImages);
      await settle(owner, operation, true);
      const result = { small: 'Small object replaced', big: 'Big object replaced', both: 'Both objects replaced', buffer: '10% buffer ready for your result!', reveal: 'Size preview complete', fifty: 'Wrong choices removed' }[id];
      say(result + (REROLLS.includes(id) && c.mode === 'quick' ? ' · timer restarted' : ''), origin, id);
    } catch (err) {
      // A network failure can leave an acknowledged debit or room write uncertain.
      // Reconcile from server state before refunding; never guess about a debit.
      try {
        const p = await ports.profile(owner);
        charged = !!p?.powerupReceipts?.[operation];
        if (c.roomCode && charged) applied = (await ports.room(c.roomCode))?.powerupReceipts?.[operation] === true;
        if (charged) await settle(owner, operation, applied);
      } catch { say('Connection interrupted. Your purchase will be checked when you reconnect.', origin, id); }
      if (applied) successSound();
      say(applied ? 'Power-up applied.' : (err.message || 'Could not use this power-up.'), origin, id);
    } finally {
      active.delete(operation); busy = false; ports.refresh(c.mode); render(); ports.finished();
    }
  }
  async function preview(images) {
    const [u, t] = images.map(x => x.object);
    const layer = document.createElement('div'); layer.className = 'pu-preview';
    layer.setAttribute('role', 'status'); layer.setAttribute('aria-label', 'Four-second relative size preview');
    layer.innerHTML = '<p class="pu-preview-title"><img src="icons/powerups/item-reveal.png" alt="">Look closely!</p><canvas class="pu-stage" width="1200" height="620"></canvas>';
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
    // A pending purchase locks conflicting actions, not typing or navigation.
    if (busy && e.target.closest('[data-powerup],#submit-guess-btn,#wl-submit,#sv-submit,#dc-submit,#mo-submit')) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    const b = e.target.closest('[data-powerup]');
    if (b && !b.disabled) {
      const rect = b.getBoundingClientRect(), origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      e.preventDefault(); e.stopImmediatePropagation(); purchase(b.dataset.powerup, context(), origin);
    }
  }, true);
  document.addEventListener('keydown', e => {
    if (busy && e.target.closest('[data-powerup],#submit-guess-btn,#wl-submit,#sv-submit,#dc-submit,#mo-submit')) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(() => render());
    for (const el of [document.querySelector('.hud-timer-row'), document.querySelector('.hud-timer-col'), document.querySelector('.game-body')]) if (el) observer.observe(el);
  }
  return { get busy() { return busy; }, html, render, recover };
}
