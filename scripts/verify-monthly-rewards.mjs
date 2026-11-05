import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { repairMonthlyRewards, monthlyLevelEarned } from '../anim/monthly-rewards.mjs';
import { MONTHLY_FORMAT } from '../anim/monthly-challenge.mjs';
const profile = { coins: 77, receipts: { a:true }, monthly:{format:MONTHLY_FORMAT,key:'2026-11',levels:{1:{done:true},2:{done:false},3:{done:true}}}, cosmetics:{owned:{boards:{mb11:true,mb99:true}}}, randomPool:{boards:{mf11:true,m11:false,november:true,paper:true},flairs:{mf11:false}} };
const before=structuredClone(profile), fixed=repairMonthlyRewards(profile,['november']);
assert.deepEqual(profile,before,'repair never mutates its input');
assert.equal(fixed.stats.mc11L1,1); assert.equal(fixed.stats.mc11L3,1); assert.equal(fixed.stats.mc11L2,undefined);
assert.equal(monthlyLevelEarned(profile,11,3),true); assert.equal(monthlyLevelEarned(profile,11,2),false);
assert.equal(fixed.cosmetics.owned.monthly.mb11,true); assert.equal(fixed.cosmetics.owned.monthly.mb99,undefined);
assert.deepEqual(fixed.randomPool.boards,{paper:true}); assert.equal(fixed.randomPool.flairs.mf11,false);
assert.equal(fixed.randomPool.reactions.m11,false); assert.equal(fixed.randomPool.backgrounds.november,true);
assert.equal(fixed.coins,77); assert.deepEqual(fixed.receipts,profile.receipts);
assert.equal(repairMonthlyRewards(fixed,['november']),fixed,'repair is idempotent');
for(const monthly of [{format:0,key:'2026-11',levels:{1:{done:true}}},{format:MONTHLY_FORMAT,key:'2026-99',levels:{1:{done:true}}},{format:MONTHLY_FORMAT,key:'2026-11',done:true}]) {
 const p={monthly}; assert.equal(repairMonthlyRewards(p),p); assert.equal(monthlyLevelEarned(p,11,1),false);
}
assert.equal(monthlyLevelEarned({stats:{mc02L4:1}},2,4),true);
// Failed manifests/images must reject and allow a fresh attempt, rather than
// permanently caching a failed promise or pretending missing artwork is ready.
let attempts=0,failImage=true;
const runtime={window:{},fetch:async()=>{attempts++;return attempts===1?{ok:false}:{ok:true,json:async()=>({sample:{w:10,h:10}})}},Image:class {set src(value){queueMicrotask(()=>failImage?this.onerror():this.onload())}}};
vm.runInNewContext(fs.readFileSync(new URL('../monthly/motion.js',import.meta.url),'utf8'),runtime);
await assert.rejects(runtime.window.MM.ready(),/unavailable/);
await assert.rejects(runtime.window.MM.ready(),/sample/);
failImage=false;await runtime.window.MM.ready();assert.equal(attempts,3);
await runtime.window.MM.ready();assert.equal(attempts,3,'successful preload stays cached');
for(const month of [7,9])for(const count of [1,43,100,300])assert(runtime.window.MM.boardSettle(month,count)<7600,'long writing fits the animation');
console.log('PASS: monthly reward compatibility, eligibility, ownership and Random categories.');
