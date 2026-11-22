import { puppetBattleHtml, puppetArtFiles } from './survival-puppets.mjs';
export const SURVIVAL_IMPACT_MS = Object.freeze({ miss: 2240, saved: 1450 });

let preloaded;
export function preloadSurvivalRigArt() {
  const files = [...puppetArtFiles()].map(file => `../icons/${file}`);
  files.push('../backgrounds/survival-dungeon.webp');
  return preloaded ||= Promise.all(files.map(file => {
    const image = new Image();
    image.src = new URL(file, import.meta.url).href;
    return image.decode().catch(() => {});
  }));
}

const labels = {safe:'Replay the knight’s swing', miss:'Replay the dragon’s fire', saved:'Replay the shield block', record:'Replay the personal best celebration'};
export function survivalBattleHtml(mood, reduced = false) {
  return `<button type="button" class="sv-battle" data-scene="${mood}" aria-label="${labels[mood]}"${reduced ? ' disabled' : ''}>
    <span class="sv-battle-stage" aria-hidden="true">${puppetBattleHtml(mood)}</span>
  </button>`;
}

export function mountSurvivalBattle(scene, screen, reducedMotion) {
  const doc = scene.ownerDocument;
  let timer;
  const active = () => scene.isConnected && screen.classList.contains('active') && !doc.hidden;
  // Endless idle loops (breathing, tail sway) never finish, so they don't count towards how long the scene still has to play.
  const remaining = () => Math.max(0, ...scene.getAnimations({subtree:true})
    .filter(animation => animation.effect.getComputedTiming().iterations !== Infinity)
    .map(animation => animation.effect.getComputedTiming().endTime - (animation.currentTime || 0)));
  function schedule() {
    clearTimeout(timer);
    if (!active() || reducedMotion()) return;
    timer = setTimeout(repeat, remaining() + 2000);
  }
  function play() {
    scene.classList.remove('playing');
    void scene.offsetWidth;
    scene.disabled = reducedMotion();
    if (!scene.disabled) scene.classList.add('playing');
    schedule();
  }
  function repeat() {
    if (!active() || reducedMotion()) return;
    play();
  }
  function replay() {
    if (active() && !reducedMotion() && remaining() <= 0 && !doc.querySelector('dialog[open]')) repeat();
  }
  const observer = new MutationObserver(records => {
    if (records.some(record => record.target === doc.documentElement)) play();
    else schedule();
  });
  observer.observe(screen, {attributes:true,attributeFilter:['class']});
  observer.observe(doc.documentElement, {attributes:true,attributeFilter:['data-motion']});
  doc.addEventListener('visibilitychange', schedule);
  scene.addEventListener('click', replay);
  play();
  return () => {
    clearTimeout(timer);
    observer.disconnect();
    doc.removeEventListener('visibilitychange', schedule);
    scene.removeEventListener('click', replay);
    scene.classList.remove('playing');
  };
}
