// A discovery is recorded by the completed-round transaction, never by opening a question.
export function recordDiscoveries(profile, ids, {t=0, round='', session='', mode=''}={}) {
 const first={...profile.objectDiscoveries};
 for(const id of new Set(ids.filter(Boolean)))if(!profile.seenObjects?.[id]&&!first[id])first[id]={t:Number.isFinite(t)?t:0,round,session,mode};
 return first;
}
export function recentDiscoveries(profile, {session,limit=6,allowed}={}) {
 return Object.entries(profile.objectDiscoveries||{})
  .filter(([id,row])=>profile.seenObjects?.[id]&&(!allowed||allowed.has(id))&&(session===undefined||row.session===session))
  .sort((a,b)=>(b[1].t||0)-(a[1].t||0)||a[0].localeCompare(b[0]))
  .slice(0,limit).map(([id,row])=>({id,...row}));
}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function discoveryTiles(rows, object) {
 return rows.map(({id})=>{const o=object(id);return o?`<button type="button" class="discovery-thumb" data-id="${escape(id)}" aria-label="View ${escape(o.name)}"><img src="${escape(o.image)}" alt=""><span>${escape(o.name)}</span></button>`:'';}).join('');
}
export function createDiscoveryPresentation({profile,context,object,openObject,openObjects,reduced,document:doc=document}) {
 if(!doc.getElementById('discovery-styles')){const link=doc.createElement('link');link.id='discovery-styles';link.rel='stylesheet';link.href=new URL('./discoveries.css',import.meta.url).href;doc.head.append(link);}
 let queued=false,previousOwner=null,previousCount=null;
 function refresh(){
  queued=false;const p=profile(),count=Object.keys(p.data.seenObjects||{}).length;
  const counter=doc.querySelector('#items-screen.active [data-discovery-count]');
  if(p.owner===previousOwner&&previousCount!==null&&count>previousCount&&counter&&!reduced())counter.animate([{filter:'brightness(1)',scale:1},{filter:'brightness(1.15)',scale:1.07},{filter:'brightness(1)',scale:1}],{duration:550,easing:'ease-out'});
  // Keep the last visible total while playing, so opening Objects can celebrate
  // a newly increased count. Changing profile resets that comparison.
  if(counter||p.owner!==previousOwner){previousOwner=p.owner;previousCount=count;}
  const ctx=context();
  // Remove a strip if a result card is reused for a different session/owner.
  doc.querySelectorAll('.session-discoveries').forEach(el=>{if(!ctx||el.parentElement!==ctx.element||el.dataset.owner!==p.owner)el.remove();});
  if(!ctx?.element||!ctx.session)return;
  const rows=recentDiscoveries(p.data,{session:ctx.session,limit:1000}).filter(r=>object(r.id));
  const signature=p.owner+':'+ctx.session+':'+rows.map(r=>r.id).join('|');
  let strip=ctx.element.querySelector('.session-discoveries');
  if(!rows.length){strip?.remove();return;}
  if(strip?.dataset.signature===signature)return;
  if(!strip){strip=doc.createElement('div');strip.className='session-discoveries';ctx.element.append(strip);}
  strip.dataset.signature=signature;strip.dataset.owner=p.owner;
  strip.innerHTML=`<strong>${rows.length} new ${rows.length===1?'object':'objects'} discovered</strong><div class="discovery-grid">${discoveryTiles(rows.slice(0,3),object)}</div><button type="button" data-view-discoveries>View objects</button>${rows.length>3?`<small>And ${rows.length-3} more</small>`:''}`;
 }
 function schedule(){if(!queued){queued=true;queueMicrotask(refresh);}}
 const observer=new MutationObserver(schedule);observer.observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
 const click=e=>{const thumb=e.target.closest('.session-discoveries .discovery-thumb');if(thumb)openObject(thumb.dataset.id);if(e.target.closest('[data-view-discoveries]'))openObjects();};doc.addEventListener('click',click);
 refresh();return {refresh:schedule,destroy(){observer.disconnect();doc.removeEventListener('click',click);}};
}
