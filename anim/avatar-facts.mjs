// One short fun fact per avatar, revealed at Avatar Level 1 (see AVATAR_PERKS in index.html).
// Keyed by avatar id ("av29"). An avatar with no entry yet shows FACT_PLACEHOLDER, so adding facts is just adding lines here.
export const FACT_PLACEHOLDER = "A fun fact is on its way.";
export const AVATAR_FACTS = {};
export const factFor = (id) => AVATAR_FACTS[id] || FACT_PLACEHOLDER;
