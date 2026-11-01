// Original sheet coordinates stay explicit so moving joints overlap, never separate.
const SHEET = [1774,887];
export const SURVIVAL_IMPACT_MS = 2400;
export const SURVIVAL_CYCLES = Object.freeze({knight:{duration:7000,action:3500},dragon:{duration:8000,action:5000}});
export function survivalReplayReady(kind, time) {
  const timing = SURVIVAL_CYCLES[kind];
  return !!timing && Number.isFinite(time) && time >= 0 && time % timing.duration >= timing.action;
}
let preloaded;
export function preloadSurvivalRigArt() {
  if (typeof Image === 'undefined') return Promise.resolve();
  return preloaded ||= Promise.all(['../icons/survival-knight-parts-v2.webp','../icons/survival-dragon-parts-v2.webp','../icons/survival-dragon-flame.webp','../icons/survival-knight-block.webp'].map(file=>{
    const image=new Image();image.src=new URL(file,import.meta.url).href;
    return image.decode().catch(()=>{});
  }));
}
function part(file, cls, crop, placement, pivot) {
  const [x,y,w,h]=crop,[left,top,width]=placement;
  const origin=pivot?`;transform-origin:${(pivot[0]-x)/w*100}% ${(pivot[1]-y)/h*100}%`:'';
  return `<span class="sv-part ${cls}" style="left:${left/512*100}%;top:${top/512*100}%;width:${width/512*100}%;height:${width*h/w/512*100}%${origin}"><img src="icons/${file}" alt="" draggable="false" style="width:${SHEET[0]/w*100}%;height:${SHEET[1]/h*100}%;left:${-x/w*100}%;top:${-y/h*100}%"></span>`;
}
export function survivalKnightRig() {
  const file='survival-knight-parts-v2.webp';
  return `<span class="sv-knight sv-rig" role="button" tabindex="0" aria-label="Replay knight celebration">${part(file,'sv-knight-body',[140,30,820,835],[120,92,370])}<svg class="sv-sword-trail" aria-hidden="true" viewBox="0 0 512 512"><path d="M38 319 Q5 112 224 30"/></svg>${part(file,'sv-sword-arm',[1143,110,530,625],[-1.5,26.4,239.14],[1605,650])}</span>`;
}
export function survivalDragonRig() {
  const file='survival-dragon-parts-v2.webp';
  // The jaw sits behind the fixed cheek. The tongue moves with the jaw; the
  // upper snout, cheek and throat remain attached to the head throughout.
  return `<span class="sv-dragon sv-rig" role="button" tabindex="0" aria-label="Replay dragon fire">${part(file,'sv-dragon-jaw',[1390,426,320,160],[382.5,200.4,108.8],[1420,470])}${part(file,'sv-dragon-body',[33,8,1140,866],[10,84,488])}</span>`;
}
const installed = new WeakSet();
export function installSurvivalReplay(doc = document) {
  if (installed.has(doc)) return;
  installed.add(doc);
  function replay(event) {
    if (event.type === 'keydown' && !['Enter',' '].includes(event.key)) return;
    const rig = event.target.closest?.('.sv-rig[role="button"],.sv-scene.saved .sv-knight[role="button"]'), scene = rig?.closest('.sv-scene');
    if (!scene || !rig.closest('#survival-screen.active') || doc.hidden || doc.querySelector('dialog[open]')) return;
    if (event.type === 'keydown') event.preventDefault();
    if (doc.documentElement.dataset.motion === 'reduce' || doc.defaultView.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const clock = scene.querySelector('.sv-sword-arm,.sv-dragon-jaw')?.getAnimations()[0];
    const kind = scene.classList.contains('safe') ? 'knight' : 'dragon';
    if (!clock || !survivalReplayReady(kind, clock.currentTime)) return; // Finish the current action; never queue taps.
    const animations = new Set();
    // Replay the characters and fire only. Hearts, coins, rewards and verdicts
    // remain untouched, including the one-time shield/life impact callbacks.
    for (const part of scene.querySelectorAll('.sv-rig,.sv-flame,.sv-scene.saved>.sv-knight,.sv-spark')) {
      part.getAnimations({subtree:true}).forEach(animation=>animations.add(animation));
    }
    animations.forEach(animation=>{animation.currentTime=0;});
  }
  doc.addEventListener('click', replay);
  doc.addEventListener('keydown', replay);
}
