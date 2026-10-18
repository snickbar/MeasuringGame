import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { gameReward, rewardProfile, gameRewardKey } from '../anim/game-rewards.mjs';

for (const score of [0,2,4,5,8,20]) {
  const base = Math.max(score,5), key = 'ROOM_game';
  assert.deepEqual(gameReward(score), {score, minimum:Math.max(0,5-score), base});
  const initial = {coins:100, worlds:{unrelated:true}, gameRewards:{older:{base:20,completed:true}}};
  const awarded = rewardProfile(initial,key,score);
  assert.equal(initial.coins,100);
  assert.equal(awarded.coins,100+base);
  assert.deepEqual(awarded.worlds,initial.worlds);
  assert.deepEqual(awarded.gameRewards.older,initial.gameRewards.older);
  assert.equal(rewardProfile(awarded,key,score),undefined,'reopened final does not credit twice');
  const doubled = rewardProfile(awarded,key,score,{double:true});
  assert.equal(doubled.coins,100+2*base);
  assert.equal(rewardProfile(doubled,key,score,{double:true}),undefined,'retried ad does not credit twice');
  const done = rewardProfile(doubled,key,score,{complete:true});
  assert.equal(done.coins,100+2*base);
  assert.equal(rewardProfile(done,key,score,{complete:true}),undefined);
  assert.equal(rewardProfile(done,key,score,{double:true}),undefined);
  const skipped = rewardProfile(awarded,key,score,{complete:true});
  assert.equal(skipped.coins,100+base,'skip ad retains normal reward');
  assert.equal(rewardProfile(skipped,key,score,{double:true}),undefined);
  // A first request can have its response lost: retry the original operation
  // against the committed receipt, including after the profile is reloaded.
  const reloaded = JSON.parse(JSON.stringify(doubled));
  assert.equal(rewardProfile(reloaded,key,score,{double:true}),undefined);
  let concurrent = {...initial};
  for(let i=0;i<8;i++) concurrent = rewardProfile(concurrent,key,score) || concurrent;
  for(let i=0;i<8;i++) concurrent = rewardProfile(concurrent,key,score,{double:true}) || concurrent;
  assert.equal(concurrent.coins,100+2*base);
  assert.equal(rewardProfile(concurrent,'ROOM_new-game',score).coins,100+3*base);
}
assert.equal(rewardProfile(null,'game',2),undefined);
assert.deepEqual(gameReward(NaN),{score:0,minimum:5,base:5});
assert.deepEqual(gameReward(-10),{score:0,minimum:5,base:5});
assert.equal(gameRewardKey('ABCD',{gameId:'same',countdownEndsAt:1}),gameRewardKey('ABCD',{gameId:'same',countdownEndsAt:2}));
assert.notEqual(gameRewardKey('ABCD',{gameId:'first'}),gameRewardKey('ABCD',{gameId:'replay'}));
assert.equal(gameRewardKey('ABCD',{currentQuestion:{powerupKey:'old'}}),'ABCD_old');
assert.throws(()=>gameRewardKey('ABCD',{}));
// Exercise the game's actual room-cleanup handler, including a recovered
// receipt after the room disappeared or its code was reused for a newer game.
const source=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=source.indexOf('  async function finishCompletedGame(');
const finishSource=source.slice(start,source.indexOf('\n  }',start)+4);
for(const [host,room,expectedEnds,expectedRemoves] of [
  [true,{phase:'final',gameId:'game',settings:{solo:true}},1,1],
  [false,{phase:'final',gameId:'game',settings:{solo:true}},0,1],
  [true,null,0,0],
  [true,{phase:'question',gameId:'new-game'},0,0],
  [false,{phase:'waiting'},0,0],
]) {
  let savedRoom=room,ends=0,removes=0,reloads=0;
  const context=vm.createContext({currentRoomCode:'ABCD',currentPlayers:{me:{}},updateFinalButtons:()=>{},update:async()=>{},gameRewardKey,leavingGame:false,db:{},ref:(_,p)=>p,
    runTransaction:async(_,fn)=>{const next=fn(savedRoom);if(next){ends++;savedRoom=next}},
    get:async()=>({val:()=>savedRoom}),onDisconnect:()=>({cancel:async()=>{}}),
    remove:async()=>{removes++},maybeDeleteEmptyRoom:async()=>{},
    setTimeout:fn=>fn(),location:{reload:()=>{reloads++}},
  });
  vm.runInContext(finishSource,context);
  await context.finishCompletedGame({roomCode:'ABCD',key:'ABCD_game',playerId:'me',host});
  assert.equal(ends,expectedEnds);assert.equal(removes,expectedRemoves);assert.equal(reloads,room&&!room.settings?.solo&&room.phase!=='ended'?0:1);
}
console.log('Game reward receipts: minimum, breakdown, atomic base/ad credit, retries, completion, independent game IDs passed.');
