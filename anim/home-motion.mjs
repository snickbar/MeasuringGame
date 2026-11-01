import { HOME_LAYER_PLACEMENTS, assembleHomeProp, artCell } from './home-layer-art.mjs';
import { HOME_LAYER_SHEETS } from './home-layer-sheets.mjs';
import { decorateNewHomeProp, decorateNewHomeHero } from './home-new-scenes.mjs';
// Hand-authored motion sits beside the generated artwork recipes: rebuilding the
// WebP rigs must not overwrite timing, attachment points or tap behaviour.
export const HOME_MOTION = {
  ants:       { hero: "balance", prop: null,       taps: ["ant-wave", "melon-shine"] },
  sunflower:  { hero: "balance", prop: "stem",     taps: ["ladybug-flutter", "flower-nod"] },
  games:      { hero: null,      prop: null,       taps: ["cube-turn", "board-rock"] },
  house:      { hero: null,      prop: null,       taps: ["can-fizz", "fridge-glint"] },
  snacks:     { hero: "balance", prop: null,       taps: ["berry-leaves", "cherry-bounce"] },
  town:       { hero: null,      prop: null,       taps: ["mail-open", "lamp-glow"] },
  corgi:      { hero: "breathSoft",prop: null,      taps: ["dog-perk", "kibble-tumble"] },
  wheels:     { hero: null,      prop: null,       taps: ["engine-start", "cone-balance"] },
  lighthouse: { hero: null,      prop: null,       taps: ["light-sweep", "cup-clink"] },
  underwater: { hero: "float",   prop: "current",  taps: ["turtle-paddle", "shell-rock"] },
  "toy-box":  { hero: null,      prop: null,       taps: ["robot-wave", "blocks-balance"] },
  penguin:    { hero: "breathSoft",prop: null,      taps: ["penguin-wave", "ice-shimmer"] },
  cactus:     { hero: null,      prop: null,       taps: ["hat-tip", "cactus-bloom"] },
  giraffe:    { hero: "breathSoft",prop: null,      taps: ["giraffe-ears", "duck-flutter"] },
  dragon:     { hero: "dragonBreath",prop: null,    taps: ["dragon-wake", "coin-shimmer"] },
  space:      { hero: "orbit",   prop: "rocketFloat",taps: ["space-wave", "rocket-pulse"] },
  'make-believe': { hero:null,prop:null,taps:['unicorn-greet','spellbook-open'] },
  'holiday-mix': { hero:null,prop:null,taps:['snowman-greet','gift-surprise'] },
};
export const HOME_EXTRA_ART = Object.fromEntries(Object.entries(HOME_MOTION).map(([scene]) => {
  const p=HOME_LAYER_PLACEMENTS[scene], files=p?[HOME_LAYER_SHEETS[p.id].file]:[];
  if(scene==='toy-box')files.push('refined/robot-arm-parts.webp','../../items/beach-ball.webp');
  if(scene==='corgi')files.push('refined/kibble.webp');
  if(scene==='house')files.push('refined/mouse-cheese-walk.webp','fridge-clean-v2.webp','fridge-magnets-v2.webp');
  if(scene==='house')files.push('idle/kitchen-clean.webp','idle/kitchen-utensils.webp');
  if(scene==='wheels')files.push('stories/rider.webp');
  if(scene==='toy-box')files.push('stories/jack.webp','stories/jack-lid-open-v2.webp');
  if(scene==='make-believe')files.push('stories/rabbit.webp');
  if(scene==='games')files.push('../../items/dolphin.webp','../../items/cruise-ship.webp');
  if(scene==='dragon')files.push('flying-dragon-parts-v2.webp');
  if(scene==='make-believe')files.push('unicorn-tail-v3.webp','books-make-believe.webp','spellbook-textures-v2.webp','fairy-parts-v2.webp');
  if(scene==='holiday-mix')files.push('snowman-parts-v2.webp','gifts-holiday-mix.webp','gift-lid-v2.webp','gift-turkey-v2.webp','holiday-rainbow-v2.webp');
  return [scene,files];
}));

// Convert a point on a prop's original canvas to reference-picture coordinates.
// Keeping effects in their owner's coordinate system prevents floating flowers,
// bubbles on foreheads and sparkles accidentally attached to a character.
export function propEffect(effect, spec, { x, y, w, h }) {
  const scale = spec.w / 100 * 704 / spec.sw;
  return { ...effect, ref: true, on: "hero2", x: spec.x / 100 * 704 + x * scale,
    y: spec.y / 100 * 1520 + y * scale, w: w * scale, h: h * scale };
}

export function homeRigMotion(scene, rig, art) {
  if (!rig) return null;
  const result = { ...rig, parts: rig.parts.map(p => ({ ...p })), patches: rig.patches.map(p => ({ ...p })), fx: (rig.fx || []).map(p => ({ ...p })) };
  if (scene === "house") result.fx = result.fx.filter(f => f.anim !== "rise").map(f => ({ ...f, anim: "fizz", dur: 9.4, frameDur: .52, delay: 1.2 }));
  if (scene === "wheels") result.fx = result.fx.map((f, i) => i === 0
    ? { ...f, anim: "engine", dur: 12, frameDur: .42 }
    : { ...f, anim: i === 1 ? "exhaustLeft" : "exhaustRight", dur: 12, frameDur: 1.15, delay: 0,
      x: i === 1 ? 235 : 255, y: 1570, w: 350, h: 270 });
  if (scene === "wheels") result.fx.push({ ...result.fx[1], delay: .6 }, { ...result.fx[2], delay: 1.1 });
  if (scene === "lighthouse") result.fx = result.fx.map((f, i) => i === 1
    ? { ...f, anim: "beamSweep", dur: 12, stageBack: true }
    : i === 2 ? { ...f, anim: "lantern", dur: 6 } : { ...f, anim: "steam", dur: 7.2, followTop: true });
  if (scene === "underwater") result.fx = result.fx.map((f, i) => ({ ...f, x: 700, y: 590, anim: "mouthBubbles", dur: 8.4, delay: i * 3.2 }));
  if (scene === "penguin") result.fx = result.fx.map((f, i) => propEffect({ ...f, dur: 8.2 + i * 1.7 }, art.hero2,
    [{ x: 333, y: 225, w: 64, h: 65 }, { x: 477, y: 720, w: 57, h: 63 }, { x: 348, y: 1260, w: 58, h: 60 }][i]));
  if (scene === "cactus") result.fx = result.fx.map(f => propEffect({ ...f, anim: "bloom", dur: 11, delay: 0 }, art.hero2,
    { x: 349, y: 17, w: 170, h: 143 }));
  // The old glint frames contain another miniature coin. The solid cylinder
  // now supplies its own faces and edge instead of drawing a coin on a coin.
  if (scene === "dragon") result.fx = result.fx.slice(0, 1).map(f => ({ ...f, anim: "dragonFire", dur: 16, frameDur: .64, delay: 0 }));
  if (scene === "giraffe") result.fx = []; // The isolated duck contains its own wing.
  if (scene === "space") result.fx = result.fx.map(f => ({ ...f, on: "hero2" }));
  return result;
}

const polygon = points => points.map(([x, y]) => `${x}% ${y}%`).join(", ");
function sheen(parent, img, cls = "") {
  const shine = document.createElement("div"); shine.className = "hs-sheen " + cls;
  shine.style.setProperty("--sprite", `url("${img.src}")`); parent.appendChild(shine);
}

export function decorateHomeProps(scene, { hop, img, spec, extras }) {
  const added=decorateNewHomeProp(scene,{hop,img,extras});if(added)return added;
  if(scene==='house'){
    img.hidden=true;img.style.display='none';
    const clean=artCell(extras.get('fridge-clean-v2.webp'),[210,85,641,1330],[216,87,635,1328],spec,'hs-fridge-clean');hop.appendChild(clean);
    const magnets=extras.get('fridge-magnets-v2.webp');
    const pieces=[
      {cell:[133,128,424,413],box:[396,212,100,100],dx:144,dy:88,turn:16},
      {cell:[743,161,366,366],box:[599,210,80,80],dx:-179,dy:5,turn:-14},
      {cell:[190,718,315,391],box:[528,306,68,80],dx:132,dy:-76,turn:18},
      {cell:[755,688,387,474],box:[644,302,90,116],dx:-199,dy:3,turn:-18},
    ];
    for(const [i,p]of pieces.entries()){
      const magnet=artCell(magnets,p.cell,p.box,spec,'hs-fridge-magnet');
      magnet.style.setProperty('--magnet-x',p.dx/spec.sw*100+'cqw');magnet.style.setProperty('--magnet-y',p.dy/spec.sw*100+'cqw');magnet.style.setProperty('--magnet-turn',p.turn+'deg');magnet.style.setProperty('--magnet-delay',i*.08+'s');hop.appendChild(magnet);
    }
    return {magnets:true};
  }
  const layers=assembleHomeProp(scene,{hop,img,spec,extras},HOME_LAYER_SHEETS);
  if(layers){
    if(scene==='snacks'){const drip=document.createElement('i');drip.className='hs-ice-drip';hop.appendChild(drip);}
    return layers;
  }
  if (scene === "town") {
    const halo = document.createElement("i"); halo.className = "hs-lamp-halo"; hop.insertBefore(halo, img);
    for(const points of [ [[35.3,15.3],[54.3,14.8],[52.2,27.3],[40.7,27.2]], [[56.5,15.3],[64.7,16.1],[59.7,27.5],[54.9,27.1]] ]){
      const pane=document.createElement('i');pane.className='hs-lamp-pane';pane.style.clipPath=`polygon(${polygon(points)})`;hop.appendChild(pane);
    }
  }
  if (["ants", "games", "house", "space"].includes(scene)) sheen(hop, img);
  if (scene === "space") {
    img.style.clipPath = "polygon(evenodd, 0 0,100% 0,100% 100%,0 100%,0 0,39% 84%,62% 84%,62% 100%,39% 100%,39% 84%,0 0)";
    hop.querySelector(".hs-sheen").style.clipPath = img.style.clipPath;
  }
  return {};
}

export function decorateHomePart(scene, img, q, extras) {
  if(scene==='sunflower'&&q.anim==='flapS'){
    const wings=document.createElement('div');wings.className='hs-rig hs-lady-wings';wings.style.cssText=img.style.cssText;
    for(const side of ['left','right']){const wing=img.cloneNode();wing.className='hs-lady-wing hs-lady-'+side;wing.removeAttribute('style');wings.appendChild(wing);}
    return wings;
  }

  if (scene === "toy-box" && q.anim === "armIdle") {
    const arm = document.createElement("div"); arm.className = img.className; arm.style.cssText = img.style.cssText;
    // Complete generated parts, aligned by the centres of their round sockets.
    // Never slice through the assembled arm: those cuts expose triangular gaps.
    const sheet=extras.get('refined/robot-arm-parts.webp'),spec={sw:q.w,sh:q.h};
    const shoulder=[q.w*.35,q.h*.08],elbow=[q.w*.7,q.h*.47];
    const dx=elbow[0]-shoulder[0],dy=elbow[1]-shoulder[1],scale=Math.hypot(dx,dy)/(607-118);
    const upper=artCell(sheet,[272,64,415,646],[shoulder[0]-215*scale,shoulder[1]-54*scale,415*scale,646*scale],spec,'hs-arm-upper');
    upper.style.transformOrigin=`${215/415*100}% ${54/646*100}%`;upper.style.transform=`rotate(${Math.atan2(dy,dx)*180/Math.PI-90}deg)`;
    const forearm=document.createElement('div');forearm.className='hs-forearm';
    const closed=artCell(sheet,[875,64,309,650],[elbow[0]-143*.55,elbow[1]-96*.55,309*.55,650*.55],spec,'hs-arm-closed');
    const open=artCell(sheet,[1392,64,405,674],[elbow[0]-147*.55,elbow[1]-96*.55,405*.55,674*.55],spec,'hs-arm-open');
    forearm.append(closed,open);arm.append(upper,forearm);return arm;
  }
  if (scene === "games" && q.anim === "twistS") {
    // A real five-sided cuboid: side faces rotate into view rather than
    // squashing a flat illustration. Stickers retain the game's bright palette.
    const frame = document.createElement("div"); frame.className = "hs-rig hs-cube-slice"; frame.style.cssText = img.style.cssText;
    const camera = document.createElement("div"); camera.className = "hs-cube-camera";
    const rotor = document.createElement("div"); rotor.className = "hs-cube-rotor";
    const colors = ["#ffe12d","#1687ff","#ffe12d","#2cdb48","#2586ff","#ffe12d","#ff4436","#f7f9ff","#ff503c"];
    for (const [i, side] of ["top","front","right","back","left"].entries()) {
      const face = document.createElement("div"); face.className = "hs-cube-face hs-cube-" + side;
      for (let n=0;n<(i?3:9);n++) {
        const tile=document.createElement("i");tile.style.setProperty("--tile",colors[(n+i*2)%colors.length]);
        if (side === "front" && n === 1) { tile.className="hs-cube-smile";tile.style.setProperty("--tile","#ffe12d"); }
        face.appendChild(tile);
      }
      rotor.appendChild(face);
    }
    camera.appendChild(rotor); frame.appendChild(camera); return frame;
  }
  return img;
}

export function decorateHomeHero(scene, { hop, img, base, W, H, extras }) {
  const added=decorateNewHomeHero(scene,{hop,img,extras});if(added)return added;
  if (scene === "house") for (let i = 0; i < 5; i++) { const bubble = document.createElement("i"); bubble.className = "hs-soda-bubble"; bubble.style.setProperty("--bi", i); hop.appendChild(bubble); }
  if (scene === "town") {
    const seam = (242 - base.y) / base.h * 100;
    const closed = img.cloneNode(); closed.classList.add("hs-mail-closed"); closed.style.clipPath = `inset(0 0 ${100-seam}% 0)`;
    img.style.clipPath = `inset(${seam}% 0 0 0)`; hop.appendChild(closed);
  }
  if (scene === "toy-box") {
    const head = document.createElement("div"); head.className = "hs-detail hs-robot-head"; head.style.transformOrigin = "50% 38%";
    const seam = (714 - base.y) / base.h * 100, face = img.cloneNode(); face.className = "hs-part";
    face.style.clipPath = `inset(0 0 ${100-seam}% 0)`; head.appendChild(face);
    img.style.clipPath = `inset(${seam}% 0 0 0)`; hop.appendChild(head); return { head };
  }
  if (scene === "space") {
    const visor = document.createElement("div"); visor.className = "hs-visor-glint";
    visor.style.cssText = `left:${318/W*100}%;top:${72/H*100}%;width:${227/W*100}%;height:${198/H*100}%`;
    hop.appendChild(visor);
  }
  return {};
}

export function installHomeInteractions(root, home, scene, sound, stopSound = () => {}) {
  const feedback=new Map();
  const refresh=()=>{const tokens=[...feedback.keys()].map(role=>HOME_MOTION[scene].taps[role]);if(tokens.length)root.dataset.reaction=tokens.join(' ');else delete root.dataset.reaction;};
  const reset = () => { for(const timer of feedback.values())clearTimeout(timer);feedback.clear();refresh(); };
  function react(role) {
    if (![0,1].includes(role)||feedback.has(role)||document.hidden || !root.isConnected || !home.classList.contains("active")) return;
    const signature=el=>{const s=getComputedStyle(el);return [s.animationName,s.animationDuration,s.animationIterationCount].join('|');};
    const previous=new Map([...root.querySelectorAll('*')].map(el=>[el,signature(el)]));
    feedback.set(role,null);void root.offsetWidth;refresh();
    // A tap shortens an idle gesture to one cycle. Explicitly seek that cycle
    // to its start; changing CSS duration alone would keep the old idle time.
    const gestures = [...root.querySelectorAll("*")].filter(el => {
      const style = getComputedStyle(el);
      return previous.get(el)!==signature(el)&&style.animationName !== "none" && style.animationIterationCount.split(",").some(n => n.trim() === "1");
    }).map(el => [el, el.style.cssText]);
    // A finished CSS animation is omitted by getAnimations(). Removing its
    // animation-name for one style calculation also restarts that late case.
    for (const [el] of gestures) el.style.setProperty("animation-name", "none", "important");
    void root.offsetWidth;
    for (const [el, inline] of gestures) el.style.cssText = inline;
    sound(scene, role);
    // Unlock this object after its own last delayed animation ends. Other objects keep playing.
    const end=Math.max(300,...gestures.flatMap(([el])=>el.getAnimations().map(a=>a.effect.getComputedTiming().endTime).filter(Number.isFinite)));
    feedback.set(role,setTimeout(()=>{feedback.delete(role);refresh();},end+40));
  }
  const sync = () => { const active = !document.hidden && home.classList.contains("active"); root.classList.toggle("hs-paused", !active); if (!active) { reset(); stopSound(); } };
  const observer = new MutationObserver(sync); observer.observe(home, { attributes: true, attributeFilter: ["class"] });
  document.addEventListener("visibilitychange", sync);
  const cleanup = () => { reset(); stopSound(); observer.disconnect(); document.removeEventListener("visibilitychange", sync); };
  sync();
  return { react, cleanup };
}
