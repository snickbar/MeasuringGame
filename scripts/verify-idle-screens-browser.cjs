// The real app: each main screen, opened and left alone, does not keep the page restyling (see BUDGET below for why this is a count).
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {runFixture}=require('./browser-fixture.cjs');
const {restyleRates,restyleRate,assertOffMainThread}=require('./restyle-rate.cjs');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/\r\n/g,'\n');
const existing=fs.readFileSync(path.join(root,'scripts/verify-game-polish-browser.cjs'),'utf8');
const sandbox={};vm.runInNewContext(existing.slice(existing.indexOf('const dbStub='),existing.indexOf('let checks='))+';globalThis.parts={dbStub,authStub};',sandbox);
const {dbStub,authStub}=sandbox.parts;
const html=source.replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js','/__fake/app.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js','/__fake/db.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js','/__fake/auth.mjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
// Every screen below is opened the way a player opens it, left alone, and must not keep the page restyling. A slow phone feels
// each restyle (about 1.5 ms on a fast computer, several times that on an old phone), so a screen that restyles 60 times a second
// is a screen that keeps the phone busy while nothing is happening. The budget is a restyle COUNT, not a time, so it does not
// wobble with how busy this computer is.
const BUDGET=12; // restyles a second; the repaired screens measure 0-1, an endless box-shadow or background animation measures 60
const screens=[
 ['Home','document.getElementById("toolbar-home-btn").click()'],
 ['Shop','document.getElementById("toolbar-shop-btn").click()'],
 ['Awards','document.getElementById("toolbar-awards-btn").click()'],
 ['Style','document.getElementById("toolbar-cosmetics-btn").click()'],
 ['Solo hub','document.getElementById("toolbar-home-btn").click();await wait(900);document.getElementById("home-solo-btn").click()'],
 ['Party','document.getElementById("toolbar-home-btn").click();await wait(900);document.getElementById("home-create-btn").click()'],
 ['Join','document.getElementById("toolbar-home-btn").click();await wait(900);document.getElementById("home-join-btn").click()'],
 ['Monthly','document.getElementById("toolbar-home-btn").click();await wait(900);document.getElementById("home-solo-btn").click();await wait(1200);document.getElementById("sh-monthly").click();for(let n=0;n<60&&!document.querySelector(".mc-node.play");n++)await wait(100);{const d=document.getElementById("mode-tutorial");if(d&&d.open)d.querySelector("[data-skip]")?.click()}'],
];
runFixture({html,widths:[390],height:844,modules:{'/__fake/app.mjs':'export const initializeApp=()=>({});','/__fake/db.mjs':dbStub,'/__fake/auth.mjs':authStub},check:async({width,evaluate,call,sessionId})=>{
 await evaluate("new Promise(r=>{const t=()=>document.getElementById('home-screen')?.classList.contains('active')?r(true):setTimeout(t,50);t()})");
 await evaluate('new Promise(r=>setTimeout(r,1500))');
 await evaluate("(()=>{for(const id of ['menu-tour','mode-tutorial']){const d=document.getElementById(id);if(d&&d.open)d.close();}return 0})()");
 const rates=await restyleRates({call,evaluate,sessionId});
 if(!rates.offMainThread){assertOffMainThread(assert,rates,'screens sit idle');console.log({pass:true,skipped:true});return;}
 assert(rates.mainThread>30,'The check can see per-frame work: '+rates.mainThread+' a second');
 const results={};
 for(const [name,open] of screens){
  await evaluate(`(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));${open};await wait(1500);return 0})()`);
  const active=await evaluate("[...document.querySelectorAll('.screen.active')].map(s=>s.id).join(',')");
  const rate=await restyleRate({call,sessionId});
  results[name]={rate,screen:active};
  assert(rate<BUDGET,name+' ('+active+') keeps restyling the page while nothing happens: '+rate+' a second (budget '+BUDGET+'). An endless animation of something other than transform/opacity is the usual cause; find it with document.getAnimations() on that screen and see scripts/verify-animation-properties.mjs.');
 }
 console.log({pass:true,width,budget:BUDGET,restylesPerSecond:Object.fromEntries(Object.entries(results).map(([k,v])=>[k,v.rate]))});
}}).catch(e=>{console.error(e);process.exitCode=1});
