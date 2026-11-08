// The real app, party rooms: the host picks each round's question board and writes it to the room, and the question card shows that board.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {runFixture}=require('./browser-fixture.cjs');
const {restyleRates,assertOffMainThread}=require('./restyle-rate.cjs');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/\r\n/g,'\n');
const existing=fs.readFileSync(path.join(root,'scripts/verify-game-polish-browser.cjs'),'utf8');
const sandbox={};vm.runInNewContext(existing.slice(existing.indexOf('const dbStub='),existing.indexOf('let checks='))+';globalThis.parts={dbStub,authStub};',sandbox);
const {authStub}=sandbox.parts;
// The host owns and has equipped one board, the chalkboard, which is not what a player with nothing equipped would get.
const seed="cosmetics:{owned:{homeScreens:{ants:true}},equipped:{homeScreen:'ants'}}";
assert(sandbox.parts.dbStub.includes(seed),'The test profile has the cosmetics seed this test replaces');
const dbStub=sandbox.parts.dbStub.replace(seed,"cosmetics:{owned:{homeScreens:{ants:true},boards:{chalkboard:true}},equipped:{homeScreen:'ants',board:'chalkboard'}}");
const html=source.replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js','/__fake/app.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js','/__fake/db.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js','/__fake/auth.mjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
// Starts a Quick game against bots the way a player does and waits for the question phase.
const startQuick=String.raw`(async()=>{
 const $=id=>document.getElementById(id),wait=ms=>new Promise(r=>setTimeout(r,ms));
 for(const id of ['menu-tour','mode-tutorial']){const d=$(id);if(d&&d.open)d.close();}
 await wait(500);$('home-solo-btn').click();await wait(900);$('sh-quick').click();await wait(900);$('create-room-btn').click();await wait(2500);
 const n=$('name-input');if(n&&$('name-avatar-screen').classList.contains('active')){n.value='Tester';n.dispatchEvent(new Event('input',{bubbles:true}));$('name-avatar-random')?.click();}
 await wait(500);$('join-lobby-btn')?.click();await wait(2500);$('host-start-btn').click();
 for(let i=0;i<80;i++){await wait(400);if($('hud').classList.contains('active')&&/^\d+$/.test($('hud-timer')?.textContent||''))return true;}
 return false;
})()`;
// The saved local room (rooms are kept in localStorage) and the board the question card is showing.
const look=String.raw`(()=>{
 const rooms=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);let v;try{v=JSON.parse(localStorage.getItem(k))}catch{continue}
  const walk=o=>{if(o&&typeof o==='object'){if(o.phase&&o.currentQuestion)rooms.push(o);else Object.values(o).forEach(walk)}};walk(v);}
 return JSON.stringify({boards:rooms.map(r=>r.board),shown:document.getElementById('question-prompt')?.dataset.board||null});
})()`;
runFixture({html,widths:[390],height:844,modules:{'/__fake/app.mjs':'export const initializeApp=()=>({});','/__fake/db.mjs':dbStub,'/__fake/auth.mjs':authStub},check:async({width,evaluate})=>{
 await evaluate("new Promise(r=>{const t=()=>document.getElementById('home-screen')?.classList.contains('active')?r(true):setTimeout(t,50);t()})");
 await evaluate('new Promise(r=>setTimeout(r,1500))');
 assert.equal(await evaluate(startQuick),true,'A Quick game reaches its first question');
 await wait(800);
 const seen=JSON.parse(await evaluate(look));
 // 1. The host wrote the round's board into the room, so every phone can show the same one.
 assert.equal(seen.boards.length,1,'The room is saved once: '+JSON.stringify(seen));
 assert.equal(typeof seen.boards[0],'string','The host wrote a board for the round into the room: '+JSON.stringify(seen));
 // 2. The question card shows the room's board.
 assert.equal(seen.boards[0],'chalkboard','The room uses the board the host has equipped: '+JSON.stringify(seen));
 assert.equal(seen.shown,'chalkboard','The question card shows the room\'s board: '+JSON.stringify(seen));
 console.log({pass:true,width,roomBoard:seen.boards[0],shown:seen.shown});
}}).catch(e=>{console.error(e);process.exitCode=1});
