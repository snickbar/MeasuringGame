// All active humans get the same full guessing window after their boards finish.
export const questionClockPending = room => room?.phase === 'question' && !!room.questionClock && !room.questionClock.startedAt;
export const questionReadyToken = room => room?.currentQuestion?.prompt ? room.questionClock.key + ':' + room.currentQuestion.prompt : room.questionClock.key;
export function beginQuestionClock(room, key, now, away = () => false) {
  if (room === null) return null;
  if (!questionClockPending(room) || room.paused || room.questionClock.key !== key) return;
  const humans = Object.values(room.players || {}).filter(p => !p.isBot && !away(p));
  if (now < room.questionClock.waitUntil && humans.some(p => p.questionReady !== questionReadyToken(room))) return;
  return { ...room, questionClock: { ...room.questionClock, startedAt: now }, questionEndsAt: now + room.questionClock.duration };
}

// Matches the text entrance timings, excluding decorative idle motion.
export function boardReadingMs(id, count) {
  const n = Math.max(0, count), last = Math.max(0, n - 1);
  switch (id) {
    case 'terminal': return 100 + n * 55;
    case 'tv': return 1250;
    case 'typewriter': return 800;
    case 'letterboard': return last * Math.min(55, 1400 / Math.max(1,n)) + 520;
    case 'neon': return 500 + last * Math.min(45, 1300 / Math.max(1,n)) + 260;
    case 'sand': return 100 + n * 52;
    case 'scroll': return 1100;
    case 'splitflap': return last * Math.min(42, 1300 / Math.max(1,n)) + 280;
    case 'phone': return 1420;
    default: return 0;
  }
}
