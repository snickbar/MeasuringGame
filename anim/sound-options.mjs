import {playSynth} from './sound-review-synth.mjs';
import {example} from './sound-review-scenes.mjs';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const suspense=new URLSearchParams(location.search).get('set')==='suspense';
const set=suspense?'suspense-2':'original';
const data=await fetch(suspense?'./sound-suspense-data.json':'./sound-options-data.json').then(r=>{if(!r.ok)throw Error('Sound choices could not load. Refresh to try again.');return r.json();}).catch(e=>{$('status').textContent=e.message;return {rows:[]};});
const rows=data.rows,key=suspense?'size-em-up-suspense-options-v2':'size-em-up-sound-options-v1';
if(suspense){
 document.title='Suspense sound choices · Size ’Em Up';
 document.querySelector('header h1').textContent='A little more suspense';
 document.querySelector('header p').textContent='Six new builds, then three endings. Compare them with the original, choose your favorites, and Save choices. The game’s sound stays unchanged until you approve a replacement.';
 document.querySelector('footer').textContent='The builds fit the existing 2.3-second suspense animation. Three use percussion or edited recordings; three use musical phrases from your library. Your eight previously approved replacements are unchanged.';
 document.body.classList.add('suspense-review');
}
let page=0,choices={},ctx,epoch=0,sources=[],synths=[],endTimer;
try{const stored=JSON.parse(localStorage.getItem(key)||'{}');if(stored&&typeof stored==='object'&&!Array.isArray(stored))choices=stored;}catch{}
const validChoice=(r,c)=>['current','none','silent',...r.options.map(o=>o.id)].includes(c);
const choice=r=>{const v=choices[r.id];return v?.fingerprint===r.fingerprint&&v?.optionsFingerprint===r.optionsFingerprint&&validChoice(r,v.choice)?v.choice:null;};
const cache=new Map();
function stop(){epoch++;clearTimeout(endTimer);sources.forEach(n=>{try{n.stop();}catch{}});sources=[];synths.forEach(c=>c.close().catch(()=>{}));synths=[];document.querySelectorAll('.playing').forEach(el=>el.classList.remove('playing'));}
async function buffer(file){if(!cache.has(file)){const promise=fetch('../'+file).then(r=>{if(!r.ok)throw Error('Audio could not load');return r.arrayBuffer();}).then(b=>ctx.decodeAudioData(b));cache.set(file,promise);promise.catch(()=>cache.delete(file));}return cache.get(file);}
function ending(){const r=rows.find(r=>r.id==='drumroll-end'),c=choice(r);if(c==='silent')return [];return (r.options.find(o=>o.id===(c||r.defaultPreviewOption))||r).events;}
async function play(id){
 const row=rows[page],option=row.options.find(o=>o.id===id),audio=id==='current'?row:option;
 if(!audio)return;
 stop();const ticket=epoch,master=Number($('volume').value)/100;
 const stage=$('moment').querySelector('.example'),button=$('moment').querySelector(`[data-play="${id}"]`);
 try{
  ctx||=new (window.AudioContext||window.webkitAudioContext)();await ctx.resume();if(ticket!==epoch)return;
  stage.classList.add('playing');button.classList.add('playing');$('status').textContent='Playing: '+(id==='current'?'original sound':option.title);
  if(audio.synth){const c=await playSynth(audio.synth,master);if(ticket!==epoch){await c.close();return;}synths.push(c);endTimer=setTimeout(()=>{if(ticket===epoch){stop();$('status').textContent='Finished. Play another option or choose your pick.';}},2000);return;}
  let events=audio.events;
  // Candidate builds use the separate ending choice; Current remains the shipped reference.
  if(row.id==='drumroll'&&option)events=[...events,...ending().map(e=>({...e,afterPrevious:true}))];
  const loaded=await Promise.all(events.map(e=>buffer(e.file)));if(ticket!==epoch)return;
  const start=ctx.currentTime+.025;let previousEnd=0,latestEnd=0;
  events.forEach((event,i)=>{
   const b=loaded[i],rate=event.rate||1,duration=Math.min(event.maxDuration||Infinity,b.duration/rate),delay=event.afterPrevious?previousEnd:(event.delay||0)/1000;
   const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=b;source.playbackRate.value=rate;gain.gain.value=event.gain*master;source.connect(gain);gain.connect(ctx.destination);source.start(start+delay);source.stop(start+delay+duration);sources.push(source);previousEnd=delay+duration;latestEnd=Math.max(latestEnd,previousEnd);
  });
  endTimer=setTimeout(()=>{if(ticket===epoch){stop();$('status').textContent='Finished. Play another option or choose your pick.';}},latestEnd*1000+80);
 }catch(e){if(ticket===epoch){stop();$('status').textContent='Could not play this sound. Tap Play to try again.';}}
}
function save(){try{localStorage.setItem(key,JSON.stringify(choices));return true;}catch{$('status').textContent='Browser storage is unavailable. Use Save choices before leaving.';return false;}}
function previewCard(row,o){
 const current=o.id==='current',picked=choice(row)===o.id,label=current?'Original sound':`${o.id.toUpperCase()} · ${o.title}`;
 return `<section class="preview-card ${current?'current':''} ${picked?'picked':''}"><h3>${esc(label)}</h3><p>${esc(current?'The sound from before this review.':o.description)}</p><div class="row"><button class="play" data-play="${o.id}">${current?'Play original':'Play '+o.id.toUpperCase()}</button><button class="choose" data-choice="${o.id}" aria-pressed="${picked}">${picked?'Chosen':current?'Keep original':'Choose '+o.id.toUpperCase()}</button></div>${current?'':`<p class="source">${esc(o.sourcePack)} · ${o.events[0].duration.toFixed(1)} sec</p>`}</section>`;
}
function render(){
 if(!rows.length){$('moment').textContent='The sound comparison is unavailable. Please refresh.';$('previous').disabled=$('next').disabled=$('export').disabled=true;return;}
 page=Math.min(rows.length-1,Math.max(0,page));const row=rows[page],c=choice(row);
 $('position').textContent=`${page+1} / ${rows.length}`;$('previous').disabled=page===0;$('next').disabled=page===rows.length-1;
 $('progress').textContent=`${rows.filter(r=>choice(r)).length} / ${rows.length} choices saved on this device`;
 $('jump-buttons').innerHTML=rows.map((r,i)=>`<button data-jump="${i}" class="${choice(r)?'done':''}" aria-current="${page===i}">${i+1}. ${esc(r.title)}</button>`).join('');
 const end=rows.find(r=>r.id==='drumroll-end'),endPick=choice(end),endName=endPick==='silent'?'silence':end.options.find(o=>o.id===(endPick||end.defaultPreviewOption))?.title||'original ending';
 $('moment').innerHTML=`<h2>${esc(row.title)}</h2><p class="description">${esc(row.description)}</p>${example(row)}${row.id==='drumroll'?`<p class="pair-note">Options A–${row.options.at(-1).id.toUpperCase()} include <strong>${esc(endName)}</strong> after the build. ${!endPick&&end.defaultPreviewOption?'This is only a preview; no ending is selected yet. ':''}Choose the ending separately on the next page.</p>`:''}${row.id==='drumroll-end'?'<p class="pair-note">This is just the final accent. Your build choice is saved separately.</p>':''}${previewCard(row,{id:'current'})}${row.options.map(o=>previewCard(row,o)).join('')}<p class="choice-hint">Playing doesn’t select an option. Your pick is highlighted in green.</p><div class="other-choices"><button data-choice="none" aria-pressed="${c==='none'}" class="${c==='none'?'selected':''}">More options</button><button data-choice="silent" aria-pressed="${c==='silent'}" class="${c==='silent'?'selected':''}">No sound</button><button data-choice="clear">Undo</button></div>`;
 document.querySelectorAll('.example img').forEach(img=>img.addEventListener('error',()=>{$('status').textContent='An example image could not load.';},{once:true}));
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.play)play(b.dataset.play);
 if(b.dataset.choice){stop();const r=rows[page],c=b.dataset.choice;if(c==='clear')delete choices[r.id];else if(validChoice(r,c))choices[r.id]={choice:c,fingerprint:r.fingerprint,optionsFingerprint:r.optionsFingerprint};const saved=save();render();if(saved)$('status').textContent=c==='clear'?'Choice cleared.':c==='none'?'Saved: find more options for this moment.':c==='silent'?'Saved: no sound for this moment.':'Choice saved. Use Next when you’re ready.';}
 if(b.dataset.jump!==undefined){stop();page=Number(b.dataset.jump);$('jump').open=false;render();window.scrollTo({top:0,behavior:'instant'});}
});
for(const [id,d]of [['previous',-1],['next',1]])$(id).onclick=()=>{stop();page+=d;render();$('status').textContent='';window.scrollTo({top:0,behavior:'instant'});};
$('stop').onclick=()=>{stop();$('status').textContent='Stopped.';};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);
$('export').onclick=()=>{
 const result={type:'size-em-up-sound-options',version:1,set,exportedAt:new Date().toISOString(),baselineExportedAt:data.baselineExportedAt,kept:data.kept,undecided:data.undecided,decisions:rows.map(r=>{const c=choice(r),o=r.options.find(o=>o.id===c);return {id:r.id,title:r.title,fingerprint:r.fingerprint,optionsFingerprint:r.optionsFingerprint,choice:c,optionTitle:o?.title||null,events:o?.events||null};})};
 const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=suspense?'size-em-up-suspense-options.json':'size-em-up-sound-options.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('status').textContent='Choices saved to a file. Send it back when you finish.';
};
$('import').onchange=async e=>{try{
 const file=e.target.files[0];if(!file)return;const input=JSON.parse(await file.text());
 if(input.type!=='size-em-up-sound-options'||input.version!==1||!Array.isArray(input.decisions))throw Error('Choose a sound-options export.');
 if((input.set||'original')!==set)throw Error('This file belongs to a different sound comparison.');
 const next={...choices},seen=new Set();
 for(const item of input.decisions){const row=rows.find(r=>r.id===item.id);if(!row||seen.has(item.id)||!(item.choice===null||validChoice(row,item.choice)))throw Error('Invalid sound choices.');seen.add(item.id);if(item.fingerprint!==row.fingerprint||item.optionsFingerprint!==row.optionsFingerprint)throw Error('These options have changed. Please review them again.');if(item.choice===null)delete next[item.id];else next[item.id]={choice:item.choice,fingerprint:row.fingerprint,optionsFingerprint:row.optionsFingerprint};}
 choices=next;const saved=save();render();if(saved)$('status').textContent='Choices loaded.';
 }catch(err){$('status').textContent=err.message;}finally{e.target.value='';}
};
render();if(rows.length)$('status').textContent=rows.some(r=>choice(r))?'Your saved choices are ready.':suspense?'Six new builds are ready. No replacement selected yet.':'Your original 16 Change choices are ready. No replacements selected yet.';
