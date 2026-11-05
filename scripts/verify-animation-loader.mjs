import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('  function loadAnimModule() {'),end=html.indexOf('\n  // The two objects',start);
const source=html.slice(start,end).replace('import(url)','fakeImport(url)');
function fixture(load,native=false){
 const timers=new Set(),urls=[],warnings=[];
 const context={isNativeApp:native,fakeImport:url=>{urls.push(url);return load(url)},Date,setTimeout:fn=>{timers.add(fn);return fn},clearTimeout:fn=>timers.delete(fn),console:{warn:(...args)=>warnings.push(args)}};
 vm.createContext(context);vm.runInContext('let animModulePromise=null,animModuleAttempts=0;'+source,context);
 return{load:()=>context.loadAnimModule(),timers,urls,warnings};
}
for(const native of [false,true]){
 let attempts=0;const mod={formatCount:v=>String(v)},f=fixture(()=>++attempts===1?Promise.reject(Error('offline')):Promise.resolve(mod),native);
 assert.equal(await f.load(),null);assert.equal(await f.load(),mod);assert.equal(await f.load(),mod);assert.equal(attempts,2);
 assert.equal(f.urls[0],'./anim/stack-anim.js');assert.equal(f.urls[1].includes('?retry='),!native);assert.equal(f.timers.size,0);
}
let release,attempts=0;const mod={ready:true},f=fixture(()=>++attempts===1?new Promise(resolve=>{release=resolve}):Promise.resolve(mod));
const first=f.load();assert.equal(f.load(),first,'concurrent calls share one attempt');
for(const timeout of [...f.timers])timeout();assert.equal(await first,null);
assert.equal(await f.load(),mod,'a timeout permits another attempt');release({obsolete:true});await Promise.resolve();
assert.equal(await f.load(),mod,'late old completion cannot replace recovered module');assert.equal(attempts,2);
console.log('PASS: real reveal loader retries failures/timeouts, shares pending/successful loads, ignores late attempts and preserves native URLs.');
