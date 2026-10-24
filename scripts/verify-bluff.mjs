import {bluffPickHtml,bluffRankingsHtml,bluffSummaryHtml,bluffRevealTimes} from '../anim/bluff-ui.mjs';
import assert from 'node:assert/strict';
import {bluffOptions,newBluff,dealBluff,chooseBluff,voteBluff,bluffVoteDeadline,revealBluff,bluffStandings,bluffStandingsBefore,botMakerChoice,botVoteChoice,bluffNewLeaders,bluffAction,commitBluff,bluffRoundRecord} from '../anim/bluff.mjs';
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
   s=voteBluff(s,id,choice,now+200);assert.equal(voteBluff(s,id,choice,now+201),null,'Duplicate tap cannot reset buffer');
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
const clean=v=>{if(v==null)return null;if(typeof v!=='object')return v;if(Array.isArray(v))return v.map(clean);const entries=Object.keys(v).sort().reverse().map(k=>[k,clean(v[k])]).filter(([,x])=>x!==null);return entries.length?Object.fromEntries(entries):null;};
{
 let v=chooseBluff(dealBluff(newBluff(ids,1),q,1000),ids[0],0,1100,true);
 const id=v.order.find(x=>x!==v.maker);v=voteBluff(v,id,'low',2000);
 const changed=voteBluff(v,id,'high',11999);assert(changed,'Vote can change for ten seconds');assert.equal(changed.voteAt[id],2000,'Changing does not reset buffer');
 assert.equal(bluffVoteDeadline(changed,id),12000);assert.equal(voteBluff(changed,id,'correct',12000),null,'Exact window boundary locks');
 const late=voteBluff({...v,votes:{},voteAt:{}},id,'high',v.endsAt-1);assert.equal(bluffVoteDeadline(late,id),v.endsAt,'Window cannot extend round deadline');
 const expected={phase:'bluff',gameId:'serialization',players,bluff:{...changed,claim:changed.claim,optional:null,empty:{}}};
 const animation={...expected.bluff,stage:'animation',startedAt:15000,endsAt:18000};
 const stored=clean(expected);assert(commitBluff(stored,expected,animation,'a'),'Firebase field ordering and missing empty/null children cannot stall animation');
 const revealing={...stored,bluff:clean(animation)};const revealed=clean(revealBluff(revealing.bluff,18001));assert(commitBluff(revealing,{...expected,bluff:animation},revealed,'a'),'Animation finishes after Firebase roundtrip');assert.equal(bluffStandings(revealed).length,3,'Missing empty tally maps do not break rankings');
 assert.equal(commitBluff({...stored,bluff:{...stored.bluff,votes:{...stored.bluff.votes,[id]:'correct'}}},expected,animation,'a'),undefined,'Concurrent changed vote prevents stale reveal');
 const nobodyRight=clean(revealBluff({...clean(v),votes:{}},18001));assert.equal(nobodyRight.correct,undefined,'RTDB drops the all-zero correct map');assert(bluffStandings(nobodyRight).every(r=>r.accuracy===0),'All-wrong or unanswered round still has rankings');
}
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
{
 const changed={...s,round:2,maker:'a',claim:{kind:'high'},votes:{b:'high',c:'low'},scores:{a:6,b:6,c:2},correct:{a:1,b:2,c:0},judged:{a:1,b:2,c:2},result:{points:{a:1,b:2,c:0}}};
 assert.deepEqual(bluffNewLeaders(changed),['b'],'Newly joined leader is highlighted, existing leader is not');
 const unchanged={...changed,scores:{a:9,b:6,c:2}};assert.deepEqual(bluffNewLeaders(unchanged),[],'Retaining first does not retrigger new-leader highlight');
 assert.deepEqual(bluffNewLeaders({...changed,round:1,scores:{a:0,b:0,c:0}}),[],'No first-place fanfare before anyone scores');
}
{
 const result={...room,bluff:s,bluffRounds:{r1:s}},rankings={...s,showStand:true,endsAt:90000};
 const shown=commitBluff(result,result,rankings,'a');assert(shown.bluff.showStand);assert.equal(shown.bluffRounds,result.bluffRounds,'Rankings do not rewrite the scored round');assert.equal(shown.players,result.players,'Rankings do not award points again');
 const next=dealBluff({...rankings,round:1,total:3},q,91000);assert.equal(next.showStand,false,'New round resets rankings view');
}
console.log('Bluff: 240 complete games, balanced maker turns, 3 labeled options, voting/timeout scoring, late/duplicate/stale/paused/host guards, tiebreak/shared wins, no midgame joins, isolated accuracy, abandoned-round discoveries and once-only stats passed.');

for(const who of ['maker','guesser','missed'])for(const kind of ['low','correct','high']){
 const badge=bluffPickHtml({maker:'maker',claim:{kind:'correct',value:250},votes:{guesser:kind}},who);
 assert(badge.includes('bl-pick-number">250</strong>'),'All roles see the chosen number');
 assert(badge.includes('</b></div><strong'),'Number sits beside the two text rows');
}

{ // Rankings: climbed/dropped arrows and the staged reveal timeline.
  const s={order:['a','b','c'],maker:'c',round:2,scores:{a:2,b:3,c:1},correct:{a:1,b:1,c:0},judged:{a:2,b:2,c:0},votes:{a:'low',b:'high'},claim:{kind:'high',value:5},q:{answer:4},result:{points:{a:0,b:2,c:1},wrong:1}};
  const players={a:{name:'Ann'},b:{name:'Bo'},c:{name:'Cy'}};
  const before=bluffStandingsBefore(s);
  assert(before&&before.map(r=>r.id).join()==='a,b,c','Standings before the round are rebuilt without this round\'s points');
  const html=bluffRankingsHtml(s,players,()=>'',null);
  assert(html.includes('hs-mv up')&&html.includes('&#9650;1'),'A player who climbed shows an up arrow');
  assert(html.includes('hs-mv down'),'A player who dropped shows a down arrow');
  {const first={...s,round:1,scores:{a:0,b:2,c:1},correct:{a:0,b:1,c:0},judged:{a:1,b:1,c:0}},h=bluffRankingsHtml(first,players,()=>'',null);
  assert(bluffStandingsBefore(first).every(r=>r.rank===1),'Everyone is tied for first before round one');
  assert(h.includes('hs-mv same')&&h.includes('hs-mv down'),'From a tie: the leader holds (dash) and the others show a drop');}
  const T=bluffRevealTimes(s),motionless=bluffRevealTimes(s,false);
  assert(T.judged>T.drop0&&T.n===2&&motionless.judged===0,'Reveal timeline grows with voters and collapses without motion');
  const staged=bluffSummaryHtml(s,players,()=>'',null,0,true),still=bluffSummaryHtml(s,players,()=>'',null,Infinity,true);
  assert(staged.includes('bl-drop')&&!staged.includes('bl-judged')&&!still.includes('bl-drop')&&still.includes('bl-judged'),'Live summary drops voters; finished summary is static and judged');
}

{ // Bots: difficulty-based claims and estimate-based votes.
  let seed=12345;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296||1e-9;};
  const trials=6000,acc={},truth={},near={};
  for(const level of ['easy','medium','hard']){
    let right=0,truths=0,lies=0,dist=0;
    for(let i=0;i<trials;i++){
      const answer=Math.exp(rng()*8-2),options=bluffOptions(answer,rng),s={options,q:{answer}};
      const pick=botMakerChoice(s,level,rng),claim=options[pick];
      assert(claim&&['low','correct','high'].includes(claim.kind),'Bot maker returns one of the three options');
      if(claim.kind==='correct')truths++;else{lies++;dist+=Math.abs(Math.log(claim.value/answer));}
      const vote=botVoteChoice({q:{answer},claim},level,rng);
      assert(['low','correct','high'].includes(vote),'Bot voter returns a valid vote');
      if(vote===claim.kind)right++;
    }
    acc[level]=right/trials;truth[level]=truths/trials;near[level]=dist/lies;
  }
  assert(acc.easy<acc.medium&&acc.medium<acc.hard,'Sharper voter bots judge claims more accurately: '+JSON.stringify(acc));
  assert(acc.easy>.3&&acc.hard<.97&&acc.hard>.6,'Voter accuracy stays believable: '+JSON.stringify(acc));
  assert(truth.easy<truth.medium&&truth.medium<truth.hard,'Sharper bot makers tell the truth more often (it pays against noisy voters): '+JSON.stringify(truth));
  assert(near.hard<near.medium&&near.medium<near.easy,'Sharper bot makers choose more believable lies: '+JSON.stringify(near));
  console.log('Bluff bots: voter accuracy',JSON.stringify(acc),'maker truth rate',JSON.stringify(truth),'lie distance',JSON.stringify(near));
}
