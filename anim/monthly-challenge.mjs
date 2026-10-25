export const MONTHLY_FORMAT = 4;
// One leaderboard per level (1-3 are a third of the pack each, 4 is the Mega run through the whole pack).
export const monthlyBoardKey = (key, level) => level ? `${key}-L${level}-v${MONTHLY_FORMAT}` : `${key}-full-pack-v${MONTHLY_FORMAT}`;

// One-time reset of the old attempt only. Keep its backup and all other profile
// fields; subsequent opens of this version resume normally.
export function resetMonthlyProgress(profile, key) {
  if (!profile?.monthly || profile.monthly.key !== key || profile.monthly.format === MONTHLY_FORMAT) return profile;
  return { ...profile, monthlyResetBackup: profile.monthly,
    monthly: { key, format: MONTHLY_FORMAT, levels: {}, done: false } };
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
  // Expanding an existing pack must not replace questions already answered.
  // Finished attempts retain their original score/reward; unfinished attempts
  // keep every saved comparison in order and append only newly available items.
  if (saved?.format >= 2 && validMonthlyPairs(saved.combos, { ...rules, complete: false })) {
    if (saved.done) return saved.combos;
    // The level split depends on the size order of the whole pack. Keep a
    // started level-based attempt frozen for this month rather than moving
    // previously answered objects between levels when new art is enabled.
    const startedLevels = saved.format >= 4 && Object.values(saved.levels || {}).some(l => l?.done || Object.values(l?.guesses || {}).length > 0);
    if (startedLevels) return saved.combos;
    const pack = new Set(rules.monthly.map(o => o.id));
    const used = new Set(saved.combos.flatMap(q => [q.unitId, q.targetId]).filter(id => pack.has(id)));
    const merged = [...saved.combos, ...generated.filter(q => !used.has(q.unitId) && !used.has(q.targetId))];
    if (!validMonthlyPairs(merged, rules)) throw Error('Incomplete expanded monthly pack');
    return merged;
  }
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

// ---- Levels. The month's pack is split evenly into three levels (a mix of sizes in each, the same split for
// everyone); level 4 (Mega) is every question. Returns, per level, the indexes into `pairs` (in their original order).
export const MONTHLY_LEVELS = [1, 2, 3, 4];
export function monthlyLevelSplit(pairs, { monthly, objects }) {
  const pack = new Set(monthly.map(o => o.id));
  const packId = q => (pack.has(q.unitId) ? q.unitId : q.targetId);
  const order = pairs.map((q, i) => ({ i, o: objects.get(packId(q)) }))
    .sort((a, b) => ((a.o?.mm || 0) - (b.o?.mm || 0)) || (a.o?.id < b.o?.id ? -1 : 1));
  const out = { 1: [], 2: [], 3: [], 4: pairs.map((_, i) => i) };
  order.forEach((e, n) => out[(n % 3) + 1].push(e.i));
  [1, 2, 3].forEach(l => out[l].sort((a, b) => a - b));
  return out;
}
// 'done', 'play' (next up, or replayable-in-progress) or 'lock'. Each level opens once the one before it is finished;
// Mega opens after level 3.
export function monthlyLevelStates(monthly) {
  const done = l => !!monthly?.levels?.[l]?.done;
  return {
    1: done(1) ? 'done' : 'play',
    2: done(2) ? 'done' : done(1) ? 'play' : 'lock',
    3: done(3) ? 'done' : done(2) ? 'play' : 'lock',
    4: done(4) ? 'done' : (done(1) && done(2) && done(3)) ? 'play' : 'lock',
  };
}
export const monthlyLockText = level => (level >= 2 ? `Finish ${level === 4 ? 'Level 3' : 'Level ' + (level - 1)}` : '');
// Coins for finishing a level for real, and half of that for a replay.
export function monthlyLevelCoins(level, avgAccuracy) {
  const [base, extra] = level === 4 ? [20, 30] : [8, 12];
  return base + Math.round(Math.max(0, Math.min(100, avgAccuracy || 0)) / 100 * extra);
}
export const monthlyReplayCoins = coins => Math.floor((coins || 0) / 2);
// Which of a level's month-objects have been seen (answered) so far, for the silhouettes; Mega shows what any level revealed.
export function monthlySeenIndexes(monthly, split, level) {
  const seen = new Set();
  const take = l => {
    const g = monthly?.levels?.[l]; if (!g) return;
    const n = g.done ? split[l].length : (Array.isArray(g.guesses) ? g.guesses : Object.values(g.guesses || {})).length;
    split[l].slice(0, n).forEach(i => seen.add(i));
  };
  if (level === 4) [1, 2, 3, 4].forEach(take); else take(level);
  return seen;
}
