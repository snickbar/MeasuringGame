// Phone-layout regression with isolated Firebase/storage; no live player writes.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),vm=require('vm'),{spawn}=require('child_process');
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
   for(const [width,height] of (process.env.PLAY_LAYOUT_SIZES ? JSON.parse(process.env.PLAY_LAYOUT_SIZES) : [[390,780],[390,650],[320,650]])){
    const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
    const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},sessionId);if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;};
    await call('Page.enable',{},sessionId);await call('Page.addScriptToEvaluateOnNewDocument',{source:'localStorage.clear()'},sessionId);
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true},sessionId);await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/test'},sessionId);
    for(let i=0;i<250;i++){if(await evaluate('window.__layoutReady?.()'))break;await new Promise(r=>setTimeout(r,30));}
    if(!process.env.PLAY_LAYOUT_NAV_ONLY){
    const baselines={};
    for(const mode of ['quick','party','teamvteam','worlds','daily','monthly','survival','whichbigger','highlow','teamworlds','highstakes','highstakes:bet','bluff','bluff:vote','bluff:summary','bluff:standings','quick:letterboard','quick:terminal','quick:tv','quick:phone','quick','party','teamvteam']){
      await evaluate('window.__layoutAudit('+JSON.stringify(mode)+')');await new Promise(r=>setTimeout(r,180));
      const state=await evaluate(`(()=>{const vis=e=>e.getClientRects().length&&getComputedStyle(e).display!=='none';const owner=[...document.querySelectorAll('[data-play-layout].active,#wb-screen.active')].find(vis);if(!owner)throw Error('No active layout');const pane=owner.querySelector('.play-input-body')||owner.querySelector('.play-middle')||owner.querySelector('.main-col')||owner.querySelector('.wb-play-scroll');const action=[...owner.querySelectorAll('.play-actions button,.wb-play-footer button')].find(vis),pad=[...owner.querySelectorAll('#numpad,.dc-keys')].find(vis),r=e=>{const b=e.getBoundingClientRect();return {top:Math.round(b.top),bottom:Math.round(b.bottom),width:Math.round(b.width),height:Math.round(b.height)}};return {mode:owner.dataset.playLayout,footerBackground:getComputedStyle(owner.querySelector('.play-actions,.wb-play-footer')).backgroundColor,overflow:pane?(owner.id==='wb-screen'?Math.max(0,(pane.lastElementChild?.offsetTop||0)+(pane.lastElementChild?.offsetHeight||0)-pane.clientHeight):pane.scrollHeight-pane.clientHeight):0,action:action?r(action):null,pad:pad?r(pad):null,key:pad?r(pad.querySelector('button')):null,cards:document.querySelectorAll('#score-col .score-card').length,duplicateSubmit:document.querySelectorAll('#submit-guess-btn').length,health:window.__layoutHealth()};})()`);
      if(state.footerBackground!=='rgba(0, 0, 0, 0)')throw Error(mode+' action panel is opaque '+state.footerBackground);
      const isQuestion=!mode.includes(':')||mode==='bluff:vote'||mode.startsWith('quick:');
      if(isQuestion&&state.overflow>1)throw Error(mode+' '+width+'x'+height+' question overflow '+JSON.stringify(state));
      if(state.pad&&state.action&&state.pad.bottom>state.action.top)throw Error(mode+' action overlaps keypad '+JSON.stringify(state));
      if(state.key&&(state.key.width<44||state.key.width>73||state.key.height<44))throw Error(mode+' stretched/tiny keys '+JSON.stringify(state.key));
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
