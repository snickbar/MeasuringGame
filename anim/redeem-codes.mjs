// Redeem codes: a short code typed in Settings gives a one-time bonus (coins for now). Pure rules, no Firebase and no screen.
// Codes live in two places: BUILT_IN_CODES below (work with no setup) and the database at codes/<CODE> (add new ones any time
// without an app update, e.g. { "coins": 250, "expires": 1767225600000 }). A signed-in account can use each code once.
export const BUILT_IN_CODES = {
  THANKYOU: { coins: 100 },
};
export const MAX_CODE_COINS = 100000;
export const CODE_MAX_LENGTH = 20;

// "thank you" / "Thank-You " -> "THANKYOU": capitals and digits only.
export const normalizeCode = (raw) => String(raw == null ? "" : raw).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_MAX_LENGTH);

// A code definition is usable when it gives a sensible whole number of coins and has not expired.
export function codeReward(def, now = Date.now()) {
  if (!def || typeof def !== "object" || def.active === false) return null;
  const coins = Number(def.coins);
  if (!Number.isInteger(coins) || coins < 1 || coins > MAX_CODE_COINS) return null;
  if (def.expires != null && Number(def.expires) <= now) return null;
  return { coins };
}

// The built-in table wins, then the database entry (looked up by the caller). Returns the reward or null.
export function resolveCode(code, dbDef, now = Date.now()) {
  const builtIn = Object.prototype.hasOwnProperty.call(BUILT_IN_CODES, code) ? BUILT_IN_CODES[code] : null;
  return codeReward(builtIn, now) || codeReward(dbDef, now);
}

// Adds the reward and records the code on the profile in one step. Returns { profile, status }: "ok", or "used" when this
// account already redeemed it (the profile comes back unchanged).
export function applyRedeem(profile, code, reward, now = Date.now()) {
  const used = (profile && profile.redeemedCodes) || {};
  if (used[code]) return { profile, status: "used" };
  return { status: "ok", profile: { ...profile, coins: (profile.coins || 0) + reward.coins, redeemedCodes: { ...used, [code]: now } } };
}
