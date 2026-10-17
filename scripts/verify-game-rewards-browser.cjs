// Uses the real reward controller, game stylesheet, toolbar, and test-ad dialog
// with an isolated profile. No Firebase connection or real player data.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=source.match(/<style>([\s\S]*?)<\/style>/)[1];
const toolbar=source.slice(source.indexOf('<div id="app-toolbar">'),source.indexOf('<div id="exit-confirm-overlay">'));
const extract=name=>{const start=source.indexOf('  function '+name+'('),end=source.indexOf('\n  }',start);if(start<0||end<0)throw Error('Missing '+name);return source.slice(start,end+4)};
const tests=`
import {createGameRewards} from '/anim/game-rewards.mjs';
${extract('showFakeAd')}
const assert=(v,m)=>{if(!v)throw Error(m)},tick=()=>new Promise(r=>setTimeout(r,0));
const wait=async(test)=>{for(let n=0;n<200;n++){if(test())return;await new Promise(r=>setTimeout(r,20))}throw Error('Timed out')};
let profile={coins:100},controller,ads=0,finishes=0,mode=true,fail=false,lostResponse=false;
const store=new Map(),storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
const transaction=async(_,change)=>{
 await tick();if(fail)throw Error('offline');
 const updated=change(structuredClone(profile));if(updated)profile=updated;
 if(lostResponse){lostResponse=false;throw Error('response lost after commit')}
 return {snapshot:{val:()=>structuredClone(profile)}};
};
function create(){document.getElementById('coin-reward-screen')?.remove();return controller=createGameRewards({owner:()=> 'test-profile',transaction,storage,ad:async()=>{ads++;return mode==='real'?showFakeAd():mode},finish:async()=>{finishes++}})}
const b=s=>controller.element.querySelector(s),idle=()=>wait(()=>!b('[data-continue]').disabled);
try{
 for(const score of [0,2,4,5,8,20]){
  create();await controller.prepare({key:'ROOM_'+score,score});
  assert(!controller.active,'summary remains before receipt');controller.open();
  const base=Math.max(5,score);assert(Number(b('[data-total]').textContent)===base,'base '+score);
  assert(b('[data-minimum-row]').hidden===(score>=5),'minimum line');
  assert(document.getElementById('app-toolbar').inert,'toolbar disabled');
  b('[data-double]').click();b('[data-double]').click();await idle();
  assert(Number(b('[data-total]').textContent)===base*2,'doubled once');
  assert(ads===finishes+1,'double tap shows one ad');
  b('[data-continue]').click();b('[data-continue]').click();await tick();await tick();
  assert(!controller.active,'finished returns home');
  assert(!document.getElementById('app-toolbar').inert,'toolbar restored');
 }
 assert(profile.coins===100+2*(5+5+5+5+8+20),'only expected coins credited');
 // Skipping and canceling ads preserve the base reward.
 create();await controller.prepare({key:'ROOM_skip',score:2});controller.open();mode=false;
 const before=profile.coins;b('[data-double]').click();await idle();assert(profile.coins===before,'canceled ad grants nothing');
 b('[data-continue]').click();await tick();await tick();assert(!controller.active,'continue without ad');
 // Reload before opening the receipt: restore it, without repeating base coins.
 create();await controller.prepare({key:'ROOM_reload',score:20});const reloadedBalance=profile.coins;
 create();await controller.recover();assert(controller.active&&profile.coins===reloadedBalance,'reload recovers receipt once');
 mode=true;lostResponse=true;b('[data-double]').click();await idle();const afterLost=profile.coins,adsBeforeRetry=ads;
 assert(afterLost===reloadedBalance+20,'ad committed before lost response');
 b('[data-double]').click();await idle();assert(profile.coins===afterLost&&ads===adsBeforeRetry,'retry neither credits nor watches again');
 // Reload with completed ad intent also recovers without an additional ad.
 create();await controller.recover();assert(profile.coins===afterLost&&b('[data-double]').hidden,'doubled receipt survives reload');
 b('[data-continue]').click();await tick();await tick();
 // A failed base credit can be retried without leaving or losing the receipt.
 create();fail=true;await controller.prepare({key:'ROOM_offline',score:0});controller.open();await idle();
 assert(!b('[data-continue]').disabled&&!b('[data-status]').textContent.includes('Please wait'),'retry available');
 fail=false;b('[data-continue]').click();await idle();assert(b('[data-total]').textContent==='5','base retry');
 b('[data-continue]').click();await tick();await tick();
 // Real game test-ad dialog must sit above the receipt and only pay after close.
 create();await controller.prepare({key:'ROOM_real-ad',score:2});controller.open();mode='real';const beforeAd=profile.coins;
 b('[data-double]').click();await tick();
 assert(document.elementFromPoint(innerWidth/2,innerHeight/2).closest('#fake-ad-overlay'),'ad is above reward screen');
 assert(profile.coins===beforeAd,'no reward before ad completion');
 await wait(()=>!document.getElementById('fake-ad-close').disabled);
 document.getElementById('fake-ad-close').click();await idle();assert(profile.coins===beforeAd+5,'completion adds only bonus');
 b('[data-continue]').click();await tick();await tick();
 create();await controller.prepare({key:'ROOM_preview',score:2});controller.open();
 const panel=controller.element,watch=b('[data-double]'),next=b('[data-continue]');
 assert(panel.scrollWidth<=panel.clientWidth,'no horizontal overflow');
 assert(watch.getBoundingClientRect().height>=72,'large ad button');
 assert(watch.textContent.replace(/\\s+/g,' ').includes('Watch Ad forDouble Coins'),'full phrase in button');
 assert(next.getBoundingClientRect().height>=44,'continue touch target');
 assert(watch.getBoundingClientRect().bottom<=next.getBoundingClientRect().top,'buttons do not overlap');
 assert(getComputedStyle(watch).borderImageSource.includes('btn-watch-ad.png'),'actual purple ad button asset');
 document.getElementById('result').textContent=JSON.stringify({pass:true,width:innerWidth,height:innerHeight,receiptHeight:panel.scrollHeight,ads,finishes});
}catch(e){document.getElementById('result').textContent=JSON.stringify({pass:false,error:e.stack})}
`;
const fixture='<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap" rel="stylesheet"><style>'+css+'</style><link rel="stylesheet" href="/anim/game-rewards.css"></head><body>'+toolbar+'<div id="final-screen" class="screen active"></div><pre id="result" hidden></pre><script type="module">'+tests+'</script></body></html>';
const server=http.createServer((req,res)=>{
 if(req.url==='/test'){res.setHeader('Content-Type','text/html');res.end(fixture);return}
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{res.setHeader('Content-Type',({'.mjs':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404);res.end()}
});
server.listen(0,'127.0.0.1',()=>{
 const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'game-reward-tests-'+process.pid),'about:blank'],{windowsHide:true});
 let stderr='',started=false,socket;const timer=setTimeout(()=>{child.kill();server.close();process.exitCode=1},45000);
 child.stderr.on('data',async chunk=>{
  stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(started||!match)return;started=true;
  try{
   socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no});
   let serial=0;const pending=new Map();socket.onmessage=e=>{const r=JSON.parse(e.data),p=pending.get(r.id);if(!p)return;pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result)};
   const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}))});
   fs.mkdirSync(path.join(root,'output','coin-reward-tests'),{recursive:true});
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
    const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(root,'output','coin-reward-tests','receipt-'+width+'.png'),Buffer.from(shot.data,'base64'));
    await call('Target.closeTarget',{targetId});
   }
  }catch(e){console.error(e);process.exitCode=1}finally{clearTimeout(timer);socket?.close();child.kill();server.close()}
 });
});
