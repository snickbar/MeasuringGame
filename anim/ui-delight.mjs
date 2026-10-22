// Presentation only. Rewards and ownership are committed by the existing game code.
export function createUIDelight({screens, reduced, document:doc=document}) {
  const known=new Set(screens), active=new WeakMap(), shown=new WeakSet(), outcomes=new Set();
  const route=[];let queued=false;
  const unlockQueue=[];
  const rangeFill=el=>{const min=Number(el.min)||0,max=Number(el.max)||100;el.style.setProperty('--range-fill',`${Math.max(0,Math.min(100,(Number(el.value)-min)/(max-min)*100))}%`);};
  doc.addEventListener('input',e=>{if(e.target.matches?.('#settings-screen input[type=range]'))rangeFill(e.target);});
  screens.forEach(s=>active.set(s,s.classList.contains('active')));
  const gameplay=new Set(['hud','hs-screen','final-screen','left-screen','ended-screen']);
  function refresh(){
    queued=false;
    doc.querySelectorAll('#settings-screen input[type=range]').forEach(rangeFill);
    for(const screen of screens){
      const on=screen.classList.contains('active'),was=active.get(screen);active.set(screen,on);
      if(on&&!was&&!reduced()&&!gameplay.has(screen.id)){
        const previous=route.indexOf(screen.id),back=previous>=0;
        if(back)route.splice(previous+1);else route.push(screen.id);
        screen.animate([{opacity:.35},{opacity:1}],{duration:180,easing:'ease-out'});
        const head=screen.querySelector('[id$="-content"],.settings-card')||screen.firstElementChild;
        if(head)head.animate([{translate:`${back?-7:7}px 0`},{translate:'0 0'}],{duration:180,easing:'ease-out'});
      }
      if(!on)continue;
      for(const card of screen.querySelectorAll('.dc-card.dc-hot,#final-session-recap')){
        if(shown.has(card))continue;shown.add(card);
        const key=screen.id+':'+(card.querySelector('[data-celebration-key]')?.dataset.celebrationKey||screen.querySelector('.dc-title')?.textContent||'')+':'+(card.querySelector('.dc-big')?.textContent||card.id);
        if(outcomes.has(key))continue;outcomes.add(key);
        if(!reduced()){
          card.classList.add('result-arrival');
          [...card.children].forEach((child,i)=>child.style.setProperty('--result-delay',`${Math.min(i,3)*100}ms`));
        }
      }
    }
  }
  const observer=new MutationObserver(records=>{
    if(!records.some(r=>r.type==='childList'||known.has(r.target)))return;
    if(!queued){queued=true;requestAnimationFrame(refresh);}
  });
  observer.observe(doc.body,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
  refresh();
  async function unlock({name,image,equip,wide=false}){
    if(doc.getElementById('unlock-spotlight')){unlockQueue.push({name,image,equip,wide});return;}
    const previous=doc.activeElement,dialog=doc.createElement('dialog');dialog.id='unlock-spotlight';
    dialog.setAttribute('aria-labelledby','unlock-spotlight-title');
    const title=doc.createElement('h2');title.id='unlock-spotlight-title';title.textContent='Unlocked!';
    const mat=doc.createElement('div');mat.className='unlock-mat'+(wide?' unlock-wide':'');
    const art=doc.createElement('img');art.src=image;art.alt=name;mat.append(art);
    const label=doc.createElement('h3');label.textContent=name;
    const status=doc.createElement('p');status.setAttribute('role','status');
    const buttons=doc.createElement('div');buttons.className='unlock-actions';
    const use=doc.createElement('button');use.type='button';use.textContent='Equip';
    const keep=doc.createElement('button');keep.type='button';keep.textContent='Keep current';
    buttons.append(use,keep);dialog.append(title,mat,label,status,buttons);doc.body.append(dialog);
    dialog.addEventListener('close',()=>{dialog.remove();const next=unlockQueue.shift();if(next)unlock(next);else if(previous?.isConnected)previous.focus({preventScroll:true});},{once:true});
    keep.onclick=()=>dialog.close();
    use.onclick=async()=>{use.disabled=true;keep.disabled=true;try{await equip();dialog.close();}catch{status.textContent='Could not equip. Please try again.';use.disabled=false;keep.disabled=false;}};
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
    dialog.showModal();use.focus();
    if(!reduced())mat.animate([{scale:'.8',opacity:0},{scale:'1.05',opacity:1,offset:.7},{scale:'1',opacity:1}],{duration:450,easing:'ease-out'});
  }
  return {unlock,destroy:()=>observer.disconnect()};
}
