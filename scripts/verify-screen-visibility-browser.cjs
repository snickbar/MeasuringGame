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
 homeState:()=>({rewardActive:gameRewards?.active,qrGuard:qrScanGuardUntil,room:currentRoomCode,player:currentPlayerId,screens:ALL_SCREEN_ELS.filter(e=>e.classList.contains('active')).map(e=>e.id)}),
 visibilityOpen:id=>openOverlay(document.getElementById(id)),visibilityClose:()=>closeOverlay(),
 visibilityPhase:(mode,phase='final')=>{roomState.settings.mode=mode;roomState.phase=phase;roomState.hs={stage:'over'};roomState.bluff={stage:'over'};applyPhase(roomState);},
 visibilityReset:()=>{ALL_SCREEN_ELS.forEach(el=>el.classList.remove('active'));roomState.phase='final';applyPhase(roomState);},
 visibilityLegacy:id=>{const el=document.getElementById(id);el.style.display='flex';el.classList.add('active');},

 owner:()=>deviceId,profile:()=>myProfile,flush:()=>careerLedger.flush(),stats:()=>{statsMode='all';showCareerTab('stats');},objects:()=>showCareerTab('objects'),
 world:()=>{openWorlds();wl.wi=0;wl.phase='world';renderWorlds();},startWorld:()=>{openWorlds();wl.wi=0;worldStartLevel(1);},
 answerWorld:()=>{wl.input=String(wl.questions[wl.guesses.length].answer*.85);renderWorlds();document.getElementById('wl-submit').click();},
 abandonWorld:()=>document.getElementById('worlds-close-btn').click(),survival:()=>openSurvival(),
 lobby:async(final=false,solo=false)=>{
  currentRoomCode='TEST';currentPlayerId='me';isHost=true;currentName='Player';finalRendered=false;
  roomState={phase:final?'final':'waiting',gameId:'polish-game',round:3,settings:{solo:false,timerSeconds:30,totalRounds:3,itemSelectionMode:'anything',autoAdvanceEnabled:false},players:{me:{name:'Player',avatar:'av07',isHost:true,score:10,roundsCounted:3,accuracySum:270,joinedAt:1},friend:{name:'Friend',avatar:'av19',score:10,roundsCounted:3,accuracySum:240,joinedAt:2}},currentQuestion:{unitId:'ant',targetId:'door',answer:400,prompt:'Test'},lastRoundPoints:{me:3,friend:0}};
  if(solo){roomState.settings.solo=true;roomState.players={me:roomState.players.me,...Object.fromEntries(['av19','av06','av20'].map((avatar,i)=>['bot'+i,{name:'Bot '+(i+1),avatar,isBot:true,botDifficulty:'medium',joinedAt:i+2}]))};}else roomState.players.third={name:'Third player',avatar:'av06',joinedAt:3,score:0};
  currentPlayers=roomState.players;await set(ref(db,'rooms/TEST'),roomState);ALL_SCREEN_ELS.forEach(el=>el.classList.remove('active'));hudEl.classList.remove('active');
  if(final){finalScreenEl.classList.add('active');renderFinal();}else{lobbyScreenEl.classList.add('active');hostStartBtn.style.display='flex';window.scrollTo(0,0);document.getElementById('install-banner').classList.remove('active');roomCodeDisplay.textContent='TEST';renderHostUnlockUi();applyLobbyMode(roomState);renderPlayerList();}
 },
 quickLobby:()=>window.__polish.lobby(false,true),
 refreshLobby:async()=>{roomState=(await get(ref(db,'rooms/TEST'))).val();currentPlayers=roomState.players;applyLobbyMode(roomState);renderPlayerList();},
 collect:()=>gameRewards.open(),settings:()=>openOverlay(settingsScreen),join:()=>{ALL_SCREEN_ELS.forEach(el=>el.classList.remove('active'));showJoinScreen();}
 ,worldList:()=>{openWorlds();wl.phase='list';renderWorlds();},
 unlockDemo:()=>uiDelight.unlock({name:'Garden home screen',image:'home-bg.jpg',wide:true,equip:async()=>{window.__unlockEquipped=(window.__unlockEquipped||0)+1;}})
};
`;
let checks=String.raw`
<pre id="polish-result" hidden></pre><script type="module">
const wait=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m)},until=async(fn,m)=>{for(let i=0;i<300;i++){if(fn())return;await wait(20)}throw Error(m)};
try{
 await until(()=>window.__polish?.profile()?.stats?.gamesPlayed===8,'Bootstrap');const api=window.__polish,$=id=>document.getElementById(id);
 const shown=()=>[...document.querySelectorAll('.screen,#hud')].filter(el=>el.getClientRects().length&&getComputedStyle(el).display!=='none').map(el=>el.id);
 const only=id=>assert(shown().length===1&&shown()[0]===id,'Only '+id+' should show, got '+shown().join(','));
 // Home must preserve the document/wallet and swap only complete, correctly sized scenes.
 const {installHomeScene}=await import('/anim/home-scene.mjs');
 const {HOME_MOTION}=await import('/anim/home-motion.mjs');
 const html=document.documentElement;
 await until(()=>$('home-art')&&!html.hasAttribute('data-home-loading'),'Initial Home decoded');
 window.__homeNavigationMarker=crypto.randomUUID();const marker=window.__homeNavigationMarker;
 localStorage.setItem('mg_homeSel','ants');api.visibilityOpen('settings-screen');
 const homeButton=document.querySelector('#toolbar-home-btn');assert(homeButton,'Home toolbar button');homeButton.click();await wait(80);only('home-screen');
 assert(window.__homeNavigationMarker===marker,'Home never reloads the document');
 for(const scene of ['ants','sunflower','games','house','snacks','town','corgi','wheels','lighthouse','underwater','toy-box','penguin','cactus','giraffe','dragon','space']){
  html.style.setProperty('--home-bg','url("'+window.mgHomeFile(scene)+'")');html.dataset.homeScene=scene;
  await installHomeScene();await until(()=>$('home-art')?.dataset.scene===scene,'Scene '+scene);
  const art=$('home-art'),stage=art.querySelector('.hs-stage');
  assert(document.querySelectorAll('#home-art').length===1,'One scene at a time');
  assert([...art.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth),'All '+scene+' layers decoded');
  assert(getComputedStyle($('home-screen')).backgroundImage==='none','No flat picture flashes behind '+scene);
  assert(stage.getBoundingClientRect().width>=innerWidth,'Stage covers phone width: '+scene);
  const at=(ms)=>{for(const a of art.getAnimations({subtree:true})){a.pause();a.currentTime=ms;}},opacity=sel=>Number(getComputedStyle(art.querySelector(sel)).opacity);
  const route=art.querySelector('.hs-bidirectional');
  assert(route,'Scene has alternating crossings: '+scene);
  const cycle=parseFloat(route.style.getPropertyValue('--cs'))*1000,delay=parseFloat(route.style.getPropertyValue('--cd'))*1000;
  at(delay+1000);assert(new DOMMatrix(getComputedStyle(route).transform).a>.9,'First crossing direction: '+scene);
  at(delay+cycle+1000);assert(new DOMMatrix(getComputedStyle(route).transform).a<-.9,'Return crossing mirrors route and artwork: '+scene);
  if(['lighthouse','wheels','toy-box','snacks','giraffe','penguin','corgi','dragon'].includes(scene)){
   assert(art.querySelector('.hs-complete-stack')&&art.querySelector('.hs-back > .hs-hop > img').hidden,'Complete stack replaces cut sprite: '+scene);
   const stack=art.querySelector('.hs-complete-stack');at(0);const r=stack.getBoundingClientRect().toJSON();at(8000);
   assert(JSON.stringify(stack.getBoundingClientRect().toJSON())===JSON.stringify(r),'Lower stack stays fixed: '+scene);
  }
  if(!HOME_MOTION[scene].prop)for(const ms of [0,4500,8500]){at(ms);assert(getComputedStyle(art.querySelector('.hs-back')).transform==='none','Rigid prop never breathes: '+scene);}
  if(scene==='town'){
   for(const [ms,opened]of [[1000,0],[4100,1],[9000,0]]){at(ms);assert(opacity('.hs-open')===opened&&opacity('.hs-mail-closed')===1-opened,'Exactly one mailbox door at '+ms);}
   at(1000);const dark=getComputedStyle(art.querySelector('.hs-lamp-pane')).backgroundImage;at(6000);assert(getComputedStyle(art.querySelector('.hs-lamp-pane')).backgroundImage!==dark,'Lamp visibly switches on');
  }
  const behind=(a,b)=>Boolean(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING);
  const screenAngle=el=>{
   let matrix=new DOMMatrix();for(let node=el;node&&node!==art;node=node.parentElement){const s=getComputedStyle(node);matrix=new DOMMatrix().rotate(parseFloat(s.rotate)||0).multiply(new DOMMatrix(s.transform==='none'?undefined:s.transform)).multiply(matrix);}
   return Math.atan2(matrix.b,matrix.a);
  };
  const rollsWithTravel=(traveller,sprite,ms,label)=>{
   at(ms);const x=traveller.getBoundingClientRect().x,angle=screenAngle(sprite);at(ms+40);
   const dx=traveller.getBoundingClientRect().x-x,delta=screenAngle(sprite)-angle,turn=Math.atan2(Math.sin(delta),Math.cos(delta));
   assert(Math.abs(dx)>.1&&turn*dx>0,'Visible rotation follows travel direction: '+label);
  };
  if(scene!=='cactus')for(const roller of art.querySelectorAll('.hs-roll')){
   const duration=parseFloat(roller.style.getPropertyValue('--cs'))*1000,delay=parseFloat(roller.style.getPropertyValue('--cd'))*1000;
   rollsWithTravel(roller,roller.querySelector('.hs-crit-img'),delay+duration*.2,scene+' rolling object outward');
   rollsWithTravel(roller,roller.querySelector('.hs-crit-img'),delay+duration*1.2,scene+' rolling object return');
  }
  if(scene==='games')assert(art.querySelectorAll('.hs-cube-face').length===5&&art.querySelectorAll('.hs-scuttle .hs-leg').length===4,'Turning cube has side faces; crab has four walking legs');
  if(scene==='underwater')assert(behind(art.querySelector('.hs-rise'),art.querySelector('.hs-back')),'Jellyfish behind objects');
  if(scene==='house'){
   assert(behind(art.querySelector('.hs-counter'),art.querySelector('.hs-back')),'Mouse behind foreground objects on counter');
   assert(art.querySelectorAll('.hs-mouse-frame').length===4,'Mouse has four cheese-carrying walking poses');
   const poses=new Set();for(const ms of [2200,2360,2520,2680]){at(ms);const visible=[...art.querySelectorAll('.hs-mouse-frame')].filter(f=>Number(getComputedStyle(f).opacity)>.5);assert(visible.length===1,'One walking pose visible');poses.add(visible[0]);}
   assert(poses.size===4,'Feet advance through all four walking poses');
   at(14000);assert(opacity('.hs-counter')===1,'Mouse remains opaque across the counter');
  }
  if(scene==='toy-box'){
   at(7000);assert(opacity('.hs-arm-open')===1&&opacity('.hs-arm-closed')===0,'Robot opens its hand at the top of the wave');
   const zone=art.querySelector('[data-subject=prop]'),r=zone.getBoundingClientRect(),buttons=document.querySelector('.home-tile').getBoundingClientRect();
   const y=Math.min(r.y+r.height*.85,buttons.top-12),hit=document.elementFromPoint(r.x+r.width*.5,y);
   assert(y>r.y+r.height*.6&&hit===zone,'Visible lower blocks receive real screen taps: '+JSON.stringify({tag:hit?.tagName,cls:hit?.className,r:r.toJSON(),buttons:buttons.toJSON(),y}));
   const ball=art.querySelector('.hs-bouncing-ball');assert(behind(ball,art.querySelector('.hs-back')),'Ball bounces behind toys');
   rollsWithTravel(ball,ball.firstChild,4000,'toy ball outward');rollsWithTravel(ball,ball.firstChild,22000,'toy ball return');
   const joint=art.querySelector('.hs-elbow-cap');assert(joint&&getComputedStyle(joint).borderRadius==='50%','Round elbow bridges the articulated sprite joint');
   at(3800);const apex=ball.getBoundingClientRect().top;at(5240);assert(ball.getBoundingClientRect().top>apex+20,'Ball lands after first bounce');
  }
  if(scene==='space')assert([...art.querySelectorAll('.hs-route')].every(r=>behind(r,art.querySelector('.hs-back'))),'Satellite and spacecraft behind objects');
  if(scene==='town')assert(behind(art.querySelector('.hs-route[data-critter-index="1"]'),art.querySelector('.hs-back')),'Blue bird behind objects');
  if(scene==='snacks'){
   const ants=art.querySelector('[data-copies="2"]');assert(ants?.querySelectorAll('.hs-scuttle').length===2&&behind(ants,art.querySelector('.hs-back')),'Two following ants behind both objects');
   for(const ms of [14000,48000,57000]){at(ms);for(const walker of ants.querySelectorAll('.hs-wingbox'))assert([...walker.children].filter(f=>Number(getComputedStyle(f).opacity)>.5).length===1,'Exactly one animation frame per ant at '+ms);}
  }
  if(scene==='penguin'){
   const slider=art.querySelector('.hs-slide');assert(slider.closest('.hs-route').dataset.directionPolicy==='downhill-left','Penguin excluded from return crossings');
   at(4400);const high=slider.getBoundingClientRect();at(6780);const low=slider.getBoundingClientRect();assert(low.y>high.y+20&&low.x<high.x,'Penguin descends hill toward left');
   at(10000);assert(opacity('.hs-slide')===1,'Penguin stays opaque until past the left edge');
   assert(art.querySelector('.hs-ice-top .hs-melt-drop'),'Small drip belongs to moving top cube');
  }
  if(scene==='corgi')assert(art.querySelectorAll('.hs-kibble-piece').length===23&&art.querySelector('.hs-bowl-front'),'Individual food behind bowl rim');
  if(scene==='dragon')assert(art.querySelectorAll('.hs-coin-face').length===2&&art.querySelectorAll('.hs-coin-edge').length===64,'Coin has front, back and solid edge');
  if(scene==='lighthouse'){
   const beam=art.querySelector('.hs-fx-beamSweep');assert(beam.closest('.hs-effect-owner'),'Beam behind both subjects');
   at(0);assert(new DOMMatrix(getComputedStyle(beam).transform).a>.9,'Beam to right');at(6000);assert(new DOMMatrix(getComputedStyle(beam).transform).a<-.9,'Beam to left');
   assert(art.querySelector('.hs-fx-steam').closest('.hs-cup-top'),'Steam follows the moving cup');
  }
  if(scene==='cactus'){
   const dust=art.querySelector('.hs-roll');assert(behind(dust,art.querySelector('.hs-back')),'Dustball stays behind cactus and hats');
   rollsWithTravel(dust,dust.querySelector('.hs-crit-img'),9000,'dustball outward');rollsWithTravel(dust,dust.querySelector('.hs-crit-img'),45000,'dustball return');
   assert(dust.closest('.hs-route').dataset.directionPolicy==='terrain-return','Dust follows fixed terrain in both directions');
   at(17600);const crest=dust.getBoundingClientRect();at(10120);const dip=dust.getBoundingClientRect();assert(dip.y>crest.y+25&&dip.x>crest.x,'Dust follows left crest into shallow right dip');
   at(41400);const returnCrest=dust.getBoundingClientRect();assert(Math.abs(returnCrest.x-crest.x)<2&&Math.abs(returnCrest.y-crest.y)<2,'Return crossing follows same dune crest');
   const flower=art.querySelector('.hs-fx-bloom');assert(flower.closest('.hs-back'),'Flower attached to cactus');
   for(const ms of [1000,10200,11700,13500,15500]){at(ms);assert([...flower.children].filter(f=>Number(getComputedStyle(f).opacity)>.5).length===1,'One attached flower stage at '+ms);}
  }
  if(scene==='penguin')assert([...art.querySelectorAll('.hs-fx-glint')].every(f=>f.closest('.hs-back')),'Ice sparkles stay off penguin');
  if(scene==='house')assert(!art.querySelector('.hs-fx-rise'),'No steam from soda');
  if(scene==='dragon'){
   assert([...art.querySelectorAll('.hs-crit')].every(c=>behind(c,art.querySelector('.hs-castle-occluder'))),'Flying dragons pass behind castle mask');
   at(2000);assert(opacity('.hs-peek')===0&&opacity('.hs-fx-dragonFire')===0,'Dragon sleeps between gestures');
   at(9900);assert(opacity('.hs-peek')===1&&opacity('.hs-fx-dragonFire')>.8,'Dragon wakes before breathing fire');
  }
  // Tap late in an idle loop: a short gesture must restart, not instantly finish
  // because its old CSS currentTime is longer than the new duration.
  for(const [role,subject]of ['hero','prop'].entries()){
   at(13000);art.querySelector('[data-subject='+subject+']').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
   assert(art.dataset.reaction===HOME_MOTION[scene].taps[role],'Specific '+scene+' '+subject+' reaction');
   if(scene==='town'&&role===1){assert(art.dataset.lamp==='on','Tap switches lamp on');}
   if(scene==='toy-box'&&role===0){
    const arm=art.querySelector('.hs-armIdle'),forearm=art.querySelector('.hs-forearm');
    at(1200);const upperAngle=Math.atan2(new DOMMatrix(getComputedStyle(arm).transform).b,new DOMMatrix(getComputedStyle(arm).transform).a)*180/Math.PI;
    assert(upperAngle>-55&&upperAngle<-40,'Robot shoulder stays low');
    assert(new DOMMatrix(getComputedStyle(forearm).transform).b<-.8,'Elbow bends independently upward');
    for(const ms of [1805,2000,2250]){at(ms);assert(opacity('.hs-arm-open')===0&&opacity('.hs-arm-closed')===1,'Open hand never flashes after tap at '+ms);}
    art.querySelector('[data-subject=hero]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
   }
   if((role===1&&['penguin','dragon','toy-box','space','cactus','corgi'].includes(scene))||(role===0&&scene==='games')){
    const target=art.querySelector(({penguin:'.hs-ice-top',dragon:'.hs-coin-cylinder','toy-box':'.hs-block-roof',space:'.hs-fx-flame',cactus:'.hs-fx-bloom',corgi:'.hs-kibble-piece',games:'.hs-cube-rotor'})[scene]);
    const before=getComputedStyle(target).transform;at(350);assert(getComputedStyle(target).transform!==before,'Tap produces visible '+scene+' movement');
    // Reset before checking the gesture restart timing below.
    art.querySelector('[data-subject='+subject+']').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
   }
   const finite=art.getAnimations({subtree:true}).filter(a=>a.effect?.getTiming().iterations===1);
   if(HOME_MOTION[scene].taps[role]!=='lamp-glow')assert(finite.length&&finite.every(a=>a.currentTime<200),'Tap gesture restarts: '+scene+' '+subject);
   $('home-screen').classList.remove('active');await wait(20);
   assert(art.classList.contains('hs-paused')&&!art.dataset.reaction,'Leaving Home cancels tap feedback');
   assert(!art.getAnimations({subtree:true}).some(a=>a.playState==='running'),'Home animations pause offscreen');
   $('home-screen').classList.add('active');await wait(10);
  }
 }
 const swaps=['town','corgi','ants'].map(scene=>{html.dataset.homeScene=scene;return installHomeScene()});await Promise.all(swaps);
 await until(()=>$('home-art')?.dataset.scene==='ants','Latest scene wins an overlapping load');
 html.dataset.motion='reduce';await wait(30);
 assert(!$('home-art').getAnimations({subtree:true}).some(a=>a.playState==='running'),'Reduced motion stops every rig part');
 html.dataset.motion='full';
 await api.flush();api.profile().randomEquip={homeScreens:true};window.__fakeDB.put('profiles/'+api.owner()+'/randomEquip',{homeScreens:true});
 localStorage.setItem('mg_homeSel','random');localStorage.setItem('mg_homeOwned',JSON.stringify(['ants','space','corgi']));localStorage.setItem('mg_homeLast','ants');
 homeButton.click();await wait(40);await installHomeScene();
 await until(()=>$('home-art')?.dataset.scene===html.dataset.homeScene,'Random scene finished');
 assert(['space','corgi'].includes($('home-art').dataset.scene),'Random Home changes the actual layered scene: '+JSON.stringify({scene:html.dataset.homeScene,art:$('home-art').dataset.scene,selected:localStorage.getItem('mg_homeSel'),owned:localStorage.getItem('mg_homeOwned'),last:localStorage.getItem('mg_homeLast'),state:api.homeState()}));
 assert(window.__homeNavigationMarker===marker,'Random Home preserves document');
 await api.lobby();homeButton.click();$('exit-confirm-yes-btn').click();
 await until(()=>api.homeState().room===null,'Leaving lobby detaches room');only('home-screen');
 await api.lobby(true);await api.flush();
 for(const mode of ['classic','quick','teamvteam','teamworlds','hlsurvival','highstakes','bluff']){
  for(const menu of ['settings-screen','gacha-screen','career-screen','items-screen','achievements-screen','howto-screen','collection-screen','preset-settings-screen']){
   api.visibilityReset();api.visibilityOpen(menu);only(menu);
   for(let update=0;update<3;update++){api.visibilityPhase(mode);await wait(10);only(menu);}
   document.dispatchEvent(new Event('visibilitychange'));await wait(15);only(menu);
   api.visibilityClose();await wait(10);assert(shown().length===1,'Closing menu restores one page');
  }
 }
 for(const phase of ['waiting','ended','hs']){
  api.visibilityReset();api.visibilityOpen('settings-screen');api.visibilityPhase('highstakes',phase);await wait(10);only('settings-screen');
 }
 for(const page of ['worlds-screen','survival-screen','monthly-screen','daily-screen','left-screen','ended-screen']){
  api.visibilityReset();api.visibilityOpen(page);api.visibilityOpen('settings-screen');await wait(10);only('settings-screen');
 }
 for(const late of ['final-screen','hs-screen','bluff-screen','hud','lobby-screen','ended-screen','left-screen','worlds-screen','survival-screen']){
  api.visibilityLegacy(late);await wait(10);only('settings-screen');assert(getComputedStyle($(late)).display==='none','Inactive inline display is hidden: '+late);$(late).style.display='';
 }
 for(const bar of ['hud-sub-toolbar','bottom-toolbar','paused-overlay','kick-modal']){$(bar).classList.add('active');await wait(10);assert(!$(bar).getClientRects().length,'Game controls stay hidden behind menus: '+bar);}
 assert(document.documentElement.scrollWidth<=innerWidth+1,'Phone width preserved');
 $('polish-result').textContent=JSON.stringify({pass:true,width:innerWidth,checks:'All 16 decoded Home scenes, no-reload Home/random navigation, overlapping scene requests, reduced motion, lobby exit, plus all party finals x eight menus and late screen updates'});
}catch(e){document.getElementById('polish-result').textContent=JSON.stringify({pass:false,error:String(e),stack:e.stack});}
</script>`;
let fixture=source.replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js','/__fake/app.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js','/__fake/db.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js','/__fake/auth.mjs');
// Each viewport is a fresh device; do not recover the previous viewport's simulated reward receipt.
fixture=fixture.replace('<head>','<head><script>localStorage.clear();</script>');
fixture=fixture.replace('\n</script>\n</body>',injected+'\n</script>'+checks+'\n</body>');
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');if(url.pathname==='/test'){res.setHeader('Content-Type','text/html');res.end(fixture);return;}if(url.pathname.startsWith('/__fake/')){res.setHeader('Content-Type','text/javascript');res.end(url.pathname.endsWith('app.mjs')?'export const initializeApp=()=>({});':url.pathname.endsWith('db.mjs')?dbStub:authStub);return;}const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}try{res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
server.listen(0,'127.0.0.1',()=>{const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--autoplay-policy=no-user-gesture-required','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'polish-tests-'+process.pid),'about:blank'],{windowsHide:true});let stderr='',started=false,socket;const timer=setTimeout(()=>{child.kill();server.close();process.exitCode=1;},90000);
 child.stderr.on('data',async chunk=>{stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(started||!match)return;started=true;
 try{socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no;});let serial=0;const pending=new Map(),errors=[];
 socket.onmessage=e=>{const r=JSON.parse(e.data);if(r.id){const p=pending.get(r.id);if(p){pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result);}}else if(r.method==='Runtime.consoleAPICalled'&&r.params.type==='warning')console.log('Browser warning:',r.params.args.map(a=>a.description||a.value));else if(r.method==='Runtime.exceptionThrown')errors.push(r.params.exceptionDetails.exception?.description||r.params.exceptionDetails.text);};
 const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});fs.mkdirSync(path.join(root,'output','screen-visibility-tests'),{recursive:true});
 for(const width of [320,390,430]){const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});await call('Runtime.enable',{},sessionId);await call('Emulation.setDeviceMetricsOverride',{width,height:width===320?650:800,deviceScaleFactor:1,mobile:true},sessionId);await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/test'},sessionId);let result;
 for(let n=0;n<800;n++){const r=await call('Runtime.evaluate',{expression:'document.getElementById("polish-result")?.textContent',returnByValue:true},sessionId);if(r.result?.value){result=JSON.parse(r.result.value);break;}await new Promise(r=>setTimeout(r,20));}console.log(result||{error:'No result',exceptions:errors});if(!result?.pass)throw Error(result?.stack||errors.join('\n')||'No browser result');
 for(const page of ['settings']){await call('Runtime.evaluate',{expression:page==='lobby'?'window.__polish.lobby()':'window.__polish.'+page+'()',awaitPromise:true},sessionId);await new Promise(r=>setTimeout(r,350));const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(root,'output','screen-visibility-tests',page+'-'+width+'.png'),Buffer.from(shot.data,'base64'));}
 if(errors.length)throw Error(errors.join('\n'));await call('Target.closeTarget',{targetId});}
 }catch(e){console.error(e);process.exitCode=1;}finally{clearTimeout(timer);socket?.close();child.kill();server.close();}});
});



