// The real app: when coins are earned the toolbar number still counts up from the old balance to the new one, through the
// numbers in between and never backwards; it edits its text in place instead of swapping a text node per frame; and when
// more coins land while it is still counting, it carries on as one count instead of two counts fighting over the number.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {runFixture}=require('./browser-fixture.cjs');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/\r\n/g,'\n');
const existing=fs.readFileSync(path.join(root,'scripts/verify-game-polish-browser.cjs'),'utf8');
const sandbox={};vm.runInNewContext(existing.slice(existing.indexOf('const dbStub='),existing.indexOf('let checks='))+';globalThis.parts={dbStub,authStub};',sandbox);
const {authStub}=sandbox.parts;
// The shared fake database does not hand out its change announcer; this test needs it to give the player coins from outside.
assert(sandbox.parts.dbStub.includes('window.__fakeDB={read,put};'),'The fake database exposes read and put');
const dbStub=sandbox.parts.dbStub.replace('window.__fakeDB={read,put};','window.__fakeDB={read,put,notify};');
const html=source.replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js','/__fake/app.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js','/__fake/db.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js','/__fake/auth.mjs');
const script=String.raw`(async()=>{
 const $=id=>document.getElementById(id),wait=ms=>new Promise(r=>setTimeout(r,ms));
 for(const d of document.querySelectorAll('dialog[open]'))d.close();
 const counter=$('toolbar-coin-count'),db=window.__fakeDB;
 const id=Object.keys(db.read('profiles')||{})[0],at='profiles/'+id+'/coins';
 // Let any count already under way (the app's own start-up coins) finish first, so each run below watches only its own count.
 const quiet=async()=>{for(let n=0,steady=0;n<200&&steady<14;n++){await wait(50);steady=counter.textContent===String(db.read(at))?steady+1:0;}};
 const earn=amount=>{db.put(at,db.read(at)+amount);db.notify('profiles/'+id);};
 // Earn "first" coins and watch the counter. With "second", more coins land a little after the counting has begun.
 const run=async(first,second)=>{
  await quiet();
  const before=counter.textContent,seen=[before],log={child:0,chars:0},goal=db.read(at)+first+(second||0);
  const watcher=new MutationObserver(list=>{for(const r of list){if(r.type==='childList')log.child++;else log.chars++;}const t=counter.textContent;if(seen[seen.length-1]!==t)seen.push(t);});
  watcher.observe(counter,{childList:true,characterData:true,subtree:true});
  earn(first);
  if(second){for(let n=0;n<240&&counter.textContent===before;n++)await wait(25);await wait(400);earn(second);}
  for(let n=0;n<240&&counter.textContent!==String(goal);n++)await wait(50); // up to 12 s: the coins fly up first, then the number counts
  await wait(300);watcher.disconnect();
  return {before,goal,after:counter.textContent,seen,log};
 };
 const single=await run(300,0),overlap=await run(250,200);
 return JSON.stringify({single,overlap});
})()`;
function checkRun(name,run){
 assert.equal(run.after,String(run.goal),name+': the toolbar ends on the new balance: '+JSON.stringify(run));
 const numbers=run.seen.map(Number).filter(Number.isFinite);
 assert(numbers.length>=8,name+': the number passed through several values on the way up: '+JSON.stringify(run.seen));
 assert.deepEqual(numbers,[...numbers].sort((a,b)=>a-b),name+': it only ever goes up while counting: '+JSON.stringify(run.seen));
 assert(run.log.chars>=8,name+': the counting edited the number in place: '+JSON.stringify(run.log));
 assert(run.log.child<=2,name+': no text node swapped per frame: '+JSON.stringify(run.log));
 return numbers.length;
}
runFixture({html,widths:[390],modules:{'/__fake/app.mjs':'export const initializeApp=()=>({});','/__fake/db.mjs':dbStub,'/__fake/auth.mjs':authStub},check:async({width,evaluate})=>{
 await evaluate("new Promise(r=>{const t=()=>document.getElementById('home-screen')?.classList.contains('active')?r(true):setTimeout(t,50);t()})");
 await evaluate('new Promise(r=>setTimeout(r,1500))');
 const out=JSON.parse(await evaluate(script));
 const steps=checkRun('one gain',out.single),stepsOverlap=checkRun('a second gain mid-count',out.overlap);
 console.log({pass:true,width,checks:'toolbar coin counter counts up to the new balance in place, and stays one count when more coins land mid-count',oneGain:`${out.single.before} -> ${out.single.after} in ${steps} steps`,secondGainMidCount:`${out.overlap.before} -> ${out.overlap.after} in ${stepsOverlap} steps`});
}}).catch(e=>{console.error(e);process.exitCode=1});
