import {artCell} from './home-layer-art.mjs';
import {STORY_ART} from './home-stories-art.mjs';
const ref={sw:704,sh:1520};
const el=(cls,parent)=>{const node=document.createElement('div');node.className=cls;parent?.appendChild(node);return node;};
const rect=(node,[x,y,w,h],spec=ref)=>{node.style.cssText+=`left:${x/spec.sw*100}%;top:${y/spec.sh*100}%;width:${w/spec.sw*100}%;height:${h/spec.sh*100}%;`;return node;};
function sprite(parent,image,crop,box,spec,cls){const node=artCell(image,crop,box,spec,cls);parent.appendChild(node);return node;}
function robotLegs(parent){
  // Two articulated links solve to the pedal at each crank angle. CSS performs
  // the interpolation, so no per-frame JS or detached knee/ankle sprites.
  const style=document.createElement('style');let css='';
  for(let side=0;side<2;side++){
    const thigh=rect(el('hs-cycle-thigh hs-cycle-leg-'+side,parent),[528.2,500,42,260],{sw:1000,sh:1200});
    const shin=el('hs-cycle-shin',thigh);el('hs-cycle-foot',shin);
    let upper='',lower='';
    for(let i=0;i<=32;i++){
      const a=i/32*Math.PI*2+side*Math.PI,dx=Math.cos(a)*55,dy=407+Math.sin(a)*55,d=Math.hypot(dx,dy);
      const bend=Math.acos(Math.min(1,d/520)),direction=Math.atan2(dy,dx),u=direction-bend;
      const kx=Math.cos(u)*260,ky=Math.sin(u)*260,l=Math.atan2(dy-ky,dx-kx)-u;
      upper+=`${i/32*100}%{transform:rotate(${u*180/Math.PI-90}deg)}`;
      lower+=`${i/32*100}%{transform:rotate(${l*180/Math.PI}deg)}`;
    }
    css+=`@keyframes hsPedalUpper${side}{${upper}}@keyframes hsPedalLower${side}{${lower}}`;
  }
  style.textContent=css;parent.appendChild(style);
}
export function decorateHomeStories(root,home,scene,extras){
  if(!['wheels','toy-box','make-believe','games'].includes(scene))return()=>{};
  const stage=root.querySelector('.hs-stage'),back=el('hs-story-background');stage.insertBefore(back,stage.querySelector('.hs-layer'));
  let cleanup=()=>{};
  if(scene==='wheels'){
    const route=el('hs-route hs-bidirectional hs-cycle-route',back);route.style.cssText='--cs:30s;--cd:-3s';
    const rider=el('hs-cycle-travel',route),spec={sw:1000,sh:1200},image=extras.get('stories/rider.webp');
    sprite(rider,image,STORY_ART.rider[1],[303.2,682,450,450],spec,'hs-cycle-wheel');
    robotLegs(rider);
    sprite(rider,image,STORY_ART.rider[0],[0,0,1000,1000],spec,'hs-cycle-body');
    const crank=rect(el('hs-cycle-crank',rider),[473.2,900,110,14],spec);el('hs-cycle-pedal',crank);el('hs-cycle-pedal',crank);
  }
  if(scene==='make-believe'){
    const route=el('hs-route hs-bidirectional',back);route.style.cssText='--cs:26s;--cd:-2s';
    const rabbit=el('hs-story-rabbit',route),hop=el('hs-rabbit-hop',rabbit),gait=el('hs-rabbit-gait',hop),image=extras.get('stories/rabbit.webp');
    STORY_ART.rabbit.forEach((crop,i)=>{const frame=sprite(gait,image,crop,[0,0,100,100],{sw:100,sh:100},'hs-rabbit-frame');frame.style.animationName='hsRabbitPose'+i;});
    sprite(hop,image,STORY_ART.rabbit[3],[0,0,100,100],{sw:100,sh:100},'hs-rabbit-rest');
  }
  if(scene==='games'){
    // The plate's crest rises above the horizon on the right. Clip only the
    // distant ship to that contour; the dolphin stays in the foreground water.
    const horizon=el('hs-ship-horizon',back);
    const ship=el('hs-story-ship',horizon);ship.appendChild(extras.get('../../items/cruise-ship.webp').cloneNode());
    const water=rect(el('hs-dolphin-water',back),[0,735,704,175]),dolphin=el('hs-story-dolphin',water);
    dolphin.appendChild(extras.get('../../items/dolphin.webp').cloneNode());
    for(const side of ['entry','exit']){const splash=el('hs-dolphin-splash hs-splash-'+side,water);for(let i=0;i<5;i++){const drop=el('hs-splash-drop',splash);drop.style.setProperty('--drop',i);}}
  }
  if(scene==='toy-box'){
    const jack=rect(el('hs-story-jack',back),[38,950,135,202.5]),spec={sw:200,sh:300},image=extras.get('stories/jack.webp');
    const openLid=rect(el('hs-jack-lid-open',jack),[36,82,128,105],spec);
    openLid.appendChild(extras.get('stories/jack-lid-open-v2.webp').cloneNode());
    const contents=rect(el('hs-jack-opening',jack),[16,0,172,220],spec),spring=el('hs-jack-spring',contents);
    sprite(spring,image,STORY_ART.jack[2],[25,0,145,225],{sw:172,sh:220},'hs-jack-clown');
    sprite(jack,image,STORY_ART.jack[0],[0,165,200,135],spec,'hs-jack-box');
    // Same box again, cut along the front rim, so the spring rises out of the opening instead of stopping at the back edge.
    sprite(jack,image,STORY_ART.jack[0],[0,165,200,135],spec,'hs-jack-box-front').style.clipPath='polygon(0% 11.5%,10.4% 13.2%,49.2% 22.1%,73.1% 13.7%,80% 12%,100% 10%,100% 100%,0% 100%)';
    const lid=sprite(jack,image,STORY_ART.jack[1],[0,150,172,83],spec,'hs-jack-lid');
    lid.style.cssText+='left:4%;top:53.3%;width:80%;height:14%;';
    const tap=rect(el('hs-tap hs-jack-tap',stage),[38,950,135,220]);tap.dataset.subject='jack';
    let timer=0;
    const reset=()=>{clearTimeout(timer);timer=0;delete jack.dataset.playing;jack.getAnimations({subtree:true}).forEach(a=>{a.currentTime=0;});};
    const trigger=e=>{
      e.preventDefault();e.stopPropagation();
      if(timer||document.hidden||!home.classList.contains('active')||document.documentElement.dataset.motion==='reduce'||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
      const clock=jack.querySelector('.hs-jack-spring').getAnimations()[0],time=(clock?.currentTime||0)%24000;
      if(time>=5760&&time<11760)return;
      jack.dataset.playing='true';jack.getAnimations({subtree:true}).forEach(a=>{a.currentTime=0;});
      timer=setTimeout(reset,4000);
    };
    tap.addEventListener('pointerdown',trigger);
    const sync=()=>{if(document.hidden||!home.classList.contains('active'))reset();};
    const observer=new MutationObserver(sync);observer.observe(home,{attributes:true,attributeFilter:['class']});document.addEventListener('visibilitychange',sync);
    cleanup=()=>{reset();observer.disconnect();document.removeEventListener('visibilitychange',sync);tap.removeEventListener('pointerdown',trigger);};
  }
  back.querySelectorAll('img').forEach(img=>{img.alt='';img.draggable=false;});
  return cleanup;
}
