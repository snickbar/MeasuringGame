// The real app, Monthly Challenge: the ring that pulses round the level you are on is a circle behind the number that grows (a
// transform), not an animated box-shadow, so the page is not repainted on every frame. The ring has to keep looking the same:
// hidden behind the number at rest, 7px outside it at the peak, behind the number, over the squirrel, and still for Reduce Motion.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {runFixture}=require('./browser-fixture.cjs');
const {restyleRates,assertOffMainThread}=require('./restyle-rate.cjs');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/\r\n/g,'\n');
const existing=fs.readFileSync(path.join(root,'scripts/verify-game-polish-browser.cjs'),'utf8');
const sandbox={};vm.runInNewContext(existing.slice(existing.indexOf('const dbStub='),existing.indexOf('let checks='))+';globalThis.parts={dbStub,authStub};',sandbox);
const {dbStub,authStub}=sandbox.parts;
const html=source.replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js','/__fake/app.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js','/__fake/db.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js','/__fake/auth.mjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
// Opens the Monthly Challenge from the Solo hub (its first-time how-to-play is skipped) and waits for the level list.
const start=String.raw`(async()=>{
 const $=id=>document.getElementById(id),wait=ms=>new Promise(r=>setTimeout(r,ms));
 for(const id of ['menu-tour','mode-tutorial']){const d=$(id);if(d&&d.open)d.close();}
 await wait(500);
 $('home-solo-btn').click();await wait(1200);
 $('sh-monthly').click();
 for(let n=0;n<100&&!document.querySelector('.mc-node.play .mc-dot');n++)await wait(100);
 const how=$('mode-tutorial');if(how&&how.open)how.querySelector('[data-skip]')?.click();
 await wait(600);
 return document.querySelectorAll('.mc-node.play').length;
})()`;
const look=String.raw`(()=>{
 const node=document.querySelector('.mc-node.play'),dot=node.querySelector('.mc-dot');
 const ring=getComputedStyle(node,'::before'),n=getComputedStyle(dot);
 const pulses=document.getAnimations({subtree:true}).filter(a=>a.animationName==='mcPulse');
 const peak=pulses[0]&&pulses[0].effect.getKeyframes().find(k=>k.offset===.5);
 return JSON.stringify({
  pulses:pulses.map(a=>({pseudo:a.effect.pseudoElement,target:a.effect.target.className,props:[...new Set(a.effect.getKeyframes().flatMap(k=>Object.keys(k)).filter(p=>!['offset','easing','composite','computedOffset'].includes(p)))]})),
  peakTransform:peak&&peak.transform,
  dotAnimations:dot.getAnimations().length,
  ring:{left:parseFloat(ring.left),top:parseFloat(ring.top),width:parseFloat(ring.width),height:parseFloat(ring.height),radius:ring.borderTopLeftRadius,background:ring.backgroundColor,zIndex:ring.zIndex,position:ring.position},
  dot:{width:parseFloat(n.width),height:parseFloat(n.height),zIndex:n.zIndex},
  squirrelZ:document.querySelector('.mc-squirrel')?getComputedStyle(document.querySelector('.mc-squirrel')).zIndex:null,
  columns:getComputedStyle(node).gridTemplateColumns,
  dotBox:(r=>[r.left-node.getBoundingClientRect().left,r.top-node.getBoundingClientRect().top])(dot.getBoundingClientRect())
 });
})()`;
runFixture({html,widths:[390],height:844,modules:{'/__fake/app.mjs':'export const initializeApp=()=>({});','/__fake/db.mjs':dbStub,'/__fake/auth.mjs':authStub},check:async({width,evaluate,call,sessionId})=>{
 await evaluate("new Promise(r=>{const t=()=>document.getElementById('home-screen')?.classList.contains('active')?r(true):setTimeout(t,50);t()})");
 await evaluate('new Promise(r=>setTimeout(r,1500))');
 assert.equal(await evaluate(start),1,'The Monthly Challenge has one level marked as the one to play');
 const w=JSON.parse(await evaluate(look));

 // 1. The pulse is one transform animation on the circle behind the number; nothing animates the number's own box-shadow.
 assert.equal(w.pulses.length,1,'One pulse is running: '+JSON.stringify(w.pulses));
 assert.equal(w.pulses[0].pseudo,'::before','The pulse is on the circle behind the number');
 assert.deepEqual(w.pulses[0].props,['transform'],'The pulse only changes the circle\'s transform: '+JSON.stringify(w.pulses));
 assert.equal(w.dotAnimations,0,'The number itself has no animation (it used to animate its box-shadow)');

 // 2. It looks as it did: hidden behind the number at rest, 7px outside it at the peak, same colour, a circle.
 const r=w.ring,c=w.dot;
 assert.equal(r.position,'absolute','The circle is out of the grid layout: '+JSON.stringify(r));
 assert.deepEqual(w.dotBox,[0,0],'The number sits in the corner of its row, where the circle is measured from: '+JSON.stringify(w.dotBox));
 assert(r.left>=0&&r.top>=0&&r.left+r.width<=c.width&&r.top+r.height<=c.height,'At rest the circle is hidden inside the number: '+JSON.stringify(w));
 assert.equal(r.width,r.height,'The circle is round');
 assert(/50%|^19px$/.test(r.radius),'The circle is round: '+r.radius);
 assert.equal(r.background,'rgba(217, 129, 28, 0.28)','The ring keeps the shadow\'s colour: '+r.background);
 const scale=Number((w.peakTransform||'').match(/scale\(([\d.]+)\)/)?.[1]);
 assert.deepEqual([r.left+r.width/2-c.width/2,r.top+r.height/2-c.height/2],[0,0],'The circle is centred on the number: '+JSON.stringify(w));
 const outside=(r.width/2)*scale-c.width/2; // how far past the number's edge the circle reaches at the peak (it grows about its centre)
 assert(Math.abs(outside-7)<=.5,'At the peak the ring reaches 7px past the number, as the shadow did: '+outside.toFixed(2)+' (scale '+scale+')');

 // 3. Stacking: same level as the number (earlier in the page, so behind it), above the squirrel the shadow also painted over.
 assert.equal(r.zIndex,c.zIndex,'The circle and the number share a level, so the number paints on top: '+r.zIndex+' / '+c.zIndex);
 assert(w.squirrelZ!==null,'The squirrel is on the level trail');
 assert(Number(c.zIndex)>Number(w.squirrelZ),'They stay above the squirrel: '+c.zIndex+' vs '+w.squirrelZ);

 // 4. Reduce Motion stops the pulse.
 await evaluate("(document.documentElement.dataset.motion='reduce',0)");
 const calm=JSON.parse(await evaluate(look));
 assert.equal(calm.pulses.length,0,'Reduce Motion stops the pulse: '+JSON.stringify(calm.pulses));
 await evaluate("(delete document.documentElement.dataset.motion,0)");

 // 5. With the ring pulsing, the page is not restyled on every frame (all other animations paused first).
 await evaluate("(document.getAnimations({subtree:true}).forEach(a=>{if(a.animationName!=='mcPulse')a.pause();}),0)");
 await wait(500);
 assert.equal(JSON.parse(await evaluate(look)).pulses.length,1,'The pulse is running again after Reduce Motion is cleared');
 const rates=await restyleRates({call,evaluate,sessionId});
 const perFrameCheck=assertOffMainThread(assert,rates,'the Monthly ring pulses');
 console.log({pass:true,width,checks:'Monthly level ring pulses as a transform on a circle behind the number: same size, colour and stacking as the old shadow, Reduce Motion stills it, no per-frame restyling',pulse:w.pulses[0],ringReachesPx:+outside.toFixed(2),restylesPerSecond:rates,perFrameCheck});
}}).catch(e=>{console.error(e);process.exitCode=1});
