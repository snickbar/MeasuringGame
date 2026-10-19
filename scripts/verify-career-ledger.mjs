import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {applyCareerRecord,createCareerLedger,historyRows,topScores} from '../anim/career-ledger.mjs';
const fresh=()=>({coins:100,stats:{},worlds:{},seenObjects:{},seenCombos:{},history:[]});
const round=(key,mode='worlds')=>({kind:'round',key,mode,history:{u:'ant',g:'door',r:.75,rawR:.65,answered:true,s:3,t:1},inc:{spotOns:0,perfects:0}});
let profile=fresh();
for(let i=0;i<3;i++)profile=applyCareerRecord(profile,round('abandoned_'+i));
assert.equal(profile.stats.rounds,3);assert(!profile.stats.gamesPlayed);assert(!profile.stats.gamesWon);
assert(profile.seenObjects.ant&&profile.seenObjects.door&&profile.seenCombos['ant|door']);
assert.equal(profile.history.length,3);assert.equal(profile.modeStats.worlds.answered,3);
assert.deepEqual(applyCareerRecord(profile,round('abandoned_1')),profile);
profile=applyCareerRecord(profile,{...round('miss','quick'),history:{u:'nail',g:'hammer',answered:false,r:null,s:1,t:2}});
assert.equal(profile.stats.rounds,4);assert.equal(profile.stats.missedRounds,1);assert.equal(profile.modeStats.quick.answered,0);assert(profile.seenObjects.nail);
profile=applyCareerRecord(profile,{kind:'match',key:'game1',mode:'quick',won:true,place:1,opponents:['easy'],accuracy:90,t:2});
profile=applyCareerRecord(profile,{kind:'match',key:'game1',mode:'quick',won:true,place:1,opponents:['easy'],accuracy:90,t:2});
assert.equal(profile.stats.gamesPlayed,1);assert.equal(profile.stats.gamesWon,1);assert.equal(profile.difficultyStats.easy.wins,1);
const world={kind:'attempt',key:'world1',mode:'worlds',world:'tiny',level:1,stars:2,accuracy:85,t:3};
profile=applyCareerRecord(profile,world);profile=applyCareerRecord(profile,world);assert.equal(profile.coins,110);assert.equal(profile.worlds.tiny.l1,2);assert.equal(profile.stats.worldLevels,1);
profile=applyCareerRecord(profile,{...world,key:'world2',stars:3,accuracy:95});assert.equal(profile.coins,115);assert.equal(profile.worldRecords.tiny.l1.attempts,2);
profile=applyCareerRecord(profile,{kind:'attempt',key:'run1',mode:'survival',survived:5,accuracy:85,t:4});
profile=applyCareerRecord(profile,{kind:'attempt',key:'run1',mode:'survival',survived:5,accuracy:85,t:4});assert.equal(profile.coins,125);assert.equal(profile.survival.runs,1);
profile=applyCareerRecord(profile,{kind:'attempt',key:'run2',mode:'survival',survived:8,accuracy:90,t:5});assert.equal(profile.coins,131);assert.equal(profile.survival.best,8);
profile={...profile,dailyStreak:{last:'2026-10-17',count:2,best:2}};
const daily={kind:'attempt',key:'daily_2026-10-18',mode:'daily',date:'2026-10-18',yesterday:'2026-10-17',saved:{date:'2026-10-18',guesses:[1,2,3]},accuracy:90,t:5};
profile=applyCareerRecord(profile,daily);profile=applyCareerRecord(profile,daily);assert.equal(profile.coins,151);assert.equal(profile.dailyStreak.count,3);assert.equal(profile.stats.dailies,1);
assert.equal(profile.stats.rounds,4,'attempt completion cannot add round counters twice');
assert.deepEqual(profile.dailyHistory,{'2026-10-18':{s:90,t:5}},'every played date is kept, not just the most recent');
profile=applyCareerRecord(profile,{...daily,key:'daily_2026-10-19',date:'2026-10-19',yesterday:'2026-10-18',accuracy:70,t:6,saved:{date:'2026-10-19',guesses:[1,2,3]}});
assert.deepEqual(profile.dailyHistory,{'2026-10-18':{s:90,t:5},'2026-10-19':{s:70,t:6}},'a missed day never gets backfilled, a played day never evicted');

// Monthly completion keeps the same kind of per-month history; practice rounds (mode 'practice') must not.
const monthly={kind:'attempt',key:'monthly_2026-10_v1',mode:'monthly',month:'2026-10',accuracy:88,coins:40,saved:{key:'2026-10',done:true},t:7};
profile=applyCareerRecord(profile,monthly);profile=applyCareerRecord(profile,monthly);
assert.equal(profile.stats.monthlies,1);assert.deepEqual(profile.monthlyHistory,{'2026-10':{s:88,t:7}});
profile=applyCareerRecord(profile,{...monthly,key:'monthly_2026-11_v1',month:'2026-11',accuracy:95,t:8});
assert.deepEqual(profile.monthlyHistory,{'2026-10':{s:88,t:7},'2026-11':{s:95,t:8}});
profile=applyCareerRecord(profile,{kind:'attempt',key:'practice1',mode:'practice',month:'2026-11',accuracy:99,total:99,rounds:10,t:9});
assert.deepEqual(profile.monthlyHistory,{'2026-10':{s:88,t:7},'2026-11':{s:95,t:8}},'a practice round is not a monthly completion');

// historyRows: newest first, nothing evicted. topScores: highest first, ties go to the newer row (stable sort over already-recency-sorted rows).
assert.deepEqual(historyRows(profile.dailyHistory),[{key:'2026-10-19',s:70,t:6},{key:'2026-10-18',s:90,t:5}]);
const tieRows=historyRows({'2026-01-01':{s:80,t:1},'2026-01-02':{s:95,t:2},'2026-01-03':{s:80,t:3}});
assert.deepEqual(topScores(tieRows,3),[{key:'2026-01-02',s:95,t:2},{key:'2026-01-03',s:80,t:3},{key:'2026-01-01',s:80,t:1}],'equal scores: the more recent date wins the tie');
assert.equal(topScores(tieRows,2).length,2,'capped to n');

// A lost response after a successful commit leaves a durable retry, not a second award.
let wallet=fresh(),lost=true,saved=0;const cache=new Map(),storage={getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,v)};
const ports={owner:()=> 'owner',storage,transaction:async(_,fn)=>{wallet=fn(structuredClone(wallet));if(lost){lost=false;throw Error('lost response');}},onSaved:()=>saved++};
let ledger=createCareerLedger(ports);ledger.save(round('retry'));await ledger.flush();assert.equal(wallet.stats.rounds,1);assert.equal(ledger.pending(),1);
ledger=createCareerLedger(ports);await ledger.flush();assert.equal(wallet.stats.rounds,1);assert.equal(wallet.history.length,1);assert.equal(ledger.pending(),0);
await ledger.flush();ledger.save(round('next'));await ledger.flush();assert.equal(wallet.stats.rounds,2,'empty flush does not block future rounds');
let boardFailure=true;ledger=createCareerLedger({...ports,onSaved:()=>{if(boardFailure)throw Error('leaderboard offline');}});
ledger.save({...daily,key:'daily-board'});await ledger.flush();assert.equal(ledger.pending(),1);const balance=wallet.coins;boardFailure=false;await ledger.flush();assert.equal(wallet.coins,balance);assert.equal(ledger.pending(),0);

// Exercise the actual final ranking and recorder: score, then accuracy, then shared winner.
const source=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const fn=name=>{const a=source.indexOf('  function '+name+'(');return source.slice(a,source.indexOf('\n  }',a)+4);};
const context=vm.createContext({});vm.runInContext(fn('computeRanks'),context);
for(const [a,b,winnerCount]of [[50,90,1],[90,90,2],[90,89.99,1]]){
 const ranks=context.computeRanks(['a','b'],()=>10,id=>id==='a'?a:b,true);assert.equal(ranks.filter(r=>r.rank===1).length,winnerCount);
 const expected=a===b?['a','b']:a>b?['a']:['b'];assert.deepEqual(Array.from(ranks.filter(r=>r.rank===1),r=>r.id).sort(),expected);
}
assert(source.includes("won:standings.length>=2&&myPlace?.rank===1"));
assert(!source.includes('if (ids.length >= 2 && myFinalScore === top)'));
// Actual rematch preserves the roster and returns to waiting with readiness cleared.
let update;const replay=vm.createContext({isHost:true,roomState:{players:{me:{isHost:true},friend:{},bot:{isBot:true}}},crypto:{randomUUID:()=> 'next-id'},db:{},ref:(_,p)=>p,update:async(_,v)=>update=v});
const start=source.indexOf('  async function playAgain(');vm.runInContext(source.slice(start,source.indexOf('\n  }',start)+4),replay);await replay.playAgain('TEST');
assert.equal(update.phase,'waiting');assert.equal(update.gameId,'next-id');assert.equal(update['players/friend/ready'],false);assert(!Object.keys(update).includes('players'));
console.log('PASS: abandoned-round discovery/stats, once-only finishes, score/accuracy/shared wins, solo star/streak/best payouts, lost-response recovery, leaderboard retries, same-roster rematch, and daily/monthly score history with recency tiebreaks.');
