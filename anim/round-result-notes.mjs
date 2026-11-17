const near = ["Just a hair off!", "Almost nailed it!", "So close!", "Within a whisker!", "Nearly spot on!"];
const close = ["Pretty close!", "In the ballpark!", "A solid guess!"];
const farHigh = ["Went big on that one!", "Smaller than it looked!", "That guess had big plans.", "Overshot it!"];
const farLow = ["Bigger than it looked!", "That one was sneakily big.", "A bigger guess next time!", "It took more than you guessed."];

export function zeroPointNote(entry, answer, key) {
  const guess = entry?.guess;
  let phrases;
  if (!Number.isFinite(guess)) phrases = ["No guess this round.", "Sat this one out."];
  else if (!Number.isFinite(answer) || answer <= 0) return "";
  else {
    const error = Math.abs(guess - answer) / answer;
    const high = guess > answer;
    if (error < .000001) return "Right on the mark!";
    if (error <= .05) phrases = near;
    else if (error <= .25) phrases = [...close, high ? "Just a little high." : "Just a little low."];
    else if (error <= .65) phrases = high
      ? ["Went a bit big.", "A bit of a stretch!", "A smaller guess next time."]
      : ["Room to go bigger.", "A little more would’ve done it.", "On the low side."];
    else phrases = high ? farHigh : farLow;
  }
  let hash = 2166136261;
  for (const ch of String(key)) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619);
  return phrases[(hash >>> 0) % phrases.length];
}

const validGuess = entry => Number.isFinite(entry?.percent) && Number.isFinite(entry?.guess);

export function roundBestGuesses(entries, question, round, players) {
  const targets = entries.map(entry => ({
    id: entry.playerId,
    name: players[entry.playerId]?.name || entry.name || "Player",
    avatar: players[entry.playerId]?.avatar || "",
    percent: entry.accuracyPercent,
    guess: entry.effectiveGuess ?? entry.guess,
    rawGuess: entry.guess,
    answer: question.answer,
    prompt: question.prompt || "",
    round,
  })).filter(validGuess).sort((a, b) => b.percent - a.percent);
  return targets[0]?.percent === 100 ? targets.filter(target => target.percent === 100) : targets.slice(0, 1);
}

export function gameBestGuesses(rounds, players) {
  const recorded = Object.values(rounds || {}).flatMap(entries => Object.values(entries || {})).filter(validGuess);
  for (const [id, player] of Object.entries(players || {})) {
    const guess = player.bestGuess;
    if (!validGuess(guess)) continue;
    const duplicate = recorded.some(row => row.id === id && (
      guess.round != null ? row.round === guess.round :
        row.guess === guess.guess && row.percent === guess.percent && row.prompt === guess.prompt));
    if (!duplicate) recorded.push({ ...guess, id, name: player.name || "Player", avatar: player.avatar || "" });
  }
  recorded.sort((a, b) => b.percent - a.percent || (a.round ?? 0) - (b.round ?? 0) || String(a.id).localeCompare(String(b.id)));
  return recorded[0]?.percent === 100 ? recorded.filter(row => row.percent === 100) : recorded.slice(0, 1);
}
