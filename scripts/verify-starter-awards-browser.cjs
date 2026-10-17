// Real Awards markup/styles with isolated profiles; no Firebase or real sign-in.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=source.match(/<style>([\s\S]*?)<\/style>/)[1];
const extract=name=>source.match(new RegExp('  function '+name+'\\(\\) \\{[\\s\\S]*?\\n  \\}'))[0];
const tests=`
import {STARTER_AWARDS,starterAwardProfile} from '/anim/starter-awards.mjs';
let myProfile={coins:0,achClaimed:{}},achJustClaimed=null;
const ACH_CATS=['Getting started'],ACH_ICON_IDS=new Set(),TROPHY_SVG='',achHideDone=false,achHold={},escapeHtml=s=>s;
const ACHIEVEMENTS=STARTER_AWARDS.map(a=>({...a,auto:true,target:1,progress:()=>a.id==='welcome-size-em-up'||myProfile.achClaimed?.[a.id]?1:0}));
function achDone(a){return a.progress()>=a.target}
function achClaimable(a){return !a.auto&&achDone(a)&&!myProfile.achClaimed?.[a.id]}
${extract('renderAchievementsScreen')}
try{
 const assert=(v,m)=>{if(!v)throw Error(m)};
 for(const connected of [false,true]){
  myProfile=starterAwardProfile({coins:0,achClaimed:{}},{connected});renderAchievementsScreen();
  assert(document.querySelectorAll('.ach-row').length===2,'two separate starter achievements');
  assert(!document.querySelector('.ach-claim'),'starter awards have no Claim button');
  assert(document.getElementById('achievements-content').textContent.includes('Welcome to Size Em Up!'),'welcome named');
  assert(document.getElementById('achievements-content').textContent.includes('Account Connected'),'connection named');
  assert(document.documentElement.scrollWidth<=innerWidth,'no mobile horizontal overflow');
  assert(document.querySelectorAll('.ach-row.done').length===(connected?2:1),'only eligible awards credited');
 }
 document.getElementById('result').textContent=JSON.stringify({pass:true,width:innerWidth,checks:'starter award rows, eligibility, automatic credit labels, no Claim buttons, no horizontal overflow'});
}catch(e){document.getElementById('result').textContent=JSON.stringify({pass:false,error:e.stack})}
`;
const fixture='<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body><main><div id="achievements-screen" class="screen active"><div id="achievements-content"></div></div></main><pre id="result" hidden></pre><script type="module">'+tests+'</script></body></html>';
const server=http.createServer((req,res)=>{
 if(req.url==='/test'){res.setHeader('Content-Type','text/html');res.end(fixture);return}
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{res.setHeader('Content-Type',({'.mjs':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404);res.end()}
});
server.listen(0,'127.0.0.1',()=>{
 const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'starter-awards-tests-'+process.pid),'about:blank'],{windowsHide:true});
 let stderr='',started=false,socket;const timer=setTimeout(()=>{child.kill();server.close();process.exitCode=1},45000);
 child.stderr.on('data',async chunk=>{
  stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(started||!match)return;started=true;
  try{
   socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no});
   let serial=0;const pending=new Map();socket.onmessage=e=>{const r=JSON.parse(e.data),p=pending.get(r.id);if(!p)return;pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result)};
   const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}))});
   fs.mkdirSync(path.join(root,'output','starter-awards-tests'),{recursive:true});
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
    const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(root,'output','starter-awards-tests','awards-'+width+'.png'),Buffer.from(shot.data,'base64'));
    await call('Target.closeTarget',{targetId});
   }
  }catch(e){console.error(e);process.exitCode=1}finally{clearTimeout(timer);socket?.close();child.kill();server.close()}
 });
});
