import {applyCareerRecord} from '../anim/career-ledger.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createMonthlyPairs,validMonthlyPairs,restoreMonthlyPairs,monthlyBoardScore,MONTHLY_FORMAT,monthlyBoardKey,resetMonthlyProgress} from '../anim/monthly-challenge.mjs';
import {roundAccuracy} from '../anim/accuracy.mjs';
const source=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const fn=name=>{let i=source.indexOf('  function '+name+'(');if(i<0)i=source.indexOf('  async function '+name+'(');assert(i>=0,name);return source.slice(i,source.indexOf('\n  }',i)+4)};
const array=name=>{const m=source.match(new RegExp('const '+name+' = (\\[[\\s\\S]*?\\n  \\]);'));assert(m,name);return 'const '+name+' = '+m[1]+';'};
const line=name=>source.slice(source.indexOf('  const '+name+' ='),source.indexOf('\n',source.indexOf('  const '+name+' =')));
const holidayStart=source.indexOf('  const HOLIDAY_OBJECTS ='),holidayEnd=source.indexOf(';',holidayStart)+1;
const ctx=vm.createContext({createMonthlyPairs,validMonthlyPairs,restoreMonthlyPairs,monthlyBoardScore,MONTHLY_FORMAT,monthlyBoardKey,resetMonthlyProgress});
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

// Run the actual cached-loader and screen-opening migration with fake storage.
const key='2026-10',legacy=api.monthlyLegacyCombosLocal(key),generated=api.monthlyCombosLocal(key);
let shared=legacy,cacheWrites=0,finishes=0,active=false,resetWrites=0;
Object.assign(ctx,{db:{},deviceId:"test",get:async()=>({exists:()=>shared!==null,val:()=>shared}),ref:(_db,p)=>p,
 runTransaction:async(path,apply)=>{if(path.startsWith('profiles/')){const current=ctx.screenApi.getProfile(),next=apply(current);if(next){ctx.screenApi.setProfile(next);resetWrites++}return {snapshot:{val:()=>next||current}}}cacheWrites++;shared=apply(shared)??shared;return {snapshot:{exists:()=>shared!==null,val:()=>shared}}},
 dailyDateStr:()=>key+'-18',monthlyContentEl:{innerHTML:''},monthlyScreenEl:{classList:{contains:()=>active}},
 soloScreenEl:{classList:{contains:()=>false}},openOverlay:()=>{active=true},
 dailyQuestionFor:q=>({...q,answer:1}),renderMonthly:()=>{},monthlyFinish:async()=>{finishes++}});
vm.runInContext('let mo=null,moMain=null,myProfile={};const monthlyKey=()=>dailyDateStr().slice(0,7);'+fn('monthlyLoadCombos')+fn('openMonthly')+
 ';globalThis.screenApi={open:openMonthly,load:monthlyLoadCombos,setSaved:s=>myProfile.monthly=s,setProfile:p=>myProfile=p,getProfile:()=>myProfile,getRun:()=>mo};',ctx);
const fresh=await ctx.screenApi.load(key,null);assert.equal(fresh.length,10);assert.equal(cacheWrites,0,'immutable old cache never overwritten');
shared=null;await ctx.screenApi.load(key,null);assert.equal(cacheWrites,1);assert.equal(shared.length,10,'new cache stores full pack');
ctx.screenApi.setProfile({coins:123,level:4,monthly:{key,done:true,guesses:[1,2,3,4,5],coins:35}});active=false;await ctx.screenApi.open();
assert.equal(ctx.screenApi.getRun().questions.length,10);assert.equal(ctx.screenApi.getRun().phase,'intro');assert.equal(finishes,0);assert.equal(resetWrites,1);assert.equal(ctx.screenApi.getProfile().coins,123);assert.equal(ctx.screenApi.getProfile().level,4);assert.equal(ctx.screenApi.getProfile().monthlyResetBackup.coins,35);active=false;await ctx.screenApi.open();assert.equal(resetWrites,1,'reset runs only once');
ctx.screenApi.setSaved({key,done:false,guesses:[1,2]});active=false;await ctx.screenApi.open();assert.equal(ctx.screenApi.getRun().questions.length,10);assert.equal(ctx.screenApi.getRun().guesses.length,0);assert.equal(finishes,0);
ctx.screenApi.setSaved({key,format:MONTHLY_FORMAT,combos:generated,done:false,guesses:Array(10).fill(1)});active=false;await ctx.screenApi.open();assert.equal(finishes,1,'finish resumes at actual pack length');

// Exercise actual completion through the atomic attempt ledger.
let wallet={coins:0,stats:{},monthly:{key:'2026-10',best:400,bestRounds:5}};const attempts=[];
const runtime=vm.createContext({roundAccuracy,monthlyBoardScore,MONTHLY_FORMAT,monthlyBoardKey,Date,Math,checkName:()=>null,
 deviceId:'test',currentName:'Player',soloDisplayName:()=> 'Player',updateDailyBadge:()=>{},
 completedAttempt:record=>{attempts.push(record);wallet=applyCareerRecord(wallet,{...record,kind:'attempt',t:1});}});
vm.runInContext('const MONTHLY_BASE_COINS=20,MONTHLY_ACC_COINS=30;let mo=null;'+['monthlyAccs','monthlyFinish','monthlyPracticeFinish'].map(fn).join('\n')+';globalThis.runtime={setRun:r=>mo=r,finish:monthlyFinish,practice:monthlyPracticeFinish};',runtime);
const questions=Array.from({length:10},(_,i)=>({unitId:'m'+i,targetId:'base'+i,answer:1}));
runtime.runtime.setRun({key:'2026-10',questions,guesses:Array(10).fill(1)});await runtime.runtime.finish();await runtime.runtime.finish();
assert.equal(wallet.coins,50);assert.equal(wallet.stats.monthlies,1);assert.equal(wallet.monthly.format,MONTHLY_FORMAT);assert.equal(wallet.monthly.combos.length,10);assert(wallet.monthly.done);
assert.deepEqual(wallet.monthlyHistory,{'2026-10':{s:100,t:1}},'the real finish (not the idempotent retry) records this month in history');
assert.equal(attempts[0].board.value.s,500,'leaderboard stays within existing database bounds');
runtime.runtime.setRun({runId:'practice1',key:'2026-10',questions,guesses:Array(10).fill(.7)});await runtime.runtime.practice();assert.equal(wallet.coins,50);assert.equal(wallet.monthly.best,400);
runtime.runtime.setRun({runId:'practice2',key:'2026-10',questions,guesses:Array(10).fill(.9)});await runtime.runtime.practice();assert.equal(wallet.monthly.bestRounds,10);assert.equal(wallet.monthly.best,900);
assert.deepEqual(wallet.monthlyHistory,{'2026-10':{s:100,t:1}},'practice rounds never touch monthly history');
assert(!source.includes('MONTHLY_Q'));
console.log(`PASS: ${runs} full-pack challenge/practice runs across all 12 months and Easter dates; one monthly item per round, complete unique coverage, both sizes, deterministic starts, one-time progress reset, backups/resume preservation, rewards/history and comparable leaderboard scores.`);
console.log(counts.join(' · '));
