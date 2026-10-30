import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {hlSurvivalOutcome as result,hlThemeDue} from '../anim/high-low-survival.mjs';
import {applyCareerRecord} from '../anim/career-ledger.mjs';
let room={hlLives:3,hlSurvived:0};
for(let i=1;i<=3;i++){const r=result(room,true);room={...room,...r};assert.equal(r.hlShield,i===3);assert.equal(r.hlShieldCharge,i===3?0:i);}
assert.equal(room.milestone,3);assert.equal(room.earned,true);
room={...room,...result(room,true)};assert.equal(room.hlShield,true);assert.equal(room.hlShieldCharge,0,'No shields stockpiled');
assert.equal(hlThemeDue(room.hlSurvived),true,'Fifth survival is themed');
const saved=result(room,false,true);assert.equal(saved.saved,true);assert.equal(saved.hlLives,3);assert.equal(saved.hlSurvived,4);assert.equal(saved.hlShield,false);assert.equal(saved.hlThemeWins,0);assert(hlThemeDue(saved.hlSurvived),'Retry themed round after save');
const lost=result({...room,...saved},false,true);assert.equal(lost.hlLives,2);assert.equal(lost.hlShieldCharge,0);assert.equal(lost.hlThemeWins,0);
const themed=result({...room,...lost},true,true);assert.equal(themed.hlSurvived,5);assert.equal(themed.hlThemeWins,1);assert.equal(themed.milestone,5);assert(!hlThemeDue(5));
for(const n of [4,9,14,19])assert(hlThemeDue(n));for(const n of [0,1,3,5,8,10])assert(!hlThemeDue(n));
const kept=result({hlLives:1,hlShieldCharge:2},false);assert.equal(kept.hlLives,0);assert.equal(kept.hlShieldCharge,2,'A miss keeps progress toward the shield');const gap=result({hlLives:3,hlShieldCharge:2},false);const third=result({...gap,hlSurvived:3},true);assert.equal(third.hlShield,true,'Three survivals earn a shield even with a miss between');
const old=result({settings:{lives:3}},false);assert.equal(old.hlLives,2,'Older rooms default safely');
const record={kind:'attempt',mode:'hlsurvival',key:'hl-theme-test',survived:5,themedWins:1,t:1};
let profile=applyCareerRecord({coins:0,stats:{}},record);assert.equal(profile.coins,12);assert.deepEqual(applyCareerRecord(profile,record),profile,'Bonus not paid twice');
assert.equal(applyCareerRecord({coins:0,stats:{}},{...record,themedWins:999}).coins,20,'Bonus bounded by wins');
const source=fs.readFileSync('index.html','utf8');
const offSource=source.slice(source.indexOf('  function hlOffInfo('),source.indexOf('  // High/Low Survival role badge:'));
const offContext=vm.createContext({});vm.runInContext(offSource,offContext);
assert.equal(vm.runInContext('hlOffInfo("high",1.779,1.78).ok',offContext),false,'Rounding to 0% must not make a wrong-side HIGH pick correct');
assert.equal(vm.runInContext('hlOffInfo("low",1.781,1.78).ok',offContext),false,'Wrong-side LOW stays wrong even below 1% off');
assert.equal(vm.runInContext('hlOffInfo("low",1.78,1.78).text',offContext),'Spot on');
assert(source.includes('hlThemeId: hlState.themeId'));assert(source.includes('theme: hlState.themeId'));assert(source.includes('svCrackHeart("shield")'));
// Run the actual host round generator with isolated room/network adapters.
const start=source.slice(source.indexOf('  async function startRound(roomCode, roundNum) {'),source.indexOf('  function checkQuestionAdvance('));
const captured=[],themes=[],ctx={roomState:{settings:{mode:'teamworlds',variant:'hl'},hlSurvived:4,players:{one:{},two:{}}},currentSettings:{},
 isHlSettings:()=>true,hlThemeDue,survivalPickTheme:s=>s.themeId||'food',survivalNextQuestion:s=>{themes.push(s.themeId);return {answer:5,prompt:'Test'};},
 crypto:{randomUUID:()=> 'test'},nowMs:()=>100,TEAM_ROUND_CAP_MS:100000,ref:()=>({}),db:{},update:async(_,v)=>captured.push(v),console:{log(){}},scheduleBotGuesses(){}};
vm.createContext(ctx);vm.runInContext(start,ctx);
await vm.runInContext('startRound("test",5)',ctx);assert.equal(captured.at(-1).currentQuestion.theme,'food');
ctx.roomState.hlThemeId='critters';await vm.runInContext('startRound("test",6)',ctx);assert.equal(captured.at(-1).hlThemeId,'critters','Failed themed attempt keeps category');
ctx.roomState.hlSurvived=5;await vm.runInContext('startRound("test",7)',ctx);assert.equal(captured.at(-1).currentQuestion.theme,'','Next question returns to normal');
console.log('High/Low shield charging, save/loss, milestones, theme cadence/retries and idempotent bonus rewards passed.');
