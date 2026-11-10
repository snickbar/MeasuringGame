import assert from 'node:assert/strict';
import {createLiveUpdater,validateUpdate,validateManifest,UPDATE_SOURCES} from '../anim/live-updates.mjs';
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
 let fetches=0;const {client}=setup(async()=>response(++fetches===1?manifest:{...manifest,version:old}),{download:async()=>{throw Error('Download unavailable');}});
 assert.equal((await client.check(old)).state,'error','Old fallback cannot hide a failed newer download');
}
{
 const {client}=setup(async()=>response(manifest),{current:async()=>{throw Error('Cleanup unavailable');}});
 assert.equal((await client.check(old)).state,'downloaded','Cleanup failure cannot discard a successfully queued update');
}
{
 const {client,calls}=setup(async()=>response(manifest));const a=client.check(old),b=client.check(old);assert.equal(a,b);await Promise.all([a,b]);assert.equal(calls.filter(c=>c[0]==='download').length,1);
}
{
 // Partial updates: file list is used when valid, and any problem falls back to the full ZIP.
 const H='https://github.com/snickbar/MeasuringGame/releases/download/blobs-x-1/',h=c=>c.repeat(64);
 const list={version,files:[{file_name:'index.html',file_hash:h('a'),download_url:H+h('a')},{file_name:'icons/a.webp',file_hash:h('B'),download_url:H+h('B')}]};
 const withList={...manifest,manifestUrl:'https://raw.githubusercontent.com/snickbar/MeasuringGame/app-updates/manifest.json'};
 const route=async url=>response(url.includes('manifest.json')?list:withList);
 const {client,calls}=setup(route);
 assert.equal((await client.check(old)).state,'downloaded');
 const sent=calls[0][1];assert.equal(sent.manifest.length,2);assert.equal(sent.manifest[1].file_hash,h('b'));assert.equal(sent.checksum,manifest.checksum);assert.equal(calls.filter(c=>c[0]==='download').length,1);
 const {client:c2,calls:k2}=setup(async url=>url.includes('manifest.json')?{ok:false,status:404}:response(withList));
 assert.equal((await c2.check(old)).state,'downloaded');assert.equal(k2[0][1].manifest,undefined,'missing file list falls back to ZIP');
 const {client:c3,calls:k3}=setup(route,{download:async v=>{k3.push(['download',v]);if(v.manifest)throw Error('plugin rejected list');return {id:'zip'};}});
 assert.equal((await c3.check(old)).id,'zip');assert.equal(k3.filter(c=>c[0]==='download').length,2);assert.equal(k3[1][1].manifest,undefined);
 const {client:c4,calls:k4}=setup(async url=>response(url.includes('manifest.json')?{...list,version:old}:withList));
 assert.equal((await c4.check(old)).state,'downloaded');assert.equal(k4[0][1].manifest,undefined,'list for another version is ignored');
 assert.throws(()=>validateUpdate({...withList,manifestUrl:'https://untrusted.example/m.json'}));
 const bad=f=>validateManifest({version,files:[list.files[0],f]},version);
 for(const f of [{...list.files[1],file_name:'../x'},{...list.files[1],file_name:'/x'},{...list.files[1],file_name:'a\\b'},{...list.files[1],file_name:'index.html'},{...list.files[1],file_name:'a.js.br'},{...list.files[1],file_hash:'zz'},{...list.files[1],download_url:'https://untrusted.example/x'}])assert.throws(()=>bad(f),undefined,JSON.stringify(f));
 assert.throws(()=>validateManifest({version,files:[list.files[1]]},version),/index/);
}
console.log('PASS: GitHub primary, host/download fallback, manifest validation, checksum forwarding, pending/rejected bundles, timeout, and concurrent checks, and partial-update file lists with ZIP fallback.');
