// Which Is Bigger: choosing the pair for each round.
//
// "Bigger" always means the dimension each object is measured by (its `mm`).
// Rules (agreed with the owner):
//  - Pairs get closer in size as a run goes on, but not strictly: some rounds are
//    fully random and some step back up to an easier gap.
//  - Never the same size (no right answer) and never closer than MIN_RATIO,
//    which is below what anyone could judge by knowledge.
//  - No object repeats in a run unless every object has already been used.
//  - Which card holds the bigger object is random.

export const MIN_RATIO = 1.25;       // closest allowed gap (bigger / smaller)
export const START_RATIO = 40;       // typical gap in round 1
export const RAMP_ROUNDS = 12;       // round at which the typical gap reaches MIN_RATIO
export const RANDOM_CHANCE = 0.2;    // share of rounds with a completely random pair
export const BREATHER_CHANCE = 0.15; // share of rounds that step back up to an easier gap
export const SPIKE_CHANCE = 0.15;    // share of rounds that jump ahead to a harder gap than the ramp expects

// The typical log-gap for a round: a straight line (in log space) from START_RATIO to MIN_RATIO.
export function targetLogRatio(round) {
  const t = Math.min(1, Math.max(0, (round - 1) / (RAMP_ROUNDS - 1)));
  return Math.log(START_RATIO) + (Math.log(MIN_RATIO) - Math.log(START_RATIO)) * t;
}

// Which kind of round this is, from one random roll: 'random', 'breather', 'spike' or 'ramp'.
export function roundKind(roll) {
  if (roll < RANDOM_CHANCE) return 'random';
  if (roll < RANDOM_CHANCE + BREATHER_CHANCE) return 'breather';
  if (roll < RANDOM_CHANCE + BREATHER_CHANCE + SPIKE_CHANCE) return 'spike';
  return 'ramp';
}

// Allowed log-gap window for a round of the given kind.
export function gapWindow(round, kind) {
  const floor = Math.log(MIN_RATIO), ceiling = Math.log(START_RATIO * 10);
  if (kind === 'random') return [floor, Infinity];
  const c = targetLogRatio(round);
  // A breather aims well above the ramp, but never past the very first round's gap.
  // A spike aims well below the ramp (a harder, closer pair) even early in the run.
  const centre = kind === 'breather' ? Math.min(ceiling, c * 1.8 + 0.4) : kind === 'spike' ? c * 0.45 : c;
  return [Math.max(floor, centre * 0.6), Math.max(floor + 0.15, centre * 1.4)];
}

const usable = o => o && Number.isFinite(o.mm) && o.mm > 0;

// objects: [{id, mm, ...}]. state: {round, used:Set<id>}. rng: () => [0,1).
// Returns {left, right, bigger, smaller, ratio, kind, recycled} where `left`/`right` are the
// cards in display order. `recycled` is true if the run had to start reusing objects.
export function pickBiggerPair({ objects, round = 1, used = new Set(), rng = Math.random }) {
  const pool = objects.filter(usable);
  if (pool.length < 2) throw Error('Which Is Bigger needs at least two measurable objects');
  const kind = roundKind(rng());
  let recycled = false;
  let fresh = pool.filter(o => !used.has(o.id));
  // Out of unused objects (or no unused pair has a legal gap): reuse everything.
  if (!hasLegalPair(fresh)) { fresh = pool; recycled = true; }
  const [lo, hi] = gapWindow(round, kind);
  const pair = findPair(fresh, lo, hi, rng) || findPair(fresh, Math.log(MIN_RATIO), Infinity, rng);
  if (!pair) throw Error('No legal pair for Which Is Bigger');
  const [small, big] = pair;
  const bigOnRight = rng() < 0.5;
  return {
    left: bigOnRight ? small : big, right: bigOnRight ? big : small,
    bigger: big, smaller: small, ratio: big.mm / small.mm, kind, recycled,
  };
}

function hasLegalPair(list) {
  if (list.length < 2) return false;
  const sorted = [...list].sort((a, b) => a.mm - b.mm);
  return sorted[sorted.length - 1].mm / sorted[0].mm >= MIN_RATIO;
}

// Random pair whose log-gap is inside [lo, hi]. Walks the sorted list so it stays fast for 500+ objects.
function findPair(list, lo, hi, rng) {
  const sorted = [...list].sort((a, b) => a.mm - b.mm);
  const n = sorted.length;
  // Try a handful of random anchors, then fall back to an exhaustive scan so a legal pair is never missed.
  for (let attempt = 0; attempt < 40; attempt++) {
    const small = sorted[Math.floor(rng() * n)];
    const options = partners(sorted, small, lo, hi);
    if (options.length) return [small, options[Math.floor(rng() * options.length)]];
  }
  const all = [];
  for (const small of sorted) for (const big of partners(sorted, small, lo, hi)) all.push([small, big]);
  return all.length ? all[Math.floor(rng() * all.length)] : null;
}

function partners(sorted, small, lo, hi) {
  const minMm = small.mm * Math.exp(lo), maxMm = hi === Infinity ? Infinity : small.mm * Math.exp(hi);
  return sorted.filter(o => o.mm >= minMm && o.mm <= maxMm && o.mm > small.mm);
}

export const isCorrectPick = (pair, pickedId) => pickedId === pair.bigger.id;

// Difficulty label shown under the pair, from how many times bigger the larger object is.
// Close pairs are harder. Tier 1 = very easy ... tier 5 = very hard.
export const DIFFICULTY_TIERS = [
  { tier: 1, label: 'Very easy', minRatio: 20 },
  { tier: 2, label: 'Easy', minRatio: 6 },
  { tier: 3, label: 'Medium', minRatio: 2.5 },
  { tier: 4, label: 'Hard', minRatio: 1.6 },
  { tier: 5, label: 'Very hard', minRatio: 0 },
];
export function difficultyOf(ratio) {
  return DIFFICULTY_TIERS.find(t => ratio >= t.minRatio) || DIFFICULTY_TIERS[DIFFICULTY_TIERS.length - 1];
}
