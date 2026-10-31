// Builds the drifting-particle layer behind the Home buttons. The scene id comes from the page's top script (data-home-scene),
// so every Home picture gets its own mood. Particles never intercept buttons; a Home-only hit test handles pops. Animation: Reduced hides them.
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
import {HOME_PARTICLES,RISING_PARTICLES,FALLING_PARTICLES,SIDEWAYS_PARTICLES} from './home-particle-recipes.mjs';
let popAudio;
const activePops=new Set();
function stopPopAudio(){for(const source of activePops){try{source.stop();}catch{}}activePops.clear();}
export function particleBloop(){
  try{
    if(localStorage.getItem('mg_soundEnabled')==='false')return;
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    if(!popAudio||popAudio.state==='closed')popAudio=new AC();
    if(popAudio.state==='suspended'||popAudio.state==='interrupted')popAudio.resume().catch(()=>{});
    const t=popAudio.currentTime,o=popAudio.createOscillator(),g=popAudio.createGain();
    o.type='sine';o.frequency.setValueAtTime(850,t);o.frequency.exponentialRampToValueAtTime(430,t+.11);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.13,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+.15);
    o.connect(g);g.connect(popAudio.destination);activePops.add(o);
    o.onended=()=>{activePops.delete(o);o.disconnect();g.disconnect();};o.start(t);o.stop(t+.17);
  }catch{}
}
function installParticlePops(home,layer){
  const events=new AbortController(),timers=new Set();
  const later=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);};
  const pause=()=>{
    const paused=document.hidden||!home.classList.contains('active');
    layer.classList.toggle('hf-paused',paused);
    if(paused){stopPopAudio();layer.querySelectorAll('.hf-pop').forEach(el=>el.remove());}
  };
  const observer=new MutationObserver(pause);observer.observe(home,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',pause,{signal:events.signal});pause();
  home.addEventListener('pointerdown',e=>{
    if(e.isPrimary===false||e.button>0||document.hidden||!home.classList.contains('active')||document.documentElement.dataset.motion==='reduce')return;
    // Keep all navigation, tiles and other controls fully reliable, even under a particle.
    if(e.target.closest('button,a,input,select,textarea,[role=button],.home-tile'))return;
    let hit,distance=Infinity;
    for(const el of layer.querySelectorAll('.hf:not([data-popped])')){
      if(Number(getComputedStyle(el).opacity)<.18)continue;
      const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
      if(r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)continue;
      const d=Math.hypot(e.clientX-x,e.clientY-y);
      if(d<=Math.max(18,Math.min(28,r.width/2+8))&&d<distance){hit=el;distance=d;}
    }
    if(!hit)return;
    e.preventDefault();e.stopImmediatePropagation();hit.dataset.popped='true';hit.style.visibility='hidden';
    const bounds=layer.getBoundingClientRect(),pop=document.createElement('span');pop.className='hf-pop';
    pop.style.cssText=`left:${e.clientX-bounds.left}px;top:${e.clientY-bounds.top}px`;
    for(let i=0;i<6;i++){const dot=document.createElement('i');dot.style.setProperty('--angle',i*60+'deg');pop.appendChild(dot);}
    layer.appendChild(pop);particleBloop();later(()=>pop.remove(),400);
    // Reset at a new offscreen route; the popped particle cannot flash back at the tap location.
    later(()=>{if(!layer.isConnected)return;const next=make(hit.dataset.kind,hit._homeParticleOptions);next.style.setProperty('--dl','0s');hit.replaceWith(next);},650);
  },{capture:true,signal:events.signal});
  layer.addEventListener('dispose',()=>{events.abort();observer.disconnect();for(const id of timers)clearTimeout(id);stopPopAudio();},{once:true});
}
function make(kind, opts = {}) {
  const el = document.createElement("i");
  el.className = "hf hf-" + kind;
  el.dataset.kind=kind;
  el._homeParticleOptions=opts;
  const rising = RISING_PARTICLES.has(kind), falling = FALLING_PARTICLES.has(kind);
  el.style.setProperty("--x", rnd(2, 98).toFixed(1) + "%");
  if(SIDEWAYS_PARTICLES.has(kind)){
    el.style.setProperty('--x',kind==='mist'?'-60%':'-8%');
    el.style.setProperty('--y',rnd(kind==='mist'?34:15,kind==='mist'?68:94).toFixed(1)+'%');
    el.style.setProperty('--wind-bob',rnd(-14,14).toFixed(1)+'px');
  }
  if (kind === "star" || kind === "sparkle" || kind === "shoot") el.style.setProperty("--y", rnd(4, kind === "shoot" ? 30 : 78).toFixed(1) + "%");
  const size = kind === "bubble" ? rnd(12, 36) : kind === "snow" ? rnd(5, 11) : kind === "ember" ? rnd(7, 14) : kind === "star" ? rnd(5, 12) : kind === "sparkle" ? rnd(10, 20) : kind === "petal" ? rnd(11, 18) : kind === "confetti" ? rnd(8, 13) : rnd(7, 13);
  el.style.setProperty("--s", size.toFixed(1) + "px");
  if(kind==='mist')el.style.setProperty('--s',rnd(170,250).toFixed(0)+'px');
  const dur = kind==='mist'?rnd(25,36):kind==='sand'?rnd(7,12):kind==='puff'?rnd(18,27):rising ? rnd(9, 17) : falling ? rnd(8, 15) : kind === "shoot" ? 11 : rnd(2.2, 5);
  el.style.setProperty("--d", dur.toFixed(1) + "s");
  el.style.setProperty("--dl", (-rnd(0, dur)).toFixed(1) + "s");
  if (kind === "shoot") el.style.setProperty("--dl", (-rnd(0, 6)).toFixed(1) + "s");
  const drift = (opts.dr || 26) * (Math.random() < .5 ? -1 : 1) * rnd(.4, 1);
  el.style.setProperty("--dr", drift.toFixed(0) + "px");
  // Every particle gets its own see-through level, so the layer reads soft rather than busy.
  el.style.setProperty("--o", (kind === "shoot" ? 1 : rnd(.35, .85)).toFixed(2));
  if (opts.colors) el.style.setProperty("--c", pick(opts.colors));
  return el;
}
export function installHomeFx() {
  const home = document.getElementById("home-screen");
  if (!home) return;
  const scene = document.documentElement.dataset.homeScene || "ants";
  const previous = document.getElementById("home-fx");
  if (previous?.dataset.scene === scene) return;
  previous?.dispatchEvent(new Event("dispose"));
  previous?.remove();
  const layer = document.createElement("div");
  layer.id = "home-fx";
  layer.dataset.scene = scene;
  layer.setAttribute("aria-hidden", "true");
  const small = Math.min(window.innerWidth, window.innerHeight) < 420;
  for (const [kind, n, opts] of HOME_PARTICLES[scene] || HOME_PARTICLES.ants) {
    const count = Math.max(0, Math.round(n * (small ? .6 : .95)));
    for (let i = 0; i < count; i++) layer.appendChild(make(kind, opts));
  }
  home.prepend(layer);
  installParticlePops(home,layer);
  // Shine sweep over the title letters: a copy of the title's shape (as a mask) with a light band sliding across it.
  const title = document.getElementById("home-title-img");
  if (title && !document.getElementById("home-title-shine")) {
    const shine = document.createElement("div");
    shine.id = "home-title-shine"; shine.setAttribute("aria-hidden", "true");
    shine.style.setProperty("--tm", `url("${title.src}")`);
    const fit = () => { if (title.naturalWidth) shine.style.setProperty("--ta", String(title.naturalWidth / title.naturalHeight)); };
    fit(); title.addEventListener("load", fit);
    title.after(shine);
  }
}
installHomeFx();
document.getElementById("home-screen")?.addEventListener("home-scene-ready", installHomeFx);
