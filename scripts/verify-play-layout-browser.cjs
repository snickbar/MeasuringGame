// Phone-layout regression with isolated Firebase/storage; no live player writes.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),vm=require('vm'),{spawn}=require('child_process');
// "No invisible walls" audit (npm run test:no-walls). Finds every box that clips its contents (overflow, clip-path, mask) and reports the ones that
// cut a child along an axis that cannot scroll. A clip that only hides content scrolled out of a real scroll area is fine; anything else is an invisible wall.
// Boxes that clip on purpose (a visible bordered sky panel, a sprite strip, the home scenery) are listed in WALL_ALLOW with the reason.
const WALL_ALLOW=[
 '.wl-sky',          // bordered sky panel: clouds drift and the rocket/balloon fly inside its visible frame
 '.hs-pig-frames',   // sprite strip: one frame shown at a time
 '#home-art','#home-fx','#home-title-shine','.hs-sheen', // home scenery and shine sweep
 '#final-screen',    // overflow-x:clip only trims the final title bounce
 '.wl-bar',          // accuracy bar fill reveal (clip-path animates the fill)
];
const WALLS=`(()=>{const ALLOW=${JSON.stringify(WALL_ALLOW)};const out=[];
const roots=[...document.querySelectorAll('.screen.active,#hud.active,#worlds-screen.active,#daily-screen.active,#monthly-screen.active,#survival-screen.active,#wb-screen.active,#hs-screen.active,#bluff-screen.active')];
const vis=e=>{const r=e.getBoundingClientRect();const c=getComputedStyle(e);return r.width>1&&r.height>1&&c.display!=='none'&&c.visibility!=='hidden'};
const name=e=>{let n=e.tagName.toLowerCase();if(e.id)n+='#'+e.id;const c=[...e.classList].slice(0,2).join('.');if(c)n+='.'+c;return n};
roots.forEach(root=>{[root,...root.querySelectorAll('*')].forEach(el=>{if(!vis(el))return;const cs=getComputedStyle(el);
 const ox=cs.overflowX,oy=cs.overflowY;const cp=cs.clipPath!=='none',mk=(cs.maskImage&&cs.maskImage!=='none')||(cs.webkitMaskImage&&cs.webkitMaskImage!=='none');
 if(ox==='visible'&&oy==='visible'&&!cp&&!mk)return;
 if(ALLOW.some(s=>el.matches(s)||el.closest(s)))return;
 if(['IMG','SVG','CANVAS'].includes(el.tagName.toUpperCase()))return;
 const sx=ox==='auto'||ox==='scroll',sy=oy==='auto'||oy==='scroll';
 const r=el.getBoundingClientRect();const sides={l:0,r:0,t:0,b:0};let sample='';
 el.querySelectorAll('*').forEach(d=>{if(!vis(d)||ALLOW.some(s=>d.matches(s)||d.closest(s)))return;const q=d.getBoundingClientRect();if(q.width<3||q.height<3)return;
  const l=r.left-q.left,rr=q.right-r.right,t=r.top-q.top,b=q.bottom-r.bottom;
  const xClip=ox!=='visible'||cp||mk,yClip=oy!=='visible'||cp||mk;
  if(xClip&&!sx){if(l>2)sides.l=Math.max(sides.l,Math.round(l));if(rr>2)sides.r=Math.max(sides.r,Math.round(rr));}
  if(yClip&&!sy){if(t>2)sides.t=Math.max(sides.t,Math.round(t));if(b>2)sides.b=Math.max(sides.b,Math.round(b));}
  if(!sample&&(sides.l||sides.r||sides.t||sides.b))sample=name(d)});
 // a scroller's own sides still must not cut anything: the scroll box is allowed to hide only what is scrolled away along its scroll axis
 if(sides.l||sides.r||sides.t||sides.b)out.push(name(el)+' ('+ox+'/'+oy+') cuts '+sample+' '+JSON.stringify(sides))})});
return JSON.stringify(out)})()`;
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/\r\n/g,'\n');
const existing=fs.readFileSync(path.join(root,'scripts/verify-screen-visibility-browser.cjs'),'utf8');
const sandbox={};vm.runInNewContext(existing.slice(existing.indexOf('const dbStub='),existing.indexOf('const injected='))+';globalThis.stubs={dbStub,authStub};',sandbox);
const {dbStub,authStub}=sandbox.stubs;
const injected=String.raw`
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
 if(mode==='teamvteam'&&variant==='many'){const tn=['green','yellow','purple'];for(let i=0;i<6;i++)players['t'+i]={name:'Team Player '+i,avatar:'av07',score:0,joinedAt:20+i,team:tn[Math.floor(i/2)]};}
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

// Reveal papers with n players (Classic / Party / Team vs Team), with the bottom buttons showing like the real screen.
// The round summary list with n players (same screen the Next round button sits under).
window.__layoutSm=async n=>{
 await window.__layoutAudit('quick');
 const base=Object.keys(currentPlayers);for(let i=base.length;i<n;i++)currentPlayers['x'+i]={...currentPlayers[base[i%base.length]],name:'P'+i};
 const list=document.getElementById('summary-list');list.innerHTML='';
 Object.keys(currentPlayers).slice(0,n).forEach((id,i)=>{const li=document.createElement('li');li.className='summary-row';li.dataset.id=id;li.innerHTML='<div class="summary-row-top"><span class="avatar">'+avatarHtml(currentPlayers[id].avatar)+'</span><span class="name">'+currentPlayers[id].name+'</span></div><div class="summary-row-body lines-2"><div class="breakdown"><span class="breakdown-chip">+2 Closest</span><span class="breakdown-chip">+1 Perfect!</span></div><span class="roundpts">+3</span></div>';list.appendChild(li);});
 document.getElementById('hud').dataset.phase='summary'; document.getElementById('question-view').classList.remove('active');document.getElementById('reveal-view').classList.remove('active');document.getElementById('summary-view').classList.add('active');
 const b=document.getElementById('bottom-actions');b.removeAttribute('data-bar-empty');getPlayLayout().measure();
 return n;
};
window.__layoutSummaryPhase=async mode=>{await window.__layoutAudit(mode);stopAnimation();animScene=null;animSceneRound=null;roomState.phase='summary';applyPhase(roomState);};
window.__layoutHsRefresh=()=>{roomState.players.me.layoutTick=(roomState.players.me.layoutTick||0)+1;renderHighStakes(roomState);};
window.__layoutBluffRefresh=()=>{roomState.players.me.layoutTick=(roomState.players.me.layoutTick||0)+1;bluffUI.refresh();};
window.__layoutBoard=id=>{roomState.board=id;applyBoard(id);getPlayLayout().measure();};
window.__layoutPh=async ph=>{if(ph==='animation'){roomState={...roomState,phase:'animation',animEndsAt:Date.now()+60000};}else if(ph==='answers'){const ids=Object.keys(currentPlayers);roomState={...roomState,phase:'answers',answersEndsAt:Date.now()+60000,answers:ids.map((id,i)=>({playerId:id,value:10+i*7.3+(i%3)})),picks:{}};}else roomState={...roomState,phase:ph};applyPhase(roomState);if(ph==='answers')renderAnswersScreen(roomState);};
window.__layoutRv=async n=>{
 await window.__layoutAudit('quick');
 const base=Object.keys(currentPlayers);for(let i=base.length;i<n;i++)currentPlayers['x'+i]={...currentPlayers[base[i%base.length]],name:'P'+i};
 const ids=Object.keys(currentPlayers).slice(0,n);const vals=[4,2.11,4.28,3.3,2.9,5.1,3.9,2.4,6.6,3.1];
 roomState.phase='reveal';document.getElementById('hud').dataset.phase='reveal';roomState.lastRoundPoints={};roomState.revealOrder=ids.map(id=>({playerId:id,accuracyPercent:50}));lastScoreColumnSignature='';renderScoreColumn(computeDisplayedScores(roomState.revealOrder,{},0));
 revealListEl.innerHTML='';
 ids.forEach((id,i)=>{const e={playerId:id,guess:vals[i%10],accuracyPercent:70.3-i*3,isClosest:i===1,pickedBy:[],basePoints:1,doubleDownPoints:0};const li=document.createElement('li');li.className='reveal-card';li.dataset.id=id;li.innerHTML=revealCardFinalHtml(e);revealListEl.appendChild(li);});
 document.getElementById('question-view').classList.remove('active');document.getElementById('reveal-view').classList.add('active');
 const b=document.getElementById('bottom-actions');b.removeAttribute('data-bar-empty');['hud-auto-toggle','show-summary-btn'].forEach(id=>document.getElementById(id).style.display='');getPlayLayout().measure();
 return ids.length;
};
window.__layoutReveal=async mode=>{
 await window.__layoutAudit(mode);
 if(mode==='survival'){sv={...sv,phase:'reveal',asked:1,g:3,lastOk:true,resultShown:false,accs:[{r:1}]};renderSurvival();}
 else if(mode==='worlds'){wl.phase='reveal';wl.guesses=[3];renderWorlds();}
 else if(mode==='daily'){daily.phase='reveal';daily.guesses=[3];renderDaily();}
 else if(mode==='monthly'){mo.phase='reveal';mo.guesses=[3];renderMonthly();}
 else{stopAnimation();animScene=null;animSceneRound=null;roomState.phase='animation';roomState.animStartAt=Date.now()+10000;applyPhase(roomState);await runAnimation(roomState);}
};
window.__layoutAccuracyAfter=()=>summaryListEl.querySelector('.tw-avg .wl-progress-heading strong').textContent;
const originalLayoutSubmit=submitGuessBtn,originalLayoutPad=numpadEl;
window.__layoutAccuracy=async (count,sum,last)=>{
 await window.__layoutAudit('teamworlds');
 Object.values(currentPlayers).forEach(p=>{p.roundsCounted=count;p.accuracySum=sum;});
 roomState.lastRoundAccuracy=last;roomState.phase='animation';applyPhase(roomState);
 const bar=document.getElementById('tw-anim-progress');
 const before=bar.querySelector('strong').textContent;applyPhase(roomState);
 const refreshed=bar.querySelector('strong').textContent;
 roomState.phase='summary';applyPhase(roomState);twSummarySig=null;renderTeamWorldsSummary(roomState);
 return {before,refreshed,after:summaryListEl.querySelector('.tw-avg .wl-progress-heading strong')?.textContent};
};
window.__layoutSoloTiming=async count=>{
 await window.__layoutAudit('worlds');const q=wl.questions[0];wl.questions=[q,q,q,q,q];wl.guesses=count===1?[3]:[1.5,3];wl.phase='reveal';renderWorlds();
 const before=worldsContentEl.querySelector('.wl-progress-heading strong').textContent;
 renderWorlds();const refreshed=worldsContentEl.querySelector('.wl-progress-heading strong').textContent;
 document.getElementById('wl-skip').click();
 return {before,refreshed,resultStart:worldsContentEl.querySelector('.wl-rs-meter .wl-progress-heading strong').textContent};
};
window.__layoutSoloAfter=()=>worldsContentEl.querySelector('.wl-rs-meter .wl-progress-heading strong').textContent;
window.__layoutPartyTiming=async mode=>{
 await window.__layoutAudit(mode);
 roomState.phase='reveal';roomState.lastRoundPoints={};roomState.revealOrder=Object.keys(currentPlayers).map((id,i)=>{const accuracyPercent=i<2?100:0;Object.assign(currentPlayers[id],{score:0,roundsCounted:2,accuracySum:50+accuracyPercent});return {playerId:id,accuracyPercent};});
 const held=computeDisplayedScores(roomState.revealOrder,{},0);lastScoreColumnSignature='';renderScoreColumn(held);
 const read=()=>[...scoreColEl.querySelectorAll('.score-card')].map(e=>({id:e.dataset.id,acc:e.querySelector('.acc')?.textContent,score:e.querySelector('.pts').textContent}));
 const before=read();roomState.phase='summary';renderScoreColumn();return {before,after:read()};
};
window.__layoutOtherTiming=async ()=>{
 await window.__layoutAudit('highlow');roomState.phase='animation';roomState.hlSyncStreak=3;roomState.hlLast={previousSyncStreak:2};renderHudTop(roomState);const flameBefore=!!hudRoundLabelEl.querySelector('.hl-flame');roomState.phase='summary';renderHudTop(roomState);const flameAfter=!!hudRoundLabelEl.querySelector('.hl-flame');
 await window.__layoutAudit('whichbigger');wb={...wb,phase:'reveal',lives:1,ok:false,picked:wb.pair.left.id,prevStreak:0};renderWhichBigger();const dangerBefore=wbScreenEl.classList.contains('wb-danger');wbStop();wb.phase='result';renderWhichBigger();const dangerAfter=wbScreenEl.classList.contains('wb-danger');
 await window.__layoutAudit('survival');sv={...sv,phase:'reveal',asked:2,lives:2,lossPending:true,lastOk:false,g:1.5,resultShown:false,accs:[{r:1},{r:.5}]};renderSurvival();const survivalBefore={acc:document.getElementById('sv-acc').textContent,full:survivalContentEl.querySelectorAll('#sv-hearts img[src*="full"]').length};document.getElementById('sv-skip').click();await new Promise(r=>setTimeout(r,50));const survivalAfter=document.getElementById('sv-acc').textContent;
 return {flameBefore,flameAfter,dangerBefore,dangerAfter,survivalBefore,survivalAfter};
};
window.__exitSetup=async (mode,phase='question')=>{
 exitConfirmNoBtn.click();pendingNavAction=null;overlayReturnScreen=soloScreenEl;
 await window.__layoutAudit(mode);
 if(phase!=='question'){
  if(mode==='worlds'){wl.phase=phase;wl.guesses=[3];renderWorlds();}
  if(mode==='daily'){daily.phase=phase;daily.guesses=[3];renderDaily();}
  if(mode==='monthly'){mo.phase=phase;mo.guesses=[3];renderMonthly();}
  if(mode==='survival'){Object.assign(sv,{phase,asked:1,g:3,accs:[{r:1}],lastOk:true,resultShown:false});renderSurvival();}
  if(mode==='whichbigger'){Object.assign(wb,{phase,ok:true,picked:wb.pair.bigger.id,score:1,prevStreak:0});renderWhichBigger();}
 }
};
window.__exitRead=()=>({dialog:exitConfirmOverlayEl.classList.contains('show'),run:activeSoloRun()?.[1]?.phase,action:pendingExitAction});
window.__exitRoom=async (mode,host)=>{exitConfirmNoBtn.click();await window.__layoutAudit(mode);isHost=host;await set(ref(db,'rooms/AUDIT'),roomState);renderHudTop(roomState);applyPhase(roomState);};
window.__exitLobby=async host=>{await window.__exitRoom('party',host);roomState.phase='waiting';await set(ref(db,'rooms/AUDIT'),roomState);applyPhase(roomState);renderPlayerList();};

window.__layoutReady=()=>myProfile?.stats?.gamesPlayed===8;
window.__layoutRefresh=()=>applyPhase(roomState);

window.__layoutHealth=()=>({sameSubmit:submitGuessBtn===originalLayoutSubmit,samePad:numpadEl===originalLayoutPad,submitCount:document.querySelectorAll('#submit-guess-btn').length,parent:submitGuessBtn.parentElement.id,progressHome:twQuestionProgressEl.parentElement.id});
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
 const child=spawn(process.platform==='win32'?'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe':'/usr/bin/google-chrome',[...(process.platform==='win32'?[]:['--no-sandbox']),'--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'wb-summary-'+process.pid),'about:blank'],{windowsHide:true});
 let stderr='',started=false,socket;const timer=setTimeout(()=>{child.kill();server.close();process.exitCode=1;},180000);
 child.stderr.on('data',async chunk=>{
  stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(started||!match)return;started=true;
  try{
   socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no});
   let serial=0;const pending=new Map();socket.onmessage=e=>{const r=JSON.parse(e.data),p=pending.get(r.id);if(!p)return;pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result)};
   const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
   const output=path.join(root,'output/pinned-layout-audit');fs.mkdirSync(output,{recursive:true});
   const results=[];
   for(const [width,height] of (process.env.PLAY_LAYOUT_SIZES ? JSON.parse(process.env.PLAY_LAYOUT_SIZES) : [[390,780],[390,650],[320,650]])){
    const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
    const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},sessionId);if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;};
    await call('Page.enable',{},sessionId);await call('Page.addScriptToEvaluateOnNewDocument',{source:'localStorage.clear()'},sessionId);
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true},sessionId);await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/test'},sessionId);
    for(let i=0;i<250;i++){if(await evaluate('window.__layoutReady?.()'))break;await new Promise(r=>setTimeout(r,30));}
    if(!process.env.PLAY_LAYOUT_NAV_ONLY){
    const baselines={};
if(process.env.PLAY_LAYOUT_WALLS){const bad=[];const run=async tag=>{const rows=JSON.parse(await evaluate(WALLS));rows.forEach(x=>bad.push(tag+' '+width+'x'+height+': '+x))};
 const modes=['quick','party','teamvteam','worlds','daily','monthly','survival','whichbigger','highlow','teamworlds','highstakes','highstakes:bet','bluff','bluff:vote','bluff:summary','bluff:standings','quick:many','teamvteam:many','bluff:many','highstakes:many'];
 for(const mode of modes){await evaluate('window.__layoutAudit('+JSON.stringify(mode)+')');await new Promise(r=>setTimeout(r,2200));await run(mode);
  const top=await evaluate(`(()=>{const c=document.querySelector('#hud.active[data-play-layout=party] .score-col'),p=document.querySelector('#hud.active .question-prompt');if(!c||!p)return null;return {col:Math.round(c.getBoundingClientRect().top),board:Math.round(p.getBoundingClientRect().bottom)}})()`);
  if(top&&top.col>top.board-20)bad.push(mode+' '+width+'x'+height+': score column starts under the board ('+JSON.stringify(top)+') - flat edge, it must reach up behind the board')}
 {await evaluate('window.__layoutAudit("quick:many")');await new Promise(r=>setTimeout(r,700));
  const hit=await evaluate(`(async()=>{const t=document.getElementById('quick-powerups'),sd=document.querySelector('.score-sidebar'),h=document.getElementById('hud');const sr=sd.getBoundingClientRect(),hr=h.getBoundingClientRect();t.innerHTML='<button class="pu-button" id="pb1">Buffer</button>';t.className='pu-l-shape';t.hidden=false;t.style.width='120px';t.style.left=(sr.left+10-hr.left)+'px';t.style.top=(sr.top+90-hr.top)+'px';await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const b=document.getElementById('pb1').getBoundingClientRect();const el=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);const ok=!!el&&!!el.closest('#quick-powerups');t.hidden=true;t.innerHTML='';return ok?'ok':(el&&(el.id||el.className))})()`);
  if(hit!=='ok')bad.push('power-up tray buttons are covered by '+hit+' at '+width+'x'+height+' (they cannot be tapped)')}
 for(const m of ['quick:many','teamvteam:many','party']){await evaluate('window.__layoutAudit("'+m+'")');await new Promise(r=>setTimeout(r,500));await evaluate('window.__layoutPh("animation")');await new Promise(r=>setTimeout(r,900));await run('animation-'+m);
  const an=await evaluate(`(()=>{const c=document.querySelector('#hud.active .main-col'),p=document.querySelector('#hud.active .question-prompt'),st=document.getElementById('anim-stage');if(!c||!p||!document.querySelector('#animation-view.active'))return null;return {lay:document.getElementById('hud').dataset.playLayout,col:Math.round(c.getBoundingClientRect().top),board:Math.round(p.getBoundingClientRect().bottom),scrolls:c.scrollHeight>c.clientHeight+2,stage:st?Math.round(st.getBoundingClientRect().height):0}})()`);
  const pl=await evaluate(`(()=>{const q=document.querySelector('#hud.active .question-prompt'),t=document.getElementById('hud-timer-col')||document.querySelector('#hud.active .hud-timer-col');return {plain:!!q&&q.classList.contains('tw-plain'),timerHidden:!t||getComputedStyle(t).display==='none'}})()`);
  if(!pl.plain||!pl.timerHidden)bad.push('animation-'+m+' '+width+'x'+height+': reveal scene must show the question as a plain pill with no timer ('+JSON.stringify(pl)+')');
  if(!an||an.lay!=='party'||an.col>an.board-20)bad.push('animation-'+m+' '+width+'x'+height+': reveal scene phase lost the party layout / starts flat under the board ('+JSON.stringify(an)+')')}
for(const m of ['quick:many','teamvteam:many','party']){await evaluate('window.__layoutAudit("'+m+'")');await new Promise(r=>setTimeout(r,500));await evaluate('window.__layoutPh("answers")');await new Promise(r=>setTimeout(r,900));await run('answers-'+m);
  const top=await evaluate(`(()=>{const c=document.querySelector('#hud.active .score-col'),p=document.querySelector('#hud.active .question-prompt');if(!c||!p)return null;return {lay:document.getElementById('hud').dataset.playLayout,col:Math.round(c.getBoundingClientRect().top),board:Math.round(p.getBoundingClientRect().bottom)}})()`);
  if(!top||top.lay!=='party'||top.col>top.board-20)bad.push('answers-'+m+' '+width+'x'+height+': second-chance phase lost the score-column layout ('+JSON.stringify(top)+')')}
 for(const n of [4,10]){await evaluate('window.__layoutAudit("quick")');await evaluate('window.__layoutRv('+n+')');await new Promise(r=>setTimeout(r,500));await run('reveal'+n);await evaluate('window.__layoutAudit("quick")');await evaluate('window.__layoutSm('+n+')');await new Promise(r=>setTimeout(r,500));await run('summary'+n)}
 const uniq=[...new Set(bad)];if(uniq.length){console.error('Invisible walls found:\n'+uniq.join('\n'));process.exitCode=1}else console.log('No invisible walls at '+width+'x'+height);continue;}
    if(process.env.PLAY_LAYOUT_RESULTS){
     // Result screens must not cut anything off or leave a big empty gap. (npm run test:result-fit)
     // The score / team column must also reach up behind the board row during the question phase (no flat cut under the board and timer).
     for(const mode of ['quick','teamvteam']){await evaluate('window.__layoutAudit('+JSON.stringify(mode)+')');await new Promise(r=>setTimeout(r,400));
      const q=await evaluate(`(()=>{const c=document.querySelector('.score-col'),r=document.querySelector('.hud-timer-row');if(!c||!c.getClientRects().length)return {none:true};return {colTop:Math.round(c.getBoundingClientRect().top),rowTop:Math.round(r.getBoundingClientRect().top)}})()`);
      if(!q.none&&q.colTop>q.rowTop+1)throw Error('Question phase score column must reach up behind the board row ('+mode+' '+width+'x'+height+'): '+JSON.stringify(q));
      // ...and down behind the bottom bar (no flat cut above it)
      const dn=await evaluate(`(()=>{const c=document.querySelector('.score-col'),t=document.getElementById('bottom-toolbar');if(!c||!c.getClientRects().length||!t||!t.getClientRects().length)return {none:true};return {colBottom:Math.round(c.getBoundingClientRect().bottom),barTop:Math.round(t.getBoundingClientRect().top)}})()`);
      if(!dn.none&&dn.colBottom<dn.barTop-1)throw Error('Question phase score column must reach down behind the bottom bar ('+mode+' '+width+'x'+height+'): '+JSON.stringify(dn));
      // the side panel can be hidden when the layout is first measured (screen intro): the top edge must still catch up when it appears
      await evaluate(`(()=>{const g=document.querySelector('.game-body');g.classList.add('anim-wide');window.dispatchEvent(new Event('resize'))})()`);await new Promise(r=>setTimeout(r,300));
      await evaluate(`document.querySelector('.game-body').classList.remove('anim-wide')`);await new Promise(r=>setTimeout(r,500));
      const late=await evaluate(`(()=>{const c=document.querySelector('.score-col'),r=document.querySelector('.hud-timer-row');return {colTop:Math.round(c.getBoundingClientRect().top),rowTop:Math.round(r.getBoundingClientRect().top)}})()`);
      if(late.colTop>late.rowTop+1)throw Error('Score column top edge must catch up when the side panel appears late ('+mode+' '+width+'x'+height+'): '+JSON.stringify(late));}
     for(const [board,n] of [['',3],['',4],['',10],['phone',4]]){ // 'phone' is a picture board: its art sits inside a taller box, the papers must still sit right under the art
      await evaluate('window.__layoutRv('+n+')');if(board)await evaluate('window.__layoutBoard('+JSON.stringify(board)+')');await new Promise(r=>setTimeout(r,500));
      const m=await evaluate(`(()=>{const lis=[...document.querySelectorAll('#reveal-list > li')].map(l=>l.getBoundingClientRect()),col=document.querySelector('.main-col').getBoundingClientRect(),board=document.querySelector('.question-prompt').getBoundingClientRect(),fit=parseFloat(getComputedStyle(document.getElementById('hud')).getPropertyValue('--rv-fit'))||1;const last=document.querySelectorAll('#reveal-list > li')[lis.length-1];const st=document.querySelector('#reveal-list > li .owner-stamp').getBoundingClientRect();last.scrollIntoView({block:'center'});const after=last.getBoundingClientRect();document.querySelector('.main-col').scrollTop=0;const stg=document.querySelector('#q-stage'),artBottom=stg?stg.getBoundingClientRect().bottom:board.bottom,hit=document.elementFromPoint(board.left+board.width/2,board.top+board.height/2);return {barTop:Math.round(document.getElementById('bottom-toolbar').getBoundingClientRect().top),stampTop:Math.round(st.top),stampClip:Math.round(artBottom-st.top),behind:col.top<=board.top+1,boardOnTop:!!(hit&&hit.closest('.question-prompt')),gap:Math.round(lis[0].top-board.bottom),lastBottom:Math.round(lis[lis.length-1].bottom),colBottom:Math.round(col.bottom),colTop:Math.round(col.top),fit,scrolledIntoView:after.bottom<=col.bottom+1&&after.top>=col.top-1}})()`);
      if(board&&m.gap>(height<700?36:26))throw Error('Reveal papers under the '+board+' board '+width+'x'+height+': big empty gap under the picture '+JSON.stringify(m));
      if(n===4&&!board){const auto=await evaluate(`(async()=>{const h=document.getElementById('hud');['--rv-up','--rv-pad','--rv-fit'].forEach(v=>h.style.removeProperty(v));const rv=document.getElementById('reveal-view');rv.classList.remove('active');await new Promise(r=>setTimeout(r,100));rv.classList.add('active');await new Promise(r=>setTimeout(r,800));return getComputedStyle(h).getPropertyValue('--rv-up')})()`);if(!auto)throw Error('Reveal screen '+width+'x'+height+': opening the reveal view did not re-measure the layout by itself (papers would not reach behind the board in the real game)');}
      if(n===4&&!board){const sc=await evaluate(`(()=>{const c=document.querySelector('.score-col').getBoundingClientRect(),b=document.querySelector('.question-prompt').getBoundingClientRect();return {colTop:Math.round(c.top),boardTop:Math.round(b.top)}})()`);if(sc.colTop>sc.boardTop+1)throw Error('Score column must reach up behind the board '+width+'x'+height+': '+JSON.stringify(sc));}
      if(n===10&&!board){const sc=await evaluate(`(()=>{const col=document.querySelector('.score-col'),bar=document.getElementById('bottom-toolbar').getBoundingClientRect(),cards=[...col.querySelectorAll('.score-card')];col.scrollTop=1e5;const last=cards[cards.length-1].getBoundingClientRect(),cb=col.getBoundingClientRect(),r={cards:cards.length,lastClear:last.bottom<=bar.top+1,reaches:cb.bottom>=bar.bottom-1};col.scrollTop=0;return r})()`);if(sc.cards<10||!sc.lastClear||!sc.reaches)throw Error('Score cards '+width+'x'+height+': '+JSON.stringify(sc));}
      if(m.stampClip>0)throw Error('Reveal papers '+n+' players '+width+'x'+height+': the first avatar runs into the board '+JSON.stringify(m));
      if(!m.behind||!m.boardOnTop)throw Error('Reveal papers '+n+' players '+width+'x'+height+': papers must scroll behind the board (column reaches the board top, board stays on top) '+JSON.stringify(m));
      if(m.gap>40)throw Error('Reveal papers '+n+' players '+width+'x'+height+': big empty gap under the question board '+JSON.stringify(m));
      if(m.fit<0.65)throw Error('Reveal papers '+n+' players '+width+'x'+height+': shrunk too small '+JSON.stringify(m));
      if(n<=3&&m.lastBottom>m.barTop+1)throw Error('Reveal papers '+n+' players '+width+'x'+height+': cut off by the bottom buttons '+JSON.stringify(m));
      if(!m.scrolledIntoView)throw Error('Reveal papers '+n+' players '+width+'x'+height+': last paper cannot scroll into view '+JSON.stringify(m));
      console.log(JSON.stringify({revealPapers:n,width,height,gap:m.gap,fit:m.fit,pass:true}));
     }
     // Round summary: rows start right under the board, scroll behind it and behind the button bar, and the last row can be scrolled clear of the buttons.
     for(const n of [4,10]){
      await evaluate('window.__layoutSm('+n+')');await new Promise(r=>setTimeout(r,500));
      const m=await evaluate(`(()=>{const q=e=>document.querySelector(e).getBoundingClientRect(),board=q('.question-prompt'),col=q('.main-col'),rows=[...document.querySelectorAll('#summary-list > li')],hit=document.elementFromPoint(board.left+board.width/2,board.top+board.height/2),first=rows[0].getBoundingClientRect().top;document.querySelector('.main-col').scrollTop=1e5;const last=rows[rows.length-1].getBoundingClientRect(),bar=q('#bottom-toolbar');const r={gap:Math.round(first-board.bottom),behind:col.top<=board.top+1,boardOnTop:!!(hit&&hit.closest('.question-prompt')),lastClear:last.bottom<=bar.top+1,reaches:col.bottom>=bar.bottom-1};document.querySelector('.main-col').scrollTop=0;return r})()`);
      if(m.gap>40||m.gap<0||!m.behind||!m.boardOnTop||!m.lastClear||!m.reaches)throw Error('Round summary '+n+' players '+width+'x'+height+': '+JSON.stringify(m));
      console.log(JSON.stringify({summaryRows:n,width,height,gap:m.gap,pass:true}));
     }
     // After Lock it in: the answer sits at the bottom with the fact boxes and mascot above it, and nothing overflows.
     for(const mode of ['quick','party','teamvteam']){
      await evaluate('window.__layoutAudit('+JSON.stringify(mode)+')');await new Promise(r=>setTimeout(r,200));
      await evaluate(`document.querySelector('#numpad [data-val="2"]').click();document.getElementById('submit-guess-btn').click();new Promise(r=>setTimeout(r,1500))`);
      const w=await evaluate(`(()=>{const r=e=>{const b=document.querySelector(e)?.getBoundingClientRect();return b?{top:Math.round(b.top),bottom:Math.round(b.bottom)}:null},body=document.querySelector('.play-input-body');return {waiting:document.getElementById('question-view').classList.contains('q-waiting'),facts:r('.qw-facts'),answer:r('#guess-display'),status:r('#guess-status'),body:r('.play-input-body'),preview:r('#q-preview'),overflow:body.scrollHeight-body.clientHeight}})()`);
      if(!w.waiting||!w.facts||!w.answer)throw Error(mode+' '+width+'x'+height+': wait screen missing '+JSON.stringify(w));
      const mc=await evaluate(`(()=>{const box=document.querySelector('.qw-mascot').getBoundingClientRect();document.querySelectorAll('.qw-mascot img').forEach(i=>{i.style.animation='none';i.style.transform='none'});return [...document.querySelectorAll('.qw-mascot img')].map(i=>{const b=i.getBoundingClientRect();return {l:Math.round(b.left-box.left),r:Math.round(box.right-b.right)}})})()`);
      if(mc.some(m=>m.l<-1||m.r<-1))throw Error(mode+' '+width+'x'+height+': wait screen mascot is cut off at the edge '+JSON.stringify(mc));
      const ov=await evaluate(`(()=>{const b=document.querySelector('.play-input-body'),h=document.getElementById('hud');return {ov:getComputedStyle(b).overflowX,density:h.dataset.playDensity||''}})()`);
      if(ov.ov!=='visible'&&ov.density!=='tight')throw Error(mode+' '+width+'x'+height+': the question card box clips its edges (invisible edge) '+JSON.stringify(ov));
      if(w.overflow>1||w.answer.bottom>w.body.bottom+1||w.facts.top<w.preview.bottom-1)throw Error(mode+' '+width+'x'+height+': wait screen does not fit '+JSON.stringify(w));
      console.log(JSON.stringify({waitScreen:mode,width,height,pass:true}));
     }
     continue;
    }
    for(const mode of ['quick','party','teamvteam','worlds','daily','monthly','survival','whichbigger','highlow','teamworlds','highstakes','highstakes:bet','bluff','bluff:vote','bluff:summary','bluff:standings','quick:letterboard','quick:terminal','quick:tv','quick:phone','quick','party','teamvteam'].filter(m=>!(process.env.PLAY_LAYOUT_KEYPAD_ONLY&&m.startsWith('bluff')))){
      await evaluate('window.__layoutAudit('+JSON.stringify(mode)+')');await new Promise(r=>setTimeout(r,400));
      const state=await evaluate(`(()=>{const vis=e=>e.getClientRects().length&&getComputedStyle(e).display!=='none';const owner=[...document.querySelectorAll('[data-play-layout].active,#wb-screen.active')].find(vis);if(!owner)throw Error('No active layout');const pane=owner.querySelector('.play-input-body')||owner.querySelector('.play-middle')||owner.querySelector('.main-col')||owner.querySelector('.wb-play-scroll');const action=[...owner.querySelectorAll('.play-actions button,.wb-play-footer button')].find(vis),pad=[...owner.querySelectorAll('#numpad,.dc-keys')].find(vis),r=e=>{const b=e.getBoundingClientRect();return {top:Math.round(b.top),bottom:Math.round(b.bottom),width:Math.round(b.width),height:Math.round(b.height)}};return {mode:owner.dataset.playLayout,footerBackground:getComputedStyle(owner.querySelector('.play-actions,.wb-play-footer')).backgroundColor,overflow:pane?(owner.id==='wb-screen'?Math.max(0,(pane.lastElementChild?.offsetTop||0)+(pane.lastElementChild?.offsetHeight||0)-pane.clientHeight):pane.scrollHeight-pane.clientHeight):0,action:action?r(action):null,pad:pad?r(pad):null,key:pad?r(pad.querySelector('button')):null,cards:document.querySelectorAll('#score-col .score-card').length,duplicateSubmit:document.querySelectorAll('#submit-guess-btn').length,health:window.__layoutHealth()};})()`);
      if(state.footerBackground!=='rgba(0, 0, 0, 0)')throw Error(mode+' action panel is opaque '+state.footerBackground);
      if(mode==='bluff'){ // Bluff: with many players only the two player columns scroll (each on its own); the board and the middle area never move.
       const bl=await evaluate(`(async()=>{const cols=[...document.querySelectorAll('#bluff-screen .bl-table>.hs-col')];cols.forEach(c=>{const t=c.querySelector('.hs-pl');for(let i=0;i<3;i++)c.appendChild(t.cloneNode(true))});window.dispatchEvent(new Event('resize'));await new Promise(r=>setTimeout(r,500));const m=document.querySelector('#bluff-screen .play-middle'),mid=document.querySelector('#bluff-screen .hs-mid'),top=mid.getBoundingClientRect().top;cols[0].scrollTop=100;await new Promise(r=>setTimeout(r,80));return {middleScrolls:m.scrollHeight>m.clientHeight+1,c0:cols[0].scrollHeight>cols[0].clientHeight+1,c0Top:cols[0].scrollTop,c1Top:cols[1].scrollTop,midMoved:Math.round(mid.getBoundingClientRect().top-top)}})()`);
       if(bl.middleScrolls||!bl.c0||bl.c0Top<50||bl.c1Top!==0||bl.midMoved!==0)throw Error('Bluff columns must scroll on their own while the board stays still '+width+'x'+height+': '+JSON.stringify(bl));
       await evaluate('window.__layoutAudit("bluff")');await new Promise(r=>setTimeout(r,180));
      }
      if(mode==='bluff'){ // a rebuild (someone locking in) must keep the scrolled columns where they were
       await evaluate('window.__layoutAudit("bluff:many")');await new Promise(r=>setTimeout(r,250));
       const keep=await evaluate(`(async()=>{const cols=[...document.querySelectorAll('#bluff-screen .bl-table>.hs-col')];if(!(cols[0].scrollHeight>cols[0].clientHeight+40))return {skip:true,sh:cols[0].scrollHeight,ch:cols[0].clientHeight};cols[0].scrollTop=90;cols[1].scrollTop=40;const a=[cols[0].scrollTop,cols[1].scrollTop];window.__layoutBluffRefresh();await new Promise(r=>setTimeout(r,400));const n=[...document.querySelectorAll('#bluff-screen .bl-table>.hs-col')];return {a,b:[n[0].scrollTop,n[1].scrollTop],same:n[0]===cols[0]}})()`);
       if(!keep.skip&&(Math.abs(keep.b[0]-keep.a[0])>8||Math.abs(keep.b[1]-keep.a[1])>8))throw Error('Bluff columns jumped back after a rebuild '+width+'x'+height+': '+JSON.stringify(keep));
       await evaluate('window.__layoutAudit("bluff")');await new Promise(r=>setTimeout(r,180));
      }
      if(mode==='highstakes'){ // High Stakes with a full table: only the two player columns scroll (each on its own), the board never moves, and a rebuild keeps them where they were
       await evaluate('window.__layoutAudit("highstakes:many")');await new Promise(r=>setTimeout(r,250));
       const hk=await evaluate(`(async()=>{const q=()=>[...document.querySelectorAll('#hs-screen .hs-board>.hs-col')],cols=q(),m=document.querySelector('#hs-screen .play-middle'),mid=document.querySelector('#hs-screen .hs-mid');if(!(cols[0].scrollHeight>cols[0].clientHeight+40))return {skip:true,sh:cols[0].scrollHeight,ch:cols[0].clientHeight};const top=mid.getBoundingClientRect().top;cols[0].scrollTop=90;cols[1].scrollTop=40;await new Promise(r=>setTimeout(r,80));const a=[cols[0].scrollTop,cols[1].scrollTop],moved=Math.round(mid.getBoundingClientRect().top-top),middleScrolls=m.scrollHeight>m.clientHeight+1;window.__layoutHsRefresh();await new Promise(r=>setTimeout(r,400));const n=q();return {a,b:[n[0].scrollTop,n[1].scrollTop],moved,middleScrolls}})()`);
       if(!hk.skip&&(hk.middleScrolls||hk.moved!==0||hk.a[0]<50||hk.a[1]<20||Math.abs(hk.b[0]-hk.a[0])>8||Math.abs(hk.b[1]-hk.a[1])>8))throw Error('High Stakes columns must scroll on their own, keep their place after a rebuild, and leave the board still '+width+'x'+height+': '+JSON.stringify(hk));
       await evaluate('window.__layoutAudit("highstakes")');await new Promise(r=>setTimeout(r,180));
      }
      const isQuestion=!mode.includes(':')||mode==='bluff:vote'||mode.startsWith('quick:');
      if(isQuestion&&state.overflow>1)throw Error(mode+' '+width+'x'+height+' question overflow '+JSON.stringify(state));
      if(state.pad&&state.action&&state.pad.bottom>state.action.top)throw Error(mode+' action overlaps keypad '+JSON.stringify(state));
      if(state.key&&(state.key.width<44||state.key.width>73||state.key.height<(height<=600?26:height<=700||['highlow','teamworlds'].includes(mode)?28:44)))throw Error(mode+' stretched/tiny keys '+JSON.stringify(state.key));
      if(state.action&&state.action.bottom>height)throw Error(mode+' action outside viewport');
      if(['quick','party','teamvteam'].includes(mode)){
       const expected=mode==='teamvteam'?2:4;if(state.cards!==expected)throw Error(mode+' missing player/team cards '+state.cards);
       if(!state.health.sameSubmit||!state.health.samePad||state.duplicateSubmit!==1)throw Error('Shared input identity changed');
       const footprint=JSON.stringify({padWidth:state.pad.width,padHeight:state.pad.height,keyWidth:state.key.width,keyHeight:state.key.height,action:state.action,cards:state.cards});if(baselines[mode]&&baselines[mode]!==footprint)throw Error(mode+' changed after another mode before '+baselines[mode]+' after '+footprint);baselines[mode]=footprint;
      }
      const pin=await evaluate(`(()=>{const owner=[...document.querySelectorAll('[data-play-layout].active,#wb-screen.active')].find(e=>e.getClientRects().length),pane=owner.querySelector('.play-input-body')||owner.querySelector('.play-middle')||owner.querySelector('.main-col')||owner.querySelector('.wb-play-scroll'),header=owner.querySelector('.play-status,.wb-play-header')||owner.querySelector('.hud-timer-row'),footer=owner.querySelector('.play-actions,.wb-play-footer');if(!pane||!footer)return true;const h=header?.getBoundingClientRect().top,f=footer.getBoundingClientRect().top,extra=document.createElement('div');extra.style.height='900px';pane.append(extra);pane.scrollTop=pane.scrollHeight;const stable=Math.abs((header?.getBoundingClientRect().top??h)-h)<1&&Math.abs(footer.getBoundingClientRect().top-f)<1;extra.remove();pane.scrollTop=0;return {stable,h,f,afterH:header?.getBoundingClientRect().top,afterF:footer.getBoundingClientRect().top};})()`);if(!pin.stable)throw Error(mode+' controls moved while middle scrolled '+JSON.stringify(pin));
      const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(root,'output/pinned-layout-audit',mode.replace(':','-')+'-checked-'+width+'-'+height+'.png'),Buffer.from(shot.data,'base64'));
      if(['quick','party','teamvteam','highlow','teamworlds'].includes(mode)){
       await evaluate(`document.querySelector('#numpad [data-val="2"]').click();window.__layoutRefresh()`);
       if(!await evaluate(`window.__layoutHealth().sameSubmit&&window.__layoutHealth().submitCount===1`))throw Error('Duplicate remounted input');
       await evaluate(`document.getElementById('submit-guess-btn').click();new Promise(resolve=>setTimeout(resolve,30))`);
       if(await evaluate(`window.__fakeDB.read('rooms/AUDIT/guesses/me')`)!==2)throw Error(mode+' lost submit handler');
      }
      console.log(JSON.stringify({mode,width,height,overflow:state.overflow,pass:true}));results.push({mode,width,height,...state});
    }
    for(const mode of ['survival','worlds','daily','monthly','quick','teamworlds']){
     await evaluate('window.__layoutReveal('+JSON.stringify(mode)+')');
     const stageId={survival:'sv-stage',worlds:'wl-stage',daily:'daily-stage',monthly:'mo-stage'}[mode]||'anim-stage';
     let state;
     for(let i=0;i<100;i++){
      state=await evaluate(`(()=>{const stage=document.getElementById('${stageId}'),canvas=stage?.querySelector('canvas');if(!canvas||!stage.style.height||canvas.height<100)return null;const owner=stage.closest('.screen,#hud'),footer=owner.querySelector('.play-actions'),bottom=document.getElementById('bottom-toolbar');const limit=footer?.getBoundingClientRect().top||(bottom.getClientRects().length?bottom.getBoundingClientRect().top:innerHeight);return {bottom:stage.getBoundingClientRect().bottom,limit,background:footer?getComputedStyle(footer).backgroundColor:null,help:!!owner.querySelector('#sv-help'),overflow:owner.querySelector('.play-middle')?.scrollHeight-owner.querySelector('.play-middle')?.clientHeight};})()`);
      if(state)break;await new Promise(r=>setTimeout(r,30));
     }
     if(!state||Math.abs(state.limit-state.bottom)>6)throw Error(mode+' reveal does not fill available height '+JSON.stringify(state));
     if(mode==='survival'&&state.help)throw Error('Survival reveal still has scoring help');
     if(state.background&&state.background!=='rgba(0, 0, 0, 0)')throw Error(mode+' Skip has opaque panel '+JSON.stringify(state));
     const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(output,mode+'-reveal-'+width+'-'+height+'.png'),Buffer.from(shot.data,'base64'));
     if(mode==='survival'){
      await evaluate("document.getElementById('sv-skip').click();new Promise(r=>setTimeout(r,60))");
      if(!await evaluate("!!document.getElementById('sv-next')&&!!document.querySelector('#survival-content .wb-verdict')?.textContent.trim()"))throw Error('Survival Skip lost result/next handler');
     }
     console.log(JSON.stringify({mode:mode+':reveal',width,height,...state,pass:true}));
    }
    if(process.env.PLAY_LAYOUT_KEYPAD_ONLY)continue; // keypad-fit run (npm run test:keypad-fit): every mode's keypad and Lock button stay on screen; skip the slower timing checks
    for(const sample of [{count:1,sum:70.6,last:70.6,expected:'No answers yet'},{count:2,sum:160,last:70,expected:'90%'},{count:2,sum:110,last:90,expected:'20%'}]){
     const progress=await evaluate('window.__layoutAccuracy('+[sample.count,sample.sum,sample.last].join(',')+')');
     if(progress.before!==sample.expected||progress.refreshed!==sample.expected)throw Error('Accuracy spoiled unfinished round '+JSON.stringify(progress));
     await new Promise(r=>setTimeout(r,2200));
     const after=await evaluate("window.__layoutAccuracyAfter()");
     if(after!==(sample.sum/sample.count)+'%')throw Error('Game Progress did not update accuracy '+after);
     console.log(JSON.stringify({accuracyTiming:true,width,height,...progress,after,pass:true}));
    }
    for(const count of [1,2]){
     const solo=await evaluate('window.__layoutSoloTiming('+count+')');const previous=count===1?'No answers yet':'50%';
     if(solo.before!==previous||solo.refreshed!==previous||solo.resultStart!==(count===1?'0%':'50%'))throw Error('Solo Worlds spoils pending accuracy '+JSON.stringify(solo));
     await new Promise(r=>setTimeout(r,3800));const after=await evaluate('window.__layoutSoloAfter()');if(after!==(count===1?'100%':'75%'))throw Error('Solo Worlds result meter failed '+after);
     console.log(JSON.stringify({soloTiming:count,width,height,...solo,after,pass:true}));
    }
    for(const mode of ['quick','party','teamvteam']){
     const scores=await evaluate('window.__layoutPartyTiming('+JSON.stringify(mode)+')');
     if(scores.before.some(p=>p.acc!=='50%'||p.score!=='0')||scores.after.some(p=>!['75%','25%'].includes(p.acc)))throw Error(mode+' score/accuracy timing failed '+JSON.stringify(scores));
     console.log(JSON.stringify({mode:mode+':accuracy',width,height,...scores,pass:true}));
    }
    const cues=await evaluate('window.__layoutOtherTiming()');if(cues.flameBefore||!cues.flameAfter||cues.dangerBefore||!cues.dangerAfter||cues.survivalBefore.acc!=='100%'||cues.survivalBefore.full!==3||cues.survivalAfter!=='75%')throw Error('Early result cues '+JSON.stringify(cues));
    console.log(JSON.stringify({otherTiming:true,width,height,...cues,pass:true}));
    }
    if(process.env.PLAY_LAYOUT_NAV_ONLY){
     const backIds={worlds:'worlds-close-btn',daily:'daily-close-btn',monthly:'monthly-close-btn',survival:'survival-close-btn',whichbigger:'wb-close-btn'};
     const routes={back:null,home:'toolbar-home-btn',shop:'toolbar-shop-btn',style:'toolbar-cosmetics-btn',stats:'toolbar-awards-btn',coins:'toolbar-coin-balance',settings:'menu-settings-btn',phoneBack:null};
     for(const mode of Object.keys(backIds))for(const phase of ['question','reveal',...(['worlds','whichbigger'].includes(mode)?['result']:[])]){
      for(const route of (phase==='question'?Object.keys(routes):['back','phoneBack'])){
       await evaluate('window.__exitSetup('+JSON.stringify(mode)+','+JSON.stringify(phase)+')');
       const tap=route==='phoneBack'?"window.dispatchEvent(new PopStateEvent('popstate'))":"document.getElementById("+JSON.stringify(route==='back'?backIds[mode]:routes[route])+").click()";
       await evaluate(tap);let state=await evaluate('window.__exitRead()');if(!state.dialog||!state.run)throw Error('Missing leave confirmation '+JSON.stringify({mode,phase,route,state}));
       await evaluate("document.getElementById('exit-confirm-no-btn').click()");state=await evaluate('window.__exitRead()');if(state.dialog||!state.run)throw Error('Cancel left the run '+JSON.stringify({mode,phase,route,state}));
       await evaluate(tap);await evaluate("document.getElementById('exit-confirm-yes-btn').click();new Promise(r=>setTimeout(r,60))");state=await evaluate('window.__exitRead()');if(state.dialog||state.run)throw Error('Confirm did not leave '+JSON.stringify({mode,phase,route,state}));
      }
      console.log(JSON.stringify({mode,phase,width,height,backConfirmation:true,pass:true}));
     }
     for(const mode of ['party','teamvteam','teamworlds','highlow','highstakes','bluff'])for(const host of [true,false]){
      await evaluate('window.__exitRoom('+JSON.stringify(mode)+','+host+')');
      const tap=host?"window.dispatchEvent(new PopStateEvent('popstate'))":(mode==='highstakes'||mode==='bluff'?"document.getElementById('toolbar-home-btn').click()":"document.getElementById('exit-btn-guest').click()");
      await evaluate(tap);const state=await evaluate('window.__exitRead()');if(!state.dialog)throw Error('Missing room confirmation '+JSON.stringify({mode,host,state}));
      await evaluate("document.getElementById('exit-confirm-no-btn').click()");
     }
     for(const host of [true,false]){
      await evaluate('window.__exitLobby('+host+')');await evaluate("document.getElementById('lobby-back-btn').click()");
      if(!(await evaluate('window.__exitRead()')).dialog)throw Error('Lobby Back bypassed confirmation');
      await evaluate("document.getElementById('exit-confirm-no-btn').click()");if(!await evaluate("document.getElementById('lobby-screen').classList.contains('active')&&window.__fakeDB.read('rooms/AUDIT/players/me')!==null"))throw Error('Cancel left lobby');
      await evaluate("document.getElementById('lobby-back-btn').click();document.getElementById('exit-confirm-yes-btn').click();new Promise(r=>setTimeout(r,100))");if(await evaluate("document.getElementById('lobby-screen').classList.contains('active')"))throw Error('Confirmed lobby Back stayed in lobby');
     }
     console.log(JSON.stringify({width,height,roomExitConfirmation:true,pass:true}));
    }
    await call('Target.closeTarget',{targetId});
   }
   fs.writeFileSync(path.join(root,'output/pinned-layout-audit/verified-all-mode-measurements.json'),JSON.stringify(results,null,2));
  }catch(e){console.error(e);process.exitCode=1}finally{clearTimeout(timer);socket?.close();child.kill();server.close();}
 });
});
