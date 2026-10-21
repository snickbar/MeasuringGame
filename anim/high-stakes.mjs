// High Stakes: the rules of the betting mode, as plain functions on a plain state object.
// No DOM and no Firebase in here, so scripts/verify-high-stakes.mjs can play whole games through it.
//
// A round: everybody antes, sees 4 answers (1 real + 3 fakes), secretly picks the one they think is real,
// then bets once around the table (fold / check / call / raise, table-stakes cap so there are no side pots).
// Pot goes to everyone still in who picked the real answer (split). If nobody did, the pot rolls over.
// If everyone else folds, the last player left takes the pot even if they were wrong (that is the bluff).
// Out of coins = out of the game.
//
// The state is stored whole at rooms/<code>/hs. Arrays are never empty (Realtime Database drops empty ones).

export const HS_START_COINS = 100;
export const HS_MAX_ROUNDS = 10;
export const HS_MAX_RAISES = 2;
export const HS_OPTION_COUNT = 4;
export const HS_PICK_SECONDS = 30;
export const HS_TURN_SECONDS = 30;
// Ghost bounty: an eliminated player whose fake gets picked earns this many profile coins per player fooled.
export const HS_GHOST_COINS_PER_FOOL = 2;

// 5 coins for rounds 1-2, then 10, 20, 40 ... (doubles every 2 rounds)
export const hsAnteFor = (round) => 5 * 2 ** Math.floor((Math.max(1, round) - 1) / 2);
export const hsRaiseStep = (ante) => ante * 2;

// ---------- answers ----------
// Every option, real one included, is shown to 3 significant figures so the real one can't be spotted by
// how many decimals it has.
export function hsRound3(n) {
  if (!isFinite(n) || n === 0) return 0;
  return Number(Number(n).toPrecision(3));
}
// 1 real + 3 fakes, sorted ascending. Fakes sit between x0.25 and x4 of the real answer on a log scale,
// no two within ~15% of each other, none within ~15% of the real one, so the real answer lands anywhere
// in the list (sometimes at an extreme). `custom` = optional fakes written by eliminated players; they
// replace generated ones (still dropped if they'd duplicate something already on the table).
// `custom` entries are numbers or {id, v}. They are shuffled, then the first ones that fit the spacing rule are
// kept (max 3), so with many ghosts writing the game chooses a spread that works. `fakeBy` maps each kept
// fake's value to the ghost who wrote it (used for the bounty).
export function hsMakeOptions(answer, rng = Math.random, custom = []) {
  const real = hsRound3(answer);
  const MIN_GAP = 0.15;
  const taken = [Math.log(real)];
  const fakes = [];
  const far = (lv) => taken.every((t) => Math.abs(t - lv) >= MIN_GAP);
  const fakeAuthor = {};
  const pool = (custom || []).map((c) => (c && typeof c === "object" ? c : { id: null, v: c }));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  for (const c of pool) {
    const v = hsRound3(Number(c.v));
    if (!(v > 0) || fakes.length >= HS_OPTION_COUNT - 1) continue;
    if (far(Math.log(v)) && hsRound3(v) !== real) { fakes.push(v); taken.push(Math.log(v)); if (c.id) fakeAuthor[v] = c.id; }
  }
  // The real answer's slot is picked first (uniformly), then that many fakes go below it and the rest above, so
  // "the real one is always in the middle" is not a pattern anyone can use.
  const slot = Math.min(HS_OPTION_COUNT - 1, Math.floor(rng() * HS_OPTION_COUNT));
  let below = slot, above = HS_OPTION_COUNT - 1 - slot;
  for (const f of fakes) { if (f < real) below--; else above--; }
  const want = { below: Math.max(0, below), above: Math.max(0, above) };
  // Custom fakes sitting on the "wrong" side of the chosen slot can push the sum over: trim so there are exactly 3 fakes in all.
  let extra = want.below + want.above - (HS_OPTION_COUNT - 1 - fakes.length);
  while (extra-- > 0) { if (want.below >= want.above) want.below--; else want.above--; }
  const SPAN = Math.log(5);
  // The real answer is never below 1 (it is always "how many of the small thing fit in the big one"), so a computer fake
  // below 1.00 would give itself away: fakes are only ever 1.00 or more. Below-fakes that don't fit are made above instead.
  let guard = 0, belowMade = 0;
  while (belowMade < want.below && guard++ < 600) {
    const lv = Math.log(real) - (MIN_GAP + rng() * (SPAN - MIN_GAP));
    const v = hsRound3(Math.exp(lv));
    if (!(v >= 1) || v === real || fakes.includes(v) || !far(Math.log(v))) continue;
    fakes.push(v); taken.push(Math.log(v)); belowMade++;
  }
  const aboveWant = HS_OPTION_COUNT - 1 - fakes.length;
  let aboveMade = 0; guard = 0;
  while (aboveMade < aboveWant && guard++ < 2000) {
    const lv = Math.log(real) + (MIN_GAP + rng() * (SPAN - MIN_GAP));
    const v = hsRound3(Math.exp(lv));
    if (!(v > 0) || v === real || fakes.includes(v) || !far(Math.log(v))) continue;
    fakes.push(v); taken.push(Math.log(v)); aboveMade++;
  }
  // Pathological answers (tiny or huge) could exhaust the guard: fill with plain multiples so there are always enough.
  for (let k = 2; fakes.length < HS_OPTION_COUNT - 1; k++) {
    const v = hsRound3(real * k * 1.37);
    if (!fakes.includes(v) && v !== real) fakes.push(v);
  }
  const options = [...fakes, real].sort((a, b) => a - b);
  const fakeBy = {};
  options.forEach((o, i) => { if (fakeAuthor[o]) fakeBy[i] = fakeAuthor[o]; });
  return { options, realIdx: options.indexOf(real), fakeBy: Object.keys(fakeBy).length ? fakeBy : null };
}

// ---------- state ----------
export function hsNewGame(pids, coins = HS_START_COINS) {
  const chips = {};
  pids.forEach((id) => { chips[id] = coins; });
  return { round: 0, stage: "ready", carry: 0, pot: 0, chips, out: null, seatsAll: [...pids], winners: null };
}

const clone = (o) => JSON.parse(JSON.stringify(o));
const aliveIds = (hs) => hs.seatsAll.filter((id) => (hs.chips[id] || 0) > 0);

// Everyone with coins antes (a short stack antes what it has). Moves to the pick stage.
export function hsStartRound(hsIn, { options, realIdx, fakeBy = null, now, pickSeconds = HS_PICK_SECONDS }) {
  const hs = clone(hsIn);
  const seats = aliveIds(hs);
  hs.round += 1;
  hs.stage = "pick";
  hs.ante = hsAnteFor(hs.round);
  hs.seats = seats;
  hs.options = options;
  hs.realIdx = realIdx;
  hs.fakeBy = fakeBy;
  hs.startChips = { ...hs.chips }; // for the standings: how far each player moved this round (ante included)
  hs.pot = hs.carry || 0;
  hs.carry = 0;
  seats.forEach((id) => {
    const a = Math.min(hs.ante, hs.chips[id]);
    hs.chips[id] -= a;
    hs.pot += a;
  });
  hs.picks = null;
  hs.bet = null;
  hs.result = null;
  hs.pickEndsAt = now + pickSeconds * 1000;
  hs.animAt = null;
  hs.animEndsAt = null;
  hs.nextAt = null;
  return hs;
}

// Picks come from outside (each player's own pick under rooms/<code>/hsPicks). Anyone with no pick is folded.
export function hsBeginBetting(hsIn, picks, now, turnSeconds = HS_TURN_SECONDS) {
  const hs = clone(hsIn);
  const seats = hs.seats;
  const clean = {};
  seats.forEach((id) => { const p = picks?.[id]; if (Number.isInteger(p) && p >= 0 && p < hs.options.length) clean[id] = p; });
  hs.picks = Object.keys(clean).length ? clean : null;
  const folded = {};
  seats.forEach((id) => { if (clean[id] === undefined) folded[id] = true; });
  const live = seats.filter((id) => !folded[id]);
  // Table stakes: nobody can bet more than the smallest stack still in, so every bet can always be matched.
  const cap = live.length ? Math.min(...live.map((id) => hs.chips[id])) : 0;
  // Dealer button moves one seat each round, first to act is the seat after it.
  const start = (hs.round - 1) % seats.length;
  const order = seats.map((_, k) => seats[(start + k) % seats.length]);
  hs.stage = "bet";
  hs.bet = { order, folded: Object.keys(folded).length ? folded : null, cur: 0, put: null, raises: 0, cap, acted: null, turn: null, turnEndsAt: null, turnAt: null, n: 0 };
  return hsAdvanceTurn(hs, -1, now, turnSeconds);
}

const nonFolded = (hs) => hs.seats.filter((id) => !hs.bet.folded?.[id]);

// Pick who acts next after position `from` in the order: the next live player who hasn't acted since the last raise.
function hsAdvanceTurn(hs, from, now, turnSeconds) {
  const b = hs.bet;
  const live = nonFolded(hs);
  if (live.length <= 1) return hsResolve(hs);
  const n = b.order.length;
  for (let k = 1; k <= n; k++) {
    const id = b.order[(from + k + n) % n];
    if (b.folded?.[id]) continue;
    if (b.acted?.[id]) continue;
    b.turn = id;
    b.turnAt = now;
    b.turnEndsAt = now + turnSeconds * 1000;
    return hs;
  }
  return hsResolve(hs);
}

export function hsLegalActions(hs, pid) {
  if (hs.stage !== "bet" || hs.bet.turn !== pid) return null;
  const b = hs.bet;
  const put = b.put?.[pid] || 0;
  const toCall = b.cur - put;
  const step = hsRaiseStep(hs.ante);
  const raiseTo = Math.min(b.cur + step, b.cap);
  return {
    toCall,
    canCheck: toCall === 0,
    canCall: toCall > 0,
    canRaise: b.raises < HS_MAX_RAISES && raiseTo > b.cur,
    raiseTo,
    raiseCost: raiseTo - put,
  };
}

// action: "fold" | "check" | "call" | "raise". Illegal actions are ignored (state returned unchanged).
export function hsApplyAction(hsIn, pid, action, now, turnSeconds = HS_TURN_SECONDS) {
  const legal = hsLegalActions(hsIn, pid);
  if (!legal) return hsIn;
  const hs = clone(hsIn);
  const b = hs.bet;
  b.put = b.put || {};
  b.acted = b.acted || {};
  const put = b.put[pid] || 0;
  const pay = (amt) => { hs.chips[pid] -= amt; hs.pot += amt; b.put[pid] = put + amt; };
  if (action === "fold") {
    b.folded = b.folded || {};
    b.folded[pid] = true;
  } else if (action === "check") {
    if (!legal.canCheck) return hsIn;
    b.acted[pid] = true;
  } else if (action === "call") {
    if (!legal.canCall) return hsIn;
    pay(legal.toCall);
    b.acted[pid] = true;
  } else if (action === "raise") {
    if (!legal.canRaise) return hsIn;
    pay(legal.raiseCost);
    b.cur = legal.raiseTo;
    b.raises += 1;
    b.acted = { [pid]: true };
  } else {
    return hsIn;
  }
  b.n = (b.n || 0) + 1; // every action bumps this, so a player's tap can be tied to the exact turn it was made for
  const from = b.order.indexOf(pid);
  return hsAdvanceTurn(hs, from, now, turnSeconds);
}

// A turn that ran out of time: check if it's free, otherwise fold.
export function hsTimeoutAction(hs, now, turnSeconds = HS_TURN_SECONDS) {
  if (hs.stage !== "bet" || !hs.bet.turn || now < hs.bet.turnEndsAt) return hs;
  const legal = hsLegalActions(hs, hs.bet.turn);
  return hsApplyAction(hs, hs.bet.turn, legal.canCheck ? "check" : "fold", now, turnSeconds);
}

export function hsResolve(hsIn) {
  const hs = hsIn;
  const live = nonFolded(hs);
  let winners, uncontested = false;
  if (live.length === 1) { winners = [live[0]]; uncontested = true; }
  else winners = live.filter((id) => hs.picks?.[id] === hs.realIdx);
  const pot = hs.pot;
  let share = 0, carryOut = 0;
  if (winners.length) {
    share = Math.floor(pot / winners.length);
    carryOut = pot - share * winners.length;
    winners.forEach((id) => { hs.chips[id] += share; });
  } else {
    carryOut = pot;
  }
  hs.carry = carryOut;
  hs.pot = 0;
  // Ghost bounty: every player (folded or not) who picked a ghost's fake pays that ghost.
  let ghostNow = null;
  if (hs.fakeBy && hs.picks) {
    Object.entries(hs.fakeBy).forEach(([idx, author]) => {
      const n = Object.values(hs.picks).filter((p) => p === Number(idx)).length;
      if (n > 0) { ghostNow = ghostNow || {}; ghostNow[author] = (ghostNow[author] || 0) + n * HS_GHOST_COINS_PER_FOOL; }
    });
    if (ghostNow) {
      hs.ghost = { ...(hs.ghost || {}) };
      Object.entries(ghostNow).forEach(([id, c]) => { hs.ghost[id] = (hs.ghost[id] || 0) + c; });
    }
  }
  // Per-player tallies for the career stats: rounds won, biggest single payout, bluffs that worked (won by
  // everyone else folding while holding the wrong answer) and the highest stack reached.
  hs.stats = { ...(hs.stats || {}) };
  winners.forEach((id) => {
    const o = hs.stats[id] || {};
    hs.stats[id] = { ...o, won: (o.won || 0) + 1, best: Math.max(o.best || 0, share), bluffs: (o.bluffs || 0) + (uncontested && hs.picks?.[id] !== hs.realIdx ? 1 : 0) };
  });
  hs.seatsAll.forEach((id) => {
    const o = hs.stats[id] || {};
    if ((hs.chips[id] || 0) > (o.peak || 0)) hs.stats[id] = { ...o, peak: hs.chips[id] };
  });
  hs.result = { winners: winners.length ? winners : null, share, pot, uncontested, carryOut, ghost: ghostNow };
  hs.stage = "reveal";
  hs.bet.turn = null;
  hs.bet.turnEndsAt = null;
  return hs;
}

// After the reveal: eliminate anyone with no coins, then either end the game or return to "ready" for the next round.
export function hsFinishRound(hsIn) {
  const hs = clone(hsIn);
  const out = { ...(hs.out || {}) };
  hs.seatsAll.forEach((id) => { if ((hs.chips[id] || 0) <= 0 && !out[id]) out[id] = hs.round; });
  hs.out = Object.keys(out).length ? out : null;
  const alive = aliveIds(hs);
  if (alive.length <= 1 || hs.round >= HS_MAX_ROUNDS) {
    const best = Math.max(...hs.seatsAll.map((id) => hs.chips[id] || 0));
    hs.winners = hs.seatsAll.filter((id) => (hs.chips[id] || 0) === best);
    hs.stage = "over";
  } else {
    hs.stage = "ready";
  }
  return hs;
}

// ---------- bots ----------
// A bot forms its own estimate of the answer (noisier on easy), picks the option closest to that estimate
// (in log terms) and reports how sure it is: 1 = estimate sits right on the pick and far from the next option.
const BOT_NOISE = { easy: 0.9, medium: 0.5, hard: 0.22 }; // sigma of ln(estimate / answer)
export function hsBotPick(options, answer, difficulty = "medium", rng = Math.random) {
  const sigma = BOT_NOISE[difficulty] ?? BOT_NOISE.medium;
  const u1 = Math.max(1e-9, rng()), u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const est = Math.log(answer) + z * sigma;
  const d = options.map((o) => Math.abs(Math.log(o) - est));
  let pick = 0;
  d.forEach((v, i) => { if (v < d[pick]) pick = i; });
  const sorted = [...d].sort((a, b) => a - b);
  const margin = (sorted[1] - sorted[0]) / (sorted[1] + sorted[0] + 1e-9); // 0 = coin flip between two options, ->1 = clear
  return { pick, confidence: Math.max(0, Math.min(1, margin * (1 - Math.min(1, sigma / 1.2)))) };
}
// What a bot does on its turn, given its confidence from hsBotPick. Confidence is first scaled to what that difficulty can reach
// (easy bots are never very sure, hard bots often are), so every level bets, bluffs, calls and folds - hard ones are just right more often.
const BOT_CONF_MAX = { easy: 0.3, medium: 0.6, hard: 0.85 };
const BOT_RAISE_AT = { easy: 0.8, medium: 0.74, hard: 0.67 };  // scaled confidence needed to open a bet / raise
const BOT_FOLD_BELOW = { easy: 0.18, medium: 0.2, hard: 0.1 };   // below this (plus pot-odds pressure) a bot folds to a bet
const BOT_BLUFF = { easy: 0.07, medium: 0.08, hard: 0.06 };     // chance to bet or raise regardless
export function hsBotDecide(hs, pid, confidence, rng = Math.random, difficulty = "medium") {
  const legal = hsLegalActions(hs, pid);
  if (!legal) return null;
  const d = BOT_CONF_MAX[difficulty] ? difficulty : "medium";
  const cn = Math.max(0, Math.min(1, confidence / BOT_CONF_MAX[d])) + (rng() - 0.5) * 0.45; // scaled confidence with some mood swings
  const potOdds = legal.toCall / Math.max(1, hs.pot + legal.toCall);
  if (legal.canRaise && (cn > BOT_RAISE_AT[d] || rng() < BOT_BLUFF[d])) return "raise";
  if (legal.canCheck) return "check";
  // Facing a bet: a bigger bet relative to the pot makes a doubtful bot more likely to give up.
  return cn < BOT_FOLD_BELOW[d] + potOdds * 0.35 ? "fold" : "call";
}

// ---------- profile rewards ----------
// Coins paid to the player's profile when a game ends: by finishing place (ties share the better place), plus any ghost bounty.
export const HS_PLACE_COINS = [15, 8, 4];
export const HS_PARTICIPATION_COINS = 2;
export function hsPlaceOf(hs, id) {
  const mine = hs.chips[id] || 0;
  return 1 + hs.seatsAll.filter((o) => (hs.chips[o] || 0) > mine).length;
}
export function hsRewardFor(hs, id) {
  // Places only go to players who still have coins when the game ends. Anyone knocked out gets the small participation reward,
  // so being busted never ranks as "2nd".
  const out = (hs.chips[id] || 0) <= 0;
  const place = hsPlaceOf(hs, id);
  const placeCoins = out ? HS_PARTICIPATION_COINS : (HS_PLACE_COINS[place - 1] ?? HS_PARTICIPATION_COINS);
  const ghost = hs.ghost?.[id] || 0;
  return { place, out, coinsLeft: hs.chips[id] || 0, placeCoins, ghost, total: placeCoins + ghost };
}

// ---------- standings ----------
// Everyone in the game ranked by coins (ties share a rank), with how far each moved this round and how many ranks they climbed or fell.
export function hsStandings(hs) {
  const ids = hs.seatsAll || [];
  const start = hs.startChips || null;
  const rankIn = (get) => {
    const sorted = [...ids].sort((a, b) => get(b) - get(a));
    const rank = {};
    sorted.forEach((id, i) => { rank[id] = i > 0 && get(id) === get(sorted[i - 1]) ? rank[sorted[i - 1]] : i + 1; });
    return { sorted, rank };
  };
  const now = rankIn((id) => hs.chips[id] || 0);
  // Movement uses strict positions (ties broken by seat order) so a start-of-game tie doesn't read as everyone falling.
  const posBefore = {};
  if (start) [...ids].sort((a, b) => (start[b] ?? 0) - (start[a] ?? 0)).forEach((id, i) => { posBefore[id] = i; });
  const posNow = {};
  now.sorted.forEach((id, i) => { posNow[id] = i; });
  return now.sorted.map((id) => ({
    id,
    coins: hs.chips[id] || 0,
    delta: start ? (hs.chips[id] || 0) - (start[id] ?? hs.chips[id] ?? 0) : 0,
    rank: now.rank[id],
    rankMove: start ? posBefore[id] - posNow[id] : 0,
    out: (hs.chips[id] || 0) <= 0,
  }));
}
