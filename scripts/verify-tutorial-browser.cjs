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
 tutorialState:()=>({walletProfileOwner,deviceId,walletAuthReady,hidden:document.hidden,home:homeScreen.classList.contains("active"),pending:gameRewards?.pending,tutorial:myProfile.tutorial,dialogs:[...document.querySelectorAll("dialog[open]")].map(d=>d.id),local:Object.fromEntries(Object.keys(localStorage).filter(k=>k.includes("tutorial")).map(k=>[k,localStorage.getItem(k)]))}),tutorial:()=>tutorialUI.open(),howto:()=>openOverlay(howtoScreen),home:()=>{ALL_SCREEN_ELS.forEach(el=>el.classList.remove("active"));hudEl.classList.remove("active");homeScreen.classList.add("active");tutorialUI.refresh();},otherOwner:()=>{deviceId="other-test-owner";tutorialUI.refresh();},
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
const wait=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m)},until=async(fn,m)=>{for(let n=0;n<350;n++){if(fn())return;await wait(20)}throw Error(m);};
try{
 await until(()=>window.__polish?.profile()?.stats?.gamesPlayed===8,'Bootstrap');
 const api=window.__polish,$=id=>document.getElementById(id),dlg=$('game-tutorial');
 const baseline=JSON.stringify(api.profile()),oldOwner=api.owner();
 api.home();await until(()=>dlg.open,'Home offers tutorial');assert(dlg.textContent.includes('Skip for now'),'Welcome skip');
 dlg.querySelector('[data-exit]').click();await wait(1600);assert(!dlg.open,'Skip suppresses offer');
 assert(window.__fakeDB.read('profiles/'+oldOwner+'/tutorial').status==='skipped','Skip persisted');
 api.howto();$('play-tutorial-btn').click();assert(dlg.open&&dlg.textContent.includes('Try a guess'),'Replay from How to Play');
 const fit=label=>{assert(dlg.scrollWidth<=dlg.clientWidth+1,'Dialog fits: '+label);assert(dlg.getBoundingClientRect().width<=innerWidth,'Phone width');for(const img of dlg.querySelectorAll('img'))assert(img.complete&&img.naturalWidth,'Loaded artwork '+img.src);for(const b of dlg.querySelectorAll('button'))assert(b.scrollWidth<=b.clientWidth+1,'Button text fits '+b.textContent);};
 await document.fonts.ready;await wait(100);fit('guess');
 assert(!dlg.querySelector('input'),'No phone keyboard');assert(dlg.querySelector('[data-next]').disabled,'Empty guess blocked');
 for(const k of ['1','0','.','5','Delete'])dlg.querySelector('[data-key="'+k+'"]').click();assert(dlg.querySelector('output').textContent==='10.','Delete works');
 dlg.querySelector('[data-key="5"]').click();dlg.querySelector('[data-next]').click();assert(dlg.textContent.includes('Double Down'),'Second Chance');assert(dlg.querySelector('[data-next]').disabled,'Select answer first');fit('choices');
 dlg.querySelector('[data-back]').click();assert(dlg.querySelector('output').textContent==='10.5','Back keeps guess');dlg.querySelector('[data-next]').click();
 dlg.querySelector('[data-choice="truth"]').click();dlg.querySelector('[data-next]').click();assert(dlg.textContent.includes('11.6 pencils'),'Actual object ratio');assert(dlg.textContent.includes('Accuracy'),'Accuracy shown');fit('result');
 dlg.querySelector('[data-next]').click();await wait(100);$('tutorial-buffer').click();assert(dlg.textContent.includes('Buffer applied'),'Free power-up demo');assert(dlg.textContent.includes('100%'),'Buffer improves accuracy');fit('buffer');
 dlg.querySelector('[data-next]').click();assert(dlg.querySelectorAll('details').length===7,'Mode guides');for(const d of dlg.querySelectorAll('details'))d.open=true;fit('modes');
 dlg.querySelector('[data-next]').click();await wait(100);fit('finish');dlg.querySelector('[data-next]').click();assert(!dlg.open,'Finish closes');await wait(200);
 const after=api.profile();assert(after.tutorial.status==='completed','Completion saved');const clean=JSON.parse(JSON.stringify(after));delete clean.tutorial;const before=JSON.parse(baseline);delete before.tutorial;assert(JSON.stringify(clean)===JSON.stringify(before),'Coins, stats, inventory and discoveries unchanged');
 api.home();await wait(1500);assert(!dlg.open,'Completed does not offer again');api.howto();$('play-tutorial-btn').click();dlg.dispatchEvent(new Event('cancel',{cancelable:true}));assert(!dlg.open,'Escape skips');
 $('play-tutorial-btn').click();api.home();await wait(100);assert(!dlg.open,'Navigation dismisses');
 api.tutorial();api.otherOwner();assert(!dlg.open,'Account change dismisses');assert(!window.__fakeDB.read('profiles/other-test-owner/tutorial'),'Never writes tutorial status to wrong account');
 $('polish-result').textContent=JSON.stringify({pass:true,width:innerWidth,checks:'Offer, Skip, replay, keypad, Back, Second Chance, real ratio/accuracy, free buffer, mode guides, completion, navigation/account safety, coins/stats unchanged, phone layout'});
}catch(e){document.getElementById('polish-result').textContent=JSON.stringify({pass:false,error:String(e),stack:e.stack,state:window.__polish?.tutorialState()});}
</script>`;
let fixture=source.replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js','/__fake/app.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js','/__fake/db.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js','/__fake/auth.mjs');
fixture=fixture.replace('\n</script>\n</body>',injected+'\n</script>'+checks+'\n</body>');
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');if(url.pathname==='/test'){res.setHeader('Content-Type','text/html');res.end(fixture);return;}if(url.pathname.startsWith('/__fake/')){res.setHeader('Content-Type','text/javascript');res.end(url.pathname.endsWith('app.mjs')?'export const initializeApp=()=>({});':url.pathname.endsWith('db.mjs')?dbStub:authStub);return;}const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}try{res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
server.listen(0,'127.0.0.1',()=>{const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--autoplay-policy=no-user-gesture-required','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'polish-tests-'+process.pid),'about:blank'],{windowsHide:true});let stderr='',started=false,socket;const timer=setTimeout(()=>{child.kill();server.close();process.exitCode=1;},90000);
 child.stderr.on('data',async chunk=>{stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(started||!match)return;started=true;
 try{socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no;});let serial=0;const pending=new Map(),errors=[];
 socket.onmessage=e=>{const r=JSON.parse(e.data);if(r.id){const p=pending.get(r.id);if(p){pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result);}}else if(r.method==='Runtime.exceptionThrown')errors.push(r.params.exceptionDetails.exception?.description||r.params.exceptionDetails.text);};
 const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});fs.mkdirSync(path.join(root,'output','tutorial-tests'),{recursive:true});
 for(const width of [320,390,430]){const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});await call('Runtime.enable',{},sessionId);await call('Emulation.setDeviceMetricsOverride',{width,height:width===320?650:800,deviceScaleFactor:1,mobile:true},sessionId);await call('Page.enable',{},sessionId);await call('Page.addScriptToEvaluateOnNewDocument',{source:'try{localStorage.clear();}catch{}'},sessionId);await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/test'},sessionId);let result;
 for(let n=0;n<800;n++){const r=await call('Runtime.evaluate',{expression:'document.getElementById("polish-result")?.textContent',returnByValue:true},sessionId);if(r.result?.value){result=JSON.parse(r.result.value);break;}await new Promise(r=>setTimeout(r,20));}console.log(result||{error:'No result',exceptions:errors});if(!result?.pass)throw Error(result?.stack||errors.join('\n')||'No browser result');
 for(const page of (process.env.UI_DELIGHT_ONLY==='1'?['worldList','settings','lobby','quickLobby','unlockDemo']:['tutorial'])){await call('Runtime.evaluate',{expression:page==='lobby'?'window.__polish.lobby()':'window.__polish.'+page+'()',awaitPromise:true},sessionId);await new Promise(r=>setTimeout(r,350));const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(root,'output','tutorial-tests',page+'-'+width+'.png'),Buffer.from(shot.data,'base64'));}
 if(errors.length)throw Error(errors.join('\n'));await call('Target.closeTarget',{targetId});}
 }catch(e){console.error(e);process.exitCode=1;}finally{clearTimeout(timer);socket?.close();child.kill();server.close();}});
});
