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
export function createDiscoveryPresentation({profile,context,object,reduced,document:doc=document}) {
 if(!doc.getElementById('discovery-styles')){const link=doc.createElement('link');link.id='discovery-styles';link.rel='stylesheet';link.href=new URL('./discoveries.css',import.meta.url).href;doc.head.append(link);}
 let queued=false,previousOwner=null,previousCount=null,popup=null;
 const resize=typeof ResizeObserver==='function'?new ResizeObserver(()=>schedule()):null;
 function closePopup(){popup?.dialog.close();}
 function showPopup(rows,ctx,owner,opener,selected=null){
  if(popup){popup.dialog.querySelector('[data-discovery-close]').focus();return;}
  const dialog=doc.createElement('dialog');dialog.id='session-discovery-popup';dialog.setAttribute('aria-labelledby','session-discovery-title');
  dialog.innerHTML=`<header><h2 id="session-discovery-title">New objects this game</h2><button type="button" class="discovery-popup-x" data-discovery-close aria-label="Close new objects"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></button></header><div class="discovery-popup-content"></div><footer><button type="button" data-discovery-close>Close</button></footer>`;
  const content=dialog.querySelector('.discovery-popup-content');
  function render(id){
   const o=id&&rows.some(r=>r.id===id)&&object(id);
   content.innerHTML=o?`<button type="button" class="discovery-popup-back" data-discovery-back>All new objects</button><div class="discovery-popup-detail"><img src="${escape(o.image)}" alt=""><h3>${escape(o.name)}</h3></div>`:`<p>${rows.length} new ${rows.length===1?'object':'objects'} discovered</p><div class="discovery-grid">${discoveryTiles(rows,object)}</div>`;
  }
  render(selected);doc.body.append(dialog);popup={dialog,owner,session:ctx.session,element:ctx.element};
  dialog.addEventListener('click',e=>{
   if(e.target.closest('[data-discovery-close]')){dialog.close();return;}
   if(e.target.closest('[data-discovery-back]')){render();content.querySelector('button')?.focus();return;}
   const thumb=e.target.closest('.discovery-thumb');if(thumb){render(thumb.dataset.id);content.querySelector('[data-discovery-back]').focus();return;}
   if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}
  });
  dialog.addEventListener('close',()=>{dialog.remove();if(popup?.dialog===dialog)popup=null;const current=context();if(current?.session===ctx.session){let target=opener?.isConnected?opener:current.element?.querySelector('[data-view-discoveries]');if(target?.closest('[inert]'))target=doc.querySelector('#coin-reward-screen:not([hidden]) button:not(:disabled)');target?.focus({preventScroll:true});}},{once:true});
  dialog.showModal();dialog.querySelector('[data-discovery-close]').focus();
 }
 function refresh(){
  queued=false;const p=profile(),count=Object.keys(p.data.seenObjects||{}).length;
  const counter=doc.querySelector('#items-screen.active [data-discovery-count]');
  if(p.owner===previousOwner&&previousCount!==null&&count>previousCount&&counter&&!reduced())counter.animate([{filter:'brightness(1)',scale:1},{filter:'brightness(1.15)',scale:1.07},{filter:'brightness(1)',scale:1}],{duration:550,easing:'ease-out'});
  // Keep the last visible total while playing, so opening Objects can celebrate
  // a newly increased count. Changing profile resets that comparison.
  if(counter||p.owner!==previousOwner){previousOwner=p.owner;previousCount=count;}
  const ctx=context();
  if(popup&&(popup.owner!==p.owner||popup.session!==ctx?.session||popup.element!==ctx?.element))closePopup();
  // Remove a strip if a result card is reused for a different session/owner.
  doc.querySelectorAll('.session-discoveries').forEach(el=>{if(!ctx||el.parentElement!==ctx.element||el.dataset.owner!==p.owner){resize?.unobserve(el);el.remove();}});
  if(!ctx?.element||!ctx.session)return;
  const rows=recentDiscoveries(p.data,{session:ctx.session,limit:1000}).filter(r=>object(r.id));
  let strip=ctx.element.querySelector('.session-discoveries');
  if(!rows.length){if(strip){resize?.unobserve(strip);strip.remove();}return;}
  if(!strip){strip=doc.createElement('div');strip.className='session-discoveries';ctx.element.append(strip);resize?.observe(strip);}
  const columns=Math.max(1,Math.floor((strip.clientWidth+6)/50));
  const visible=rows.slice(0,columns*2),remaining=rows.length-visible.length;
  const signature=p.owner+':'+ctx.session+':'+columns+':'+rows.map(r=>r.id).join('|');
  if(strip.dataset.signature===signature)return;
  strip.dataset.signature=signature;strip.dataset.owner=p.owner;
  strip.style.setProperty('--discovery-cols',columns);
  strip.innerHTML=`<strong>${rows.length} new ${rows.length===1?'object':'objects'} discovered</strong><button type="button" data-view-discoveries>View objects</button><div class="discovery-grid">${discoveryTiles(visible,object)}</div>${remaining?`<small>And ${remaining} more in View objects</small>`:''}`;
 }
 function schedule(){if(!queued){queued=true;queueMicrotask(refresh);}}
 const observer=new MutationObserver(schedule);observer.observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
 const click=e=>{const trigger=e.target.closest('.session-discoveries .discovery-thumb,.session-discoveries [data-view-discoveries]');if(!trigger)return;const p=profile(),ctx=context();if(!ctx?.element||!ctx.element.contains(trigger))return;const rows=recentDiscoveries(p.data,{session:ctx.session,limit:1000}).filter(r=>object(r.id));if(rows.length)showPopup(rows,ctx,p.owner,trigger,trigger.matches('.discovery-thumb')?trigger.dataset.id:null);};doc.addEventListener('click',click);
 refresh();return {refresh:schedule,destroy(){observer.disconnect();resize?.disconnect();doc.removeEventListener('click',click);closePopup();}};
}
