import {applyCareerRecord} from '../anim/career-ledger.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createMonthlyPairs,validMonthlyPairs,restoreMonthlyPairs,monthlyBoardScore,MONTHLY_FORMAT,monthlyBoardKey,resetMonthlyProgress,monthlyLevelSplit,monthlyLevelStates,monthlyLockText,monthlyLevelCoins,monthlyReplayCoins,monthlySeenIndexes} from '../anim/monthly-challenge.mjs';
import {roundAccuracy} from '../anim/accuracy.mjs';
const source=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const fn=name=>{let i=source.indexOf('  function '+name+'(');if(i<0)i=source.indexOf('  async function '+name+'(');assert(i>=0,name);return source.slice(i,source.indexOf('\n  }',i)+4)};
const array=name=>{const m=source.match(new RegExp('const '+name+' = (\\[[\\s\\S]*?\\n  \\]);'));assert(m,name);return 'const '+name+' = '+m[1]+';'};
const line=name=>source.slice(source.indexOf('  const '+name+' ='),source.indexOf('\n',source.indexOf('  const '+name+' =')));
const holidayStart=source.indexOf('  const HOLIDAY_OBJECTS ='),holidayEnd=source.indexOf(';',holidayStart)+1;
const ctx=vm.createContext({createMonthlyPairs,validMonthlyPairs,restoreMonthlyPairs,monthlyBoardScore,MONTHLY_FORMAT,monthlyBoardKey,resetMonthlyProgress,monthlyLevelSplit,monthlyLevelStates,monthlyLockText,monthlyLevelCoins,monthlyReplayCoins,monthlySeenIndexes});
vm.runInContext([
 array('OBJECTS'),array('MONTH_PACKS'),array('HOLIDAY_OBJECT_DEFS'),line('HOLIDAY_IMAGE_IDS'),
 source.slice(holidayStart,holidayEnd),line('SAMPLER_IDS'),line('MONTHLY_BANDS'),
 'const OBJECT_BY_ID = new Map([...OBJECTS,...HOLIDAY_OBJECTS].map(o=>[o.id,o]));',
 ...['easterMonth','seasonPackIds','dailyRng','staggerOrder','monthlyObjects','monthlyLegacyCombosLocal','monthlyCombosLocal'].map(fn),
 'globalThis.api={OBJECTS,OBJECT_BY_ID,monthlyObjects,monthlyCombosLocal,monthlyLegacyCombosLocal,dailyRng};'
].join('\n'),ctx);
const api=ctx.api,counts=[];let small=0,big=0,runs=0;
for(const year of [2026,2027])for(let month=1;month<=12;month++){
 const key=year+'-'+String(month).padStart(2,'0'),monthly=api.monthlyObjects(key);
 const rules={monthly,ordinary:api.OBJECTS,objects:api.OBJECT_BY_ID};
 const first=api.monthlyCombosLocal(key);
 assert.deepEqual(first,api.monthlyCombosLocal(key),'same month gives identical first attempt');
 assert.equal(first.length,monthly.length);
 assert(validMonthlyPairs(first,rules));
 if(year===2026)counts.push(`${key}: ${monthly.length}`);
 for(let seed=0;seed<32;seed++){
  const pairs=api.monthlyCombosLocal(key,api.dailyRng('practice-'+key+'-'+seed));
  assert.equal(pairs.length,monthly.length);assert(validMonthlyPairs(pairs,rules));
  const pack=new Set(monthly.map(o=>o.id)),seen=new Set();
  for(const q of pairs){const isSmall=pack.has(q.unitId);assert.notEqual(isSmall,pack.has(q.targetId));const id=isSmall?q.unitId:q.targetId;assert(!seen.has(id));seen.add(id);assert(api.OBJECT_BY_ID.get(q.unitId).mm<=api.OBJECT_BY_ID.get(q.targetId).mm);isSmall?small++:big++;}
  assert.equal(seen.size,monthly.length);runs++;
 }
 const old=api.monthlyLegacyCombosLocal(key),saved={key,guesses:[1,2],done:false};
 const migrated=restoreMonthlyPairs({saved,shared:old,generated:first,legacy:old,...rules});
 assert(validMonthlyPairs(migrated,rules));assert.equal(JSON.stringify(migrated.slice(0,old.length)),JSON.stringify(old),'old question order preserved');
 const completed=restoreMonthlyPairs({saved:{...saved,guesses:[1,2,3,4,5],done:true},shared:first,generated:first,legacy:old,...rules});
 assert.equal(completed.length,5);assert.deepEqual(completed,old,'old completed result retained even if cache now has a longer list');
 const snapshot={format:2,combos:migrated,guesses:[1,2,3]};
 assert.deepEqual(restoreMonthlyPairs({saved:snapshot,shared:first,generated:first,legacy:old,...rules}),migrated,'new attempt resumes its saved exact comparisons');
 const duplicated=[...first];duplicated[1]=duplicated[0];assert(!validMonthlyPairs(duplicated,rules));
 const mixed=[...first];mixed[0]={unitId:monthly[0].id,targetId:monthly[1].id};assert(!validMonthlyPairs(mixed,rules));
 assert(!validMonthlyPairs(first.slice(0,-1),rules));
}
assert(small>0&&big>0,'monthly objects can appear on either side');
assert.equal(monthlyBoardScore(400,5),400);assert.equal(monthlyBoardScore(800,10),400);assert.equal(monthlyBoardScore(1000,10),500);
assert.equal(monthlyBoardKey('2026-10',2),'2026-10-L2-v4');assert.notEqual(monthlyBoardKey('2026-10',1),monthlyBoardKey('2026-10',4),'every level has its own leaderboard');

// Levels: an even, mixed-size, deterministic split of the pack; Mega is everything; unlock chain; silhouettes; coins.
for(const n of [10,12,15]){
 const objs=new Map(Array.from({length:n},(_,i)=>['m'+i,{id:'m'+i,mm:10*(i+1)}])),pairs=Array.from({length:n},(_,i)=>({unitId:'m'+i,targetId:'b'+i}));
 const rules={monthly:[...objs.values()],objects:objs},sp=monthlyLevelSplit(pairs,rules);
 assert.deepEqual(sp,monthlyLevelSplit(pairs,rules),'same split for everyone');
 const all=[...sp[1],...sp[2],...sp[3]].sort((a,b)=>a-b);assert.deepEqual(all,pairs.map((_,i)=>i),'every item appears exactly once across levels 1-3');
 assert.deepEqual(sp[4],pairs.map((_,i)=>i),'Mega has every question');
 const sizes=[1,2,3].map(l=>sp[l].length);assert(Math.max(...sizes)-Math.min(...sizes)<=1,'levels are split evenly: '+sizes);
 for(const l of [1,2,3]){const mms=sp[l].map(i=>objs.get('m'+i).mm);assert(Math.max(...mms)-Math.min(...mms)>=(n/3-1)*10*2,'each level mixes small and large');}
}
{const st=monthlyLevelStates(null);assert.deepEqual(st,{1:'play',2:'lock',3:'lock',4:'lock'});
 assert.deepEqual(monthlyLevelStates({levels:{1:{done:true}}}),{1:'done',2:'play',3:'lock',4:'lock'});
 assert.deepEqual(monthlyLevelStates({levels:{1:{done:true},3:{done:true}}}),{1:'done',2:'play',3:'done',4:'lock'},'level 3 alone never opens Mega');
 assert.deepEqual(monthlyLevelStates({levels:{1:{done:true},2:{done:true},3:{done:true}}}),{1:'done',2:'done',3:'done',4:'play'});
 assert.equal(monthlyLockText(2),'Finish Level 1');assert.equal(monthlyLockText(3),'Finish Level 2');assert.equal(monthlyLockText(4),'Finish Level 3');
 assert.equal(monthlyLevelCoins(1,100),20);assert.equal(monthlyLevelCoins(1,0),8);assert.equal(monthlyLevelCoins(4,100),50);assert.equal(monthlyReplayCoins(19),9,'a replay pays half');
 const sp={1:[0,3],2:[1,4],3:[2,5],4:[0,1,2,3,4,5]};
 assert.deepEqual([...monthlySeenIndexes(null,sp,1)],[],'nothing is revealed before you play');
 assert.deepEqual([...monthlySeenIndexes({levels:{1:{guesses:[1]}}},sp,1)],[0],'answered questions reveal their object');
 assert.deepEqual([...monthlySeenIndexes({levels:{2:{done:true}}},sp,4)].sort(),[1,4],'Mega reveals what any level showed');}

// Run the actual cached-loader and screen-opening migration with fake storage.
const key='2026-10',legacy=api.monthlyLegacyCombosLocal(key),generated=api.monthlyCombosLocal(key);
let shared=legacy,cacheWrites=0,finishes=0,active=false,resetWrites=0;
Object.assign(ctx,{db:{},deviceId:"test",get:async()=>({exists:()=>shared!==null,val:()=>shared}),ref:(_db,p)=>p,
 runTransaction:async(path,apply)=>{if(path.startsWith('profiles/')){const current=ctx.screenApi.getProfile(),next=apply(current);if(next){ctx.screenApi.setProfile(next);resetWrites++}return {snapshot:{val:()=>next||current}}}cacheWrites++;shared=apply(shared)??shared;return {snapshot:{exists:()=>shared!==null,val:()=>shared}}},
 dailyDateStr:()=>key+'-18',monthlyContentEl:{innerHTML:''},monthlyScreenEl:{classList:{contains:()=>active}},
 soloScreenEl:{classList:{contains:()=>false}},openOverlay:()=>{active=true},
 dailyQuestionFor:q=>({...q,answer:1}),renderMonthly:()=>{},monthlyFinish:async()=>{finishes++}});
vm.runInContext('let mo=null,moMain=null,myProfile={};const monthlyKey=()=>dailyDateStr().slice(0,7);'+line('monthlyLevelGuesses')+'\n'+line('monthlyPackObject')+'\n'+fn('monthlyLoadCombos')+fn('openMonthly')+fn('monthlyOpenLevel')+
 ';globalThis.screenApi={openLevel:monthlyOpenLevel,open:openMonthly,load:monthlyLoadCombos,setSaved:s=>myProfile.monthly=s,setProfile:p=>myProfile=p,getProfile:()=>myProfile,getRun:()=>mo};',ctx);
const fresh=await ctx.screenApi.load(key,null);assert.equal(fresh.length,10);assert.equal(cacheWrites,0,'immutable old cache never overwritten');
shared=null;await ctx.screenApi.load(key,null);assert.equal(cacheWrites,1);assert.equal(shared.length,10,'new cache stores full pack');
ctx.screenApi.setProfile({coins:123,level:4,monthly:{key,done:true,guesses:[1,2,3,4,5],coins:35}});active=false;await ctx.screenApi.open();
{const run=ctx.screenApi.getRun();assert.equal(run.phase,'hub');assert.equal(run.all.length,10);assert.equal(run.split[4].length,10);assert.equal(run.split[1].length+run.split[2].length+run.split[3].length,10);
 assert.equal(finishes,0);assert.equal(resetWrites,1);assert.equal(ctx.screenApi.getProfile().coins,123);assert.equal(ctx.screenApi.getProfile().level,4);assert.equal(ctx.screenApi.getProfile().monthlyResetBackup.coins,35);}
active=false;await ctx.screenApi.open();assert.equal(resetWrites,1,'reset runs only once');
ctx.screenApi.setSaved({key,done:false,guesses:[1,2]});active=false;await ctx.screenApi.open();assert.equal(ctx.screenApi.getRun().phase,'hub');assert.equal(Object.keys(ctx.screenApi.getRun().prog).length,0,'an old-format attempt starts the levels clean');assert.equal(finishes,0);
{const run0=ctx.screenApi.getRun();const l1=run0.split[1].length;
 ctx.screenApi.setSaved({key,format:MONTHLY_FORMAT,combos:generated,done:false,levels:{1:{guesses:Array(l1).fill(1),done:false}}});active=false;await ctx.screenApi.open();assert.equal(finishes,1,'a level whose last answer was saved but never finished is finished on open');
 ctx.screenApi.setSaved({key,format:MONTHLY_FORMAT,combos:generated,done:false,levels:{1:{guesses:[1],done:false}}});active=false;await ctx.screenApi.open();
 const run=ctx.screenApi.getRun();assert.equal(finishes,1);assert.equal(run.phase,'hub');ctx.screenApi.openLevel(1);assert.equal(ctx.screenApi.getRun().phase,'question','a half-played level resumes');assert.equal(ctx.screenApi.getRun().guesses.length,1);
 ctx.screenApi.setSaved({key,format:MONTHLY_FORMAT,combos:generated,done:true,levels:{1:{guesses:Array(l1).fill(1),done:true,coins:20}}});active=false;await ctx.screenApi.open();ctx.screenApi.openLevel(1);assert.equal(ctx.screenApi.getRun().phase,'done','a finished level opens its result');}

// Exercise actual completion through the atomic attempt ledger, level by level.
let wallet={coins:0,stats:{},monthly:{key:'2026-10',best:400,bestRounds:5}};const attempts=[];
const runtime=vm.createContext({roundAccuracy,monthlyBoardScore,MONTHLY_FORMAT,monthlyBoardKey,monthlyLevelCoins,monthlyReplayCoins,Date,Math,checkName:()=>null,
 deviceId:'test',currentName:'Player',soloDisplayName:()=> 'Player',updateDailyBadge:()=>{},
 completedAttempt:record=>{attempts.push(record);wallet=applyCareerRecord(wallet,{...record,kind:'attempt',t:1});}});
vm.runInContext(';let mo=null;'+['monthlyAccs','monthlyFinish','monthlyPracticeFinish'].map(fn).join('\n')+';globalThis.runtime={setRun:r=>mo=r,getRun:()=>mo,finish:monthlyFinish,practice:monthlyPracticeFinish};',runtime);
const mk=(level,n,g)=>({key:'2026-10',level,combos:Array.from({length:10},(_,i)=>({unitId:'m'+i,targetId:'base'+i})),prog:{},questions:Array.from({length:n},(_,i)=>({unitId:'m'+i,targetId:'base'+i,answer:1})),guesses:Array(n).fill(g)});
runtime.runtime.setRun(mk(1,4,1));await runtime.runtime.finish();await runtime.runtime.finish();
assert.equal(wallet.coins,20,'a level pays once, even if the finish is retried');assert.equal(wallet.stats.monthlies||0,0);assert(!wallet.monthly.done);assert.equal(wallet.monthly.format,MONTHLY_FORMAT);assert.equal(wallet.monthly.combos.length,10);
assert.equal(attempts[0].board.path,'monthly/2026-10-L1-v4/test','level 1 writes to its own leaderboard');assert.equal(attempts[0].board.value.s,500,'leaderboard stays within existing database bounds');
runtime.runtime.setRun(mk(2,3,1));await runtime.runtime.finish();runtime.runtime.setRun(mk(3,3,1));await runtime.runtime.finish();
assert(wallet.monthly.done,'levels 1-3 finish the month');assert.equal(wallet.stats.monthlies,1);assert.deepEqual(wallet.monthlyHistory,{'2026-10':{s:100,t:1}});
runtime.runtime.setRun(mk(4,10,1));await runtime.runtime.finish();assert.equal(wallet.stats.monthlies,1,'Mega is a bonus');assert.equal(wallet.coins,20+20+20+50);assert.equal(attempts.at(-1).board.path,'monthly/2026-10-L4-v4/test');
const coinsBefore=wallet.coins;
runtime.runtime.setRun({...mk(1,4,.9),runId:'replay1'});await runtime.runtime.practice();
assert.equal(wallet.coins,coinsBefore+9,'a replay pays half the real coins (19 -> 9)');assert.equal(attempts.at(-1).board,undefined,'a replay never touches a leaderboard');
assert.deepEqual(wallet.monthlyHistory,{'2026-10':{s:100,t:1}},'replays never touch monthly history');
assert(!source.includes('MONTHLY_Q'));
console.log(`PASS: ${runs} full-pack challenge/practice runs across all 12 months and Easter dates; one monthly item per round, complete unique coverage, both sizes, deterministic starts, one-time progress reset, backups/resume preservation, rewards/history and comparable leaderboard scores.`);
console.log(counts.join(' · '));
