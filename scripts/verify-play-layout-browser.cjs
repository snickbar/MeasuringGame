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
 '.qp-win',          // helper-picture slot reel: a short spin inside a picture-sized window
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
 if(${process.env.SUP_STRESS?1:0})Object.values(players).forEach((p,i)=>{p.supporter=true;p.nameColor=['golden','sky','rose','mint','violet','sunset'][i%6];});window.__supN=Object.values(players).filter(p=>p.supporter).length; // SUP_STRESS=1: every player is a supporter, to check the medal and name colour never break a card
 currentPlayers=players;lastScoreColumnSignature='';
 if(mode==='highstakes'){roomState.phase='hs';roomState.hsQ=q;const hs=HS.hsNewGame(Object.keys(players),100);roomState.hs=HS.hsStartRound(hs,{options:[1,2,3,4],realIdx:2,fakeBy:{},now:Date.now()});if(variant==='bet'){roomState.hs=HS.hsBeginBetting(roomState.hs,Object.fromEntries(Object.keys(players).map(id=>[id,0])),Date.now());roomState.hs.bet.turn='me';}if(variant==='reveal'||variant==='revlose'){const ids=Object.keys(players),picks=Object.fromEntries(ids.map((id,i)=>[id,variant==='reveal'?(id==='me'?2:0):(id==='me'?0:2)]));let h=HS.hsBeginBetting(roomState.hs,picks,Date.now());h=HS.hsResolve(h);h.animEndsAt=Date.now()-1;roomState.hs=h;}}
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
 Object.keys(currentPlayers).slice(0,n).forEach((id,i)=>{const li=document.createElement('li');li.className='summary-row';li.dataset.id=id;li.innerHTML='<div class="summary-row-top"><span class="avatar">'+avatarHtml(currentPlayers[id].avatar)+'</span><span class="name">'+nameHtml(currentPlayers[id])+'</span></div><div class="summary-row-body lines-2"><div class="breakdown"><span class="breakdown-chip">+2 Closest</span><span class="breakdown-chip">+1 Perfect!</span></div><span class="roundpts">+3</span></div>';list.appendChild(li);});
 document.getElementById('hud').dataset.phase='summary'; document.getElementById('question-view').classList.remove('active');document.getElementById('reveal-view').classList.remove('active');document.getElementById('summary-view').classList.add('active');
 const b=document.getElementById('bottom-actions');b.removeAttribute('data-bar-empty');getPlayLayout().measure();
 return n;
};
window.__layoutSummaryPhase=async mode=>{await window.__layoutAudit(mode);stopAnimation();animScene=null;animSceneRound=null;roomState.phase='summary';applyPhase(roomState);};
window.__layoutHsRefresh=()=>{roomState.players.me.layoutTick=(roomState.players.me.layoutTick||0)+1;renderHighStakes(roomState);};
window.__layoutBluffRefresh=()=>{roomState.players.me.layoutTick=(roomState.players.me.layoutTick||0)+1;bluffUI.refresh();};
window.__layoutBoard=id=>{roomState.board=id;applyBoard(id);getPlayLayout().measure();};
window.__layoutPh=async ph=>{if(ph==='animation'){roomState={...roomState,phase:'animation',animEndsAt:Date.now()+60000};}else if(ph==='answers'){const ids=Object.keys(currentPlayers);roomState={...roomState,phase:'answers',answersEndsAt:Date.now()+60000,answers:ids.map((id,i)=>({playerId:id,value:10+i*7.3+(i%3)})),picks:{}};}else roomState={...roomState,phase:ph};applyPhase(roomState);if(ph==='answers')renderAnswersScreen(roomState);};
window.__layoutSvRes=res=>{sv={...sv,phase:'result',g:res.g||32,lives:3,res:{themed:'',checkpoint:0,saved:false,earned:false,dot:0,near:false,boost:'',ans:'57.2',...res}};renderSurvival();};
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
// Quick robot (anim/quick-robot.mjs): he waits on your card, then reacts (looping) to one accuracy. Reports where he stands.
const robotSnap=()=>{const el=document.querySelector('.qr-robot'),card=scoreColEl.querySelector('.score-card'),hud=document.getElementById('hud').getBoundingClientRect();
 if(!el)return null;const r=el.getBoundingClientRect(),c=card?card.getBoundingClientRect():null,sp=el.querySelector('.qr-sprite'),board=document.querySelector('.question-prompt').getBoundingClientRect(),cs=getComputedStyle(el);
 return {reaction:el.dataset.reaction,visible:cs.visibility==='visible'&&cs.opacity!=='0',on:el.classList.contains('on'),off:el.classList.contains('off'),reacting:el.classList.contains('reacting'),image:getComputedStyle(sp).backgroundImage.includes('quick-robot-react-'),frames:getComputedStyle(sp).getPropertyValue('--n').trim(),pos:sp.style.backgroundPosition,
  rect:{l:Math.round(r.left),t:Math.round(r.top),r:Math.round(r.right),b:Math.round(r.bottom)},card:c&&{l:Math.round(c.left),t:Math.round(c.top),r:Math.round(c.right)},hud:{l:Math.round(hud.left),r:Math.round(hud.right)},boardTop:Math.round(board.top),boardBottom:Math.round(board.bottom)};};
const robotWait=ms=>new Promise(r=>setTimeout(r,ms));
window.__layoutRobotHide=()=>{quickRobot.hide();partyAnt.hide();};
window.__layoutWbStreak=n=>{Object.assign(wb,{phase:'result',ok:true,picked:wb.pair.bigger.id,score:n,streak:n,prevStreak:n-1});renderWhichBigger();return document.querySelectorAll('.wb-streak-chip').length;};
window.__layoutWbResult=()=>{Object.assign(wb,{phase:'result',ok:true,picked:wb.pair.bigger.id,score:1,prevStreak:0});renderWhichBigger();};
// Classic Party ant (anim/party-ant.mjs): stands on the TOP score card, then reacts to every revealed paper by finishing place.
window.__layoutAnt=async()=>{quickRobot.hide();partyAnt.hide();const solo=roomState.settings.solo;roomState.settings.solo=false;
 const snap=()=>{const el=document.querySelector('.pa-ant'),card=scoreColEl.querySelector('.score-card'),hud=document.getElementById('hud').getBoundingClientRect();if(!el)return null;const r=el.getBoundingClientRect(),c=card?card.getBoundingClientRect():null,cs=getComputedStyle(el);
  return {reaction:el.dataset.reaction,visible:cs.visibility==='visible'&&cs.opacity!=='0',off:el.classList.contains('off'),rect:{l:Math.round(r.left),r:Math.round(r.right),b:Math.round(r.bottom)},card:c&&{t:Math.round(c.top),id:card.dataset.id},hud:{l:Math.round(hud.left),r:Math.round(hud.right)}};};
 const order=roomState.revealOrder.slice(),key=roomState.gameId+':'+roomState.round;
 // arrives with the second-chance page, steps aside (not out) for the reveal scene, and is back without a second slide-in
 standMascots('answers');await robotWait(1000);const arrived=snap(),pop=document.querySelector('.pa-pop'),slide=pop.getAnimations()[0];standMascots('animation');await robotWait(200);const held=snap();
 standMascots('reveal');await robotWait(300);const back=snap(),slideAgain=pop.getAnimations()[0]!==slide;
 partyAnt.sync(key,order,0);await robotWait(300);const idle=snap();const reactions=[];
 for(let i=1;i<=order.length;i++){partyAnt.sync(key,order,i);await robotWait(1000);reactions.push(partyAnt.reaction);}
 const end=snap();partyAnt.hide();
 // Team vs Team: a cat pair one round, a dog pair the next
 const mode0=roomState.settings.mode,round0=roomState.round,sets=[];roomState.settings.mode='teamvteam';
 for(const r of [1,2,3]){roomState.round=r;partyAnt.hide();standMascots('answers');await robotWait(400);const sn=snap();sets.push(document.querySelector('.pa-ant').dataset.set);partyAnt.sync(roomState.gameId+':'+r,order,order.length);await robotWait(700);sets.push(document.querySelector('.pa-ant').dataset.reaction+(sn&&sn.card&&Math.abs(sn.rect.b-sn.card.t)<=10?':on-card':':NOT-on-card'));}
 partyAnt.hide();roomState.settings.mode=mode0;roomState.round=round0;roomState.settings.solo=solo;return {arrived,held,back,slideAgain,idle,reactions,end,sets};};
window.__layoutAntShow=async i=>{partyAnt.hide();roomState.settings.solo=false;const order=roomState.revealOrder.slice(),key='antshot:'+Math.random();partyAnt.sync(key,order,0);await robotWait(1000);partyAnt.sync(key,order,i);await robotWait(1100);};
window.__layoutQWaitExit=async()=>{const qv=document.getElementById('question-view'),scene=document.getElementById('q-wait-scene');qWaitKey=qWaitLastKey='audit:wait:'+Math.random();qWaitExited='';qWaitSeen=null;
 scene.querySelector('.qw-mascot').innerHTML='<img src="anim/mode-mascots/party-ant-tutorial.webp" alt="">';const wasQ=qv.classList.contains('active');qv.classList.add('active','q-waiting','q-wait-ready');scene.hidden=false;scene.querySelector('.qw-mascot').style.cssText='opacity:1;flex:none;height:80px;width:173px';await robotWait(100);
 const mm=scene.querySelector('.qw-mascot'),dbg={h:Math.round(mm.getBoundingClientRect().height),op:getComputedStyle(mm).opacity,key:qWaitKey,ex:qWaitExited,hid:scene.hidden};const m=mm.getBoundingClientRect(),n0=document.body.querySelectorAll(':scope > div[aria-hidden=true]').length;qWaitSnap();scene.hidden=true;qv.classList.remove('q-waiting','q-wait-ready');qWaitExit('answers'); /* the screen is already gone when the exit is asked for */
 const n1=document.body.querySelectorAll(':scope > div[aria-hidden=true]').length,c=document.body.querySelector(':scope > div[aria-hidden=true]:last-child'),r1=c&&c.getBoundingClientRect();await robotWait(260);const r2=c&&c.getBoundingClientRect();await robotWait(700);
 const n2=document.body.querySelectorAll(':scope > div[aria-hidden=true]').length;scene.querySelector('.qw-mascot').style.cssText='';qWaitKey='';scene.hidden=true;qv.classList.remove('q-waiting','q-wait-ready');if(!wasQ)qv.classList.remove('active');return {dbg,w:Math.round(m.width),n0,n1,n2,moved:r1&&r2?Math.round(r1.left-r2.left):0};};
window.__layoutAntTeam=async r=>{partyAnt.hide();roomState.round=r;const order=(roomState.revealOrder&&roomState.revealOrder.length)?roomState.revealOrder:Object.keys(currentPlayers).map(id=>({playerId:id,accuracyPercent:50}));standMascots('answers');await robotWait(900);partyAnt.sync(roomState.gameId+':'+r,order,order.length);await robotWait(1100);return document.querySelector('.pa-ant')&&document.querySelector('.pa-ant').dataset.set;};
window.__layoutRobotIdle=async()=>{quickRobot.hide();quickRobot.stand('idle:'+Math.random());await robotWait(1300);return robotSnap();};
window.__layoutRobot=async acc=>{quickRobot.hide();const key='test:'+Math.random();quickRobot.stand(key);await robotWait(700);
 const idle=robotSnap();quickRobot.react(key,acc);await robotWait(1500);
 const out=robotSnap(),seen=new Set();for(let i=0;i<5;i++){seen.add(robotSnap().pos);await robotWait(FRAME_PROBE_MS);}
 return {...out,idle,positionsSeen:seen.size};};
// With many players the score column scrolls: he must keep standing on his card (not vanish) while it scrolls up under the board.
window.__layoutRobotScroll=async()=>{quickRobot.hide();quickRobot.stand('scroll:'+Math.random());await robotWait(500);
 const col=scoreColEl;if(col.scrollHeight<=col.clientHeight+20)return {scrollable:false};
 const before=robotSnap();col.scrollTop=Math.min(col.scrollHeight-col.clientHeight,45);await robotWait(250);const after=robotSnap();col.scrollTop=0;
 return {scrollable:true,before,after};};
const FRAME_PROBE_MS=300;
// Monthly always plays on its own month's question board (the fixture's month is 2026-10, board mb10), whatever board is equipped.
window.__layoutDailyResult=async()=>{await window.__layoutAudit('daily');daily.guesses=[3];daily.res={i:0,acc:100,ok:true,ans:'3',label:'Perfect!',side:wbSidePick(true,2,'',false,true),quip:'Nailed it'};daily.phase='result';renderDaily();};
window.__layoutReaction=pid=>{if(window.__rxd)return document.querySelectorAll('.rx-from').length;window.__rxd=1;const sc=document.getElementById('score-col');if(sc)sc.scrollTop=0;renderReactionBubble({playerId:pid,emoji:Object.keys(REACTIONS)[0],at:Date.now()});return document.querySelectorAll('.rx-from').length;};
window.__layoutWorldsDone=st=>{const q={unitId:'donut',targetId:'watermelon',answer:3,prompt:'x'};wl.questions=[q,q,q];wl.guesses=[3,3,3];wl.stars=st;wl.runId='audit';wl.phase='done';renderWorlds();return 1;};
window.__layoutWorldsResult=acc=>{const q={unitId:'donut',targetId:'watermelon',answer:3,prompt:'x'};wl.questions=[q,q,q,q,q];wl.guesses=[3*acc,3];wl.runId='audit';wl.phase='result';renderWorlds();return 1;};
window.__layoutNotSolo=()=>{roomState.settings.solo=false;roomState.lastRoundPoints={me:5,friend:5,third:3,fourth:3};return 1;};
window.__layoutHlSummary=(high,low,passed,tooWide)=>{const ans=roomState.currentQuestion.answer;roomState.hlLast={passed:!!passed,tooWide:!!tooWide,crossed:false,inSync:low<=ans&&ans<=high,high,low,ratio:high/low,limit:2.5,previousLives:3};roomState.hlLives=passed?3:2;roomState.revealOrder=[{playerId:'friend',name:'Daddiooo',role:'high'},{playerId:'me',name:'BuzzyBea',role:'low'}];roomState.phase='summary';applyPhase(roomState);twSummarySig=null;renderTeamWorldsSummary(roomState);return roomState.currentQuestion.answer;};
window.__layoutSummaryKeep=()=>{stopAnimation();animScene=null;animSceneRound=null;roomState.phase='summary';applyPhase(roomState);return 1;};
window.__layoutExitConfirm=async()=>{await window.__layoutAudit('daily');openExitConfirm('quickResume','Resume your Quick Game?','Round 2 of 5 is saved. Pick up where you left off, or start a new game (this drops the saved one).','Resume','Start new');};
window.__layoutMenuShot=async kind=>{exitConfirmOverlayEl.classList.remove('show');await window.__layoutAudit(kind==='survival'?'survival':kind==='wb'?'whichbigger':'worlds');
 const L=(m,o)=>localStorage.setItem('mg_resume_'+deviceId+'_'+m,JSON.stringify(o));
 if(kind==='survival'){L('survival',{runId:'r1',survived:4,lives:2,phase:'question',q:{unitId:'donut',targetId:'watermelon',answer:3,prompt:'x'}});sv={phase:'intro',...(sv||{}),phase:'intro'};renderSurvival();}
 else if(kind==='wb'){L('wb',{runId:'r1',lives:2,round:3,score:2});wb={...wb,phase:'intro'};renderWhichBigger();}
 else {L('worlds',{runId:'r1',wi:0,level:2});openWorlds();}
};
window.__layoutSettingsPeek=async y=>{exitConfirmOverlayEl.classList.remove('show');await window.__layoutAudit('quick');setSettingsOverGame(true);settingsScreen.scrollTop=y;};
window.__layoutMonthlyShot=async kind=>{exitConfirmOverlayEl.classList.remove('show');await window.__layoutAudit('monthly');
 if(kind==='intro'||kind==='hub'||kind==='level-final'){const q0=mo.questions[0];Object.assign(mo,{combos:[q0,q0,q0],all:[q0,q0,q0],split:{1:[0,1,2],2:[],3:[],4:[]},prog:{},level:kind==='hub'?0:1,phase:kind==='level-final'?'done':kind,guesses:kind==='level-final'?[3,2,5]:[],practice:false,coins:12,flairShown:true});renderMonthly();return;}
 if(kind==='question'){renderMonthly();return;}
 if(kind==='result'){mo.phase='reveal';mo.guesses=[3];renderMonthly();await new Promise(r=>setTimeout(r,400));monthlyShowGuess(mo,document.getElementById('mo-result'),null);return;}
 mo.phase='done';mo.guesses=[3,2,5];mo.flairShown=true;mo.coins=12;mo.practice=true;mo.level=1;renderMonthly();};
window.__layoutMonthlyBoard=async()=>{await window.__layoutAudit('monthly');renderMonthly();await new Promise(r=>setTimeout(r,500));const q=document.getElementById('question-prompt').getBoundingClientRect(),sub=document.getElementById('mo-submit').getBoundingClientRect(),bar=document.getElementById('bottom-toolbar').getBoundingClientRect();return {board:document.getElementById('question-prompt').dataset.board,mounted:!!document.querySelector('#dq-board #question-prompt'),boardH:Math.round(q.height),submitBottom:Math.round(sub.bottom),barTop:Math.round(bar.top),vh:innerHeight};};
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
 // The accuracy graph is intentionally not drawn during the stacking animation (the scene gets the room), so a hidden bar cannot spoil the round.
 const before=bar.querySelector('strong')?.textContent??'(hidden)';applyPhase(roomState);
 const refreshed=bar.querySelector('strong')?.textContent??'(hidden)';
 roomState.phase='summary';applyPhase(roomState);twSummarySig=null;renderTeamWorldsSummary(roomState);
 return {before,refreshed,after:summaryListEl.querySelector('.tw-avg .wl-progress-heading strong')?.textContent};
};
window.__layoutSoloTiming=async count=>{
 await window.__layoutAudit('worlds');const q=wl.questions[0];wl.questions=[q,q,q,q,q];wl.guesses=count===1?[3]:[1.5,3];wl.phase='reveal';renderWorlds();
 // The reveal screen no longer draws the accuracy meter, so there is nothing to spoil there.
 const before=worldsContentEl.querySelector('.wl-progress-heading strong')?.textContent??'(hidden)';
 renderWorlds();const refreshed=worldsContentEl.querySelector('.wl-progress-heading strong')?.textContent??'(hidden)';
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
    if(process.env.PLAY_LAYOUT_SURVEY){ // review pictures of each mode's result screens (where a mascot could stand); writes PNGs and stops
     const dir=process.env.PLAY_LAYOUT_SURVEY;fs.mkdirSync(dir,{recursive:true});
     const shot=async name=>{await new Promise(r=>setTimeout(r,700));const sh=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(dir,name+'-'+width+'x'+height+'.png'),Buffer.from(sh.data,'base64'));};
     await evaluate('window.__layoutRv(4)');await shot('quick-papers');
     await evaluate('window.__layoutSummaryPhase("quick")');await shot('quick-summary');
     await evaluate('window.__layoutAudit("daily")');await new Promise(r=>setTimeout(r,500));await shot('daily-question');try{await evaluate('window.__layoutExitConfirm()');await shot('resume-prompt');}catch(e){}try{await evaluate('window.__layoutDailyResult()');await shot('daily-result');}catch(e){fs.writeFileSync(path.join(dir,'daily-result-ERR.txt'),String(e));}for(const y of [0,420])try{await evaluate('window.__layoutSettingsPeek('+y+')');await shot('settings-peek-'+y);}catch(e){fs.writeFileSync(path.join(dir,'settings-ERR.txt'),String(e).slice(0,300));}for(const k of ['survival','wb'])try{await evaluate('window.__layoutMenuShot("'+k+'")');await shot('menu-'+k);}catch(e){fs.writeFileSync(path.join(dir,'menu-'+k+'-ERR.txt'),String(e).slice(0,300));}for(const k of ['question','result','final','intro','hub','level-final'])try{await evaluate('window.__layoutMonthlyShot("'+k+'")');await shot('monthly-'+k);if(k==='intro')fs.writeFileSync(path.join(dir,'monthly-intro-dbg.txt'),JSON.stringify(await evaluate('(()=>{const b=document.getElementById("monthly-close-btn");const r=b.getBoundingClientRect();const cs=getComputedStyle(b);const t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);const hit=[];for(const ss of document.styleSheets){let rules;try{rules=ss.cssRules}catch(e){continue}const walk=(rs)=>{for(const ru of rs){if(ru.cssRules&&!ru.selectorText){walk(ru.cssRules);continue}if(ru.selectorText&&ru.style&&ru.style.display=="none"&&b.matches(ru.selectorText))hit.push(ru.selectorText.slice(0,200))}};walk(rules)}return {hit,st:b.getAttribute("style"),cls:b.className,r:[r.left,r.top,r.width,r.height],disp:cs.display,vis:cs.visibility,z:cs.zIndex,pos:cs.position,top:t&&(t.tagName+"."+t.className+"#"+t.id),parent:b.parentElement.id,active:b.parentElement.className}})()')));if(k==='result')fs.writeFileSync(path.join(dir,'monthly-wbf.txt'),JSON.stringify(await evaluate('(()=>{const m=document.querySelector("#monthly-content .play-middle");return {wbf:m.style.getPropertyValue("--wbf"),ch:m.clientHeight,last:m.lastElementChild.className+"#"+m.lastElementChild.id,lastBottom:m.lastElementChild.offsetTop+m.lastElementChild.offsetHeight}})()')));}catch(e){fs.writeFileSync(path.join(dir,'monthly-'+k+'-ERR.txt'),String(e));}await evaluate('window.__layoutAudit("teamvteam")');await evaluate('window.__layoutPh("reveal")');await shot('teamvteam-reveal');await evaluate('window.__layoutAntTeam(1)');await shot('teamvteam-cats');await evaluate('window.__layoutAntTeam(2)');await shot('teamvteam-dogs');
     await evaluate('window.__layoutSummaryPhase("teamvteam")');await shot('teamvteam-summary');
     await evaluate('window.__layoutAudit("highlow")');await evaluate('window.__layoutPh("reveal")');await shot('highlow-reveal');
     await evaluate('window.__layoutSummaryPhase("highlow")');await shot('highlow-summary');
     await evaluate('window.__layoutAudit("survival")');await evaluate('window.__layoutSvRes({})');await shot('survival-result');
     await evaluate('window.__layoutAudit("whichbigger")');await evaluate('window.__layoutWbResult()');await shot('whichbigger-result');
     process.exit(0);
    }
    if(process.env.PLAY_LAYOUT_EVAL){ // run one page expression after loading a mode (PLAY_LAYOUT_EVAL_MODE) and print its result; for quick checks
     try{await evaluate('window.__layoutAudit('+JSON.stringify(process.env.PLAY_LAYOUT_EVAL_MODE||'quick')+')');const samples=[];for(let i=0;i<60;i++){samples.push(await evaluate(process.env.PLAY_LAYOUT_EVAL));await new Promise(r=>setTimeout(r,120));if(i===Number(process.env.PLAY_LAYOUT_EVAL_AT||24)&&process.env.PLAY_LAYOUT_EVAL_SHOT){const sh=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(process.env.PLAY_LAYOUT_EVAL_SHOT,Buffer.from(sh.data,'base64'));}}fs.writeFileSync(process.env.PLAY_LAYOUT_EVAL_OUT||'/tmp/layout-eval.txt',JSON.stringify(samples));}catch(e){fs.writeFileSync(process.env.PLAY_LAYOUT_EVAL_OUT||'/tmp/layout-eval.txt','ERROR '+e.message);}process.exit(0);
    }
    if(process.env.PLAY_LAYOUT_QSHOTS){ // review pictures of each mode's question screen (visual pass); writes PNGs and stops
     const dir=process.env.PLAY_LAYOUT_QSHOTS;fs.mkdirSync(dir,{recursive:true});
     for(const mode of ['quick','teamvteam','worlds','daily','monthly','survival','whichbigger','highlow','highstakes','highstakes:bet','bluff','bluff:vote','bluff:summary','quick:many']){
      await evaluate('window.__layoutAudit('+JSON.stringify(mode)+')');await new Promise(r=>setTimeout(r,2600));
      const sh=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(dir,mode.replace(':','-')+'-'+width+'x'+height+'.png'),Buffer.from(sh.data,'base64'));}
     process.exit(0);
    }
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
  {await evaluate(`(()=>{const q=document.querySelector('#hud.active .question-prompt');if(q&&!q.querySelector('#q-stage')){const d=document.createElement('div');d.id='q-stage';d.style.cssText='height:60px';q.prepend(d)}window.dispatchEvent(new Event('resize'))})()`);await new Promise(r=>setTimeout(r,700));
   const ov=await evaluate(`(()=>{const p=document.querySelector('#hud.active .question-prompt'),s=document.getElementById('anim-stage');return p&&s?Math.round(p.getBoundingClientRect().bottom-s.getBoundingClientRect().top):null})()`);
   if(ov===null||ov>1)bad.push('animation-'+m+' '+width+'x'+height+': the reveal scene starts under the question pill (overlap '+ov+'px) when the board has a hidden picture stage')}
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
      if(!board&&n===4&&process.env.PLAY_LAYOUT_SHOT){await evaluate('window.__layoutRobotIdle()');const ish=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.mkdirSync(process.env.PLAY_LAYOUT_SHOT,{recursive:true});fs.writeFileSync(path.join(process.env.PLAY_LAYOUT_SHOT,'robot-idle-'+width+'x'+height+'.png'),Buffer.from(ish.data,'base64'));}
      if(!board&&n===4){const robot=await evaluate('window.__layoutRobot(80)'),why='Quick robot '+width+'x'+height+': ';
       if(!robot||!robot.idle||!robot.idle.visible||!robot.idle.on||robot.idle.off||robot.idle.reacting||!/^idle/.test(robot.idle.reaction||''))throw Error(why+'he must wait in his standing pose while the papers are revealed: '+JSON.stringify(robot&&robot.idle));
       if(!robot.visible||!robot.on||robot.off||!robot.image||!robot.reacting)throw Error(why+'he is not reacting on your card: '+JSON.stringify(robot));
       if(robot.positionsSeen<2)throw Error(why+'his animation must loop, but the frame never changed: '+JSON.stringify(robot));
       if(!robot.card||Math.abs(robot.rect.b-robot.card.t)>10)throw Error(why+'he must stand on top of your Player card: '+JSON.stringify(robot));
       if(robot.rect.l<robot.hud.l-1||robot.rect.r>robot.hud.r+1)throw Error(why+'he runs off the side of the game screen: '+JSON.stringify(robot));
       if(robot.rect.t>robot.boardBottom-10)throw Error(why+'he should overlap the question board a little: '+JSON.stringify(robot));
       for(const [acc,tier] of [[80,'win'],[50,'soso'],[20,'lose']]){const x=await evaluate('window.__layoutRobot('+acc+')');if(!x||!x.reaction||!x.reaction.startsWith(tier))throw Error(why+'wrong tier for '+acc+'%: '+JSON.stringify(x));if(process.env.PLAY_LAYOUT_SHOT){fs.mkdirSync(process.env.PLAY_LAYOUT_SHOT,{recursive:true});const rs=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(process.env.PLAY_LAYOUT_SHOT,'robot-'+tier+'-'+width+'x'+height+'.png'),Buffer.from(rs.data,'base64'));}}
       console.log(JSON.stringify({quickRobot:true,width,height,idle:robot.idle.reaction,reaction:robot.reaction,positionsSeen:robot.positionsSeen,pass:true}));}
      if(!board&&n===4){const qx=await evaluate('window.__layoutQWaitExit()');if(!qx||qx.n1!==qx.n0+1||qx.n2!==qx.n0||qx.moved<20)throw Error('Wait-scene mascot must slide out to the left and clean up '+width+'x'+height+': '+JSON.stringify(qx));console.log(JSON.stringify({qWaitExit:true,width,height,moved:qx.moved,pass:true}));}
      if(!board&&n===4){const ant=await evaluate('window.__layoutAnt()'),why='Party ant '+width+'x'+height+': ';
       if(!ant||!ant.idle||!ant.idle.visible||ant.idle.reaction!=='idle')throw Error(why+'he must wait in his standing pose before the first reveal: '+JSON.stringify(ant&&ant.idle));
       if(!ant.arrived||!ant.arrived.visible||!ant.arrived.card||Math.abs(ant.arrived.rect.b-ant.arrived.card.t)>10)throw Error(why+'he must already stand on the top card on the second-chance page: '+JSON.stringify(ant.arrived));
       if(!ant.held||!ant.held.off)throw Error(why+'he must step aside while the reveal scene plays: '+JSON.stringify(ant.held));
       if(!ant.back||!ant.back.visible||ant.slideAgain)throw Error(why+'he must be back after the scene WITHOUT sliding in a second time: '+JSON.stringify({back:ant.back,slideAgain:ant.slideAgain}));
       if(JSON.stringify(ant.sets)!=='["cats","win:on-card","dogs","win:on-card","cats","win:on-card"]')throw Error(why+'Team vs Team must alternate cats and dogs by round and stand on the top team card: '+JSON.stringify(ant.sets));
       if(JSON.stringify(ant.reactions)!=='["lose","soso","close","win"]')throw Error(why+'he must react to every paper by place (lose, soso, close, win): '+JSON.stringify(ant.reactions));
       if(!ant.end||!ant.end.visible||ant.end.off||!ant.end.card||Math.abs(ant.end.rect.b-ant.end.card.t)>10)throw Error(why+'he must stand on top of the TOP score card: '+JSON.stringify(ant.end));
       if(ant.end.rect.l<ant.end.hud.l-1||ant.end.rect.r>ant.end.hud.r+1)throw Error(why+'he runs off the side of the game screen: '+JSON.stringify(ant.end));
       if(process.env.PLAY_LAYOUT_SHOT){fs.mkdirSync(process.env.PLAY_LAYOUT_SHOT,{recursive:true});for(const [i,nm] of [[1,'lose'],[3,'close'],[4,'win']]){await evaluate('window.__layoutAntShow('+i+')');const as=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(process.env.PLAY_LAYOUT_SHOT,'ant-'+nm+'-'+width+'x'+height+'.png'),Buffer.from(as.data,'base64'));}await evaluate('window.__layoutRobotHide()');}
       console.log(JSON.stringify({partyAnt:true,width,height,reactions:ant.reactions,pass:true}));}
      if(!board&&n===10){const sc=await evaluate('window.__layoutRobotScroll()');
       if(sc&&sc.scrollable){const a=sc.after,why='Quick robot '+width+'x'+height+': ';
        if(!a||!a.card||Math.abs(a.rect.b-a.card.t)>10)throw Error(why+'he must scroll along with your Player card: '+JSON.stringify(sc));
        if(a.card.t>=a.boardTop+4&&a.off)throw Error(why+'he disappeared while your card is still on screen: '+JSON.stringify(sc));
        console.log(JSON.stringify({quickRobotScroll:true,width,height,pass:true}));}}
      if(process.env.PLAY_LAYOUT_SHOT){const shotDir=process.env.PLAY_LAYOUT_SHOT;fs.mkdirSync(shotDir,{recursive:true});const sh=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(shotDir,'papers-'+n+(board?'-'+board:'')+'-'+width+'x'+height+'.png'),Buffer.from(sh.data,'base64'));} // optional: save the paper screens for review
      await evaluate('window.__layoutRobotHide()');
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
      if(process.env.SUP_STRESS){const medals=await evaluate("document.querySelectorAll('#summary-list .sup-medal').length");if(!medals)throw Error('SUP_STRESS is on but the round summary shows no supporter medals: '+(await evaluate("'supN='+window.__supN+' html='+document.getElementById('summary-list').innerHTML.slice(0,200)")));console.log(JSON.stringify({summaryMedals:medals,width,height,pass:true}));}
      if(n===4){const rb=await evaluate('window.__layoutRobotIdle()');if(!rb||!rb.on||rb.off||!rb.visible||!rb.card||Math.abs(rb.rect.b-rb.card.t)>10)throw Error('Quick robot must still stand on your Player card on the round summary '+width+'x'+height+': '+JSON.stringify(rb));await evaluate('window.__layoutRobotHide()');}
     }
     // After Lock it in: the answer sits at the bottom with the fact boxes and mascot above it, and nothing overflows.
     for(const mode of ['quick','party','teamvteam','teamworlds']){
      const bodySel=mode==='teamworlds'?'#question-view':'.play-input-body',ansSel=mode==='teamworlds'?'#tw-guess-display':'#guess-display'; // Team Worlds has its own grid and answer box
      await evaluate('window.__layoutAudit('+JSON.stringify(mode)+')');await new Promise(r=>setTimeout(r,200));
      await evaluate(`document.getElementById('hud-auto-toggle').style.display='none';document.querySelector('#numpad [data-val="2"]').click();document.getElementById('submit-guess-btn').click();new Promise(r=>setTimeout(r,1500))`); // the Auto toggle only exists on reveal/summary (an earlier step may have left it showing)
      const w=await evaluate(`(()=>{const r=e=>{const b=document.querySelector(e)?.getBoundingClientRect();return b?{top:Math.round(b.top),bottom:Math.round(b.bottom)}:null},body=document.querySelector('${bodySel}');return {waiting:document.getElementById('question-view').classList.contains('q-waiting'),facts:r('.qw-facts'),answer:r('${ansSel}'),status:r('#guess-status'),body:r('${bodySel}'),preview:r('#q-preview'),overflow:body.scrollHeight-body.clientHeight}})()`);
      if(!w.waiting||!w.facts||!w.answer)throw Error(mode+' '+width+'x'+height+': wait screen missing '+JSON.stringify(w));
      const mc=await evaluate(`(()=>{const box=document.querySelector('.qw-mascot').getBoundingClientRect();document.querySelectorAll('.qw-mascot img').forEach(i=>{i.style.animation='none';i.style.transform='none'});return [...document.querySelectorAll('.qw-mascot img')].map(i=>{const b=i.getBoundingClientRect();return {l:Math.round(b.left-box.left),r:Math.round(box.right-b.right)}})})()`);
      if(mc.some(m=>m.l<-1||m.r<-1))throw Error(mode+' '+width+'x'+height+': wait screen mascot is cut off at the edge '+JSON.stringify(mc));
      const ov=await evaluate(`(()=>{const b=document.querySelector('${bodySel}'),h=document.getElementById('hud');return {ov:getComputedStyle(b).overflowX,density:h.dataset.playDensity||''}})()`);
      if(ov.ov!=='visible'&&ov.density!=='tight')throw Error(mode+' '+width+'x'+height+': the question card box clips its edges (invisible edge) '+JSON.stringify(ov));
      if(w.overflow>1||w.answer.bottom>w.body.bottom+1||w.facts.top<w.preview.bottom-1)throw Error(mode+' '+width+'x'+height+': wait screen does not fit '+JSON.stringify(w));
      if(mode==='teamworlds'){ // the monkeys float between the fact boxes and the answer, the two player cards stay on screen beside them, and the grace stopwatch is not shown until the countdown starts
       const tw=await evaluate(`(()=>{document.querySelectorAll('.qw-mascot .mp-sprite').forEach(s=>{s.style.animation='none';s.style.transform='none'});const r=e=>{const b=document.querySelector(e)?.getBoundingClientRect();return b?{t:Math.round(b.top),b:Math.round(b.bottom),l:Math.round(b.left),r:Math.round(b.right)}:null},t=document.getElementById('qw-timer');return {sprite:r('.qw-mascot .mp-sprite'),box:r('.qw-mascot'),facts:r('.qw-facts'),answer:r('#tw-guess-display'),stats:r('#tw-question-stats'),cards:[...document.querySelectorAll('.tw-qs-half')].map(h=>{const b=h.getBoundingClientRect();return {t:Math.round(b.top),b:Math.round(b.bottom)}}),timerShown:!!t&&getComputedStyle(t).visibility!=='hidden'}})()`);
       if(!tw.sprite||tw.sprite.t<tw.facts.b-1||tw.sprite.b>tw.answer.t+1)throw Error('teamworlds '+width+'x'+height+': the monkeys are not between the fact boxes and the answer '+JSON.stringify(tw));
       if(tw.sprite.b-tw.sprite.t>(tw.box.b-tw.box.t)*0.9)throw Error('teamworlds '+width+'x'+height+': the monkeys fill their whole space, so the float would touch the boxes around them '+JSON.stringify(tw));
       if(tw.sprite.r>tw.stats.l+1)throw Error('teamworlds '+width+'x'+height+': monkeys and player cards overlap '+JSON.stringify(tw));
       // the objects and fact boxes live in the left column, so the player cards start beside them (not below) and keep their size, and never run onto the answer / stopwatch row
       if(tw.cards.length<2||tw.cards.some(c=>c.b-c.t<80)||tw.cards[tw.cards.length-1].b>tw.answer.t+2||tw.cards[0].t>tw.facts.t)throw Error('teamworlds '+width+'x'+height+': the player cards are squeezed or overflow their column '+JSON.stringify(tw));
       if(tw.timerShown)throw Error('teamworlds '+width+'x'+height+': the grace stopwatch must stay hidden until the countdown starts');
      }
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
    {const mb=await evaluate('window.__layoutMonthlyBoard()');if(!mb||!mb.mounted||mb.board!=='mb10'||mb.submitBottom>mb.vh||mb.boardH<90)throw Error('Monthly must use its own month\'s question board (mb10 for 2026-10) '+width+'x'+height+': '+JSON.stringify(mb));console.log(JSON.stringify({monthlyBoard:mb.board,width,height,pass:true}));}
    if(process.env.PLAY_LAYOUT_KEYPAD_ONLY)continue; // keypad-fit run (npm run test:keypad-fit): every mode's keypad and Lock button stay on screen; skip the slower timing checks
    for(const sample of [{count:1,sum:70.6,last:70.6,expected:'No answers yet'},{count:2,sum:160,last:70,expected:'90%'},{count:2,sum:110,last:90,expected:'20%'}]){
     const progress=await evaluate('window.__layoutAccuracy('+[sample.count,sample.sum,sample.last].join(',')+')');
     const hiddenOk=v=>v==='(hidden)'||v===sample.expected;if(!hiddenOk(progress.before)||!hiddenOk(progress.refreshed))throw Error('Accuracy spoiled unfinished round '+JSON.stringify(progress));
     await new Promise(r=>setTimeout(r,2200));
     const after=await evaluate("window.__layoutAccuracyAfter()");
     if(after!==(sample.sum/sample.count)+'%')throw Error('Game Progress did not update accuracy '+after);
     console.log(JSON.stringify({accuracyTiming:true,width,height,...progress,after,pass:true}));
    }
    for(const count of [1,2]){
     const solo=await evaluate('window.__layoutSoloTiming('+count+')');const previous=count===1?'No answers yet':'50%';
     if(![previous,'(hidden)'].includes(solo.before)||![previous,'(hidden)'].includes(solo.refreshed)||solo.resultStart!==(count===1?'0%':'50%'))throw Error('Solo Worlds spoils pending accuracy '+JSON.stringify(solo));
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
     const routes={back:null,home:'toolbar-home-btn',shop:'toolbar-coin-balance',style:'toolbar-cosmetics-btn',stats:'toolbar-awards-btn',coins:'toolbar-coin-balance',settings:'toolbar-settings-btn',phoneBack:null};
     for(const mode of Object.keys(backIds))for(const phase of ['question','reveal',...(['worlds','whichbigger'].includes(mode)?['result']:[])]){
      for(const route of (phase==='question'?Object.keys(routes):['back','phoneBack'])){
       await evaluate('window.__exitSetup('+JSON.stringify(mode)+','+JSON.stringify(phase)+')');
       const tap=route==='phoneBack'?"window.dispatchEvent(new PopStateEvent('popstate'))":"document.getElementById("+JSON.stringify(route==='back'?backIds[mode]:routes[route])+").click()";
       if(route==='settings'){
        await evaluate(tap);const state=await evaluate('window.__exitRead()');if(state.dialog||!state.run||!await evaluate("document.getElementById('settings-screen').classList.contains('peek')"))throw Error('Settings must peek without leaving '+JSON.stringify({mode,phase,state}));
        await evaluate("document.getElementById('settings-back-game').click()");if(!await evaluate("!document.getElementById('settings-screen').classList.contains('peek')"))throw Error('Settings Back did not return to the game');continue;
       }
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
