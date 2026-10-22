import {initialChoices,validateChoices,swapAvatars} from './avatar-tier-choices.mjs';
const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const data=await fetch('./avatar-tier-review-data.json').then(r=>{if(!r.ok)throw Error('Avatars could not load');return r.json();}).catch(e=>{$('status').textContent=e.message;return {items:[]};});
const byId=new Map(data.items.map(r=>[r.id,r])),key='size-em-up-avatar-tiers-v1';let items=initialChoices(data),filter='all',page=0,all=false,swapping=null;
try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved)items=validateChoices(data,saved);}catch{}
const exportData=()=>({type:'size-em-up-avatar-tiers',version:1,fingerprint:data.fingerprint,exportedAt:new Date().toISOString(),items});
function save(){try{localStorage.setItem(key,JSON.stringify(exportData()));}catch{$('status').textContent='Use Save choices before leaving; browser storage is unavailable.';}}
function render(){const list=items.filter(r=>filter==='all'||filter==='new'&&byId.get(r.id).new||r.tier===filter),size=all?Math.max(1,list.length):18,pages=Math.max(1,Math.ceil(list.length/size));page=Math.min(page,pages-1);
 $('avatars').innerHTML=list.slice(page*size,(page+1)*size).map(r=>{const original=byId.get(r.id),name=original.name.replace(/([a-z])([A-Z])/g,'$1 $2');return `<article class="avatar-card ${swapping===r.id?'swapping':''}"><span class="tier">${r.tier==='default'?'Default Â· free':'Common'}</span><button class="zoom" data-zoom="${r.id}" aria-label="Enlarge ${esc(name)}"><img src="../${original.image}" alt="${esc(name)}" loading="lazy"></button><h2 title="${esc(name)}">${esc(name)}</h2><div class="id">${r.id}${original.new?'<span class="new">NEW</span>':''}</div><div class="avatar-actions"><button data-id="${r.id}" data-tier="${r.tier==='default'?'common':'default'}">Make ${r.tier==='default'?'Common':'Default'}</button></div><button class="swap" data-swap="${r.id}">${swapping===r.id?'Cancel swap':swapping?'Swap here':'Swap'}</button></article>`;}).join('')||'<p>No avatars in this view.</p>';
 $('position').textContent=`${page+1} / ${pages}`;$('previous').disabled=page===0;$('next').disabled=page===pages-1;$('view').textContent=all?'Use pages':'View all';
 $('counts').textContent=`${items.filter(r=>r.tier==='default').length} Default Â· ${items.filter(r=>r.tier==='common').length} Common Â· ${list.length} in this view`;
 document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.filter){filter=b.dataset.filter;page=0;render();}
 if(b.dataset.tier){items=items.map(r=>r.id===b.dataset.id?{...r,tier:b.dataset.tier}:r);save();render();$('status').textContent='Choice saved on this browser.';}
 if(b.dataset.swap){if(swapping===b.dataset.swap){swapping=null;$('status').textContent='Swap canceled.';}else if(!swapping){swapping=b.dataset.swap;$('status').textContent='Now tap Swap here on the other avatar. You can change pages or groups.';}else{items=swapAvatars(items,swapping,b.dataset.swap);swapping=null;save();$('status').textContent='Their places and groups have been exchanged.';}render();}
 if(b.dataset.zoom){const r=byId.get(b.dataset.zoom);$('zoom-image').src='../'+r.image;$('zoom-image').alt=r.name;$('zoom-name').textContent=r.name;$('zoom').showModal();}
});
for(const [id,n]of [['previous',-1],['next',1]])$(id).onclick=()=>{page+=n;render();window.scrollTo({top:0,behavior:'instant'});};
$('view').onclick=()=>{all=!all;page=0;render();};$('close').onclick=()=>$('zoom').close();
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(exportData(),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='size-em-up-avatar-tiers.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('status').textContent='Choices downloaded. Send the file back to apply them.';};
$('import').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;items=validateChoices(data,JSON.parse(await f.text()));swapping=null;save();render();$('status').textContent='Choices loaded.';}catch(err){$('status').textContent=err.message;}finally{e.target.value='';}};
render();if(data.items.length)$('status').textContent='Your choices stay here until you save and send them back.';
