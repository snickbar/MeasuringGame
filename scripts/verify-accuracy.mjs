import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { roundAccuracy, formatAccuracy } from '../anim/accuracy.mjs';

for(const [ratio,expected] of [[.75,75],[1.5,50],[1,100],[0,0],[.5,50],[2,0],[3,0],[-1,0],[NaN,0],[Infinity,0]]) assert.equal(roundAccuracy(ratio),expected);
for(const ratio of [.01,.123456,.7,.999999,1,1.4,2,1e10]) assert(roundAccuracy(ratio)>=0&&roundAccuracy(ratio)<=100);
assert.equal((roundAccuracy(.75)+roundAccuracy(1.5))/2,62.5);
assert.equal((roundAccuracy(.5)+roundAccuracy(1.5))/2,50,'opposite misses do not cancel');
assert.equal(formatAccuracy(62.5),'62.5');assert.equal(formatAccuracy(100),'100');

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const extract=name=>{let start=html.indexOf('  function '+name+'(');if(start<0)start=html.indexOf('  async function '+name+'(');assert(start>=0);return html.slice(start,html.indexOf('\n  }',start)+4)};
let writes;
const room={round:2,settings:{totalRounds:2},players:{me:{score:0},steady:{score:0}},currentQuestion:{answer:100,prompt:'Test'}};
const sandbox=vm.createContext({roundAccuracy,roomState:room,currentSettings:room.settings,effectiveGuess:(_,g)=>g,
  db:{},ref:(_,p)=>p,update:async(_,v)=>{writes=v},questionObjects:()=>null,nowMs:()=>1000,scheduleHostDeadline:()=>{},
  isHlSettings:()=>false,hlGameOver:()=>false,
  TRUTH_ID:'__truth__',console:{log:()=>{},error:console.error},
});
vm.runInContext([extract('finishRoundScoring'),extract('advanceAfterSummary'),extract('computeRanks')].join('\n'),sandbox);
for(const guess of [75,150]) {
  await sandbox.finishRoundScoring('TEST',['me','steady'],{me:guess,steady:90},{});
  assert.equal(writes.revealOrder.find(e=>e.playerId==='me').accuracyPercent,guess===75?75:50);
  for(const [key,value] of Object.entries(writes)) {
    const match=key.match(/^players\/([^/]+)\/(.+)$/);if(match)room.players[match[1]][match[2]]=value;
  }
}
assert.equal(room.players.me.accuracySum/room.players.me.roundsCounted,62.5);
assert.equal(room.players.steady.accuracySum/room.players.steady.roundsCounted,90);
assert.equal(room.players.me.bestGuess.guess,75,'best guess uses accuracy, not signed ratio');
await sandbox.advanceAfterSummary('TEST');
assert.equal(writes['players/steady/accuracyBonus'],10);
assert.equal(writes['players/me/accuracyBonus'],6);
const ranked=sandbox.computeRanks(['me','steady'],()=>10,id=>room.players[id].accuracySum/room.players[id].roundsCounted,true);
assert.equal(ranked[0].id,'steady');assert.equal(ranked[0].tiebreakUsed,true);
const tied=sandbox.computeRanks(['a','b'],()=>10,()=>62.5,true);
assert.equal(tied[0].rank,tied[1].rank);
console.log('PASS: per-round accuracy, 75% + 50% = 62.5%, caps, best guesses, actual game averages, bonuses and final tiebreakers.');
