// Plays High Stakes through its rules module: option generation, betting, pots, rollover, elimination.
import assert from "node:assert/strict";
import * as H from "../anim/high-stakes.mjs";

function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---- options ----
{
  const rng = seeded(1); const posCount = Array(H.HS_OPTION_COUNT).fill(0);
  for (let i = 0; i < 4000; i++) {
    const answer = Math.exp(rng() * 14 - 3); // ~0.05 .. 60000
    const { options, realIdx } = H.hsMakeOptions(answer, rng);
    assert.equal(options.length, H.HS_OPTION_COUNT);
    assert.equal(new Set(options).size, H.HS_OPTION_COUNT, "options distinct");
    assert.deepEqual([...options].sort((a, b) => a - b), options, "sorted");
    assert.equal(options[realIdx], H.hsRound3(answer), "real present");
    options.forEach((o, k) => { if (k !== realIdx) assert.ok(Math.abs(Math.log(o / options[realIdx])) > 0.1, "fake not too near real " + o + " vs " + options[realIdx]); });
    posCount[realIdx]++;
  }
  posCount.forEach((c) => assert.ok(c > 4000 * 0.15, "real answer can sit in every position " + posCount));
  assert.ok(posCount[0] > 0 && posCount[H.HS_OPTION_COUNT - 1] > 0, "real answer appears at both extremes");
  // custom fakes from eliminated players replace generated ones
  const { options } = H.hsMakeOptions(100, seeded(5), [37, 250, 100, "abc", -4]);
  assert.ok(options.includes(37) && options.includes(250), "custom fakes used");
  assert.equal(options.filter((o) => o === 100).length, 1, "a custom fake equal to the real answer is dropped");
  assert.equal(options.length, H.HS_OPTION_COUNT);
}

// ---- scenario helpers ----
const NOW = 1_000_000;
function setup(chips, picks, realIdx = 2, round = 1) {
  const ids = Object.keys(chips);
  let hs = H.hsNewGame(ids, 0); hs.chips = { ...chips }; hs.round = round - 1;
  hs = H.hsStartRound(hs, { options: [1, 2, 3, 4], realIdx, now: NOW });
  hs = H.hsBeginBetting(hs, picks, NOW);
  return hs;
}
const total = (hs) => Object.values(hs.chips).reduce((a, b) => a + b, 0) + hs.pot + (hs.carry || 0);

// everyone checks, one right answer wins everything
{
  let hs = setup({ a: 100, b: 100, c: 100 }, { a: 2, b: 0, c: 4 });
  assert.equal(hs.pot, 15); assert.equal(hs.stage, "bet");
  while (hs.stage === "bet") hs = H.hsApplyAction(hs, hs.bet.turn, "check", NOW);
  assert.equal(hs.stage, "reveal");
  assert.deepEqual(hs.result.winners, ["a"]); assert.equal(hs.chips.a, 100 + 10); // paid 5 ante, gets 15
  assert.equal(total(hs), 300);
}
// raise, call, fold -> raise makes the others act again
{
  let hs = setup({ a: 100, b: 100, c: 100 }, { a: 2, b: 2, c: 1 });
  const first = hs.bet.turn; assert.equal(first, "a"); // round 1 -> seat after... order starts at seat 0
  assert.equal(hs.bet.n, 0);
  hs = H.hsApplyAction(hs, "a", "raise", NOW); assert.equal(hs.bet.n, 1); assert.equal(hs.bet.cur, 10); assert.equal(hs.pot, 15 + 10);
  assert.equal(hs.bet.turn, "b");
  hs = H.hsApplyAction(hs, "b", "raise", NOW); assert.equal(hs.bet.cur, 20); assert.equal(hs.bet.raises, 2);
  assert.equal(H.hsLegalActions(hs, "c").canRaise, false, "max 2 raises");
  hs = H.hsApplyAction(hs, "c", "fold", NOW);
  assert.equal(hs.bet.turn, "a", "a must answer b's raise");
  hs = H.hsApplyAction(hs, "a", "call", NOW);
  assert.equal(hs.stage, "reveal");
  assert.deepEqual(hs.result.winners.sort(), ["a", "b"]);
  assert.equal(hs.result.pot, 15 + 10 + 20 + 10, "pot = antes + a10 + b20 + a's call of 10");
  assert.equal(total(hs), 300);
}
// everyone else folds: last one wins uncontested even when wrong
{
  let hs = setup({ a: 100, b: 100, c: 100 }, { a: 0, b: 1, c: 2 }, 3);
  hs = H.hsApplyAction(hs, "a", "raise", NOW);
  hs = H.hsApplyAction(hs, "b", "fold", NOW);
  hs = H.hsApplyAction(hs, "c", "fold", NOW);
  assert.equal(hs.stage, "reveal"); assert.ok(hs.result.uncontested); assert.deepEqual(hs.result.winners, ["a"]);
  assert.equal(total(hs), 300);
}
// nobody right -> pot rolls over and joins the next round's pot
{
  let hs = setup({ a: 100, b: 100 }, { a: 0, b: 1 }, 3);
  while (hs.stage === "bet") hs = H.hsApplyAction(hs, hs.bet.turn, "check", NOW);
  assert.equal(hs.result.winners, null); assert.equal(hs.carry, 10);
  hs = H.hsFinishRound(hs); assert.equal(hs.stage, "ready");
  hs = H.hsStartRound(hs, { options: [1, 2, 3, 4], realIdx: 0, now: NOW });
  assert.equal(hs.pot, 10 + 10); assert.equal(total(hs), 200);
}
// split pot with remainder rolling over
{
  let hs = setup({ a: 100, b: 100, c: 100 }, { a: 2, b: 2, c: 2 }); // pot 15, split three ways = 5 each
  while (hs.stage === "bet") hs = H.hsApplyAction(hs, hs.bet.turn, "check", NOW);
  assert.equal(hs.result.share, 5); assert.equal(hs.carry, 0);
  let h2 = setup({ a: 100, b: 100 }, { a: 2, b: 2 }); h2.pot = 11; // odd pot
  h2 = H.hsResolve(h2);
  assert.equal(h2.result.share, 5); assert.equal(h2.carry, 1);
}
// missing pick = folded, timeout = auto check / fold
{
  let hs = setup({ a: 100, b: 100, c: 100 }, { a: 2, b: 2 });
  assert.ok(hs.bet.folded.c);
  assert.equal(H.hsTimeoutAction(hs, NOW + 1).bet.turn, hs.bet.turn, "no change before the deadline");
  const t = NOW + 13_000;
  let h = H.hsTimeoutAction(hs, t); assert.notEqual(h.bet.turn, hs.bet.turn, "free turn auto-checks");
  h = H.hsApplyAction(h, h.bet.turn, "raise", t);
  const facing = h.bet.turn; const h2 = H.hsTimeoutAction(h, t + 13_000);
  assert.ok(h2.stage === "reveal" && h2.bet.folded[facing], "facing a bet, timeout folds");
}
// table-stakes cap: a short stack limits the bet size for everyone
{
  let hs = setup({ a: 100, b: 12 }, { a: 2, b: 2 });
  assert.equal(hs.bet.cap, 7); // b has 12-5 after ante
  hs = H.hsApplyAction(hs, hs.bet.turn, "raise", NOW); assert.equal(hs.bet.cur, 7);
}
// short stack that can't cover the ante antes what it has, is eliminated when it loses
{
  let hs = H.hsNewGame(["a", "b", "c"], 100); hs.chips.c = 3;
  hs = H.hsStartRound(hs, { options: [1, 2, 3, 4], realIdx: 0, now: NOW });
  assert.equal(hs.chips.c, 0); assert.equal(hs.pot, 13);
  hs = H.hsBeginBetting(hs, { a: 1, b: 1, c: 1 }, NOW);
  while (hs.stage === "bet") hs = H.hsApplyAction(hs, hs.bet.turn, "check", NOW);
  hs = H.hsFinishRound(hs); assert.ok(hs.out.c === 1); assert.equal(hs.stage, "ready");
}

// ---- full games with bots, many seeds: conservation, termination, legality ----
const diffs = ["easy", "medium", "hard"];
let games = 0, rolls = 0, uncontested = 0, lengths = [];
for (let seed = 1; seed <= 600; seed++) {
  const rng = seeded(seed);
  const n = 2 + (seed % 5); const ids = Array.from({ length: n }, (_, i) => "p" + i);
  const dif = Object.fromEntries(ids.map((id) => [id, diffs[Math.floor(rng() * 3)]]));
  let hs = H.hsNewGame(ids, H.HS_START_COINS);
  const startTotal = ids.length * H.HS_START_COINS;
  let guard = 0;
  while (hs.stage !== "over") {
    assert.ok(guard++ < 40, "game must terminate");
    const answer = Math.exp(rng() * 8 - 1);
    const { options, realIdx } = H.hsMakeOptions(answer, rng);
    hs = H.hsStartRound(hs, { options, realIdx, now: NOW });
    const picks = {}, conf = {};
    hs.seats.forEach((id) => { const r = H.hsBotPick(options, answer, dif[id], rng); picks[id] = r.pick; conf[id] = r.confidence; });
    hs = H.hsBeginBetting(hs, picks, NOW);
    let steps = 0;
    while (hs.stage === "bet") {
      assert.ok(steps++ < 60, "betting must terminate");
      const id = hs.bet.turn; const act = H.hsBotDecide(hs, id, conf[id], rng);
      const next = H.hsApplyAction(hs, id, act, NOW);
      assert.notEqual(next, hs, "bot chose a legal action " + act);
      hs = next;
      Object.values(hs.chips).forEach((c) => assert.ok(c >= 0, "no negative chips"));
    }
    assert.equal(hs.stage, "reveal");
    assert.equal(Object.values(hs.chips).reduce((a, b) => a + b, 0) + (hs.carry || 0), startTotal, "coins conserved");
    if (hs.result.winners === null) rolls++;
    if (hs.result.uncontested) uncontested++;
    hs = H.hsFinishRound(hs);
  }
  games++; lengths.push(hs.round);
  assert.ok(hs.winners.length >= 1);
}
// ghost fakes: many writers -> still exactly 4 options, at most 3 credited; bounty = 2 coins per player fooled
{
  for (let seed = 1; seed <= 300; seed++) {
    const custom = ["g1", "g2", "g3", "g4", "g5", "g6"].map((id, i) => ({ id, v: 10 + i * 37 }));
    const { options, fakeBy } = H.hsMakeOptions(100, seeded(seed), custom);
    assert.equal(options.length, 4, "always 4 options");
    assert.ok(!fakeBy || Object.keys(fakeBy).length <= 3);
  }
  let hs = H.hsNewGame(["a", "b", "c"], 0); hs.chips = { a: 100, b: 100, c: 100 };
  hs = H.hsStartRound(hs, { options: [1, 2, 3, 4], realIdx: 2, fakeBy: { 0: "g1", 1: "g2" }, now: NOW });
  hs = H.hsBeginBetting(hs, { a: 0, b: 0, c: 2 }, NOW);
  while (hs.stage === "bet") hs = H.hsApplyAction(hs, hs.bet.turn, "check", NOW);
  assert.deepEqual(hs.result.ghost, { g1: 4 }, "two players fooled by g1 -> 4 coins, g2 fooled nobody");
  assert.deepEqual(hs.ghost, { g1: 4 });
}
const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
console.log(`PASS: options (4000 answers), 9 betting scenarios, ${games} bot games (avg ${avg.toFixed(1)} rounds, max ${Math.max(...lengths)}), ${rolls} rollovers, ${uncontested} uncontested pots.`);
