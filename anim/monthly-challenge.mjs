export const MONTHLY_FORMAT = 3;
export const monthlyBoardKey = key => `${key}-full-pack-v${MONTHLY_FORMAT}`;

// One-time reset of the old attempt only. Keep its backup and all other profile
// fields; subsequent opens of this version resume normally.
export function resetMonthlyProgress(profile, key) {
  if (!profile?.monthly || profile.monthly.key !== key || profile.monthly.format === MONTHLY_FORMAT) return profile;
  return { ...profile, monthlyResetBackup: profile.monthly,
    monthly: { key, format: MONTHLY_FORMAT, guesses: [], done: false } };
}

export function createMonthlyPairs({ monthly, ordinary, rng, bands }) {
  const pool = [...monthly].sort((a, b) => a.id.localeCompare(b.id));
  const monthlyIds = new Set(pool.map(o => o.id));
  const partners = ordinary.filter(o => !monthlyIds.has(o.id) && o.mm > 0);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const used = new Set();
  return pool.map((m, i) => {
    const [lo, hi] = bands[Math.min(bands.length - 1, Math.floor(i * bands.length / pool.length))];
    const ratio = n => Math.max(m.mm, n.mm) / Math.min(m.mm, n.mm);
    const fresh = partners.filter(n => !used.has(n.id));
    const choose = (list, low, high) => list.filter(n => ratio(n) >= low && ratio(n) < high);
    let choices = choose(fresh, lo, hi);
    if (!choices.length) choices = choose(fresh, 1.01, Infinity);
    if (!choices.length) choices = choose(partners, 1.01, Infinity);
    if (!choices.length) choices = partners;
    if (!choices.length || !(m.mm > 0)) throw Error('Monthly object has no comparison partner: ' + m.id);
    const n = choices[Math.floor(rng() * choices.length)]; used.add(n.id);
    const [unit, target] = m.mm <= n.mm ? [m, n] : [n, m];
    return { unitId: unit.id, targetId: target.id };
  });
}

export function validMonthlyPairs(pairs, { monthly, ordinary, objects, complete = true }) {
  if (!Array.isArray(pairs) || !pairs.length || (complete && pairs.length !== monthly.length)) return false;
  const pack = new Set(monthly.map(o => o.id)), base = new Set(ordinary.map(o => o.id)), used = new Set();
  for (const q of pairs) {
    if (!q || q.unitId === q.targetId || !objects.has(q.unitId) || !objects.has(q.targetId)) return false;
    const u = pack.has(q.unitId), t = pack.has(q.targetId);
    if (u === t || !base.has(u ? q.targetId : q.unitId)) return false;
    const id = u ? q.unitId : q.targetId;
    if (used.has(id)) return false;
    used.add(id);
  }
  return !complete || used.size === pack.size;
}

export function restoreMonthlyPairs({ saved, shared, generated, legacy, ...rules }) {
  if (saved?.format >= 2 && validMonthlyPairs(saved.combos, rules)) return saved.combos;
  // Already scored five-round attempts keep their original result and reward.
  // In-progress old attempts keep their original questions, then see the rest.
  const guesses = saved ? Object.values(saved.guesses || {}) : [];
  if (saved && guesses.length && !(saved.format >= 2)) {
    const old = shared?.length === legacy.length && validMonthlyPairs(shared, { ...rules, complete: false }) ? shared : legacy;
    if (!validMonthlyPairs(old, { ...rules, complete: false })) throw Error('Cannot restore monthly attempt');
    if (saved.done) return old.slice(0, guesses.length);
    const pack = new Set(rules.monthly.map(o => o.id));
    const used = new Set(old.flatMap(q => [q.unitId, q.targetId]).filter(id => pack.has(id)));
    const merged = [...old, ...generated.filter(q => !used.has(q.unitId) && !used.has(q.targetId))];
    if (!validMonthlyPairs(merged, rules)) throw Error('Incomplete monthly migration');
    return merged;
  }
  return validMonthlyPairs(shared, rules) ? shared : generated;
}

// Preserve the leaderboard's existing 0–500 scale so old and longer attempts
// rank by the same average accuracy, without requiring a database-rules change.
export function monthlyBoardScore(total, rounds) {
  return rounds > 0 ? Math.round(total / rounds * 5 * 10) / 10 : 0;
}
