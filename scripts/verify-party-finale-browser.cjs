// Phone-layout regression with isolated Firebase/storage; no live player writes.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),vm=require('vm'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/\r\n/g,'\n');
const existing=fs.readFileSync(path.join(root,'scripts/verify-screen-visibility-browser.cjs'),'utf8');
const sandbox={};vm.runInNewContext(existing.slice(existing.indexOf('const dbStub='),existing.indexOf('const injected='))+';globalThis.stubs={dbStub,authStub};',sandbox);
const {dbStub,authStub}=sandbox.stubs;
const injected=String.raw`
window.__layoutReady=()=>myProfile?.stats?.gamesPlayed===8;
window.__finalPreview=async (mode,teamScores=[24,16],count=4)=>{
 gameRewards.prepare=async()=>{};
 currentRoomCode='FINALE';currentPlayerId='me';isHost=true;currentName='Player';finalRendered=false;
 const names=['DADDIOOO','PixiePenny','PollyParrot','PawPatch'],avatars=['av19','av07','av06','av20'];
 currentPlayers=Object.fromEntries(['me','p2','p3','p4'].map((id,i)=>[id,{name:names[i],avatar:avatars[i],score:mode==='tie'?25:mode==='zero'?0:mode==='teamvteam'?teamScores[i<2?0:1]:[25,18,12,8][i],roundsCounted:3,accuracySum:mode==='tie'||mode==='zero'?0:[252,225,183,156][i],accuracyBonus:i===0?10:0,individualPoints:[15,9,10,6][i],team:i<2?'red':'blue',bestGuess:{guess:352,prompt:'How many playing cards long is a moon rocket?',percent:84}}]));
 for(let i=5;i<=count;i++)currentPlayers['bot'+i]={name:'Guest '+i,avatar:'av05',score:10-i,isBot:true};
 roomState={phase:'final',gameId:'preview-'+mode+'-'+teamScores.join('-'),round:3,settings:{mode:mode==='teamvteam'?'teamvteam':'party',solo:mode==='quick',totalRounds:3},players:currentPlayers};
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
const setupMonkeyRoom = accuracy => {
 currentRoomCode='MONKEYS';currentPlayerId='me';isHost=true;finalRendered=false;
 currentPlayers={
   me:{name:'DADDIOOO',avatar:'av19',roundsCounted:5,accuracySum:5*accuracy,rewardCollected:true},
   p2:{name:'PixiePenny',avatar:'av07',roundsCounted:5,accuracySum:5*accuracy,rewardCollected:true}
 };
 roomState={phase:'final',gameId:'monkey-preview-'+accuracy,round:5,
   settings:{mode:'teamworlds',worldId:WORLDS[0].id,totalRounds:5},players:currentPlayers};
 ALL_SCREEN_ELS.forEach(screen => screen.classList.remove('active'));
};
const withoutCareerSave = render => {
 const save=careerLedger.save;
 careerLedger.save=()=>{};
 try { render(); } finally { careerLedger.save=save; }
};
window.__monkeyPreview = accuracy => {
 setupMonkeyRoom(accuracy);
 withoutCareerSave(()=>{applyPhase(roomState);renderFinal();});
 const session=gameRewardKey(currentRoomCode,roomState);
 myProfile.seenObjects={...myProfile.seenObjects,ant:true,door:true};
 myProfile.objectDiscoveries={...myProfile.objectDiscoveries,ant:{session},door:{session}};
 window.scrollTo(0,0);discoveryUI.refresh();
};
window.__monkeyRoundPreview = accuracy => {
 setupMonkeyRoom(80);
 const question=dailyQuestionFor({unitId:'ant',targetId:'door'});
 for (const player of Object.values(currentPlayers)) {
   player.roundsCounted=2;
   player.accuracySum=80+accuracy;
 }
 roomState={...roomState,phase:'summary',gameId:'team-round-'+accuracy,round:2,currentQuestion:question,
   lastRoundAccuracy:accuracy,revealOrder:Object.entries(currentPlayers).map(([playerId,player])=>({
     playerId,name:player.name,guess:question.answer,accuracyPercent:accuracy
   }))};
 withoutCareerSave(()=>{applyPhase(roomState);renderSummary(roomState);});
};
window.__classicBotLobby = async () => {
 const settings={...DEFAULT_SETTINGS(),showTutorial:false};
 const room={phase:'waiting',round:0,settings};
 await set(ref(db,'rooms/BOTS'),room);
 await joinRoomAsPlayer('BOTS','Player',true,room);
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
 await call('Emulation.setDeviceMetricsOverride',{width,height:width===320?650:780,deviceScaleFactor:1,mobile:true},sessionId);
 await evaluate("window.__finalPreview('party',undefined,10)");
 const dense=await evaluate(`(async () => {
   const ant=document.querySelector('.pd-m-ant'),flag=ant.querySelector('.pd-ant-flag');
   await flag.decode();
   const early=getComputedStyle(ant).opacity==='1'&&getComputedStyle(flag).opacity==='1';
   const podium=document.querySelector('.pd-pod'),rankings=document.querySelector('.pd-list');
   const finish=document.getElementById('final-home-btn');
   document.querySelector('.pd-skip').click();
   await new Promise(resolve=>setTimeout(resolve,230));
   return {early,rows:rankings.children.length,
     podiumFirst:podium.getBoundingClientRect().bottom<=rankings.getBoundingClientRect().top,
     antClear:ant.getBoundingClientRect().bottom<finish.getBoundingClientRect().top};
 })()`);
 if(!dense.early||dense.rows!==7||!dense.podiumFirst||!dense.antClear)throw Error('Ten-player podium layout failed '+JSON.stringify({width,...dense}));
 console.log(JSON.stringify({width,dense,pass:true}));
 if(width===390){
   const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);
   fs.writeFileSync(path.join(previewDir,'classic-party-ten-390.png'),Buffer.from(shot.data,'base64'));
 }
 await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:true},sessionId);
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
 if(mode==='party'){
   const march=await evaluate(`(async () => {
     const ant=document.querySelector('.pd-m-ant');
     const frames=[...ant.querySelectorAll('img')];
     await Promise.all(frames.map(img=>img.decode()));
     const stage=ant.closest('.pd-stage');
     stage.classList.add('skip');
     const animations=ant.getAnimations({subtree:true});
     const march=animations.find(animation=>animation.animationName==='pdAntMarch');
     const start=march.effect.getTiming().delay;
     const sample=time=>{
       for(const animation of animations){
         animation.pause();
         animation.currentTime=start+time;
       }
       const box=ant.getBoundingClientRect();
       return {pose:frames.map(frame=>getComputedStyle(frame).opacity).join(''),left:box.left,
         fits:box.left>=0&&box.right<=innerWidth&&box.bottom<=innerHeight,
         confetti:[...ant.querySelectorAll('.pd-ant-confetti i')].some(piece=>+getComputedStyle(piece).opacity>0)};
     };
     const waiting=sample(-50),first=sample(200),second=sample(500),settled=sample(1500),toss=sample(950);
     const podium=ant.closest('.pd-pod').getBoundingClientRect();
     const winnerLeft=stage.querySelector('.pd-seat-1').getBoundingClientRect().left;
     const antCenter=ant.getBoundingClientRect().left+ant.getBoundingClientRect().width/2;
     const nearFirst=Math.abs(antCenter-winnerLeft)<podium.width*.05;
     return {waiting,first,second,toss,settled,nearFirst,once:march.effect.getTiming().iterations===1};
   })()`);
   if(!march.once||!march.nearFirst||march.waiting.pose!=='1000'||march.first.pose!=='0100'||march.second.pose!=='0010'||
     march.toss.pose!=='0001'||march.settled.pose!=='0001'||!march.toss.confetti||
     [march.waiting,march.first,march.second,march.settled].some(frame=>frame.confetti)||
     ![march.first,march.second,march.toss].every(frame=>frame.fits)||
     !(march.first.left<march.second.left&&march.second.left<march.toss.left)){
     throw Error('Ant did not march and toss confetti '+JSON.stringify({width,...march}));
   }
   if(width===390){
     const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);
     fs.writeFileSync(path.join(previewDir,'classic-ant-confetti-390.png'),Buffer.from(shot.data,'base64'));
   }
   await evaluate("document.querySelector('.pd-stage').classList.remove('skip')");
 }
 const after=await evaluate("(()=>{document.querySelectorAll('.pd-who').forEach(e=>e.getAnimations().forEach(a=>a.finish()));document.querySelector('.pd-skip').click();return {opacity:+getComputedStyle(document.querySelector('.pd-slot[data-rank=\"1\"] .pd-who')).opacity,cards:document.querySelectorAll('#final-list>.final-row').length,hidden:[...document.querySelectorAll('#final-list>.final-row')].some(e=>getComputedStyle(e).display==='none'),captionOpacity:+getComputedStyle(document.querySelector('.pd-caption')).opacity,podiumHeight:document.querySelector('.pd-pod').getBoundingClientRect().height,overflow:document.documentElement.scrollWidth-innerWidth,tied:[...document.querySelectorAll('.pd-slot')].map(e=>e.dataset.rank)}})()");
 if(after.captionOpacity!==1||after.podiumHeight<200||after.opacity!==1||after.hidden||after.cards!==(mode==='teamvteam'?2:4)||after.overflow)throw Error('Finale did not settle '+JSON.stringify({mode,width,...after}));
 if(mode==='quick'&&!await evaluate(`(() => {
   const robot=document.querySelector('.pd-m-robot');
   return !robot.getAnimations({subtree:true}).length &&
     getComputedStyle(robot.querySelector('.pd-robot-rest')).opacity==='1' &&
     getComputedStyle(robot.querySelector('.pd-robot-air')).opacity==='0';
 })()`))throw Error('Skip did not land the robot');
 if(mode==='party'&&!await evaluate(`(() => {
   const ant=document.querySelector('.pd-m-ant');
   return !ant.getAnimations({subtree:true}).length&&getComputedStyle(ant.querySelector('.pd-ant-flag')).opacity==='1'&&
     [...ant.querySelectorAll('.pd-ant-step,.pd-ant-toss,.pd-ant-confetti i')].every(frame=>getComputedStyle(frame).opacity==='0');
 })()`))throw Error('Skip did not show the ant with the flag up');
 await evaluate("Promise.all([...document.querySelectorAll('.pd-stage img')].map(i=>i.decode().catch(()=>{})))");await new Promise(r=>setTimeout(r,550));
 const corner=await evaluate("(()=>{const c=document.querySelector('#final-list>.rank-1'),star=c?.querySelector('.drumroll-stars');if(!star)return true;const a=c.getBoundingClientRect(),b=star.getBoundingClientRect();return b.left>a.left+a.width*.7&&b.top<a.top+30})()");if(!corner)throw Error('Winner star overlaps left-side label');
 const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(previewDir,mode+'-'+width+'.png'),Buffer.from(shot.data,'base64'));console.log(JSON.stringify({mode,width,during,after,pass:true}));
 }
 for(const [scores,expected] of [[[24,16],['cheer','clap']],[[16,24],['clap','cheer']],[[24,24],['cheer','cheer']]]){
   await evaluate(`window.__finalPreview('teamvteam',${JSON.stringify(scores)})`);
   const reactions=await evaluate(`(async () => {
     const mascots=[...document.querySelectorAll('.pd-mascot[data-team-reaction]')];
     await Promise.all(mascots.flatMap(mascot => mascot.matches('img') ? [mascot] : [...mascot.querySelectorAll('img')]).map(img => img.decode()));
     const reactions=mascots.map(mascot => ({
       pose:mascot.dataset.teamReaction, animation:getComputedStyle(mascot).animationName
     }));
     const clap=mascots.find(mascot => mascot.dataset.teamReaction==='clap');
     const frames=clap ? [clap.querySelector('.pd-team-clap-open'),clap.querySelector('.pd-team-clap-contact')] : [];
     const sampleClap = time => frames.map(frame => {
       const animation=frame.getAnimations()[0];
       animation.pause();
       animation.currentTime=animation.effect.getTiming().delay+time;
       return getComputedStyle(frame).opacity;
     }).join('');
     const clapping=!clap || (sampleClap(60)==='10' && sampleClap(200)==='01');
     document.querySelector('.pd-skip').click();
     return {reactions,clapping,settled:mascots.every(mascot =>
       getComputedStyle(mascot).opacity==='1' && !mascot.getAnimations({subtree:true}).length)};
   })()`);
   if(!reactions.clapping||!reactions.settled||reactions.reactions.length!==expected.length||reactions.reactions.some(({pose,animation},i)=>
     pose!==expected[i]||!animation.includes(pose==='cheer'?'pdTeamCheer':'pdTeamClap'))){
     throw Error('Wrong Team vs Team mascot reaction '+JSON.stringify({width,scores,...reactions}));
   }
   console.log(JSON.stringify({width,scores,mascots:expected,pass:true}));
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
 await call('Emulation.setDeviceMetricsOverride',{width,height:width===320?680:820,deviceScaleFactor:1,mobile:true},sessionId);
 for(const [accuracy,mood] of [[96,'up'],[80,'same'],[48,'down']]){
   await evaluate(`window.__monkeyRoundPreview(${accuracy})`);
   const round=await evaluate(`(async () => {
     const scene=document.querySelector('#summary-list .tw-space'), flight=scene.querySelector('.tw-space-flight');
     const initial=scene.classList.contains('is-reacting') || !scene.querySelector('.tw-space-base').src.endsWith('-calm.png');
     const base=scene.querySelector('.tw-space-base'), pose=scene.querySelector('.tw-space-reaction');
     await Promise.all([...scene.querySelectorAll('img')].map(img=>img.decode()));
     const until=performance.now()+2000;
     while(!scene.classList.contains('is-reacting')&&performance.now()<until) await new Promise(r=>setTimeout(r,20));
     await new Promise(r=>setTimeout(r,420));
     const flightMotion=flight.getAnimations().find(a=>a.animationName==='twSpaceTravel');
     if(flightMotion){flightMotion.pause();flightMotion.currentTime=1050;}
     const rect=scene.getBoundingClientRect(), next=document.getElementById('next-round-btn').getBoundingClientRect();
     const y=new DOMMatrix(getComputedStyle(flight).transform).m42;
     return {mood:scene.dataset.mood, initial, started:scene.classList.contains('is-reacting'), y,
       pose:pose?.src.split('-').at(-1) || 'calm.png', opacity:+getComputedStyle(pose||base).opacity,
       twinkle:getComputedStyle(scene.querySelector('.tw-space-stars'),'::before').animationName,
       fits:rect.left>=0&&rect.right<=innerWidth&&rect.height>=100&&rect.bottom<=next.top+1&&next.bottom<=innerHeight,
       bounds:[rect.left,rect.right,rect.top,rect.bottom,next.top,next.bottom,innerWidth,innerHeight]};
   })()`);
   const expected=mood==='up'?'happy.png':mood==='down'?'sad.png':'calm.png';
   if(width===390&&mood==='up'){
     const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);
     fs.writeFileSync(path.join(previewDir,'teamworlds-space-round-390.png'),Buffer.from(shot.data,'base64'));
   }
   if(round.mood!==mood||round.initial||!round.started||Math.sign(round.y)!==({up:-1,same:0,down:1})[mood]||
      round.pose!==expected||round.opacity!==1||round.twinkle!=='twSpaceTwinkle'||!round.fits)
     throw Error('Team Worlds round scene failed '+JSON.stringify({width,...round}));
 }
 await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:true},sessionId);
 for(const [accuracy,mood] of [[96,'up'],[50,'down']]){
   await evaluate(`window.__monkeyPreview(${accuracy})`);
   const monkeys=await evaluate(`(async () => {
     const scene=document.querySelector('.tw-space--final'), pose=scene.querySelector('.tw-space-reaction');
     const startsEarly=scene.classList.contains('is-reacting');
     await pose.decode();
     const until=performance.now()+2500;
     while(!scene.classList.contains('is-reacting')&&performance.now()<until) await new Promise(r=>setTimeout(r,20));
     await new Promise(r=>setTimeout(r,420));
     const [left,center,right]=document.querySelector('.tw-fin-accuracy').children;
     const [l,c,r]=[left,center,right].map(el=>el.getBoundingClientRect());
     const stars=document.querySelector('.tw-fin-stars').getBoundingClientRect();
     const box=pose.getBoundingClientRect(), stage=scene.getBoundingClientRect();
     const discoveries=scene.nextElementSibling;
     return {startsEarly,mood:scene.dataset.mood,reacting:scene.classList.contains('is-reacting'),
       score:center.querySelector('.tw-fin-pct').textContent,
       earned:document.querySelectorAll('.tw-fin-stars .polish-star-earned').length,
       pose:pose.src.split('-').at(-1),opacity:+getComputedStyle(pose).opacity,
       layout:!!left.querySelector('.avatar')&&!!right.querySelector('.avatar')&&l.right<=c.left&&c.right<=r.left&&
         stars.bottom<=c.top&&c.bottom<stage.top&&discoveries?.matches('.session-discoveries')&&
         discoveries.getBoundingClientRect().top>=stage.bottom&&!!discoveries.querySelector('[data-id=ant]'),
       fits:box.left>=stage.left&&box.right<=stage.right&&box.top>=stage.top&&box.bottom<=stage.bottom,
       bounds:[l.right,c.left,c.right,r.left,stars.bottom,c.top,c.bottom,stage.top,stage.bottom,discoveries?.getBoundingClientRect().top],
       discoveryClass:discoveries?.className};
   })()`);
   if(monkeys.startsEarly||!monkeys.reacting||monkeys.mood!==mood||monkeys.score!==accuracy+'%'||
      monkeys.earned!==(mood==='up'?3:0)||monkeys.pose!==(mood==='up'?'happy.png':'sad.png')||
      monkeys.opacity!==1||!monkeys.layout||!monkeys.fits)
     throw Error('Team Worlds final scene failed '+JSON.stringify({width,...monkeys}));
   if(width===390&&mood==='up'){
     const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);
     fs.writeFileSync(path.join(previewDir,'teamworlds-space-final-390.png'),Buffer.from(shot.data,'base64'));
   }
 }
 await evaluate("localStorage.setItem('mg_motion','reduce');document.documentElement.dataset.motion='reduce';window.__monkeyPreview(97)");
 if(!await evaluate(`(() => {
   const scene=document.querySelector('.tw-space--final');
   return scene.querySelector('.tw-space-base').src.endsWith('-happy.png') &&
     !scene.querySelector('.tw-space-reaction') && !scene.getAnimations({subtree:true}).length;
 })()`))throw Error('Team Worlds space scene ignored reduced motion');
 console.log(JSON.stringify({width,teamWorldsSpace:true,pass:true}));
 await evaluate("window.__finalPreview('teamvteam')");
 if(!await evaluate(`(() => {
   const mascots=[...document.querySelectorAll('[data-team-reaction]')];
   return mascots.length===2 && mascots.every(mascot => mascot.matches('img') &&
     getComputedStyle(mascot).opacity==='1' && !mascot.getAnimations().length);
 })()`))throw Error('Team vs Team reactions ignored reduced motion');
 await evaluate("window.__finalPreview('party')");
 if(!await evaluate(`(() => {
   const ant=document.querySelector('img.pd-m-ant');
   return ant?.src.endsWith('classic-ant-flag.png')&&!ant.getAnimations().length;
 })()`))throw Error('Ant did not show the static flag pose with reduced motion');
 await evaluate("window.__finalPreview('quick')");
 const reduced=await evaluate("(()=>{const e=document.querySelector('.pd-slot[data-rank=\"1\"] .pd-who');return {opacity:+getComputedStyle(e).opacity,animations:e.getAnimations().length,waiting:document.getElementById('final-list').classList.contains('pd-waiting')}})()");
 if(reduced.opacity!==1||reduced.animations||reduced.waiting)throw Error('Reduced motion failed '+JSON.stringify(reduced));console.log(JSON.stringify({width,reduced,pass:true}));
 if(width===390){
   const classic=await evaluate(`(async () => {
     const waitFor=async (condition,message,timeout=12000)=>{
       const deadline=performance.now()+timeout;
       while(!condition()&&performance.now()<deadline)await new Promise(resolve=>setTimeout(resolve,25));
       if(!condition())throw Error(message);
     };
     const room=()=>window.__fakeDB.read('rooms/BOTS');
     const botIds=()=>Object.keys(room().players).filter(id=>room().players[id].isBot);
     const start=document.getElementById('host-start-btn');
     const add=document.getElementById('solo-add-bot-btn');
     const confirm=document.getElementById('exit-confirm-yes-btn');
     await window.__classicBotLobby();
     await waitFor(()=>document.getElementById('lobby-screen').classList.contains('active'),'Classic lobby opened');
     if(!start.disabled)throw Error('Classic Party started without an opponent');
     add.click();
     await waitFor(()=>botIds().length===1&&!start.disabled,'One bot enables Classic Party Start');
     start.click();
     document.querySelector('.bot-x-btn').click();
     await waitFor(()=>botIds().length===0&&start.disabled,'Removing the last bot disables Classic Party Start');
     confirm.click();
     await new Promise(resolve=>setTimeout(resolve,100));
     if(room().phase!=='waiting')throw Error('Stale confirmation started without an opponent');
     for(let n=1;n<=2;n++){
       add.click();
       await waitFor(()=>botIds().length===n,'Added a Classic Party bot');
     }
     start.click();
     confirm.click();
     await waitFor(()=>room().phase==='countdown','Classic Party with bots enters countdown');
     await waitFor(()=>room().phase==='question','Classic Party with bots reaches the first question');
     await waitFor(()=>botIds().every(id=>Number.isFinite(room().guesses?.[id])),'Both bots submit guesses',25000)
       .catch(error=>{throw Error(error.message+' '+JSON.stringify({clock:room().questionClock,guesses:room().guesses,
         prompt:room().currentQuestion?.prompt,display:document.getElementById('question-prompt-text').dataset.txt}));});
     return {bots:botIds().length,solo:!!room().settings.solo,round:room().round};
   })()`);
   if(classic.bots!==2||classic.solo||classic.round!==1)throw Error('Classic bot roster failed '+JSON.stringify(classic));
   console.log(JSON.stringify({width,classic,pass:true}));
 }
 await call('Target.closeTarget',{targetId});
 }

  }catch(e){console.error(e);process.exitCode=1}finally{clearTimeout(timer);socket?.close();child.kill();server.close();}
 });
});
