// Full actual app with an in-memory Firebase adapter. No live player writes.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/\r\n/g,'\n');
const dbStub=String.raw`
const root={profiles:{},rooms:{},'.info':{connected:true,serverTimeOffset:0}},watchers=[];
const copy=v=>v===undefined?null:JSON.parse(JSON.stringify(v));
const seed=()=>({coins:5000,hostUnlocked:true,levelPaid:99,freePulls:1,stats:{rounds:24,gamesPlayed:8,gamesWon:3,roundWins:8,spotOns:4,perfects:2,bestStreak:3},seenObjects:{ant:true,door:true,nail:true,hammer:true},seenCombos:{'ant|door':true},worlds:{tiny:{l1:3,l2:3,l3:3,l4:3}},worldRecords:{tiny:{l1:{bestAccuracy:97,attempts:4}}},survival:{best:8,runs:3},history:[{u:'ant',g:'door',r:.8,rawR:.7,s:1,t:1},{u:'ant',g:'door',r:.9,rawR:.8,s:1,t:2},{u:'nail',g:'hammer',r:1,rawR:1,s:3,t:3}],modeStats:{quick:{games:8,wins:3,rounds:20,answered:20,accuracyTotal:1600},worlds:{attempts:4,rounds:20,answered:20,accuracyTotal:1800}},cosmetics:{owned:{homeScreens:{ants:true}},equipped:{homeScreen:'ants'}}});
const at=p=>p.split('/').filter(Boolean);
function read(p){let v=root;for(const k of at(p)){if(v==null)return null;v=v[k];}return copy(v);}
function put(p,v){const keys=at(p),last=keys.pop();let n=root;for(const k of keys)n=n[k]||(n[k]={});if(v==null)delete n[last];else n[last]=copy(v);}
function snap(v,key=null){return {key,val:()=>copy(v),exists:()=>v!=null,size:v?Object.keys(v).length:0,forEach:fn=>Object.entries(v||{}).forEach(([k,x])=>fn(snap(x,k)))};}
function notify(p){for(const w of [...watchers])if(w.p===p||w.p.startsWith(p+'/')||p.startsWith(w.p+'/'))queueMicrotask(()=>w.fn(snap(read(w.p))));}
export const getDatabase=()=>root,ref=(_,p='')=>({p,key:at(p).at(-1)});
export async function get(r){return snap(read(r.p));}
export async function set(r,v){const old=read(r.p);put(r.p,v);if(JSON.stringify(old)!==JSON.stringify(v))notify(r.p);}
export async function update(r,v){const old=JSON.stringify(read(r.p));for(const [k,x]of Object.entries(v))put(r.p+'/'+k,x);if(old!==JSON.stringify(read(r.p)))notify(r.p);}
export async function remove(r){put(r.p,null);notify(r.p);}
export const push=r=>ref(null,r.p+'/'+crypto.randomUUID());
export function onValue(r,fn){if(r.p.startsWith('profiles/')&&at(r.p).length===2&&!read(r.p))put(r.p,seed());const w={p:r.p,fn};watchers.push(w);queueMicrotask(()=>fn(snap(read(r.p))));return ()=>{const i=watchers.indexOf(w);if(i>=0)watchers.splice(i,1);};}
export const onChildAdded=()=>()=>{},serverTimestamp=()=>Date.now(),onDisconnect=()=>({cancel:async()=>{},set:async()=>{},update:async()=>{},remove:async()=>{}});
export async function runTransaction(r,fn){const previous=read(r.p),next=fn(previous);if(next===undefined)return {committed:false,snapshot:snap(previous)};put(r.p,next);if(JSON.stringify(previous)!==JSON.stringify(next))notify(r.p);return {committed:true,snapshot:snap(next)};}
export const query=r=>r,orderByChild=k=>k,limitToLast=n=>n,limitToFirst=n=>n,startAfter=n=>n;
window.__fakeDB={read,put};
`;
const authStub='export const initializeAuth=()=>({currentUser:null}),indexedDBLocalPersistence={},browserLocalPersistence={},inMemoryPersistence={},GoogleAuthProvider={credential:()=>({})},signInWithCredential=async()=>({user:{uid:"test"}}),onAuthStateChanged=(_,fn)=>{queueMicrotask(()=>fn(null));return ()=>{}},signOut=async()=>{};';
const injected=String.raw`
window.__polish={
 worldResult:()=>{openWorlds();wl.wi=0;wl.level=1;const q=dailyQuestionFor({unitId:'ant',targetId:'door'});wl.questions=Array.from({length:5},()=>({...q}));wl.guesses=wl.questions.map(q=>q.answer*.95);wl.stars=3;wl.runId='polish-world-'+innerWidth;wl.newBest=true;wl.gain=15;wl.phase='done';renderWorlds();},
 reward:async()=>{await gameRewards.prepare({key:'polish-reward-'+innerWidth,score:3,roomCode:'TEST',playerId:'me'});gameRewards.open();},
 owner:()=>deviceId,profile:()=>myProfile,flush:()=>careerLedger.flush(),stats:()=>{statsMode='all';showCareerTab('stats');},objects:()=>showCareerTab('objects'),
 world:()=>{openWorlds();wl.wi=0;wl.phase='world';renderWorlds();},startWorld:()=>{openWorlds();wl.wi=0;worldStartLevel(1);},
 answerWorld:()=>{wl.input=String(wl.questions[wl.guesses.length].answer*.85);renderWorlds();document.getElementById('wl-submit').click();},
 abandonWorld:()=>document.getElementById('worlds-close-btn').click(),survival:()=>openSurvival(),
 lobby:async(final=false,solo=false)=>{
  currentRoomCode='TEST';currentPlayerId='me';isHost=true;currentName='Player';finalRendered=false;
  roomState={phase:final?'final':'waiting',gameId:'auto-fit-tests',round:3,settings:{solo:false,timerSeconds:30,totalRounds:3,itemSelectionMode:'anything',autoAdvanceEnabled:false},players:{me:{name:'Player',avatar:'av07',isHost:true,score:10,roundsCounted:3,accuracySum:270,joinedAt:1},friend:{name:'Friend',avatar:'av19',score:10,roundsCounted:3,accuracySum:240,joinedAt:2}},currentQuestion:{unitId:'ant',targetId:'door',answer:400,prompt:'Test'},lastRoundPoints:{me:3,friend:0}};
  if(solo){roomState.settings.solo=true;roomState.players={me:roomState.players.me,...Object.fromEntries(['av19','av06','av20'].map((avatar,i)=>['bot'+i,{name:'Bot '+(i+1),avatar,isBot:true,botDifficulty:'medium',joinedAt:i+2}]))};}else roomState.players.third={name:'Third player',avatar:'av06',joinedAt:3,score:0};
  currentPlayers=roomState.players;await set(ref(db,'rooms/TEST'),roomState);ALL_SCREEN_ELS.forEach(el=>el.classList.remove('active'));hudEl.classList.remove('active');
  if(final){finalScreenEl.classList.add('active');renderFinal();}else{lobbyScreenEl.classList.add('active');hostStartBtn.style.display='flex';window.scrollTo(0,0);document.getElementById('install-banner').classList.remove('active');roomCodeDisplay.textContent='TEST';renderHostUnlockUi();applyLobbyMode(roomState);renderPlayerList();}
 },
 quickLobby:()=>window.__polish.lobby(false,true),
 teamLobby:async()=>{await window.__polish.lobby(false,true);roomState.settings={...roomState.settings,solo:false,mode:'teamvteam'};Object.entries(currentPlayers).forEach(([id,p],i)=>p.team=i<2?'red':'blue');applyLobbyMode(roomState);renderPlayerList();},
 refreshLobby:async()=>{roomState=(await get(ref(db,'rooms/TEST'))).val();currentPlayers=roomState.players;applyLobbyMode(roomState);renderPlayerList();},
 hsPick:()=>window.__polish.hsView(10,false),hsBet:()=>window.__polish.hsView(10,true),
 hsReveal:()=>window.__polish.hsView(10,'win'),
 hsDeal:()=>{
  window.__polish.hsView(10,false);
  roomState.hs=HS.hsNewGame(Object.keys(currentPlayers));
  renderHighStakes(roomState);
 },
 hsFakeReceipt:()=>{
  window.__polish.hsView(4,false);
  roomState.hs.stage='ready';roomState.hs.round=1;roomState.hs.out={me:true};
  roomState.hsPre={endsAt:nowMs()+15000};roomState.hsFakes={me:213.5};
  renderHighStakes(roomState);
 },
 hsGhostResult:()=>{
  window.__polish.hsView(4,'split');
  currentPlayers.me.avatar='av58';
  currentPlayers.p1.avatar='av09';
  currentPlayers.ghost={name:'Ghost writer',avatar:'av29'};
  roomState.hs.options=[213.5,220,232.12,1230];
  roomState.hs.fakeBy={0:'ghost'};
  renderHighStakes(roomState);
 },
 hsAnimated:async (host,paused)=>{
  window.__polish.hsView(4,'win');
  isHost=host;currentPlayers.me.isHost=host;roomState.paused=paused;
  roomState.hs.animAt=nowMs()-500;roomState.hs.animEndsAt=nowMs()+30000;
  roomState.hs.nextAt=roomState.hs.animEndsAt+HS_REVEAL_MS;
  await set(ref(db,'rooms/VIEW'),roomState);
  renderHighStakes(roomState);
 },
 hsReadReveal:async ()=>{
  roomState=(await get(ref(db,'rooms/VIEW'))).val();
  renderHighStakes(roomState);
 },
 hsLastStandings:async (due=false)=>{
  window.__polish.hsView(10,'win');
  const hs=roomState.hs;
  hs.round=10;hs.showStand=true;hs.animAt=nowMs()-500;hs.nextAt=nowMs()+(due?-1:180000);
  hs.chips.me=0;hs.out={me:9};hs.ghost={me:2};
  await set(ref(db,'rooms/VIEW'),roomState);
  renderHighStakes(roomState);
 },
 hsResumeMissingTicker:event=>{
  hsEnsureTicker(false);
  window.dispatchEvent(new Event(event));
  const started=!!hsTickHandle;
  hsEnsureTicker(false);
  return started;
 },
 hsSidePot:phase=>{
  window.__polish.hsView(4,'win');
  const now=nowMs();
  let hs=HS.hsNewGame(Object.keys(currentPlayers));
  hs.chips.p1=12;
  hs=HS.hsStartRound(hs,{options:[1,2,3,4],realIdx:2,now});
  const picks={me:0,p1:2,p2:2,p3:0};
  hs=HS.hsBeginBetting(hs,picks,now);
  if(phase==='check')hs=HS.hsApplyAction(hs,'me','check',now);
  else if(phase!=='opening'){
   hs=HS.hsApplyAction(hs,'me','raise',now);
   if(phase!=='bet'){
    hs=HS.hsApplyAction(hs,'p1','call',now);
    hs=HS.hsApplyAction(hs,'p2','raise',now);
    hs=HS.hsApplyAction(hs,'p3','call',now);
    if(phase==='result'){
     hs=HS.hsApplyAction(hs,'me','call',now);
     hs.animEndsAt=now-1;
    }
   }
  }
  roomState={...roomState,hs,hsPicks:picks};
  renderHighStakes(roomState);
 },
 hsMonthlyReaction:month=>{
  const monthly='m'+String(month).padStart(2,'0'),normal=START_EMOJIS[0],profile=myProfile;
  myProfile={...profile,cosmetics:{owned:{monthly:{[monthly]:true}}},randomPool:{reactions:{__equipped:true,[monthly]:true,[normal]:true}}};
  renderReactionStrip();
  myProfile=profile;
  clearReactionBubbles();
  renderReactionBubble({playerId:'p1',emoji:monthly,previewAt:{x:innerWidth/2,y:200}});
 },
 hsView:(n,bet)=>{
  ALL_SCREEN_ELS.forEach(el=>el.classList.remove('active'));
  currentRoomCode='VIEW';currentPlayerId='me';isHost=true;
  const ids=Array.from({length:n},(_,i)=>i?'p'+i:'me');
  currentPlayers=Object.fromEntries(ids.map((id,i)=>[id,{name:i?'Player '+i:'My player',avatar:['av07','av19','av06','av20'][i%4],isHost:i===0,isBot:i>0,connected:true}]));
  const now=nowMs(),q=dailyQuestionFor({unitId:'ant',targetId:'door'});
  let hs=HS.hsStartRound(HS.hsNewGame(ids),{options:[q.answer/2,q.answer/3,q.answer,q.answer*2],realIdx:2,now});
  const correctPicks={win:1,split:2,three:3,all:n}[bet] || 0;
  const picks=Object.fromEntries(ids.map((id,i)=>[id,i<correctPicks?2:0]));
  if(bet)hs=HS.hsBeginBetting(hs,picks,now);
  if(typeof bet==='string'){
   if(bet==='fold')hs.bet.folded=Object.fromEntries(ids.slice(1).map(id=>[id,true]));
   hs=HS.hsResolve(hs);
   hs.animEndsAt=now-1;
  }
  roomState={phase:'hs',gameId:'view',settings:{mode:'highstakes'},players:currentPlayers,hs,hsQ:q,hsPicks:bet?picks:{}};
  applyPhase(roomState);hsEnsureTicker(false);
  renderHighStakes(roomState);window.scrollTo(0,0);
 },
 quiet:()=>{
  localStorage.setItem('mg_menuTour_v1_'+deviceId,'skipped');
  myProfile={...myProfile,tutorial:{version:1,status:'completed'}};
  document.getElementById('install-dismiss-btn').click();
  localStorage.setItem('mg_motion','reduce');
  document.documentElement.dataset.motion='reduce';
  clearReactionBubbles();
 },
 shop:()=>openGachaScreen('coins'),style:()=>openGachaScreen('cosmetics'),solo:()=>openSolo(),party:()=>openPartyHub(),
 classic:()=>openClassicInfo(),highLow:()=>openHlInfo(),bluff:()=>openBluffInfo(),daily:()=>openDaily(),monthly:()=>openMonthly(),bigger:()=>openWhichBigger(),
 collect:()=>gameRewards.open(),settings:()=>openOverlay(settingsScreen),join:()=>{ALL_SCREEN_ELS.forEach(el=>el.classList.remove('active'));showJoinScreen();}
};
`;
const checks=String.raw`<pre id="polish-result" hidden></pre><script type="module">
for(let i=0;i<300&&!window.__polish;i++)await new Promise(r=>setTimeout(r,20));
try {
 if(!window.__polish)throw Error('bootstrap');
 await document.fonts.ready;
 const select=s=>document.querySelector('#hs-content '+s);
 const assert=(ok,label)=>{if(!ok)throw Error(label);};
 const checkPigLayout=async (pig,label)=>{
  await new Promise(requestAnimationFrame);
  const area=select('.play-middle').getBoundingClientRect(),art=pig.getBoundingClientRect();
  assert(art.height>0 && art.top>=area.top && art.bottom<=area.bottom+1,label+' mascot visible '+JSON.stringify([art.bottom,area.bottom]));
 };
 window.__polish.hsPick();
 const pig=select('.hs-table-pig'),opts=select('.hs-opts');
 await pig.decode();
 assert(pig.dataset.mood==='peek' && pig.closest('.hs-table-foot').previousElementSibling===opts,'pig below the question answers');
 assert(parseFloat(getComputedStyle(opts).rowGap)<=5 && opts.querySelectorAll('[data-hs-pick]').length===4,'compact question options');
 assert([...opts.children].every(btn=>btn.offsetHeight>=44),'question tap height');
 assert([...opts.children].every(btn=>/\.\d{2}$/.test(btn.textContent.trim())),'all choices show two decimals');
 if(innerWidth>=320 && innerHeight>=650)await checkPigLayout(pig,'question');
 window.__polish.hsBet();
 assert(!select('.hs-table-pig') && !!select('.hs-acts button'),'betting controls without the mascot');
 window.__polish.hsDeal();
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 const dealPot=select('.hs-deal-pot'),dealCards=select('.hs-players');
 const potBox=dealPot.getBoundingClientRect(),cardBox=dealCards.getBoundingClientRect();
 assert(potBox.top>=cardBox.bottom && potBox.top-cardBox.bottom<=12,'opening pot tucked under the player cards');
 if(innerWidth>=320 && innerHeight>=650)assert(potBox.bottom<=select('.play-actions').getBoundingClientRect().top+1,'opening pot fits above Deal '+JSON.stringify([potBox.bottom,select('.play-actions').getBoundingClientRect().top]));
 window.__polish.hsFakeReceipt();
 assert(select('.hs-result').textContent.includes('213.50'),'fake receipt keeps two decimals');
 window.__polish.hsGhostResult();
 const author=select('.hs-author'),badge=select('.hs-fooled-tag');
 const facesIn=img=>new DOMMatrix(getComputedStyle(img).transform).a<0;
 assert(author?.title==='Fake by Ghost writer' && author.offsetTop>badge.offsetTop &&
   author.offsetLeft>author.parentElement.querySelector('.hs-opt-main').offsetLeft,'ghost author sits on the right below Fooled ya');
 assert(facesIn(author.querySelector('img')) && [...document.querySelectorAll('.hs-win-who img')].every(facesIn),'directional ghost and winner avatars face inward');
 assert(select('.hs-opt.fooled .hs-opt-main b').textContent==='213.50' &&
   select('.hs-round-answer-value b').textContent==='232.12' &&
   [...document.querySelectorAll('.hs-opt.stat > b')].some(b=>b.textContent==='1,230.00'),'wrong and correct choices preserve decimals');
 let fullSize=0,splitHeight=0;
 for(const [type,note,mood,avatars] of [['win','Won the pot','perk',1],['split','Split the pot','perk',2],['three','Split the pot','perk',3],['all','Split the pot','perk',10],['fold','everyone else folded','perk',1],['roll','Pot rolls over','tilt',0]]){
  window.__polish.hsView(10,type);
  const choices=select('.hs-opts'),answer=select('.hs-round-answer'),mascot=select('.hs-table-pig');
  assert(choices.children.length===4 && choices.children[2]===answer && !select('.hs-opt.stat.real'),'gold panel in the original answer slot '+type);
  assert(!!answer.querySelector('.hs-real-tag') && answer.textContent.includes(note),'correct answer and payout wording '+type);
  assert(answer.querySelectorAll('.hs-win-who .avatar').length===avatars,'correct payout recipients '+type);
  if(avatars){
   const [left,summary,right]=select('.hs-win-body').children;
   assert(left.offsetLeft+left.offsetWidth<=summary.offsetLeft &&
     summary.offsetLeft+summary.offsetWidth<=right.offsetLeft,'winners flank the payout '+type);
   assert(left.querySelectorAll('.avatar').length===Math.ceil(avatars/2) &&
     right.querySelectorAll('.avatar').length===Math.floor(avatars/2),'balanced winner columns '+type);
   assert(!!right.querySelector('.hs-win-trophy')===(avatars===1) && !left.querySelector('.hs-win-trophy'),'trophy only on the right for a single winner '+type);
   if(type==='win')fullSize=left.firstElementChild.offsetWidth;
   if(type==='split')splitHeight=answer.offsetHeight;
   for(const column of [left,right]){
    const items=[...column.querySelectorAll('.avatar')];
    assert(items.every(item=>avatars>2?item.offsetWidth>=fullSize*.66-1&&item.offsetWidth<fullSize:item.offsetWidth===fullSize),'winner avatar size '+type);
    assert(items.every((item,i)=>!i || items[i-1].offsetTop+items[i-1].offsetHeight<=item.offsetTop),'stacked avatars have room '+type);
   }
   if(type==='all')assert(answer.offsetHeight>splitHeight,'the gold panel expands for all winners');
  }
  if(type==='fold')assert(choices.children[0].querySelector('.hs-who .avatar'),'fold winner can still be shown on their wrong pick');
  assert(mascot.dataset.mood===mood && mascot.parentElement.previousElementSibling===choices && !!select('#hs-skip'),'result mascot and standings action '+type);
  if(type==='win' && innerWidth>=320 && innerHeight>=650)await checkPigLayout(mascot,'result');
 }
 document.documentElement.dataset.motion='reduce';
 assert([select('.hs-round-answer'),select('.hs-table-pig')].every(el=>getComputedStyle(el).animationName==='none'),'High Stakes reduced motion');
 delete document.documentElement.dataset.motion;
 await window.__polish.hsAnimated(false,false);
 assert(!select('[data-hs-skip-animation]'),'guest cannot skip the reveal');
 await window.__polish.hsAnimated(true,true);
 assert(select('[data-hs-skip-animation]')?.disabled,'paused reveal cannot be skipped');
 await window.__polish.hsAnimated(true,false);
 const skip=select('[data-hs-skip-animation]');
 assert(skip && !skip.disabled && !select('#hs-skip'),'host can skip directly from the animation');
 if(innerWidth===390){
  const tally=()=>select('#hs-anim > div > span');
  for(let i=0;i<100&&!tally()?.textContent;i++)await new Promise(r=>setTimeout(r,20));
  assert(/\.\d{2}$/.test(tally()?.textContent),'High Stakes animation tally shows two decimals');
 }
 skip.click();
 for(let i=0;i<40&&!select('.hs-round-answer');i++){
  await new Promise(r=>setTimeout(r,20));
  await window.__polish.hsReadReveal();
 }
 assert(select('.hs-round-answer') && select('#hs-skip')?.textContent==='Show standings','skip shares the round result without advancing standings');
 await window.__polish.hsLastStandings();
 const finish=select('#hs-skip');
 assert(finish?.textContent==='Finish game','host sees Finish game on the last standings screen');
 finish.click();
 await new Promise(r=>setTimeout(r,50));
 await window.__polish.hsReadReveal();
 assert(!!select('.hs-end-hero') && select('.hs-reward')?.textContent.includes('Ghost bounty'),'Finish game reaches final results and preserves the ghost bounty with the host ticker stopped');
 for(const event of ['size-em-up:app-active','pageshow']){
  await window.__polish.hsLastStandings(true);
  assert(window.__polish.hsResumeMissingTicker(event),'returning to High Stakes recreates a missing timer on '+event);
  await window.__polish.hsReadReveal();
  assert(!!select('.hs-end-hero'),'returning to High Stakes advances an overdue standings screen on '+event);
 }
 window.__polish.hsSidePot('opening');
 assert(select('[data-hs-act=raise]')?.textContent==='Bet 10','opening wager is labeled Bet');
 window.__polish.hsSidePot('check');
 assert(select('[data-hs-pl=me] .hs-tag')?.textContent==='Check','free check is labeled Check');
 window.__polish.hsSidePot('bet');
 assert(select('[data-hs-pl=me] .hs-tag')?.textContent==='Bet 10','opening bettor card');
 window.__polish.hsSidePot('live');
 assert(select('[data-hs-pl=p1] .hs-tag.all-in')?.textContent==='All in' &&
   select('[data-hs-pl=p1] .hs-tag:not(.all-in)')?.textContent==='Called 7','short call shows chips paid and all-in status');
 assert(select('[data-hs-pl=p2] .hs-tag')?.textContent==='Raised to 20' &&
   select('[data-hs-pl=p3] .hs-tag')?.textContent==='Called 20','raise and call cards distinguish the actions');
 assert(select('.hs-pot-splits')?.textContent.includes('Side pot'),'side pot appears during betting');
 window.__polish.hsSidePot('result');
 assert(select('.hs-pot-splits')?.textContent.includes('Main pot48') &&
   select('.hs-pot-splits')?.textContent.includes('Side pot 139'),'main and side pot amounts on results');
 assert(select('[data-hs-pl=p1] .hs-tag.win')?.textContent==='+24' &&
   select('[data-hs-pl=p2] .hs-tag.win')?.textContent==='+63','different winners show their actual payouts');
 if(innerWidth>=320){
  window.__polish.hsMonthlyReaction(5);
  const icon=document.querySelector('.react-slot img[src^="monthly/art/poster-r"]');
  const iconScale=getComputedStyle(icon).scale,padding=getComputedStyle(icon.closest('button')).paddingLeft;
  assert(parseFloat(iconScale)>1 && padding==='2px','monthly reaction icon scales up '+JSON.stringify([iconScale,padding,icon.getAttribute('src')]));
  const stage=document.querySelector('.rx-stage');
  const pop=stage.querySelector('.rx-piv > img');
  if(pop)assert(parseFloat(getComputedStyle(pop).width)>stage.offsetWidth*.6,'monthly reaction poster scales up');
  for(let i=0;i<60&&!stage.querySelector('.rx-piv > div');i++)await new Promise(r=>setTimeout(r,20));
  const animated=stage.querySelector('.rx-piv > div');
  assert(animated && new DOMMatrix(getComputedStyle(animated).transform).a*animated.offsetWidth>stage.offsetWidth,'monthly reaction animation scales up');
 }
 assert(document.documentElement.scrollWidth<=innerWidth+1,'horizontal overflow');
 document.getElementById('polish-result').textContent=JSON.stringify({pass:true,width:innerWidth,checks:'High Stakes pick, bet, reveal, split, fold, rollover and reduced motion'});
} catch(e) {
 document.getElementById('polish-result').textContent=JSON.stringify({pass:false,error:String(e),stack:e.stack});
}
</script>`;
let fixture=source.replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js','/__fake/app.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js','/__fake/db.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js','/__fake/auth.mjs');
const fitFixture=fixture.replace('\n</script>\n</body>',injected+'\n</script>\n</body>');
fixture=fixture.replace('\n</script>\n</body>',injected+'\n</script>'+checks+'\n</body>');
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');if(url.pathname==='/test'||url.pathname==='/fit-test'){res.setHeader('Content-Type','text/html');res.end(url.pathname==='/test'?fixture:fitFixture);return;}if(url.pathname.startsWith('/__fake/')){res.setHeader('Content-Type','text/javascript');res.end(url.pathname.endsWith('app.mjs')?'export const initializeApp=()=>({});':url.pathname.endsWith('db.mjs')?dbStub:authStub);return;}const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}try{res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
server.listen(0,'127.0.0.1',()=>{const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'polish-tests-'+process.pid),'about:blank'],{windowsHide:true});let stderr='',started=false,socket;const timer=setTimeout(()=>{child.kill();server.close();process.exitCode=1;},180000);
 child.stderr.on('data',async chunk=>{stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(started||!match)return;started=true;
 try{socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no;});let serial=0;const pending=new Map(),errors=[];
 socket.onmessage=e=>{const r=JSON.parse(e.data);if(r.id){const p=pending.get(r.id);if(p){pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result);}}else if(r.method==='Runtime.exceptionThrown')errors.push(r.params.exceptionDetails.exception?.description||r.params.exceptionDetails.text);};
 const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});fs.mkdirSync(path.join(root,'output','auto-fit-tests'),{recursive:true});
 for(const width of (process.env.AUTOFIT_WIDTHS||'280,320,360,390,430,640').split(',').map(Number)){
 const {browserContextId}=await call('Target.createBrowserContext');
 const {targetId}=await call('Target.createTarget',{url:'about:blank',browserContextId}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});await call('Runtime.enable',{},sessionId);await call('Emulation.setDeviceMetricsOverride',{width,height:width>=600?360:width===320?650:800,deviceScaleFactor:1,mobile:true},sessionId);
 if(process.env.AUTOFIT_TEXT_ONLY!=='1'){
  await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/test'},sessionId);
  let result;
  for(let n=0;n<800;n++){const r=await call('Runtime.evaluate',{expression:'document.getElementById("polish-result")?.textContent',returnByValue:true},sessionId);if(r.result?.value){result=JSON.parse(r.result.value);break;}await new Promise(r=>setTimeout(r,20));}
  console.log(result||{error:'No result',exceptions:errors});if(!result?.pass)throw Error(result?.stack||errors.join('\n')||'No browser result');
 }
 const pages=(process.env.AUTOFIT_PAGES??'hsPick,hsBet,stats,world,quickLobby,settings,join,shop,style,solo,party,reward').split(',').filter(Boolean);
 const screenFor={hsPick:'hs-screen',hsBet:'hs-screen',stats:'career-screen',world:'worlds-screen',quickLobby:'lobby-screen',lobby:'lobby-screen',teamLobby:'lobby-screen',settings:'settings-screen',join:'join-screen',shop:'gacha-screen',style:'gacha-screen',solo:'solo-screen',party:'party-screen',classic:'teamvteam-screen',highLow:'teamvteam-screen',bluff:'teamvteam-screen',daily:'daily-screen',monthly:'monthly-screen',survival:'survival-screen',bigger:'wb-screen'};
 if(pages.length){
  await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/fit-test'},sessionId);
  let ready=false;
  for(let i=0;i<300&&!ready;i++){
    const state=await call('Runtime.evaluate',{expression:`location.pathname==='/fit-test'&&!!window.__polish`,returnByValue:true},sessionId);
    ready=!!state.result?.value;
    if(!ready)await new Promise(r=>setTimeout(r,20));
  }
  if(!ready)throw Error('Label fixture did not load at '+width+'px');
  await call('Runtime.evaluate',{expression:'window.__polish.quiet();document.fonts.ready.then(()=>true)',awaitPromise:true},sessionId);
 }
 for(const page of pages){await call('Runtime.evaluate',{expression:'window.__polish.'+page+'()',awaitPromise:true},sessionId);await new Promise(r=>setTimeout(r,page==='worldResult'?2200:500));
 const visibleScreen=await call('Runtime.evaluate',{expression:page==='reward'?'!document.getElementById("coin-reward-screen").hidden':screenFor[page]?`document.getElementById("${screenFor[page]}").classList.contains("active") && document.getElementById("coin-reward-screen").hidden`:'true',returnByValue:true},sessionId);
 if(!visibleScreen.result.value)throw Error('Expected screen is not visible: '+page+' at '+width+'px');
 const checks=await call('Runtime.evaluate',{expression: String.raw`(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms));const failures=[];
 const settle=async()=>{for(let i=0;i<4;i++)await new Promise(requestAnimationFrame);};
 const bounds=node=>{const range=document.createRange();range.selectNodeContents(node);return [...range.getClientRects()];};
 if(!document.getElementById('fit-system-scaling')){
  const style=document.createElement('style');style.id='fit-system-scaling';
  style.textContent='html[data-large-text=true] button{font-size:150%!important} html[data-large-text=true] .sh-name{font-size:33px!important} html[data-large-text=true] .sh-sub{font-size:19.5px!important}';
  document.head.append(style);
  const delayed=document.createElement('button');
  delayed.style.cssText='position:fixed;left:4px;top:64px;width:125px;height:0;padding:0;border:0;margin:0;display:flex;align-items:center;justify-content:center;font-size:24px';
  delayed.innerHTML='<span>Collect bonus coins</span>';
  document.body.append(delayed);
  await settle();
  delayed.style.height='40px';
  await settle();
  const label=delayed.firstElementChild, box=delayed.getBoundingClientRect();
  if(!bounds(label.firstChild).every(r=>r.top>=box.top-1&&r.bottom<=box.bottom+1&&r.left>=box.left-1&&r.right<=box.right+1))failures.push({kind:'late-size button did not refit'});
  delayed.style.width='245px';
  await settle();
  if(parseFloat(getComputedStyle(label).fontSize)!==24)failures.push({kind:'label did not return to its normal size when more space became available'});
  delayed.remove();
 }
 for(const large of ['false','true']){
 document.documentElement.dataset.largeText=large;
 document.querySelectorAll('button[data-autofit-stress]').forEach(b=>b.remove());
 const stress=document.createElement('button');stress.dataset.autofitStress='';stress.style.cssText='display:flex;align-items:center;gap:8px;width:130px;height:48px;padding:8px;border:2px solid brown;font:700 24px Fredoka;';stress.innerHTML='<img src="/icons/coin-v2.webp" style="width:28px;height:28px"><span>Collect all your bonus coins</span>';document.querySelector('.screen.active')?.append(stress);
 await settle();
 // Measure settled artwork, including a newly appended stress button's entrance.
 document.querySelector('.screen.active')?.getAnimations({subtree:true}).forEach(a=>{if(a.effect.getTiming().iterations!==Infinity)a.finish();});
 if(Math.abs(stress.getBoundingClientRect().height-48)>1)failures.push({kind:'button height changed',height:stress.getBoundingClientRect().height});
 for(const button of document.querySelectorAll('button,[role="button"],.polish-banner,.mode-heading-banner')){
 if(!button.clientWidth||!button.getClientRects().length)continue;
 const b=button.getBoundingClientRect();
 if(b.right>innerWidth+2||b.left< -2)failures.push({kind:'button outside screen',id:button.id,text:button.textContent.slice(0,45)});
 const walk=document.createTreeWalker(button,NodeFilter.SHOW_TEXT);while(walk.nextNode()){
 const node=walk.currentNode;if(!node.nodeValue.trim()||node.parentElement.closest('svg,[hidden]'))continue;
 if(node.parentElement.closest('.home-free-badge,.home-ad-badge,.coin-sparkle'))continue;
 const caption=node.parentElement.closest('.sh-banner .sh-tx'), fit=caption?.getBoundingClientRect()||b, style=caption&&getComputedStyle(caption);
 const left=fit.left+(style?parseFloat(style.paddingLeft):0),right=fit.right-(style?parseFloat(style.paddingRight):0);
 for(const r of bounds(node))if(r.width&&(r.left<left-2||r.right>right+2||r.top<fit.top-2||r.bottom>fit.bottom+2))failures.push({kind:'text outside button label area',id:button.id,text:node.nodeValue.trim().slice(0,45),large,button:[fit.width,fit.height],textBounds:[r.left-left,r.right-right,r.top-fit.top,r.bottom-fit.bottom]});}
 // Mascot illustrations intentionally protrude beyond the edges of their banner.
 if(button.matches('button'))for(const image of button.querySelectorAll('img:not(.sh-bmasc,.coin-sparkle img)')){const r=image.getBoundingClientRect();if(r.width&&(r.left<b.left-2||r.right>b.right+2||r.top<b.top-2||r.bottom>b.bottom+2))failures.push({kind:'icon outside button',id:button.id,src:image.src});}
 }
 }
 document.querySelectorAll('button[data-autofit-stress]').forEach(b=>b.remove());
 if(document.getElementById('lobby-screen').classList.contains('active')){
  const start=document.getElementById('host-start-btn'),back=document.getElementById('lobby-back-btn'),extra=document.createElement('li');extra.style.height='1000px';document.getElementById('player-list').append(extra);
  window.scrollTo(0,150);await wait(40);const first=start.getBoundingClientRect().top;
  window.scrollTo(0,document.documentElement.scrollHeight);await wait(40);const last=start.getBoundingClientRect(),toolbar=document.getElementById('app-toolbar').getBoundingClientRect();
  if(Math.abs(first-last.top)>1||last.top<toolbar.bottom-1||last.top>toolbar.bottom+12||back.getBoundingClientRect().top<toolbar.bottom-1)failures.push({kind:'Start game not pinned below toolbar',first,last:last.top,toolbar:toolbar.bottom});
  extra.remove();window.scrollTo(0,0);
 }
 return JSON.stringify(failures);
})()`,awaitPromise:true,returnByValue:true},sessionId);
const failures=JSON.parse(checks.result.value);if(failures.length)throw Error(JSON.stringify({width,page,failures},null,2));
const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(root,'output','auto-fit-tests',page+'-'+width+'.png'),Buffer.from(shot.data,'base64'));}
 if(errors.length)throw Error(errors.join('\n'));if(pages.length)console.log('PASS: '+width+'px, normal/large text, rich labels and icon alignment');await call('Target.disposeBrowserContext',{browserContextId});}
 }catch(e){console.error(e);process.exitCode=1;}finally{clearTimeout(timer);socket?.close();child.kill();server.close();}});
});



