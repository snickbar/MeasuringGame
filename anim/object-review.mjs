import {createStackAnimation} from './stack-anim.js';
import {measurementQuestionPrompt} from './object-review-prompts.mjs';
import {MOTIONS,currentSettings,validateSettings,validatePicks,sameSettings} from './object-review-model.mjs';

const $=id=>document.getElementById(id),key='size-em-up-object-draft-v1',pageSize=30;
let data,latestCollection,draft={},selected,page=0,views={},generation=0,refreshTimer,invalid=false,displayUnit=1,reviewed=new Set(),activeRole='small';
const status=text=>$('status').textContent=text;
const chosen=o=>draft[o.id]||currentSettings(o);
const setting=o=>$('use-current').checked?currentSettings(o):chosen(o);
const exportData=()=>({type:'size-em-up-object-picks',version:1,exportedAt:new Date().toISOString(),reviewedIds:[...reviewed],objects:data.objects.map(o=>({id:o.id,name:o.name,current:currentSettings(o),settings:chosen(o)}))});
function persist(){
  try{localStorage.setItem(key,JSON.stringify(exportData()));status(`${reviewed.size} reviewed · ${Object.keys(draft).length} changed · saved`);}
  catch{status('Browser storage is unavailable. Export your choices to save them.');}
}
function filteredObjects(){
  const query=$('search').value.trim().toLowerCase();
  return data.objects.filter(o=>(!query||`${o.name} ${o.id} ${o.pack}`.toLowerCase().includes(query))&&(!$('group').value||o.group===$('group').value)&&(!$('dimension-filter').value||chosen(o).measurement.dimension===$('dimension-filter').value)&&(!$('new-objects').checked||o.collection?.startsWith('new-'))&&(!$('latest-objects').checked||o.collection===latestCollection)&&(!$('monthly-objects').checked||o.monthlyExpansion)&&(!$('changed').checked||draft[o.id])&&(!$('unreviewed').checked||!reviewed.has(o.id)));
}
function renderList(){
  const objects=filteredObjects();
  const pages=Math.max(1,Math.ceil(objects.length/pageSize));page=Math.min(page,pages-1);
  $('count').textContent=`${objects.length} of ${data.objects.length} objects · ${Object.keys(draft).length} changed`;
  $('list').replaceChildren();
  for(const o of objects.slice(page*pageSize,(page+1)*pageSize)){
    const b=document.createElement('button');b.className='object'+(draft[o.id]?' edited':'');b.dataset.id=o.id;b.setAttribute('aria-pressed',String(selected?.id===o.id));
    const img=new Image();img.src='../'+o.image;img.alt='';img.loading='lazy';const label=document.createElement('span');label.textContent=(reviewed.has(o.id)?'✓ ':'')+o.name;b.append(img,label);b.onclick=()=>selectObject(o,true);$('list').append(b);
  }
  if(!objects.length)$('list').textContent='No objects match these filters.';
  $('page').textContent=`${page+1} / ${pages}`;$('prev').disabled=page===0;$('next').disabled=page===pages-1;
  updateNav();
}
function updateNav(){
  const objects=filteredObjects(),i=objects.findIndex(o=>o.id===selected?.id);
  $('object-position').textContent=i>=0?`${i+1} / ${objects.length}`:'No match';
  $('previous-object').disabled=invalid||!objects.length||i===0;
  $('next-object').disabled=invalid||!objects.length||i===objects.length-1;
  $('approve-next').disabled=invalid||!selected;$('approve-next').title='Mark this object reviewed and move to the next unchecked object';
  $('review-progress').textContent=`· ${reviewed.size} / ${data.objects.length} checked`;
}
function summaries(){
  const s=chosen(selected),unit=s.mm>=1000?'m':s.mm>=10?'cm':'mm',n=s.mm/(unit==='m'?1000:unit==='cm'?10:1);
  const size=`${data.types[s.measurement.dimension].noun} · ${Number(n.toPrecision(8)).toLocaleString('en-US')} ${unit}`;
  $('object-facts').textContent=size+(reviewed.has(selected.id)?' · ✓ reviewed':'');$('size-summary').textContent=size;
  $('pose-summary').textContent=`${s.orientation.rot}° · left ${leanName(s.orientation.leanL)} · right ${leanName(s.orientation.leanR)}`;
}
function chooseRole(role){
  activeRole=role;const mobile=matchMedia('(max-width:650px)').matches;
  for(const r of ['small','big']){$('tab-'+r).setAttribute('aria-selected',String(r===role));$('tab-'+r).tabIndex=r===role?0:-1;const panel=$('panel-'+r);panel.classList.toggle('active-role',r===role);panel.inert=mobile&&r!==role;panel.setAttribute('aria-hidden',String(mobile&&r!==role));$('question-'+r).hidden=mobile&&r!==role;}
}
function moveObject(direction){const objects=filteredObjects(),i=objects.findIndex(o=>o.id===selected?.id);const next=objects[i<0?0:i+direction];if(next)selectObject(next,true);}
function approveNext(){
  if(!selected||invalid)return;const objects=filteredObjects(),i=objects.findIndex(o=>o.id===selected.id);reviewed.add(selected.id);persist();
  const next=objects.slice(i+1).find(o=>!reviewed.has(o.id))||objects.find(o=>!reviewed.has(o.id));
  if(next)selectObject(next,true);else{renderList();summaries();status(`All ${objects.length} matching objects reviewed · choices saved`);}
}
const leanName=value=>({none:'no turn',cw:'clockwise turn',ccw:'counterclockwise turn'})[value];
function fillControls(){
  const s=chosen(selected),c=currentSettings(selected),r=s.orientation;
  $('rot').value=r.rot;$('mirror-small').checked=r.flip;$('mirror-big').checked=r.flip!==r.mirR;
  $('lean-small').value=r.leanL;$('lean-big').value=r.leanR;$('motion-small').value=s.motionSmall;$('motion-big').value=s.motionBig;
  $('dimension').value=s.measurement.dimension;
  $('units').value=s.mm>=1000?'1000':s.mm>=10?'10':'1';displayUnit=Number($('units').value);$('size').value=Number((s.mm/displayUnit).toPrecision(12));
  $('qualifier').value=s.measurement.qualifier||'';$('subject').value=s.measurement.subject||'';
  $('current-rot').textContent=`Current: ${c.orientation.rot}° starting rotation.`;
  for(const role of ['small','big']){
    const right=role==='big',mirrored=right?c.orientation.flip!==c.orientation.mirR:c.orientation.flip;
    $('current-'+role).textContent=`Current: ${mirrored?'mirrored':'not mirrored'} · ${leanName(right?c.orientation.leanR:c.orientation.leanL)} · ${MOTIONS[right?c.motionBig:c.motionSmall]}.`;
  }
  $('current-measurement').textContent=`Current: ${data.types[c.measurement.dimension].noun} · ${c.mm.toLocaleString('en-US')} mm${c.measurement.qualifier?' · '+c.measurement.qualifier:''}${c.measurement.subject?' · '+c.measurement.subject:''}.`;
  $('reset-object').disabled=$('reset-inline').disabled=!draft[selected.id];$('measurement-error').textContent='';invalid=false;$('export').disabled=false;summaries();
}
function pairOptions(){
  const mm=setting(selected).mm;
  for(const role of ['small','big']){
    const select=$(role+'-pair'),previous=select.value;select.replaceChildren(new Option('Automatic comparison (~5×)','auto'),new Option('Reference ruler · exact 5× comparison','ruler'));
    for(const o of data.objects)if(o.id!==selected.id&&(role==='small'?o.mm>mm:o.mm<mm))select.add(new Option(o.name,o.id));
    select.value=[...select.options].some(o=>o.value===previous)?previous:'auto';
  }
}
function selectObject(o,scroll=false){
  selected=o;clearTimeout(refreshTimer);$('editor').hidden=false;$('name').textContent=o.name;$('meta').textContent=`${o.group}${o.pack?' · '+o.pack:''} · ${o.scenery} scenery`;
  $('use-current').checked=false;$('alt').checked=false;$('alt-wrap').hidden=!o.alternateImage;$('raw').src='../'+o.image;
  fillControls();pairOptions();renderList();refresh(true);
  try{localStorage.setItem(key+'-last',o.id);}catch{}
  if(scroll&&matchMedia('(max-width:650px)').matches){$('browse').open=false;requestAnimationFrame(()=>$('editor').scrollIntoView({block:'start'}));}
}
function edit(event){
  const mirroredLeft=$('mirror-small').checked,mirroredRight=$('mirror-big').checked;
  const value={mm:Number($('size').value)*Number($('units').value),measurement:{dimension:$('dimension').value,qualifier:$('qualifier').value,subject:$('subject').value},orientation:{rot:Number($('rot').value),flip:mirroredLeft,mirR:mirroredLeft!==mirroredRight,leanL:$('lean-small').value,leanR:$('lean-big').value},motionSmall:$('motion-small').value,motionBig:$('motion-big').value};
  try{
    const valid=validateSettings(value,data.types),settingsChanged=!sameSettings(valid,validateSettings(chosen(selected),data.types));invalid=false;$('measurement-error').textContent='';$('export').disabled=false;
    // Editing always previews the draft, even after comparing the saved game settings.
    $('use-current').checked=false;
    const control=event?.target?.id||'',behaviorEdit=/^(rot$|mirror-|lean-|motion-)/.test(control),role=control.match(/-(small|big)$/)?.[1];
    if(role)chooseRole(role);
    if(sameSettings(valid,validateSettings(currentSettings(selected),data.types)))delete draft[selected.id];else draft[selected.id]=valid;
    if(settingsChanged)reviewed.delete(selected.id);$('reset-object').disabled=$('reset-inline').disabled=!draft[selected.id];persist();renderList();summaries();
    clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{pairOptions();refresh(behaviorEdit);},350);
  }catch{invalid=true;$('measurement-settings').open=true;$('measurement-error').textContent='Enter a positive measurement before continuing. The last valid draft is still saved.';$('export').disabled=true;updateNav();}
}
const rulerImage='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="45" height="240"><rect x="2" y="2" width="41" height="236" rx="5" fill="#f4cc75" stroke="#77502a" stroke-width="4"/><path d="M4 20h22M4 40h12M4 60h22M4 80h12M4 100h22M4 120h12M4 140h22M4 160h12M4 180h22M4 200h12M4 220h22" stroke="#77502a" stroke-width="3"/></svg>');
function comparison(role,object){
  const requested=$(role+'-pair').value;
  let companion=requested!=='auto'&&requested!=='ruler'?data.objects.find(o=>o.id===requested):null;
  if(requested==='auto'){
    const candidates=data.objects.filter(o=>o.id!==object.id&&(role==='small'?o.mm>object.mm:o.mm<object.mm));
    companion=candidates.sort((a,b)=>Math.abs(Math.log((role==='small'?a.mm/object.mm:object.mm/a.mm)/5))-Math.abs(Math.log((role==='small'?b.mm/object.mm:object.mm/b.mm)/5)))[0];
  }
  if(!companion)companion={id:'review-reference',name:'reference ruler',plural:'reference rulers',mm:object.mm*(role==='small'?5:1/5),image:rulerImage,measurement:{dimension:'length'}};
  return role==='small'?[object,companion]:[companion,object];
}
function transport(role,time){const v=views[role];if(!v)return;$(role+'-time').value=Math.round(time/v.scene.duration*1000);$(role+'-clock').textContent=`${time.toFixed(1)}s`;}
function play(role){const v=views[role];if(!v)return;v.anim.start(v.scene,{onFrame:t=>transport(role,t),onDone:()=>transport(role,v.scene.duration)});}
function enablePreview(enabled){for(const role of ['small','big'])for(const action of ['play','end','time'])$(role+'-'+action).disabled=!enabled;$('play-both').disabled=!enabled;}
async function refresh(autoplay=false){
  if(!selected||invalid)return;
  const ticket=++generation;clearTimeout(refreshTimer);for(const v of Object.values(views))v.anim.destroy();views={};enablePreview(false);
  $('preview-status').textContent='Loading both reveals…';
  const object={...selected,...setting(selected)};if($('alt').checked)object.image=selected.alternateImage;
  for(const role of ['small','big']){
    const right=role==='big',r=object.orientation,mirrored=right?r.flip!==r.mirR:r.flip;
    $(role+'-behavior').textContent=`${$('use-current').checked?'Original':'Draft'} · ${leanName(right?r.leanR:r.leanL)} · ${mirrored?'mirrored':'not mirrored'}`;
  }
  $('raw').src='../'+object.image;
  const pairs={small:comparison('small',object),big:comparison('big',object)};
  $('wording-small').textContent=measurementQuestionPrompt(...pairs.small);$('wording-big').textContent=measurementQuestionPrompt(...pairs.big);
  const results=await Promise.allSettled(['small','big'].map(async role=>{
    const [unit,target]=pairs[role],mount=document.createElement('div');$(role+'-stage').replaceChildren(mount);
    const anim=createStackAnimation(mount,{reduceMotion:false,imageUrl:o=>o.image.startsWith('data:')?o.image:'../'+o.image,orientationFor:o=>o.id===object.id?object.orientation:o.orientation||{rot:0,flip:false,leanL:'none',leanR:'none',mirR:false},motionFor:(o,right)=>o.id===object.id?(right?object.motionBig:object.motionSmall):(right?o.motionBig:o.motionSmall)||'slide'});
    try{
      const scene=await anim.prepare(unit,target,matchMedia('(max-width:650px)').matches?{hMax:155,minStageH:210}:{hMax:230,minStageH:285});
      if(ticket!==generation){anim.destroy();return;}
      views[role]={anim,scene};scene.renderEnd();transport(role,scene.duration);
      const companion=role==='small'?target:unit;
      $(role+'-note').textContent=`${companion.id==='review-reference'?'Illustrative ruler comparison':`Compared with ${companion.name}`} · ${(target.mm/unit.mm).toLocaleString('en-US',{maximumFractionDigits:2})}×. ${$('use-current').checked?'Current game settings.':'Your draft settings.'}`;
      if(autoplay)play(role);
    }catch(e){anim.destroy();throw e;}
  }));
  if(ticket!==generation)return;
  const failed=results.find(r=>r.status==='rejected');
  $('preview-status').textContent=failed?'Preview could not load: '+failed.reason.message:'Ready · replay or scrub to inspect';
  enablePreview(!failed);
}
for(const role of ['small','big']){
  $(role+'-play').onclick=()=>play(role);
  $(role+'-end').onclick=()=>{const v=views[role];if(v){v.anim.stop();v.scene.renderEnd();transport(role,v.scene.duration);}};
  $(role+'-time').oninput=()=>{const v=views[role];if(v){v.anim.stop();const t=Number($(role+'-time').value)/1000*v.scene.duration;v.scene.render(t);transport(role,t);}};
  $(role+'-pair').onchange=()=>refresh(true);
}
$('play-both').onclick=()=>{play('small');play('big');};$('refresh').onclick=()=>refresh(false);
$('use-current').onchange=()=>{pairOptions();refresh(true);};$('alt').onchange=()=>refresh(true);
$('reset-object').onclick=()=>{if(draft[selected.id])reviewed.delete(selected.id);delete draft[selected.id];persist();fillControls();pairOptions();renderList();refresh(false);};
$('reset-inline').onclick=()=>$('reset-object').click();
$('previous-object').onclick=()=>moveObject(-1);$('next-object').onclick=()=>moveObject(1);$('approve-next').onclick=approveNext;
for(const role of ['small','big'])$('tab-'+role).onclick=()=>chooseRole(role);
document.querySelector('.role-tabs').onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();chooseRole(activeRole==='small'?'big':'small');$('tab-'+activeRole).focus();}};
for(const id of ['rot','mirror-small','mirror-big','lean-small','lean-big','motion-small','motion-big','dimension','units'])$(id).onchange=edit;
$('units').onchange=()=>{const nextUnit=Number($('units').value);$('size').value=Number((Number($('size').value)*displayUnit/nextUnit).toPrecision(12));displayUnit=nextUnit;edit();};
for(const id of ['size','qualifier','subject'])$(id).oninput=edit;
for(const id of ['search','group','dimension-filter','changed','unreviewed','new-objects','latest-objects','monthly-objects'])$(id).addEventListener(id==='search'?'input':'change',()=>{if(['new-objects','latest-objects','monthly-objects'].includes(id)&&$(id).checked)for(const other of ['new-objects','latest-objects','monthly-objects'])if(other!==id)$(other).checked=false;page=0;renderList();});
$('prev').onclick=()=>{page--;renderList();};$('next').onclick=()=>{page++;renderList();};
$('export').onclick=()=>{if(invalid)return;const url=URL.createObjectURL(new Blob([JSON.stringify(exportData(),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='size-em-up-object-picks.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Choices exported. Send me the JSON file when you’re ready to apply them.');};
$('import').onclick=()=>$('file').click();$('file').onchange=async()=>{try{const text=await $('file').files[0]?.text();if(!text)return;const input=JSON.parse(text),next=validatePicks(input,data);draft=next;reviewed=new Set((input.reviewedIds||[]).filter(id=>data.objects.some(o=>o.id===id)));persist();if(selected)selectObject(selected);renderList();}catch(e){status('Import failed: '+e.message);}finally{$('file').value='';}};
let resizeTimer;window.addEventListener('resize',()=>{chooseRole(activeRole);clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>refresh(false),250);});
try{
  const response=await fetch('./object-review-data.json',{cache:'no-store'});if(!response.ok)throw Error('Could not load object catalog');data=await response.json();
  latestCollection=data.objects.map(o=>o.collection).filter(c=>c?.startsWith('new-')).sort().at(-1);
  $('latest-count').textContent=data.objects.filter(o=>o.collection===latestCollection).length;
  $('new-count').textContent=data.objects.filter(o=>o.collection?.startsWith('new-')).length;
  for(const [id,type]of Object.entries(data.types)){ $('dimension').add(new Option(type.noun,id));$('dimension-filter').add(new Option(type.noun,id)); }
  for(const role of ['small','big'])for(const [id,name]of Object.entries(MOTIONS))$('motion-'+role).add(new Option(name,id));
  let restoreError='';try{const saved=localStorage.getItem(key);if(saved){const input=JSON.parse(saved);draft=validatePicks(input,data);reviewed=new Set((input.reviewedIds||[]).filter(id=>data.objects.some(o=>o.id===id)));}}catch{restoreError='Saved draft could not be restored. Import your last export to recover it.';}
  $('new-objects').checked=new URLSearchParams(location.search).get('collection')==='new';
  $('latest-objects').checked=new URLSearchParams(location.search).get('collection')==='latest';
  $('monthly-objects').checked=new URLSearchParams(location.search).get('collection')==='monthly';
  $('export').disabled=$('import').disabled=false;renderList();
  let last;try{last=localStorage.getItem(key+'-last');}catch{}
  $('browse').open=!matchMedia('(max-width:650px)').matches;chooseRole(activeRole);
  selectObject(filteredObjects().find(o=>o.id===(new URLSearchParams(location.search).get('object')||last))||filteredObjects()[0]||data.objects[0]);
  status(restoreError||`${reviewed.size} reviewed · ${Object.keys(draft).length} changed · auto-saves`);
  window.__objectReview={data,exportData,validatePicks:input=>validatePicks(input,data),select:id=>selectObject(data.objects.find(o=>o.id===id)),getDraft:()=>structuredClone(draft),getViews:()=>views};window.__objectReviewReady=true;
}catch(e){status('Could not open the workshop: '+e.message);}
