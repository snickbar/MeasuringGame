// Actual game styles and motion effects; isolated from Firebase.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=source.match(/<style>([\s\S]*?)<\/style>/)[1].replace(/url\((['"]?)(icons|avatars|backgrounds)\//g,'url($1/$2/');
const markup=`<div class="demo"><h2>Game animation preview</h2><p>Try the effects below. Object entrances and the winner dance stay as they are.</p>
<button id="toolbar-coin-balance"><img id="toolbar-coin-icon" src="/icons/toolbar-coin.png"><span id="toolbar-coin-box"><span id="toolbar-coin-count">100</span></span></button>
<div id="hud-timer" class="hud-timer">5</div><div class="score-col">${['You','Bot 1','Bot 2','Bot 3'].map((name,i)=>`<div class="score-card frame-1"><span class="avatar"><img class="avatar-icon" src="/avatars/av0${i+1}.png"></span><div class="sc-top"><span class="name">${name}</span></div><div class="sc-bot"><span class="medal gold"></span><span class="pts">${12-i*3}</span></div></div>`).join('')}</div>
<div class="controls"><button class="demo-btn" id="submit-demo">Submit guess</button><button class="demo-btn" id="lead-demo">Take first</button><button class="demo-btn" id="coin-demo">Earn coins</button><button class="demo-btn" id="timer-demo">Low timer</button></div></div><pre id="result" hidden></pre>`;
const tests=`
import {playSubmissionBounce,celebrateLead,sparkleCoins} from '/anim/game-motion.mjs';
const cards=[...document.querySelectorAll('.score-card')],coin=document.getElementById('toolbar-coin-balance'),timer=document.getElementById('hud-timer');
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
document.getElementById('submit-demo').onclick=()=>cards.forEach((c,i)=>setTimeout(()=>playSubmissionBounce(c,reduced()),i?150+Math.random()*1300:0));
document.getElementById('lead-demo').onclick=()=>celebrateLead(cards[0],reduced());
document.getElementById('coin-demo').onclick=()=>{document.getElementById('toolbar-coin-count').textContent=Number(document.getElementById('toolbar-coin-count').textContent)+5;sparkleCoins(coin,reduced())};
document.getElementById('timer-demo').onclick=()=>timer.classList.toggle('low');
if(location.pathname==='/test')try{
 const assert=(v,m)=>{if(!v)throw Error(m)},wait=ms=>new Promise(r=>setTimeout(r,ms));
 await Promise.all([...document.images].map(img=>img.decode()));
 cards.forEach(c=>c.getAnimations().forEach(a=>a.cancel()));
 const before=cards[0].getBoundingClientRect();
 playSubmissionBounce(cards[0]);
 const bounce=cards[0].querySelector('.avatar').getAnimations()[0];
 assert(bounce?.effect.getTiming().duration===420,'submission bounce duration');
 await bounce.finished;
 assert(Math.abs(cards[0].getBoundingClientRect().top-before.top)<1,'bounce leaves card layout stable');
 playSubmissionBounce(cards[1],true);assert(!cards[1].querySelector('.avatar').getAnimations().length,'reduced motion skips bounce');
 sparkleCoins(coin);assert(coin.querySelectorAll('.coin-sparkle').length===5,'coin sparkle created');
 await wait(1100);assert(!coin.querySelector('.coin-sparkle'),'sparkle cleans itself up');
 sparkleCoins(coin,true);assert(!coin.querySelector('.coin-sparkle'),'reduced motion skips sparkle');
 celebrateLead(cards[0]);assert(cards[0].textContent.includes('Took the lead!'),'new leader label');
 const label=cards[0].querySelector('.lead-celebration').getBoundingClientRect(),card=cards[0].getBoundingClientRect();
 assert(label.left>=card.left&&label.right<=card.right&&label.top>=card.top,'label fits compact card');
 timer.classList.add('low');assert(getComputedStyle(timer).animationName==='timerUrgency','timer urgency style');
 timer.classList.add('timer-paused');assert(getComputedStyle(timer).animationPlayState==='paused','pause freezes warning');
 await wait(2300);assert(!cards[0].querySelector('.lead-celebration'),'leader label cleans itself up');
 assert(document.documentElement.scrollWidth<=innerWidth,'no horizontal overflow');
 document.getElementById('result').textContent=JSON.stringify({pass:true,width:innerWidth,checks:'motion effects, cleanup, reduced motion, mobile layout and paused timer'});
}catch(e){document.getElementById('result').textContent=JSON.stringify({pass:false,error:e.stack})}
`;
const extra=`body{display:block;padding:16px;box-sizing:border-box;background:#faf3df}.demo{max-width:400px;margin:auto}.demo #toolbar-coin-balance{margin:12px}.demo .score-col{width:160px;overflow:visible}.demo .hud-timer{margin:16px}.demo button.demo-btn{display:block;margin:12px 0;padding:12px;border:2px solid #684725;border-radius:16px;background:#ffcf61;color:#452b17}.demo .controls{display:flex;gap:8px;flex-wrap:wrap}.demo h2{font:700 24px sans-serif}.demo p{font:14px sans-serif}`;
const fixture='<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style><style>'+extra+'</style></head><body>'+markup+'<script type="module">'+tests+'</script></body></html>';
fs.mkdirSync(path.join(root,'output','game-motion'),{recursive:true});
fs.writeFileSync(path.join(root,'output','game-motion','index.html'),fixture);
const server=http.createServer((req,res)=>{
 if(req.url==='/test'){res.setHeader('Content-Type','text/html');res.end(fixture);return}
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{res.setHeader('Content-Type',({'.mjs':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404);res.end()}
});
server.listen(0,'127.0.0.1',()=>{
 const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'game-motion-tests-'+process.pid),'about:blank'],{windowsHide:true});
 let stderr='',started=false,socket;const timer=setTimeout(()=>{child.kill();server.close();process.exitCode=1},45000);
 child.stderr.on('data',async chunk=>{
  stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(started||!match)return;started=true;
  try{
   socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no});
   let serial=0;const pending=new Map();socket.onmessage=e=>{const r=JSON.parse(e.data),p=pending.get(r.id);if(!p)return;pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result)};
   const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}))});
   fs.mkdirSync(path.join(root,'output','game-motion-tests'),{recursive:true});
   for(const width of [320,390,430]){
    const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
    await call('Emulation.setDeviceMetricsOverride',{width,height:740,deviceScaleFactor:1,mobile:true},sessionId);
    await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/test'},sessionId);
    let result;
    for(let n=0;n<500;n++){
     const value=await call('Runtime.evaluate',{expression:'document.getElementById("result")?.textContent',returnByValue:true},sessionId);
     if(value.result?.value){result=JSON.parse(value.result.value);break}await new Promise(r=>setTimeout(r,20));
    }
    if(!result)throw Error('No browser result at '+width);
    console.log(result);if(!result.pass)throw Error(result.error);
    await call('Runtime.evaluate',{expression:'document.fonts.ready',awaitPromise:true},sessionId);
    const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(root,'output','game-motion-tests','motion-'+width+'.png'),Buffer.from(shot.data,'base64'));
    await call('Target.closeTarget',{targetId});
   }
  }catch(e){console.error(e);process.exitCode=1}finally{clearTimeout(timer);socket?.close();child.kill();server.close()}
 });
});

