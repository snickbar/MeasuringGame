// Hand-drawn poses from the approved mascot expansion. No wallet/gameplay writes.
export const MASCOT_POSES = {
  ant: {count:12,idle:[0,1,2],win:[3,4,5],soso:[6,7,8],lose:[9,10,11]},
  cats:{count:12,idle:[0,1,2],win:[3,4,5],soso:[6,7,8],lose:[9,10,11]},
  dogs:{count:12,idle:[0,1,2],win:[3,4,5],soso:[6,7,8],lose:[9,10,11]},
  rooster:{count:11,idle:[0,1,2],win:[3,4],soso:[5,6,7],lose:[8,9,10]},
  squirrel:{count:11,idle:[0,1,2],win:[3,4,5],soso:[6,7],lose:[8,9,10]},
  raccoon:{count:12,idle:[0,1,2],win:[3,4,5],soso:[6,7,8],lose:[9,10,11]},
  survival:{count:13,idle:[0,1,2,3,4],win:[5,6,7],soso:[8,9],lose:[10,11,12]},
  bigger:{count:8,idle:[0,1],win:[2,3,4],soso:[0,1],lose:[5,6,7]},
  worlds:{count:6,idle:[0,1],win:[2,3],soso:[4,1],lose:[5]},
  teamworlds:{count:8,idle:[0,1],win:[2,3],soso:[4,5],lose:[6,7]},
  pig:{count:6,idle:[1,2],win:[0,3],soso:[1,2],lose:[4,5]},
};
const asset = id => new URL(`../icons/mascot-poses/${id}.webp`, import.meta.url).href;
let podiumArtReady;
export function preloadPodiumMascots(){
  if(typeof Image==='undefined')return Promise.resolve();
  return podiumArtReady ||= Promise.all([
    ...['ant','cats','dogs'].map(asset),
    new URL('./mode-mascots/quick-robot-landing.webp',import.meta.url).href,
    new URL('./mode-mascots/quick-robot-airborne.webp',import.meta.url).href,
  ].map(src=>{const image=new Image();image.src=src;return image.decode().catch(()=>{});}));
}
const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reactionChoices=new Map(),lastChoices=new Map();
export function pickMascotReaction(id,mood,key='',random=Math.random){
  const spec=MASCOT_POSES[id];if(!spec)throw Error('Unknown mascot '+id);
  const signature=id+':'+mood+':'+key;
  if(reactionChoices.has(signature))return reactionChoices.get(signature);
  const pool=spec[mood]||spec.idle,last=lastChoices.get(id+':'+mood),fresh=pool.filter(pose=>pose!==last),options=fresh.length?fresh:pool;
  const choice=options[Math.min(options.length-1,Math.floor(random()*options.length))];
  reactionChoices.set(signature,choice);lastChoices.set(id+':'+mood,choice);
  if(reactionChoices.size>1000)reactionChoices.delete(reactionChoices.keys().next().value);
  return choice;
}
export const mascotMood = accuracy => accuracy>=60?'win':accuracy>=40?'soso':'lose';
export function mascotFrame(id,mood,age,key='',still=false) {
  const spec=MASCOT_POSES[id];if(!spec)throw Error('Unknown mascot '+id);
  const selected=pickMascotReaction(id,mood,key);
  if(still)return mood==='idle'?spec.idle[0]:selected;
  const beat=Math.max(0,age)%4200;
  if(mood==='idle')return beat<2300?spec.idle[0]:beat<3300?selected:spec.idle[0];
  // Repeat this answer's chosen gesture; another answer gets a fresh random choice.
  return beat<450?spec.idle[0]:beat<2900?selected:beat<3300?spec.idle[0]:selected;
}
export function configureMascot(el,id,mood='idle',{key='',delay=0,still=false}={}) {
  const spec=MASCOT_POSES[id];if(!spec)throw Error('Unknown mascot '+id);
  el.classList.add('mp-sprite');el.dataset.mascotId=id;el.dataset.mascotMood=mood;el.dataset.mascotKey=key;
  el.dataset.mascotDelay=String(delay);el.dataset.mascotStill=String(still);
  el.style.backgroundImage=`url("${asset(id)}")`;
  el.style.backgroundSize=`${spec.count*100}% 100%`;
  el.style.backgroundPosition=`${mascotFrame(id,mood,0,key,still)/(spec.count-1)*100}% 0`;
}
export function mascotMarkup(id,mood='idle',{key='',delay=0,still=false,cls=''}={}) {
  const spec=MASCOT_POSES[id];if(!spec)throw Error('Unknown mascot '+id);
  const frame=mascotFrame(id,mood,0,key,still);
  return `<span class="mp-sprite ${esc(cls)}" data-mascot-id="${id}" data-mascot-mood="${esc(mood)}" data-mascot-key="${esc(key)}" data-mascot-delay="${delay}" data-mascot-still="${still}" aria-hidden="true" style="background-image:url('${asset(id)}');background-size:${spec.count*100}% 100%;background-position:${frame/(spec.count-1)*100}% 0"></span>`;
}
export function installMascotPoses({root=document,reducedMotion=()=>false,paused=()=>false}={}) {
  void preloadPodiumMascots();
  const doc=root.ownerDocument||root,states=new Map(),starts=new Map();let timer=0;
  const scan=()=>{
    const live=new Set(root.querySelectorAll('[data-mascot-id]'));
    for(const el of states.keys())if(!live.has(el))states.delete(el);
    for(const el of live){const signature=[el.dataset.mascotId,el.dataset.mascotMood,el.dataset.mascotKey].join(':');if(states.get(el)?.signature===signature)continue;
      if(!starts.has(signature)){starts.set(signature,performance.now());if(starts.size>300)starts.delete(starts.keys().next().value);}
      states.set(el,{signature,start:starts.get(signature),frame:-1});
    }
    if(!timer&&states.size)tick();
  };
  function tick(){timer=0;const now=performance.now();for(const [el,state]of states){if(!el.isConnected){states.delete(el);continue;}if(!el.getClientRects().length)continue;
    const id=el.dataset.mascotId,spec=MASCOT_POSES[id];if(!spec)continue;
    const still=reducedMotion()||el.dataset.mascotStill==='true';
    if((doc.hidden||paused())&&!still)continue;
    const frame=mascotFrame(id,el.dataset.mascotMood,now-state.start-Number(el.dataset.mascotDelay||0),el.dataset.mascotKey,still);
    if(frame!==state.frame){el.style.backgroundPosition=`${frame/(spec.count-1)*100}% 0`;el.dataset.pose=String(frame);state.frame=frame;}
  }if(states.size)timer=setTimeout(tick,120);}
  const observer=new MutationObserver(scan);observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['data-mascot-id','data-mascot-mood','data-mascot-key','data-mascot-still']});scan();
  return {refresh:scan,destroy(){clearTimeout(timer);observer.disconnect();states.clear();starts.clear();}};
}
