// Phone-layout regression with isolated Firebase/storage; no live player writes.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),vm=require('vm'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/\r\n/g,'\n');
const existing=fs.readFileSync(path.join(root,'scripts/verify-screen-visibility-browser.cjs'),'utf8');
const sandbox={};vm.runInNewContext(existing.slice(existing.indexOf('const dbStub='),existing.indexOf('const injected='))+';globalThis.stubs={dbStub,authStub};',sandbox);
const {dbStub,authStub}=sandbox.stubs;
const injected=String.raw`
window.__layoutReady=()=>myProfile?.stats?.gamesPlayed===8;
window.__finalPreview=async mode=>{
 gameRewards.prepare=async()=>{};
 currentRoomCode='FINALE';currentPlayerId='me';isHost=true;currentName='Player';finalRendered=false;
 const names=['DADDIOOO','PixiePenny','PollyParrot','PawPatch'],avatars=['av19','av07','av06','av20'];
 currentPlayers=Object.fromEntries(['me','p2','p3','p4'].map((id,i)=>[id,{name:names[i],avatar:avatars[i],score:mode==='tie'?25:mode==='zero'?0:mode==='teamvteam'?(i<2?24:16):[25,18,12,8][i],roundsCounted:3,accuracySum:mode==='tie'||mode==='zero'?0:[252,225,183,156][i],accuracyBonus:i===0?10:0,individualPoints:[15,9,10,6][i],team:i<2?'red':'blue',bestGuess:{guess:352,prompt:'How many playing cards long is a moon rocket?',percent:84}}]));
 roomState={phase:'final',gameId:'preview-'+mode,round:3,settings:{mode:mode==='teamvteam'?'teamvteam':'party',solo:mode==='quick',totalRounds:3},players:currentPlayers};
 ALL_SCREEN_ELS.forEach(e=>e.classList.remove('active'));hudSubToolbarEl.classList.remove('active');bottomToolbarEl.classList.add('active');finalScreenEl.classList.add('active');renderFinal();finalHomeBtn.style.display='flex';window.scrollTo(0,0);
 await new Promise(r=>setTimeout(r,120));document.getElementById('ach-toast')?.remove();
};
window.__foxPreview = async ratio => {
 currentRoomCode = null;
 ALL_SCREEN_ELS.forEach(screen => screen.classList.remove('active'));
 worldsScreenEl.classList.add('active');
 const question = dailyQuestionFor({unitId:'ant', targetId:'door'});
 wl = { ...wl, phase:'result', wi:0, level:1, questions:[question, question],
   guesses:[question.answer * .75, question.answer * ratio], runId:'fox-preview-' + ratio };
 renderWorlds();
 const scene = worldsContentEl.querySelector('.wl-rs-scene');
 await Promise.all([...scene.querySelectorAll('img')].map(image => image.decode()));
 return {mood:scene.dataset.mood, reacting:scene.classList.contains('is-reacting')};
};
window.__monkeyPreview = accuracy => {
 currentRoomCode='MONKEYS';currentPlayerId='me';isHost=true;finalRendered=false;
 currentPlayers={
   me:{name:'DADDIOOO',avatar:'av19',roundsCounted:5,accuracySum:5*accuracy,rewardCollected:true},
   p2:{name:'PixiePenny',avatar:'av07',roundsCounted:5,accuracySum:5*accuracy,rewardCollected:true}
 };
 roomState={phase:'final',gameId:'monkey-preview-'+accuracy,round:5,
   settings:{mode:'teamworlds',worldId:WORLDS[0].id,totalRounds:5},players:currentPlayers};
 ALL_SCREEN_ELS.forEach(screen => screen.classList.remove('active'));
 finalScreenEl.classList.add('active');renderFinal();
};
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
   const previewDir=path.join(root,'output','party-results-preview','in-game');fs.mkdirSync(previewDir,{recursive:true});
 for(const width of [390,320]){
 const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
 await call('Runtime.enable',{},sessionId);await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:true},sessionId);
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},sessionId);if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;};
 await call('Page.addScriptToEvaluateOnNewDocument',{source:'localStorage.clear()'},sessionId);
 await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/test'},sessionId);
 for(let i=0;i<250;i++){if(await evaluate('window.__layoutReady?.()'))break;await new Promise(r=>setTimeout(r,30));}
 await evaluate("localStorage.setItem('mg_motion','full');document.documentElement.dataset.motion='full'");
 for(const mode of ['quick','party','teamvteam','tie','zero']){
 await evaluate('window.__finalPreview('+JSON.stringify(mode)+')');
 const during=await evaluate("(()=>{const e=document.querySelector('.pd-slot[data-rank=\"1\"] .pd-who'),a=e.getAnimations()[0];if(!a)throw Error('Winner animation absent');a.pause();a.currentTime=a.effect.getTiming().delay+650;const s=getComputedStyle(e),m=new DOMMatrix(s.transform),r=e.getBoundingClientRect();return {visibleInViewport:r.bottom>62&&r.top<innerHeight,opacity:+s.opacity,y:m.m42,captionHidden:+getComputedStyle(e.parentElement.querySelector('.pd-caption')).opacity===0,captionMoves:!!e.querySelector('.pd-caption'),feet:document.querySelectorAll('.pd-stage .feet').length,border:getComputedStyle(e.querySelector('img.avatar-icon')).borderWidth}})()");
 if(!during.visibleInViewport||during.opacity<.9||during.y> -20||!during.captionHidden||during.captionMoves||during.feet||during.border!=='0px')throw Error('Winner not visibly dropping '+JSON.stringify({mode,width,...during}));
 if(mode==='quick'){
   const jump = await evaluate(`(async () => {
     const robot = document.querySelector('.pd-m-robot'), stage = robot.closest('.pd-stage');
     const air = robot.querySelector('.pd-robot-air'), rest = robot.querySelector('.pd-robot-rest');
     await Promise.all([air.decode(), rest.decode()]);
     stage.classList.add('skip');
     const animations = robot.getAnimations({subtree:true});
     const jump = animations.find(animation => animation.animationName === 'pdRobotJump');
     for (const animation of animations) {
       animation.pause();
       animation.currentTime = animation.effect.getTiming().delay + 500;
     }
     const height = new DOMMatrix(getComputedStyle(robot.querySelector('.pd-robot-body')).transform).m42;
     const result = {oneJump:jump?.effect.getTiming().iterations === 1, height,
       airborne:getComputedStyle(air).opacity === '1' && getComputedStyle(rest).opacity === '0'};
     stage.classList.remove('skip');
     return result;
   })()`);
   if(!jump.oneJump||jump.height>=-5||!jump.airborne)throw Error('Robot jump did not play '+JSON.stringify({width,...jump}));
   if(width===390){
     const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);
     fs.writeFileSync(path.join(previewDir,'quick-jump-390.png'),Buffer.from(shot.data,'base64'));
   }
 }
 const after=await evaluate("(()=>{document.querySelectorAll('.pd-who').forEach(e=>e.getAnimations().forEach(a=>a.finish()));document.querySelector('.pd-skip').click();return {opacity:+getComputedStyle(document.querySelector('.pd-slot[data-rank=\"1\"] .pd-who')).opacity,cards:document.querySelectorAll('#final-list>.final-row').length,hidden:[...document.querySelectorAll('#final-list>.final-row')].some(e=>getComputedStyle(e).display==='none'),captionOpacity:+getComputedStyle(document.querySelector('.pd-caption')).opacity,podiumHeight:document.querySelector('.pd-pod').getBoundingClientRect().height,overflow:document.documentElement.scrollWidth-innerWidth,tied:[...document.querySelectorAll('.pd-slot')].map(e=>e.dataset.rank)}})()");
 if(after.captionOpacity!==1||after.podiumHeight<200||after.opacity!==1||after.hidden||after.cards!==(mode==='teamvteam'?2:4)||after.overflow)throw Error('Finale did not settle '+JSON.stringify({mode,width,...after}));
 if(mode==='quick'&&!await evaluate(`(() => {
   const robot=document.querySelector('.pd-m-robot');
   return !robot.getAnimations({subtree:true}).length &&
     getComputedStyle(robot.querySelector('.pd-robot-rest')).opacity==='1' &&
     getComputedStyle(robot.querySelector('.pd-robot-air')).opacity==='0';
 })()`))throw Error('Skip did not land the robot');
 await evaluate("Promise.all([...document.querySelectorAll('.pd-stage img')].map(i=>i.decode().catch(()=>{})))");await new Promise(r=>setTimeout(r,550));
 const corner=await evaluate("(()=>{const c=document.querySelector('#final-list>.rank-1'),star=c?.querySelector('.drumroll-stars');if(!star)return true;const a=c.getBoundingClientRect(),b=star.getBoundingClientRect();return b.left>a.left+a.width*.7&&b.top<a.top+30})()");if(!corner)throw Error('Winner star overlaps left-side label');
 const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(previewDir,mode+'-'+width+'.png'),Buffer.from(shot.data,'base64'));console.log(JSON.stringify({mode,width,during,after,pass:true}));
 }
 for(const [mood,ratio] of [['up',.99],['same',.75],['down',.4]]){
   const start = await evaluate(`window.__foxPreview(${ratio})`);
   if(start.mood!==mood||start.reacting)throw Error('Fox reacted before the meter '+JSON.stringify(start));
   const end = await evaluate(`(async () => {
     const scene = document.querySelector('.wl-rs-scene');
     const until = performance.now() + 3200;
     while (!scene.classList.contains('is-reacting') && performance.now() < until) {
       await new Promise(resolve => setTimeout(resolve, 25));
     }
     const balloon = scene.querySelector('.wl-rs-balloon');
     const movement = balloon.getAnimations().find(animation => animation.animationName === 'wlBalloonMove');
     if (movement) movement.finish();
     scene.querySelectorAll('img').forEach(image => image.getAnimations().forEach(animation => animation.finish()));
     const pose = [...scene.querySelectorAll('img')].find(image => getComputedStyle(image).opacity === '1');
     const art = pose?.getBoundingClientRect(), bounds = scene.getBoundingClientRect();
     return {reacting:scene.classList.contains('is-reacting'), file:pose?.src.split('/').pop(),
       offset:new DOMMatrix(getComputedStyle(balloon).transform).m42,
       fits:!!art && art.top >= bounds.top && art.bottom <= bounds.bottom};
   })()`);
   if(!end.reacting||end.file!==`worlds-balloon-fox-${mood}.webp`||!end.fits||Math.sign(end.offset)!==({up:-1,same:0,down:1}[mood]))throw Error('Fox reaction failed '+JSON.stringify({width,mood,...end}));
   console.log(JSON.stringify({width,mood,pose:end.file,offset:end.offset,pass:true}));
   if(width===390){
     const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);
     fs.writeFileSync(path.join(previewDir,`worlds-fox-${mood}-390.png`),Buffer.from(shot.data,'base64'));
   }
 }
 await evaluate("window.__monkeyPreview(96)");
 const monkeys=await evaluate(`(async () => {
   const duo=document.querySelector('.tw-fin-monkeys'), contact=duo.querySelector('.tw-fin-monkeys-contact');
   await contact.decode();
   const startsEarly=duo.classList.contains('is-high-fiving');
   const until=performance.now()+2400;
   while (!duo.classList.contains('is-high-fiving') && performance.now()<until) {
     await new Promise(resolve => setTimeout(resolve, 20));
   }
   const earned=document.querySelectorAll('.tw-fin-stars .polish-star-earned').length;
   const animations=duo.getAnimations({subtree:true});
   for (const animation of animations) { animation.pause(); animation.currentTime=380; }
   const box=contact.getBoundingClientRect();
   return {startsEarly,earned,contact:+getComputedStyle(contact).opacity,
     cheer:+getComputedStyle(duo.querySelector('.tw-fin-monkeys-cheer')).opacity,
     fits:box.left>=0 && box.right<=innerWidth && box.top>=0 && box.bottom<=innerHeight};
 })()`);
 if(monkeys.startsEarly||monkeys.earned!==3||monkeys.contact!==1||monkeys.cheer!==0||!monkeys.fits)throw Error('Team Worlds high-five failed '+JSON.stringify({width,...monkeys}));
 if(width===390){
   const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);
   fs.writeFileSync(path.join(previewDir,'teamworlds-high-five-390.png'),Buffer.from(shot.data,'base64'));
 }
 if(!await evaluate(`(() => {
   const duo=document.querySelector('.tw-fin-monkeys');
   duo.getAnimations({subtree:true}).forEach(animation => animation.finish());
   return getComputedStyle(duo.querySelector('.tw-fin-monkeys-cheer')).opacity==='1' &&
     getComputedStyle(duo.querySelector('.tw-fin-monkeys-contact')).opacity==='0';
 })()`))throw Error('Team Worlds monkeys did not settle');
 await evaluate("window.__monkeyPreview(50)");
 if(await evaluate("!!document.querySelector('.tw-fin-monkeys-contact')"))throw Error('Zero stars loaded the high-five');
 await evaluate("localStorage.setItem('mg_motion','reduce');document.documentElement.dataset.motion='reduce';window.__monkeyPreview(97)");
 if(!await evaluate(`(() => {
   const duo=document.querySelector('.tw-fin-monkeys');
   return !duo.querySelector('.tw-fin-monkeys-contact') && !duo.getAnimations({subtree:true}).length;
 })()`))throw Error('Team Worlds high-five ignored reduced motion');
 console.log(JSON.stringify({width,monkeys,pass:true}));
 await evaluate("window.__finalPreview('quick')");
 const reduced=await evaluate("(()=>{const e=document.querySelector('.pd-slot[data-rank=\"1\"] .pd-who');return {opacity:+getComputedStyle(e).opacity,animations:e.getAnimations().length,waiting:document.getElementById('final-list').classList.contains('pd-waiting')}})()");
 if(reduced.opacity!==1||reduced.animations||reduced.waiting)throw Error('Reduced motion failed '+JSON.stringify(reduced));console.log(JSON.stringify({width,reduced,pass:true}));
 await call('Target.closeTarget',{targetId});
 }

  }catch(e){console.error(e);process.exitCode=1}finally{clearTimeout(timer);socket?.close();child.kill();server.close();}
 });
});
