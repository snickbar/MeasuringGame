import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { POWERUPS, bufferedGuess, quickEligible, availablePowerups, eliminationChoices, replacementPairs, debitPowerup, settlePowerup, powerupPlacement } from '../anim/powerups.mjs';
import { createPowerupController } from '../anim/powerup-ui.mjs';

for (const [raw, expected] of [[85,95],[95,100],[100,100],[120,110],[0,10],[200,190]]) {
  assert.equal(bufferedGuess(raw,100,true),expected);
  assert.equal(bufferedGuess(raw,100,false),raw);
}
for (let answer = .01; answer < 1e10; answer *= 2.37) for (const ratio of [.1,.85,.99,1,1.01,1.2,10]) {
  const raw = answer * ratio, improved = bufferedGuess(raw,answer,true);
  assert(Math.abs(improved-answer) <= Math.abs(raw-answer) + 1e-9);
  assert(Math.abs(improved-raw) <= answer*.1 + answer*1e-12);
  if (Math.abs(raw-answer) <= answer*.1) assert.equal(improved,answer);
}
const solo = { settings:{solo:true}, players:{me:{}, bot:{isBot:true}} };
const allActions=['small','big','both','buffer','reveal'];
assert.deepEqual(powerupPlacement(allActions,55,44,72),{header:['buffer'],gap:['reveal'],sidebar:['small','big','both']});
assert.deepEqual(powerupPlacement(allActions,110,44,72),{header:['buffer','reveal'],gap:[],sidebar:['small','big','both']});
for(const h of [0,20,47,48,50,99,100,150])for(const w of [0,30,43,44,56]) {
 const p=powerupPlacement(allActions,h,w,72);
 assert.equal(new Set([...p.header,...p.gap,...p.sidebar]).size,5);
 assert(p.header.length===0||p.header.length*44+(p.header.length-1)*3<=h);
 assert(!p.gap.length||w>=44);
}
assert(quickEligible(solo,'me',true));
for (const room of [{...solo,settings:{}},{...solo,players:{...solo.players,human:{}}},{}]) assert(!quickEligible(room,'me',true));
assert(!quickEligible(solo,'me',false));
assert.deepEqual(availablePowerups({},'question'),['small','big','both','buffer','reveal']);
assert.deepEqual(availablePowerups({},'question',true),['buffer']);
assert.deepEqual(availablePowerups({},'answers'),['fifty']);
assert.deepEqual(availablePowerups({powerups:{used:{reroll:true,buffer:true,reveal:true}}},'question'),[]);
for (const phase of ['animation','reveal','summary','final']) assert.deepEqual(availablePowerups({},phase),[]);
for (let n=1;n<=10;n++) {
  const answers = [{playerId:'me',value:90},{playerId:'truth',value:100,truth:true},...Array.from({length:n},(_,i)=>({playerId:'b'+i,value:i}))];
  const removed = eliminationChoices(answers,'me',100,()=>.2);
  assert(!removed.includes('truth')); assert(!removed.includes('me')); assert(n+1-removed.length>=2);
  assert.equal(removed.length,Math.min(Math.floor((n+1)/2),n-1));
}
assert.deepEqual(eliminationChoices([{playerId:'a',value:10},{playerId:'b',value:20},{playerId:'c',value:30}],'me',100),[]);
const tiedTruth=[{playerId:'a',value:100},{playerId:'b',value:100},{playerId:'c',value:30},{playerId:'d',value:40}];
const duplicateRemoved=eliminationChoices(tiedTruth,'me',100);
assert.equal(duplicateRemoved.length,1);assert(['c','d'].includes(duplicateRemoved[0]));
const objects = [1,2,3,4,5].map(n=>({id:String(n),mm:n}));
const q={unitId:'2',targetId:'4'};
for (const kind of ['small','big','both']) for(const [u,t] of replacementPairs(q,kind,objects)) {
  assert(u.mm<t.mm);
  assert.equal(u.id===q.unitId,kind==='big'); assert.equal(t.id===q.targetId,kind==='small');
}
assert.deepEqual(replacementPairs(q,'small',objects,()=>false),[]);
const receipt={cost:10,at:1,mode:'quick',room:'TEST'};
const profile={coins:20,unlockedAvatars:{first:true}};
const charged=debitPowerup(profile,'one',receipt);
assert.equal(charged.coins,10);assert.deepEqual(charged.unlockedAvatars,profile.unlockedAvatars);
assert.equal(profile.coins,20); assert.equal(debitPowerup(charged,'one',receipt),undefined);
assert.equal(debitPowerup({coins:9},'one',receipt),undefined);
const applied=settlePowerup(charged,'one',true);assert.equal(applied.coins,10);assert.equal(settlePowerup(applied,'one',false),undefined);
const refunded=settlePowerup(charged,'one',false);assert.equal(refunded.coins,20);assert.equal(settlePowerup(refunded,'one',false),undefined);
let wallet = {coins:10000,powerupReceipts:{pending:{...receipt,status:'charged'}}};
for(let i=0;i<100;i++) wallet=settlePowerup(debitPowerup(wallet,String(i),{...receipt,at:i}),String(i),true);
assert(wallet.powerupReceipts.pending);assert(Object.keys(wallet.powerupReceipts).length<=65);

// Exercise the actual host scorer: the buffer must change winners and rewards,
// while raw guesses survive in both the room and the Second Chance deck.
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const getFunction=name=>{
  let start=html.indexOf('  function '+name+'(');
  if(start<0)start=html.indexOf('  async function '+name+'(');
  assert(start>=0,name);const end=html.indexOf('\n  }',start);assert(end>start);
  return html.slice(start,end+4);
};
let updates;
const room={...solo,currentQuestion:{answer:100,prompt:'Test',powerups:{owner:'me',used:{buffer:true}}},settings:{solo:true},players:{me:{name:'Me'},bot:{name:'Bot',isBot:true}}};
const sandbox={bufferedGuess,roomState:room,currentSettings:room.settings,console,nowMs:()=>1000,
  questionObjects:()=>null,loadAnimModule:async()=>null,db:{},ref:(_,path)=>path,
  update:async(_,v)=>{updates=v},scheduleHostDeadline:()=>{},checkRevealAdvance:()=>{},
};
vm.createContext(sandbox);
sandbox.console={log:()=>{},warn:console.warn,error:console.error};
vm.runInContext([getFunction('effectiveGuess'),getFunction('finishRoundScoring'),'globalThis.score=finishRoundScoring;'].join('\n'),sandbox);
await sandbox.score('TEST',['me','bot'],{me:95,bot:97},{});
assert(updates);const mine=updates.revealOrder.find(e=>e.playerId==='me'),bot=updates.revealOrder.find(e=>e.playerId==='bot');
assert.equal(mine.guess,95);assert.equal(mine.effectiveGuess,100);assert.equal(mine.isClosest,true);assert.equal(mine.isPerfect,true);assert.equal(mine.basePoints,5);assert.equal(mine.accuracyPercent,100);assert.equal(bot.effectiveGuess,97);assert(!bot.isClosest);
const answersSource=html.slice(html.indexOf('  function renderAnswersScreen('),html.indexOf('  // Shrink the answer papers'));
assert(!answersSource.includes('effectiveGuess'));assert(!answersSource.includes('bufferResultNote'));assert(!answersSource.includes('bufferUsed'));
const worldsSource=html.slice(html.indexOf('  function renderWorlds('),html.indexOf('  // ==================== Monthly'));
assert(!worldsSource.includes('roundAccuracy(wl.guesses[k] / q.answer)'));
assert(!worldsSource.includes('roundAccuracy(g / q.answer)'));
const dailySource=html.slice(html.indexOf('  async function dailyRunReveal('),html.indexOf('  // ==================== Worlds:'));
assert(!dailySource.includes('effectiveGuess'));assert(!dailySource.includes('bufferResultNote'));
assert(html.includes('roundAccuracy(effectiveGuess(sv.q, g, deviceId) / sv.q.answer)'));
// Worlds rewards, stars, and history must all agree with its result card.
const history=[],world={questions:Array.from({length:5},()=>({unitId:'ant',targetId:'canoe',answer:100,powerups:{owner:'me',used:{buffer:true}}})),guesses:[95,95,95,95,95],wi:0,level:1};
Object.assign(sandbox,{wl:world,deviceId:'me',WORLDS:[{id:'tiny'}],WORLD_STAR_COINS:5,WORLD_Q:5,
  roundAccuracy:r=>Math.max(0,100-Math.abs(r-1)*100),worldStarsFor:avg=>avg>92?3:avg>80?2:avg>60?1:0,
  worldLevelStars:()=>0,set:async()=>{},addCoins:async coins=>{sandbox.worldCoins=coins},bumpStats:()=>{},appendRoundHistory:async r=>history.push(r),
});
vm.runInContext(getFunction('worldFinish')+';globalThis.worldFinish=worldFinish;',sandbox);
await sandbox.worldFinish();assert.equal(world.stars,3);assert.equal(sandbox.worldCoins,15);assert(history.every(h=>h.r===1));assert(world.guesses.every(g=>g===95));
for(const p of Object.values(POWERUPS))assert(fs.existsSync(new URL('../icons/powerups/'+p.icon+'.png',import.meta.url)));
// Reconnect recovery uses atomic cancellation markers, so a late room write
// cannot give away an effect after another tab refunded its receipt.
globalThis.document={getElementById:()=>({}),createElement:()=>({setAttribute:()=>{}}),body:{append:()=>{}},addEventListener:()=>{}};
let recoveredWallet={coins:0,powerupReceipts:{lost:{...receipt,status:'charged',at:Date.now()-120000},used:{...receipt,status:'charged',at:Date.now()-120000},local:{...receipt,room:undefined,mode:'worlds',status:'charged',at:Date.now()-120000}}};
let recoveredRoom={powerupReceipts:{used:true}};
const controller=createPowerupController({context:()=>null,
  profileTransaction:async(_,fn)=>{const next=fn(recoveredWallet);if(next)recoveredWallet=next;return {committed:!!next,snapshot:{val:()=>recoveredWallet}}},
  roomTransaction:async(_,fn)=>{const next=fn(recoveredRoom);if(next)recoveredRoom=next;return {committed:!!next,snapshot:{val:()=>recoveredRoom}}},
});
await controller.recover(recoveredWallet,'me');
assert.equal(recoveredWallet.coins,20);assert.equal(recoveredWallet.powerupReceipts.used.status,'applied');assert.equal(recoveredRoom.powerupReceipts.lost,'refunded');
await controller.recover(recoveredWallet,'me');assert.equal(recoveredWallet.coins,20);
delete globalThis.document;
console.log('PASS: buffer boundaries, mode/phase eligibility, reroll invariants, 50/50 truth preservation, idempotent coins/refunds, receipt retention, actual host winner/perfect/reward scoring, raw Second Chance values, local-mode scoring and icons.');
