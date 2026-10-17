// Real Chromium DOM test of the power-up controller with an isolated wallet/room.
// Never connects to Firebase or changes a player's data.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'), source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=source.match(/<style>([\s\S]*?)<\/style>/)[1];
const hud=source.slice(source.indexOf('<div id="hud">'),source.indexOf('<script type="module">'));
const actualTips=source.match(/const QUESTION_TIPS = (\[[\s\S]*?\n  \]);/);
if(!actualTips)throw Error('Cannot find game tip list');
const extractFunction=name=>{const start=source.indexOf('  function '+name+'('),end=source.indexOf('\n  }',start);if(start<0||end<0)throw Error('Missing '+name);return source.slice(start,end+4)};
const extractLine=prefix=>{const start=source.indexOf(prefix);if(start<0)throw Error('Missing '+prefix);return source.slice(start,source.indexOf('\n',start))};
const test=`
import {createPowerupController} from '/anim/powerup-ui.mjs';
import {POWERUPS,bufferedGuess} from '/anim/powerups.mjs';
import {roundAccuracy,formatAccuracy} from '/anim/accuracy.mjs';
const assert=(v,m)=>{if(!v)throw Error(m)}, results=[];
const browserErrors=[];window.addEventListener('error',e=>browserErrors.push(e.message));
const tick=()=>new Promise(r=>setTimeout(r,0));
const actualTips=${actualTips[1]};
// This fixture runs with real compositor frames and an emulated mobile viewport.
const objects=[{id:'ant',mm:10,image:'/items/ant.webp'},{id:'paperclip',mm:30,image:'/items/paperclip.webp'},{id:'canoe',mm:1000,image:'/items/canoe.webp'},{id:'school-bus',mm:3000,image:'/items/school-bus.webp'}];
let wallet={coins:100},room,clock=1000,mode='quick',debits=0,delayDebit=false,owner='me',sounds=0;
const newRoom=()=>({settings:{solo:true,timerSeconds:30},players:{me:{},bot:{isBot:true}},phase:'question',questionEndsAt:31000,currentQuestion:{unitId:'ant',targetId:'canoe',answer:100,powerupKey:crypto.randomUUID()}});
room=newRoom();
document.querySelectorAll('.active').forEach(el=>el.classList.remove('active'));
document.getElementById('hud').classList.add('active');document.getElementById('question-view').classList.add('active');
document.getElementById('question-prompt-text').textContent='How many ants long is the length of a canoe?';
document.getElementById('hud-timer').textContent='30';
document.getElementById('question-note').style.display='block';document.getElementById('question-note').textContent='Tip: Best average accuracy: +10, +6, +3';
document.getElementById('score-col').innerHTML=['You','Milo','Luna','Pip'].map((n,i)=>'<div class="score-card"><img style="width:40px" src="/avatars/'+['av01','av02','av03','av04'][i]+'.png"><b>'+n+'</b><span>'+i+' pts · 95%</span></div>').join('');
document.getElementById('q-preview').innerHTML=objects.filter(o=>['ant','canoe'].includes(o.id)).map(o=>'<div class="qp"><img src="'+o.image+'"><span>'+o.id+'</span></div>').join('');
const context=()=>mode==='excluded'?null:({mode,q:room.currentQuestion,playerId:owner,phase:room.phase,roomCode:mode==='quick'?'TEST':null,deadline:mode==='quick'?(room.phase==='answers'?room.answersEndsAt:room.questionEndsAt):null,submitted:!!room.guesses?.me,answers:room.answers||[],objects,apply:q=>{room.currentQuestion=q}});
const c=createPowerupController({context,now:()=>clock,coins:()=>wallet.coins,owner:()=>owner,
 onUsed:()=>{sounds++},
 question:(u,t)=>({unitId:u.id,targetId:t.id,answer:t.mm/u.mm}),object:id=>objects.find(o=>o.id===id),
 profileTransaction:async(_,fn)=>{const next=fn(structuredClone(wallet));if(!next)return {committed:false};if(next.coins<wallet.coins)debits++;wallet=next;if(delayDebit&&next.powerupReceipts&&Object.values(next.powerupReceipts).some(r=>r.status==='charged')){clock=40000;delayDebit=false}return {committed:true}},
 roomTransaction:async(_,fn)=>{const next=fn(structuredClone(room));if(!next)return {committed:false,snapshot:{val:()=>room}};room=next;return {committed:true,snapshot:{val:()=>room}}},
 profile:async()=>wallet,room:async()=>room,quickApplied:()=>{},refresh:()=>{},finished:()=>{},
});
const local=document.createElement('div');document.body.append(local);
const WORLDS=[{name:'Tiny Things'}],WORLD_Q=5,SURVIVAL_LIVES=3,WORLD_STAR_AT=[60,80,92],deviceId='me';
${extractLine('  const worldStarsFor =')}
${extractFunction('effectiveGuess')}
${extractFunction('worldProgressHtml')}
const worldsContentEl=document.getElementById('worlds-content'),survivalContentEl=document.getElementById('survival-content');
const OBJECT_BY_ID=new Map(objects.map(o=>[o.id,{...o,name:o.id,plural:o.id+'s'}]));
const escapeHtml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const worldStop=()=>{},survivalStop=()=>{},svRunAcc=()=>null;
const powerups=c,powerupContext=()=>context();
let wl,sv;
${extractLine('  const svHeartSvg =')}
${extractLine('  const svAccHtml =')}
${extractLine('  const survivalHeartsHtml =')}
${extractFunction('renderWorlds')}
${extractFunction('renderSurvival')}
globalThis.showSoloCompactPreview=which=>{
 document.getElementById('hud').classList.remove('active');local.innerHTML='';mode=which;room=newRoom();
 room.currentQuestion.prompt='How many ants long is the length of a canoe?';
 document.getElementById('worlds-screen').classList.toggle('active',which==='worlds');
 document.getElementById('survival-screen').classList.toggle('active',which==='survival');
 if(which==='worlds'){wl={phase:'question',wi:0,level:1,questions:[room.currentQuestion],guesses:[],input:''};renderWorlds()}
 else{sv={phase:'question',asked:0,lives:3,q:room.currentQuestion,accs:[],input:''};renderSurvival()}
 const host=which==='worlds'?worldsContentEl:survivalContentEl,keys=[...host.querySelectorAll('.dc-key')];
 const pad=host.querySelector('.dc-keys'),pill=host.querySelector('.dc-prompt');
 assert(keys.length===12&&keys.every(b=>b.getBoundingClientRect().height>=44),'solo keypad touch targets');
 assert(pad.getBoundingClientRect().height<=200,'compact keypad height');
 assert(keys.every(b=>getComputedStyle(b).marginTop==='0px'&&getComputedStyle(b).marginBottom==='0px'),'no hidden keypad margins');
 assert(getComputedStyle(pill).backgroundColor.startsWith('rgba(')&&parseFloat(getComputedStyle(pill).borderRadius)>=20,'semi-transparent question pill');
 assert(host.scrollWidth<=innerWidth,'solo content fits horizontally');
 const submit=host.querySelector(which==='worlds'?'#wl-submit':'#sv-submit');
 return {mode:which,keypadHeight:pad.getBoundingClientRect().height,submitBottom:Math.round(submit.getBoundingClientRect().bottom),viewportHeight:innerHeight};
};
globalThis.showWorldProgressPreview=(accuracy=null)=>{
 showSoloCompactPreview('worlds');
 wl.questions=Array.from({length:5},()=>({...room.currentQuestion}));wl.guesses=accuracy==null?[75,90]:[accuracy,accuracy];
 room.currentQuestion=wl.questions[2];room.currentQuestion.powerups={owner:'me',used:{buffer:true}};renderWorlds();
 return worldsContentEl.querySelector('.wl-progress').textContent;
};
const buy=async id=>{c.render();local.innerHTML=mode==='worlds'||mode==='survival'?c.html(context()):'';const b=document.querySelector('[data-powerup="'+id+'"]');b.click();b.click();for(let n=0;n<600&&c.busy;n++)await new Promise(r=>setTimeout(r,25));assert(!c.busy,'purchase finishes');assert(!document.querySelector('dialog'),'no purchase pop-up');if(mode==='worlds'||mode==='survival')local.innerHTML=c.html(context())};
try{
 c.render();const buttons=[...document.querySelectorAll('[data-powerup]')];assert(buttons.length===5,'five buttons');
 assert(buttons.every(b=>b.getBoundingClientRect().width>=44),'44px touch widths');
 const box=document.getElementById('quick-powerups'),cards=document.getElementById('score-col'),pics=document.getElementById('q-preview');
 assert(box.parentElement.id==='hud'&&box.children.length===5&&box.classList.contains('pu-l-shape'),'one connected L-shaped panel');
 const rects=buttons.map(b=>b.getBoundingClientRect());
 assert(rects.every(r=>Math.abs(r.width-rects[0].width)<1&&r.height===44),'all controls same size');
 const buffer=document.querySelector('[data-powerup="buffer"]'),lower=buttons.filter(b=>b!==buffer);
 assert(new Set(lower.map(b=>Math.round(b.getBoundingClientRect().top))).size===1&&buffer.getBoundingClientRect().bottom<=lower[0].getBoundingClientRect().top+1,'one raised control and four across bottom');
 assert(cards.getBoundingClientRect().top>=box.getBoundingClientRect().bottom,'no player-card overlap');
 assert(box.getBoundingClientRect().top>=document.getElementById('question-note').getBoundingClientRect().bottom,'no tip overlap');
 assert(lower[0].getBoundingClientRect().left>=pics.getBoundingClientRect().right,'no object overlap');
 assert(box.getBoundingClientRect().right<=innerWidth+1,'power-up box stays within viewport');
 assert(buttons.every(b=>b.getBoundingClientRect().left>=0&&(b.getBoundingClientRect().right<=innerWidth+1||b.closest('#quick-powerups'))),'spare-space controls stay within mobile viewport');
 const note=document.getElementById('question-note'),board=document.getElementById('question-prompt'),normalTip=note.textContent;
 const tipCases=[];
 for(const boardHeight of [184,196,280])for(const tip of actualTips){
  board.style.minHeight=boardHeight+'px';note.textContent=tip;c.render();
  const p=box.getBoundingClientRect(),n=note.getBoundingClientRect(),card=cards.getBoundingClientRect();
  const controls=[...box.querySelectorAll('[data-powerup]')].map(b=>b.getBoundingClientRect());
  const label=boardHeight+'px board, '+tip;
  assert(box.children.length===5&&box.classList.contains('pu-l-shape'),'all controls and L shape: '+label);
  assert(p.top>=n.bottom&&card.top>=p.bottom,'no overlap: '+label);
  assert(p.left>=pics.getBoundingClientRect().right&&p.right<=innerWidth+1,'horizontal fit: '+label);
  assert(controls.every(r=>r.width>=44&&r.height===44&&Math.abs(r.width-controls[0].width)<1),'equal touch targets: '+label);
  tipCases.push({tip,boardHeight,tipHeight:n.height,playerOffset:Math.round(card.top-document.querySelector('.game-body').getBoundingClientRect().top)});
 }
 results.push('all '+actualTips.length+' actual tips × 3 board heights: '+tipCases.length+' layout cases');
 board.style.minHeight='280px';c.render();assert(box.getBoundingClientRect().height===92,'same L shape on tall boards');
 board.style.minHeight='';note.textContent='Tip: This longer tip wraps onto many lines to check that no power-up can ever overlap the timer or the tip text on a narrow phone.';c.render();assert(box.getBoundingClientRect().top>=note.getBoundingClientRect().bottom,'long tips do not overlap panel');assert(cards.getBoundingClientRect().top>=box.getBoundingClientRect().bottom,'cards remain below connected box');
 note.textContent=normalTip;c.render();
 assert(document.getElementById('howto-powerup-list').textContent.includes('Reroll small')&&document.getElementById('howto-powerup-list').textContent.includes('10% buffer'),'help card explains power-ups');
 results.push('one connected L-shaped box, five equal controls, four across bottom, no overlap, and accessible touch targets');
 const initialPositions=Object.fromEntries([...document.querySelectorAll('[data-powerup]')].map(b=>[b.dataset.powerup,{x:b.getBoundingClientRect().left,y:b.getBoundingClientRect().top}]));
 await buy('buffer');assert(wallet.coins===90&&debits===1&&room.currentQuestion.powerups.used.buffer,'double tap charges once');
 assert(document.querySelectorAll('[data-powerup]').length===5&&document.querySelector('[data-powerup="buffer"]').disabled,'used buffer stays disabled');
 assert([...document.querySelectorAll('[data-powerup]')].every(b=>b.getBoundingClientRect().left===initialPositions[b.dataset.powerup].x&&b.getBoundingClientRect().top===initialPositions[b.dataset.powerup].y),'no icon movement after use');
 assert(sounds===1,'one successful-use sound');
 const feedback=document.querySelector('.pu-feedback');assert(feedback&&!feedback.hidden&&!document.querySelector('.pu-toast'),'anchored feedback replaces old toast');
 const animation=feedback.getAnimations()[0],frames=animation.effect.getKeyframes();
 assert(frames[0].transform.includes('.035')&&frames.at(-1).transform.includes('-28px'),'expands from dot and rises');
 const fb=feedback.getBoundingClientRect();assert(fb.left>=0&&fb.right<=innerWidth,'feedback stays on screen');
 results.push('stable disabled used icons, no duplicate charge/sound, anchored expanding/rising feedback');
 await buy('small');assert(room.currentQuestion.unitId==='paperclip'&&room.currentQuestion.targetId==='canoe','only small changed');assert(room.currentQuestion.powerups.used.buffer,'buffer survives reroll');assert(wallet.coins===85,'reroll price');assert(document.querySelector('[data-powerup="big"]').disabled&&document.querySelector('[data-powerup="both"]').disabled,'all rerolls remain disabled');
 results.push('reroll changes intended object and preserves buffer/usage');
 room=newRoom();room.guesses={me:95};c.render();assert(document.querySelectorAll('[data-powerup]').length===5&&document.querySelectorAll('[data-powerup]:not(:disabled)').length===1,'waiting tray remains stable with only buffer enabled');assert(box.parentElement.id==='hud','waiting action stays in common panel');
 results.push('waiting buffer remains in sidebar');
 room.phase='answers';room.answersEndsAt=11000;room.answers=[{playerId:'me',value:95},{playerId:'bot',value:90},{playerId:'b2',value:80},{playerId:'truth',value:100,truth:true},{playerId:'b3',value:120}];c.render();
 assert(!document.querySelector('#quick-powerups [data-powerup="buffer"]'),'no buffer on Second Chance');assert(document.querySelector('#quick-powerups [data-powerup="fifty"]'),'50/50 contextual');await buy('fifty');assert(room.currentQuestion.powerups.removed.length===2&&!room.currentQuestion.powerups.removed.includes('truth'),'truth preserved');
 assert(document.querySelector('#quick-powerups [data-powerup="fifty"]').disabled,'used 50/50 stays in place');
 results.push('Second Chance hides buffer and 50/50 preserves truth');
 room=newRoom();wallet={coins:0};c.render();assert(document.querySelector('[data-powerup="buffer"]').disabled,'insufficient funds');await buy('buffer');assert(wallet.coins===0,'no debit');
 room=newRoom();wallet={coins:20};clock=1000;delayDebit=true;await buy('buffer');assert(wallet.coins===20&&!room.currentQuestion.powerups,'late activation refunded');
 assert(sounds===3,'failed or unaffordable purchases do not play success sound');
 results.push('insufficient funds and deadline-race refund');
 room=newRoom();clock=1000;wallet={coins:20};mode='worlds';await buy('buffer');assert(wallet.coins===10&&room.currentQuestion.powerups.used.buffer,'untimed local effect');assert(!room.questionEndsAt||room.questionEndsAt===31000,'no added local timer');
 assert(local.querySelectorAll('[data-powerup]').length===5&&local.querySelector('[data-powerup="buffer"]').disabled,'Worlds retains grey used buffer');
 results.push('local Worlds purchase without adding timer');
 room=newRoom();mode='survival';clock=1000;wallet={coins:20};const began=performance.now();await buy('reveal');assert(performance.now()-began>=4000,'full four-second view');assert(!document.querySelector('.pu-preview'),'preview removes itself');assert(wallet.coins===10&&room.currentQuestion.powerups.used.reveal,'one paid reveal');
 assert(local.querySelectorAll('[data-powerup]').length===5&&local.querySelector('[data-powerup="reveal"]').disabled,'Survival retains grey used reveal');
 results.push('four-second item reveal completes and charges once');local.innerHTML='';
 mode='excluded';c.render();assert(document.getElementById('quick-powerups').hidden,'excluded modes');
 results.push('excluded modes hide actions');
 room=newRoom();mode='quick';clock=1000;wallet={coins:100};c.render();
 const old=Date.now()-120000;wallet={coins:0,powerupReceipts:{lost:{cost:10,status:'charged',at:old,mode:'worlds'},applied:{cost:5,status:'charged',at:old,mode:'quick',room:'TEST'}}};room.powerupReceipts={applied:true};await c.recover(wallet,'me');assert(wallet.coins===10&&wallet.powerupReceipts.applied.status==='applied','receipt reconciliation');await c.recover(wallet,'me');assert(wallet.coins===10,'no repeated refund');
 results.push('interrupted purchase reconciliation is idempotent');
 wallet={coins:100};c.render();
 const soloLayouts=['worlds','survival'].map(showSoloCompactPreview);results.push('actual Worlds and Survival renderers: compact keypads, 44px targets, translucent question pills');
 showSoloCompactPreview('worlds');
 let progress=worldsContentEl.querySelector('.wl-progress');assert(progress&&progress.textContent.includes('No answers yet'),'empty progress state');
 assert(progress.compareDocumentPosition(worldsContentEl.querySelector('.dc-pics'))&Node.DOCUMENT_POSITION_FOLLOWING,'bar above objects');
 assert(worldsContentEl.querySelector('.dc-dots').compareDocumentPosition(progress)&Node.DOCUMENT_POSITION_FOLLOWING,'bar below round dots');
 const temp=document.createElement('div');document.body.append(temp);
 for(const [avg,stars] of [[0,0],[60,0],[60.1,1],[80,1],[80.1,2],[92,2],[92.1,3],[100,3]]){
  wl={guesses:[avg],questions:[{answer:100}]};temp.innerHTML=worldProgressHtml();
  assert(Math.abs(Number(temp.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'))-avg)<1e-9,'running percent '+avg);
  assert(temp.querySelectorAll('.wl-progress-marker.earned').length===stars,'strict star threshold '+avg);
  assert(temp.querySelector('.wl-progress').classList.contains('three-stars')===(avg>92),'blue shine only above 92');
 }
 wl={guesses:[75,150],questions:[{answer:100},{answer:100}]};temp.innerHTML=worldProgressHtml();assert(temp.textContent.includes('62.5%'),'average per-round accuracy');
 wl={guesses:[95],questions:[{answer:100,powerups:{owner:'me',used:{buffer:true}}}]};temp.innerHTML=worldProgressHtml();assert(temp.textContent.includes('100%'),'progress includes buffer');
 temp.remove();results.push('Worlds running bar, actual star artwork, strict 60/80/92 requirements, per-round averaging and buffer-adjusted accuracy');
 const audio=new Audio('/sfx/crisp/powerup.wav');await new Promise((resolve,reject)=>{audio.onloadedmetadata=resolve;audio.onerror=()=>reject(Error('power-up sound decode failed'));audio.load()});
 assert(audio.duration>0&&Number.isFinite(audio.duration),'power-up sound decodes');results.push('successful-use sound once only, failures silent, dedicated audio decodes');
 document.getElementById('worlds-screen').classList.remove('active');document.getElementById('survival-screen').classList.remove('active');document.getElementById('hud').classList.add('active');mode='quick';c.render();
 document.getElementById('test-output').textContent=JSON.stringify({pass:true,viewport:innerWidth,tipCases:tipCases.length,soloLayouts,results});
 document.title='PASS power-ups';
}catch(e){document.getElementById('test-output').textContent=JSON.stringify({pass:false,error:e.stack,browserErrors,results});document.title='FAIL power-ups'}
`;
// Measure settled layout, rather than the brief scale-in entrance animation.
const fixture='<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+' #worlds-content,#survival-content{animation:none!important}</style></head><body>'+hud+'<div id="worlds-screen" class="screen"><div id="worlds-content"></div></div><div id="survival-screen" class="screen"><div id="survival-content"></div></div><div id="howto-powerup-list" hidden></div><pre id="test-output" style="display:none"></pre><script type="module">'+test+'</script></body></html>';
const server=http.createServer((req,res)=>{
 if(req.url.startsWith('/__powerup-test')){res.setHeader('Content-Type','text/html');res.end(fixture);return}
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 const type={'.mjs':'text/javascript','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.wav':'audio/wav'}[path.extname(file)]||'application/octet-stream';
 try{res.setHeader('Content-Type',type);res.end(fs.readFileSync(file))}catch{res.writeHead(404);res.end()}
});
server.listen(0,'127.0.0.1',()=>{
 const outDir=path.join(root,'output','powerup-tests');fs.mkdirSync(outDir,{recursive:true});
 const chrome=process.env.CHROME_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
 const args=['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--hide-scrollbars','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'size-em-up-powerups-'+process.pid),'about:blank'];
 const child=spawn(chrome,args,{windowsHide:true});let stderr='',started=false,socket;
 const timer=setTimeout(()=>{child.kill();server.close();console.error('Browser timed out. '+stderr.slice(-800));process.exitCode=1},45000);
 child.on('error',e=>{clearTimeout(timer);server.close();throw e});
 child.stderr.on('data',async chunk=>{
  stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
  if(started||!match)return;started=true;
  try{
   socket=new WebSocket(match[1]);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject});
   let serial=0;const pending=new Map();
   socket.onmessage=e=>{const r=JSON.parse(e.data);if(!r.id)return;const p=pending.get(r.id);if(!p)return;pending.delete(r.id);r.error?p.reject(Error(r.error.message)):p.resolve(r.result)};
   const call=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}))});
   const widths=process.env.POWERUP_TEST_WIDTH?[Number(process.env.POWERUP_TEST_WIDTH)]:[320,390,430];
   for(const width of widths){
    const {targetId}=await call('Target.createTarget',{url:'about:blank'});
    const {sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
    await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true},sessionId);
    await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/__powerup-test'},sessionId);
    let result;
    for(let n=0;n<350;n++){
     await new Promise(r=>setTimeout(r,40));
     const evaluated=await call('Runtime.evaluate',{expression:'document.getElementById("test-output")?.textContent',returnByValue:true},sessionId);
     if(evaluated.result?.value){result=JSON.parse(evaluated.result.value);break}
    }
    if(!result)throw Error('No test result at '+width+'px');
    const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);
    fs.writeFileSync(path.join(outDir,'quick-game-'+width+'.png'),Buffer.from(shot.data,'base64'));
    console.log(JSON.stringify(result,null,2));if(!result.pass)process.exitCode=1;
    if(result.pass)for(const height of [700,844])for(const mode of ['worlds','survival']){
     await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true},sessionId);
     const checked=await call('Runtime.evaluate',{expression:'showSoloCompactPreview('+JSON.stringify(mode)+')',returnByValue:true},sessionId);
     if(checked.exceptionDetails)throw Error('Solo layout check failed at '+width+'×'+height);
     const soloShot=await call('Page.captureScreenshot',{format:'png'},sessionId);
     fs.writeFileSync(path.join(outDir,mode+'-'+width+'x'+height+'.png'),Buffer.from(soloShot.data,'base64'));
    }
    if(result.pass){
     const running=await call('Runtime.evaluate',{expression:'showWorldProgressPreview()',returnByValue:true},sessionId);
     if(running.exceptionDetails||!running.result.value.includes('82.5%'))throw Error('Running progress preview failed');
     const runningShot=await call('Page.captureScreenshot',{format:'png'},sessionId);
     fs.writeFileSync(path.join(outDir,'worlds-progress-'+width+'.png'),Buffer.from(runningShot.data,'base64'));
     await call('Runtime.evaluate',{expression:'showWorldProgressPreview(95)',returnByValue:true},sessionId);
     const blueShot=await call('Page.captureScreenshot',{format:'png'},sessionId);
     fs.writeFileSync(path.join(outDir,'worlds-blue-'+width+'.png'),Buffer.from(blueShot.data,'base64'));
    }
    await call('Target.closeTarget',{targetId});
   }
  }catch(e){console.error(e.stack);process.exitCode=1}
  finally{clearTimeout(timer);if(socket)socket.close();child.kill();server.close()}
 });
});
