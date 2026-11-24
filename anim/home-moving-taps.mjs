// A reaction lives inside the existing travel layer. Its path, direction and
// current position keep running while the object briefly gestures on a tap.
export function installMovingHomeTaps(root,home,onTap,definitions){
  const media=matchMedia('(prefers-reduced-motion:reduce)'),entries=[];
  const visible=()=>root.isConnected&&!document.hidden&&home.classList.contains('active');
  const motion=()=>document.documentElement.dataset.motion!=='reduce'&&!media.matches;
  for(const def of definitions)for(const route of root.querySelectorAll(def.selector)){
    const body=route.querySelector(def.body||'.hs-crit-img');if(!body)continue;
    const gesture=document.createElement('div');gesture.className='hs-moving-gesture'+(def.bug?' hs-bug-gesture':'');
    while(body.firstChild)gesture.appendChild(body.firstChild);body.appendChild(gesture);
    const hit=document.createElement('button');hit.type='button';hit.className='hs-moving-hit'+(def.bug?' hs-bug-hit':'');
    hit.setAttribute('aria-label',def.label);hit.dataset.subject=def.subject;
    const bounds=def.bounds;
    hit.style.cssText=`left:${bounds[0]*100}%;top:${bounds[1]*100}%;width:${bounds[2]*100}%;height:${bounds[3]*100}%;`;
    body.appendChild(hit);if(def.bug)route.classList.add('hs-tappable-bug');
    let animation=null,fast=[],frames=[];
    const reset=()=>{
      const current=animation;animation=null;if(current){current.onfinish=null;current.cancel();}
      frames.forEach(a=>a.cancel());frames=[];
      fast.forEach(([wing,speed])=>wing.updatePlaybackRate(speed));fast=[];delete route.dataset.reacting;
    };
    const react=e=>{
      e.preventDefault();e.stopPropagation();if(!visible()||animation)return;
      onTap();if(!motion())return;
      fast=[...gesture.querySelectorAll('.hs-wing,.hs-flight-wing')].flatMap(wing=>wing.getAnimations().map(a=>[a,a.playbackRate]));
      fast.forEach(([wing,speed])=>wing.updatePlaybackRate(speed*4));
      if(def.spriteFrames){
        const order=[0,1,2,3,2,1,0];
        frames=[...gesture.querySelectorAll('.hs-fxf')].map((cell,i)=>cell.animate(order.map((n,j)=>({offset:j/6,opacity:n===i?1:0,easing:'steps(1,end)'})),{duration:420,iterations:3}));
      }
      route.dataset.reacting='true';
      const keys=def.keyframes||[0,-10,3,-8,2,-4,0].map(y=>({transform:`translateY(${y}px)`,easing:'ease-in-out'}));
      animation=gesture.animate(keys,{duration:def.duration||1250,iterations:1});animation.onfinish=reset;
    };
    const click=e=>{e.preventDefault();e.stopPropagation();};
    const key=e=>{if(e.key==='Enter'||e.key===' ')react(e);};
    hit.addEventListener('pointerdown',react);hit.addEventListener('click',click);hit.addEventListener('keydown',key);
    entries.push({reset,dispose(){reset();hit.removeEventListener('pointerdown',react);hit.removeEventListener('click',click);hit.removeEventListener('keydown',key);}});
  }
  const sync=()=>{if(!visible()||!motion())entries.forEach(e=>e.reset());};
  const observer=new MutationObserver(sync);observer.observe(home,{attributes:true,attributeFilter:['class']});observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
  document.addEventListener('visibilitychange',sync);media.addEventListener('change',sync);
  return()=>{entries.forEach(e=>e.dispose());observer.disconnect();document.removeEventListener('visibilitychange',sync);media.removeEventListener('change',sync);};
}
