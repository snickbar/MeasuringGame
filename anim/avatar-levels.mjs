// Avatar levels. Pure, so the curve can be tested without the game running.
// AP_LEVEL_AT[n - 1] is the TOTAL avatar points an avatar needs to be Level n. The steps get bigger as you climb (6, 10, 16, 24, 30, 34 more AP):
// Level 1 and 2 come quickly, the top ones take real play. The top is still 120 AP, the same as the old flat 20-per-level ladder, and every
// step is at or below the old line, so nobody lost a level when this curve came in.
export const AP_LEVEL_AT = [6, 16, 32, 56, 86, 120];
export const MAX_AVATAR_LEVEL = AP_LEVEL_AT.length;
// The level each look feature opens at (borders, colors, stickers, auras). index.html keeps the same numbers (FRAME_LEVEL ...) and test:avatar-levels checks they match.
export const PERK_LEVEL = { frame: 3, color: 4, sticker: 5, aura: 6 };

export function avatarLevelFor(points) {
  const ap = Number(points) || 0;
  let level = 0;
  while (level < MAX_AVATAR_LEVEL && ap >= AP_LEVEL_AT[level]) level++;
  return level;
}

// Where this avatar is on its way to the next level: { level, into, span, done }. `into` of `span` AP are earned; `done` once at the top.
export function avatarLevelProgress(points) {
  const ap = Math.max(0, Number(points) || 0), level = avatarLevelFor(ap);
  if (level >= MAX_AVATAR_LEVEL) return { level, into: 0, span: 0, done: true };
  const from = level ? AP_LEVEL_AT[level - 1] : 0;
  return { level, into: ap - from, span: AP_LEVEL_AT[level] - from, done: false };
}
