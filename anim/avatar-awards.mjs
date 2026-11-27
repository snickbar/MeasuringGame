// Avatar achievements. Pure: everything is worked out from facts the game already keeps (avatar points, the saved look on each avatar),
// so it can be tested without the game running.
export const MAXED_LEVEL = 6;   // the top of the ladder: Aura

// The counts behind the achievements. `ids` = every avatar id; `points(id)` = its avatar points; `looks(id)` = what is saved on it,
// { frame, color, sticker, aura } (empty or 0 when unset); `tier(id)` = "default" | "common" | "rare" | "ultra"; `perLevel` = AP per level.
export function avatarAwardStats({ ids, points, looks, tier, perLevel = 20 }) {
  const level = (id) => Math.floor((Number(points(id)) || 0) / perLevel);
  const s = { rising: 0, maxed: 0, styled: 0, totalAp: 0, auras: 0, fullLook: false, mirrored: false, luckyStar: false };
  const auras = new Set();
  for (const id of ids) {
    const lv = level(id), l = looks(id) || {};
    s.totalAp += Number(points(id)) || 0;
    if (lv >= 3) s.rising++;
    if (lv >= MAXED_LEVEL) { s.maxed++; if (tier(id) === "ultra") s.luckyStar = true; }
    if (l.frame || l.color || l.sticker || l.aura) s.styled++;
    if (l.aura) auras.add(l.aura);
    if (l.frame && l.color && l.sticker && l.aura) s.fullLook = true;
    if (typeof l.sticker === "string" && l.sticker.endsWith(":m")) s.mirrored = true;
  }
  s.auras = auras.size;
  return s;
}
