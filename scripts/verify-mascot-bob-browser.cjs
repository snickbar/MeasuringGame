// The real app, in a first-time "how to play": each mascot hops in, and only then starts its idle bob, so the bob can run off the
// main thread. A mascot never has both animations at once, the hop plays again on every run, the second mascot of a pair keeps
// its later bob, Reduce Motion still stills them, and with the mascots bobbing the page is not redrawn on every frame.
//
// The hop-in and the bob both animate `transform`. On one element that pair kept the bob on the main thread, so the whole page
// was restyled 60 times a second for as long as a how-to-play was open (a lot of work for a slow phone).
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {runFixture}=require('./browser-fixture.cjs');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/\r\n/g,'\n');
const existing=fs.readFileSync(path.join(root,'scripts/verify-game-polish-browser.cjs'),'utf8');
const sandbox={};vm.runInNewContext(existing.slice(existing.indexOf('const dbStub='),existing.indexOf('let checks='))+';globalThis.parts={dbStub,authStub};',sandbox);
const {dbStub,authStub}=sandbox.parts;
const html=source.replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js','/__fake/app.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js','/__fake/db.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js','/__fake/auth.mjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
// Opens Which Is Bigger from the Solo hub, which plays its how-to-play for the first time (two mascots: an elephant and a mouse).
const start=String.raw`(async()=>{
 const $=id=>document.getElementById(id),wait=ms=>new Promise(r=>setTimeout(r,ms));
 for(const id of ['menu-tour','mode-tutorial']){const d=$(id);if(d&&d.open)d.close();}
 await wait(500);
 $('home-solo-btn').click();await wait(1200);
 $('sh-wb').click();
 for(let n=0;n<100&&!($('mode-tutorial')?.open&&document.querySelector('#mode-tutorial .mt-mascot'));n++)await wait(100);
 return document.querySelectorAll('#mode-tutorial .mt-mascot').length;
})()`;
// Watches every showing mascot frame by frame until each one has settled into its bob (or four seconds pass), and reports which
// animations each one had, in order, plus the delay of its bob.
const watch=String.raw`(async()=>{
 const dlg=document.getElementById('mode-tutorial');
 const marks=[...dlg.querySelectorAll('.mt-mascot')].filter(m=>m.offsetParent);
 const names=m=>m.getAnimations().map(a=>a.animationName).sort().join('+')||'none';
 const seen=marks.map(()=>[]),t0=performance.now();
 await new Promise(done=>{
  const tick=()=>{
   marks.forEach((m,i)=>{const n=names(m);if(seen[i][seen[i].length-1]!==n)seen[i].push(n);});
   if(performance.now()-t0>4000||marks.every((m,i)=>seen[i][seen[i].length-1]==='mtMcBob'))done();else requestAnimationFrame(tick);
  };
  tick();
 });
 return JSON.stringify({shown:marks.length,seen,settled:marks.map(m=>m.classList.contains('mt-settled')),
  bobDelays:marks.map(m=>m.getAnimations().map(a=>a.effect.getTiming().delay))});
})()`;
// Starts a how-to-play the way the "How to play" buttons do, then watches the mascots.
const replay=mode=>String.raw`(async()=>{
 const b=document.createElement('button');b.dataset.tour=${JSON.stringify(mode)};document.body.append(b);b.click();b.remove();
 return await ${watch};
})()`;
const closeIt=String.raw`(async()=>{
 const dlg=document.getElementById('mode-tutorial');
 dlg.querySelector('[data-skip]').click();
 await new Promise(r=>setTimeout(r,300));
 return JSON.stringify({open:dlg.open,settledLeft:dlg.querySelectorAll('.mt-settled').length,mascots:dlg.querySelectorAll('.mt-mascot').length});
})()`;
function checkRun(name,run){
 assert(run.shown>=1,name+': the mascots are showing: '+JSON.stringify(run));
 run.seen.forEach((states,i)=>{
  assert(states.every(s=>s==='mtMcHop'||s==='mtMcBob'),name+': mascot '+i+' only ever has the hop or the bob, never both at once: '+JSON.stringify(run));
  assert.equal(states[states.length-1],'mtMcBob',name+': mascot '+i+' ends up bobbing, with only the bob left: '+JSON.stringify(run));
 });
 assert(run.settled.every(Boolean),name+': every mascot is marked settled once its hop is over: '+JSON.stringify(run));
}
runFixture({html,widths:[390],height:844,modules:{'/__fake/app.mjs':'export const initializeApp=()=>({});','/__fake/db.mjs':dbStub,'/__fake/auth.mjs':authStub},check:async({width,evaluate,call,sessionId})=>{
 await evaluate("new Promise(r=>{const t=()=>document.getElementById('home-screen')?.classList.contains('active')?r(true):setTimeout(t,50);t()})");
 await evaluate('new Promise(r=>setTimeout(r,1500))');
 assert.equal(await evaluate(start),2,'Which Is Bigger opens its how-to-play with two mascots');

 // 1. The first run, started by the app itself: the two mascots end up bobbing, one animation each.
 checkRun('first run',JSON.parse(await evaluate(watch)));

 // 2. Closing the how-to-play: the mascots stay in the page, but are no longer marked settled, so the next run hops in again.
 const closed=JSON.parse(await evaluate(closeIt));
 assert.equal(closed.open,false,'Skip closes the how-to-play: '+JSON.stringify(closed));
 assert(closed.mascots>=2&&closed.settledLeft===0,'The mascots stay, without their settled marker: '+JSON.stringify(closed));

 // 3. Opened again (a "How to play" button): the hop-in plays first, then the bob. The second mascot's bob starts a little later.
 const again=JSON.parse(await evaluate(replay('wb')));
 checkRun('second run',again);
 again.seen.forEach((states,i)=>assert.equal(states[0],'mtMcHop','mascot '+i+' hops in again on the second run: '+JSON.stringify(again)));
 assert.deepEqual(again.bobDelays,[[0],[230]],'The first mascot bobs at once, the second 0.23 s later, so the pair stays out of step: '+JSON.stringify(again));

 // 4. With the mascots bobbing, the page is not restyled on every frame. Everything else that animates is paused first, so
 //    the count is about the mascots. Two controls keep the count honest: an animation that can only run on the main thread
 //    must show up in it (the count can see per-frame work), and a plain transform animation must stay out of it (this browser
 //    does run transform animations off the main thread; some builds of Chromium do not, and then the check says so and moves on).
 await evaluate("(document.getAnimations().forEach(a=>{if(a.animationName!=='mtMcBob')a.pause();}),0)");
 await wait(500);
 await call('Performance.enable',{},sessionId);
 const recalcs=async()=>(await call('Performance.getMetrics',{},sessionId)).metrics.find(m=>m.name==='RecalcStyleCount').value;
 const rate=async()=>{const a=await recalcs();await wait(1500);return (await recalcs()-a)/1.5;};
 const probe=async keyframes=>{
  await evaluate(`(window.__probe=document.body.appendChild(document.createElement('div')),window.__probe.style.cssText='position:fixed;left:10px;top:10px;width:40px;height:40px;background:#c00;z-index:99999',window.__probe.animate(${keyframes},{duration:800,iterations:Infinity,direction:'alternate'}),0)`);
  await wait(300);const r=await rate();
  await evaluate("(window.__probe.getAnimations().forEach(a=>a.cancel()),window.__probe.remove(),0)");await wait(300);return r;
 };
 const bobbing=await rate();
 const mainThread=await probe("[{outlineOffset:'0px'},{outlineOffset:'3px'}]");
 const plainTransform=await probe("[{transform:'translateY(0)'},{transform:'translateY(10px)'}]");
 assert(mainThread>30,'A main-thread animation does show up in the count (so the check can see it): '+mainThread.toFixed(1)+' a second');
 const offMainThread=plainTransform<12;
 if(offMainThread)assert(bobbing<12,'The page is not restyled on every frame while the mascots bob: '+bobbing.toFixed(1)+' recalculations a second');
 else console.log('Note: this browser restyles the page every frame for any transform animation ('+plainTransform.toFixed(1)+' a second for a plain one), so the per-frame check is skipped here.');

 // 5. Reduce Motion still keeps the mascots still, settled or not.
 await evaluate("(document.documentElement.dataset.motion='reduce',0)");
 const still=JSON.parse(await evaluate("JSON.stringify([...document.querySelectorAll('#mode-tutorial .mt-mascot')].map(m=>({settled:m.classList.contains('mt-settled'),animations:m.getAnimations().length})))"));
 assert(still.every(m=>m.animations===0),'Reduce Motion stills the mascots: '+JSON.stringify(still));
 await evaluate("(delete document.documentElement.dataset.motion,0)");

 // 6. A single mascot on the right (Quick) does the same.
 await evaluate("(document.querySelector('#mode-tutorial [data-skip]').click(),0)");await wait(300);
 const quick=JSON.parse(await evaluate(replay('quick')));
 checkRun('quick',quick);
 assert.equal(quick.shown,1,'Quick has one mascot: '+JSON.stringify(quick));
 console.log({pass:true,width,checks:'how-to-play mascots hop in, then settle into a bob; one animation at a time; hop again on every run; second mascot bobs later; Reduce Motion stills them; no per-frame restyling while they bob',firstRun:again.seen,bobDelays:again.bobDelays,restylesPerSecond:{whileBobbing:+bobbing.toFixed(1),aPlainTransformAnimation:+plainTransform.toFixed(1),aMainThreadAnimation:+mainThread.toFixed(1)},perFrameCheck:offMainThread?'ran':'skipped'});
}}).catch(e=>{console.error(e);process.exitCode=1});
