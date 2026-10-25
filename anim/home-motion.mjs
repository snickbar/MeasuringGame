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
  if (scene === "cactus") result.fx = result.fx.map(f => propEffect({ ...f, anim: "bloom", dur: 16, delay: 0 }, art.hero2,
    { x: 404, y: -7, w: 132, h: 111 }));
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

export function decorateHomeProps(scene, { hop, img, spec }) {
  let top = null;
  if (scene === "town") { const halo = document.createElement("i"); halo.className = "hs-lamp-halo"; hop.insertBefore(halo, img); }
  if (["ants", "games", "house", "penguin", "dragon", "space"].includes(scene)) sheen(hop, img);
  if (scene === "snacks") {
    top = cutPiece(img, [[38, 8], [46, 8], [46, 5], [52, 2], [58, 2], [54, 8], [53, 9], [59, 10], [59, 14], [55, 16], [44, 16], [38, 14]], "hs-cherry", "49% 15.5%");
    const drip = document.createElement("i"); drip.className = "hs-ice-drip"; hop.appendChild(drip);
  }
  if (scene === "corgi") {
    [[40.5, 1.3, 6.4, 4.1], [38.5, 6.3, 5.8, 3.6], [46.9, 6.3, 6, 4.2]].forEach((r, i) => {
      const piece = cutPiece(img, rect(...r), "hs-kibble", `${r[0] + r[2]/2}% ${r[1] + r[3]/2}%`);
      piece.style.setProperty("--ki", i); piece.style.setProperty("--kd", `${i * .22}s`);
    });
  }
  if (scene === "wheels") top = cutPiece(img, rect(30, 1, 40, 18.3), "hs-cone-top", "50% 18.8%");
  if (scene === "lighthouse") top = cutPiece(img, rect(28, 0, 44, 21), "hs-cup-top", "51% 20.7%");
  if (scene === "toy-box") top = cutPiece(img, rect(26, 7, 48, 18.8), "hs-block-roof", "51% 25.6%");
  if (scene === "giraffe") {
    top = cutPiece(img, rect(30, 1, 35, 16.8), "hs-duck-top", "47% 17.5%");
    // Reuse another duck's calm head from the very same illustration, preserving
    // its beak and shading rather than the oversized toothy reaction face.
    const duck = top.firstChild, pct = points => points.map(([x,y]) => [x/spec.sw*100,y/spec.sh*100]);
    duck._homeOuter = rect(30, 1, 35, 16.8);
    const ellipse = (cx,cy,rx,ry,from,to,n) => Array.from({length:n+1},(_,i) => { const a=(from+(to-from)*i/n)*Math.PI/180;return [cx+Math.cos(a)*rx,cy+Math.sin(a)*ry]; });
    const oldHead = cutPiece(duck, pct(ellipse(445,110,86,76,-90,270,40)), "", "0 0", top);
    oldHead.remove();
    const head = img.cloneNode(); head.className = "hs-part";
    const outline = [...ellipse(443,305,68,58,-90,-9,12),[521,305],[540,302],[545,307],[545,326],[532,341],[512,349],[491,351],...ellipse(443,305,68,58,46,270,30)];
    head.style.clipPath = `polygon(${polygon(pct(outline))})`;
    head.style.transformOrigin = "0 0"; head.style.transform = "translate(-17.92%,-16.38%) scale(1.35)"; top.appendChild(head);
  }
  if (scene === "space") {
    // The live flame replaces the old painted flame. Fins and nozzle stay intact.
    img.style.clipPath = "polygon(evenodd, 0 0,100% 0,100% 100%,0 100%,0 0,39% 84%,62% 84%,62% 100%,39% 100%,39% 84%,0 0)";
    hop.querySelector(".hs-sheen").style.clipPath = img.style.clipPath;
  }
  return { top };
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
