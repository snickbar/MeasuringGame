// Bot personalities. Accuracy (Low / Medium / High) still says how GOOD a bot is; a personality says HOW it plays:
// which way it misses, how fast it answers and how much it gambles. Every avatar has one fixed personality, so a player
// learns over many games that "the gator always goes low". It is a secret on the avatar card until the player has
// played PERSONALITY_UNLOCK_ROUNDS rounds against that avatar.
export const PERSONALITY_UNLOCK_ROUNDS = 25;

// bias: multiplies the guess (below 1 guesses low, above 1 guesses high)
// spread: how far its guesses stray from the answer compared with the plain accuracy level (1 = the same)
// speed: multiplies how long it waits before answering (below 1 = quick, above 1 = slow)
// risk: 0..1, used by modes where a bot can gamble (double down, High Stakes bets, Bluff lies)
export const PERSONALITIES = {
  steady:      { label: "Steady",      bias: 1,    spread: 1,    speed: 1,    risk: 0.5, blurb: "No tricks. Plays it straight." },
  lowballer:   { label: "Lowballer",   bias: 0.8,  spread: 1,    speed: 1,    risk: 0.4, blurb: "Guesses on the low side." },
  overshooter: { label: "Overshooter", bias: 1.25, spread: 1,    speed: 1,    risk: 0.5, blurb: "Guesses on the high side." },
  speedster:   { label: "Speedster",   bias: 1,    spread: 1.25, speed: 0.3,  risk: 0.6, blurb: "Answers fast, a little sloppy." },
  overthinker: { label: "Overthinker", bias: 1,    spread: 0.7,  speed: 1.6,  risk: 0.2, blurb: "Waits until the last moment, sharper." },
  gambler:     { label: "Gambler",     bias: 1,    spread: 1.3,  speed: 0.9,  risk: 0.95, blurb: "Swings big and doubles down." },
  cautious:    { label: "Cautious",    bias: 1,    spread: 0.8,  speed: 1.2,  risk: 0.05, blurb: "Plays it safe." },
  wildcard:    { label: "Wildcard",    bias: 1,    spread: 1.1,  speed: 1,    risk: 0.7, blurb: "Different every round." },
};
export const PERSONALITY_IDS = Object.keys(PERSONALITIES);

// A themed pick for avatars we have chosen by hand. Any avatar not listed gets a stable one from its id,
// so a new avatar has a personality the moment it exists and the same one on every device.
export const PERSONALITY_BY_AVATAR = {};

function hash(text) { let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

export function personalityIdFor(avatarId) {
  const id = String(avatarId || "");
  return PERSONALITY_BY_AVATAR[id] || PERSONALITY_IDS[hash("p:" + id) % PERSONALITY_IDS.length];
}
export const personalityFor = (avatarId) => PERSONALITIES[personalityIdFor(avatarId)];

// ratio = the plain accuracy level's guess divided by the answer. Returns the ratio after the personality.
export function shapeRatio(ratio, personality, rand = Math.random) {
  const p = personality || PERSONALITIES.steady;
  let r = 1 + (ratio - 1) * p.spread;
  r *= p.bias;
  if (p === PERSONALITIES.wildcard) r *= 0.75 + rand() * 0.6; // 0.75 - 1.35 each round
  return Math.max(0, r);
}

// How long to wait before answering: the plain wait scaled by speed, never past 85% of the round.
export function shapeDelay(baseMs, personality, timerMs) {
  const p = personality || PERSONALITIES.steady;
  return Math.max(250, Math.min(baseMs * p.speed, timerMs * 0.85));
}

// A bot's confidence (0..1) nudged by how much it likes a gamble: a Gambler bets bigger, a Cautious bot holds back.
export function shapeConfidence(confidence, personality) {
  const p = personality || PERSONALITIES.steady;
  return Math.max(0, Math.min(1, confidence + (p.risk - 0.5) * 0.3));
}

// A High/Low partner's miss size (how far past the answer it dares to go), scaled by the personality's spread.
export function shapeMiss(miss, personality) {
  const p = personality || PERSONALITIES.steady;
  return miss * p.spread;
}
