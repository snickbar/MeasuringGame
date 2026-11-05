import { MONTHLY_FORMAT } from './monthly-challenge.mjs';

function savedMonth(profile) {
  const saved = profile?.monthly;
  return saved?.format === MONTHLY_FORMAT && /^\d{4}-(0[1-9]|1[0-2])$/.test(saved.key || '') ? saved : null;
}

// A completed first attempt remains eligible after upgrading to monthly rewards.
// Practice, older retired formats and unfinished levels never supply these flags.
export function monthlyLevelEarned(profile, month, level) {
  if (!(month >= 1 && month <= 12 && level >= 1 && level <= 4)) return false;
  const mm = String(month).padStart(2, '0');
  if (profile?.stats?.['mc' + mm + 'L' + level]) return true;
  const saved = savedMonth(profile);
  return !!(saved?.key.endsWith('-' + mm) && saved.levels?.[level]?.done);
}

const setPath = (source, [key, ...rest], value) => ({ ...source, [key]: rest.length ? setPath(source?.[key], rest, value) : value });

// Idempotent, small-path repair. It never pays coins or claims a new reward.
export function repairMonthlyRewards(profile, sceneIds = []) {
  if (!profile) return profile;
  let next = profile;
  const saved = savedMonth(profile);
  if (saved) for (let level = 1; level <= 4; level++) {
    const key = 'mc' + saved.key.slice(5) + 'L' + level;
    if (saved.levels?.[level]?.done && !profile.stats?.[key]) next = setPath(next, ['stats', key], 1);
  }
  // Earlier capsules could charge for a monthly board but grant the ordinary
  // board field. Honour that existing grant; future capsules exclude these IDs.
  for (const [id, owned] of Object.entries(profile.cosmetics?.owned?.boards || {})) {
    if (owned && /^mb(0[1-9]|1[0-2])$/.test(id) && !profile.cosmetics?.owned?.monthly?.[id]) {
      next = setPath(next, ['cosmetics', 'owned', 'monthly', id], true);
    }
  }
  // Appended monthly rows previously inherited the last row builder's category.
  const wrong = profile.randomPool?.boards;
  if (wrong) {
    const boards = { ...wrong };
    let changed = false;
    for (const [id, value] of Object.entries(wrong)) {
      const category = /^mf(0[1-9]|1[0-2])$/.test(id) ? 'flairs'
        : /^m(0[1-9]|1[0-2])$/.test(id) ? 'reactions' : sceneIds.includes(id) ? 'backgrounds' : null;
      if (!category) continue;
      if (!Object.hasOwn(profile.randomPool?.[category] || {}, id)) next = setPath(next, ['randomPool', category, id], value);
      delete boards[id]; changed = true;
    }
    if (changed) next = setPath(next, ['randomPool', 'boards'], boards);
  }
  return next;
}
