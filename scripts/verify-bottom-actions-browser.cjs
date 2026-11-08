// The real app's bottom button bar: showing and hiding its buttons with inline `style.display`, exactly
// as the game does, must still pick the same three layouts (empty, solo reveal row, final results row).
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {runFixture}=require('./browser-fixture.cjs');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/\r\n/g,'\n');
const existing=fs.readFileSync(path.join(root,'scripts/verify-game-polish-browser.cjs'),'utf8');
const sandbox={};vm.runInNewContext(existing.slice(existing.indexOf('const dbStub='),existing.indexOf('let checks='))+';globalThis.parts={dbStub,authStub};',sandbox);
const {dbStub,authStub}=sandbox.parts;
const html=source.replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js','/__fake/app.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js','/__fake/db.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js','/__fake/auth.mjs');
const script=String.raw`(async()=>{
 const $=id=>document.getElementById(id),tick=()=>new Promise(r=>setTimeout(r,0));
 const ids=['hud-auto-toggle','reveal-next-btn','reveal-all-btn','show-summary-btn','next-round-btn','play-again-btn','final-home-btn','final-double-coins-btn'];
 const bar=$('bottom-actions');$('bottom-toolbar').classList.add('active');
 const style=document.createElement('style');style.textContent='*{transition:none!important;animation:none!important}';document.head.append(style);
 const show=async(...on)=>{ids.forEach(id=>{$(id).style.display=on.includes(id)?'flex':'none'});await tick();};
 const css=(el,p)=>getComputedStyle(typeof el==='string'?$(el):el)[p];
 const attrs=()=>[...bar.attributes].map(a=>a.name).filter(n=>n.startsWith('data-bar'));
 const out={initial:attrs()};
 await show();
 out.empty={display:css(bar,'display'),height:bar.getBoundingClientRect().height,attrs:attrs()};
 await show('hud-auto-toggle','reveal-next-btn','reveal-all-btn');
 out.reveal={display:css(bar,'display'),align:css(bar,'alignItems'),autoMin:css('hud-auto-toggle','minWidth'),autoGrow:css('hud-auto-toggle','flexGrow'),nextWhite:css('reveal-next-btn','whiteSpace'),nextFont:css('reveal-next-btn','fontSize'),allFont:css('reveal-all-btn','fontSize'),maxWidth:css('reveal-all-btn','maxWidth'),attrs:attrs()};
 await show('play-again-btn','final-home-btn','final-double-coins-btn');
 out.final={display:css(bar,'display'),align:css(bar,'alignItems'),maxWidth:css('final-home-btn','maxWidth'),basis:css('final-home-btn','flexBasis'),attrs:attrs()};
 await show('next-round-btn');
 out.lone={display:css(bar,'display'),align:css(bar,'alignItems'),maxWidth:css('next-round-btn','maxWidth'),attrs:attrs()};
 // A change and its read in the same script: the bar settles before the next style calculation after the script ends.
 $('final-home-btn').style.display='flex';await Promise.resolve();
 out.afterMicrotask=attrs();
 await show();
 out.backToEmpty={display:css(bar,'display'),attrs:attrs()};
 return JSON.stringify(out);
})()`;
runFixture({html,widths:[390,320],modules:{'/__fake/app.mjs':'export const initializeApp=()=>({});','/__fake/db.mjs':dbStub,'/__fake/auth.mjs':authStub},check:async({width,evaluate})=>{
 await evaluate("new Promise(r=>{const t=()=>document.getElementById('home-screen')?.classList.contains('active')?r(true):setTimeout(t,50);t()})");
 await evaluate('new Promise(r=>setTimeout(r,800))');
 const out=JSON.parse(await evaluate(script));
 assert.deepEqual(out.initial,['data-bar-empty'],'Bar starts empty at home');
 assert.deepEqual(out.empty,{display:'none',height:0,attrs:['data-bar-empty']},'Nothing showing: the bar takes no space');
 assert.deepEqual(out.reveal,{display:'flex',align:'center',autoMin:'72px',autoGrow:'0',nextWhite:'nowrap',nextFont:'13px',allFont:'13px',maxWidth:'260px',attrs:['data-bar-reveal']},'Solo reveal row: small Auto, single-line Reveal buttons');
 assert.deepEqual(out.final,{display:'flex',align:'stretch',maxWidth:'none',basis:'0px',attrs:['data-bar-final']},'Final results row: equal-width stretched buttons');
 assert.deepEqual(out.lone,{display:'flex',align:'center',maxWidth:'260px',attrs:[]},'A single button keeps the default layout');
 assert.deepEqual(out.afterMicrotask,['data-bar-final'],'The switches follow a button change before the page next paints');
 assert.deepEqual(out.backToEmpty,{display:'none',attrs:['data-bar-empty']},'Hiding every button empties the bar again');
 console.log({pass:true,width,checks:'bottom bar empty / reveal / final / default layouts follow the buttons\' inline display'});
}}).catch(e=>{console.error(e);process.exitCode=1});
