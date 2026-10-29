import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {applyCareerRecord} from '../anim/career-ledger.mjs';
import {reserveHostStart,finishHostStart,grantHostAdGame,hasHostAdGame,canWatchHostAd} from '../anim/host-allowance.mjs';
import {roundAccuracy} from '../anim/accuracy.mjs';
const source=fs.readFileSync('index.html','utf8');
const extract=name=>{const a=source.indexOf('  function '+name+'(')>=0?source.indexOf('  function '+name+'('):source.indexOf('  async function '+name+'(');assert(a>=0,name);return source.slice(a,source.indexOf('\n  }',a)+4);};
let written;
const c=vm.createContext({Math,Set,Map,roundAccuracy,effectiveGuess:(_,g)=>g,TRUTH_ID:'truth',questionObjects:()=>null,nowMs:()=>1,currentSettings:{},db:{},ref:()=>null,scheduleHostDeadline(){},console:{log(){},error(){}},update:async(_,v)=>written=v});
vm.runInContext(extract('finishRoundScoring')+'\n'+extract('computeRoundBreakdown'),c);
async function score(order,guesses,{mode='party',answer=100,picks={},teams={}}={}){c.roomState={settings:{mode,animationReveal:false},currentQuestion:{answer},players:Object.fromEntries(order.map(id=>[id,{team:teams[id],score:0}]))};await c.finishRoundScoring('test',order,guesses,picks);return written;}
for(const order of [['a','b'],['b','a']]){let r=await score(order,{a:100,b:100});assert.equal(r.lastRoundPoints.a,5);assert.equal(r.lastRoundPoints.b,5);assert(r.revealOrder.every(e=>e.isClosest));r=await score(order,{a:90,b:110});assert.equal(r.lastRoundPoints.a,3);assert.equal(r.lastRoundPoints.b,3);}
for(const [answer,guess,points] of [[2,2.8,3],[2,2.02,5],[100,101,5],[100,101.01,3],[10000,10099,5]]){const r=await score(['a','b'],{a:guess,b:answer*2},{answer});assert.equal(r.lastRoundPoints.a,points);}
let r=await score(['a','b','c','d'],{a:100,b:100,c:100,d:10},{mode:'teamvteam',teams:{a:'red',b:'red',c:'blue',d:'blue'},picks:{a:{type:'doubledown'},b:{type:'doubledown'}}});
assert.equal(r.lastRoundPoints.a,7);assert.equal(r.lastRoundPoints.c,5);assert.equal(r['players/a/individualPoints']+r['players/b/individualPoints'],7);
const breakdown=c.computeRoundBreakdown(r);assert.equal(breakdown.a.reduce((n,p)=>n+p.amount,0)+breakdown.b.reduce((n,p)=>n+p.amount,0),7);
r=await score(['a','b','c'],{a:99,b:101,c:50},{picks:{a:{type:'pick',targetPlayerId:'truth'},c:{type:'pick',targetPlayerId:'truth'}}});assert.equal(r.lastRoundPoints.a,5);assert.equal(r.lastRoundPoints.b,5);assert.equal(r.lastRoundPoints.c,1);
let p={coins:0,stats:{},worlds:{tiny:{l1:3}}};const w={kind:'attempt',key:'repeat',mode:'worlds',world:'tiny',level:1,stars:2,accuracy:80,t:1};p=applyCareerRecord(p,w);assert.equal(p.coins,10);assert.equal(p.worlds.tiny.l1,3);assert.equal(applyCareerRecord(p,w).coins,10);
const run={kind:'attempt',key:'survival',mode:'survival',survived:5,themedWins:1,accuracy:80,t:1};p=applyCareerRecord({coins:0,stats:{}},run);assert.equal(p.coins,17);assert.equal(applyCareerRecord(p,run).coins,17);
const day={kind:'attempt',key:'daily_2026-10-28',mode:'daily',date:'2026-10-28',yesterday:'2026-10-27',saved:{},accuracy:70,t:1};p=applyCareerRecord({coins:0,stats:{}},day);assert.equal(p.coins,10);assert.equal(applyCareerRecord(p,day).coins,10);
const ticket={mode:'classic',room:'ABCD',day:'2026-10-28',now:100};p=reserveHostStart({},ticket);assert(!p.hostFreeDates);assert.equal(reserveHostStart(p,{...ticket,room:'EFGH'}),undefined);let released=finishHostStart(p,ticket,false);assert(!released.hostFreeDates);p=reserveHostStart(released,ticket);p=finishHostStart(p,ticket,true);assert.equal(p.hostFreeDates.classic,ticket.day);assert.equal(reserveHostStart(p,{...ticket,room:'EFGH'}),undefined);assert(reserveHostStart(p,{...ticket,mode:'bluff'}));assert(reserveHostStart(p,{...ticket,day:'2026-10-29'}));

// Rewarded games are mode-specific, cannot stack, and are spent only on a successful start.
const reward={mode:'classic',rewardId:'ad-1',now:100};
p=grantHostAdGame({hostFreeDates:{classic:ticket.day}},reward);
assert(hasHostAdGame(p,'classic'));assert(!hasHostAdGame(p,'bluff'));
assert.deepEqual(grantHostAdGame(p,reward),p);
assert.deepEqual(grantHostAdGame(p,{...reward,rewardId:'ad-2'}),p);
let adReserved=reserveHostStart(p,ticket);
assert.equal(adReserved.hostFreePending.classic.adId,'ad-1');
assert.equal(reserveHostStart(adReserved,{...ticket,room:'OTHER'}),undefined);
let adReleased=finishHostStart(adReserved,ticket,false);
assert(hasHostAdGame(adReleased,'classic'));
p=finishHostStart(reserveHostStart(adReleased,ticket),ticket,true);
assert(!hasHostAdGame(p,'classic'));assert.equal(p.hostFreeDates.classic,ticket.day);
assert.equal(reserveHostStart(p,ticket),undefined);
assert(!hasHostAdGame(grantHostAdGame(p,reward),'classic'),'same reward callback must not grant twice');
p=grantHostAdGame(p,{...reward,rewardId:'ad-2'});assert(hasHostAdGame(p,'classic'));
// A new day's daily allowance is spent before the saved ad ticket.
p=finishHostStart(reserveHostStart(p,{...ticket,day:'2026-10-29'}),{...ticket,day:'2026-10-29'},true);
assert.equal(p.hostFreeDates.classic,'2026-10-29');assert(hasHostAdGame(p,'classic'));
assert.equal(finishHostStart(p,ticket,true),undefined);
const datedReward={...reward,day:ticket.day};
p=grantHostAdGame({hostFreeDates:{classic:ticket.day}},datedReward);
assert(!canWatchHostAd(p,'classic',ticket.day));
p=finishHostStart(reserveHostStart(p,ticket),ticket,true);
assert(!canWatchHostAd(p,'classic',ticket.day),'Used ad game shows a lock for the rest of that day');
assert(!hasHostAdGame(grantHostAdGame(p,{...datedReward,rewardId:'again'}),'classic'));
assert(canWatchHostAd(p,'classic','2026-10-29'));
assert(canWatchHostAd(p,'bluff',ticket.day));

const bot=vm.createContext({Math});vm.runInContext(source.match(/  const HL_BOT_LEVELS = [^;]+;/)[0]+'\n'+extract('hlBotGuess'),bot);for(const level of ['easy','medium','hard'])for(const answer of [1.5,1.789,100,1234.567])for(let i=0;i<1000;i++){assert(bot.hlBotGuess(answer,level,'high',2.5)>=answer);assert(bot.hlBotGuess(answer,level,'low',2.5)<=answer);}
assert(source.includes('await addBot("easy")'));
console.log('PASS: tied individual/team scoring and contributions, 1% boundaries, truth-card exclusions, recurring Worlds/Daily rewards, Survival 3/5 coins, idempotence, start-only free allowance, and reliable High/Low partners.');
