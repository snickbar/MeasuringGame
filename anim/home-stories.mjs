import {artCell} from './home-layer-art.mjs';
import {STORY_ART} from './home-stories-art.mjs';
const ref={sw:704,sh:1520};
const el=(cls,parent)=>{const node=document.createElement('div');node.className=cls;parent?.appendChild(node);return node;};
const rect=(node,[x,y,w,h],spec=ref)=>{node.style.cssText+=`left:${x/spec.sw*100}%;top:${y/spec.sh*100}%;width:${w/spec.sw*100}%;height:${h/spec.sh*100}%;`;return node;};
function sprite(parent,image,crop,box,spec,cls){const node=artCell(image,crop,box,spec,cls);parent.appendChild(node);return node;}
function jackHinge(jack,lid){
  // Project one rigid panel around its fixed rear edge. Its free edge follows
  // a circular arc; there is no sprite exchange, fade, or stretchy scaleY.
  const ex=88/Math.hypot(88,10),ey=10/Math.hypot(88,10),nx=ey,ny=-ex;
  const projection=angle=>{const a=angle*Math.PI/180;return `--hs-jack-dx:${-1.15*Math.cos(a)+nx*Math.sin(a)};--hs-jack-dy:${.25*Math.cos(a)+ny*Math.sin(a)}`;};
  // Interpolate projected coordinates, not transform matrices: browser matrix
  // decomposition can flip a panel abruptly when it passes through edge-on.
  lid.style.transform=`matrix(calc(${ex*ex} + ${nx} * var(--hs-jack-dx)),calc(${ey*ex} + ${nx} * var(--hs-jack-dy)),calc(${ex*ey} + ${ny} * var(--hs-jack-dx)),calc(${ey*ey} + ${ny} * var(--hs-jack-dy)),0,0)`;
  const frames=stops=>{
    let css='';
    for(let s=0;s<stops.length-1;s++){
      const [start,from]=stops[s],[end,to]=stops[s+1];
      const count=from===to?1:24;
      for(let i=0;i<count;i++){
        const t=i/count,e=t*t*(3-2*t),angle=from+(to-from)*e;
        css+=`${start+(end-start)*t}%{${projection(angle)};z-index:${angle<22?4:0}}`;
      }
    }
    return css+`100%{${projection(stops.at(-1)[1])};z-index:4}`;
  };
  const style=document.createElement('style');
  style.textContent=`@keyframes hsJackHinge{${frames([[0,0],[24,0],[28.5,90],[47,90],[50.5,0],[100,0]])}}@keyframes hsJackHingeTap{${frames([[0,0],[19,90],[84,90],[98,0],[100,0]])}}`;
  jack.appendChild(style);
}
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
    // Match the ART edge, not the transparent image rectangle: in the 200x300
    // assembly the rear rim runs (72,169) -> (160,179). The inner lid's lower
    // edge (.02,.79) -> (.89,.924) is fitted to those same two points.
    const openLid=rect(el('hs-jack-lid-open',jack),[70,103,101,83],spec);
    openLid.appendChild(extras.get('stories/jack-lid-open-v2.webp').cloneNode());
    jackHinge(jack,openLid);
    const contents=rect(el('hs-jack-opening',jack),[16,0,172,220],spec),spring=el('hs-jack-spring',contents);
    sprite(spring,image,STORY_ART.jack[2],[25,0,145,225],{sw:172,sh:220},'hs-jack-clown');
    sprite(jack,image,STORY_ART.jack[0],[0,165,200,135],spec,'hs-jack-box');
    // Same box again, cut along the front rim, so the spring rises out of the opening instead of stopping at the back edge.
    sprite(jack,image,STORY_ART.jack[0],[0,165,200,135],spec,'hs-jack-box-front').style.clipPath='polygon(0% 11.5%,10.4% 13.2%,49.2% 22.1%,73.1% 13.7%,80% 12%,100% 10%,100% 100%,0% 100%)';
    const tap=rect(el('hs-tap hs-jack-tap',stage),[38,950,135,220]);tap.dataset.subject='jack';
    let timer=0;
    const reset=()=>{clearTimeout(timer);timer=0;delete jack.dataset.playing;jack.getAnimations({subtree:true}).forEach(a=>{a.currentTime=0;});};
    const trigger=e=>{
      e.preventDefault();e.stopPropagation();
      if(timer||document.hidden||!home.classList.contains('active')||document.documentElement.dataset.motion==='reduce'||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
      const clock=jack.querySelector('.hs-jack-spring').getAnimations()[0],time=(clock?.currentTime||0)%24000;
      if(time>=5760&&time<12240)return;
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
