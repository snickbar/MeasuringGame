// Full actual app with an in-memory Firebase adapter. No live player writes.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/\r\n/g,'\n');
const dbStub=String.raw`
const root={profiles:{},rooms:{AB2C:{phase:'waiting',round:0,settings:{mode:'bluff'},players:{host:{name:'Host',avatar:'av07',isHost:true}}}},'.info':{connected:true,serverTimeOffset:0}},watchers=[];
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
window.__polish={profile:()=>myProfile,
 qrSeed:(mode='classic')=>set(ref(db,'rooms/AB2C'),{phase:'waiting',round:0,settings:{mode},players:{host:{name:'Host',avatar:'av07',isHost:true}}}),
 qrPending:()=>pendingRoomCode,
 qrRecover:()=>recoverQrInvite(),qrSaved:()=>pendingQrInvite.read(),qrClear:()=>pendingQrInvite.clear(),
 qrHomeDrift:()=>{ALL_SCREEN_ELS.forEach(el=>el.classList.remove('active'));homeScreen.classList.add('active');},
 join:()=>showJoinScreen()
};
`;
let checks=String.raw`
<pre id="polish-result" hidden></pre><script type="module">
const wait=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m)},until=async(fn,m)=>{for(let n=0;n<250;n++){if(fn())return;await wait(20)}throw Error(m)};
try{
 await until(()=>window.__polish?.profile()?.stats?.gamesPlayed,'Bootstrap');
 const api=window.__polish,$=id=>document.getElementById(id);
 const bootCheck=sessionStorage.getItem('qr-boot-check');if(bootCheck){const stage=bootCheck==='code'?'name-avatar-screen':'join-screen';await until(() => $(stage).classList.contains('active'),'Cold reload recovers '+bootCheck);assert(!$('home-screen').classList.contains('active'),'Cold reload does not stay at Home');if(bootCheck==='code')assert(api.qrPending()==='AB2C','Cold reload retains room');else assert($('join-status').textContent.includes('interrupted'),'Cold reload offers another scan');api.qrClear();sessionStorage.removeItem('qr-boot-check');}else{for(const mode of ['classic','teamvteam','teamworlds','hlsurvival','highstakes','bluff']){await api.qrSeed(mode);api.join();window.__scannerResolve=null;await wait(50);
 $('scan-room-qr-btn').click();await until(()=>window.__scannerResolve,'Native scanner opens');
 window.__nativeAppEvent('appStateChange',{isActive:false});
 window.__scannerResolve({value:'https://size-em-up.web.app/?join=AB2C'});
 await wait(100);
 assert(!$('name-avatar-screen').classList.contains('active'),'Wait for native foreground before joining');
 api.qrHomeDrift();window.__nativeAppEvent('appStateChange',{isActive:true});document.dispatchEvent(new Event('visibilitychange'));
 await until(()=>$('name-avatar-screen').classList.contains('active'),'Scanned room opens name/avatar');
 assert(!$('home-screen').classList.contains('active')&&!$('join-screen').classList.contains('active'),'Only name/avatar is active');
 assert(api.qrPending()==='AB2C','Correct scanned room retained');
 assert(api.qrSaved()?.code==='AB2C','Pending code retained through setup');
 }
 api.qrClear();api.join();window.__scannerResolve=null;$('code-input').value='OLD2';$('scan-room-qr-btn').click();await until(()=>window.__scannerResolve,'Cancel scanner');window.__scannerResolve({cancelled:true});await wait(80);assert($('join-screen').classList.contains('active')&&$('code-input').value==='OLD2'&&!api.qrSaved(),'Cancelled scan preserves manual entry without redirect');
 window.__scannerResolve=null;$('scan-room-qr-btn').click();await until(()=>window.__scannerResolve,'Invalid scanner');window.__scannerResolve({value:'https://example.com/?join=AB2C'});await wait(80);assert($('join-status').textContent.includes('not a Size Em Up')&&$('join-screen').classList.contains('active'),'Invalid QR stays in Join with a clear message');
 api.qrHomeDrift();localStorage.setItem('size-em-up:pending-room-invite',JSON.stringify({stage:'code',code:'AB2C',at:Date.now()}));await wait(2600);await api.qrRecover();assert($('name-avatar-screen').classList.contains('active')&&api.qrPending()==='AB2C','Reload recovery restores exact scanned room');
 api.qrHomeDrift();localStorage.setItem('size-em-up:pending-room-invite',JSON.stringify({stage:'scanning',code:null,at:Date.now()}));await wait(2600);await api.qrRecover();assert($('join-screen').classList.contains('active')&&$('join-status').textContent.includes('interrupted'),'Lost camera result returns to Join for retry rather than Home');api.qrClear();}
 $('polish-result').textContent=JSON.stringify({pass:true,width:innerWidth,checks:'Native QR result before resume, temporary Home drift, exact room and exclusive join flow'});
}catch(e){document.getElementById('polish-result').textContent=JSON.stringify({pass:false,error:String(e),stack:e.stack,active:[...document.querySelectorAll('.screen.active')].map(el=>el.id)});}
</script>`;
let fixture=source.replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js','/__fake/app.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js','/__fake/db.mjs').replaceAll('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js','/__fake/auth.mjs');
fixture=fixture.replace('\n</script>\n</body>',injected+'\n</script>'+checks+'\n</body>');
fixture=fixture.replace('<head>',`<head><script>
const listeners={};window.__nativeAppEvent=(event,value)=>{for(const fn of listeners[event]||[])fn(value)};
const app={addListener(event,fn){(listeners[event]||(listeners[event]=[])).push(fn);return Promise.resolve({remove(){}})},getLaunchUrl:async()=>({})};
const scanner={scan:()=>new Promise(resolve=>window.__scannerResolve=resolve)};
window.Capacitor={isNativePlatform:()=>true,Plugins:{App:app,RoomQrScanner:scanner},registerPlugin:name=>name==='RoomQrScanner'?scanner:{}};
</script>`);

const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');if(url.pathname==='/test'){res.setHeader('Content-Type','text/html');res.end(fixture);return;}if(url.pathname.startsWith('/__fake/')){res.setHeader('Content-Type','text/javascript');res.end(url.pathname.endsWith('app.mjs')?'export const initializeApp=()=>({});':url.pathname.endsWith('db.mjs')?dbStub:authStub);return;}const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}try{res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
server.listen(0,'127.0.0.1',()=>{const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--autoplay-policy=no-user-gesture-required','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'polish-tests-'+process.pid),'about:blank'],{windowsHide:true});let stderr='',started=false,socket;const timer=setTimeout(()=>{child.kill();server.close();process.exitCode=1;},90000);
 child.stderr.on('data',async chunk=>{stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(started||!match)return;started=true;
 try{socket=new WebSocket(match[1]);await new Promise((yes,no)=>{socket.onopen=yes;socket.onerror=no;});let serial=0;const pending=new Map(),errors=[];
 socket.onmessage=e=>{const r=JSON.parse(e.data);if(r.id){const p=pending.get(r.id);if(p){pending.delete(r.id);r.error?p.no(Error(r.error.message)):p.yes(r.result);}}else if(r.method==='Runtime.exceptionThrown')errors.push(r.params.exceptionDetails.exception?.description||r.params.exceptionDetails.text);};
 const call=(method,params={},sessionId)=>new Promise((yes,no)=>{const id=++serial;pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});fs.mkdirSync(path.join(root,'output','qr-join-tests'),{recursive:true});
 for(const width of [320,390,430]){const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});await call('Runtime.enable',{},sessionId);await call('Emulation.setDeviceMetricsOverride',{width,height:width===320?650:800,deviceScaleFactor:1,mobile:true},sessionId);await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/test'},sessionId);let result;
 for(let n=0;n<800;n++){const r=await call('Runtime.evaluate',{expression:'document.getElementById("polish-result")?.textContent',returnByValue:true},sessionId);if(r.result?.value){result=JSON.parse(r.result.value);break;}await new Promise(r=>setTimeout(r,20));}console.log(result||{error:'No result',exceptions:errors});if(!result?.pass)throw Error(result?.stack||errors.join('\n')||'No browser result');
 for(const recovery of ['code','scanning']){
 await call('Runtime.evaluate',{expression:"localStorage.setItem('size-em-up:pending-room-invite',JSON.stringify({stage:'"+recovery+"',code:'AB2C',at:Date.now()}));sessionStorage.setItem('qr-boot-check','"+recovery+"');"},sessionId);
 await call('Page.reload',{},sessionId);let cold;
 for(let n=0;n<500;n++){const r=await call('Runtime.evaluate',{expression:'document.getElementById("polish-result")?.textContent',returnByValue:true},sessionId);if(r.result?.value){cold=JSON.parse(r.result.value);break;}await new Promise(r=>setTimeout(r,20));}
 if(!cold?.pass)throw Error('Cold reload '+recovery+': '+JSON.stringify(cold));console.log({pass:true,width,recovery});
 }
 for(const page of ['join']){await call('Runtime.evaluate',{expression:page==='lobby'?'window.__polish.lobby()':'window.__polish.'+page+'()',awaitPromise:true},sessionId);await new Promise(r=>setTimeout(r,350));const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(root,'output','qr-join-tests',page+'-'+width+'.png'),Buffer.from(shot.data,'base64'));}
 if(errors.length)throw Error(errors.join('\n'));await call('Target.closeTarget',{targetId});}
 }catch(e){console.error(e);process.exitCode=1;}finally{clearTimeout(timer);socket?.close();child.kill();server.close();}});
});
