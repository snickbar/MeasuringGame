import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../monthly/motion.js',import.meta.url),'utf8');
const manifest=JSON.parse(fs.readFileSync(new URL('../monthly/art-manifest.json',import.meta.url),'utf8'));
function fixture(){
 const requested=[],failed=new Set(),held=new Set(),timers=new Set();let fetches=0;
 const context={window:{},AbortController,setTimeout:fn=>{timers.add(fn);return fn},clearTimeout:fn=>timers.delete(fn),fetch:async()=>{fetches++;return{ok:true,json:async()=>manifest}},
 Image:class{set src(url){const name=url.split('/').at(-1).replace('.webp','');requested.push(name);if(!held.has(name))queueMicrotask(()=>failed.has(name)?this.onerror?.():this.onload?.())}}};
 vm.runInNewContext(source,context);return{mm:context.window.MM,requested,failed,held,timers,fetches:()=>fetches};
}
const f=fixture();f.failed.add('01-flute-glass');
await f.mm.ready('r11');assert.deepEqual(f.requested.sort(),['04-gold-sparkle','wishbone']);
await assert.rejects(f.mm.ready('r1'),/01-flute-glass/);
await f.mm.ready('r11');assert.equal(f.fetches(),1,'unrelated failure does not poison metadata or another effect');
f.failed.clear();await f.mm.ready('r1');assert.equal(f.requested.filter(n=>n==='01-flute-glass').length,2,'failed image can retry');
assert.equal(f.requested.filter(n=>n==='04-gold-sparkle').length,1,'shared artwork loads once');
await assert.rejects(f.mm.ready('r99'),/Unknown/);
const concurrent=fixture();await Promise.all([concurrent.mm.ready('r6'),concurrent.mm.ready('r7')]);
assert.equal(concurrent.fetches(),1);assert.equal(concurrent.requested.filter(n=>n==='04-gold-sparkle').length,1);
const slow=fixture();slow.held.add('01-flute-glass');const pending=slow.mm.ready('r1');
const rejected=assert.rejects(pending,/timed out/);await slow.mm.ready('r11');
assert(slow.requested.includes('wishbone'),'another effect finishes while an unrelated one is stalled');
for(const timeout of [...slow.timers])timeout();await rejected;
slow.held.clear();await slow.mm.ready('r1');assert.equal(slow.fetches(),1);
// Cover an unresolved fetch and a response whose body stops arriving.
for(const stalledBody of [false,true]){
 let attempts=0,late,signal;const timers=new Set();
 const runtime={window:{},AbortController,setTimeout:fn=>{timers.add(fn);return fn},clearTimeout:fn=>timers.delete(fn),
  fetch:async(url,options)=>{attempts++;signal=options.signal;if(attempts===1){const stalled=new Promise(resolve=>{late=resolve});return stalledBody?{ok:true,json:()=>stalled}:stalled}return{ok:true,json:async()=>manifest}},
  Image:class{set src(value){queueMicrotask(()=>this.onload?.())}}};
 vm.runInNewContext(source,runtime);const loading=runtime.window.MM.ready('r11'),rejected=assert.rejects(loading,/manifest timed out/);
 await Promise.resolve();await Promise.resolve();const oldSignal=signal;
 for(const timeout of [...timers])timeout();await rejected;assert(oldSignal.aborted);
 await runtime.window.MM.ready('r11');assert.equal(attempts,2,'stalled metadata retries');
 late(stalledBody?{}:{ok:true,json:async()=>({})});await Promise.resolve();await Promise.resolve();
 await runtime.window.MM.ready('r6');assert.equal(attempts,2,'late old metadata cannot replace recovered metadata');
}
console.log('PASS: per-effect monthly artwork, unrelated failures/stalls isolated, shared caching, concurrency, timeout and retry.');
