import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {applyCareerRecord,createCareerLedger,historyRows,topScores,objectFrequency} from '../anim/career-ledger.mjs';
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
assert.deepEqual(objectFrequency(profile),{ant:3,door:3,nail:1,hammer:1});
assert.deepEqual(objectFrequency(profile,'quick'),{nail:1,hammer:1});
assert.deepEqual(objectFrequency(applyCareerRecord(profile,round('abandoned_1'))),objectFrequency(profile),'receipt retries do not double count appearances');
let longHistory={...fresh(),history:[{u:'legacy',g:'door',s:1,r:1}]};
for(let i=0;i<305;i++)longHistory=applyCareerRecord(longHistory,round('frequency_'+i));
assert.equal(longHistory.history.length,300);
assert.equal(objectFrequency(longHistory).ant,305,'frequency survives rolling history eviction');
assert.equal(objectFrequency(longHistory).legacy,1,'existing history is seeded once');
assert.equal(objectFrequency(longHistory,'quick').legacy,1);
profile=applyCareerRecord(profile,{kind:'match',key:'game1',mode:'quick',won:true,place:1,opponents:['easy'],accuracy:90,t:2});
profile=applyCareerRecord(profile,{kind:'match',key:'game1',mode:'quick',won:true,place:1,opponents:['easy'],accuracy:90,t:2});
assert.equal(profile.stats.gamesPlayed,1);assert.equal(profile.stats.gamesWon,1);assert.equal(profile.difficultyStats.easy.wins,1);
const world={kind:'attempt',key:'world1',mode:'worlds',world:'tiny',level:1,stars:2,accuracy:85,t:3};
profile=applyCareerRecord(profile,world);profile=applyCareerRecord(profile,world);assert.equal(profile.coins,110);assert.equal(profile.worlds.tiny.l1,2);assert.equal(profile.stats.worldLevels,1);
profile=applyCareerRecord(profile,{...world,key:'world2',stars:3,accuracy:95});assert.equal(profile.coins,115);assert.equal(profile.worldRecords.tiny.l1.attempts,2);
profile=applyCareerRecord(profile,{kind:'attempt',key:'run1',mode:'survival',survived:5,accuracy:85,t:4});
profile=applyCareerRecord(profile,{kind:'attempt',key:'run1',mode:'survival',survived:5,accuracy:85,t:4});assert.equal(profile.coins,125);assert.equal(profile.survival.runs,1);
profile=applyCareerRecord(profile,{kind:'attempt',key:'run2',mode:'survival',survived:8,accuracy:90,t:5});assert.equal(profile.coins,131);assert.equal(profile.survival.best,8);

// Team Worlds: a running best-stars-per-World (coin gain only, never shown) kept separate from
// an immutable per-attempt history (shown as "your top 5", never deduped by partner).
const teamWorld={kind:'attempt',key:'tw1',mode:'teamworlds',world:'tiny',stars:2,accuracy:80,partnerName:'Bob',myAvatar:'fox',partnerAvatar:'owl',t:6};
profile=applyCareerRecord(profile,teamWorld);profile=applyCareerRecord(profile,teamWorld);
assert.equal(profile.coins,141,'duplicate delivery is a no-op; first delivery pays 2 stars * 5 coins');
assert.equal(profile.teamWorlds.tiny.bestStars,2);
assert.deepEqual(profile.teamWorldsHistory.tiny,{tw1:{s:80,t:6,myAvatar:'fox',partnerName:'Bob',partnerAvatar:'owl'}});
profile=applyCareerRecord(profile,{...teamWorld,key:'tw2',stars:1,accuracy:60,partnerName:'Carol',myAvatar:'fox',partnerAvatar:'cat',t:7});
assert.equal(profile.coins,146,'every attempt pays its stars (1 star * 5), even a worse one - replayable and re-collectable');
assert.equal(profile.teamWorlds.tiny.bestStars,2,'best-stars tracker never decreases');
assert.deepEqual(profile.teamWorldsHistory.tiny,{tw1:{s:80,t:6,myAvatar:'fox',partnerName:'Bob',partnerAvatar:'owl'},tw2:{s:60,t:7,myAvatar:'fox',partnerName:'Carol',partnerAvatar:'cat'}},'every attempt kept, even a worse one, keyed by its own attempt - not deduped per partner');
profile=applyCareerRecord(profile,{...teamWorld,key:'tw3',stars:3,accuracy:95,partnerName:'Bob',t:8});
assert.equal(profile.coins,161,'a 3-star game pays 3 * 5 again, even with a repeat partner - a new entry, not an update');
assert.equal(Object.keys(profile.teamWorldsHistory.tiny).length,3);
assert.deepEqual(topScores(historyRows(profile.teamWorldsHistory.tiny),5).map((r)=>r.s),[95,80,60],'top scores across all attempts regardless of partner');

// High/Low Survival: its own mode, paid 2 coins per round survived on every run, one history row per run.
const hlRun={kind:'attempt',key:'hl1',mode:'hlsurvival',survived:4,rounds:7,bestStreak:3,accuracy:70,partnerName:'Dee',myAvatar:'fox',partnerAvatar:'owl',t:9};
profile=applyCareerRecord(profile,hlRun);profile=applyCareerRecord(profile,hlRun);
assert.equal(profile.coins,169,'duplicate delivery is a no-op; first delivery pays 4 rounds * 2 coins');
assert.equal(profile.hlSurvival.best,4);assert.equal(profile.hlSurvival.bestStreak,3);
profile=applyCareerRecord(profile,{...hlRun,key:'hl2',survived:2,bestStreak:1,t:10});
assert.equal(profile.coins,173,'a worse run still pays its rounds');assert.equal(profile.hlSurvival.best,4,'best never decreases');
assert.deepEqual(topScores(historyRows(profile.hlHistory),5).map((r)=>r.s),[4,2]);
assert.equal(profile.modeStats.hlsurvival.attempts,2);

profile={...profile,dailyStreak:{last:'2026-10-17',count:2,best:2}};
const daily={kind:'attempt',key:'daily_2026-10-18',mode:'daily',date:'2026-10-18',yesterday:'2026-10-17',saved:{date:'2026-10-18',guesses:[1,2,3]},accuracy:90,t:5};
profile=applyCareerRecord(profile,daily);profile=applyCareerRecord(profile,daily);assert.equal(profile.coins,193);assert.equal(profile.dailyStreak.count,3);assert.equal(profile.stats.dailies,1);
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

// Team vs Team match records keep a per-GAME history (not per-date, like daily/monthly) -
// every team game played, not one slot per day, for the info screen's "your best teams" card.
const gamesBefore=profile.stats.gamesPlayed;
const teamMatch={kind:'match',key:'room1_g1',mode:'teamvteam',won:true,place:1,score:12,accuracy:72,myAvatar:'fox',partnerName:'Bob',partnerAvatar:'owl',t:9};
profile=applyCareerRecord(profile,teamMatch);profile=applyCareerRecord(profile,teamMatch);
assert.equal(profile.stats.gamesPlayed,gamesBefore+1,'duplicate delivery of the same match is a no-op');
assert.deepEqual(profile.teamHistory,{room1_g1:{s:12,t:9,accuracy:72,myAvatar:'fox',partnerName:'Bob',partnerAvatar:'owl'}});
profile=applyCareerRecord(profile,{...teamMatch,key:'room2_g1',score:20,accuracy:85,t:10});
assert.equal(profile.stats.gamesPlayed,gamesBefore+2);
assert.deepEqual(profile.teamHistory,{room1_g1:{s:12,t:9,accuracy:72,myAvatar:'fox',partnerName:'Bob',partnerAvatar:'owl'},room2_g1:{s:20,t:10,accuracy:85,myAvatar:'fox',partnerName:'Bob',partnerAvatar:'owl'}},'every team game kept, not just the most recent');
assert.deepEqual(topScores(historyRows(profile.teamHistory),3),[
  {key:'room2_g1',s:20,t:10,accuracy:85,myAvatar:'fox',partnerName:'Bob',partnerAvatar:'owl'},
  {key:'room1_g1',s:12,t:9,accuracy:72,myAvatar:'fox',partnerName:'Bob',partnerAvatar:'owl'},
],'teamHistory sorts by actual time, not by its non-chronological keys, and keeps every field (partner/avatar/accuracy) for the best-list card');

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
// Team vs Team's round-scoring redistribution: extract the real block from
// finishRoundScoring (not a reimplementation) and run it against fixtures - a
// round's points must end up identical for every member of the same team, and
// untouched for anyone with no team (not every room is Team vs Team).
const redistComment=source.indexOf("credit the round's points to the whole team");
const teamStart=source.indexOf('    if ((roomState.settings || currentSettings).mode === "teamvteam") {',redistComment);
const nl=source.includes('\r\n')?'\r\n':'\n'; // index.html uses LF; stay correct if it ever switches back to CRLF
const teamEnd=source.indexOf(nl+'    }'+nl,teamStart)+nl.length+5;
assert(teamStart>0&&teamEnd>teamStart,'team redistribution block must still be present verbatim');
const teamBlock=source.slice(teamStart,teamEnd);
const redistribute=(playersSnap,lastRoundPoints,mode='teamvteam')=>{
  const ctx=vm.createContext({roomState:{settings:{mode}},currentSettings:{},playersSnap,lastRoundPoints});
  vm.runInContext(teamBlock,ctx);
  return ctx.lastRoundPoints;
};
assert.deepEqual(redistribute({a:{team:'red'},b:{team:'red'},c:{team:'blue'}},{a:5}),{a:5,b:5,c:0},'the closest guesser\'s teammate gets credited too, not just them (the other team scored 0 this round)');
assert.deepEqual(redistribute({a:{team:'red'},b:{team:'red'}},{a:3,b:1}),{a:4,b:4},'each teammate\'s own points (e.g. crowd favorite) pool into one shared team total');
assert.deepEqual(redistribute({a:{},b:{team:'red'},c:{team:'red'}},{a:5,b:2}),{a:5,b:2,c:2},'a player with no team (not a Team vs Team room) is left untouched');
assert.deepEqual(redistribute({a:{team:'red'},b:{team:'red'}},{a:3},'party'),{a:3},'classic Party rooms never run the redistribution at all');

// Actual rematch preserves the roster and returns to waiting with readiness cleared.
let update;const replay=vm.createContext({isHost:true,isHlSettings:()=>false,roomState:{players:{me:{isHost:true},friend:{},bot:{isBot:true}}},crypto:{randomUUID:()=> 'next-id'},db:{},ref:(_,p)=>p,update:async(_,v)=>update=v});
const start=source.indexOf('  async function playAgain(');vm.runInContext(source.slice(start,source.indexOf('\n  }',start)+4),replay);await replay.playAgain('TEST');
assert.equal(update.phase,'waiting');assert.equal(update.gameId,'next-id');assert.equal(update['players/friend/ready'],false);assert(!Object.keys(update).includes('players'));
console.log('PASS: abandoned-round discovery/stats, once-only finishes, score/accuracy/shared wins, solo star/streak/best payouts, lost-response recovery, leaderboard retries, same-roster rematch, and daily/monthly/team score history with recency tiebreaks.');
