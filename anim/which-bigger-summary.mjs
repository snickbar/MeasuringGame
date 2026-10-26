import {REACTION_ART} from './which-bigger-art/assets.mjs';
let preloaded;
export function preloadWbReactionArt() {
  if(typeof Image==='undefined')return Promise.resolve();
  return preloaded ||= Promise.all(Object.keys(REACTION_ART).map(id=>{
    const img=new Image();img.src=`anim/which-bigger-art/${id}.webp`;
    return img.decode().catch(()=>{});
  }));
}

// Each generated piece keeps its full original alpha canvas. This window only
// aligns the artwork's transparent margins; no neighboring animal is cropped.
function piece(id, cls='') {
  const {width,height,bounds:[x,y,w,h]}=REACTION_ART[id];
  return `<span class="wb-art-piece ${cls}" style="aspect-ratio:${w}/${h}"><img src="anim/which-bigger-art/${id}.webp" alt="" draggable="false" style="width:${width/w*100}%;height:${height/h*100}%;left:${-x/w*100}%;top:${-y/h*100}%"></span>`;
}
// A broad cloud of separate droplets, with varied paths, sizes and release times.
const drops=()=>Array.from({length:48},(_,i)=>{
  const spread=((i*19)%49)/48;
  return `<i class="wb-water-drop" style="--flight-x:${-31+spread*80}px;--flight-y:${20+((i*13)%31)}px;--drop-size:${3+(i%4)}px;--drop-tilt:${-35+spread*70}deg;--drop-delay:${(i%12)*.012}s"></i>`;
}).join('');
const anger=`<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M3 9Q9 9 9 3M15 3Q15 9 21 9M3 15Q9 15 9 21M15 21Q15 15 21 15"/></g></svg>`;

// Both eye states share one registered canvas. Only the eye region swaps;
// the body never jumps between independently rendered poses.
function elephantBody() {
  const {width,height,bounds:[x,y,w,h]}=REACTION_ART['elephant-open'];
  const style=`width:${width/w*100}%;height:${height/h*100}%;left:${-x/w*100}%;top:${-y/h*100}%`;
  return `<span class="wb-art-piece wb-elephant-body" style="aspect-ratio:${w}/${h}"><img src="anim/which-bigger-art/elephant-open.webp" alt="" draggable="false" style="${style}"><img class="wb-closed-eyes" src="anim/which-bigger-art/elephant-closed.webp" alt="" draggable="false" style="${style}"></span>`;
}
export function wbMascotsHtml(correct) {
  const animal=correct
    ? `<div class="wb-summary-elephant"><span class="wb-tail-rig">${piece('elephant-tail')}</span>${elephantBody()}<span class="wb-trunk-rig">${piece('elephant-trunk')}<span class="wb-water-source">${drops()}</span></span></div>`
    : `<div class="wb-summary-mouse">${piece('mouse-body','wb-mouse-body')}<span class="wb-foot-rig">${piece('mouse-foot')}</span><span class="wb-stomp-impact"></span><span class="wb-angry-sign one">${anger}</span><span class="wb-angry-sign two">${anger}</span></div>`;
  return `<div class="wb-result-mascot ${correct?'celebrate':'upset'}" aria-hidden="true">${animal}</div>`;
}
