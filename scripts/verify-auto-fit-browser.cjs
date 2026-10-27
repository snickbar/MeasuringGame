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
 hsView:(n,bet)=>{ALL_SCREEN_ELS.forEach(el=>el.classList.remove('active'));currentRoomCode='VIEW';currentPlayerId='me';isHost=true;const ids=Array.from({length:n},(_,i)=>i?'p'+i:'me');currentPlayers=Object.fromEntries(ids.map((id,i)=>[id,{name:i?'Player '+i:'My player',avatar:['av07','av19','av06','av20'][i%4],isHost:i===0,isBot:i>0,connected:true}]));let hs=HS.hsNewGame(ids);const q=dailyQuestionFor({unitId:'ant',targetId:'door'}),made=HS.hsMakeOptions(q.answer);hs=HS.hsStartRound(hs,{...made,now:nowMs()});if(bet)hs=HS.hsBeginBetting(hs,Object.fromEntries(ids.map(id=>[id,0])),nowMs());roomState={phase:'hs',gameId:'view',settings:{mode:'highstakes'},players:currentPlayers,hs,hsQ:q,hsPicks:bet?Object.fromEntries(ids.map(id=>[id,0])):{}};hsScreenEl.classList.add('active');document.getElementById('install-banner').classList.remove('active');renderHighStakes(roomState);window.scrollTo(0,0);},
 shop:()=>openGachaScreen('coins'),party:()=>openPartyHub(),collect:()=>gameRewards.open(),settings:()=>openOverlay(settingsScreen),join:()=>{ALL_SCREEN_ELS.forEach(el=>el.classList.remove('active'));showJoinScreen();}
};
`;
const checks=String.raw`<pre id="polish-result" hidden></pre><script type="module">for(let i=0;i<300&&!window.__polish;i++)await new Promise(r=>setTimeout(r,20));try{if(!window.__polish)throw Error('bootstrap');for(const mode of ['hsPick','hsBet']){window.__polish[mode]();if(document.documentElement.scrollWidth>innerWidth+1)throw Error('horizontal overflow '+mode);}document.getElementById('polish-result').textContent=JSON.stringify({pass:true,width:innerWidth,checks:'Game loaded; checking button text and icon bounds'});}catch(e){document.getElementById('polish-result').textContent=JSON.stringify({pass:false,error:String(e),stack:e.stack});}</script>`;
let fixture=source.replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js','/__fake/app.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js','/__fake/db.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js','/__fake/auth.mjs');
fixture=fixture.replace('\n</script>\n</body>',injected+'\n</script>'+checks+'\n</body>');
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');if(url.pathname==='/test'){res.setHeader('Content-Type','text/html');res.end(fixture);return;}if(url.pathname.startsWith('/__fake/')){res.setHeader('Content-Type','text/javascript');res.end(url.pathname.endsWith('app.mjs')?'export const initializeApp=()=>({});':url.pathname.endsWith('db.mjs')?dbStub:authStub);return;}const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}try{res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
server.listen(0,'127.0.0.1',()=>{const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'polish-tests-'+process.pid),'about:blank'],{windowsHide:true});let stderr='',started=false,socket;const timer=setTimeout(()=>{child.kill();server.close();process.exitCode=1;},180000);
 child.stderr.on('data',async chunk=>{stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(started||!match)return;started=true;
 try{socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no;});let serial=0;const pending=new Map(),errors=[];
 socket.onmessage=e=>{const r=JSON.parse(e.data);if(r.id){const p=pending.get(r.id);if(p){pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result);}}else if(r.method==='Runtime.exceptionThrown')errors.push(r.params.exceptionDetails.exception?.description||r.params.exceptionDetails.text);};
 const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});fs.mkdirSync(path.join(root,'output','auto-fit-tests'),{recursive:true});
 for(const width of (process.env.AUTOFIT_WIDTHS||'280,320,360,390,430,640').split(',').map(Number)){const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});await call('Runtime.enable',{},sessionId);await call('Emulation.setDeviceMetricsOverride',{width,height:width>=600?360:width===320?650:800,deviceScaleFactor:1,mobile:true},sessionId);await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/test'},sessionId);let result;
 for(let n=0;n<800;n++){const r=await call('Runtime.evaluate',{expression:'document.getElementById("polish-result")?.textContent',returnByValue:true},sessionId);if(r.result?.value){result=JSON.parse(r.result.value);break;}await new Promise(r=>setTimeout(r,20));}console.log(result||{error:'No result',exceptions:errors});if(!result?.pass)throw Error(result?.stack||errors.join('\n')||'No browser result');
 for(const page of (process.env.AUTOFIT_PAGES||'hsPick,hsBet,stats,world,quickLobby,settings,join,reward,shop,party').split(',')){await call('Runtime.evaluate',{expression:page==='lobby'?'window.__polish.lobby()':'window.__polish.'+page+'()',awaitPromise:true},sessionId);await new Promise(r=>setTimeout(r,page==='worldResult'?2200:1100));const checks=await call('Runtime.evaluate',{expression: String.raw`(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms));const failures=[];if(!document.getElementById('fit-system-scaling')){const style=document.createElement('style');style.id='fit-system-scaling';style.textContent='html[data-large-text=true] button{font-size:150%!important}';document.head.append(style);}
 for(const large of ['false','true']){
 document.documentElement.dataset.largeText=large;
 document.querySelectorAll('button[data-autofit-stress]').forEach(b=>b.remove());
 const stress=document.createElement('button');stress.dataset.autofitStress='';stress.style.cssText='display:flex;align-items:center;gap:8px;width:130px;height:48px;padding:8px;border:2px solid brown;font:700 24px Fredoka;';stress.innerHTML='<img src="/icons/coin-v2.png" style="width:28px;height:28px"><span>Collect all your bonus coins</span>';document.querySelector('.screen.active')?.append(stress);
 await wait(650);
 if(Math.abs(stress.getBoundingClientRect().height-48)>1)failures.push({kind:'button height changed',height:stress.getBoundingClientRect().height});
 for(const button of document.querySelectorAll('button')){
 if(!button.clientWidth||!button.getClientRects().length)continue;
 const b=button.getBoundingClientRect();
 if(b.right>innerWidth+2||b.left< -2)failures.push({kind:'button outside screen',id:button.id,text:button.textContent.slice(0,45)});
 const walk=document.createTreeWalker(button,NodeFilter.SHOW_TEXT);while(walk.nextNode()){
 const node=walk.currentNode;if(!node.nodeValue.trim()||node.parentElement.closest('svg,[hidden]'))continue;
 const range=document.createRange();range.selectNodeContents(node);
 for(const r of range.getClientRects())if(r.width&&(r.left<b.left-2||r.right>b.right+2||r.top<b.top-2||r.bottom>b.bottom+2))failures.push({kind:'text outside button',id:button.id,text:node.nodeValue.trim().slice(0,45),large,button:[b.width,b.height],textBounds:[r.left-b.left,r.right-b.right,r.top-b.top,r.bottom-b.bottom]});}
 for(const image of button.querySelectorAll('img')){const r=image.getBoundingClientRect();if(r.width&&(r.left<b.left-2||r.right>b.right+2||r.top<b.top-2||r.bottom>b.bottom+2))failures.push({kind:'icon outside button',id:button.id,src:image.src});}
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
 if(errors.length)throw Error(errors.join('\n'));console.log('PASS: '+width+'px, normal/large text, rich labels and icon alignment');await call('Target.closeTarget',{targetId});}
 }catch(e){console.error(e);process.exitCode=1;}finally{clearTimeout(timer);socket?.close();child.kill();server.close();}});
});



