// Render actual result helpers without Firebase or changes to player profiles.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=source.match(/<style>([\s\S]*?)<\/style>/)[1];
const toolbar=source.slice(source.indexOf('<div id="app-toolbar">'),source.indexOf('<div id="toolbar-menu"'));
const extract=name=>{const start=source.indexOf('  function '+name+'(');if(start<0)throw Error(name);return source.slice(start,source.indexOf('\n  }',start)+4)};
const test=`
import {bufferedGuess} from '/anim/powerups.mjs';
import {roundAccuracy,formatAccuracy} from '/anim/accuracy.mjs';
${source.match(/  const MARK_LEVELS = .*;/)[0]}
${source.match(/  const markLevel = .*;/)[0]}
${['effectiveGuess','bufferResultNote','markSvg','resultCardHtml','svShowResult','revealPaperHtml','revealInfoHtml'].map(extract).join('\n')}
${source.match(/  const PAPER_STYLES = .*;/)[0]}
const currentPlayers={me:{frameIndex:3}},handNumberHtml=n=>'<span style="position:absolute;inset:0;display:grid;place-items:center;font-size:40px">'+n+'</span>';
const accLabel=a=>a>=99?'Spot on!':a>=90?'So close!':a>=70?'Nice guess':a>=40?'In the neighborhood':'Way off';
const assert=(v,m)=>{if(!v)throw Error(m)},q={answer:45,powerups:{owner:'me',used:{buffer:true}}};
const SURVIVAL_PASS=60,deviceId='me';let sv,roomState={currentQuestion:q};
const svGaugeHtml=acc=>'<div class="dc-note">'+formatAccuracy(acc)+'% accurate · safe at 60%</div>';
 const svRunAcc=()=>null,svAccHtml=()=>'',avatarHtml=()=>'<img class="avatar-icon" src="/avatars/av01.png" alt="Player">';
try{
 assert(!bufferResultNote(q,35,'other'),'not another player’s buffer');
 assert(!bufferResultNote({answer:45},35,'me'),'no boost when unused');
 const html=resultCardHtml(roundAccuracy(39.5/45),35,'45',null,q,'me');
 assert(!html.includes('Smart move!')&&!html.includes('10% BUFFER BOOST')&&html.includes('77.8%')&&html.includes('87.8%'),'compact boost without headline');
 assert(html.includes('39.5')&&!html.includes('accuracy points!')&&!html.includes('Before buffer</span>'),'counted guess without repeated labels');
 assert(!resultCardHtml(80,80,'100').includes('pu-result-note'),'ordinary results preserved');
 const exact={answer:100,powerups:{owner:'me',used:{buffer:true}}};
 const clamped=bufferResultNote(exact,95,'me');assert(clamped.includes('100%')&&!clamped.includes('accuracy points!'),'stop at exact');
 assert(bufferResultNote(exact,100,'me').includes('Already spot on'),'no false benefit for exact guesses');
 document.getElementById('wl-result').innerHTML=html;
 assert(document.querySelector('#wl-result .dc-card>.pu-result-note'),'Worlds boost inside main card');
 assert(document.querySelectorAll('#wl-result .pu-boost-accuracy>.pu-result-icon').length===1,'single buffer icon beside accuracy');
 const compactHeight=document.querySelector('#wl-result .dc-card').getBoundingClientRect().height;
 assert(compactHeight<260,'compact result height: '+compactHeight);
 const preview=document.getElementById('quick-preview');
 const bufferedEntry={guess:35,playerId:'me',accuracyPercent:roundAccuracy(39.5/45),bufferUsed:true,pickedBy:[{avatar:'av01'}]};
 preview.innerHTML=revealPaperHtml(bufferedEntry,true,false)+revealInfoHtml(bufferedEntry);
 assert(!preview.querySelector('.acc-badge')&&!preview.querySelector('.rv-badges'),'no duplicate accuracy pill');
 assert(preview.querySelector('.pu-result-note .pickedby-avatars'),'picker avatars stay inside attached details');
 for(let frame=0;frame<PAPER_STYLES.length;frame++){
  currentPlayers.me.frameIndex=frame;
  preview.querySelector('.rv-paper').outerHTML=revealPaperHtml(bufferedEntry,true,false);
  const paper=preview.querySelector('.rv-paper').getBoundingClientRect(),note=preview.querySelector('.pu-result-note').getBoundingClientRect();
  assert(note.top<paper.bottom&&note.top>paper.bottom-18,'details overlap bottom of paper style '+frame);
 }
 assert(revealInfoHtml({accuracyPercent:50}).includes('acc-badge'),'ordinary result pills retained');
 assert(!preview.textContent.includes('points with your boosted guess')&&!preview.querySelector('.pu-boost-gain'),'no repeated points or gain message');
 assert(preview.querySelector('.pu-result-note').getBoundingClientRect().height<130,'compact even in a narrow reveal column');
 const boostIcon=preview.querySelector('.pu-boost-accuracy > .pu-result-icon');
 assert(getComputedStyle(boostIcon).gridRow==='1 / span 2'&&boostIcon.getBoundingClientRect().height>=36,'icon spans both related rows');
 sv={q:exact,g:55,lives:3,accs:[],lossPending:false};svShowResult(null);
 assert(document.querySelector('#sv-result .dc-card>.pu-result-note'),'Survival boost inside main card');
 assert(document.getElementById('sv-result').textContent.includes('Safe with buffer!'),'Survival result explained');
 for(const host of [document.getElementById('wl-result'),document.getElementById('sv-result'),preview]){
  assert(host.scrollWidth<=host.clientWidth+(host===preview?12:0),'result fits phone width (including avatar stamp overhang)');
  for(const el of host.querySelectorAll('.pu-result-note,.pu-boost-head,.pu-boost-accuracy,.pu-boost-counted,.pu-boost-score')){
   if(getComputedStyle(el).display==='contents')continue;
   const r=el.getBoundingClientRect(),h=host.getBoundingClientRect();
   assert(r.left>=h.left-1&&r.right<=h.right+1,'boost stays inside card');
  }
 }
 document.getElementById('quick-test').hidden=true;document.getElementById('survival-content').hidden=true;
 document.getElementById('result').textContent=JSON.stringify({pass:true,width:innerWidth,results:['Worlds','Survival','Quick Game'],original:77.8,boosted:87.8});
}catch(e){document.getElementById('result').textContent=JSON.stringify({pass:false,error:e.stack})}
`;
const fixture='<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap" rel="stylesheet"><style>'+css+' #quick-test{width:calc(100vw - 230px);max-width:190px;margin:20px auto} #quick-test ul{padding:0;margin:0} #quick-test[hidden],#survival-content[hidden]{display:none!important}</style></head><body>'+toolbar+'<div id="worlds-screen" class="screen active"><div id="worlds-content"><h2 class="dc-title">Tiny Things · Level 5</h2><p class="dc-sub">Question 4 of 5</p><p class="dc-prompt">How many poppy seeds across is the length of a cork?</p><div style="text-align:center"><img src="/items/cork.webp" alt="Cork" style="height:100px"></div><div id="wl-result"></div><button class="dc-btn" type="button">Next question</button><div id="survival-content"><div id="sv-result"></div><button id="sv-skip">Skip</button></div><div id="quick-test"><ul><li class="reveal-card" id="quick-preview"></li></ul></div></div></div><pre id="result" hidden></pre><script type="module">'+test+'</script></body></html>';
const server=http.createServer((req,res)=>{
 if(req.url==='/test'){res.setHeader('Content-Type','text/html');res.end(fixture);return}
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{res.setHeader('Content-Type',({'.mjs':'text/javascript','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404);res.end()}
});
server.listen(0,'127.0.0.1',()=>{
 const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'buffer-results-'+process.pid),'about:blank'],{windowsHide:true});
 let stderr='',started=false,socket;const timer=setTimeout(()=>{child.kill();server.close();process.exitCode=1},45000);
 child.stderr.on('data',async chunk=>{
  stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(started||!match)return;started=true;
  try{
   socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no});
   let serial=0;const pending=new Map();socket.onmessage=e=>{const r=JSON.parse(e.data),p=pending.get(r.id);if(!p)return;pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result)};
   const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}))});
   const out=path.join(root,'output','buffer-result-tests');fs.mkdirSync(out,{recursive:true});
   for(const width of [320,390,430]){
    const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
    await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true},sessionId);
    await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/test'},sessionId);
    let result;
    for(let n=0;n<250;n++){
     const value=await call('Runtime.evaluate',{expression:'document.getElementById("result")?.textContent',returnByValue:true},sessionId);
     if(value.result?.value){result=JSON.parse(value.result.value);break}await new Promise(r=>setTimeout(r,20));
    }
    if(!result)throw Error('No browser result');console.log(result);if(!result.pass)throw Error(result.error);
    await call('Runtime.evaluate',{expression:'document.fonts.ready',awaitPromise:true},sessionId);
    const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(out,'worlds-'+width+'.png'),Buffer.from(shot.data,'base64'));
    await call('Target.closeTarget',{targetId});
   }
  }catch(e){console.error(e);process.exitCode=1}finally{clearTimeout(timer);socket?.close();child.kill();server.close()}
 });
});
