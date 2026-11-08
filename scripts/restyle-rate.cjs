// For browser checks that an animation runs off the main thread: how many times a second does the page restyle?
//
// An animation of transform or opacity runs on the browser's compositor thread and costs the main thread nothing. One that
// changes anything else (a box-shadow, a size, a colour) makes the main thread restyle and repaint on every frame: 60 times a
// second, which a slow phone feels. The page's "RecalcStyleCount" counts those restyles.
//
// Two controls keep the count honest. An animation that can only run on the main thread must show up in it (the count can see
// per-frame work), and a plain transform animation must stay out of it. Some builds of Chromium (for example one that applies
// its built-in experiment config) do not run transform animations off the main thread at all; the page-level check is
// meaningless there, so assertOffMainThread says so and moves on instead of failing.
const wait=ms=>new Promise(r=>setTimeout(r,ms));
exports.restyleRates=async function({call,evaluate,sessionId}){
 await call('Performance.enable',{},sessionId);
 const recalcs=async()=>(await call('Performance.getMetrics',{},sessionId)).metrics.find(m=>m.name==='RecalcStyleCount').value;
 const rate=async()=>{const a=await recalcs();await wait(1500);return (await recalcs()-a)/1.5;};
 const probe=async keyframes=>{
  await evaluate(`(window.__probe=document.body.appendChild(document.createElement('div')),window.__probe.style.cssText='position:fixed;left:10px;top:10px;width:40px;height:40px;background:#c00;z-index:99999',window.__probe.animate(${keyframes},{duration:800,iterations:Infinity,direction:'alternate'}),0)`);
  await wait(300);const r=await rate();
  // Cancel before removing: an animation left running on a detached element keeps the page restyling.
  await evaluate("(window.__probe.getAnimations().forEach(a=>a.cancel()),window.__probe.remove(),0)");await wait(300);return r;
 };
 const idle=await rate();
 const mainThread=await probe("[{outlineOffset:'0px'},{outlineOffset:'3px'}]");
 const plainTransform=await probe("[{transform:'translateY(0)'},{transform:'translateY(10px)'}]");
 return {idle:+idle.toFixed(1),mainThread:+mainThread.toFixed(1),plainTransform:+plainTransform.toFixed(1),offMainThread:plainTransform<12};
};
// Returns 'ran' or 'skipped'.
exports.assertOffMainThread=function(assert,rates,what){
 assert(rates.mainThread>30,'A main-thread animation does show up in the count (so the check can see it): '+rates.mainThread+' a second');
 if(rates.offMainThread){assert(rates.idle<12,'The page is not restyled on every frame while '+what+': '+rates.idle+' restyles a second');return 'ran';}
 console.log('Note: this browser restyles the page every frame for any transform animation ('+rates.plainTransform+' a second for a plain one), so the per-frame check for '+what+' is skipped here.');
 return 'skipped';
};
// Restyles a second over `ms` (default 1.5 s) for whatever is on screen now. (restyleRates above also measures the two controls.)
exports.restyleRate=async function({call,sessionId},ms=1500){
 await call('Performance.enable',{},sessionId);
 const count=async()=>(await call('Performance.getMetrics',{},sessionId)).metrics.find(m=>m.name==='RecalcStyleCount').value;
 const a=await count();await wait(ms);return +((await count()-a)/(ms/1000)).toFixed(1);
};
