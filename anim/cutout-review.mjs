const $=id=>document.getElementById(id),key='size-em-up-cutout-picks-v1',prefsKey=key+'-view',pageSize=6,backgrounds=['pair','white','magenta','dark','cyan','checker'];
let data,choices={},queue=[],page=0,zoomed,lastViewed,zoomLoading=false,markReadyAt=0,zoomTicket=0;
const known=()=>new Map(data.images.map(o=>[o.id,o]));
const exportData=()=>({type:'size-em-up-cutout-picks',version:1,exportedAt:new Date().toISOString(),images:data.images.map(o=>({id:o.id,name:o.name,image:o.image,sourceHash:o.sourceHash,decision:choices[o.id]?.decision||null,note:choices[o.id]?.note||''}))});
function validate(input){
 if(input?.type!=='size-em-up-cutout-picks'||input.version!==1||!Array.isArray(input.images)||input.images.length>data.images.length)throw Error('Choose a cutout-review export.');
 const objects=known(),seen=new Set(),result={};let outdated=0;
 for(const row of input.images){const o=objects.get(row.id);if(!o||seen.has(row.id))throw Error('Unknown or repeated image.');seen.add(row.id);
  if(![null,'fix','okay'].includes(row.decision)||typeof row.note!=='string'||row.note.length>500||typeof row.sourceHash!=='string')throw Error('Invalid decision or note.');
  const decision=row.sourceHash===o.sourceHash?row.decision:null;if(row.decision&&decision===null)outdated++;
  if(decision||row.note)result[row.id]={decision,note:row.note};
 }return{choices:result,outdated};
}
function progress(){const rows=Object.values(choices),reviewed=rows.filter(o=>o.decision).length,fix=rows.filter(o=>o.decision==='fix').length;$('progress').textContent=`${reviewed} / ${data.images.length} reviewed · ${fix} need fixing`;$('zoom-progress').textContent=`${reviewed} / ${data.images.length} checked`;}
function persist(){try{localStorage.setItem(key,JSON.stringify(exportData()));$('status').textContent='';}catch{$('status').textContent='Browser saving unavailable—export to keep your choices.';}progress();}
function preferences(){try{localStorage.setItem(prefsKey,JSON.stringify({first:queue[page*pageSize]?.id,background:$('background').value,lastViewed:lastViewed?.id,zoomBackground:$('zoom-bg').value,fullscreen:$('zoom').open}));}catch{}}
function surface(o,color){const div=document.createElement('div');div.className='surface '+color;const img=new Image();img.src='../'+o.image+'?v='+o.sourceHash.slice(0,12);img.alt='';img.loading='lazy';img.onerror=()=>{div.replaceChildren();const msg=document.createElement('span');msg.className='load-error';msg.textContent='Image did not load';div.append(msg);};div.append(img);return div;}
function decisions(o){const box=document.createElement('div');box.className='decisions';for(const [pick,label]of [['fix','Needs fixing'],['okay','Looks good']]){const b=document.createElement('button');b.dataset.id=o.id;b.dataset.pick=pick;b.textContent=label;b.setAttribute('aria-label',label+': '+o.name);b.setAttribute('aria-pressed',String(choices[o.id]?.decision===pick));b.onclick=()=>mark(o,pick);box.append(b);}return box;}
function mark(o,pick){const old=choices[o.id]||{};choices[o.id]={decision:old.decision===pick?null:pick,note:old.note||''};if(!choices[o.id].decision&&!choices[o.id].note)delete choices[o.id];persist();updateMarks();}
function updateMarks(){
 for(const card of document.querySelectorAll('article[data-id]')){card.classList.toggle('fix',choices[card.dataset.id]?.decision==='fix');card.classList.toggle('okay',choices[card.dataset.id]?.decision==='okay');}
 for(const b of document.querySelectorAll('button[data-pick]'))b.setAttribute('aria-pressed',String(choices[b.dataset.id]?.decision===b.dataset.pick));
}
function render(){const pages=Math.max(1,Math.ceil(queue.length/pageSize));page=Math.max(0,Math.min(page,pages-1));$('grid').replaceChildren();
 for(const o of queue.slice(page*pageSize,(page+1)*pageSize)){
  const card=document.createElement('article');card.dataset.id=o.id;const title=document.createElement('h2');title.textContent=o.name;title.title=o.name;
  const picture=document.createElement('button');picture.className='picture'+($('background').value==='pair'?' pair':'');picture.setAttribute('aria-label','Enlarge '+o.name);picture.onclick=()=>zoom(o);
  for(const color of $('background').value==='pair'?['white','magenta']:[$('background').value])picture.append(surface(o,color));
  card.append(title,picture,decisions(o));$('grid').append(card);
 }if(!queue.length){const empty=document.createElement('p');empty.className='empty';empty.textContent='No images match this filter.';$('grid').append(empty);}
 $('page').textContent=`Page ${page+1} / ${pages}`;$('prev').disabled=page===0;$('next').disabled=page===pages-1;progress();updateMarks();preferences();fitGrid();
 $('section-recheck').setAttribute('aria-pressed',String($('filter').value==='recheck'));$('section-all').setAttribute('aria-pressed',String($('filter').value==='all'));
}
function filteredImages(){const q=$('search').value.trim().toLowerCase(),f=$('filter').value;return data.images.filter(o=>(!q||`${o.name} ${o.id}`.toLowerCase().includes(q))&&(f==='all'||(f==='recheck'?o.reviewBatch===data.batch?.id:f==='unreviewed'?!choices[o.id]?.decision:choices[o.id]?.decision===f)));}
function filter(){queue=filteredImages();page=0;render();}
function fitGrid(){
 if(!matchMedia('(max-width:650px)').matches)return;const card=$('grid').querySelector('article');if(!card)return;
 const picture=card.querySelector('.picture'),overhead=card.getBoundingClientRect().height-picture.getBoundingClientRect().height,space=document.querySelector('.pager').getBoundingClientRect().top-$('grid').getBoundingClientRect().top;
 $('grid').style.setProperty('--thumb-height',Math.max(24,Math.min(120,Math.floor((space-14)/3-overhead)))+'px');
}
function zoom(o,keepBackground=false){
 zoomed=lastViewed=o;$('zoom-title').textContent=o.name;$('note').value=choices[o.id]?.note||'';
 $('cleanup-info').hidden=!o.reviewBatch;$('cleanup-note').textContent=o.cleanupNote||'';
 if(!keepBackground)$('zoom-bg').value=$('background').value==='pair'?'magenta':$('background').value;
 const i=queue.findIndex(x=>x.id===o.id);page=Math.floor(Math.max(0,i)/pageSize);render();
 $('zoom-position').textContent=`${i+1} / ${queue.length}`;$('zoom-back').disabled=i<=0;$('zoom-forward').disabled=i<0||i>=queue.length-1;
 const buttons=decisions(o);for(const b of buttons.children){b.textContent=b.dataset.pick==='fix'?'Fix':'Keep';b.setAttribute('aria-label',b.textContent+': '+o.name);b.onclick=()=>chooseZoom(b.dataset.pick);}
 $('zoom-decisions').replaceChildren(...buttons.children);renderZoom();if(!$('zoom').open)$('zoom').showModal();preferences();
}
function zoomStatus(){if(!zoomed)return;const pick=choices[zoomed.id]?.decision;$('zoom-status').textContent=zoomLoading?'Loading image…':pick==='fix'?'Marked: Fix':pick==='okay'?'Marked: Keep':'Not reviewed yet';}
function enableZoomDecision(){for(const b of $('zoom-decisions').children)b.disabled=zoomLoading||performance.now()<markReadyAt;}
function renderZoom(){
 if(!zoomed)return;const ticket=++zoomTicket;zoomLoading=true;enableZoomDecision();zoomStatus();$('zoom-picture').className='surface zoom-picture '+$('zoom-bg').value;
 const img=new Image();img.alt=zoomed.name;
 img.onload=()=>{if(ticket!==zoomTicket)return;zoomLoading=false;zoomStatus();enableZoomDecision();};
 img.onerror=()=>{if(ticket!==zoomTicket)return;zoomLoading=false;$('zoom-status').textContent='Image did not load. Try another image or reload.';for(const b of $('zoom-decisions').children)b.disabled=true;};
 img.src='../'+zoomed.image+'?v='+zoomed.sourceHash.slice(0,12);$('zoom-picture').replaceChildren(img);preferences();
}
function stepZoom(direction){const i=queue.findIndex(o=>o.id===zoomed?.id),next=queue[i+direction];if(next)zoom(next,true);}
function chooseZoom(pick){
 if(!zoomed||zoomLoading||performance.now()<markReadyAt)return;
 choices[zoomed.id]={decision:pick,note:choices[zoomed.id]?.note||''};persist();updateMarks();markReadyAt=performance.now()+220;
 const i=queue.findIndex(o=>o.id===zoomed.id);if(i<queue.length-1)stepZoom(1);else{zoomStatus();$('zoom-status').textContent+=' · Last image—choice saved';}
 enableZoomDecision();setTimeout(enableZoomDecision,230);
}
$('close').onclick=()=>$('zoom').close();$('zoom').addEventListener('close',preferences);$('zoom-bg').onchange=renderZoom;
$('zoom-back').onclick=()=>stepZoom(-1);$('zoom-forward').onclick=()=>stepZoom(1);
$('review').onclick=()=>{const o=queue.find(o=>o.id===lastViewed?.id)||queue.slice(page*pageSize).find(o=>!choices[o.id]?.decision)||queue[page*pageSize]||queue[0];if(o)zoom(o,true);};
$('zoom').addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();stepZoom(e.key==='ArrowLeft'?-1:1);}});
$('note').oninput=()=>{if(!zoomed)return;choices[zoomed.id]={decision:choices[zoomed.id]?.decision||null,note:$('note').value};persist();};
$('background').onchange=render;$('search').oninput=$('filter').onchange=filter;
$('section-recheck').onclick=()=>{$('search').value='';$('filter').value='recheck';filter();};$('section-all').onclick=()=>{$('search').value='';$('filter').value='all';filter();};
window.addEventListener('resize',fitGrid);
$('prev').onclick=()=>{page--;render();};$('next').onclick=()=>{page++;render();};
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(exportData(),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='size-em-up-cutout-picks.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('status').textContent='Exported—send me the file to fix the images you marked.';};
$('import').onclick=()=>$('file').click();$('file').onchange=async()=>{try{const text=await $('file').files[0]?.text();if(!text)return;const result=validate(JSON.parse(text));choices=result.choices;persist();filter();$('status').textContent=result.outdated?`${result.outdated} changed images need a fresh review.`:'Choices imported.';}catch(e){$('status').textContent='Import failed: '+e.message;}finally{$('file').value='';}};
try{
 const response=await fetch('./cutout-review-data.json',{cache:'no-store'});if(!response.ok)throw Error('Could not load artwork list.');data=await response.json();let message='';
 try{const saved=localStorage.getItem(key),input=saved?JSON.parse(saved):data.seedPicks;if(input){const result=validate(input);choices=result.choices;if(result.outdated)message=`${result.outdated} updated images are ready for another look.`;}}catch{message='Saved choices could not be restored. Import your last export to recover them.';}
 if(data.batch){$('batch-section').hidden=false;$('section-recheck').textContent=`Fixed—review again (${data.batch.count})`;$('filter').add(new Option('Fixed—review again','recheck'));$('filter').value=new URLSearchParams(location.search).get('section')==='all'?'all':'recheck';}
 queue=filteredImages();let reopen=false;try{const prefs=JSON.parse(localStorage.getItem(prefsKey)||'{}');if(backgrounds.includes(prefs.background))$('background').value=prefs.background;const index=queue.findIndex(o=>o.id===prefs.first);if(index>=0)page=Math.floor(index/pageSize);lastViewed=queue.find(o=>o.id===prefs.lastViewed);if(backgrounds.includes(prefs.zoomBackground)&&prefs.zoomBackground!=='pair')$('zoom-bg').value=prefs.zoomBackground;reopen=!!prefs.fullscreen;}catch{}
 $('export').disabled=$('import').disabled=$('review').disabled=false;render();$('status').textContent=message;fitGrid();if(reopen&&lastViewed)zoom(lastViewed,true);
 window.__cutoutReview={data,exportData,validate,getChoices:()=>structuredClone(choices)};window.__cutoutReviewReady=true;
}catch(e){$('progress').textContent='Could not open review: '+e.message;}
