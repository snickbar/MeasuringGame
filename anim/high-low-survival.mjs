// Room state is authoritative: either client can render the same shield and theme.
export const HL_SHIELD_CHAIN = 3;
export const hlThemeDue = survived => survived > 0 && survived % 5 === 4;
export function hlSurvivalOutcome(room, passed, themed = false) {
  const saved = !passed && !!room.hlShield;
  let shield = !!room.hlShield, charge = room.hlShieldCharge || 0;
  if (!passed) { shield = false; charge = 0; }
  else if (!shield && ++charge >= HL_SHIELD_CHAIN) { shield = true; charge = 0; }
  const survived = (room.hlSurvived || 0) + (passed ? 1 : 0);
  return {
    hlLives: Math.max(0, (room.hlLives ?? room.settings?.lives ?? 3) - (!passed && !saved ? 1 : 0)),
    hlSurvived: survived, hlShield: shield, hlShieldCharge: charge,
    hlThemeWins: (room.hlThemeWins || 0) + (passed && themed ? 1 : 0),
    saved, earned: passed && !room.hlShield && shield,
    milestone: passed && (survived === 3 || survived % 5 === 0) ? survived : 0,
  };
}
