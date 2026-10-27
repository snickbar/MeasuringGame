// Phone-layout regression with isolated Firebase/storage; no live player writes.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),vm=require('vm'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/\r\n/g,'\n');
const existing=fs.readFileSync(path.join(root,'scripts/verify-screen-visibility-browser.cjs'),'utf8');
const sandbox={};vm.runInNewContext(existing.slice(existing.indexOf('const dbStub='),existing.indexOf('const injected='))+';globalThis.stubs={dbStub,authStub};',sandbox);
const {dbStub,authStub}=sandbox.stubs;
const injected=String.raw`
window.__tapValue=mode=>({keyboard:()=>codeInput.value,hsfake:()=>hsFakeStr,worlds:()=>wl.input,daily:()=>daily.input,monthly:()=>mo.input,survival:()=>sv.input}[mode]?.()??currentGuessStr);
window.__layoutAudit=async requested=>{
 const [mode,variant]=requested.split(':');
 wbStop();worldStop();survivalStop();dailyStop();monthlyStop();
 ALL_SCREEN_ELS.forEach(e=>e.classList.remove('active'));hudSubToolbarEl.classList.remove('active');bottomToolbarEl.classList.remove('active');
 const q={unitId:'donut',targetId:'watermelon',answer:3,prompt:'How many donuts across is the diameter of a watermelon?'};
 if(mode==='worlds'){openWorlds();wl.wi=0;worldStartLevel(1);wl.questions[0]=q;renderWorlds();}
 else if(mode==='daily'){daily={date:'2026-10-26',phase:'question',guesses:[],questions:[q,q,q],input:''};renderDaily();dailyScreenEl.classList.add('active');}
 else if(mode==='monthly'){mo={key:'2026-10',phase:'question',guesses:[],questions:[q,q,q],input:''};renderMonthly();monthlyScreenEl.classList.add('active');}
 else if(mode==='survival'){sv={runId:'audit',phase:'question',lives:3,survived:0,asked:0,q,g:0,input:'',recent:[],accs:[],gain:0};renderSurvival();survivalScreenEl.classList.add('active');}
 else if(mode==='whichbigger'){wb={...wbNewRun()};wbScreenEl.classList.add('active');renderWhichBigger();}
 else{
 currentRoomCode='AUDIT';currentPlayerId='me';isHost=true;leavingGame=false;currentName='Player';
 const players={me:{name:'Player',avatar:'av07',score:0,roundsCounted:0,joinedAt:1},friend:{name:'Friend',avatar:'av19',score:0,roundsCounted:0,joinedAt:2},third:{name:'Third',avatar:'av06',score:0,roundsCounted:0,joinedAt:3},fourth:{name:'Fourth',avatar:'av20',score:0,roundsCounted:0,joinedAt:4}};
 if(['teamworlds','highlow'].includes(mode)){delete players.third;delete players.fourth;}
 lastSeenPhaseForReset='waiting';hasSubmittedThisRound=false;guessLocked=false;currentGuessStr='';roomState={phase:'question',gameId:'audit',round:1,settings:{mode:mode==='highlow'?'teamworlds':mode==='quick'?'party':mode,variant:mode==='highlow'?'hl':null,solo:mode==='quick',timerSeconds:30,totalRounds:5,autoAdvanceEnabled:false,itemSelectionMode:'anything'},players,currentQuestion:q,guesses:{},phaseEndsAt:Date.now()+300000,hlRoles:{me:'low',friend:'high'},hlLives:3,hlSurvived:0};
 if(mode==='teamvteam'){players.me.team='red';players.friend.team='red';players.third.team='blue';players.fourth.team='blue';}
 if(variant==='many')for(let i=4;i<10;i++)players['p'+i]={name:'Player '+i,avatar:'av07',score:0,joinedAt:i+1};
 currentPlayers=players;lastScoreColumnSignature='';
 if(mode==='highstakes'){roomState.phase='hs';roomState.hsQ=q;const hs=HS.hsNewGame(Object.keys(players),100);roomState.hs=HS.hsStartRound(hs,{options:[1,2,3,4],realIdx:2,fakeBy:{},now:Date.now()});if(variant==='bet'){roomState.hs=HS.hsBeginBetting(roomState.hs,Object.fromEntries(Object.keys(players).map(id=>[id,0])),Date.now());roomState.hs.bet.turn='me';}}
 if(mode==='bluff'){roomState.phase='bluff';roomState.bluff=dealBluff(newBluff(Object.keys(players),1,()=>.99),q,Date.now());
  if(variant){const api=await import('/anim/bluff.mjs');roomState.bluff=api.chooseBluff(roomState.bluff,'me',1,Date.now());
   if(['summary','standings'].includes(variant)){roomState.bluff=api.revealBluff({...roomState.bluff,votes:{friend:'correct',third:'low',fourth:'high'}},Date.now());roomState.bluff.showStand=variant==='standings';}
   if(variant==='vote')roomState.bluff.maker='friend';
  }}
 renderHudTop(roomState);applyPhase(roomState);if(['quick','party','teamvteam'].includes(mode)){renderScoreColumn();applyBoard(variant&&SB_DEFS[variant]?variant:'paper');questionPromptTextEl.dataset.txt='';setPromptText(q.prompt,false);}if(mode==='highstakes')renderHighStakes(roomState);
 }
 document.querySelectorAll('#ach-toast').forEach(e=>e.remove());window.scrollTo(0,0);
};

window.__tapSetup=async mode=>{if(mode==='keyboard'){ALL_SCREEN_ELS.forEach(e=>e.classList.remove('active'));showJoinScreen();return;}if(mode==='hsfake'){await window.__layoutAudit('highstakes');roomState.hs.stage='ready';roomState.hs.out={me:true};roomState.hs.chips.me=0;roomState.hsPre={endsAt:Date.now()+300000};hsFakeStr='';delete hsContentEl.dataset.sig;renderHighStakes(roomState);return;}await window.__layoutAudit(mode);};
window.__layoutReady=()=>myProfile?.stats?.gamesPlayed===8;
window.__tapNested=()=>{const key=document.querySelector('#numpad .num-btn[data-val="4"]');key.innerHTML='<span>4</span>';key.firstElementChild.click();return currentGuessStr;};
window.__tapNav=()=>{ALL_SCREEN_ELS.forEach(e=>e.classList.remove('active'));homeScreen.classList.add('active');homeSoloBtn.click();return soloScreenEl.classList.contains('active');};
window.__tapPending=()=>{window.__holdPurchase=true;document.querySelector('#worlds-content [data-powerup="buffer"]').click();const busy=powerups.busy;document.querySelector('#worlds-content .dc-key[data-k="2"]').click();document.getElementById('wl-submit').click();const other=document.createElement('button');let clicks=0;other.onclick=()=>clicks++;document.body.append(other);other.click();other.remove();return {busy,value:wl.input,phase:wl.phase,clicks};};

window.__tapMonthly=()=>{mo.level=1;mo.prog={};mo.fresh=false;mo.combos=mo.questions.map(q=>({unitId:q.unitId,targetId:q.targetId}));};
`;
let fixture=source.replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js','/__fake/app.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js','/__fake/db.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js','/__fake/auth.mjs');
fixture=fixture.replace('\n</script>\n</body>',injected+'\n</script><pre id="wb-test-result" hidden></pre>\n</body>');
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');res.setHeader('Cache-Control','no-store');
 if(url.pathname==='/test'){res.setHeader('Content-Type','text/html');res.end(fixture);return;}
 if(url.pathname.startsWith('/__fake/')){res.setHeader('Content-Type','text/javascript');res.end(url.pathname.endsWith('app.mjs')?'export const initializeApp=()=>({});':url.pathname.endsWith('db.mjs')?dbStub.replace('export async function update(r,v){',"export async function update(r,v){if(globalThis.__holdProgress&&/profiles\\/.*\\/(daily|monthly)/.test(r.p))await new Promise(()=>{});").replace('export async function runTransaction(r,fn){',"export async function runTransaction(r,fn){if(globalThis.__holdPurchase)await new Promise(()=>{});"):authStub);return;}
 const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(file.endsWith('auto-fit.mjs')?fs.readFileSync(file,'utf8').replace('    const boxes = fullFit ?', '    if(fullFit)globalThis.__fitRuns=(globalThis.__fitRuns||0)+1; const boxes = fullFit ?'):fs.readFileSync(file));}catch{res.writeHead(404);res.end();}
});
server.listen(0,'127.0.0.1',()=>{
 const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'wb-summary-'+process.pid),'about:blank'],{windowsHide:true});
 let stderr='',started=false,socket;const timer=setTimeout(()=>{child.kill();server.close();process.exitCode=1;},180000);
 child.stderr.on('data',async chunk=>{
  stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(started||!match)return;started=true;
  try{
   socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no});
   let serial=0;const pending=new Map();socket.onmessage=e=>{const r=JSON.parse(e.data),p=pending.get(r.id);if(!p)return;pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result)};
   const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
   const output=path.join(root,'output/pinned-layout-audit');fs.mkdirSync(output,{recursive:true});
   const results=[];
   for(const [width,height] of [[390,780],[320,650]]){
 const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
 await call('Runtime.enable',{},sessionId);await call('Page.enable',{},sessionId);await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true},sessionId);await call('Emulation.setTouchEmulationEnabled',{enabled:true},sessionId);
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},sessionId);if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;};
 await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/test'},sessionId);for(let i=0;i<250;i++){if(await evaluate('window.__layoutReady?.()'))break;await new Promise(r=>setTimeout(r,30));}
 const touch=async(point,hold=20,cancel=false)=>{await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]},sessionId);await new Promise(r=>setTimeout(r,hold));await call('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]},sessionId);};
 for(const mode of ['keyboard','hsfake','quick','party','teamvteam','worlds','daily','monthly','survival','highlow','teamworlds']){
 await evaluate('window.__tapSetup('+JSON.stringify(mode)+')');await new Promise(r=>setTimeout(r,400));
 const point=async(value,edge=false)=>{if(mode==='keyboard')value=({'1':'A','2':'B','3':'C','4':'D'})[value]||value;return evaluate("(()=>{const e=[...document.querySelectorAll('.screen.active button,#hud.active button')].find(b=>(b.matches('.num-btn,.dc-key,#backspace-btn,.hs-key,.kbd-key'))&&(b.dataset.val==="+JSON.stringify(value)+"||b.dataset.hsKey==="+JSON.stringify(value)+"||b.dataset.key==="+JSON.stringify(value)+"||b.dataset.k==="+JSON.stringify(value)+"||("+JSON.stringify(value)+"==='back'&&(b.id==='backspace-btn'||b.dataset.action==='backspace'))));if(!e)throw Error('No key '+"+JSON.stringify(value)+");const r=e.getBoundingClientRect();return {x:r.left+"+(edge?'2':'r.width/2')+",y:r.top+"+(edge?'2':'r.height/2')+"}})()");};
 const fits=await evaluate('window.__fitRuns||0');
 await touch(await point('1',true),90);await new Promise(r=>setTimeout(r,30));
 if(await evaluate('window.__tapValue('+JSON.stringify(mode)+')')!==(mode==='keyboard'?'A':'1'))throw Error('Missed edge tap '+mode);
 for(const value of ['2','2','back','3'])await touch(await point(value),20);
 await new Promise(r=>setTimeout(r,80));
 const result=await evaluate('({value:window.__tapValue('+JSON.stringify(mode)+'),fits:(window.__fitRuns||0)-'+fits+',drawing:!!document.querySelector("#guess-display .draw-last")})');
 if(result.value!==(mode==='keyboard'?'ABC':'123')||result.fits>1||result.drawing)throw Error('Rapid input regression '+JSON.stringify({mode,width,...result}));
 await touch(await point('4'),30,true);await new Promise(r=>setTimeout(r,40));
 if(await evaluate('window.__tapValue('+JSON.stringify(mode)+')')!==(mode==='keyboard'?'ABC':'123'))throw Error('Cancelled touch entered a digit');
 console.log(JSON.stringify({mode,width,...result,edge:true,cancelled:true,pass:true}));
 }
 const nested=await evaluate('window.__tapNested()');if(nested!=='1234')throw Error('Nested digit ignored');
 const nav=await evaluate('window.__tapNav()');if(!nav)throw Error('Menu still waits for animation');
 for(const mode of ['daily','monthly']){
 await evaluate('window.__layoutAudit('+JSON.stringify(mode)+')');if(mode==='monthly')await evaluate('window.__tapMonthly()');
 const submitted=await evaluate("(()=>{window.__holdProgress=true;document.querySelector('#"+(mode==='daily'?'daily':'monthly')+"-content .dc-key[data-k=\"2\"]').click();document.getElementById('"+(mode==='daily'?'dc':'mo')+"-submit').click();return !!document.getElementById('"+(mode==='daily'?'daily':'mo')+"-stage')})()");if(!submitted)throw Error(mode+' reveal waits for network');console.log(JSON.stringify({mode,width,hangingNetworkReveal:true,pass:true}));
 }
 await evaluate("window.__layoutAudit('worlds')");
 const pending=await evaluate('window.__tapPending()');
 if(!pending.busy||pending.value!=='2'||pending.phase!=='question'||pending.clicks!==1)throw Error('Pending power-up swallows unrelated taps '+JSON.stringify(pending));
 console.log(JSON.stringify({width,pendingPowerup:pending,nested,immediateNavigation:nav,pass:true}));
 await call('Target.closeTarget',{targetId});
 }

  }catch(e){console.error(e);process.exitCode=1}finally{clearTimeout(timer);socket?.close();child.kill();server.close();}
 });
});
