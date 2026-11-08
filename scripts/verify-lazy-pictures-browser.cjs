// The real app: opening Style > Avatars loads only the first screenful of the 300+ avatars, the rest wake as they scroll
// near, and tapping one that has not loaded yet still opens its zoom.
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
 $('toolbar-cosmetics-btn').click();
 for(let n=0;n<100&&!document.querySelector('#collection-content .collection-tile');n++)await wait(50);
 await wait(500);
 const imgs=()=>[...document.querySelectorAll('#collection-content .collection-tile img.avatar-icon')];
 const count=()=>({total:imgs().length,awake:imgs().filter(i=>i.getAttribute('src')).length,asleep:imgs().filter(i=>i.hasAttribute('data-src')).length});
 const out={first:count()};
 // A tap on a picture that has not woken up yet still finds its avatar.
 const sleeper=[...document.querySelectorAll('#collection-content .collection-tile')].find(t=>t.querySelector('img[data-src]'));
 out.sleeperId=sleeper.querySelector('img').getAttribute('data-src');
 sleeper.click();
 out.zoomOpened=!!$('avatar-zoom-overlay');
 out.zoomSrc=out.zoomOpened?$('avatar-zoom-overlay').querySelector('img').getAttribute('src'):null;
 $('avatar-zoom-overlay')?.click();
 // Scrolling to the end wakes the pictures down there.
 const panel=$('shop-tab-avatars');out.scroller=getComputedStyle(panel).overflowY;
 panel.scrollTop=panel.scrollHeight;
 for(let n=0;n<60;n++){await wait(50);const last=imgs().at(-1);if(last&&last.getAttribute('src')&&last.complete&&last.naturalWidth)break;}
 const last=imgs().at(-1);
 out.after=count();out.lastAwake=!!last.getAttribute('src');out.lastDrawn=last.complete&&last.naturalWidth>0;
 // Drawing the grid again (a filter chip) leaves the same arrangement: a screenful awake, the rest asleep.
 document.querySelector('#collection-content [data-avatar-filter="locked"]')?.click();await wait(400);
 out.filtered=count();
 return JSON.stringify(out);
})()`;
runFixture({html,widths:[390],modules:{'/__fake/app.mjs':'export const initializeApp=()=>({});','/__fake/db.mjs':dbStub,'/__fake/auth.mjs':authStub},check:async({width,evaluate})=>{
 await evaluate("new Promise(r=>{const t=()=>document.getElementById('home-screen')?.classList.contains('active')?r(true):setTimeout(t,50);t()})");
 await evaluate('new Promise(r=>setTimeout(r,800))');
 const out=JSON.parse(await evaluate(script));
 assert(out.first.total>=250,'The whole collection is drawn: '+out.first.total);
 assert(out.first.awake>=36&&out.first.awake<=130,'Only the first screenful and a little more is requested: '+out.first.awake);
 assert(out.first.asleep>=out.first.total-130&&out.first.awake+out.first.asleep===out.first.total,'The rest waits: '+JSON.stringify(out.first));
 assert(out.zoomOpened&&out.zoomSrc===out.sleeperId,'Tapping a picture that has not loaded yet still opens its zoom: '+out.sleeperId+' -> '+out.zoomSrc);
 assert.equal(out.scroller,'auto','The grid scrolls inside its panel, which is what the wake margin is measured from');
 assert(out.lastAwake&&out.lastDrawn,'Scrolling to the end wakes the last picture and it draws');
 assert(out.after.awake>out.first.awake&&out.after.awake+out.after.asleep===out.after.total,'More pictures woke as the grid scrolled: '+JSON.stringify(out.after));
 assert(out.filtered.total>0&&out.filtered.total<out.first.total&&out.filtered.awake+out.filtered.asleep===out.filtered.total,'A redrawn grid is watched afresh: '+JSON.stringify(out.filtered));
 console.log({pass:true,width,checks:'avatar collection loads a screenful, wakes the rest on scroll, taps on sleeping pictures work, redraws are watched again',first:out.first,after:out.after,filtered:out.filtered});
}}).catch(e=>{console.error(e);process.exitCode=1});
