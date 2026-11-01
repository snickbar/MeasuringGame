// Real summary renderers and styles, isolated from Firebase. A manual clock makes
// snapshot re-renders, team ties and reduced-motion transitions reproducible.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=source.match(/<style>([\s\S]*?)<\/style>/)[1].replace(/url\((['"]?)(icons|avatars|backgrounds)\//g,'url($1/$2/');
const extract=name=>{const a=source.indexOf('  function '+name+'(');if(a<0)throw Error(name);return source.slice(a,source.indexOf('\n  }',a)+4)};
const tests=`
import {createRoundScoreReveal} from '/anim/round-score-reveal.mjs';
import {drawLandingEffect} from '/anim/landing-effects.mjs';
const assert=(v,m)=>{if(!v)throw Error(m)};
let time=0,queued,reduce=false,shown=true,summaryScrollStarted=true,roundWinnerId=null,navGuardAt=0;
const summaryListEl=document.querySelector('#summary-list'),nextRoundBtn=document.createElement('button');
const currentPlayers={a:{name:'You',avatar:'a',team:'Red',score:20},b:{name:'Teammate',avatar:'b',team:'Red',score:20},c:{name:'Other team',avatar:'c',team:'Blue',score:18}};
const avatarHtml=()=>'<span style="font-size:28px">🐙</span>',recordRoundStats=()=>{},setRoundWinner=()=>{},isHost=true;
const nowMs=()=>time,isHlSettings=()=>false,currentSettings={totalRounds:5};
const escapeHtml=s=>String(s);
const roundScoreReveal=createRoundScoreReveal({now:()=>time,request:f=>(queued=f,1),cancel:()=>queued=null,reduced:()=>reduce,visible:()=>shown});
const advance=t=>{time=t;const f=queued;queued=null;f?.()};
let roomState={settings:{mode:'classic'}};
${extract('computeRoundBreakdown')}
${extract('renderSummary')}
${extract('renderTeamSummary')}
try {
 const data={gameId:'first',round:1,settings:{mode:'classic'},lastRoundPoints:{a:8,b:0,c:3},revealOrder:[{playerId:'a',basePoints:3,doubleDownPoints:3,crowdFavoritePoints:2,isClosest:true},{playerId:'c',basePoints:3}]};
 renderSummary(data);
 const counter=()=>summaryListEl.querySelector('.roundpts'),chip=()=>summaryListEl.querySelector('.breakdown-chip');
 const rect=summaryListEl.getBoundingClientRect();
 assert(counter().textContent==='+0','starts at zero');
 assert(nextRoundBtn.style.display==='flex'&&nextRoundBtn.textContent==='Next round','host progression remains available');
 advance(500);assert(counter().textContent==='+3','base award first');
 advance(1000);assert(counter().textContent==='+6','double-down arrives separately');
 assert(getComputedStyle(summaryListEl.querySelectorAll('.breakdown-chip')[2]).opacity==='0','later bonus stays hidden');
 renderSummary(data);assert(counter().textContent==='+6','room snapshot never restarts point counting');
 assert(parseFloat(summaryListEl.firstElementChild.style.animationDelay)<0,'snapshot never replays card entrance');
 advance(1700);assert(counter().textContent==='+8','final total');
 assert(counter().classList.contains('score-total-land'),'final total lands once');
 assert(counter().getAttribute('aria-label')==='8 points this round','accessible total is accurate throughout');
 assert(Math.abs(summaryListEl.getBoundingClientRect().height-rect.height)<1,'no layout shift');
 assert(summaryListEl.scrollWidth<=document.documentElement.clientWidth,'fits phone width');
 advance(3500);renderSummary(data);assert(counter().textContent==='+8'&&!counter().classList.contains('score-total-land'),'completed snapshot stays settled');
 roomState={settings:{mode:'teamvteam'}};
 time=4000;
 const team={...data,gameId:'team',settings:{mode:'teamvteam'},lastRoundPoints:{a:5,b:5,c:5},revealOrder:[{playerId:'a',basePoints:5,creditedBasePoints:5,isClosest:true},{playerId:'b',basePoints:5,creditedBasePoints:0,isClosest:true},{playerId:'c',basePoints:5,creditedBasePoints:5,isClosest:true}]};
 renderSummary(team);advance(4600);
 assert(summaryListEl.children.length===2,'one card per team');
 assert([...summaryListEl.querySelectorAll('.roundpts')].every(el=>el.textContent==='+5'),'shared tied award counted once per team');
 assert(summaryListEl.querySelectorAll('.team-line-avatar').length===2,'only credited teammates contribute');
 reduce=true;roundScoreReveal.mount(summaryListEl,'reduced');
 assert(!queued&&[...summaryListEl.querySelectorAll('.roundpts')].every(el=>el.textContent==='+5'),'reduced motion shows totals immediately');
 reduce=false;roundScoreReveal.mount(summaryListEl,'leave');shown=false;advance(4700);
 assert(!queued&&counter().textContent==='+5','leaving view settles and cancels work');
 shown=true;roundScoreReveal.stop();assert(!queued,'stop cancels frames');
 const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
 for(const [i,surface] of ['snow','sand','grass','bubbles','water','hard'].entries()){
   const x=45+(i%3)*100,y=45+Math.floor(i/3)*75;
   ctx.fillStyle='#596d7b';ctx.fillRect(x-40,y-35,80,55);
   drawLandingEffect(ctx,{surface,x,y,age:.17,width:65,objectMm:1000});
 }
 document.querySelector('#result').textContent=JSON.stringify({pass:true,width:innerWidth,checks:'actual Classic/Team renderers; sequential scoring; snapshot continuity; ties; stable layout; reduced motion; cancellation; canvas effects'});
} catch(e) {document.querySelector('#result').textContent=JSON.stringify({pass:false,error:e.stack})}
`;
const fixture='<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style><style>body{display:block;padding:12px;background:#faf3df}#summary-list{padding:0;list-style:none}canvas{max-width:100%}</style></head><body><ul id="summary-list"></ul><canvas width="300" height="150"></canvas><pre id="result" hidden></pre><script type="module">'+tests+'</script></body></html>';
const out=path.join(root,'output','landing-score');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'index.html'),fixture);
const server=http.createServer((req,res)=>{
 if(req.url==='/test'){res.setHeader('Content-Type','text/html');res.end(fixture);return}
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{res.setHeader('Content-Type',({'.mjs':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404);res.end()}
});
server.listen(0,'127.0.0.1',()=>{
 const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'landing-score-tests-'+process.pid),'about:blank'],{windowsHide:true});
 let stderr='',started=false,socket;const timer=setTimeout(()=>{child.kill();server.close();process.exitCode=1},45000);
 child.stderr.on('data',async chunk=>{
  stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(started||!match)return;started=true;
  try{
   socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no});
   let serial=0;const pending=new Map();socket.onmessage=e=>{const r=JSON.parse(e.data),p=pending.get(r.id);if(!p)return;pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result)};
   const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}))});
   for(const width of [320,390,430]){
    const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
    await call('Emulation.setDeviceMetricsOverride',{width,height:740,deviceScaleFactor:1,mobile:true},sessionId);
    await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/test'},sessionId);
    let result;
    for(let n=0;n<300;n++){
     const value=await call('Runtime.evaluate',{expression:'document.getElementById("result")?.textContent',returnByValue:true},sessionId);
     if(value.result?.value){result=JSON.parse(value.result.value);break}await new Promise(r=>setTimeout(r,20));
    }
    if(!result)throw Error('No browser result at '+width);
    console.log(result);if(!result.pass)throw Error(result.error);
    await call('Runtime.evaluate',{expression:'document.fonts.ready',awaitPromise:true},sessionId);
    await new Promise(r=>setTimeout(r,500));
    const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(out,'summary-'+width+'.png'),Buffer.from(shot.data,'base64'));
    await call('Target.closeTarget',{targetId});
   }
  }catch(e){console.error(e);process.exitCode=1}finally{clearTimeout(timer);socket?.close();child.kill();server.close()}
 });
});
