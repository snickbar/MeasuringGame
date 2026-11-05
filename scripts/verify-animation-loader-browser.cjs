const fs=require('fs'),assert=require('assert/strict'),{runFixture}=require('./browser-fixture.cjs');
const html=fs.readFileSync('index.html','utf8'),start=html.indexOf('  function loadAnimModule() {'),end=html.indexOf('\n  // The two objects',start),loader=html.slice(start,end);
let brokenPath=null,failures=0;
const modules={};for(const path of ['/anim/stack-anim.js','/anim/orient-data.js'])Object.defineProperty(modules,path,{get(){if(brokenPath===path&&failures-->0)return{status:503,body:'Temporary outage'};return fs.readFileSync('.'+path,'utf8')}});
runFixture({html:'<!doctype html><div>Animation loader recovery</div>',modules,widths:[390,391],out:'output/animation-loader-recovery',check:async({width,evaluate})=>{
 brokenPath=width===390?'/anim/stack-anim.js':'/anim/orient-data.js';failures=1;
 await evaluate(`(()=>{let animModulePromise=null,animModuleAttempts=0;const isNativeApp=false;${loader};window.__loadEngine=loadAnimModule})()`);
 assert.equal(await evaluate('__loadEngine().then(mod=>!!mod)'),false,'first HTTP 503 uses fallback');
 assert.equal(await evaluate('__loadEngine().then(mod=>typeof mod?.createStackAnimation)'), 'function','same page recovers after the connection returns');
 const urls=await evaluate('performance.getEntriesByType("resource").map(r=>r.name)');
 assert(urls.some(url=>url.includes('stack-anim.js?retry=')));assert(urls.some(url=>url.includes('orient-data.js?retry=')),'dependencies recover too');
 assert.equal(await evaluate('__loadEngine().then(mod=>mod.formatCount(1.5,2))'),'1.5');
 console.log({pass:true,failed:brokenPath,recoveredWithoutReload:true});
}}).catch(error=>{console.error(error);process.exitCode=1});
