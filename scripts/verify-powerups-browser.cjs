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
const tick=()=>new Promise(r=>setTimeout(r,0));
// Chromium's virtual-time budget advances timers without compositor frames.
// Drive the preview frame callback from that same clock for this isolated test.
window.requestAnimationFrame=fn=>setTimeout(()=>fn(performance.now()),16);
const objects=[{id:'ant',mm:10,image:'/items/ant.webp'},{id:'paperclip',mm:30,image:'/items/paperclip.webp'},{id:'canoe',mm:1000,image:'/items/canoe.webp'},{id:'school-bus',mm:3000,image:'/items/school-bus.webp'}];
let wallet={coins:100},room,clock=1000,mode='quick',debits=0,delayDebit=false,owner='me';
const newRoom=()=>({settings:{solo:true,timerSeconds:30},players:{me:{},bot:{isBot:true}},phase:'question',questionEndsAt:31000,currentQuestion:{unitId:'ant',targetId:'canoe',answer:100,powerupKey:crypto.randomUUID()}});
room=newRoom();
document.querySelectorAll('.active').forEach(el=>el.classList.remove('active'));
document.getElementById('hud').classList.add('active');document.getElementById('question-view').classList.add('active');
document.getElementById('question-prompt-text').textContent='How many ants long is the length of a canoe?';
document.getElementById('hud-timer').textContent='30';
document.getElementById('score-col').innerHTML=['You','Milo','Luna','Pip'].map((n,i)=>'<div class="score-card"><img style="width:40px" src="/avatars/'+['cat','dog','frog','fox'][i]+'.png"><b>'+n+'</b><span>'+i+' pts · 95%</span></div>').join('');
document.getElementById('q-preview').innerHTML=objects.filter(o=>['ant','canoe'].includes(o.id)).map(o=>'<div class="qp"><img src="'+o.image+'"><span>'+o.id+'</span></div>').join('');
const context=()=>mode==='excluded'?null:({mode,q:room.currentQuestion,playerId:owner,phase:room.phase,roomCode:mode==='quick'?'TEST':null,deadline:mode==='quick'?(room.phase==='answers'?room.answersEndsAt:room.questionEndsAt):null,submitted:!!room.guesses?.me,answers:room.answers||[],objects,apply:q=>{room.currentQuestion=q}});
const c=createPowerupController({context,now:()=>clock,coins:()=>wallet.coins,owner:()=>owner,
 question:(u,t)=>({unitId:u.id,targetId:t.id,answer:t.mm/u.mm}),object:id=>objects.find(o=>o.id===id),
 profileTransaction:async(_,fn)=>{const next=fn(structuredClone(wallet));if(!next)return {committed:false};if(next.coins<wallet.coins)debits++;wallet=next;if(delayDebit&&next.powerupReceipts&&Object.values(next.powerupReceipts).some(r=>r.status==='charged')){clock=40000;delayDebit=false}return {committed:true}},
 roomTransaction:async(_,fn)=>{const next=fn(structuredClone(room));if(!next)return {committed:false,snapshot:{val:()=>room}};room=next;return {committed:true,snapshot:{val:()=>room}}},
 profile:async()=>wallet,room:async()=>room,quickApplied:()=>{},refresh:()=>{},finished:()=>{},
});
const local=document.createElement('div');document.body.append(local);
const open=id=>{c.render();local.innerHTML=mode==='worlds'||mode==='survival'?c.html(context()):'';document.querySelector('[data-powerup="'+id+'"]').click()};
const buy=async()=>{const b=document.querySelector('[data-pu-buy]');b.click();b.click();for(let n=0;n<250&&c.busy;n++)await new Promise(r=>setTimeout(r,25));assert(!c.busy,'purchase finishes')};
try{
 c.render();const buttons=[...document.querySelectorAll('#quick-powerups [data-powerup]')];assert(buttons.length===5,'five buttons');
 assert(new Set(buttons.map(b=>Math.round(b.getBoundingClientRect().top))).size===1,'one row');assert(buttons.every(b=>b.getBoundingClientRect().width>=44),'44px touch widths');
 results.push('one compact row and accessible touch targets');
 open('buffer');document.querySelector('[data-pu-cancel]').click();assert(wallet.coins===100,'cancel costs nothing');
 open('buffer');await buy();assert(wallet.coins===90&&debits===1&&room.currentQuestion.powerups.used.buffer,'double tap charges once');
 assert(document.querySelectorAll('#quick-powerups [data-powerup]').length===4,'used buffer hidden');
 results.push('cancel, double tap, charged-once buffer and hidden used action');
 open('small');await buy();assert(room.currentQuestion.unitId==='paperclip'&&room.currentQuestion.targetId==='canoe','only small changed');assert(room.currentQuestion.powerups.used.buffer,'buffer survives reroll');assert(wallet.coins===85,'reroll price');assert(!document.querySelector('[data-powerup="big"]'),'one reroll total');
 results.push('reroll changes intended object and preserves buffer/usage');
 room=newRoom();room.guesses={me:95};c.render();assert(document.querySelectorAll('#quick-powerups [data-powerup]').length===1,'waiting single action');assert(document.querySelector('#guess-display').nextElementSibling.id==='quick-powerups','waiting action below guess');
 results.push('compact waiting buffer beneath locked guess');
 room.phase='answers';room.answersEndsAt=11000;room.answers=[{playerId:'me',value:95},{playerId:'bot',value:90},{playerId:'b2',value:80},{playerId:'truth',value:100,truth:true},{playerId:'b3',value:120}];c.render();
 assert(document.getElementById('quick-powerups').hidden,'no buffer on Second Chance');assert(document.querySelector('#second-powerup [data-powerup="fifty"]'),'50/50 contextual');open('fifty');await buy();assert(room.currentQuestion.powerups.removed.length===2&&!room.currentQuestion.powerups.removed.includes('truth'),'truth preserved');
 results.push('Second Chance hides buffer and 50/50 preserves truth');
 room=newRoom();wallet={coins:0};open('buffer');assert(document.querySelector('[data-pu-buy]').disabled,'insufficient funds');document.querySelector('[data-pu-cancel]').click();assert(wallet.coins===0,'no debit');
 room=newRoom();wallet={coins:20};clock=1000;delayDebit=true;open('buffer');await buy();assert(wallet.coins===20&&!room.currentQuestion.powerups,'late activation refunded');
 results.push('insufficient funds and deadline-race refund');
 room=newRoom();clock=1000;wallet={coins:20};mode='worlds';open('buffer');await buy();assert(wallet.coins===10&&room.currentQuestion.powerups.used.buffer,'untimed local effect');assert(!room.questionEndsAt||room.questionEndsAt===31000,'no added local timer');
 results.push('local Worlds purchase without adding timer');
 room=newRoom();mode='survival';clock=1000;wallet={coins:20};open('reveal');const began=performance.now();await buy();assert(performance.now()-began>=4000,'full four-second view');assert(!document.querySelector('.pu-preview'),'preview removes itself');assert(wallet.coins===10&&room.currentQuestion.powerups.used.reveal,'one paid reveal');
 results.push('four-second item reveal completes and charges once');local.innerHTML='';
 mode='excluded';c.render();assert(document.getElementById('quick-powerups').hidden&&document.getElementById('second-powerup').hidden,'excluded modes');
 results.push('excluded modes hide actions');
 room=newRoom();mode='quick';clock=1000;wallet={coins:100};c.render();
 const old=Date.now()-120000;wallet={coins:0,powerupReceipts:{lost:{cost:10,status:'charged',at:old,mode:'worlds'},applied:{cost:5,status:'charged',at:old,mode:'quick',room:'TEST'}}};room.powerupReceipts={applied:true};await c.recover(wallet,'me');assert(wallet.coins===10&&wallet.powerupReceipts.applied.status==='applied','receipt reconciliation');await c.recover(wallet,'me');assert(wallet.coins===10,'no repeated refund');
 results.push('interrupted purchase reconciliation is idempotent');
 wallet={coins:100};c.render();
 document.getElementById('test-output').textContent=JSON.stringify({pass:true,results});
 document.title='PASS power-ups';
}catch(e){document.getElementById('test-output').textContent=JSON.stringify({pass:false,error:e.stack,results});document.title='FAIL power-ups'}
`;
const fixture='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body>'+hud+'<pre id="test-output" style="display:none"></pre><script type="module">'+test+'</script></body></html>';
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
 const args=['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--hide-scrollbars','--user-data-dir='+path.join(os.tmpdir(),'size-em-up-powerups-'+process.pid),'--window-size=390,844','--virtual-time-budget=15000','--dump-dom','--screenshot='+path.join(outDir,'quick-game-390.png'),'http://127.0.0.1:'+server.address().port+'/__powerup-test'];
 const child=spawn(chrome,args,{windowsHide:true});let stdout='',stderr='';
 child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);
 const timer=setTimeout(()=>{child.kill();server.close();console.error('Browser timed out. '+stderr.slice(-800));process.exitCode=1},45000);
 child.on('error',e=>{clearTimeout(timer);server.close();throw e});
 child.on('exit',()=>{clearTimeout(timer);server.close();fs.writeFileSync(path.join(outDir,'browser-dom.html'),stdout);const match=stdout.match(/<pre id="test-output"[^>]*>([\s\S]*?)<\/pre>/);if(!match||!match[1]){console.error('No test result. '+stderr.slice(-800));process.exitCode=1;return}const result=JSON.parse(match[1].replaceAll('&quot;','"').replaceAll('&amp;','&').replaceAll('&gt;','>').replaceAll('&lt;','<'));console.log(JSON.stringify(result,null,2));if(!result.pass)process.exitCode=1;});
});
