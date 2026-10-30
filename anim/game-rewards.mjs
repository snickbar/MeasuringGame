// Receipts and coins are written in the same profile transaction. Replaying a
// final screen, reconnecting, or retrying a lost response cannot credit it twice.
export function gameReward(score) {
  const fromScore = Number.isFinite(Number(score)) ? Math.max(0, Math.floor(Number(score))) : 0;
  return { score: fromScore, minimum: Math.max(0, 5 - fromScore), base: Math.max(5, fromScore) };
}

export function rewardProfile(profile, key, score, { double = false, complete = false } = {}) {
  if (!profile) return;
  const old = profile.gameRewards?.[key];
  if (old?.completed || (old && !double && !complete) || (old?.doubled && !complete)) return;
  const receipt = old ? { ...old } : { ...gameReward(score), doubled: false };
  // Coin booster: one charge doubles a game's first payout (the ad double still stacks on top).
  const boosted = !old && (profile.booster | 0) > 0;
  if (boosted) { receipt.base *= 2; receipt.boosted = true; }
  let credit = old ? 0 : receipt.base;
  if (double && !receipt.doubled) { credit += receipt.base; receipt.doubled = true; }
  if (complete) receipt.completed = true;
  return { ...profile, coins: (profile.coins || 0) + credit, ...(boosted ? { booster: (profile.booster | 0) - 1 } : {}),
    gameRewards: { ...(profile.gameRewards || {}), [key]: receipt } };
}

export function gameRewardKey(room, state) {
  // New games have an ID independent of round/countdown changes. The question
  // identity is a stable fallback for games already running during an update.
  const id = state.gameId || state.currentQuestion?.powerupKey || state.animStartAt || state.countdownEndsAt;
  if (!room || !id) throw Error('Missing completed game identity');
  return `${room}_${id}`.replace(/[.#$\[\]/]/g, '_');
}

export function createGameRewards({ owner, transaction, ad, finish, storage = localStorage, document: doc = document, onReward = () => {} }) {
  const storageKey = id => 'mg_pending_game_reward_' + id;
  let current = null, receipt = null, busy = false, error = '', active = false;
  let saving = null, presented = '';
  const el = doc.createElement('section');
  el.id = 'coin-reward-screen'; el.hidden = true;
  el.setAttribute('aria-label', 'Game coin reward');
  el.innerHTML = `
    <div class="coin-reward-content">
      <header><span class="coin-reward-eyebrow">GAME COMPLETE</span><h1 class="polish-banner" style="--banner:url(icons/banner-blank-blue.png)"><img src="icons/coin-v2.png" alt="">Your rewards</h1><p>Here’s what you earned.</p></header>
      <div class="coin-reward-ticket">
        <div class="coin-reward-hero"><img src="icons/coin-v2.png" alt=""><div><strong data-total>5</strong><span data-earned>coins earned</span></div></div>
        <div class="coin-reward-divider"></div>
        <div class="coin-reward-row"><span>From your score</span><b data-score>0 coins</b></div>
        <div class="coin-reward-row" data-minimum-row><span>Minimum reward bonus</span><b data-minimum>+5 coins</b></div>
        <p class="coin-reward-note" data-minimum-note>We topped you up to the 5-coin minimum.</p>
        <div class="coin-reward-row coin-reward-ad-row" data-ad-row hidden><span>Ad bonus</span><b data-bonus>+5 coins</b></div>
        <span class="coin-reward-stamp" data-stamp>ADDING YOUR COINS…</span>
      </div>
      <p class="coin-reward-doubled" data-doubled hidden>Reward doubled! Your coins have been added.</p>
      <p class="coin-reward-status" data-status role="status" aria-live="polite"></p>
      <div class="coin-reward-split">
        <button type="button" class="coin-reward-continue" data-continue>Continue</button>
        <button type="button" class="coin-reward-watch" data-double><span>Double coins</span><small data-ad-bonus>Watch an ad · +5 bonus</small></button>
      </div>
    </div>`;
  doc.body.appendChild(el);
  const get = selector => el.querySelector(selector);
  function remember() { try { storage.setItem(storageKey(current.owner), JSON.stringify(current)); } catch {} }
  function render() {
    if (!current) return;
    const r = receipt || gameReward(current.score);
    get('[data-total]').textContent = r.base * (r.doubled ? 2 : 1);
    const earned = get('[data-earned]'); if (earned) earned.textContent = r.boosted ? 'coins earned \u00b7 2x booster' : 'coins earned';
    get('[data-score]').textContent = r.score + ' coins';
    get('[data-minimum]').textContent = '+' + r.minimum + ' coins';
    get('[data-minimum-row]').hidden = !r.minimum;
    get('[data-minimum-note]').hidden = !r.minimum;
    get('[data-ad-row]').hidden = !r.doubled;
    get('[data-bonus]').textContent = '+' + r.base + ' coins';
    get('[data-ad-bonus]').textContent = 'Watch an ad · +' + r.base + ' bonus';
    get('[data-double]').hidden = !!(r.doubled || r.completed);
    get('[data-double]').disabled = busy || !receipt;
    get('[data-doubled]').hidden = !r.doubled;
    get('[data-stamp]').textContent = receipt ? 'ADDED TO YOUR BALANCE' : 'ADDING YOUR COINS…';
    get('[data-status]').textContent = error || (busy ? 'Please wait…' : '');
    get('[data-continue]').disabled = busy;
    get('[data-continue]').textContent = !receipt ? 'Retry adding coins' : 'Continue';
    const presentation = current.owner + ':' + current.key + ':' + !!r.doubled;
    if (active && receipt && !receipt.completed && presentation !== presented) {
      presented = presentation;
      try { onReward({ element: el, total: r.base * (r.doubled ? 2 : 1), added: r.base, key: presentation }); } catch {}
    }

  }
  async function settle(options = {}) {
    const pending = current;
    const result = await transaction(pending.owner, profile => rewardProfile(profile, pending.key, pending.score, options));
    const saved = result.snapshot.val()?.gameRewards?.[pending.key];
    if (!saved) throw Error('Reward could not be saved');
    if (current === pending) receipt = saved;
    return saved;
  }
  async function ensureBase() {
    if (saving) return saving;
    busy = true; error = ''; render();
    saving = settle().catch(() => { error = 'Couldn’t save your coins. Check your connection and retry.'; })
      .finally(() => { saving = null; busy = false; render(); });
    return saving;
  }
  function open() {
    if (!current || current.owner !== owner()) return;
    active = true; el.hidden = false;
    doc.body.classList.add('collecting-game-reward');
    // Keep the real toolbar visible, but neither pointer nor keyboard navigation
    // may bypass this receipt. The controller also guards toolbar callbacks.
    doc.querySelectorAll('.screen,#app-toolbar,#toolbar-menu,#bottom-toolbar,#hud-sub-toolbar').forEach(node => { node.inert = true; });
    const toolbar = doc.getElementById('app-toolbar');
    el.style.setProperty('--coin-reward-top', Math.max(0, toolbar?.getBoundingClientRect().bottom || 0) + 'px');
    render();
    if (!receipt && !saving) void ensureBase();
  }
  async function prepare(record) {
    if (current?.key === record.key && current.owner === owner()) return saving;
    current = { ...record, owner: owner(), adCompleted: false };
    receipt = null; error = ''; remember();
    await ensureBase();
  }
  async function recover() {
    if (current) return;
    let saved; try { saved = JSON.parse(storage.getItem(storageKey(owner()))); } catch { return; }
    if (!saved || saved.owner !== owner() || !/^[^.#$\[\]/]+$/.test(saved.key || '') || !Number.isFinite(saved.score)) return;
    current = saved; open();
    await ensureBase();
    // The ad finished before a process interruption: retry the same atomic
    // grant, without making the player watch another ad or issuing it twice.
    if (current.adCompleted && receipt && !receipt.doubled && !receipt.completed) await doubleReward();
  }
  async function doubleReward() {
    if (busy || !receipt || receipt.doubled || receipt.completed || current.owner !== owner()) return;
    busy = true; error = ''; render();
    try {
      if (!current.adCompleted) {
        const earned = await ad();
        if (earned !== true) return;
        current.adCompleted = true; remember();
      }
      await settle({ double: true });
    } catch { error = 'Couldn’t add the bonus. Tap Watch Ad to retry; a finished ad won’t replay.'; }
    finally { busy = false; render(); }
  }
  async function continueHome() {
    if (busy || !current || current.owner !== owner()) return;
    if (!receipt) { await ensureBase(); return; }
    if (current.adCompleted && !receipt.doubled && !receipt.completed) { await doubleReward(); return; }
    busy = true; error = ''; render();
    try {
      await settle({ complete: true });
      await finish(current);
      try { storage.removeItem(storageKey(current.owner)); } catch {}
      active = false; el.hidden = true; doc.body.classList.remove('collecting-game-reward');
      doc.querySelectorAll('.screen,#app-toolbar,#toolbar-menu,#bottom-toolbar,#hud-sub-toolbar').forEach(node => { node.inert = false; });
      current = null; receipt = null;
    } catch { error = 'Couldn’t finish. Check your connection and tap Continue again.'; }
    finally { busy = false; render(); }
  }
  get('[data-double]').addEventListener('click', doubleReward);
  get('[data-continue]').addEventListener('click', continueHome);
  return { prepare, open, recover, get active() { return active; }, get pending() { return !!current; }, element: el };
}
