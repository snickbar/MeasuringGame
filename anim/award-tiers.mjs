// Escalating award chains: a chain shows only its next unclaimed tier, and claiming it reveals the one after.
export const ROMAN_SUFFIX = ['', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII', ' IX', ' X'];
export const ROMAN = ROMAN_SUFFIX.map((s, i) => (i ? s.trim() : 'I'));
export const MAX_TIERS = 10;
export const REWARD_CAP = 200;

// Targets climb a ladder of round numbers, so every new tier reads like a real goal (75, 100, 150, 200...).
const LADDER = [1, 2, 3, 5, 8, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000];

// Takes a chain's hand-made steps and keeps extending them until `total` tiers exist.
// ratio: how much harder each new tier is. Rewards ramp up and stop at REWARD_CAP (or the chain's own top reward, if that is higher).
export function escalateSteps(steps, { total = MAX_TIERS, ratio = 1.5 } = {}) {
  const out = steps.map(([target, reward]) => [target, reward]);
  const cap = Math.max(REWARD_CAP, ...out.map(s => s[1]));
  while (out.length < total) {
    const [prevTarget, prevReward] = out[out.length - 1];
    const wanted = prevTarget * ratio;
    const target = LADDER.find(n => n >= wanted && n > prevTarget) ?? Math.ceil(wanted / 1000) * 1000;
    const reward = Math.min(cap, Math.round((prevReward * 1.3) / 5) * 5 || 5);
    out.push([target, Math.max(reward, prevReward)]);
  }
  return out;
}

// Which awards in a list may currently be seen or claimed: standalone awards always; a chain tier only once every earlier tier is claimed.
export function makeChainGate(list, isClaimed) {
  const byChain = new Map();
  list.forEach(a => { if (a.chain) { if (!byChain.has(a.chain)) byChain.set(a.chain, []); byChain.get(a.chain).push(a); } });
  return a => !a.chain || byChain.get(a.chain).every(x => x === a || x.tier >= a.tier || isClaimed(x));
}
