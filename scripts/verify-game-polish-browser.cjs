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
const wait=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m)},until=async(fn,m)=>{for(let i=0;i<300;i++){if(fn())return;await wait(20)}throw Error(m);};
try{
 await until(()=>window.__polish&&window.__polish.profile()?.stats?.gamesPlayed===8,'App bootstrap');const api=window.__polish,$=id=>document.getElementById(id);
 const fit=label=>assert(document.documentElement.scrollWidth<=innerWidth+1,'No horizontal overflow: '+label);
 api.stats();await wait(400);assert($('career-content').textContent.includes('Games won'),'Games won visible');assert($('career-content').textContent.includes('Win rate'),'Win rate visible');fit('Stats');
 assert(!$('career-content').querySelector('select'),'Stats has no dropdowns');assert(document.querySelectorAll('[data-stats-view]').length>=7,'All mode views in toolbar');assert(document.querySelector('[data-stats-view]').getBoundingClientRect().width<110,'Compact toolbar buttons');
 const strip=document.querySelector('.stats-views');assert(strip.scrollWidth<=strip.clientWidth+1,'All Stats views fit without scrolling');for(const button of strip.children){const rect=button.getBoundingClientRect();assert(rect.left>=0&&rect.right<=innerWidth,'Every view visible');assert(button.scrollWidth<=button.clientWidth+1,'View label fits');}
 document.querySelector('[data-stats-view="worlds"]').click();assert($('career-content').textContent.includes('Worlds mastered'),'World stats');assert(document.querySelector('[data-stats-view="worlds"]').getAttribute('aria-pressed')==='true','Active mode highlighted');
 document.querySelector('[data-stats-view="survival"]').click();assert($('career-content').textContent.includes('Best run'),'Survival stats');fit('Stats toolbar');
 api.objects();await wait(350);const search=$('object-search');assert(search.readOnly&&search.inputMode==='none','Search blocks native keyboard');const hardware=new KeyboardEvent('keydown',{key:'X',cancelable:true});search.dispatchEvent(hardware);assert(hardware.defaultPrevented,'Hardware input blocked');
 $('object-search-edit').click();for(const c of 'ANT')$('object-search-keys').querySelector('[data-key="'+c+'"]').click();assert([...$('items-content').querySelectorAll('.items-row:not([hidden])')].every(row=>row.textContent.toLowerCase().includes('ant')),'Search filters names');
 $('object-search-keys').querySelector('[data-action=done]').click();assert($('object-search-keys').hidden,'Search minimizes on Done');$('object-search-clear').click();fit('Search');
 api.world();await wait(350);assert($('worlds-content').textContent.includes('/13 stars'),'World reward progress');assert($('worlds-content').textContent.includes('Best 97%'),'Per-level best');fit('World overview');
 const before=api.profile().stats.rounds;api.startWorld();await wait(200);api.answerWorld();await wait(250);await api.flush();assert(api.profile().stats.rounds===before+1,'Completed world round counted');assert(!api.profile().stats.worldLevels,'Abandoned level not finished');api.abandonWorld();assert($('worlds-content').textContent.includes('Resume'),'World can resume');fit('Resume');
 api.survival();await wait(250);assert($('survival-content').textContent.includes('Runs finished'),'Survival records');fit('Survival');
 await api.quickLobby();await wait(350);fit('Quick lobby');assert(document.querySelector('.lobby-room-box').hidden,'No room header in Quick Game');assert(!$('lobby-ready-btn'),'No Ready button in Quick Game');assert(document.querySelectorAll('#player-list>li').length===4,'Player and three bots');assert(document.querySelector('#player-list>li:last-child').getBoundingClientRect().bottom<=innerHeight,'Three bots fit without scrolling');for(const row of document.querySelectorAll('.bot-row')){const hard=row.querySelector('[data-difficulty="hard"]').getBoundingClientRect(),remove=row.querySelector('.bot-x-btn').getBoundingClientRect(),box=row.getBoundingClientRect();assert(remove.left>=hard.right-1&&Math.abs((remove.top+remove.bottom-hard.top-hard.bottom)/2)<2,'Remove X inline after Hard');assert(remove.width>=43&&remove.height>=43&&remove.right<=box.right,'Large remove target fits in row');assert(row.querySelector('.bot-x-btn').disabled,'Three-bot minimum preserved');}
 await api.lobby();await wait(350);fit('Party lobby');const start=$('host-start-btn').getBoundingClientRect(),back=$('lobby-back-btn').getBoundingClientRect(),rules=$('lobby-rules').getBoundingClientRect(),room=document.querySelector('.lobby-room-box').getBoundingClientRect(),title=$('room-code-display').getBoundingClientRect(),share=$('share-room-btn').getBoundingClientRect(),qr=$('qr-room-btn').getBoundingClientRect();assert(Math.abs(start.top-back.top)<3&&start.right<=back.left,'Start and Back share top row');assert(start.bottom<=rules.top&&rules.bottom<=room.top,'Rules between Start and room code');assert(title.top<share.bottom&&title.bottom>share.top&&(!qr.width||share.right<=qr.left),'Room code, Share and QR share one row '+JSON.stringify({title:{left:title.left,right:title.right,top:title.top,bottom:title.bottom},share:{left:share.left,right:share.right,top:share.top,bottom:share.bottom},qr:{left:qr.left,right:qr.right,top:qr.top,bottom:qr.bottom}}));assert(share.height>=43&&(!qr.width||qr.height>=43),'Share/QR hit areas');assert(!$('lobby-ready-btn')&&!document.querySelector('.ready-badge'),'Ready controls removed');assert(!$('lobby-rules').textContent.includes('ready'),'No readiness count');assert(!$('lobby-edit-settings'),'No Change settings');assert(document.querySelector('#player-list>li:last-child').getBoundingClientRect().bottom<=innerHeight,'Three party players fit without scrolling');
 assert(!$('host-start-btn').disabled,'Host can start without Ready');
 await api.lobby(true);await wait(250);await api.flush();assert(api.profile().stats.gamesPlayed===9&&api.profile().stats.gamesWon===4,'Final accuracy tie break');assert($('final-session-recap').textContent.includes('Winner'),'Recap');
 api.collect();await until(()=>!document.querySelector('[data-continue]').disabled,'Coin base receipt');document.querySelector('[data-continue]').click();await wait(150);assert(window.__fakeDB.read('rooms/TEST/players/me').rewardCollected,'Receipt keeps slot');assert(window.__fakeDB.read('rooms/TEST').phase==='final','Party not ended');assert($('play-again-btn').style.display!=='none','Rematch visible');
 $('play-again-btn').click();await wait(100);assert(window.__fakeDB.read('rooms/TEST').phase==='waiting','Rematch waiting');assert(Object.keys(window.__fakeDB.read('rooms/TEST/players')).length===3,'Roster retained');
 api.settings();await wait(350);document.querySelector('#motion-seg [data-v=reduce]').click();assert(document.documentElement.dataset.motion==='reduce','Motion option');document.querySelector('#text-seg [data-v=large]').click();assert(document.documentElement.dataset.largeText==='true','Larger text');fit('Settings');
 api.join();assert(!$('join-continue-btn'),'No bottom Continue button');const join=$('join-game-title');assert(join.tagName==='BUTTON','Join banner is an accessible button');const codeBox=$('code-input').getBoundingClientRect(),scanBox=$('scan-room-qr-btn').getBoundingClientRect();assert(codeBox.right<=scanBox.left&&Math.abs(codeBox.top-scanBox.top)<2&&scanBox.right<=innerWidth,'Scan QR fits to the right of room code');assert($('code-input').readOnly,'No native code keyboard');$('scan-room-qr-btn').click();assert($('join-status').textContent.includes('Android app'),'Browser scanner fallback');join.click();assert($('join-status').textContent==='Enter a room code.','Top button validates empty code');for(const key of 'TEST')$('code-keyboard').querySelector('[data-key="'+key+'"]').click();join.click();await until(()=>$('name-avatar-screen').classList.contains('active'),'Top Join Game banner advances valid room to name/avatar');
 await document.fonts.ready;assert(document.fonts.check('500 16px Fredoka'),'Local font');
 api.worldList();await wait(250);const decorated=document.querySelectorAll('#worlds-content [data-world-art]');assert(decorated.length>=8,'World cards use their existing reward illustrations');fit('World list');
 api.settings();await wait(200);const range=document.querySelector('#settings-screen input[type=range]');range.value='25';range.dispatchEvent(new Event('input',{bubbles:true}));assert(range.style.getPropertyValue('--range-fill')==='25%','Themed range tracks actual volume');
 await api.unlockDemo();await wait(200);let unlock=$('unlock-spotlight');assert(unlock.open&&unlock.querySelector('img').naturalWidth,'Unlock modal loads its illustration');fit('Unlock');unlock.querySelector('button+button').click();await wait(100);assert(!$('unlock-spotlight')&&!window.__unlockEquipped,'Keep current never equips');
 await api.unlockDemo();$('unlock-spotlight').querySelector('button').click();await wait(150);assert(!$('unlock-spotlight')&&window.__unlockEquipped===1,'Equip commits once and closes the unlock modal');
 $('polish-result').textContent=JSON.stringify({pass:true,width:innerWidth,checks:'Full app/fake database: Stats, custom object keyboard, world reward/resume, abandoned rounds, Survival records, lobby readiness/settings, final receipt/rematch and comfort'});
}catch(e){document.getElementById('polish-result').textContent=JSON.stringify({pass:false,error:String(e),stack:e.stack});}
</script>
`;
if(process.env.UI_DELIGHT_ONLY==='1')checks=String.raw`
<pre id="polish-result" hidden></pre><script type="module">
const wait=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m)};
try{
for(let n=0;n<300&&!window.__polish;n++)await wait(20);const api=window.__polish,$=id=>document.getElementById(id);
for(let n=0;n<300&&api.profile()?.stats?.gamesPlayed!==8;n++)await wait(20);
const fit=label=>assert(document.documentElement.scrollWidth<=innerWidth+1,'No horizontal overflow: '+label);
api.worldList();await wait(300);assert(document.querySelectorAll('#worlds-content [data-world-art]').length>=8,'World cards have reward artwork');fit('World list');
api.settings();await wait(250);const range=document.querySelector('#settings-screen input[type=range]');range.value='25';range.dispatchEvent(new Event('input',{bubbles:true}));assert(range.style.getPropertyValue('--range-fill')==='25%','Range fill follows value');fit('Settings');
await api.unlockDemo();await wait(200);let dialog=$('unlock-spotlight');assert(dialog.open&&dialog.querySelector('img').naturalWidth,'Unlock art loads');assert(dialog.getBoundingClientRect().width<=innerWidth,'Unlock fits phone');dialog.querySelector('button+button').click();await wait(100);assert(!$('unlock-spotlight')&&!window.__unlockEquipped,'Keep current does not equip');
await api.unlockDemo();$('unlock-spotlight').querySelector('button').click();await wait(120);assert(!$('unlock-spotlight')&&window.__unlockEquipped===1,'Equip commits once');
await api.quickLobby();await wait(300);assert(!$('lobby-ready-btn'),'No Ready in solo');assert(document.querySelectorAll('#player-list>li').length===4,'Solo and three bots');fit('Solo lobby');
await api.lobby();await wait(300);assert(!$('lobby-ready-btn')&&!document.querySelector('.ready-badge'),'No Ready controls');assert(!$('lobby-rules').textContent.includes('ready'),'No Ready count');assert(!$('host-start-btn').disabled,'Host starts with sufficient players');fit('Party lobby');
const review=await fetch('/anim/sound-review-data.json').then(r=>r.json());assert(review.rows.length===42,'42 sound review moments');
for(const row of review.rows)for(const event of row.events)assert((await fetch('/'+event.file)).ok,'Current sound exists '+event.file);
const {playSynth}=await import('/anim/sound-review-synth.mjs');for(const name of ['reveal','hs-clink','hs-knock','hs-laugh']){const context=await playSynth(name,.001);await context.close();}
$('polish-result').textContent=JSON.stringify({pass:true,width:innerWidth,checks:'World illustrations, themed volume, modal Keep/Equip, Ready-free lobbies, 42 current audio moments and four exact synths'});
}catch(e){document.getElementById('polish-result').textContent=JSON.stringify({pass:false,error:String(e),stack:e.stack});}
</script>`;
let fixture=source.replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js','/__fake/app.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js','/__fake/db.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js','/__fake/auth.mjs');
fixture=fixture.replace('\n</script>\n</body>',injected+'\n</script>'+checks+'\n</body>');
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');if(url.pathname==='/test'){res.setHeader('Content-Type','text/html');res.end(fixture);return;}if(url.pathname.startsWith('/__fake/')){res.setHeader('Content-Type','text/javascript');res.end(url.pathname.endsWith('app.mjs')?'export const initializeApp=()=>({});':url.pathname.endsWith('db.mjs')?dbStub:authStub);return;}const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}try{res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
server.listen(0,'127.0.0.1',()=>{const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--autoplay-policy=no-user-gesture-required','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'polish-tests-'+process.pid),'about:blank'],{windowsHide:true});let stderr='',started=false,socket;const timer=setTimeout(()=>{child.kill();server.close();process.exitCode=1;},90000);
 child.stderr.on('data',async chunk=>{stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(started||!match)return;started=true;
 try{socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no;});let serial=0;const pending=new Map(),errors=[];
 socket.onmessage=e=>{const r=JSON.parse(e.data);if(r.id){const p=pending.get(r.id);if(p){pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result);}}else if(r.method==='Runtime.exceptionThrown')errors.push(r.params.exceptionDetails.exception?.description||r.params.exceptionDetails.text);};
 const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});fs.mkdirSync(path.join(root,'output','game-polish-tests'),{recursive:true});
 for(const width of [320,390,430]){const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});await call('Runtime.enable',{},sessionId);await call('Emulation.setDeviceMetricsOverride',{width,height:width===320?650:800,deviceScaleFactor:1,mobile:true},sessionId);await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/test'},sessionId);let result;
 for(let n=0;n<800;n++){const r=await call('Runtime.evaluate',{expression:'document.getElementById("polish-result")?.textContent',returnByValue:true},sessionId);if(r.result?.value){result=JSON.parse(r.result.value);break;}await new Promise(r=>setTimeout(r,20));}console.log(result||{error:'No result',exceptions:errors});if(!result?.pass)throw Error(result?.stack||errors.join('\n')||'No browser result');
 for(const page of (process.env.UI_DELIGHT_ONLY==='1'?['worldList','settings','lobby','quickLobby','unlockDemo']:['stats','world','survival','lobby','quickLobby','objects'])){await call('Runtime.evaluate',{expression:page==='lobby'?'window.__polish.lobby()':'window.__polish.'+page+'()',awaitPromise:true},sessionId);await new Promise(r=>setTimeout(r,350));const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(root,'output','game-polish-tests',page+'-'+width+'.png'),Buffer.from(shot.data,'base64'));}
 if(errors.length)throw Error(errors.join('\n'));await call('Target.closeTarget',{targetId});}
 }catch(e){console.error(e);process.exitCode=1;}finally{clearTimeout(timer);socket?.close();child.kill();server.close();}});
});



