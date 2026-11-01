// Presentation only. Rewards and ownership are committed by the existing game code.
export function createUIDelight({screens, reduced, document:doc=document}) {
  const known=new Set(screens), active=new WeakMap(), shown=new WeakSet(), outcomes=new Set();
  const route=[];let queued=false;
  const unlockQueue=[];
  const rangeFill=el=>{const min=Number(el.min)||0,max=Number(el.max)||100;el.style.setProperty('--range-fill',`${Math.max(0,Math.min(100,(Number(el.value)-min)/(max-min)*100))}%`);};
  doc.addEventListener('input',e=>{if(e.target.matches?.('#settings-screen input[type=range]'))rangeFill(e.target);});
  // Tap sparkle: a few tiny stars pop out from the fingertip on the big buttons. Cosmetic only: it sits in its own click-through
  // layer, reads no layout and never delays the tap, which still fires on click exactly as before.
  const SPARK_TARGETS='.dc-btn,.sh-card,.home-tile,.menu-tile,.ach-claim';
  doc.addEventListener('pointerdown',e=>{
    if(reduced()||e.button>0)return;
    const b=e.target.closest?.(SPARK_TARGETS);
    if(!b||b.disabled)return;
    const layer=doc.createElement('div');
    layer.style.cssText='position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;z-index:99998';
    for(let i=0;i<5;i++){
      const st=doc.createElement('i'),a=(i/5)*Math.PI*2+Math.random()*.9,d=22+Math.random()*16;
      st.style.cssText=`position:absolute;left:${e.clientX-6}px;top:${e.clientY-6}px;width:13px;height:13px;background:#fff7cf;clip-path:polygon(50% 0,62% 36%,100% 38%,70% 60%,80% 100%,50% 76%,20% 100%,30% 60%,0 38%,38% 36%);opacity:0`;
      layer.appendChild(st);
      st.animate([{transform:'translate(0,0) scale(.3) rotate(0)',opacity:1},{transform:`translate(${Math.cos(a)*d*.7}px,${Math.sin(a)*d*.7-6}px) scale(1) rotate(70deg)`,opacity:1,offset:.55},{transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d-8}px) scale(.8) rotate(120deg)`,opacity:0}],{duration:420,easing:'ease-out',fill:'both'});
    }
    doc.body.appendChild(layer);
    setTimeout(()=>layer.remove(),520);
  },{passive:true,capture:true});
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
    dialog.showModal();use.focus({preventScroll:true});
    // Fade only. Scaling the picture inside the dialog made the whole card slide toward the bottom right on the phone (a compositing glitch with transforms inside a modal dialog), so nothing inside it moves.
    if(!reduced())mat.animate([{opacity:0},{opacity:1}],{duration:260,easing:'ease-out'});
  }
  return {unlock,destroy:()=>observer.disconnect()};
}
