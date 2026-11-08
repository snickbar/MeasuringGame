const ART = 'anim/home-art/cat-room/';
export const CAT_ROOM_SIZE = { width: 900, height: 1950 };
const FISH = ['tropical-fish', 'clownfish', 'goldfish'];
const WALK_EDGE = { left: -110, right: 545 };
const WALK_START = 220;

export async function buildCatRoom(home, load, current) {
  const sprites = ['luna', 'blink', 'paw', 'bowl', 'couch', 'table', 'cage',
    'walk-a', 'walk-b', 'groom-a', 'groom-b', 'run-a', 'run-b'];
  await Promise.all([
    load('anim/home-art/plate-cat-room.webp'),
    ...sprites.map(name => load(ART + name + '.webp')),
    ...FISH.map(name => load('items/' + name + '.webp')),
  ]);
  if (!current()) return null;

  const root = document.createElement('div');
  root.id = 'home-art';
  root.dataset.scene = 'cat-room';
  const sprite = (name, css = '') => `<img class="${css}" src="${ART + name}.webp" alt="" draggable="false">`;
  const tap = (id, label) => `<button class="cr-hit" type="button" data-no-autofit data-pet="${id}" aria-label="${label}"></button>`;
  root.innerHTML = `<div class="hs-stage">
    <img class="hs-plate" src="anim/home-art/plate-cat-room.webp" alt="" draggable="false">
    ${sprite('couch', 'cr-couch')}
    <div class="cr-side-table">
      <div class="cr-hamster">${sprite('cage', 'cr-base')}
        <i class="cr-wheel" aria-hidden="true"></i>
        <div class="cr-runner">${sprite('run-a', 'cr-base')}${sprite('run-b', 'cr-alt cr-run-alt')}</div>
        ${tap('hamster', 'Cheer on the hamster')}
      </div>
      ${sprite('table', 'cr-table')}
    </div>
    <div class="cr-bobtail" data-state="walking"><div class="cr-facing">
      ${sprite('walk-a', 'cr-base cr-walk')}${sprite('walk-b', 'cr-alt cr-walk-alt')}
      ${sprite('groom-a', 'cr-alt cr-groom')}${sprite('groom-b', 'cr-alt cr-groom-alt')}
    </div></div>
    <div class="cr-luna"><div class="cr-luna-body">${sprite('luna', 'cr-base')}
      ${sprite('blink', 'cr-alt cr-blink')}${sprite('paw', 'cr-alt cr-paw')}
    </div>${tap('luna', 'Pet Luna')}</div>
    <div class="cr-bowls">${FISH.map((name, index) => `<div class="cr-bowl" style="--swim-time:${[5.2, 4.3, 6][index]}s;--swim-delay:${[-.5, -2, -4][index]}s">
      ${sprite('bowl', 'cr-base')}
      <div class="cr-swimmer"><img src="items/${name}.webp" alt="" draggable="false"></div>
      <i class="cr-bubble" aria-hidden="true"></i>${tap('fish', 'Startle the fish in bowl ' + (index + 1))}
    </div>`).join('')}</div>
  </div>`;

  function start(play, stopSound) {
    const doc = home.ownerDocument, bobtail = root.querySelector('.cr-bobtail');
    const events = new AbortController(), timers = new Map();
    let active = false, traveling, grooming, pawMotion, x = WALK_START, direction = 1;
    const translate = pos => `translateX(${pos}%)`;
    const resetBobtail = () => {
      traveling?.cancel();
      traveling = null;
      clearTimeout(grooming);
      bobtail.dataset.state = 'walking';
      bobtail.dataset.direction = 'right';
      bobtail.style.transform = '';
      x = WALK_START;
      direction = 1;
    };
    function walk(to, next) {
      const motion = bobtail.animate([{ transform: translate(x) }, { transform: translate(to) }],
        { duration: Math.max(1, Math.abs(to - x) * 22), fill: 'forwards' });
      traveling = motion;
      motion.onfinish = () => {
        if (!active || traveling !== motion) return;
        x = to;
        bobtail.style.transform = translate(to);
        traveling = null;
        motion.cancel();
        next();
      };
    }
    function cross() {
      const end = direction > 0 ? WALK_EDGE.right : WALK_EDGE.left;
      const pauseAt = 232 + Math.random() * 24;
      bobtail.dataset.direction = direction > 0 ? 'right' : 'left';
      const finish = () => walk(end, () => { direction *= -1; cross(); });
      if ((pauseAt - x) * direction > 0 && Math.random() < .75) {
        walk(pauseAt, () => {
          bobtail.dataset.state = 'grooming';
          grooming = setTimeout(() => { bobtail.dataset.state = 'walking'; finish(); }, 1650 + Math.random() * 800);
        });
      } else finish();
    }
    function pulse(target, ms, rate) {
      if (timers.has(target)) return;
      const motion = target.getAnimations({ subtree: true });
      if (rate) for (const animation of motion) animation.updatePlaybackRate(rate);
      target.dataset.tapped = 'true';
      const reset = () => {
        for (const animation of motion) if (rate) animation.updatePlaybackRate(1);
        delete target.dataset.tapped;
        timers.delete(target);
      };
      timers.set(target, { timer: setTimeout(reset, ms), reset });
    }
    root.addEventListener('click', event => {
      const hit = event.target.closest('[data-pet]');
      if (!hit || !active) return;
      const target = hit.parentElement;
      if (timers.has(target)) return;
      play(hit.dataset.pet === 'luna' ? 0 : 1);
      if (hit.dataset.pet === 'luna') {
        pulse(target, 1150);
        pawMotion = target.animate([
          { transform: 'translateY(0) rotate(0)' },
          { transform: 'translateY(-5%) rotate(3deg)', offset: .33 },
          { transform: 'translateY(0) rotate(0)' },
        ], { duration: 600, easing: 'ease-out' });
      } else pulse(target, 1650, hit.dataset.pet === 'fish' ? 2.6 : 2.1);
    }, { signal: events.signal });

    const media = matchMedia('(prefers-reduced-motion: reduce)');
    function sync() {
      const mode = doc.documentElement.dataset.motion;
      const visible = !doc.hidden && home.classList.contains('active');
      root.classList.toggle('hs-paused', !visible);
      const moving = visible && mode !== 'reduce' && (mode === 'full' || !media.matches);
      if (active === moving) return;
      active = moving;
      if (active) cross();
      else {
        resetBobtail();
        pawMotion?.cancel();
        for (const { timer, reset } of timers.values()) { clearTimeout(timer); reset(); }
        stopSound();
      }
    }
    const visibility = new MutationObserver(sync);
    visibility.observe(home, { attributes: true, attributeFilter: ['class'] });
    visibility.observe(doc.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
    doc.addEventListener('visibilitychange', sync, { signal: events.signal });
    media.addEventListener('change', sync, { signal: events.signal });
    sync();
    return () => {
      active = false;
      resetBobtail();
      pawMotion?.cancel();
      for (const { timer } of timers.values()) clearTimeout(timer);
      visibility.disconnect();
      events.abort();
      stopSound();
    };
  }
  return { root, stage: root.firstElementChild, start };
}
