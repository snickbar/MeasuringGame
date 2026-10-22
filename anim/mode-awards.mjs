// Dedicated awards use durable career totals, not the capped recent-game lists.
export const MODE_AWARD_CATEGORIES = ['Team vs Team', 'Team Worlds', 'High/Low Survival', 'High Stakes', 'Daily'];
const count = value => Math.max(0, Number(value) || 0);
const values = value => Object.values(value || {});
const teamHistory = profile => values(profile.teamWorldsHistory).flatMap(values);

export function threeStarTeamFinishes(profile) {
  // Older team records contain accuracy. Match the existing Worlds rule: above 90%.
  const historical = teamHistory(profile).filter(row => row.s > 90).length;
  return Math.max(count(profile.stats?.threeStarTeamWorlds), historical);
}

export function createModeAwards(getProfile) {
  const participation = [15, 40, 100], skill = [25, 75, 150];
  const families = [
    ['team-spirit', 'Team vs Team', 'Team spirit', [1, 10, 25], participation,
      n => `Finish ${n} Team vs Team game${n === 1 ? '' : 's'}`,
      p => Math.max(count(p.modeStats?.teamvteam?.games), values(p.teamHistory).length), 'items/soccer-ball.webp'],
    ['winning-combination', 'Team vs Team', 'Winning combination', [1, 5, 20], skill,
      n => `Win ${n} Team vs Team game${n === 1 ? '' : 's'}`,
      p => count(p.modeStats?.teamvteam?.wins), 'icons/reactions/trophy.png'],
    ['travel-buddies', 'Team Worlds', 'Travel buddies', [1, 10, 25], participation,
      n => `Finish ${n} Team Worlds game${n === 1 ? '' : 's'}`,
      p => Math.max(count(p.stats?.teamWorldsAttempts), count(p.modeStats?.teamworlds?.attempts), teamHistory(p).length), 'items/hot-air-balloon.webp'],
    ['perfect-partnership', 'Team Worlds', 'Perfect partnership', [1, 5, 15], skill,
      n => `Earn three stars in ${n} Team Worlds game${n === 1 ? '' : 's'}`,
      threeStarTeamFinishes, 'icons/flair/star.png'],
    ['holding-the-line', 'High/Low Survival', 'Holding the line', [5, 10, 20], skill,
      n => `Survive ${n} rounds in one High/Low Survival run`,
      p => count(p.hlSurvival?.best), 'items/t-rex.webp'],
    ['in-sync', 'High/Low Survival', 'In sync', [3, 5, 10], skill,
      n => `Stay in sync for ${n} consecutive High/Low Survival rounds`,
      p => count(p.hlSurvival?.bestStreak), 'icons/reactions/trophy.png'],
    ['at-the-table', 'High Stakes', 'At the table', [1, 10, 25], participation,
      n => `Finish ${n} High Stakes game${n === 1 ? '' : 's'}`,
      p => Math.max(count(p.modeStats?.highstakes?.games), count(p.hsStats?.games), count(p.stats?.highStakesGames)), 'items/poker-chip.webp'],
    ['high-roller', 'High Stakes', 'High roller', [1, 5, 20], skill,
      n => `Win ${n} High Stakes game${n === 1 ? '' : 's'}`,
      p => count(p.modeStats?.highstakes?.wins), 'icons/reactions/trophy.png'],
    ['called-your-bluff', 'High Stakes', 'Called your bluff', [1, 5, 20], skill,
      n => `Win ${n} High Stakes round${n === 1 ? '' : 's'} with a fake answer after everyone else folds`,
      p => count(p.hsStats?.bluffs), 'items/poker-chip.webp'],
    ['daily-regular', 'Daily', 'Daily regular', [5, 25, 100], participation,
      n => `Complete ${n} Daily Challenges`,
      p => Math.max(count(p.stats?.dailies), count(p.modeStats?.daily?.attempts), values(p.dailyHistory).length), 'icons/toolbar-daily.png'],
  ];
  return families.flatMap(([id, cat, name, targets, rewards, describe, progress, icon]) =>
    targets.map((target, tier) => ({
      id: `mode-${id}-${target}`, cat, name: name + ['', ' II', ' III'][tier],
      desc: describe(target), target, reward: rewards[tier], icon,
      progress: () => progress(getProfile() || {}),
    })));
}
