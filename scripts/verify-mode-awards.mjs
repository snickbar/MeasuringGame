import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createModeAwards, MODE_AWARD_CATEGORIES, threeStarTeamFinishes} from '../anim/mode-awards.mjs';
import {applyCareerRecord} from '../anim/career-ledger.mjs';

let profile = {coins: 0};
const awards = createModeAwards(() => profile);
const award = id => awards.find(a => a.id === `mode-${id}`);
assert.equal(awards.length, 30);
assert.equal(new Set(awards.map(a => a.id)).size, 30);
assert.deepEqual([...new Set(awards.map(a => a.cat))], MODE_AWARD_CATEGORIES);
for (const a of awards) {
  assert.equal(a.progress(), 0);
  assert(fs.existsSync(a.icon), `Missing artwork: ${a.icon}`);
}
profile = {
  stats: {teamWorldsAttempts: 10, dailies: 25},
  modeStats: {teamvteam: {games: 25, wins: 5}, highstakes: {games: 10, wins: 1}},
  hlSurvival: {best: 10, bestStreak: 5}, hsStats: {games: 10, bluffs: 5},
  teamWorldsHistory: {tiny: {a: {s: 90}, b: {s: 90.01}, c: {s: 100}}},
};
assert.equal(award('team-spirit-25').progress(), 25);
assert.equal(award('winning-combination-5').progress(), 5);
assert.equal(award('travel-buddies-10').progress(), 10);
assert.equal(award('perfect-partnership-1').progress(), 2, 'historical stars use the actual above-90 threshold');
assert.equal(award('holding-the-line-10').progress(), 10);
assert.equal(award('in-sync-5').progress(), 5);
assert.equal(award('at-the-table-10').progress(), 10, 'overlapping saved totals must not be added together');
assert.equal(award('high-roller-1').progress(), 1);
assert.equal(award('called-your-bluff-5').progress(), 5);
assert.equal(award('daily-regular-25').progress(), 25);
assert.equal(award('team-spirit-1').reward, 15);
assert.equal(award('team-spirit-10').reward, 40);
assert.equal(award('team-spirit-25').reward, 100);
assert.equal(award('high-roller-1').reward, 25);
assert.equal(award('high-roller-5').reward, 75);
assert.equal(award('high-roller-20').reward, 150);

// Count new three-star finishes once, seed from historical games, preserve progress on lower results.
const team = {kind: 'attempt', mode: 'teamworlds', world: 'tiny', key: 'new-team', stars: 3, accuracy: 95, t: 1};
profile = applyCareerRecord(profile, team);
assert.equal(profile.stats.threeStarTeamWorlds, 3);
assert.equal(threeStarTeamFinishes(profile), 3);
const committed = structuredClone(profile);
assert.deepEqual(applyCareerRecord(profile, team), committed);
profile = applyCareerRecord(profile, {...team, key: 'two-stars', stars: 2, accuracy: 80});
assert.equal(profile.stats.threeStarTeamWorlds, 3);
profile = applyCareerRecord(profile, {...team, key: 'another-three'});
assert.equal(profile.stats.threeStarTeamWorlds, 4);

// A completed round in an abandoned game must not unlock a finished-game award.
profile = applyCareerRecord({}, {kind: 'round', key: 'abandoned-team-round', mode: 'teamvteam', history: {r: 1, rawR: 1, t: 2}});
assert.equal(award('team-spirit-1').progress(), 0);
assert.equal(award('winning-combination-1').progress(), 0);

// Exercise the actual claim transaction with a stale UI and repeated requests.
const source = fs.readFileSync('index.html', 'utf8');
profile = {coins: 100, modeStats: {highstakes: {wins: 1}}};
let stored = structuredClone(profile);
const context = vm.createContext({
  ACHIEVEMENTS: awards, achClaimable: a => a.progress() >= a.target && !profile.achClaimed?.[a.id],
  achJustClaimed: null, achHold: {}, ACH_HOLD_MS: 1600,
  setTimeout() {}, playSound() {}, ref: (_, path) => path, db: {}, deviceId: 'test',
  runTransaction: async (_, change) => {stored = change(stored); return {committed: true};},
});
vm.runInContext(source.match(/  async function claimAchievement\(id\) \{[\s\S]*?\n  \}/)[0], context);
await context.claimAchievement('mode-high-roller-1');
await context.claimAchievement('mode-high-roller-1');
assert.equal(stored.coins, 125, 'one-time receipt prevents repeat credit even with stale progress');
assert.equal(stored.achClaimed['mode-high-roller-1'], true);
await context.claimAchievement('mode-high-roller-5');
assert.equal(stored.coins, 125, 'locked tier cannot pay');
assert.match(source, /ACHIEVEMENTS\.push\(\.\.\.createModeAwards\(\(\) => myProfile\)\)/);
assert.match(source, /\.\.\.MODE_AWARD_CATEGORIES/);
console.log('PASS: 30 mode awards, historical progress, exact star boundary, completion rules, artwork and one-time real claim transaction.');
