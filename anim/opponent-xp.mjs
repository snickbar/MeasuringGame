export const OPPONENT_XP = { easy: .8, medium: 1.1, hard: 1.2, human: 1.1 };

export function baseCareerXp(stats) {
  return (stats.rounds || 0) * 5 + (stats.roundWins || 0) * 10 + (stats.spotOns || 0) * 25 +
    (stats.perfects || 0) * 50 + (stats.gamesPlayed || 0) * 10;
}

export function careerXpTotal(stats) {
  // Preserve historical counter-derived XP; only new rounds add adjustments.
  // Keep fractional XP in the ledger so mixed rooms do not lose it each round.
  return Math.max(0, Math.floor(baseCareerXp(stats) + (stats.xpAdjustment || 0) + 1e-7));
}

export function opponentXpMultiplier(players, playerId) {
  const opponents = Object.entries(players || {}).filter(([id, p]) => id !== playerId && p);
  if (!opponents.length) return 1;
  return opponents.reduce((sum, [, p]) => sum + (p.isBot ? (OPPONENT_XP[p.botDifficulty] ?? OPPONENT_XP.medium) : OPPONENT_XP.human), 0) / opponents.length;
}

export function roundCareerProfile(profile, key, inc, maxima, players, playerId, historyRecord) {
  if (!profile || profile.careerRounds?.[key]) return;
  const stats = { ...profile.stats }, multiplier = opponentXpMultiplier(players, playerId);
  for (const [name, value] of Object.entries(inc)) stats[name] = (stats[name] || 0) + value;
  for (const [name, value] of Object.entries(maxima || {})) stats[name] = Math.max(stats[name] || 0, value);
  const base = baseCareerXp(inc), earned = base * multiplier;
  stats.xpAdjustment = (stats.xpAdjustment || 0) + earned - base;
  const result = { ...profile, stats, careerRounds: { ...profile.careerRounds, [key]: { xp: earned, multiplier } } };
  if (historyRecord) {
    const history = Array.isArray(profile.history) ? profile.history : Object.values(profile.history || {});
    result.history = [...history, historyRecord].slice(-300);
  }
  return result;
}
