// Pure transaction decisions. Re-evaluated against the latest room on every retry.
import { roundAccuracy } from './accuracy.mjs';
import { hsPayout, hsWonByBluff } from './high-stakes.mjs';
import { gameRewardKey } from './game-rewards.mjs';

export function roomGameFinished(room) {
  return room?.phase === 'final' || (room?.phase === 'hs' && room.hs?.stage === 'over') ||
    (room?.phase === 'ended' && !!room.closedAfterFinish);
}

export function finishRoomDeparture(room, roomCode, key, id) {
  if (!room?.players?.[id] || !(roomGameFinished(room) || room.phase === 'ended')) return;
  try { if (gameRewardKey(roomCode, room) !== key) return; } catch { return; }
  const players = { ...room.players };
  delete players[id];
  if (!Object.values(players).some(p => !p.isBot)) return null;
  const closing = room.phase !== 'ended' && room.players[id].isHost;
  return closing ? { ...room, players, phase: 'ended', closedAfterFinish: room.phase, finishedPlayers: room.players } : { ...room, players };
}

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
// The host hands the room to another human from the lobby. Only the current host can do it, only to a human who is here,
// and only before the game starts. Nobody takes the seat back automatically afterwards (hostOriginal is cleared).
export function chooseHost(room, fromId, toId) {
  if (room === null) return null;
  const from = room?.players?.[fromId], to = room?.players?.[toId];
  if (!room || room.phase !== 'waiting' || !from?.isHost || !to || to.isBot || to.connected === false || fromId === toId) return undefined;
  return { ...room, hostOriginal: null, pendingHostReclaim: null, players: Object.fromEntries(Object.entries(room.players).map(([pid, p]) => [pid, { ...p, isHost: pid === toId }])) };
}
// The original host is back online: they take the host seat back from whoever was covering for them.
export function returnHost(room, id) {
  if (room === null) return null;
  const me = room?.players?.[id];
  if (!room || room.phase === 'ended' || room.hostOriginal !== id || !me || me.isBot || me.connected === false || me.isHost) return undefined;
  return { ...room, hostOriginal: null, players: Object.fromEntries(Object.entries(room.players).map(([pid, p]) => [pid, { ...p, isHost: pid === id }])) };
}
// A Quick Game (solo vs bots) has exactly one person in it. If an older resume left a second copy of that
// person behind (a "ghost" holding the host seat, so nobody ran the clock or the bots), drop the copy and
// hand the host seat to whoever is actually playing.
export function soloRepair(room, id) {
  if (room === null) return null;
  const players = room?.players || {}, me = players[id];
  if (!room?.settings?.solo || room.phase === 'ended' || !me || me.isBot) return undefined;
  const ghosts = Object.keys(players).filter(pid => pid !== id && !players[pid]?.isBot);
  if (!ghosts.length && me.isHost && me.connected !== false) return undefined;
  const next = { ...room, players: {} };
  for (const [pid, p] of Object.entries(players)) if (!ghosts.includes(pid)) next.players[pid] = pid === id ? { ...p, isHost: true, connected: true, disconnectedAt: null } : { ...p, isHost: false };
  for (const field of ['guesses', 'picks', 'hsPicks']) if (room[field]) { const kept = { ...room[field] }; ghosts.forEach(g => delete kept[g]); next[field] = kept; }
  if (room.answers && typeof room.answers === 'object') next.answers = Object.values(room.answers).filter(a => a && !ghosts.includes(a.playerId));
  if (ghosts.includes(room.hostOriginal)) next.hostOriginal = null;
  return next;
}
export const roomCapacity = room => room?.settings?.mode === 'teamworlds' ? 2 : 10;
export function admitPlayer(room, id, player, reclaim = false) {
  if (room === null) return null;
  if (!room || room.phase === 'ended') return undefined;
  const players = room.players || {}, old = players[id];
  if(room.settings?.mode==='bluff'&&room.phase!=='waiting'&&!old)return undefined;
  if (reclaim === 'own') {
    // This phone's own seat (its id is saved on the phone): take it back even if the room still thinks it is
    // connected - after a crash or a quick reopen the server may not have noticed the old connection dropped yet.
    if (!old || old.isBot) return undefined;
  } else if (reclaim) {
    if (!old || old.isBot || old.connected !== false || old.name?.trim().toLowerCase() !== player.name?.trim().toLowerCase()) return undefined;
  } else if (old || Object.keys(players).length >= roomCapacity(room)) return undefined;
  const frames = new Set(Object.values(players).map(p => p.frameIndex));
  const frameIndex = old?.frameIndex || Array.from({ length: 10 }, (_, i) => i + 1).find(i => !frames.has(i));
  if (!frameIndex) return undefined;
  // A returning old host cannot become a second host after a transfer.
  const otherHost = Object.entries(players).some(([pid, p]) => pid !== id && p.isHost && p.connected !== false);
  return { ...room, players: { ...players, [id]: { ...old, ...player, frameIndex, isHost: !!player.isHost && !otherHost } } };
}

// A room listener and a transaction can present the same tree with different key order.
function sameHsState(a, b) {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && sameHsState(a[key], b[key]));
}

export function commitHsState(room, gameId, expected, fields) {
  if (room === null) return null;
  if (!room || room.phase !== 'hs' || room.gameId !== gameId || !sameHsState(room.hs, expected)) return undefined;
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
  const won = !!hs.result?.winners?.includes(playerId), payout = hsPayout(hs, playerId), perfect = answered && Math.abs(guess - q.answer) < .005;
  return { kind: 'round', key: match + '_round_' + round, mode: 'highstakes', playerId,
    players: Object.fromEntries(hs.seats.filter(id => players[id]).map(id => [id, players[id]])),
    history: { t, u: q.unitId, g: q.targetId, r, rawR: r, answered, p: payout,
      f: (accuracy >= 99 ? 1 : 0) | (perfect ? 2 : 0), s: 9, mode: 'highstakes', buffer: false, match, round: Number(round) },
    hsProgress: { won, bluff: hsWonByBluff(hs, playerId),
      payout, peak: Math.max(hs.startChips?.[playerId] || 0, hs.chips?.[playerId] || 0) },
    inc: { spotOns: accuracy >= 99 ? 1 : 0, perfects: perfect ? 1 : 0, roundWins: won ? 1 : 0 } };
}
