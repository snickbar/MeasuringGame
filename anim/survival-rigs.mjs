const knightBody = 'survival-knight-parts-v2.webp';
const knightArm = 'survival-knight-parts-v3.webp';
const dragonParts = 'survival-dragon-parts-v2.webp';
const strike = 'survival-knight-strike.webp';
const bladeArt = 'survival-loose-sword.webp';
const block = 'survival-knight-block.webp';
export const SURVIVAL_IMPACT_MS = Object.freeze({ miss: 2240, saved: 1450 });

let preloaded;
export function preloadSurvivalRigArt() {
  return preloaded ||= Promise.all([knightBody, knightArm, dragonParts, strike, bladeArt, block, 'survival-dragon-flame.webp'].map(file => {
    const image = new Image();
    image.src = new URL(`../icons/${file}`, import.meta.url).href;
    return image.decode().catch(() => {});
  }));
}

const art = (file, className = '', style = '') => `<img src="icons/${file}" alt="" draggable="false" class="${className}"${style ? ` style="${style}"` : ''}>`;
const layer = (name, children = '') => `<span class="sv-battle-${name}">${children}</span>`;
function part(file, className, [x,y,w,h], [left,top,width], pivot, wrap = img => img) {
  const origin = pivot ? `;transform-origin:${(pivot[0]-x)/w*100}% ${(pivot[1]-y)/h*100}%` : '';
  const img = art(file, '', `width:${1774/w*100}%;height:${887/h*100}%;left:${-x/w*100}%;top:${-y/h*100}%`);
  return `<span class="sv-part ${className}" style="left:${left/512*100}%;top:${top/512*100}%;width:${width/512*100}%;height:${width*h/w/512*100}%${origin}">${wrap(img)}</span>`;
}

export function survivalBattleHtml(mood, reduced = false) {
  const split = mood === 'safe' || mood === 'miss';
  const arm = part(knightArm, 'sv-sword-arm', [1143,80,530,655], [-1.5,12.864,239.14], [1605,650],
    img => split ? layer('sword-dock', art(bladeArt, 'sv-battle-blade')) + layer('gauntlet', img) : img);
  const knight = part(knightBody, 'sv-knight-body', [140,30,820,835], [120,92,370]) + (split ? layer('swipe') : '') + arm;
  const jaw = part(dragonParts, 'sv-dragon-jaw', [1390,426,320,160], [382.5,200.4,108.8], [1420,470]);
  const body = part(dragonParts, 'sv-dragon-body', [33,8,1140,866], [10,84,488]);
  const expression = mood === 'safe' ? layer('dragon-expression', '<i class="sv-battle-dragon-eye"></i><i class="sv-battle-dragon-brow"></i><i class="sv-battle-dragon-sweat"></i>') : '';
  const dragon = layer('dragon-head', jaw + (split ? layer('dragon-face', body) : '') + expression) + layer('dragon-torso', body);
  const fire = layer('fire');
  const shield = layer('deflected-fire', '<i></i><i></i>') + layer('impact', '&#10022;<i></i><i></i><i></i>');
  const stars = layer('stars', '<i>&#10022;</i><i>&#10023;</i><i>&#10022;</i><i>&#10022;</i><i>&#10023;</i><i>&#10022;</i><i>&#10023;</i>');
  const labels = {safe:'Replay the knight’s swing', miss:'Replay the dragon’s fire', saved:'Replay the shield block', record:'Replay the personal best celebration'};
  return `<button type="button" class="sv-battle" data-scene="${mood}" aria-label="${labels[mood]}"${reduced ? ' disabled' : ''}>
    <span class="sv-battle-stage" aria-hidden="true">
      ${layer('glow')}${layer('wall')}${layer('ground')}
      ${layer('knight', `<span class="sv-knight sv-rig">${knight}</span>` + (mood === 'saved' ? art(block, 'sv-battle-block') : '') + (mood === 'miss' ? layer('burn','<i></i><i></i><i></i>') : ''))}
      ${layer('dragon', `<span class="sv-dragon sv-rig">${dragon}</span>`)}
      ${mood === 'safe' ? art(strike, 'sv-battle-strike-pose') : ''}
      ${mood === 'miss' || mood === 'saved' ? fire : ''}
      ${mood === 'saved' ? shield : ''}
      ${split ? layer('dust', '<i></i><i></i><i></i>') : ''}
      ${mood === 'record' ? stars : ''}
    </span>
  </button>`;
}

// Drop and retrieve the actual sword element. Its center and angle carry across
// the change from the knight's moving wrist to the floor, then back into his hand.
function swordMotion(scene) {
  const stage = scene.querySelector('.sv-battle-stage');
  const knight = scene.querySelector('.sv-battle-knight');
  const arm = scene.querySelector('.sv-sword-arm');
  const dock = scene.querySelector('.sv-battle-sword-dock');
  const blade = dock.firstElementChild;
  const matrix = node => new DOMMatrix(getComputedStyle(node).transform);
  const angle = m => Math.atan2(-m.c,m.d) * 180 / Math.PI;
  const orientation = () => matrix(knight).multiply(matrix(arm)).multiply(matrix(dock));
  const center = node => {
    const box = node.getBoundingClientRect();
    const floor = stage.getBoundingClientRect();
    return { x: (box.left + box.width / 2 - floor.left) / floor.width * 100,
      y: (box.top + box.height / 2 - floor.top) / floor.height * 100 };
  };
  const frame = ({x,y}, rotation) => ({
    left: x+'%', top: y+'%', transform: `translate(-50%,-50%) rotate(${rotation}deg)`
  });
  let motion;
  function reset() {
    motion?.cancel();
    blade.classList.remove('released');
    blade.style.removeProperty('width');
    dock.append(blade);
  }
  function cue(event) {
    if (event.animationName === 'svBattlePickupCue' && blade.classList.contains('released')) {
      const start = frame(center(blade), angle(matrix(blade)));
      const m = orientation();
      const end = frame(center(dock), angle(m));
      end.transform += ` scale(${Math.hypot(m.a,m.b)},${Math.hypot(m.c,m.d)})`;
      motion?.cancel();
      motion = blade.animate([start,end], {duration:255,fill:'both',easing:'ease-in-out'});
      motion.onfinish = reset;
      return;
    }
    if (event.animationName !== 'svBattleReleaseCue' || blade.parentElement !== dock) return;
    const width = blade.offsetWidth / stage.getBoundingClientRect().width * 100;
    const {x,y} = center(blade);
    const start = frame({x,y}, angle(orientation()));
    stage.append(blade);
    blade.classList.add('released');
    blade.style.width = width + '%';
    motion = blade.animate([
      {...start,easing:'cubic-bezier(.45,.05,.75,.55)'},
      {...frame({x:x+5,y:86},113),offset:.48,easing:'ease-out'},
      {...frame({x:x+7,y:79},82),offset:.65,easing:'ease-in'},
      {...frame({x:x+9,y:89},96),offset:.84},
      frame({x:x+10,y:89},92)
    ], {duration:790,fill:'both'});
  }
  scene.addEventListener('animationend', cue);
  return { reset, destroy() { scene.removeEventListener('animationend', cue); reset(); } };
}

export function mountSurvivalBattle(scene, screen, reducedMotion) {
  const mood = scene.dataset.scene;
  const hasReturn = mood === 'safe' || mood === 'miss';
  const sword = mood === 'miss' ? swordMotion(scene) : null;
  const doc = scene.ownerDocument;
  let timer;
  const active = () => scene.isConnected && screen.classList.contains('active') && !doc.hidden;
  const remaining = () => Math.max(0, ...scene.getAnimations({subtree:true})
    .map(animation => animation.effect.getComputedTiming().endTime - (animation.currentTime || 0)));
  function schedule() {
    clearTimeout(timer);
    if (!active() || reducedMotion()) return;
    const returning = scene.classList.contains('returning');
    timer = setTimeout(repeat, remaining() + (returning ? 80 : 2000));
  }
  function play() {
    scene.classList.remove('playing', 'returning');
    sword?.reset();
    void scene.offsetWidth;
    scene.disabled = reducedMotion();
    if (!scene.disabled) scene.classList.add('playing');
    schedule();
  }
  function repeat() {
    if (!active() || reducedMotion()) return;
    if (hasReturn && !scene.classList.contains('returning')) {
      scene.classList.add('returning');
      schedule();
      return;
    }
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
    scene.classList.remove('playing', 'returning');
    sword?.destroy();
  };
}
