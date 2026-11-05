const assert=require('assert/strict'),{runFixture}=require('./browser-fixture.cjs');
runFixture({html:'<!doctype html><style>body{margin:0;--cardbg:#fff9e7;--cardline:#b6a986;--cardfg:#432f22}#stage{position:relative;width:330px;height:440px}</style><div id="stage"></div>',widths:[390],out:'output/monthly-art-regression',check:async({evaluate})=>{
 await evaluate(`(async()=>{window.__motionSource=await (await fetch('/monthly/motion.js')).text();window.__NativeImage=Image;window.__requests=[];window.Image=class extends __NativeImage {set src(value){__requests.push(new URL(value,location.href).pathname);super.src=value}get src(){return super.src}};eval(__motionSource)})()`);
 const keys=await evaluate('MM.keys()');assert.equal(keys.length,36);
 for(const key of keys){
  const result=await evaluate(`(async()=>{const stage=document.getElementById('stage');stage.getAnimations({subtree:true}).forEach(a=>a.cancel());stage.replaceChildren();__requests=[];eval(__motionSource);await MM.ready(${JSON.stringify(key)});MM.build(${JSON.stringify(key)},stage);const used=[...stage.querySelectorAll('img')].map(img=>new URL(img.src,location.href)).filter(u=>u.pathname.startsWith('/monthly/art/')).map(u=>u.pathname);return{loaded:__requests,missing:[...new Set(used.filter(path=>!__requests.includes(path)))]}})()`);
  assert.deepEqual(result.missing,[],key+': every rendered image must have been preloaded');
  assert(result.loaded.length<20,key+': must not preload the entire monthly set');
 }
 console.log('PASS: all 36 monthly effects build with only their own artwork; rendered-image dependency coverage verified.');
}}).catch(e=>{console.error(e);process.exitCode=1});
