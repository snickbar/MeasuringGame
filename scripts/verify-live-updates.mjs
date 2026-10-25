import assert from 'node:assert/strict';
import {createLiveUpdater,validateUpdate,UPDATE_SOURCES} from '../anim/live-updates.mjs';
const old='1.0.20261025000000-aaaaaaa',version='1.0.20261025000001-bbbbbbb';
const manifest={version,url:'https://github.com/snickbar/MeasuringGame/releases/download/test/bundle.zip',checksum:'a'.repeat(64)};
const response=v=>({ok:true,json:async()=>v});
function setup(fetchManifest,overrides={}){
 const calls=[];const updater={list:async()=>({bundles:[]}),download:async v=>{calls.push(['download',v]);return {id:'new'};},next:async v=>calls.push(['next',v]),current:async()=>({bundle:{id:'running'}}),delete:async()=>{},...overrides};
 return {calls,client:createLiveUpdater({updater,fetchManifest,timeoutMs:10})};
}
assert(UPDATE_SOURCES[0].includes('raw.githubusercontent.com'));
for(const bad of [{...manifest,checksum:''},{...manifest,version:undefined},{...manifest,url:'https://untrusted.example/bundle.zip'}])assert.throws(()=>validateUpdate(bad));
{
 const {client,calls}=setup(async url=>{assert(url.startsWith(UPDATE_SOURCES[0]));return response(manifest);});
 assert.equal((await client.check(old)).state,'downloaded');assert.equal(calls[0][1].checksum,manifest.checksum);assert.deepEqual(calls[1],['next',{id:'new'}]);
 assert.equal((await client.check(version)).state,'current');
}
{
 let fetches=0;const {client}=setup(async()=>++fetches===1?{ok:false,status:509}:response(manifest));
 assert.equal((await client.check(old)).state,'downloaded');assert.equal(fetches,2);
}
{
 let downloads=0;const {client}=setup(async()=>response(manifest),{download:async()=>{if(++downloads===1)throw Error('Primary download offline');return {id:'backup'};}});
 assert.equal((await client.check(old)).id,'backup');assert.equal(downloads,2);
}
{
 const {client,calls}=setup(async()=>response(manifest),{list:async()=>({bundles:[{id:'waiting',version,status:'pending'}]})});
 assert.equal((await client.check(old)).state,'ready');assert.equal(calls.filter(c=>c[0]==='download').length,0);assert.equal(calls[0][1].id,'waiting');
}
{
 const {client,calls}=setup(async()=>response(manifest),{list:async()=>({bundles:[{id:'bad',version,status:'error'}]})});
 assert.equal((await client.check(old)).state,'downloaded');assert.equal(calls.filter(c=>c[0]==='download').length,1);
}
{
 const {client}=setup(async()=>({ok:true,json:async()=>({})}));assert.equal((await client.check(old)).state,'error');
 const {client:offline}=setup(async(_url,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('Timed out')))));
 assert.equal((await offline.check(old)).state,'error');
}
{
 const {client,calls}=setup(async()=>response(manifest));const a=client.check(old),b=client.check(old);assert.equal(a,b);await Promise.all([a,b]);assert.equal(calls.filter(c=>c[0]==='download').length,1);
}
console.log('PASS: GitHub primary, host/download fallback, manifest validation, checksum forwarding, pending/rejected bundles, timeout, and concurrent checks.');
