import { mascotMarkup } from './mascot-poses.mjs';
export const SURVIVAL_IMPACT_MS = Object.freeze({ miss: 2240, saved: 1450 });

let preloaded;
export function preloadSurvivalRigArt() {
  const files = ['../icons/mascot-poses/survival.webp','../backgrounds/survival-dungeon.webp'];
  return preloaded ||= Promise.all(files.map(file => {
    const image = new Image();
    image.src = new URL(file, import.meta.url).href;
    return image.decode().catch(() => {});
  }));
}

const labels = {safe:'Replay the knight’s celebration', miss:'Replay the defeat reaction', saved:'Replay the close-call reaction', record:'Replay the personal best celebration'};
export function survivalBattleHtml(mood, reduced = false) {
  return `<button type="button" class="sv-battle mp-new-battle" data-scene="${mood}" aria-label="${labels[mood]}"${reduced ? ' disabled' : ''}>
    <span class="sv-battle-stage" aria-hidden="true">${mascotMarkup('survival',mood==='miss'?'lose':mood==='saved'?'soso':'win',{key:mood,still:reduced,delay:600})}</span>
  </button>`;
}

export function mountSurvivalBattle(scene, screen, reducedMotion) {
  const sprite=scene.querySelector('[data-mascot-id]');
  function update(){scene.disabled=reducedMotion();if(sprite)sprite.dataset.mascotStill=String(scene.disabled);}
  function replay(){if(!scene.disabled&&scene.isConnected&&screen.classList.contains('active')&&sprite)sprite.dataset.mascotKey=scene.dataset.scene+':replay:'+performance.now();}
  const observer=new MutationObserver(update);observer.observe(scene.ownerDocument.documentElement,{attributes:true,attributeFilter:['data-motion']});
  scene.addEventListener('click',replay);scene.classList.add('playing');update();
  return ()=>{observer.disconnect();scene.removeEventListener('click',replay);scene.classList.remove('playing');};
}
