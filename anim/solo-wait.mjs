// "Last human standing": in any started game with two or more human seats, once only one human is still connected a
// grace timer starts (the game keeps running meanwhile). If the other human is back in time the timer simply clears.
// If it runs out, the game is frozen (the normal pause, so every deadline is shifted when it resumes) and everyone is
// held in a waiting lobby until all humans are back and the host taps Continue. Bots never count. Pure transaction
// decisions: they are re-run against the latest room on every retry, and return undefined to leave the room alone.
export const SOLO_WAIT_MS = 90000;
const LIVE = new Set(['countdown', 'question', 'answers', 'animation', 'reveal', 'summary', 'hs', 'bluff']);

// null when this is not a game the rule applies to (not started, finished, a Quick Game, or fewer than two human seats).
export function soloWaitState(room) {
  if (!room || !LIVE.has(room.phase) || room.settings?.solo) return null;
  const humans = Object.entries(room.players || {}).filter(([, p]) => p && !p.isBot);
  if (humans.length < 2) return null;
  return {
    humans: humans.map(([id]) => id),
    present: humans.filter(([, p]) => p.connected !== false).map(([id]) => id),
    absent: humans.filter(([, p]) => p.connected === false).map(([id]) => id),
  };
}
// Only one human (or none) is here while another human's seat is held open.
export const lastHumanStanding = (s) => !!s && s.absent.length > 0 && s.present.length <= 1;

export function startSoloWait(room, now) {
  if (room === null) return null;
  const s = soloWaitState(room);
  if (!lastHumanStanding(s) || room.paused || room.soloWait) return undefined;
  return { ...room, soloWait: { since: now, ids: s.absent } };
}
export function clearSoloWait(room) {
  if (room === null) return null;
  if (!room?.soloWait) return undefined;
  if (room.paused) return undefined; // the freeze below clears it itself
  if (lastHumanStanding(soloWaitState(room))) return undefined; // still waiting
  return { ...room, soloWait: null };
}
// The timer ran out: freeze the game and hold everyone in the waiting lobby.
export function holdForLobby(room, now) {
  if (room === null) return null;
  if (!room?.soloWait || room.paused || now - room.soloWait.since < SOLO_WAIT_MS) return undefined;
  if (!lastHumanStanding(soloWaitState(room))) return undefined;
  return { ...room, soloWait: null, paused: true, pausedAt: now, lobbyHold: { at: now } };
}
// Every human seat is connected again.
export function lobbyReady(room) {
  const humans = Object.values(room?.players || {}).filter((p) => p && !p.isBot);
  return humans.length >= 2 && humans.every((p) => p.connected !== false);
}
// The host is not here while the game is held in the lobby: the human who is here takes the host seat (the original host
// gets it back when they return, see returnHost).
export function takeLobbyHost(room, id) {
  if (room === null) return null;
  const me = room?.players?.[id];
  if (!room?.lobbyHold || !me || me.isBot || me.connected === false || me.isHost) return undefined;
  const host = Object.entries(room.players).find(([, p]) => p.isHost && !p.isBot);
  if (host && host[1].connected !== false) return undefined;
  return { ...room, hostOriginal: room.hostOriginal || host?.[0] || null, players: Object.fromEntries(Object.entries(room.players).map(([pid, p]) => [pid, { ...p, isHost: pid === id }])) };
}
// Continue: back into the game exactly where it stopped. (Deadline shifting is the normal Resume's job.)
export function clearLobbyHold(room) {
  if (room === null) return null;
  if (!room?.lobbyHold) return undefined;
  return { ...room, lobbyHold: null };
}
