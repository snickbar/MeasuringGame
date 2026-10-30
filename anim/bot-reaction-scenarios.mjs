// Which reaction a bot picks depends on what is happening in the game. Each scenario is a pool of reaction ids; bots draw from
// the whole reaction library (they are not limited to the 5-7 slots a player carries). Cosmetic only: nothing here changes a game.
export const POOLS = {
  hello: ['wave', 'peek', 'think'],
  dragging: ['hourglass', 'tired', 'alarm', 'nervous'],
  nailBiter: ['alarm', 'nervous', 'crossed'],
  nailedIt: ['cool', 'flex', 'triumph', 'nerd'],
  decent: ['thumbsup', 'grin'],
  flopped: ['facepalm', 'crying', 'skull', 'shrug'],
  spotOnOther: ['clap', 'mindblown', 'point'],
  nobodyClose: ['thumbsdown', 'sideeye', 'shrug'],
  otherFlopped: ['laughing', 'giggle', 'zany'],
  onARoll: ['fire', 'flex'],
  winning: ['crown', 'trophy', 'popper', 'cake'],
  goodGame: ['heart', 'kiss', 'wave', 'grin'],
  chatter: ['thumbsup', 'grin', 'heart', 'wave', 'laughing'],
  // Bluff the Room
  bluffThinking: ['think', 'sideeye', 'peek'],
  bluffFooled: ['zany', 'giggle', 'cool'],
  bluffGotFooled: ['facepalm', 'mindblown'],
  bluffCaught: ['cool', 'grin', 'thumbsup'],
  // High Stakes
  hsThinking: ['think', 'peek'],
  hsBigBet: ['flex', 'fire'],
  hsFold: ['shrug', 'nervous'],
  hsWonPot: ['popper', 'crown'],
  hsLostPot: ['crying', 'skull'],
};

// Roughly this share of reactions ignore the situation and pull from the friendly pool, so it never feels scripted.
export const CHATTER_CHANCE = 0.15;

const pick = (list, random, avoid) => {
  const fresh = list.filter(x => x !== avoid);
  const from = fresh.length ? fresh : list;
  return from[Math.floor(random() * from.length)];
};
// Weighted choice between the scenarios that currently apply.
function weighted(options, random) {
  const total = options.reduce((s, o) => s + o.w, 0);
  let r = random() * total;
  for (const o of options) { r -= o.w; if (r <= 0) return o.pool; }
  return options[options.length - 1].pool;
}
const accuracyOf = (entry) => Number.isFinite(entry?.accuracyPercent) ? entry.accuracyPercent : null;

export function leadersOf(players) {
  let best = -Infinity, ids = [];
  for (const [id, p] of Object.entries(players || {})) {
    if (!p || p.isSpectator || p.left) continue;
    const s = Number(p.score) || 0;
    if (s > best) { best = s; ids = [id]; } else if (s === best) ids.push(id);
  }
  return best > 0 ? ids : [];
}

// ctx: { room, botId, seenAt (when this phase was first seen, ms), now, roundStartLeaders }
export function chooseScenario(ctx, random) {
  const { room } = ctx;
  if (room.phase === 'bluff') return bluffPool(room.bluff, ctx.botId);
  if (room.phase === 'hs') return hsPool(room.hs, ctx.botId, random);
  if (room.phase === 'question') return questionPool(ctx);
  if (room.phase === 'answers') return POOLS.nailBiter;
  if (room.phase === 'reveal' || room.phase === 'summary') return resultPool(ctx, random);
  return null;
}

function questionPool({ room, now, seenAt }) {
  const waited = Math.max(0, now - seenAt);
  const ends = room.graceEndsAt || room.questionEndsAt;
  let frac = null, left = null;
  if (ends && ends > seenAt) { frac = waited / (ends - seenAt); left = ends - now; }
  if (left !== null && left <= 6000) return POOLS.nailBiter;
  if (frac !== null ? frac >= 0.55 : waited >= 20000) return POOLS.dragging;
  if (frac !== null ? frac <= 0.25 : waited <= 8000) return POOLS.hello;
  return POOLS.chatter;
}

function resultPool({ room, botId, roundStartLeaders }, random) {
  const entries = Array.isArray(room.revealOrder) ? room.revealOrder : [];
  const mine = entries.find(e => e?.playerId === botId);
  const others = entries.filter(e => e && e.playerId !== botId && accuracyOf(e) !== null);
  const myAcc = accuracyOf(mine);
  const options = [];
  const totalRounds = room.settings?.totalRounds;
  const lastRound = Number.isFinite(totalRounds) && room.round >= totalRounds;
  const leaders = leadersOf(room.players);
  const iLead = leaders.includes(botId);
  if (lastRound) options.push({ pool: iLead ? POOLS.winning : POOLS.goodGame, w: 6 });
  else if (iLead && roundStartLeaders && !roundStartLeaders.includes(botId)) options.push({ pool: POOLS.winning, w: 5 });
  if ((mine?.consecutiveWins || 0) >= 3) options.push({ pool: POOLS.onARoll, w: 4 });
  if (myAcc !== null) {
    if (myAcc >= 90) options.push({ pool: POOLS.nailedIt, w: 5 });
    else if (myAcc >= 60) options.push({ pool: POOLS.decent, w: 3 });
    else if (myAcc < 35) options.push({ pool: POOLS.flopped, w: 5 });
  }
  if (others.some(e => accuracyOf(e) >= 95) && !(myAcc >= 95)) options.push({ pool: POOLS.spotOnOther, w: 4 });
  const all = entries.map(accuracyOf).filter(a => a !== null);
  if (all.length >= 2 && Math.max(...all) < 50) options.push({ pool: POOLS.nobodyClose, w: 4 });
  if (others.some(e => accuracyOf(e) < 25)) options.push({ pool: POOLS.otherFlopped, w: 3 });
  options.push({ pool: POOLS.chatter, w: 1 });
  return weighted(options, random);
}

function bluffPool(b, botId) {
  if (!b) return null;
  if (b.stage === 'make') return b.maker === botId ? POOLS.bluffThinking : POOLS.hello;
  if (b.stage === 'vote') return POOLS.bluffThinking;
  if (b.stage === 'reveal') {
    const points = b.result?.points?.[botId] || 0;
    if (b.maker === botId) return (b.result?.wrong || 0) > 0 ? POOLS.bluffFooled : POOLS.flopped;
    if (b.result && b.votes?.[botId] !== undefined) return points > 0 ? POOLS.bluffCaught : POOLS.bluffGotFooled;
    return POOLS.chatter;
  }
  return null;
}

function hsPool(hs, botId, random) {
  if (!hs) return null;
  if (hs.stage === 'pick') return POOLS.hsThinking;
  if (hs.stage === 'ready') return POOLS.hello;
  if (hs.stage === 'bet') {
    if (hs.bet?.folded?.[botId]) return POOLS.hsFold;
    if ((hs.bet?.raises || 0) > 0 && hs.bet?.acted?.[botId]) return POOLS.hsBigBet;
    return weighted([{ pool: POOLS.hsThinking, w: 2 }, { pool: POOLS.chatter, w: 1 }], random);
  }
  if (hs.stage === 'reveal') {
    const winners = hs.result?.winners || [];
    if (winners.includes(botId)) return POOLS.hsWonPot;
    if (hs.bet?.folded?.[botId]) return POOLS.hsFold;
    return winners.length ? POOLS.hsLostPot : POOLS.chatter;
  }
  return null;
}

// Turns a pool of reaction ids into one reaction the game can send (resolve maps an id to its stored emoji key, or null if unknown).
export function pickFromScenario(pool, random, lastEmoji, resolve) {
  const emojis = (pool || []).map(resolve).filter(Boolean);
  if (!emojis.length) return null;
  return pick(emojis, random, lastEmoji);
}
