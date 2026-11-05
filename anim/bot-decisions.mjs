// Delayed callbacks can survive resume, host handoff, rerolls and Play Again.
// Validate and insert against the current room atomically: first submission wins.
export function botDecisionScope(room, question = room?.currentQuestion, round = room?.round) {
  return { gameId: room?.gameId, round, questionKey: question?.powerupKey,
    prompt: question?.prompt, unitId: question?.unitId, targetId: question?.targetId,
    clockKey: room?.questionClock?.key };
}

export function commitBotDecision(room, scope, hostId, botId, field, value, now) {
  if (!room || !['guesses', 'picks'].includes(field)) return;
  const phase = field === 'guesses' ? 'question' : 'answers', q = room.currentQuestion;
  if (room.phase !== phase || room.paused || room.gameId !== scope.gameId || room.round !== scope.round ||
      !room.players?.[hostId]?.isHost || room.players[hostId].connected === false || !room.players?.[botId]?.isBot ||
      !q || q.powerupKey !== scope.questionKey || q.prompt !== scope.prompt || q.unitId !== scope.unitId || q.targetId !== scope.targetId ||
      room.questionClock?.key !== scope.clockKey || room[field]?.[botId] !== undefined) return;
  if (field === 'guesses' && room.questionClock && !room.questionClock.startedAt) return;
  const deadline = field === 'guesses' ? room.graceEndsAt || room.questionEndsAt : room.answersEndsAt;
  if (deadline && now >= deadline) return;
  return { ...room, [field]: { ...(room[field] || {}), [botId]: value } };
}
