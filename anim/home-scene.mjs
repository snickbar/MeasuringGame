// Living Home scenes: when a scene has its separate artwork (anim/home-art/) the flat Home picture is swapped for a stage
// built from a clean background plate, the two foreground subjects (which sway / breathe) and critters that wander across.
// Everything falls back to the original picture until every image has loaded, and is skipped with Animation: Reduced.
import { HOME_ART, HOME_ART_REF } from "./home-art-layout.mjs";
const BASE = "anim/home-art/";
// Scenes switched on so far (reviewed one at a time) and how each one's layers and critters move.
// critters: row (% of picture height), size (visible width, % of picture width), secs per crossing, start delay, dir (1 = left to right,
// -1 = right to left), kind (glide / flutter) and faces (1 if the artwork looks right, -1 if it looks left) so it is mirrored to face where it flies.
const CONFIG = {
  // limbs: parts of the main sprite cut out (a polygon in sprite pixels, listed from its upper to its lower point on the right edge) and swung around a pivot, e.g. the waving arm.
  // shadow: soft ground shadow under the second object in picture units (the clean plate has none): centre x, centre y, width, height, strength.
  ants: { hero: "sway", hero2: "breathe", limbs: [{ poly: [[853, 158], [425, 158], [425, 256], [398, 256], [398, 300], [853, 300]], pivot: [398, 274], anim: "wave" }], shadow: [432, 1112, 470, 74, 0.34], critters: [{ row: 21, size: 13, secs: 26, delay: 4, dir: 1, kind: "glide", faces: 1 }, { row: 54, size: 15, secs: 34, delay: 12, dir: -1, kind: "flutter", faces: 1 }] },
};
export const homeSceneHasArt = (scene) => !!(CONFIG[scene] && HOME_ART[scene]);
function load(src) {
  return new Promise((yes, no) => { const img = new Image(); img.decoding = "async"; img.onload = () => yes(img); img.onerror = no; img.src = src; });
}
export async function installHomeScene() {
  const home = document.getElementById("home-screen"), scene = document.documentElement.dataset.homeScene || "ants";
  if (!home || document.getElementById("home-art") || !homeSceneHasArt(scene) || document.documentElement.dataset.motion === "reduce") return;
  const art = HOME_ART[scene], cfg = CONFIG[scene];
  let imgs;
  try {
    imgs = await Promise.all([art.plate, art.hero, art.hero2, ...art.critters].map((l) => load(BASE + l.file)));
  } catch (e) { return; } // any missing picture: keep the original Home picture
  if (!home.isConnected || document.getElementById("home-art") || document.documentElement.dataset.motion === "reduce") return;
  const [plate, hero, hero2, ...crits] = imgs;
  const root = document.createElement("div"); root.id = "home-art"; root.setAttribute("aria-hidden", "true");
  const stage = document.createElement("div"); stage.className = "hs-stage"; root.appendChild(stage);
  plate.className = "hs-plate"; plate.alt = ""; stage.appendChild(plate);
  const place = (img, spec, cls, anim) => {
    img.className = "hs-layer " + cls + (anim ? " hs-" + anim : "");
    img.alt = "";
    img.style.left = spec.x + "%"; img.style.top = spec.y + "%"; img.style.width = spec.w + "%";
    img.style.transformOrigin = spec.ox + "% " + spec.oy + "%";
    stage.appendChild(img);
  };
  if (cfg.shadow) {
    const [cx, cy, w, h, a] = cfg.shadow, sh = document.createElement("div");
    sh.className = "hs-shadow"; sh.style.cssText = `left:${(cx - w / 2) / HOME_ART_REF.width * 100}%;top:${(cy - h / 2) / HOME_ART_REF.height * 100}%;width:${w / HOME_ART_REF.width * 100}%;height:${h / HOME_ART_REF.height * 100}%;--sa:${a}`;
    stage.appendChild(sh);
  }
  place(hero2, art.hero2, "hs-back", cfg.hero2); // the second object sits behind the main subject (as in the original pictures)
  if (cfg.limbs) {
    // The main subject is built from the whole sprite (minus the cut-out parts) plus a copy of each part that moves on its own.
    const spec = art.hero, W = spec.sw, H = spec.sh, pct = (x, y) => `${x / W * 100}% ${y / H * 100}%`;
    const box = document.createElement("div");
    box.className = "hs-layer hs-front" + (cfg.hero ? " hs-" + cfg.hero : ""); box.style.cssText = `left:${spec.x}%;top:${spec.y}%;width:${spec.w}%;aspect-ratio:${W}/${H};transform-origin:${spec.ox}% ${spec.oy}%`;
    // The base picture has each moving part cut out as a notch from its right edge (parts must touch the right edge).
    const P = (x, y) => `${x / W * 100}% ${y / H * 100}%`, notch = ["0 0", `${100}% 0`];
    cfg.limbs.forEach((l) => l.poly.forEach(([x, y]) => notch.push(P(x, y))));
    notch.push("100% 100%", "0 100%");
    hero.className = "hs-part"; hero.alt = "";
    hero.style.clipPath = `polygon(${notch.join(", ")})`;
    box.appendChild(hero);
    cfg.limbs.forEach((l) => {
      const arm = hero.cloneNode(); arm.className = "hs-part hs-" + l.anim; arm.style.clipPath = `polygon(${l.poly.map(([x, y]) => P(x, y)).join(", ")})`;
      arm.style.transformOrigin = pct(l.pivot[0], l.pivot[1]); box.appendChild(arm);
    });
    stage.appendChild(box);
  } else place(hero, art.hero, "hs-front", cfg.hero);
  art.critters.forEach((c, i) => {
    const cc = cfg.critters[i]; if (!cc) return;
    const wrap = document.createElement("div"), img = crits[i];
    wrap.className = "hs-crit hs-" + cc.kind + (cc.dir < 0 ? " hs-rtl" : "");
    // Size by the creature itself (the picture has transparent margins around it) and centre it on its visible part.
    const visible = c.ab.width / c.w, imgW = cc.size / visible;
    wrap.style.setProperty("--ct", cc.row + "%"); wrap.style.setProperty("--cw", imgW + "%");
    wrap.style.setProperty("--cs", cc.secs + "s"); wrap.style.setProperty("--cd", cc.delay + "s");
    wrap.style.setProperty("--cx", ((c.ab.x + c.ab.width / 2) / c.w * 100) + "%"); wrap.style.setProperty("--cy", ((c.ab.y + c.ab.height / 2) / c.h * 100) + "%");
    img.className = "hs-crit-img"; img.alt = ""; img.style.setProperty("--flip", cc.dir * (cc.faces || 1) > 0 ? 1 : -1); wrap.appendChild(img); stage.appendChild(wrap);
  });
  const size = () => {
    const w = home.clientWidth || innerWidth, h = home.clientHeight || innerHeight;
    const s = Math.max(w / HOME_ART_REF.width, h / HOME_ART_REF.height); // the same "cover, top, centred" fit as the original picture
    stage.style.width = HOME_ART_REF.width * s + "px"; stage.style.height = HOME_ART_REF.height * s + "px";
    stage.style.setProperty("--sw", HOME_ART_REF.width * s + "px");
  };
  size(); addEventListener("resize", size);
  home.prepend(root); home.classList.add("has-art");
}
installHomeScene();
