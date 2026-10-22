import {playSynth} from './sound-review-synth.mjs';
const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const data=await fetch('./sound-review-data.json').then(r=>{if(!r.ok)throw Error('Sound list could not load');return r.json();}).catch(e=>{$('status').textContent=e.message;return {rows:[]};});
const rows=data.rows,key='size-em-up-sound-audit-v2';let choices={},filter='all',page=0,focus=false,epoch=0,ctx,active=[],synthContexts=[];
try{choices=JSON.parse(localStorage.getItem(key)||'{}');}catch{}
const current=r=>choices[r.id]?.fingerprint===r.fingerprint?choices[r.id].choice:null;
const params=new URLSearchParams(location.search);
if(params.get('baseline')==='options'){
 try{const baseline=await fetch('./sound-options-data.json').then(r=>{if(!r.ok)throw Error();return r.json();});for(const item of baseline.baseline){const row=rows.find(r=>r.id===item.id);if(row&&!current(row)&&item.choice&&row.fingerprint===item.fingerprint)choices[row.id]={choice:item.choice,fingerprint:item.fingerprint};}save();}
 catch{$('status').textContent='Your previous review could not load. Use Load choices to restore it.';}
}
if(params.get('filter')==='pending')filter='pending';
function save(){try{localStorage.setItem(key,JSON.stringify(choices));}catch{$('status').textContent='Browser storage is unavailable. Use Save choices before leaving.';}}
function stop(){epoch++;active.forEach(n=>{try{n.stop();}catch{}});active=[];synthContexts.forEach(c=>c.close().catch(()=>{}));synthContexts=[];document.querySelectorAll('.playing').forEach(el=>el.classList.remove('playing'));}
const cache=new Map();
async function buffer(file){if(!cache.has(file))cache.set(file,fetch('../'+file).then(r=>{if(!r.ok)throw Error('Sound file could not load');return r.arrayBuffer();}).then(b=>ctx.decodeAudioData(b)));return cache.get(file);}
async function play(row,card){
 stop();const ticket=epoch;const master=Number($('volume').value)/100;
 ctx||=new (window.AudioContext||window.webkitAudioContext)();await ctx.resume();
 const stage=card.querySelector('.example');stage.classList.remove('playing');void stage.offsetWidth;stage.classList.add('playing');
 $('status').textContent='Playing: '+row.title;
 try{
  if(row.synth){const c=await playSynth(row.synth,master);if(ticket!==epoch)c.close();else synthContexts.push(c);return;}
  const loaded=await Promise.all(row.events.map(e=>buffer(e.file)));if(ticket!==epoch)return;
  const start=ctx.currentTime+.025;let previousEnd=0;
  row.events.forEach((event,i)=>{const b=loaded[i],rate=event.rate||1,duration=Math.min(event.maxDuration||Infinity,b.duration/rate);const delay=event.afterPrevious?previousEnd:(event.delay||0)/1000;
   const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=b;source.playbackRate.value=rate;gain.gain.value=event.gain*master;source.connect(gain);gain.connect(ctx.destination);source.start(start+delay);source.stop(start+delay+duration);active.push(source);previousEnd=delay+duration;
  });
 }catch(e){if(ticket===epoch)$('status').textContent='Could not play this sound. Tap Play to try again.';}
}
const art=(src,cls='')=>`<img class="${cls}" src="../${src}" alt="">`;
function example(row){
 let content='';
 switch(row.scene){
  case 'stack':content=`<div class="mini-stack motion">${art('items/penny.webp')}${art('items/penny.webp')}${art('items/penny.webp')}</div>${art('items/door.webp','big-object')}`;break;
  case 'coins':content=`${art('icons/coin-v2.png','motion')}<span>+25 coins</span>`;break;
  case 'stars':content=`<span class="stars">${art('icons/flair/star.png')}${art('icons/flair/star.png')}${art('icons/flair/star.png')}</span>`;break;
  case 'winner':content=`${art('avatars/av07.png','motion')}${art('icons/reactions/trophy.png')}<span>1st</span>`;break;
  case 'gacha':content=`${art('icons/gacha-capsule-open.png','motion')}${art('avatars/av07.png')}`;break;
  case 'timer':content=`${art('icons/reactions/alarm.png')}<span class="motion">3 · 2 · 1</span>`;break;
  case 'lobby':content=`${art('avatars/av07.png')}${art('avatars/av19.png','motion')}<span>Lobby</span>`;break;
  case 'reaction':content=art('icons/reactions/grin.png','motion');break;
  case 'powerup':content=`${art('icons/powerups/percentage-buffer.png','motion')}<span>Your turn</span>`;break;
  case 'highstakes':content=`${art('items/poker-chip.webp','motion')}<span class="mini-button">Check</span>`;break;
  case 'answer':content=`<span class="mini-button motion">Lock it in</span>`;break;
  case 'error':content=`${art('icons/reactions/crossed.png','motion')}<span>Try again</span>`;break;
  case 'menu':content=`${art('icons/toolbar-menu.png','motion')}<span>Menu</span>`;break;
  default:content='<span class="mini-button motion">Select</span>';
 }
 return `<div class="example ${row.scene}" role="img" aria-label="Example: ${esc(row.description)}"><div class="example-line">${content}</div><span class="example-caption">Example of when it plays</span></div>`;
}
function filtered(){return rows.filter(r=>filter==='pending'?!current(r):filter==='changes'?current(r)==='change':true);}
function render(){
 const list=filtered(),size=focus?1:6,pages=Math.max(1,Math.ceil(list.length/size));page=Math.max(0,Math.min(page,pages-1));
 document.body.classList.toggle('focus-mode',focus);
 $('cards').innerHTML=list.slice(page*size,(page+1)*size).map(r=>`<article class="sound-card" data-id="${r.id}"><span class="group">${esc(r.group)}</span><h2>${esc(r.title)}</h2>${example(r)}<p>${esc(r.description)}</p><button class="play" data-play="${r.id}">Play sound + example</button><div class="choices"><button data-choice="keep" class="${current(r)==='keep'?'selected':''}" aria-pressed="${current(r)==='keep'}">Keep</button><button data-choice="change" class="change ${current(r)==='change'?'selected':''}" aria-pressed="${current(r)==='change'}">Change</button><button data-choice="clear" aria-label="Clear choice for ${esc(r.title)}">Undo</button></div></article>`).join('')||'<p>No sounds in this view.</p>';
 const done=rows.filter(current).length,change=rows.filter(r=>current(r)==='change').length;
 $('progress').textContent=`${done} / ${rows.length} reviewed · ${change} marked Change`;
 $('page').textContent=`${page+1} / ${pages}`;$('previous').disabled=page===0;$('next').disabled=page>=pages-1;
 for(const id of ['all','pending','changes']){$(id).classList.toggle('selected',id===filter);$(id).setAttribute('aria-pressed',String(id===filter));}
 $('focus').textContent=focus?'List view':'Focus view';
 // Missing illustration paths must be visible as an error during verification.
 document.querySelectorAll('.example img').forEach(img=>img.addEventListener('error',()=>{$('status').textContent='An example image could not load. Please report this sound: '+img.closest('.sound-card').dataset.id;},{once:true}));
}
document.addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;const card=button.closest('.sound-card');
 if(button.dataset.play){const r=rows.find(r=>r.id===button.dataset.play);play(r,card);}
 if(button.dataset.choice){stop();const r=rows.find(r=>r.id===card.dataset.id);if(button.dataset.choice==='clear')delete choices[r.id];else choices[r.id]={choice:button.dataset.choice,fingerprint:r.fingerprint};save();if(focus&&filter==='all'&&button.dataset.choice!=='clear')page++;render();$('status').textContent='Choice saved.';}
});
for(const id of ['all','pending','changes'])$(id).onclick=()=>{stop();filter=id;page=0;render();};
$('focus').onclick=()=>{stop();page=0;focus=!focus;render();};
for(const [id,d]of [['previous',-1],['next',1]])$(id).onclick=()=>{stop();page+=d;render();window.scrollTo({top:0,behavior:'instant'});};
$('stop').onclick=stop;document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);
$('export').onclick=()=>{const result={type:'size-em-up-sound-review',version:1,exportedAt:new Date().toISOString(),decisions:rows.map(r=>({id:r.id,title:r.title,file:r.file,fingerprint:r.fingerprint,choice:current(r)}))};const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='size-em-up-sound-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('status').textContent='Choices saved to a file. Send it back when you finish.';};
$('import').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;const input=JSON.parse(await file.text());if(input.type!=='size-em-up-sound-review'||input.version!==1||!Array.isArray(input.decisions))throw Error('Choose a sound-review export.');const next={...choices},seen=new Set();for(const item of input.decisions){const row=rows.find(r=>r.id===item.id);if(!row||seen.has(item.id)||![null,'keep','change'].includes(item.choice))throw Error('Invalid sound choices.');seen.add(item.id);if(item.choice&&item.fingerprint===row.fingerprint)next[item.id]={choice:item.choice,fingerprint:item.fingerprint};}choices=next;save();render();$('status').textContent='Choices loaded. Changed audio remains unreviewed.';}catch(err){$('status').textContent=err.message;}finally{e.target.value='';}};
render();
