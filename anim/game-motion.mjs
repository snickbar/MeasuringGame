// Cosmetic submission timing only: never writes guesses or changes a deadline.
export const SUBMISSION_BOUNCE_MS = 420;
export function createLeadMotion() {
  let game, previous;
  return (key, ranked) => {
    const leaders = ranked.filter(p => p.rank === 1 && p.score > 0).map(p => p.id);
    const leader = leaders.length === 1 ? leaders[0] : null;
    const changed = game === key && previous !== undefined && leader && leader !== previous;
    game = key;
    previous = leader;
    return changed ? leader : null;
  };
}
export function createSubmissionMotion({ bounce, random = Math.random }) {
  let question = null;
  const seen = new Set(), pending = new Map();
  return {
    update(data, now) {
      const key = data.phase === 'question'
        ? `${data.roomCode}:${data.gameId}:${data.round}:${data.currentQuestion?.powerupKey || ''}` : null;
      if (key !== question) { question = key; seen.clear(); pending.clear(); }
      if (!key) return;
      const deadline = Math.min(data.questionEndsAt || Infinity, data.graceEndsAt || Infinity);
      for (const id of Object.keys(data.guesses || {})) {
        if (seen.has(id) || !data.players?.[id]) continue;
        seen.add(id);
        pending.set(id, now + (data.players[id].isBot ? random() * 1200 : 0));
      }
      if (data.paused) return;
      for (const [id, due] of pending) {
        // Re-clamp on every tick: a new grace deadline may be earlier than
        // the original timer. Leave an extra tick of margin at the end.
        const latest = deadline - SUBMISSION_BOUNCE_MS - 220;
        if (now < Math.min(due, latest)) continue;
        pending.delete(id);
        if (data.players[id] && now + SUBMISSION_BOUNCE_MS <= deadline) bounce(id);
      }
    }
  };
}

export function playSubmissionBounce(card, reduced = false) {
  const avatar = card?.querySelector('.avatar');
  if (!avatar || reduced) return;
  avatar.animate([
    { transform: 'translateY(0) scale(1)' },
    { transform: 'translateY(1px) scale(1.06,.94)', offset: .16 },
    { transform: 'translateY(-9px) scale(.97,1.04)', offset: .48 },
    { transform: 'translateY(0) scale(1.04,.97)', offset: .8 },
    { transform: 'translateY(0) scale(1)' }
  ], { duration: SUBMISSION_BOUNCE_MS, easing: 'ease-in-out' });
}

export function celebrateLead(card, reduced = false) {
  if (!card) return;
  const label = document.createElement('span');
  label.className = 'lead-celebration';
  label.textContent = 'Took the lead!';
  card.appendChild(label);
  if (!reduced) {
    card.animate([
      { filter: 'drop-shadow(0 0 0px #ffd65c)' },
      { filter: 'drop-shadow(0 0 9px #ffd65c)', offset: .25 },
      { filter: 'drop-shadow(0 0 0px #ffd65c)' }
    ], { duration: 1800 });
    card.querySelector('.medal')?.animate([
      { scale: '1' }, { scale: '1.4', offset: .4 }, { scale: '1' }
    ], { duration: 650, easing: 'ease-out' });
  }
  setTimeout(() => label.remove(), 2200);
}

export function sparkleCoins(balance, reduced = false) {
  if (!balance || reduced) return;
  // Stay inside the toolbar's reserved space; no flying overlay over buttons.
  balance.querySelectorAll('.coin-sparkle').forEach(el => el.remove());
  for (let i = 0; i < 5; i++) {
    const star = document.createElement('span');
    star.className = 'coin-sparkle';
    star.setAttribute('aria-hidden', 'true');
    const artwork = document.createElement('img');
    artwork.src = 'icons/flair/star.png'; artwork.alt = '';
    artwork.style.cssText = 'width:13px;height:13px;object-fit:contain;display:block';
    star.appendChild(artwork);
    star.style.left = `${12 + i * 17}%`;
    star.style.top = `${i % 2 ? 58 : 8}%`;
    balance.appendChild(star);
    const anim = star.animate([
      { opacity: 0, transform: 'scale(.2) rotate(0deg)' },
      { opacity: 1, transform: 'scale(1.2) rotate(35deg)', offset: .35 },
      { opacity: 0, transform: 'translateY(-6px) scale(.3) rotate(70deg)' }
    ], { duration: 750, delay: i * 65, easing: 'ease-out' });
    anim.onfinish = () => star.remove();
  }
}
