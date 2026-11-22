// Presentation only: wallet values and arrival timing remain owned by the game.
export function createCoinPouch(button, { reducedMotion = () => false } = {}) {
  const picture = button.querySelector('#toolbar-coin-icon');
  const poses = ['idle', 'open', 'full', 'settled'];
  const urls = poses.map(pose => `icons/coin-pouch/${pose}.webp`);
  urls.forEach(src => { const preload = new Image(); preload.src = src; });
  let timers = [], bounce = null, generation = 0, receiving = false;
  const pose = name => { if (picture) picture.src = urls[poses.indexOf(name)]; button.dataset.pouchPose = name; };
  const later = (fn, ms) => { const current = generation; timers.push(setTimeout(() => { if (current === generation) fn(); }, Math.max(0, ms))); };
  function reset() {
    generation++; receiving = false; timers.forEach(clearTimeout); timers = [];
    bounce?.cancel(); bounce = null; pose('idle');
  }
  function land() {
    if (!receiving || reducedMotion() || document.hidden) return;
    pose('full'); bounce?.cancel();
    bounce = picture?.animate([
      { transform: 'scale(1)' }, { transform: 'scale(1.10,.94)', offset: .32 },
      { transform: 'scale(.98,1.04)', offset: .7 }, { transform: 'scale(1)' },
    ], { duration: 290, easing: 'ease-out' });
  }
  function arrival(firstLand, lastLand) {
    reset();
    if (reducedMotion() || document.hidden) return;
    receiving = true;
    later(() => pose('open'), firstLand - 180);
    later(land, firstLand);
    later(() => pose('settled'), lastLand + 120);
    later(() => { receiving = false; pose('idle'); }, lastLand + 420);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  return { arrival, land, reset };
}
