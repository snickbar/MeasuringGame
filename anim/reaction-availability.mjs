// One gate for the strip, send handler and incoming effects. No invisible taps.
export function reactionAvailability({room, connected = true, visible = true, overlay = false, now = Date.now()}) {
  if (!connected || !room || !visible || overlay) return {allowed:false, reason:'Reactions are unavailable on this screen'};
  if (room.paused) return {allowed:false, reason:'Reactions resume when the game resumes'};
  if (['animation','countdown','waiting','ended'].includes(room.phase)) return {allowed:false, reason:'Reactions return after the animation'};
  if (room.phase === 'bluff' && room.bluff?.stage === 'animation') return {allowed:false, reason:'Reactions return after the animation'};
  if (room.phase === 'hs' && (['anim','animation','countdown','dealing'].includes(room.hs?.stage) ||
      (room.hs?.stage === 'reveal' && (!room.hs.animEndsAt || now < room.hs.animEndsAt)))) {
    return {allowed:false, reason:'Reactions return after the animation'};
  }
  return {allowed:['question','answers','reveal','summary','final','hs','bluff'].includes(room.phase), reason:''};
}
