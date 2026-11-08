// The real app: the numbers on the Awards screen count up by editing their text in place (no new text node per frame),
// and they end on exactly the numbers the screen shows when it is drawn without the count-up.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {runFixture}=require('./browser-fixture.cjs');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/\r\n/g,'\n');
const existing=fs.readFileSync(path.join(root,'scripts/verify-game-polish-browser.cjs'),'utf8');
const sandbox={};vm.runInNewContext(existing.slice(existing.indexOf('const dbStub='),existing.indexOf('let checks='))+';globalThis.parts={dbStub,authStub};',sandbox);
const {dbStub,authStub}=sandbox.parts;
const html=source.replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js','/__fake/app.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js','/__fake/db.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js','/__fake/auth.mjs');
const script=String.raw`(async()=>{
 const $=id=>document.getElementById(id),wait=ms=>new Promise(r=>setTimeout(r,ms));
 for(const d of document.querySelectorAll('dialog[open]'))d.close();
 const content=$('career-content');
 const numbers=()=>[...content.querySelectorAll('.cs-tile')].map(t=>{const n=t.querySelector('strong,.cs-num');return n?n.textContent:null;});
 const log={child:0,chars:0};
 const watcher=new MutationObserver(list=>{for(const r of list){if(r.type==='childList')log.child++;else if(r.type==='characterData')log.chars++;}});
 watcher.observe(content,{childList:true,characterData:true,subtree:true});
 $('toolbar-awards-btn').click();
 for(let n=0;n<100&&!content.querySelector('.cs-tile');n++)await wait(50);
 const out={tiles:content.querySelectorAll('.cs-tile').length};
 await wait(1200);
 // A tile waits at zero until it scrolls into view, so bring each one up in turn, then let the last count-up finish.
 for(const t of content.querySelectorAll('.cs-tile')){t.scrollIntoView({block:'center'});await wait(60);}
 await wait(1800); // longer than the count-up (0.9 s) plus the stagger
 watcher.takeRecords().forEach(r=>{if(r.type==='childList')log.child++;else if(r.type==='characterData')log.chars++;});
 watcher.disconnect();
 out.log=log;out.counted=numbers();
 // Leave and come back within a few seconds: the same screen is drawn without the count-up, so these are the true numbers.
 $('toolbar-home-btn').click();await wait(300);
 $('toolbar-awards-btn').click();await wait(400);
 out.plain=numbers();
 return JSON.stringify(out);
})()`;
runFixture({html,widths:[390],modules:{'/__fake/app.mjs':'export const initializeApp=()=>({});','/__fake/db.mjs':dbStub,'/__fake/auth.mjs':authStub},check:async({width,evaluate})=>{
 await evaluate("new Promise(r=>{const t=()=>document.getElementById('home-screen')?.classList.contains('active')?r(true):setTimeout(t,50);t()})");
 await evaluate('new Promise(r=>setTimeout(r,800))');
 const out=JSON.parse(await evaluate(script));
 assert(out.tiles>=3,'The Awards screen draws its tiles: '+out.tiles);
 assert(out.counted.some(text=>/[1-9]/.test(text||'')),'Some tile has a number above zero to count up to: '+JSON.stringify(out.counted));
 assert.deepEqual(out.counted,out.plain,'The count-up ends on the numbers the screen shows without it');
 assert(out.log.chars>=50,'The numbers were edited in place while counting: '+JSON.stringify(out.log));
 assert(out.log.child<=2*out.tiles+20,'No new text node per frame (only the draw, the start at zero and the restore): '+JSON.stringify(out.log)+' for '+out.tiles+' tiles');
 console.log({pass:true,width,checks:'Awards count-up edits numbers in place and ends on the true numbers',tiles:out.tiles,mutations:out.log});
}}).catch(e=>{console.error(e);process.exitCode=1});
