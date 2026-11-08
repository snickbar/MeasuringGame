const ART = 'anim/home-art/jungle/';
const PLATE = 'anim/home-art/plate-jungle.webp';
const OWL = 'items/owl.webp';
const MONKEYS = ['a', 'b', 'c'];

export async function build(home, load, current) {
  const sprites = ['tail', 'sloth', 'snake', ...MONKEYS.map(id => 'monkey-' + id)];
  await Promise.all([load(PLATE), load(OWL), ...sprites.map(name => load(ART + name + '.webp'))]);
  if (!current()) return null;

  const root = document.createElement('div');
  root.id = 'home-art';
  root.dataset.scene = 'jungle';
  const sprite = (name, css) => `<img class="${css}" src="${ART + name}.webp" alt="" draggable="false">`;
  const hit = (pet, label) => `<button class="j-hit" type="button" data-no-autofit data-j-pet="${pet}" aria-label="${label}"></button>`;
  root.innerHTML = `<div class="hs-stage">
    <img class="hs-plate" src="${PLATE}" alt="" draggable="false">
    <div class="j-snake-slot"><div class="j-snake">
      ${sprite('snake', 'j-art')}<i class="j-tongue" aria-hidden="true"></i>
    </div></div>
    <div class="j-hollow" aria-hidden="true">
      <div class="j-owl-eyes"><i></i><i></i></div>
      <img class="j-owl" src="${OWL}" alt="" draggable="false">
    </div>
    <div class="j-vine">
      <svg class="j-stem" viewBox="0 0 32 700" preserveAspectRatio="none" aria-hidden="true">
        <path d="M16 0 C13 185 20 415 16 605 Q15 665 6 693" fill="none" stroke="#394720" stroke-width="8" stroke-linecap="round"/>
        <path d="M15 0 C12 185 19 415 15 605 Q14 665 5 693" fill="none" stroke="#79a945" stroke-width="4" stroke-linecap="round"/>
      </svg>
      ${MONKEYS.map((id, i) => `<div class="j-monkey j-monkey-${id}"><div class="j-swing"><div class="j-acting">
        ${sprite('tail', 'j-tail')}${sprite('monkey-' + id, 'j-monkey-body')}
        ${id === 'a' ? sprite('monkey-a', 'j-limb j-wave') : id === 'b' ? sprite('monkey-b', 'j-limb j-kick') : ''}
      </div></div>${hit('monkey', 'Play with monkey ' + (i + 1))}</div>`).join('')}
    </div>
    <div class="j-sloth"><div class="j-sloth-pose">
      ${sprite('sloth', 'j-art')}<i class="j-lid j-lid-left"></i><i class="j-lid j-lid-right"></i>
    </div>${hit('sloth', 'Say hello to the sloth')}</div>
  </div>`;

  function start(play, stopSound) {
    const events = new AbortController();
    const doc = home.ownerDocument, media = matchMedia('(prefers-reduced-motion: reduce)');
    const vine = root.querySelector('.j-vine'), sloth = root.querySelector('.j-sloth');
    const monkeys = [...root.querySelectorAll('.j-acting')];
    const reactions = [];
    let active;
    function clearReactions() {
      for (const motion of reactions.splice(0)) motion.cancel();
    }
    function sync() {
      const mode = doc.documentElement.dataset.motion;
      const visible = !doc.hidden && home.classList.contains('active');
      root.classList.toggle('hs-paused', !visible);
      active = visible && mode !== 'reduce' && (mode === 'full' || !media.matches);
      if (!active) {
        clearReactions();
        stopSound();
      }
    }
    function react(el, frames, timing) {
      const motion = el.animate(frames, timing);
      reactions.push(motion);
      motion.onfinish = () => {
        const index = reactions.indexOf(motion);
        if (index !== -1) reactions.splice(index, 1);
      };
    }
    root.addEventListener('click', event => {
      const pet = event.target.closest('[data-j-pet]')?.dataset.jPet;
      if (!active || !pet || reactions.length) return;
      play(pet === 'monkey' ? 0 : 1);
      if (pet === 'monkey') {
        react(vine, [
          { rotate: '0deg' }, { rotate: '-5deg', offset: .27 },
          { rotate: '3deg', offset: .62 }, { rotate: '0deg' },
        ], { duration: 1150, easing: 'ease-in-out' });
        monkeys.forEach((monkey, i) => {
          react(monkey, [
            { rotate: '0deg', scale: '1' }, { rotate: '17deg', scale: '1.03 .93', offset: .26 },
            { rotate: '-11deg', scale: '.97 1.06', offset: .55 }, { rotate: '0deg', scale: '1' },
          ], { duration: 860, delay: i * 150, easing: 'ease-in-out' });
          react(monkey.querySelector('.j-tail'), [
            { rotate: '0deg' }, { rotate: '-34deg', offset: .3 },
            { rotate: '28deg', offset: .6 }, { rotate: '0deg' },
          ], { duration: 850, delay: i * 150, easing: 'ease-in-out' });
        });
      } else {
        react(sloth, [
          { rotate: '0deg' }, { rotate: '-8deg', offset: .38 },
          { rotate: '-8deg', offset: .68 }, { rotate: '0deg' },
        ], { duration: 2300, easing: 'ease-in-out' });
      }
    }, { signal: events.signal });

    const observer = new MutationObserver(sync);
    observer.observe(home, { attributes: true, attributeFilter: ['class'] });
    observer.observe(doc.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
    doc.addEventListener('visibilitychange', sync, { signal: events.signal });
    media.addEventListener('change', sync, { signal: events.signal });
    sync();
    return () => {
      observer.disconnect();
      events.abort();
      clearReactions();
    };
  }
  return { root, stage: root.firstElementChild, start };
}
