// The real app, in a real Quick question: the power-up tray is left alone while nothing about it changes, and still follows
// every change that matters (the screen resizing, the question board growing, the coins running out). The question clock's
// digits are edited in place instead of being thrown away and re-created on every tick.
//
// render() also runs from the 200 ms game clock. It used to hide the tray, reset the sidebar, measure, rebuild the five
// buttons and show the tray again on every one of those runs, and the label fitter then re-fitted every button each time:
// five times a second of pointless work, which is a lot on a slow phone. The clock rewrote its number on every tick too, and
// a new text node makes the browser re-check the page-wide :has() rules (see anim/set-text.mjs).
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {runFixture}=require('./browser-fixture.cjs');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/\r\n/g,'\n');
const existing=fs.readFileSync(path.join(root,'scripts/verify-game-polish-browser.cjs'),'utf8');
const sandbox={};vm.runInNewContext(existing.slice(existing.indexOf('const dbStub='),existing.indexOf('let checks='))+';globalThis.parts={dbStub,authStub};',sandbox);
const {authStub}=sandbox.parts;
// The shared fake database does not hand out its change announcer; this test needs it to take the player's coins from outside.
assert(sandbox.parts.dbStub.includes('window.__fakeDB={read,put};'),'The fake database exposes read and put');
const dbStub=sandbox.parts.dbStub.replace('window.__fakeDB={read,put};','window.__fakeDB={read,put,notify};');
const html=source.replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js','/__fake/app.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js','/__fake/db.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js','/__fake/auth.mjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
// Starts a Quick solo game through the screens a player taps, and waits for the power-up tray to appear.
const start=String.raw`(async()=>{
 const $=id=>document.getElementById(id),wait=ms=>new Promise(r=>setTimeout(r,ms));
 for(const id of ['menu-tour','mode-tutorial']){const d=$(id);if(d&&d.open)d.close();}
 await wait(500);
 $('home-solo-btn').click();await wait(1200);
 $('sh-quick').click();await wait(1500);
 $('create-room-btn').click();await wait(1800);
 const input=$('name-input');input.value='Tester';input.dispatchEvent(new Event('input',{bubbles:true}));$('join-lobby-btn').click();await wait(2500);
 $('host-start-btn').click();await wait(3500);
 const how=$('mode-tutorial');if(how&&how.open){const skip=[...how.querySelectorAll('button')].find(b=>/skip|close|got it/i.test(b.textContent));skip&&skip.click();}
 const tray=$('quick-powerups');
 for(let n=0;n<200&&!(tray&&!tray.hidden&&tray.querySelectorAll('.pu-button').length===5);n++)await wait(100);
 await wait(1200); // let the entrance animations and the first fitting of the button labels finish
 return tray.querySelectorAll('.pu-button').length;
})()`;
// Watches the tray and the sidebar padding for a while, and counts how often the page measured the sidebar (each render does).
const idle=String.raw`(async()=>{
 const tray=document.getElementById('quick-powerups'),side=document.querySelector('.score-sidebar'),clock=document.getElementById('hud-timer');
 const hits=[],inTray=n=>{const el=n.nodeType===1?n:n.parentElement;return !!el&&(el===tray||tray.contains(el));};
 let clockSwaps=0;
 const note=r=>{
  if(inTray(r.target)||(r.target===side&&r.type==='attributes'))hits.push(r.type+' '+(r.attributeName||'')+' on '+(r.target.id||r.target.className||r.target.tagName));
  if(r.target===clock&&r.type==='childList')clockSwaps++;
 };
 const watcher=new MutationObserver(list=>list.forEach(note));
 watcher.observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true});
 const real=Element.prototype.getBoundingClientRect;let reads=0;
 Element.prototype.getBoundingClientRect=function(){if(this===side)reads++;return real.call(this);};
 await new Promise(r=>setTimeout(r,1800));
 Element.prototype.getBoundingClientRect=real;
 watcher.takeRecords().forEach(note);
 watcher.disconnect();
 return JSON.stringify({hits:hits.length,sample:hits.slice(0,4),renders:reads,clockSwaps,clock:clock.textContent});
})()`;
// Where the tray stands now, against the boxes it is placed from.
const where=String.raw`(()=>{
 const $=id=>document.getElementById(id),tray=$('quick-powerups'),side=document.querySelector('.score-sidebar');
 const body=document.querySelector('.game-body'),main=document.querySelector('.main-col'),board=$('question-prompt');
 const t=tray.getBoundingClientRect(),s=side.getBoundingClientRect(),m=main.getBoundingClientRect(),b=body.getBoundingClientRect(),q=board.getBoundingClientRect();
 const buttons=[...tray.querySelectorAll('.pu-button')],rects=buttons.map(x=>x.getBoundingClientRect());
 return JSON.stringify({hidden:tray.hidden,buttons:buttons.length,disabled:buttons.map(x=>x.disabled),
  left:t.left,right:t.right,bottom:t.bottom,mainRight:m.right,sideRight:s.right,viewport:innerWidth,
  padding:parseFloat(side.style.paddingTop),paddingWanted:t.bottom-b.top+6,boardBottom:q.bottom,
  rerollTops:rects.slice(2).map(r=>r.top),minWidth:Math.min(...rects.map(r=>r.width))});
})()`;
function checkPlace(name,w){
 assert(!w.hidden&&w.buttons===5,name+': the tray shows its five buttons: '+JSON.stringify(w));
 assert(Math.abs(w.left-(w.mainRight+6))<=1&&Math.abs(w.right-w.sideRight)<=1,name+': the tray fills the gap between the question and the sidebar edge: '+JSON.stringify(w));
 assert(w.right<=w.viewport+1,name+': the tray stays on screen: '+JSON.stringify(w));
 assert(Math.abs(w.padding-w.paddingWanted)<=1,name+': the scoreboard starts just below the tray: '+JSON.stringify(w));
 assert(w.rerollTops.every(top=>top>=w.boardBottom-1),name+': Small, Big and Both start below the question board: '+JSON.stringify(w));
 assert(w.minWidth>=30,name+': the buttons keep a usable width: '+JSON.stringify(w));
}
runFixture({html,widths:[390],height:844,modules:{'/__fake/app.mjs':'export const initializeApp=()=>({});','/__fake/db.mjs':dbStub,'/__fake/auth.mjs':authStub},check:async({width,evaluate,call,sessionId})=>{
 await evaluate("new Promise(r=>{const t=()=>document.getElementById('home-screen')?.classList.contains('active')?r(true):setTimeout(t,50);t()})");
 await evaluate('new Promise(r=>setTimeout(r,1500))');
 assert.equal(await evaluate(start),5,'A Quick question shows the five power-up buttons');
 const place=async name=>{const w=JSON.parse(await evaluate(where));checkPlace(name,w);return w;};
 const first=await place('as drawn');

 // 1. Nothing is changing: the tray and the sidebar padding must not be touched at all, although render() keeps running.
 const quiet=JSON.parse(await evaluate(idle));
 assert(quiet.renders>=4,'The game clock keeps calling render() during the quiet stretch: '+JSON.stringify(quiet));
 assert.equal(quiet.hits,0,'A quiet stretch leaves the tray and sidebar padding alone: '+JSON.stringify(quiet));
 assert(/^\d+$/.test(quiet.clock),'The question clock shows seconds: '+JSON.stringify(quiet));
 assert.equal(quiet.clockSwaps,0,'The clock edits its digits in place instead of re-creating them on every tick: '+JSON.stringify(quiet));
 const still=await place('after a quiet stretch');
 assert.deepEqual([still.left,still.right,still.bottom,still.padding],[first.left,first.right,first.bottom,first.padding],'The tray did not move while nothing changed');

 // 2. The screen gets narrower, then wide again: the tray follows.
 await call('Emulation.setDeviceMetricsOverride',{width:340,height:844,deviceScaleFactor:1,mobile:true},sessionId);await wait(1200);
 const narrow=await place('at 340 px');
 assert(narrow.right<first.right,'The tray narrows with the screen: '+first.right+' -> '+narrow.right);
 await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true},sessionId);await wait(1200);
 const wide=await place('back at '+width+' px');
 assert.deepEqual([wide.left,wide.right,wide.padding],[first.left,first.right,first.padding],'It returns to where it started');

 // 3. The question board grows without the screen changing: the reroll row must move down below it.
 await evaluate("(document.getElementById('question-prompt').style.minHeight='320px',0)");await wait(900);
 const tall=await place('with a tall question board');
 assert(tall.rerollTops[0]>first.rerollTops[0],'The reroll row moves down with the board: '+first.rerollTops[0]+' -> '+tall.rerollTops[0]);
 await evaluate("(document.getElementById('question-prompt').style.minHeight='',0)");await wait(900);
 const normal=await place('with the board back to normal');
 assert.deepEqual([normal.left,normal.right,normal.padding],[first.left,first.right,first.padding],'It returns to where it started again');

 // 4. The coins run out: every button greys out; when they come back, the buttons come back too.
 const coins=amount=>evaluate(`(()=>{const db=window.__fakeDB,id=Object.keys(db.read('profiles')||{})[0];db.put('profiles/'+id+'/coins',${amount});db.notify('profiles/'+id);return db.read('profiles/'+id+'/coins');})()`);
 await coins(0);await wait(900);
 const broke=await place('with no coins');
 assert(broke.disabled.every(Boolean),'With no coins every power-up is greyed out: '+JSON.stringify(broke.disabled));
 await coins(5000);await wait(900);
 const rich=await place('with coins again');
 assert(rich.disabled.some(d=>!d),'With coins again the power-ups can be used: '+JSON.stringify(rich.disabled));

 // 5. After all of that the tray is quiet again.
 const after=JSON.parse(await evaluate(idle));
 assert.equal(after.hits,0,'The tray is quiet again once things settle: '+JSON.stringify(after));
 assert.equal(after.clockSwaps,0,'The clock is still edited in place: '+JSON.stringify(after));
 console.log({pass:true,width,checks:'power-up tray is untouched while nothing changes, and follows resizes, a taller board and the coins running out; the clock edits its digits in place',quietStretch:{renders:quiet.renders,changes:quiet.hits,clockTextNodeSwaps:quiet.clockSwaps},afterEverything:{renders:after.renders,changes:after.hits,clockTextNodeSwaps:after.clockSwaps}});
}}).catch(e=>{console.error(e);process.exitCode=1});
