// A short start reservation prevents two lobbies from spending the same free
// game. Browsing/creating rooms never writes a reservation or a used date.
export function hasHostAdGame(profile, mode) {
  return !!profile?.hostAdGames?.[mode]?.id && !profile.hostAdGames[mode].used;
}
export function grantHostAdGame(profile, {mode, rewardId, now}) {
  if (!profile || profile.hostUnlocked || hasHostAdGame(profile, mode) || profile.hostAdGames?.[mode]?.id === rewardId) return profile;
  return {...profile,hostAdGames:{...profile.hostAdGames,[mode]:{id:rewardId,earnedAt:now,used:false}}};
}
export function reserveHostStart(profile, {mode, day, room, now}) {
  if (!profile || profile.hostUnlocked) return profile;
  const daily = profile.hostFreeDates?.[mode] !== day;
  if (!daily && !hasHostAdGame(profile, mode)) return;
  const pending = profile.hostFreePending?.[mode];
  if (pending && pending.room !== room && pending.until > now) return;
  return {...profile, hostFreePending:{...profile.hostFreePending,[mode]:{room,day,until:now+120000,...(!daily?{adId:profile.hostAdGames[mode].id}:{})}}};
}
export function finishHostStart(profile, {mode, day, room}, started) {
  if (!profile || profile.hostFreePending?.[mode]?.room !== room) return;
  const adId = profile.hostFreePending[mode].adId;
  const pending = {...profile.hostFreePending}; delete pending[mode];
  if (started && adId) return {...profile,hostFreePending:pending,hostAdGames:{...profile.hostAdGames,[mode]:{...profile.hostAdGames[mode],used:true}}};
  return {...profile,hostFreePending:pending,...(started?{hostFreeDates:{...profile.hostFreeDates,[mode]:day}}:{})};
}
