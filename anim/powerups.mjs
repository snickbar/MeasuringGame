// Shared rules for solo power-ups. Keep prices here so every game mode agrees.
export const POWERUPS = Object.freeze({
  small: { label: 'Small', name: 'Reroll small', cost: 5, icon: 'reroll-small', description: 'Replace the smaller object. One reroll per question; your timer starts fresh.' },
  big: { label: 'Big', name: 'Reroll big', cost: 5, icon: 'reroll-big', description: 'Replace the larger object. One reroll per question; your timer starts fresh.' },
  both: { label: 'Both', name: 'Reroll both', cost: 10, icon: 'reroll-both', description: 'Replace both objects. One reroll per question; your timer starts fresh.' },
  buffer: { label: 'Buffer', name: '10% buffer', cost: 10, icon: 'percentage-buffer', description: 'Move your guess toward the answer by up to 10% of the correct answer, stopping at exact. All rewards use your improved guess. It stays hidden until results.' },
  reveal: { label: 'Reveal', name: 'Item reveal', cost: 10, icon: 'item-reveal', description: 'See the objects at their relative sizes for four seconds, once this question. No measurements are shown. The game timer keeps running.' },
  fifty: { label: '50/50', name: '50/50', cost: 2, icon: 'fifty-fifty', description: 'Remove half the available choices where possible. The correct answer stays, and at least two choices remain.' },
});
export const REROLLS = ['small', 'big', 'both'];
export function bufferedGuess(raw, answer, active) {
  if (!active || !Number.isFinite(raw) || !(answer > 0)) return raw;
  if (Math.abs(answer - raw) <= answer * 0.1) return answer;
  return raw + Math.sign(answer - raw) * answer * 0.1;
}
export function quickEligible(room, playerId, host) {
  return !!(host && room?.settings?.solo && room.players?.[playerId] &&
    Object.entries(room.players).every(([id, p]) => id === playerId || p.isBot));
}
export function availablePowerups(q, phase, submitted = false) {
  const used = q?.powerups?.used || {};
  if (phase === 'answers') return used.fifty ? [] : ['fifty'];
  if (phase !== 'question') return [];
  if (submitted) return used.buffer ? [] : ['buffer'];
  return [...(used.reroll ? [] : REROLLS), ...(!used.buffer ? ['buffer'] : []), ...(!used.reveal ? ['reveal'] : [])];
}
export function eliminationChoices(answers, playerId, answer, rng = Math.random) {
  const choices = answers.filter(e => e.playerId !== playerId);
  const correct = e => e.truth || Math.abs(e.value - Math.round(answer * 100) / 100) < 0.005;
  if (!choices.some(correct)) return [];
  const wrong = choices.filter(e => !correct(e));
  for (let i = wrong.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [wrong[i], wrong[j]] = [wrong[j], wrong[i]]; }
  // Keep an incorrect alternative too: duplicate correct cards must not turn
  // the remaining choices into an answer reveal.
  return wrong.slice(0, Math.max(0, Math.min(Math.floor(choices.length / 2), choices.length - 2, wrong.length - 1))).map(e => e.playerId);
}
export function replacementPairs(q, kind, objects, allowed = () => true) {
  const out = [];
  const units = objects.filter(u => kind === 'big' ? u.id === q.unitId : u.id !== q.unitId);
  const targets = objects.filter(t => kind === 'small' ? t.id === q.targetId : t.id !== q.targetId);
  for (const u of units) {
    for (const t of targets) {
      if (u.id === t.id || u.mm >= t.mm || !allowed(u, t)) continue;
      out.push([u, t]);
    }
  }
  return out;
}

// Yield between expensive chunks so the pending state and keypad keep painting.
export async function replacementPairsResponsive(q, kind, objects, allowed = () => true, yieldFrame = () => new Promise(resolve => requestAnimationFrame(resolve))) {
  if (kind !== 'both') return replacementPairs(q, kind, objects, allowed);
  const out = [], units = objects.filter(u => u.id !== q.unitId), targets = objects.filter(t => t.id !== q.targetId);
  let yieldedAt = performance.now();
  for (const u of units) {
    for (const t of targets) if (u.id !== t.id && u.mm < t.mm && allowed(u, t)) out.push([u, t]);
    if (performance.now() - yieldedAt >= 8) { await yieldFrame(); yieldedAt = performance.now(); }
  }
  return out;
}
// Idempotent wallet mutations. A receipt also makes an interrupted purchase recoverable.
export function debitPowerup(profile, id, receipt) {
  if (!profile || profile.powerupReceipts?.[id] || Number(profile.coins || 0) < receipt.cost) return;
  const receipts = Object.entries(profile.powerupReceipts || {});
  const pending = receipts.filter(([, r]) => r.status === 'charged');
  const settled = receipts.filter(([, r]) => r.status !== 'charged').sort((a, b) => b[1].at - a[1].at).slice(0, 63);
  return { ...profile, coins: Number(profile.coins || 0) - receipt.cost,
    powerupReceipts: { ...Object.fromEntries([...pending, ...settled]), [id]: { ...receipt, status: 'charged' } } };
}
export function settlePowerup(profile, id, applied) {
  const receipt = profile?.powerupReceipts?.[id];
  if (!receipt || receipt.status !== 'charged') return;
  return { ...profile, coins: Number(profile.coins || 0) + (applied ? 0 : receipt.cost),
    powerupReceipts: { ...profile.powerupReceipts, [id]: { ...receipt, status: applied ? 'applied' : 'refunded' } } };
}
