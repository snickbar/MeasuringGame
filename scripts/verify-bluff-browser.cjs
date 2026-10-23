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
 bluffPreviewMaker:async()=>{await window.__polish.bluffStart();await new Promise(r=>setTimeout(r,100));window.__polish.bluffInspect();},
 bluffPreviewVote:async()=>{const state=roomState.bluff;await window.__polish.bluffDo(state.maker,'claim',state.options.findIndex(o=>o.kind==='high'));await new Promise(r=>setTimeout(r,100));const old=currentPlayerId;currentPlayerId=state.order.find(id=>id!==state.maker);bluffUI.refresh();currentPlayerId=old;},
 bluffState:()=>roomState.bluff,bluffRoom:()=>roomState,bluffTick:()=>bluffUI.advance(),
 bluffDo:async(actor,action,value)=>runTransaction(ref(db,'rooms/BLUF'),cur=>bluffAction(cur,{gameId:cur.gameId,round:cur.bluff.round,stage:cur.bluff.stage,actor,action,value},nowMs()),{applyLocally:false}),
 bluffInspect:()=>{const old=currentPlayerId;currentPlayerId=roomState.bluff.maker;bluffUI.refresh();currentPlayerId=old;},bluffRestore:()=>bluffUI.refresh(),
 bluffInfo:()=>openBluffInfo(),bluffStats:()=>{statsMode='bluff';showCareerTab('stats');},
 bluffStart:async()=>{currentRoomCode='BLUF';currentPlayerId='a';isHost=true;leavingGame=false;finalRendered=false;
 await set(ref(db,'rooms/BLUF'),{phase:'waiting',round:0,settings:{mode:'bluff',bluffTurns:1,hostTransferMode:'reassign'},players:{a:{name:'Player',avatar:'av07',isHost:true,joinedAt:1,frameIndex:1},b:{name:'Friend',avatar:'av19',joinedAt:2,frameIndex:2},c:{name:'LongPlayerName',avatar:'av06',joinedAt:3,frameIndex:3}}});
 watchRoom('BLUF');await new Promise(r=>setTimeout(r,50));await startBluffGame();},
 bluffPause:()=>togglePause(),

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
const wait=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m)},until=async(fn,m)=>{for(let n=0;n<500;n++){if(fn())return;await wait(20)}throw Error(m);};
try{
 await until(()=>window.__polish?.profile()?.stats?.gamesPlayed===8,'App bootstrap');const api=window.__polish,$=id=>document.getElementById(id),content=$('bluff-content');
 api.bluffInfo();await wait(250);assert(document.querySelectorAll('[data-bluff-turns]').length===3,'Auto/one/two settings');
 assert(document.querySelector('[data-bluff-turns="auto"]').getAttribute('aria-pressed')==='true','Auto default');
 const fit=label=>{assert(content.querySelector('h1').getBoundingClientRect().top>=$('hud-sub-toolbar').getBoundingClientRect().bottom-1,'Banner clears fixed controls');assert(document.documentElement.scrollWidth<=innerWidth+1,'Phone fit: '+label);for(const b of content.querySelectorAll('button'))assert(b.scrollWidth<=b.clientWidth+1,'Button fits '+b.textContent);};
 await api.bluffStart();await until(()=>api.bluffState()?.stage==='make','Game starts');assert($('bluff-screen').classList.contains('active')&&!$('hud').classList.contains('active'),'Exclusive Bluff screen');
 assert(api.bluffState().total===3,'One full cycle');
 const owner=api.owner(),oldGames=api.profile().stats.gamesPlayed;
 for(let round=1;round<=3;round++){
  await until(()=>api.bluffState()?.round===round&&api.bluffState().stage==='make','Maker round '+round);const s=api.bluffState();
  api.bluffInspect();await wait(150);assert(content.querySelectorAll('[data-claim]').length===3,'Maker gets exactly three private labeled choices');fit('Maker');api.bluffRestore();
  if(s.maker!=='a')assert(!content.querySelector('[data-claim]')&&!content.textContent.includes('Only you see'),'Waiting player sees no options');
  const kind=['low','correct','high'][round-1],index=s.options.findIndex(o=>o.kind===kind);
  if(s.maker==='a'){content.querySelector('[data-claim="'+index+'"]').click();assert(content.querySelector('[data-send-claim]').getBoundingClientRect().bottom<=$('bottom-toolbar').getBoundingClientRect().top,'Maker confirm clears bottom toolbar');content.querySelector('[data-send-claim]').click();}else await api.bluffDo(s.maker,'claim',index);
  await until(()=>api.bluffState().stage==='vote','Claim appears');await wait(150);assert(!content.querySelector('[data-claim]'),'Only selected claim visible');assert(content.querySelectorAll('.bl-claim strong').length===1,'Exactly one claim number');fit('Vote');
  await api.bluffPause();await wait(350);assert($('paused-overlay').classList.contains('active'),'Pause overlay');await api.bluffPause();
  const state=api.bluffState(),voters=state.order.filter(id=>id!==state.maker);
  for(const [i,id]of voters.entries()){
   const choice=i===0?kind:(kind==='low'?'high':'low');
   if(id==='a'){content.querySelector('[data-vote="'+choice+'"]').click();assert(content.querySelector('[data-send-vote]').getBoundingClientRect().bottom<=$('bottom-toolbar').getBoundingClientRect().top,'Vote confirm clears bottom toolbar');content.querySelector('[data-send-vote]').click();await wait(80);assert(content.textContent.includes('Vote locked'),'Human vote locks');}
   else await api.bluffDo(id,'vote',choice);
  }
  await until(()=>api.bluffState().stage==='reveal','Automatic reveal after all votes');await wait(100);fit('Reveal');
  assert(content.textContent.includes('The real answer')&&content.querySelectorAll('.bl-vote-results p').length===2,'Answer and every vote revealed');
  assert(api.bluffState().result.points[state.maker]===1,'Maker gets one fooled voter');
  await api.flush();assert(api.profile().stats.gamesPlayed===oldGames,'Round alone is not finished game');
  await until(()=>content.querySelector('[data-next]')&&!content.querySelector('[data-next]').disabled,'Next maker available');content.querySelector('[data-next]').click();
 }
 await until(()=>$('final-screen').classList.contains('active'),'Final results');await api.flush();await wait(200);
 assert(!$('bluff-screen').classList.contains('active'),'No game board below final screen');assert(document.querySelectorAll('#final-list .final-row').length===3,'All final standings');
 assert($('final-session-recap').textContent.includes('vote accuracy'),'Correct classification label');assert(api.profile().stats.gamesPlayed===oldGames+1,'One finished game');
 assert(api.profile().modeStats.bluff.rounds===3,'All rounds once');assert(api.profile().modeStats.bluff.makerTurns===1,'Own maker turn recorded');assert(api.profile().objectFrequency.modes.bluff,'Object frequency recorded');
 assert(api.profile().stats.answeredRounds===undefined,'No classification pollution of measurement accuracy');
 api.bluffStats();await wait(250);assert($('career-content').textContent.includes('Players fooled')&&$('career-content').textContent.includes('Vote accuracy'),'Bluff stats view');

 const B=await import('/anim/bluff.mjs'),{createBluffUI}=await import('/anim/bluff-ui.mjs');
 let fakeNow=1000,localRoom={phase:'bluff',gameId:'bot-test',players:{a:{isHost:true},b:{isBot:true},c:{isBot:true}},settings:{mode:'bluff'}};
 localRoom.bluff=B.dealBluff(B.newBluff(['a','b','c'],1),{unitId:'pencil',targetId:'door',answer:11.6,prompt:'Test'},fakeNow);localRoom.bluff.maker='b';
 const box=document.createElement('div');box.hidden=true;document.body.append(box);
 const ui=createBluffUI({element:box,context:()=>({room:localRoom,me:'a',host:true}),now:()=>fakeNow,
 transact:async(expected,next,host)=>{const result=B.commitBluff(localRoom,expected,next,host);if(result)localRoom=result;return {committed:!!result};},
 act:async action=>{const result=B.bluffAction(localRoom,action,fakeNow);if(result)localRoom=result;return {committed:!!result};},
 question:()=>({unitId:'pencil',targetId:'door',answer:11.6,prompt:'Test'}),object:id=>({name:id,image:'items/'+id+'.webp'}),avatar:()=>'',sound:()=>{throw Error('No offscreen audio');},visible:()=>false});
 fakeNow=10000;await ui.advance();assert(localRoom.bluff.stage==='vote','Bot maker picks automatically');fakeNow=20000;await ui.advance();assert(localRoom.bluff.votes.c,'Bot voter submits');
 const paused=JSON.stringify(localRoom.bluff);localRoom.paused=true;fakeNow=50000;await ui.advance();assert(JSON.stringify(localRoom.bluff)===paused,'Paused host does not advance');localRoom.paused=false;
 await ui.advance();assert(localRoom.bluff.stage==='reveal'&&localRoom.bluff.result.submitted===1,'Deadline reveals, missing vote is excluded from fooled count');
 localRoom.bluff=B.dealBluff(localRoom.bluff,{unitId:'pencil',targetId:'door',answer:11.6,prompt:'Test'},fakeNow);localRoom.bluff.maker='gone';
 await ui.advance();assert(localRoom.bluff.stage==='vote'&&localRoom.bluff.autoClaim,'Departed maker gets automatic no-points claim');
 localRoom.bluff.maker='a';localRoom.bluff.votes={};fakeNow=localRoom.bluff.endsAt+1000;await ui.advance();assert(localRoom.bluff.stage==='reveal','Late host does not get stuck trying expired bot votes');
 localRoom.bluff=B.dealBluff({...localRoom.bluff,round:1},{unitId:'pencil',targetId:'door',answer:11.6,prompt:'Test'},fakeNow);localRoom.bluff.maker='b';fakeNow=localRoom.bluff.endsAt+1000;await ui.advance();assert(localRoom.bluff.stage==='vote'&&localRoom.bluff.autoClaim,'Late bot maker falls back after backgrounding');box.remove();
 $('polish-result').textContent=JSON.stringify({pass:true,width:innerWidth,checks:'Actual app: setup, full 3-player cycle, maker-only three choices, single voter claim, all three claim kinds, tap/lock, pause, simultaneous scores, progress, final/coins, classification stats and phone fit'});
}catch(e){document.getElementById('polish-result').textContent=JSON.stringify({pass:false,error:String(e),stack:e.stack,state:window.__polish?.bluffState(),buttons:[...document.querySelectorAll("#bluff-content button")].map(b=>({text:b.textContent,disabled:b.disabled}))});}
</script>`;
let fixture=source.replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js','/__fake/app.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js','/__fake/db.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js','/__fake/auth.mjs');
fixture=fixture.replace('\n</script>\n</body>',injected+'\n</script>'+checks+'\n</body>');
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');if(url.pathname==='/test'){res.setHeader('Content-Type','text/html');res.end(fixture);return;}if(url.pathname.startsWith('/__fake/')){res.setHeader('Content-Type','text/javascript');res.end(url.pathname.endsWith('app.mjs')?'export const initializeApp=()=>({});':url.pathname.endsWith('db.mjs')?dbStub:authStub);return;}const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}try{res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
server.listen(0,'127.0.0.1',()=>{const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--autoplay-policy=no-user-gesture-required','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'polish-tests-'+process.pid),'about:blank'],{windowsHide:true});let stderr='',started=false,socket;const timer=setTimeout(()=>{child.kill();server.close();process.exitCode=1;},90000);
 child.stderr.on('data',async chunk=>{stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(started||!match)return;started=true;
 try{socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no;});let serial=0;const pending=new Map(),errors=[];
 socket.onmessage=e=>{const r=JSON.parse(e.data);if(r.id){const p=pending.get(r.id);if(p){pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result);}}else if(r.method==='Runtime.exceptionThrown')errors.push(r.params.exceptionDetails.exception?.description||r.params.exceptionDetails.text);};
 const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});fs.mkdirSync(path.join(root,'output','bluff-tests'),{recursive:true});
 for(const width of (process.env.BLUFF_TEST_WIDTH?[Number(process.env.BLUFF_TEST_WIDTH)]:[320,390,430])){const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});await call('Runtime.enable',{},sessionId);await call('Page.enable',{},sessionId);await call('Page.addScriptToEvaluateOnNewDocument',{source:'try{localStorage.clear();}catch{}'},sessionId);await call('Emulation.setDeviceMetricsOverride',{width,height:width===320?650:800,deviceScaleFactor:1,mobile:true},sessionId);await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/test'},sessionId);let result;
 for(let n=0;n<800;n++){const r=await call('Runtime.evaluate',{expression:'document.getElementById("polish-result")?.textContent',returnByValue:true},sessionId);if(r.result?.value){result=JSON.parse(r.result.value);break;}await new Promise(r=>setTimeout(r,20));}console.log(result||{error:'No result',exceptions:errors});if(!result?.pass)throw Error(result?.stack||errors.join('\n')||'No browser result');
 for(const page of (process.env.UI_DELIGHT_ONLY==='1'?['worldList','settings','lobby','quickLobby','unlockDemo']:['bluffInfo','bluffPreviewMaker','bluffPreviewVote'])){await call('Runtime.evaluate',{expression:page==='lobby'?'window.__polish.lobby()':'window.__polish.'+page+'()',awaitPromise:true},sessionId);await new Promise(r=>setTimeout(r,350));const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(root,'output','bluff-tests',page+'-'+width+'.png'),Buffer.from(shot.data,'base64'));}
 if(errors.length)throw Error(errors.join('\n'));await call('Target.closeTarget',{targetId});}
 }catch(e){console.error(e);process.exitCode=1;}finally{clearTimeout(timer);socket?.close();child.kill();server.close();}});
});
