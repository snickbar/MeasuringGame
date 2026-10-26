// Actual game summary with isolated Firebase/storage; no live player writes.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),vm=require('vm'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/\r\n/g,'\n');
const existing=fs.readFileSync(path.join(root,'scripts/verify-screen-visibility-browser.cjs'),'utf8');
const sandbox={};vm.runInNewContext(existing.slice(existing.indexOf('const dbStub='),existing.indexOf('const injected='))+';globalThis.stubs={dbStub,authStub};',sandbox);
const {dbStub,authStub}=sandbox.stubs;
const injected=String.raw`
const wbFlairCalls=[];const wbRealFlair=flairBurst;flairBurst=(el,id)=>{wbFlairCalls.push(id);return wbRealFlair(el,id);};
window.__wbSummary={
 calls:()=>wbFlairCalls,rerender:()=>renderWhichBigger(),
 ready:()=>myProfile?.stats?.gamesPlayed===8,
 show:(ok,reduced=false)=>{
  wbStop();localStorage.setItem('mg_motion',reduced?'reduce':'full');document.documentElement.dataset.motion=reduced?'reduce':'full';
  ALL_SCREEN_ELS.forEach(e=>e.classList.remove('active'));wbScreenEl.classList.add('active');
  const small=OBJECT_BY_ID.get('apple'),big=OBJECT_BY_ID.get('elephant');
  wb={...wbNewRun(),phase:'result',score:7,round:9,streak:ok?3:0,lives:ok?3:2,lossShown:true,buzzed:true,ok,picked:ok?big.id:small.id,
   pair:{left:small,right:big,smaller:small,bigger:big,ratio:big.mm/small.mm},side:{img:'icons/reactions/'+(ok?'thumbsup':'facepalm')+'.png',kind:ok?'bob':'sad'},quip:ok?'You’ve got a feel for this.':'A fresh pair is up next.'};
  myProfile.cosmetics.equipped.effects="hearts";renderWhichBigger();document.querySelectorAll("#ach-toast").forEach(e=>e.remove());window.scrollTo(0,0);
 },close:()=>{wbStop();wbScreenEl.classList.remove('active');document.getElementById('home-screen').classList.add('active');}
};
`;
let fixture=source.replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js','/__fake/app.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js','/__fake/db.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js','/__fake/auth.mjs');
fixture=fixture.replace('\n</script>\n</body>',injected+'\n</script><pre id="wb-test-result" hidden></pre>\n</body>');
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');res.setHeader('Cache-Control','no-store');
 if(url.pathname==='/test'){res.setHeader('Content-Type','text/html');res.end(fixture);return;}
 if(url.pathname.startsWith('/__fake/')){res.setHeader('Content-Type','text/javascript');res.end(url.pathname.endsWith('app.mjs')?'export const initializeApp=()=>({});':url.pathname.endsWith('db.mjs')?dbStub:authStub);return;}
 const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}
});
server.listen(0,'127.0.0.1',()=>{
 const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'wb-summary-'+process.pid),'about:blank'],{windowsHide:true});
 let stderr='',started=false,socket;const timer=setTimeout(()=>{child.kill();server.close();process.exitCode=1;},90000);
 child.stderr.on('data',async chunk=>{
  stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(started||!match)return;started=true;
  try{
   socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no});
   let serial=0;const pending=new Map();socket.onmessage=e=>{const r=JSON.parse(e.data),p=pending.get(r.id);if(!p)return;pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result)};
   const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
   const output=path.join(root,'output/which-bigger-summary');fs.mkdirSync(output,{recursive:true});
   for(const width of [320,390,520]){
    const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
    const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},sessionId);if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;};
    await call('Page.enable',{},sessionId);await call('Page.addScriptToEvaluateOnNewDocument',{source:'localStorage.clear()'},sessionId);
    await call('Emulation.setDeviceMetricsOverride',{width,height:850,deviceScaleFactor:1,mobile:true},sessionId);
    await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/test'},sessionId);
    let ready=false;for(let i=0;i<200;i++){if(await evaluate('window.__wbSummary?.ready()')){ready=true;break;}await new Promise(r=>setTimeout(r,30));}if(!ready)throw Error('App failed to load');
    for(const correct of [true,false]){
     await evaluate('window.__wbSummary.show('+correct+')');
     await evaluate(`Promise.all([...document.querySelectorAll('#wb-content img')].map(i=>i.decode()))`);
     await evaluate(`(()=>{const stage=document.querySelector('.wb-result-stage');for(const a of stage.getAnimations({subtree:true})){a.pause();a.currentTime=1600;}})()`);
     const result=await evaluate(`(()=>{const $=s=>document.querySelector(s),r=e=>e.getBoundingClientRect(),badge=r($('.wb-mark')),animal=r($('.wb-summary-elephant,.wb-summary-mouse'));return {animalsLeft:animal.right<=badge.left+2,single:document.querySelectorAll(".wb-summary-elephant,.wb-summary-mouse").length===1,aligned:Math.abs((animal.top+animal.height/2)-(badge.top+badge.height/2))<20,overflow:document.documentElement.scrollWidth>innerWidth,art:[...document.querySelectorAll('#wb-content img')].every(i=>i.complete&&i.naturalWidth>0),trunk:!!$('.wb-trunk-rig'),foot:!!$('.wb-foot-rig'),eyes:$('.wb-result-mascot').className,next:!!$('#wb-next'),measurements:/\\b(?:cm|mm|metres|meters)\\b/.test($('#wb-content').textContent)}})()`);
     if(!result.single||!result.aligned||!result.animalsLeft||result.overflow||!result.art||!result.next||result.measurements||result.trunk!==correct||result.foot===correct)throw Error(JSON.stringify({width,correct,...result}));
     const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(output,(correct?'correct':'wrong')+'-'+width+'.png'),Buffer.from(shot.data,'base64'));
     if(width===390)for(const time of [0,1000,3400]){
      await evaluate(`document.querySelector('.wb-result-mascot').getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=${time};})`);
      const pose=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(output,(correct?'elephant':'mouse')+'-pose-'+time+'.png'),Buffer.from(pose.data,'base64'));
     }
    }
    await evaluate('window.__wbSummary.show(true)');
    const motion=await evaluate(`(()=>{const stage=document.querySelector('.wb-result-mascot'),eyes=document.querySelector('.wb-closed-eyes'),tail=document.querySelector('.wb-tail-rig');const at=t=>{stage.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=t;});return {eyes:getComputedStyle(eyes).opacity,tail:getComputedStyle(tail).transform,water:[...stage.querySelectorAll('.wb-water-drop')].filter(e=>+getComputedStyle(e).opacity>.1).length};};return [at(0),at(1600),at(3400)];})()`);
    if(motion[0].eyes!=='0'||motion[1].eyes!=='1'||motion[2].eyes!=='0'||motion[1].water<30||motion[0].tail===motion[1].tail)throw Error('Eye/spray/tail timing '+JSON.stringify(motion));
    const before=await evaluate('window.__wbSummary.calls().length');
    if(await evaluate('window.__wbSummary.calls().at(-1)')!=='hearts')throw Error('Equipped flair not used');
    await evaluate('window.__wbSummary.rerender()');if(await evaluate('window.__wbSummary.calls().length')!==before)throw Error('Duplicate flair');
    await evaluate('window.__wbSummary.show(false,true)');
    const reduced=await evaluate(`[...document.querySelectorAll('.wb-trunk-rig,.wb-foot-rig,.wb-angry-sign,.wb-mouse-body')].every(e=>getComputedStyle(e).animationName==='none')`);if(!reduced)throw Error('Reduced motion');
    await evaluate('document.getElementById("wb-next").click()');if(await evaluate('!!document.querySelector(".wb-result-mascot")'))throw Error('Summary retained after advancing');
    await evaluate('window.__wbSummary.show(true);document.getElementById("wb-next").click()');
    if(await evaluate('!!document.querySelector("[data-wb-flair]")'))throw Error('Flair remained after advancing');
    const calls=await evaluate('window.__wbSummary.calls().length');await evaluate('window.__wbSummary.show(false)');
    if(await evaluate('window.__wbSummary.calls().length')!==calls)throw Error('Wrong answer played flair');
    await evaluate('window.__wbSummary.show(true);window.__wbSummary.close()');
    if(await evaluate('!!document.querySelector("[data-wb-flair]")'))throw Error('Flair remained after closing');
    if(!await evaluate(`[...document.querySelectorAll('.wb-water-drop')].every(e=>getComputedStyle(e).animationPlayState==='paused')`))throw Error('Hidden motion still running');
    console.log(JSON.stringify({width,pass:true,checks:'Both results, real artwork, one animal beside centered badge, eye/spray timing, tail sway, equipped flair once, next round, no measurements, reduced/hidden motion'}));
    await call('Target.closeTarget',{targetId});
   }
  }catch(e){console.error(e);process.exitCode=1}finally{clearTimeout(timer);socket?.close();child.kill();server.close();}
 });
});
