// Pure transaction decisions. Re-evaluated against the latest room on every retry.
import { roundAccuracy } from './accuracy.mjs';

export const HOST_TRANSFER_GRACE_MS = 60000;
export function electedHost(room, now = Date.now()) {
  if (!room || room.phase === 'ended' || room.settings?.hostTransferMode !== 'reassign') return null;
  // A temporary disconnect is not a resignation. Explicit departures remove
  // the host's seat, so those can still elect a replacement immediately.
  if (Object.values(room.players || {}).some(p => p.isHost && !p.isBot &&
    (p.connected !== false || !Number.isFinite(p.disconnectedAt) || now - p.disconnectedAt < HOST_TRANSFER_GRACE_MS))) return null;
  const humans = Object.entries(room.players || {}).filter(([, p]) => !p.isBot && p.connected !== false);
  if (humans.some(([, p]) => p.isHost)) return null;
  humans.sort(([a, p], [b, q]) => (p.joinedAt || 0) - (q.joinedAt || 0) || a.localeCompare(b));
  return humans[0]?.[0] || null;
}
export function transferHost(room, id, now = Date.now()) {
  if (room === null) return null;
  if (electedHost(room, now) !== id) return undefined;
  // Remember who the host really was: the seat is handed back when they return (see returnHost).
  const oldHost = Object.entries(room.players || {}).find(([pid, p]) => p.isHost && pid !== id)?.[0];
  return { ...room, hostOriginal: room.hostOriginal || oldHost || null, players: Object.fromEntries(Object.entries(room.players).map(([pid, p]) => [pid, { ...p, isHost: pid === id }])) };
}
// The original host is back online: they take the host seat back from whoever was covering for them.
export function returnHost(room, id) {
  if (room === null) return null;
  const me = room?.players?.[id];
  if (!room || room.phase === 'ended' || room.hostOriginal !== id || !me || me.isBot || me.connected === false || me.isHost) return undefined;
  return { ...room, hostOriginal: null, players: Object.fromEntries(Object.entries(room.players).map(([pid, p]) => [pid, { ...p, isHost: pid === id }])) };
}
export const roomCapacity = room => room?.settings?.mode === 'teamworlds' ? 2 : 10;
export function admitPlayer(room, id, player, reclaim = false) {
  if (room === null) return null;
  if (!room || room.phase === 'ended') return undefined;
  const players = room.players || {}, old = players[id];
  if(room.settings?.mode==='bluff'&&room.phase!=='waiting'&&!old)return undefined;
  if (reclaim) {
    if (!old || old.isBot || old.connected !== false || old.name?.trim().toLowerCase() !== player.name?.trim().toLowerCase()) return undefined;
  } else if (old || Object.keys(players).length >= roomCapacity(room)) return undefined;
  const frames = new Set(Object.values(players).map(p => p.frameIndex));
  const frameIndex = old?.frameIndex || Array.from({ length: 10 }, (_, i) => i + 1).find(i => !frames.has(i));
  if (!frameIndex) return undefined;
  // A returning old host cannot become a second host after a transfer.
  const otherHost = Object.entries(players).some(([pid, p]) => pid !== id && p.isHost && p.connected !== false);
  return { ...room, players: { ...players, [id]: { ...old, ...player, frameIndex, isHost: !!player.isHost && !otherHost } } };
}

export function commitHsState(room, gameId, expected, fields) {
  if (room === null) return null;
  if (!room || room.phase !== 'hs' || room.gameId !== gameId || JSON.stringify(room.hs) !== JSON.stringify(expected)) return undefined;
  const next = { ...room, ...fields }, hs = fields.hs;
  if (hs?.stage === 'reveal' && hs.result && room.hsQ) {
    // Prefix numeric keys so Firebase does not deserialize this map as an array.
    next.hsRounds = { ...room.hsRounds, ['r' + hs.round]: { q: room.hsQ, hs } };
  }
  return next;
}

export function hsRoundRecord(match, round, saved, playerId, players, t) {
  const { q, hs } = saved;
  if (!hs.seats?.includes(playerId)) return null; // spectators did not play this round
  const pick = hs.picks?.[playerId], guess = hs.options?.[pick];
  const answered = Number.isInteger(pick) && Number.isFinite(guess) && q.answer > 0;
  const r = answered ? guess / q.answer : null, accuracy = answered ? roundAccuracy(r) : 0;
  const won = !!hs.result?.winners?.includes(playerId), perfect = answered && Math.abs(guess - q.answer) < .005;
  return { kind: 'round', key: match + '_round_' + round, mode: 'highstakes', playerId,
    players: Object.fromEntries(hs.seats.filter(id => players[id]).map(id => [id, players[id]])),
    history: { t, u: q.unitId, g: q.targetId, r, rawR: r, answered, p: won ? hs.result.share : 0,
      f: (accuracy >= 99 ? 1 : 0) | (perfect ? 2 : 0), s: 9, mode: 'highstakes', buffer: false, match, round: Number(round) },
    hsProgress: { won, bluff: won && hs.result.uncontested && pick !== hs.realIdx,
      payout: won ? hs.result.share : 0, peak: Math.max(hs.startChips?.[playerId] || 0, hs.chips?.[playerId] || 0) },
    inc: { spotOns: accuracy >= 99 ? 1 : 0, perfects: perfect ? 1 : 0, roundWins: won ? 1 : 0 } };
}
