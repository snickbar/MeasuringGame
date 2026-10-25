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
};
export const HOME_EXTRA_ART = {
  "toy-box": ["refined/robot-arm-open.webp"],
  corgi: ["refined/corgi-bowl.webp"],
};

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
  // The old "coin glint" frames contain another miniature coin. Use the
  // alpha-masked sheen on the actual coin instead of drawing a coin on it.
  if (scene === "dragon") result.fx = result.fx.slice(0, 1).map(f => ({ ...f, anim: "dragonFire", dur: 16, frameDur: .64, delay: 0 }));
  if (scene === "giraffe") result.fx = result.fx.map(f => ({ ...f, followTop: true }));
  if (scene === "space") result.fx = result.fx.map(f => ({ ...f, on: "hero2" }));
  return result;
}

const polygon = points => points.map(([x, y]) => `${x}% ${y}%`).join(", ");
// Clip copies of our own illustration into animation pieces, without resampling
// or shipping duplicate bitmaps. The remaining sprite gets matching holes.
function cutPiece(img, points, cls, pivot, parent = img.parentElement) {
  const layer = document.createElement("div"); layer.className = "hs-detail " + cls;
  layer.style.transformOrigin = pivot;
  const copy = img.cloneNode(); copy.className = "hs-part"; copy.style.clipPath = `polygon(${polygon(points)})`;
  layer.appendChild(copy); parent.appendChild(layer);
  const holes = img._homeHoles || (img._homeHoles = []); holes.push(points);
  const outer = img._homeOuter || rect(0, 0, 100, 100), start = outer[0];
  img.style.clipPath = `polygon(evenodd, ${polygon([...outer, start])}, ${holes.map(p => polygon([...p, p[0]]) + `, ${start[0]}% ${start[1]}%`).join(", ")})`;
  return layer;
}
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
function sheen(parent, img, cls = "") {
  const shine = document.createElement("div"); shine.className = "hs-sheen " + cls;
  shine.style.setProperty("--sprite", `url("${img.src}")`); parent.appendChild(shine);
}

export function decorateHomeProps(scene, { hop, img, spec, extras }) {
  let top = null;
  if (scene === "town") {
    const halo = document.createElement("i"); halo.className = "hs-lamp-halo"; hop.insertBefore(halo, img);
    const pane = document.createElement("i"); pane.className = "hs-lamp-pane";
    pane.style.clipPath = `polygon(${polygon([[35.8,16.2],[53.4,15.2],[51.5,26.8],[41.1,26.8]])})`;
    hop.appendChild(pane);
    const side = pane.cloneNode(); side.style.clipPath = `polygon(${polygon([[57.4,16],[63.9,16.8],[58.8,27],[55.3,26.7]])})`; hop.appendChild(side);
  }
  if (["ants", "games", "house", "penguin", "dragon", "space"].includes(scene)) sheen(hop, img);
  if (scene === "snacks") {
    top = cutPiece(img, [[38, 8], [46, 8], [46, 5], [52, 2], [58, 2], [54, 8], [53, 9], [59, 10], [59, 14], [55, 16], [44, 16], [38, 14]], "hs-cherry", "49% 15.5%");
    const drip = document.createElement("i"); drip.className = "hs-ice-drip"; hop.appendChild(drip);
  }
  if (scene === "corgi") {
    // Replace the airborne food and motion streaks with one settled bowl.
    img.style.clipPath = "inset(25.4% 0 0 0)";
    const bowl = extras.get("refined/corgi-bowl.webp").cloneNode(); bowl.className = "hs-settled-bowl";
    hop.appendChild(bowl);
    const food = bowl.cloneNode(); food.className = "hs-bowl-food";
    const well = document.createElement("div"); well.className = "hs-food-well";
    well.appendChild(food); hop.appendChild(well);
  }
  if (scene === "wheels") top = cutPiece(img, rect(30, 1, 40, 18.3), "hs-cone-top", "50% 18.8%");
  if (scene === "lighthouse") top = cutPiece(img, rect(28, 0, 44, 21), "hs-cup-top", "51% 20.7%");
  if (scene === "toy-box") top = cutPiece(img, rect(26, 7, 48, 18.8), "hs-block-roof", "51% 25.6%");
  const sourcePolygon = points => points.map(([x,y]) => [x/spec.sw*100,y/spec.sh*100]);
  if (scene === "penguin") top = cutPiece(img, sourcePolygon([[386,102],[408,110],[475,149],[524,177],[543,208],[567,246],[566,279],[539,298],[505,347],[478,378],[452,384],[424,377],[406,362],[362,343],[326,323],[307,294],[291,250],[290,225],[302,201],[330,167],[364,119]]), "hs-ice-top", "53% 20.4%");
  if (scene === "dragon") {
    // Another complete coin from lower in the same stack restores the surface
    // behind the tilted top coin when it turns edge-on.
    const surface = img.cloneNode(); surface.className = "hs-part";
    surface.style.clipPath = `polygon(${polygon(rect(32,25.8,39,8.5))})`; surface.style.transform = "translateY(-7.8%)";
    hop.insertBefore(surface,img);
    top = cutPiece(img, sourcePolygon([[480,86],[536,97],[584,136],[610,185],[608,236],[578,283],[534,330],[489,358],[433,382],[384,391],[337,376],[307,353],[297,327],[289,297],[293,256],[312,207],[343,167],[386,129],[429,102]]), "hs-coin-top", "52% 20.8%");
  }
  if (scene === "giraffe") {
    top = cutPiece(img, rect(30, 1, 35, 16.8), "hs-duck-top", "47% 17.5%");
    // Keep the original winking expression, swapping just the closed eye for
    // an open eye between winks. Both states stay attached to the same head.
    const eye = document.createElement("i"); eye.className = "hs-duck-eye"; top.appendChild(eye);
  }
  if (scene === "space") {
    // The live flame replaces the old painted flame. Fins and nozzle stay intact.
    img.style.clipPath = "polygon(evenodd, 0 0,100% 0,100% 100%,0 100%,0 0,39% 84%,62% 84%,62% 100%,39% 100%,39% 84%,0 0)";
    hop.querySelector(".hs-sheen").style.clipPath = img.style.clipPath;
  }
  return { top };
}

export function decorateHomePart(scene, img, q, extras) {
  if (scene === "toy-box" && q.anim === "armIdle") {
    const arm = document.createElement("div"); arm.className = img.className; arm.style.cssText = img.style.cssText;
    img.className = "hs-arm-closed"; img.removeAttribute("style");
    const open = extras.get("refined/robot-arm-open.webp").cloneNode(); open.className = "hs-arm-open";
    arm.append(img, open); return arm;
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

export function decorateHomeHero(scene, { hop, img, base, W, H }) {
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
  let feedback = null;
  const reset = () => { clearTimeout(feedback); delete root.dataset.reaction; };
  function react(role) {
    if (document.hidden || !root.isConnected || !home.classList.contains("active")) return;
    reset(); void root.offsetWidth;
    root.dataset.reaction = HOME_MOTION[scene].taps[role];
    if (scene === "town" && role === 1) root.dataset.lamp = root.dataset.lamp === "on" ? "off" : "on";
    // A tap shortens an idle gesture to one cycle. Explicitly seek that cycle
    // to its start; changing CSS duration alone would keep the old idle time.
    const gestures = [...root.querySelectorAll("*")].filter(el => {
      const style = getComputedStyle(el);
      return style.animationName !== "none" && style.animationIterationCount.split(",").some(n => n.trim() === "1");
    }).map(el => [el, el.style.cssText]);
    // A finished CSS animation is omitted by getAnimations(). Removing its
    // animation-name for one style calculation also restarts that late case.
    for (const [el] of gestures) el.style.setProperty("animation-name", "none", "important");
    void root.offsetWidth;
    for (const [el, inline] of gestures) el.style.cssText = inline;
    sound(scene, role);
    feedback = setTimeout(reset, scene === "dragon" ? 3300 : 2300);
  }
  const sync = () => { const active = !document.hidden && home.classList.contains("active"); root.classList.toggle("hs-paused", !active); if (!active) { reset(); stopSound(); } };
  const observer = new MutationObserver(sync); observer.observe(home, { attributes: true, attributeFilter: ["class"] });
  document.addEventListener("visibilitychange", sync);
  const cleanup = () => { reset(); stopSound(); observer.disconnect(); document.removeEventListener("visibilitychange", sync); };
  sync();
  return { react, cleanup };
}
