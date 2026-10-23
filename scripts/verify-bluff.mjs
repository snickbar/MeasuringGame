import assert from 'node:assert/strict';
import {bluffOptions,newBluff,dealBluff,chooseBluff,voteBluff,revealBluff,bluffStandings,bluffAction,commitBluff,bluffRoundRecord} from '../anim/bluff.mjs';
import {applyCareerRecord,objectFrequency} from '../anim/career-ledger.mjs';
import {admitPlayer} from '../anim/room-safety.mjs';
const q={unitId:'pencil',targetId:'door',answer:11.6,prompt:'How many pencils long is the height of a door?'};
let seed=123456;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(const answer of [.01,.02,1,1.004,11.6,100,1e6])for(let i=0;i<100;i++){
 const options=bluffOptions(answer,rng),by=Object.fromEntries(options.map(o=>[o.kind,o.value]));
 assert(by.low<by.correct&&by.high>by.correct);assert.equal(new Set(options.map(o=>o.value)).size,3);
}
for(let count=3;count<=10;count++)for(const turns of ['auto',1,2])for(let game=0;game<10;game++){
 const ids=Array.from({length:count},(_,i)=>'p'+i),makers={},players=Object.fromEntries(ids.map((id,i)=>[id,{isHost:!i,name:id}]));
 let s=newBluff(ids,turns,rng),now=1000,room={phase:'bluff',gameId:'game',players,settings:{mode:'bluff'},bluff:s};
 assert.equal(s.total,count*(turns==='auto'?(count<=3?2:1):turns));
 while(s.round<s.total){
  s=dealBluff(s,q,now,rng);makers[s.maker]=(makers[s.maker]||0)+1;
  s=chooseBluff(s,s.maker,Math.floor(rng()*3),now+100);
  let wrong=0,right=0;
  for(const id of ids.filter(id=>id!==s.maker)){
   if(rng()<.1)continue;
   const choice=['low','correct','high'][Math.floor(rng()*3)];if(choice===s.claim.kind)right++;else wrong++;
   s=voteBluff(s,id,choice,now+200);assert.equal(voteBluff(s,id,choice,now+201),null,'Locked vote cannot change');
  }
  const expected={...room,bluff:s};const result=revealBluff(s,now+500);assert.equal(result.result.points[s.maker],wrong);
  assert.equal(Object.values(result.result.points).reduce((a,b)=>a+b,0),wrong+right*2);
  room=commitBluff(expected,expected,result,'p0');assert(room);assert(room.bluffRounds['r'+s.round]);
  assert.equal(commitBluff(room,expected,result,'p0'),undefined,'Duplicate host reveal rejected');
  assert.equal(revealBluff(result,now+600),null,'Cannot score twice');s=result;now+=10000;
 }
 assert(Object.values(makers).every(n=>n===s.cycles));assert.equal(bluffStandings(s).length,count);
 assert.equal(dealBluff(s,q,now,rng),null,'No extra rounds');
}
const ids=['a','b','c'],players={a:{isHost:true},b:{},c:{}};
let s=dealBluff(newBluff(ids,1,()=>.99),q,1000,()=>.5);
let room={phase:'bluff',gameId:'one',settings:{mode:'bluff'},players,bluff:s};
const action={gameId:'one',round:1,stage:'make',actor:s.maker,action:'claim',value:0};
assert(bluffAction(room,action,1100));
for(const invalid of [{gameId:'stale'},{round:2},{stage:'vote'},{actor:ids.find(id=>id!==s.maker)},{value:9}])assert.equal(bluffAction(room,{...action,...invalid},1100),undefined);
assert.equal(bluffAction({...room,paused:true},action,1100),undefined);
assert.equal(bluffAction(room,action,s.endsAt),undefined,'Deadline enforced inside transaction');
s=chooseBluff(s,s.maker,0,27000,true);assert(s.autoClaim);
for(const id of ids.filter(id=>id!==s.maker))s=voteBluff(s,id,s.claim.kind==='correct'?'low':'correct',28000);
s=revealBluff(s,29000);assert.equal(s.result.points[s.maker],0,'Timed-out maker cannot earn points');
room={...room,bluff:s};assert.equal(commitBluff(room,room,{...s,stage:'over'},'b'),undefined,'Nonhost cannot advance');
assert.equal(commitBluff({...room,paused:true},room,{...s,stage:'over'},'a'),undefined);
assert.equal(admitPlayer(room,'late',{name:'Late'}),undefined,'No midgame spectator rewards or uneven maker turns');
let profile={coins:50,stats:{answeredRounds:4,accuracyTotal:300},history:[],seenObjects:{}};
for(const id of ids){
 const record=bluffRoundRecord('match',s,id,players,30),next=applyCareerRecord(profile,record);
 assert.equal(applyCareerRecord(next,record),next,'Idempotent round receipts');
 assert.equal(next.stats.gamesPlayed,undefined,'Abandoned game is not finished');assert.equal(next.stats.gamesWon,undefined);
 assert.equal(next.stats.answeredRounds,4,'Classification does not corrupt measurement accuracy');assert.equal(next.stats.accuracyTotal,300);
 assert.equal(next.stats.missedRounds,undefined,'Maker turn is not a missed guess');
 assert.equal(next.coins,50);assert.equal(objectFrequency(next,'bluff').door,1);assert(next.seenObjects.pencil);
}
const record=bluffRoundRecord('match',s,'b',players,30);profile=applyCareerRecord(profile,record);
const match={kind:'match',mode:'bluff',key:'match',won:true,place:1,score:5,accuracy:50,t:40};
profile=applyCareerRecord(profile,match);assert.equal(profile.stats.gamesWon,1);assert.equal(applyCareerRecord(profile,match),profile);
const tied={...s,scores:{a:5,b:5,c:5},correct:{a:1,b:2,c:2},judged:{a:2,b:2,c:2}};
assert.deepEqual(bluffStandings(tied).map(r=>[r.id,r.rank]),[['b',1],['c',1],['a',3]]);
console.log('Bluff: 240 complete games, balanced maker turns, 3 labeled options, voting/timeout scoring, late/duplicate/stale/paused/host guards, tiebreak/shared wins, no midgame joins, isolated accuracy, abandoned-round discoveries and once-only stats passed.');
