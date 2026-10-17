// Real Chromium DOM test of the power-up controller with an isolated wallet/room.
// Never connects to Firebase or changes a player's data.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'), source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=source.match(/<style>([\s\S]*?)<\/style>/)[1];
const hud=source.slice(source.indexOf('<div id="hud">'),source.indexOf('<script type="module">'));
const test=`
import {createPowerupController} from '/anim/powerup-ui.mjs';
import {POWERUPS} from '/anim/powerups.mjs';
const assert=(v,m)=>{if(!v)throw Error(m)}, results=[];
const browserErrors=[];window.addEventListener('error',e=>browserErrors.push(e.message));
const tick=()=>new Promise(r=>setTimeout(r,0));
// This fixture runs with real compositor frames and an emulated mobile viewport.
const objects=[{id:'ant',mm:10,image:'/items/ant.webp'},{id:'paperclip',mm:30,image:'/items/paperclip.webp'},{id:'canoe',mm:1000,image:'/items/canoe.webp'},{id:'school-bus',mm:3000,image:'/items/school-bus.webp'}];
let wallet={coins:100},room,clock=1000,mode='quick',debits=0,delayDebit=false,owner='me';
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
 question:(u,t)=>({unitId:u.id,targetId:t.id,answer:t.mm/u.mm}),object:id=>objects.find(o=>o.id===id),
 profileTransaction:async(_,fn)=>{const next=fn(structuredClone(wallet));if(!next)return {committed:false};if(next.coins<wallet.coins)debits++;wallet=next;if(delayDebit&&next.powerupReceipts&&Object.values(next.powerupReceipts).some(r=>r.status==='charged')){clock=40000;delayDebit=false}return {committed:true}},
 roomTransaction:async(_,fn)=>{const next=fn(structuredClone(room));if(!next)return {committed:false,snapshot:{val:()=>room}};room=next;return {committed:true,snapshot:{val:()=>room}}},
 profile:async()=>wallet,room:async()=>room,quickApplied:()=>{},refresh:()=>{},finished:()=>{},
});
const local=document.createElement('div');document.body.append(local);
const buy=async id=>{c.render();local.innerHTML=mode==='worlds'||mode==='survival'?c.html(context()):'';const b=document.querySelector('[data-powerup="'+id+'"]');b.click();b.click();for(let n=0;n<600&&c.busy;n++)await new Promise(r=>setTimeout(r,25));assert(!c.busy,'purchase finishes');assert(!document.querySelector('dialog'),'no purchase pop-up')};
try{
 c.render();const buttons=[...document.querySelectorAll('[data-powerup]')];assert(buttons.length===5,'five buttons');
 assert(new Set([...document.querySelectorAll('#quick-powerups [data-powerup]')].map(b=>Math.round(b.getBoundingClientRect().top))).size===1,'one sidebar row');assert(buttons.every(b=>b.getBoundingClientRect().width>=44),'44px touch widths');
 const box=document.getElementById('quick-powerups'),cards=document.getElementById('score-col'),pics=document.getElementById('q-preview');
 assert(box.parentElement.classList.contains('score-sidebar')&&box.nextElementSibling===cards,'box above player cards');assert(pics.getBoundingClientRect().top<box.getBoundingClientRect().bottom,'objects stay beside power-ups');
 const header=document.getElementById('header-powerups'),gap=document.getElementById('gap-powerups');
 assert(header.children.length===1&&gap.children.length===1,'average tip uses header and object gap');
 if(!header.hidden){assert(header.getBoundingClientRect().bottom<=document.querySelector('.hud-timer-row').getBoundingClientRect().bottom+1,'header actions use empty space');assert(header.getBoundingClientRect().top>=document.getElementById('question-note').getBoundingClientRect().bottom,'no tip overlap')}
 if(!gap.hidden)assert(gap.getBoundingClientRect().right<=box.parentElement.getBoundingClientRect().left,'gap action avoids cards');
 assert(box.getBoundingClientRect().height<85,'player cards displaced less than two rows');
 assert(box.getBoundingClientRect().right<=innerWidth+1,'power-up box stays within viewport');
 assert(buttons.every(b=>b.getBoundingClientRect().left>=0&&(b.getBoundingClientRect().right<=innerWidth+1||b.closest('#quick-powerups'))),'spare-space controls stay within mobile viewport');
 const note=document.getElementById('question-note'),board=document.getElementById('question-prompt'),normalTip=note.textContent;
 board.style.minHeight='280px';c.render();assert(header.children.length===2&&gap.hidden,'tall boards fit two beneath tips');
 board.style.minHeight='';note.textContent='Tip: This longer tip wraps onto many lines to check that no power-up can ever overlap the timer or the tip text on a narrow phone.';c.render();assert(header.hidden,'long tips release header slots');assert(box.querySelector('.pu-row').scrollWidth>=box.querySelector('.pu-row').clientWidth,'single-row overflow remains reachable');
 note.textContent=normalTip;c.render();
 assert(document.getElementById('howto-powerup-list').textContent.includes('Reroll small')&&document.getElementById('howto-powerup-list').textContent.includes('10% buffer'),'help card explains power-ups');
 results.push('single sidebar row, spare-space placement without overlaps, help content, and accessible touch targets');
 await buy('buffer');assert(wallet.coins===90&&debits===1&&room.currentQuestion.powerups.used.buffer,'double tap charges once');
 assert(document.querySelectorAll('[data-powerup]').length===4,'used buffer hidden');
 results.push('immediate purchase without pop-up, double tap, charged-once buffer and hidden used action');
 await buy('small');assert(room.currentQuestion.unitId==='paperclip'&&room.currentQuestion.targetId==='canoe','only small changed');assert(room.currentQuestion.powerups.used.buffer,'buffer survives reroll');assert(wallet.coins===85,'reroll price');assert(!document.querySelector('[data-powerup="big"]'),'one reroll total');
 results.push('reroll changes intended object and preserves buffer/usage');
 room=newRoom();room.guesses={me:95};c.render();assert(document.querySelectorAll('[data-powerup]').length===1,'waiting single action');assert(box.parentElement.classList.contains('score-sidebar'),'waiting action stays above cards');
 results.push('waiting buffer remains in sidebar');
 room.phase='answers';room.answersEndsAt=11000;room.answers=[{playerId:'me',value:95},{playerId:'bot',value:90},{playerId:'b2',value:80},{playerId:'truth',value:100,truth:true},{playerId:'b3',value:120}];c.render();
 assert(!document.querySelector('#quick-powerups [data-powerup="buffer"]'),'no buffer on Second Chance');assert(document.querySelector('#quick-powerups [data-powerup="fifty"]'),'50/50 contextual');await buy('fifty');assert(room.currentQuestion.powerups.removed.length===2&&!room.currentQuestion.powerups.removed.includes('truth'),'truth preserved');
 results.push('Second Chance hides buffer and 50/50 preserves truth');
 room=newRoom();wallet={coins:0};c.render();assert(document.querySelector('[data-powerup="buffer"]').disabled,'insufficient funds');await buy('buffer');assert(wallet.coins===0,'no debit');
 room=newRoom();wallet={coins:20};clock=1000;delayDebit=true;await buy('buffer');assert(wallet.coins===20&&!room.currentQuestion.powerups,'late activation refunded');
 results.push('insufficient funds and deadline-race refund');
 room=newRoom();clock=1000;wallet={coins:20};mode='worlds';await buy('buffer');assert(wallet.coins===10&&room.currentQuestion.powerups.used.buffer,'untimed local effect');assert(!room.questionEndsAt||room.questionEndsAt===31000,'no added local timer');
 results.push('local Worlds purchase without adding timer');
 room=newRoom();mode='survival';clock=1000;wallet={coins:20};const began=performance.now();await buy('reveal');assert(performance.now()-began>=4000,'full four-second view');assert(!document.querySelector('.pu-preview'),'preview removes itself');assert(wallet.coins===10&&room.currentQuestion.powerups.used.reveal,'one paid reveal');
 results.push('four-second item reveal completes and charges once');local.innerHTML='';
 mode='excluded';c.render();assert(document.getElementById('quick-powerups').hidden,'excluded modes');
 results.push('excluded modes hide actions');
 room=newRoom();mode='quick';clock=1000;wallet={coins:100};c.render();
 const old=Date.now()-120000;wallet={coins:0,powerupReceipts:{lost:{cost:10,status:'charged',at:old,mode:'worlds'},applied:{cost:5,status:'charged',at:old,mode:'quick',room:'TEST'}}};room.powerupReceipts={applied:true};await c.recover(wallet,'me');assert(wallet.coins===10&&wallet.powerupReceipts.applied.status==='applied','receipt reconciliation');await c.recover(wallet,'me');assert(wallet.coins===10,'no repeated refund');
 results.push('interrupted purchase reconciliation is idempotent');
 wallet={coins:100};c.render();
 document.getElementById('test-output').textContent=JSON.stringify({pass:true,viewport:innerWidth,headerSpace:document.querySelector('.hud-timer-row').getBoundingClientRect().bottom-document.querySelector('.hud-timer-col').getBoundingClientRect().bottom-2,headerActions:header.children.length,gapActions:gap.children.length,results});
 document.title='PASS power-ups';
}catch(e){document.getElementById('test-output').textContent=JSON.stringify({pass:false,error:e.stack,browserErrors,results});document.title='FAIL power-ups'}
`;
const fixture='<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body>'+hud+'<div id="howto-powerup-list" hidden></div><pre id="test-output" style="display:none"></pre><script type="module">'+test+'</script></body></html>';
const server=http.createServer((req,res)=>{
 if(req.url.startsWith('/__powerup-test')){res.setHeader('Content-Type','text/html');res.end(fixture);return}
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 const type={'.mjs':'text/javascript','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream';
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
    await call('Target.closeTarget',{targetId});
   }
  }catch(e){console.error(e.stack);process.exitCode=1}
  finally{clearTimeout(timer);if(socket)socket.close();child.kill();server.close()}
 });
});
