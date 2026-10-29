// Exercise the real game adapter and approved renderer against an isolated database.
const fs=require('fs'),path=require('path');let runner=fs.readFileSync(path.join(__dirname,'verify-game-polish-browser.cjs'),'utf8');
const api=String.raw`
window.__waterCues=[];
const originalWaterSound=playSound;
playSound=(name,...args)=>{
 if(name==='ocean-splash'&&hlOceanReveal){const r=hlOceanReveal.root,animal=r.querySelector(r.dataset.step==='2'?'.oc-bird':'.oc-shark'),a=animal.getBoundingClientRect(),water=r.querySelector('.oc-water').getBoundingClientRect();window.__waterCues.push({step:r.dataset.step,distance:a.top+a.height/2-water.top});}
 return originalWaterSound(name,...args);
};
window.__hl={
 ready:()=>!!myProfile?.stats,
 busy:()=>hlOceanReveal?.busy,root:()=>hlOceanReveal?.root,
 show:async(scenario='safe',index=0,guest=false,reduced=false)=>{
  cancelRevealEffects();document.documentElement.dataset.motion=reduced?'reduce':'full';localStorage.setItem('mg_motion',reduced?'reduce':'full');
  const examples={safe:{high:2.15,low:1.3,passed:true},wide:{high:2.84,low:1,tooWide:true},under:{high:1.6,low:1.2},over:{high:2.5,low:2},crossed:{high:1.5,low:2.1,crossed:true},missing:{high:null,low:1},zero:{high:2,low:0,tooWide:true},saved:{high:2.84,low:1,saved:true,tooWide:true},million:{high:1500000,low:1000000,passed:true,answer:1234567.89},trillion:{high:11000000000000,low:9000000000000,passed:true,answer:9876543210123.45},close:{high:1.83,low:1.72,passed:true}};
  const e=examples[scenario];currentRoomCode='HLTEST';currentPlayerId='hi';isHost=!guest;currentName='High player';
  currentPlayers={hi:{name:'High player',avatar:'av07',isHost:true,joinedAt:1},lo:{name:'Low player',avatar:'av19',joinedAt:2}};
  roomState={phase:'reveal',gameId:crypto.randomUUID(),round:1,settings:{mode:'teamworlds',variant:'hl',autoAdvanceEnabled:false,autoAdvanceSeconds:1,lives:3},players:currentPlayers,hlRoles:{hi:'high',lo:'low'},hlLives:e.passed||e.saved?3:2,hlSurvived:e.passed?1:0,hlLast:{...e,limit:2.5,inSync:e.low!=null&&e.high!=null&&e.low<=(e.answer||1.78)&&e.high>=(e.answer||1.78)},currentQuestion:{answer:e.answer||1.78,prompt:'How many rubber chickens long is the height of a traffic cone?'},revealIndex:index,revealOrder:[e.high==null?null:{role:'high',playerId:'hi',name:'High player',guess:e.high,accuracyPercent:80},{role:'low',playerId:'lo',name:'Low player',guess:e.low,accuracyPercent:70}].filter(Boolean)};
  await set(ref(db,'rooms/HLTEST'),roomState);ALL_SCREEN_ELS.forEach(el=>el.classList.remove('active'));applyPhase(roomState);renderHudTop(roomState);renderAutoToggle(roomState);renderTeamWorldsReveal(roomState);window.scrollTo(0,0);
 },
 pump:async()=>{roomState=(await get(ref(db,'rooms/HLTEST'))).val();renderAutoToggle(roomState);renderTeamWorldsReveal(roomState);},
 refresh:()=>{renderAutoToggle(roomState);renderTeamWorldsReveal(roomState);},
 pause:v=>{roomState.paused=v;renderTeamWorldsReveal(roomState);},
 auto:v=>{roomState.settings.autoAdvanceEnabled=v;renderAutoToggle(roomState);renderTeamWorldsReveal(roomState);},
 otherMode:()=>{cancelRevealEffects();roomState.settings={mode:'teamworlds',autoAdvanceEnabled:false};roomState.revealIndex=0;twRevealSig=null;renderTeamWorldsReveal(roomState);},
 leave:()=>{cancelRevealEffects();roomState.phase='summary';},
 data:()=>roomState
};
`;
const check=String.raw`<pre id="polish-result" hidden></pre><script type="module">
const wait=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m)},until=async(fn,m)=>{for(let n=0;n<450;n++){if(fn())return;await wait(20);}throw Error(m)},cy=e=>{const b=e.getBoundingClientRect();return b.top+b.height/2;};
try{
 await until(()=>window.__hl?.ready(),'Game boot');const api=window.__hl,$=id=>document.getElementById(id);
 await api.show();await until(()=>api.root()?.dataset.step==='1','Bottle starts');assert(api.busy()&&$('reveal-next-btn').disabled,'Host cannot skip incoming bottle');
 const root=api.root();api.data().hlSyncStreak=3;api.data().hlLast.previousSyncStreak=2;window.__fakeDB.put('rooms/HLTEST',api.data());api.refresh();assert(api.root()===root,'Unrelated room update keeps same scene');
 await until(()=>!api.busy(),'Bottle settles');assert($('reveal-next-btn').textContent==='Reveal HIGH','HIGH next');
 $('reveal-next-btn').click();await api.pump();await wait(70);assert(api.root()===root,'Advance keeps existing scene');
 const bird=root.querySelector('.oc-bird'),hm=root.querySelector('.cw-high');
 for(const t of [.15,.6,.85]){const a=bird.getAnimations()[0];a.pause();a.currentTime=450+1500*t;await wait(45);assert(Math.abs(cy(bird)-cy(hm))<1,'Bird mark follows live motion');a.play();}
 await until(()=>!api.busy(),'HIGH settles');assert(!bird.classList.contains('is-happy'),'No celebration before full result');
 $('reveal-next-btn').click();await api.pump();await wait(100);assert($('show-summary-btn').disabled,'Progress waits for LOW');assert(!$('hud-round-label').querySelector('.hl-flame'),'Streak waits for LOW to settle');
 api.pause(true);const pausedAnimation=root.querySelector('.oc-shark').getAnimations()[0];await pausedAnimation.ready;const paused=pausedAnimation.currentTime;await wait(140);assert(Math.abs(pausedAnimation.currentTime-paused)<3,'Pause freezes entrance');api.pause(false);
 await until(()=>!api.busy(),'LOW settles');assert(root.querySelector('.cw-meter').dataset.result==='won','Win feedback');assert(root.querySelector('.oc-shark').classList.contains('is-happy'),'Shared win pose');assert(!$('show-summary-btn').disabled,'Progress enabled after animation');assert($('hud-round-label').querySelector('.hl-flame'),'Streak updates after LOW settles');
 for(const scenario of ['under','over']){
  window.__waterCues=[];await api.show(scenario,0);await until(()=>!api.busy(),'Bottle for water crossing');
  $('reveal-next-btn').click();await api.pump();await until(()=>!api.busy(),'Bird crossing');
  $('reveal-next-btn').click();await api.pump();await until(()=>!api.busy(),'Shark crossing');
  assert(window.__waterCues.length===1,'One splash only on actual water crossing '+scenario);
  assert(Math.abs(window.__waterCues[0].distance)<22,'Splash follows crossing rather than delayed settlement '+JSON.stringify(window.__waterCues));
 }
 for(const scenario of ['safe','wide','under','over','crossed','missing','zero','saved','million','trillion','close']){
  await api.show(scenario,2);await until(()=>api.root()?.dataset.busy==='false','Reconnect complete '+scenario);const r=api.root(),d=api.data(),m=d.hlLast;
  assert(r.querySelector('.cw-meter').dataset.result===(m.passed?'won':'lost'),'Authoritative round result '+scenario);
  for(const el of r.querySelectorAll('.oc-animal')){assert(el.classList.contains('is-happy')===!!m.passed,'Happy only for round win '+scenario);assert(el.classList.contains('is-defeated')===!m.passed,'Defeated after team loss '+scenario);}
  if(scenario==='under')assert(r.querySelector('.oc-bird').classList.contains('is-reacting'),'Wet pose retained');if(scenario==='over')assert(r.querySelector('.oc-shark').classList.contains('is-reacting'),'Shocked pose retained');
  assert(r.querySelector('.oc-shark').offsetWidth>=r.querySelector('.oc-bird').offsetWidth*1.25,'Larger shark');
  assert(Math.abs(cy(r.querySelector('.oc-shark'))-cy(r.querySelector('.cw-low')))<1,'Shark aligned at final mark');
  const h=r.querySelector('.cw-number-high').getBoundingClientRect(),l=r.querySelector('.cw-number-low').getBoundingClientRect();if(m.high!=null)assert(Math.min(h.bottom,l.bottom)<=Math.max(h.top,l.top)-3,'Number circles separate '+scenario);
  assert(document.documentElement.scrollWidth<=innerWidth+1,'Phone width fits '+scenario);
  if(scenario==='million'){const b=r.querySelector('.oc-sail-answer b'),paper=b.parentElement.getBoundingClientRect();assert(b.textContent==='1,234,567.89','Full large answer');assert(b.getBoundingClientRect().width<=paper.width+1,'Answer fits paper');}
  if(scenario==='trillion'){const b=r.querySelector('.oc-sail-answer b');assert(b.textContent.includes('T'),'Extreme answer uses readable compact label');assert(r.querySelector('.hl-exact-answer').textContent.includes('9,876,543,210,123.45'),'Exact extreme answer remains visible');assert(b.getBoundingClientRect().width<=b.parentElement.getBoundingClientRect().width+1,'Extreme answer fits bottle');}
  if(scenario==='saved')assert(r.querySelector('.rs-verdict').textContent.includes('Shield saved you'),'Shield verdict preserved');
  for(const img of r.querySelectorAll('img')){await img.decode();assert(img.complete&&img.naturalWidth,'Runtime artwork loads '+img.src);}
 }
 await api.show('wide',2,true);await until(()=>!api.busy(),'Guest restored');assert($('reveal-next-btn').style.display==='none'&&$('show-summary-btn').style.display==='none','Guest has no host controls');
 await api.show('safe',0,false,true);await until(()=>!api.busy(),'Reduced motion settles immediately');assert(getComputedStyle(api.root().querySelector('.oc-boat-float')).animationName==='none','Reduced motion stops bob');
 await api.show('safe',0);await until(()=>api.root()?.dataset.step==='1','Next start');api.auto(true);assert($('reveal-next-btn').disabled,'Auto mode keeps control disabled');const abandoned=api.root();api.leave();await wait(60);assert(!abandoned.isConnected,'Leaving tears down scene');
 await api.show('safe',0,false,true);await until(()=>!api.busy(),'Before standard Worlds');api.otherMode();assert(!document.querySelector('.hl-ocean-reveal')&&document.querySelector('.tw-head'),'Standard Team Worlds keeps original reveal');
 window.__hlShot=async scenario=>{await api.show(scenario,2);await until(()=>!api.busy(),'Screenshot');};
 $('polish-result').textContent=JSON.stringify({pass:true,width:innerWidth,checks:'Real High/Low room adapter: 3 steps, control guards, live marker sync, pause, shared result poses, saves, missing/zero picks, million answer, guest/reconnect/cleanup, Team Worlds isolation'});
}catch(e){document.getElementById('polish-result').textContent=JSON.stringify({pass:false,error:String(e),stack:e.stack});}
</script>`;
runner=runner.replace('const injected=String.raw`','let injected=String.raw`');const start=runner.indexOf('let checks=String.raw`'),end=runner.indexOf('let fixture=',start);runner=runner.slice(0,start)+'injected+='+JSON.stringify(api)+';\nlet checks='+JSON.stringify(check)+';\n'+runner.slice(end);
const shotStart=runner.indexOf(' for(const page of '),shotEnd=runner.indexOf(" if(errors.length)",shotStart);
runner=runner.slice(0,shotStart)+`for(const scenario of ['safe','wide','under','over','million','trillion']){await call('Runtime.evaluate',{expression:'window.__hlShot('+JSON.stringify(scenario)+')',awaitPromise:true},sessionId);const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true},sessionId);fs.writeFileSync(path.join(root,'output','game-polish-tests','hl-runtime-'+scenario+'-'+width+'.png'),Buffer.from(shot.data,'base64'));}\n`+runner.slice(shotEnd);
runner=runner.replace('},90000);','},150000);').replace('n<800','n<1800');new Function('require','__dirname',runner)(require,__dirname);
