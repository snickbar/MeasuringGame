const fs=require('fs'),path=require('path');let runner=fs.readFileSync(path.join(__dirname,'verify-game-polish-browser.cjs'),'utf8');
runner=runner.replace('window.__polish={',`window.__polish={
 objectCardDemo:()=>{ALL_SCREEN_ELS.forEach(s=>s.classList.remove('active'));hsScreenEl.classList.add('active');hsContentEl.innerHTML='<div class="hs-q"><div class="dc-pics"><div class="dc-pic"><img src="items/airliner.webp"><span>Great white shark with a longer name</span></div><div class="dc-pic"><img src="items/palm-tree.webp"><span>Palm tree</span></div></div></div>';},`);
const start=runner.indexOf('let checks=String.raw`'),end=runner.indexOf('let fixture=',start);
runner=runner.slice(0,start)+`let checks=String.raw\`
<pre id="polish-result" hidden></pre><script type="module">
const wait=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m)};
try{for(let i=0;i<300&&!window.__polish?.profile()?.stats?.gamesPlayed;i++)await wait(20);window.__polish.objectCardDemo();await document.fonts.ready;await wait(100);
 const cards=[...document.querySelectorAll('#hs-content .dc-pic')],a=cards[0].getBoundingClientRect(),b=cards[1].getBoundingClientRect();assert(Math.abs(a.width-b.width)<1&&Math.abs(a.height-b.height)<1,'Equal card dimensions despite differently wrapped names');assert(Math.abs(a.top-b.top)<1&&Math.abs(a.bottom-b.bottom)<1,'Top and bottom aligned');assert(cards[0].querySelector('span').getBoundingClientRect().height>cards[1].querySelector('span').getBoundingClientRect().height,'Test actually has different label heights');
 assert(document.documentElement.scrollWidth<=innerWidth+1,'Phone fits');document.getElementById('polish-result').textContent=JSON.stringify({pass:true,width:innerWidth,checks:'Actual High Stakes card styles, equal widths/heights with long versus short names, aligned edges and phone fit'});
}catch(e){document.getElementById('polish-result').textContent=JSON.stringify({pass:false,error:String(e),stack:e.stack});}
</script>\`;
`+runner.slice(end);
runner=runner.replaceAll("'polish-tests-'","'object-card-tests-'").replace("['stats','world','survival','lobby','quickLobby','objects']","['objectCardDemo']");
new Function('require','__dirname',runner)(require,__dirname);
