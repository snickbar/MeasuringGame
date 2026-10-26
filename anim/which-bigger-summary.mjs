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
const drops=()=>Array.from({length:14},(_,i)=>`<i class="wb-water-drop" style="--flight-x:${14+(i%5)*5}px;--flight-y:${21+(i%4)*5}px;--drop-delay:${i*.025}s"></i>`).join('');
const anger=`<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M3 9Q9 9 9 3M15 3Q15 9 21 9M3 15Q9 15 9 21M15 21Q15 15 21 15"/></g></svg>`;

export function wbMascotsHtml(correct) {
  const elephant=correct
    ? `${piece('elephant-body','wb-elephant-body')}<span class="wb-trunk-rig">${piece('elephant-trunk')}<span class="wb-water-source">${drops()}</span></span>`
    : '<img class="wb-neutral-animal" src="icons/mascot-elephant.webp" alt="" draggable="false">';
  const mouse=correct
    ? '<img class="wb-neutral-animal" src="icons/mascot-mouse.webp" alt="" draggable="false">'
    : `${piece('mouse-body','wb-mouse-body')}<span class="wb-foot-rig">${piece('mouse-foot')}</span><span class="wb-stomp-impact"></span><span class="wb-angry-sign one">${anger}</span><span class="wb-angry-sign two">${anger}</span>`;
  return `<div class="wb-mascot-duo ${correct?'celebrate':'upset'}" aria-hidden="true"><div class="wb-summary-elephant">${elephant}</div><div class="wb-summary-mouse">${mouse}</div></div>`;
}
