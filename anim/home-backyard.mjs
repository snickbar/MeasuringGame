// Reactions ride inside the existing flight path, so tapping never teleports
// a visitor or restarts its crossing. The only faster movement is in its wings.
export function installBackyardBugs(root,home,onTap){
  const media=matchMedia('(prefers-reduced-motion:reduce)'),entries=[];
  const visible=()=>root.isConnected&&!document.hidden&&home.classList.contains('active');
  const motion=()=>document.documentElement.dataset.motion!=='reduce'&&!media.matches;
  for(const route of root.querySelectorAll('.hs-route[data-critter-index]')){
    const body=route.querySelector('.hs-crit-img');if(!body)continue;
    const gesture=document.createElement('div');gesture.className='hs-bug-gesture';
    while(body.firstChild)gesture.appendChild(body.firstChild);body.appendChild(gesture);
    const hit=document.createElement('button');hit.type='button';hit.className='hs-bug-hit';
    const bee=route.dataset.critterIndex==='0';hit.setAttribute('aria-label',bee?'Make the bee flutter':'Make the butterfly flutter');
    // Use the actual visible artwork bounds rather than its transparent canvas.
    const bounds=bee?[319/1402,185/1122,889/1402,747/1122]:[52/1313,55/1198,1217/1313,1065/1198];
    hit.style.cssText=`left:${bounds[0]*100}%;top:${bounds[1]*100}%;width:${bounds[2]*100}%;height:${bounds[3]*100}%;`;
    body.appendChild(hit);route.classList.add('hs-tappable-bug');
    let animation=null,fast=[];
    const reset=()=>{
      const current=animation;animation=null;if(current){current.onfinish=null;current.cancel();}
      fast.forEach(([wing,speed])=>wing.updatePlaybackRate(speed));fast=[];delete route.dataset.reacting;
    };
    const react=e=>{
      e.preventDefault();e.stopPropagation();
      if(!visible()||animation)return;
      onTap();if(!motion())return;
      fast=[...gesture.querySelectorAll('.hs-wing,.hs-flight-wing')].flatMap(wing=>wing.getAnimations().map(a=>[a,a.playbackRate]));
      fast.forEach(([wing,speed])=>wing.updatePlaybackRate(speed*4));
      route.dataset.reacting='true';
      animation=gesture.animate([0,-10,3,-8,2,-4,0].map(y=>({transform:`translateY(${y}px)`,easing:'ease-in-out'})),{duration:1250,iterations:1});
      animation.onfinish=reset;
    };
    const click=e=>{e.preventDefault();e.stopPropagation();};
    const key=e=>{if(e.key==='Enter'||e.key===' '){react(e);}};
    hit.addEventListener('pointerdown',react);hit.addEventListener('click',click);hit.addEventListener('keydown',key);
    entries.push({reset,dispose(){reset();hit.removeEventListener('pointerdown',react);hit.removeEventListener('click',click);hit.removeEventListener('keydown',key);}});
  }
  const sync=()=>{if(!visible()||!motion())entries.forEach(e=>e.reset());};
  const observer=new MutationObserver(sync);observer.observe(home,{attributes:true,attributeFilter:['class']});observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
  document.addEventListener('visibilitychange',sync);media.addEventListener('change',sync);
  return()=>{entries.forEach(e=>e.dispose());observer.disconnect();document.removeEventListener('visibilitychange',sync);media.removeEventListener('change',sync);};
}
