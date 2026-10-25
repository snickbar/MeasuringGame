// Living Home scenes: when a scene has its separate artwork (anim/home-art/) the flat Home picture is swapped for a stage
// built from a clean background plate, the two foreground subjects (which sway / breathe) and critters that wander across.
// Decode the complete scene offscreen and swap it in once. Never paint the differently composed flat picture first.
import { HOME_ART, HOME_ART_REF } from "./home-art-layout.mjs";
import { HOME_RIG } from "./home-art-rig.mjs";
import { decorateNewHomeBackground, makeHomeFairy } from './home-new-scenes.mjs';
import { HOME_MOTION, HOME_EXTRA_ART, homeRigMotion, decorateHomeProps, decorateHomeHero, decorateHomePart, installHomeInteractions } from "./home-motion.mjs";
const BASE = "anim/home-art/";
// Scenes switched on so far (reviewed one at a time) and how each one's layers and critters move.
// critters: row (% of picture height), size (visible width, % of picture width), secs per crossing, start delay, dir (1 = left to right,
// -1 = right to left), kind (glide / flutter) and faces (1 if the artwork looks right, -1 if it looks left) so it is mirrored to face where it flies.
const CONFIG = {
  'make-believe': {shadow:[[245,1156,280,22,.22],[515,1159,235,20,.22]],critters:[{row:43,size:11,secs:31,delay:5,dir:-1,kind:'flutter',faces:1,behind:true}]},
  'holiday-mix': {shadow:[[235,1157,320,24,.18],[505,1159,185,20,.18]],critters:[{row:0,size:12,secs:24,delay:7,dir:1,kind:'giftGhost',faces:-1,behind:true}]},
  corgi: { hero: "breathe", hero2: "sway", shadow: [[235, 1122, 270, 34, .3], [455, 1130, 150, 28, .3]], critters: [{ row: 36, size: 13, secs: 30, delay: 5, dir: 1, kind: "flutter", faces: 1 }, { row: 6, size: 7, secs: 22, delay: 9, dir: 1, kind: "fall", faces: 1 }] },
  games: { hero: "sway", hero2: "breathe", shadow: [[238, 1200, 150, 26, .28], [446, 1218, 130, 24, .3]], critters: [{ row: 31, size: 15, secs: 27, delay: 4, dir: 1, kind: "glide", faces: 1 }, { row: 69, size: 12, secs: 38, delay: 10, dir: -1, kind: "scuttle", faces: 1 }] },
  sunflower: { hero: "sway", hero2: "breathe",   shadow: [[200, 1222, 150, 30, .3], [458, 1236, 120, 24, .3]], critters: [{ row: 31, size: 12, secs: 28, delay: 5, dir: 1, kind: "glide", faces: -1 }, { row: 52, size: 14, secs: 36, delay: 14, dir: -1, kind: "flutter", faces: 1 }] },
  snacks: { hero: "sway", hero2: "breathe", shadow: [[245, 1168, 120, 22, .3], [492, 1178, 90, 20, .3]], critters: [{ row: 30, size: 14, secs: 28, delay: 4, dir: 1, kind: "flutter", faces: 1 }, { row: 71, size: 11, secs: 36, delay: 10, dir: -1, kind: "scuttle", faces: -1 }] },
  town: { hero: "sway", hero2: "breathe", shadow: [[232, 1040, 150, 24, .3], [470, 1040, 90, 18, .3]], critters: [{ row: 69, size: 12, secs: 36, delay: 6, dir: 1, kind: "scuttle", faces: 1, behind: false, wings: [{ cls: "hs-leg", wt: .3, deg: 16, delay: 0, pivot: [673, 886], poly: [[488, 883], [733, 883], [733, 1081], [488, 1081]] }, { cls: "hs-leg", wt: .3, deg: 16, delay: -.3, pivot: [898, 931], poly: [[823, 928], [1098, 928], [1098, 1081], [823, 1081]] }] }, { row: 40, size: 14, secs: 30, delay: 12, dir: -1, kind: "flutter", faces: 1 }] },
  house: { hero: "sway", hero2: "breathe", shadow: [[190, 1285, 330, 30, .28], [470, 1348, 150, 26, .3]], critters: [{ row: 58.5, size: 12, secs: 20, delay: 1, dir: -1, kind: "counter", faces: 1, behind: true }] },
  wheels: { hero: "sway", hero2: "breathe", shadow: [[258, 1198, 280, 30, .3], [455, 1210, 130, 24, .3]], critters: [{ row: 34, size: 16, secs: 60, delay: 4, dir: 1, kind: "glide", faces: 1, behind: true }, { row: 36, size: 14, secs: 34, delay: 14, dir: 1, kind: "swoop", faces: 1, behind: true }] },
  lighthouse: { hero: "sway", hero2: "breathe", shadow: [[190, 1120, 300, 34, .3], [442, 1122, 120, 22, .3]], critters: [{ row: 28, size: 14, secs: 34, delay: 4, dir: 1, kind: "glide", faces: 1 }, { row: 65, size: 12, secs: 50, delay: 12, dir: -1, kind: "glide", faces: 1, behind: true }] },
  underwater: { hero: "breathe", hero2: "sway", shadow: [[250, 1160, 330, 26, .25], [520, 1168, 150, 22, .25]], critters: [{ row: 30, size: 14, secs: 34, delay: 4, dir: 1, kind: "glide", faces: 1 }, { row: 64, size: 12, secs: 44, delay: 6, dir: -1, kind: "rise", faces: 1 }] },
  "toy-box": { hero: "sway", hero2: "breathe", shadow: [[272, 1176, 200, 26, .3], [525, 1176, 170, 24, .3]], critters: [{ row: 66, size: 12, secs: 44, delay: 4, dir: -1, kind: "teeter", faces: 1 }, { row: 74, size: 10, secs: 34, delay: 18, dir: -1, kind: "roll", faces: 1 }] },
  penguin: { hero: "breathe", hero2: "sway", shadow: [[210, 1158, 230, 26, .3], [462, 1166, 120, 22, .3]], critters: [{ row: 64, size: 19, secs: 14, delay: 3, dir: 1, kind: "slide", faces: -1, behind: false }, { row: 80, size: 12, secs: 40, delay: 12, dir: -1, kind: "scuttle", faces: 1 }] },
  // fxOn: forces an effect (keyed by its anim name) onto "hero" or the default second object, overriding the generated rig
  // data's own owner when it was tagged wrong (visible as the effect swaying/bouncing with the wrong character).
  // dropFx: anim names to skip rendering entirely (a generated effect that doesn't read well and isn't worth positioning).
  cactus: { hero: "sway", hero2: "breathe", shadow: [[230, 1176, 270, 30, .3], [444, 1196, 200, 28, .3]], fxOn: { pop: "hero2" }, critters: [{ row: 64, size: 12, secs: 34, delay: 4, dir: 1, kind: "roll", faces: 1 }, { row: 32, size: 14, secs: 34, delay: 12, dir: -1, kind: "glide", faces: 1 }, { row: 74, size: 14, secs: 30, delay: 9, dir: -1, kind: "scuttle", faces: 1 }] },
  giraffe: { hero: "sway", hero2: "breathe", shadow: [[514, 1276, 250, 30, .3], [150, 1274, 120, 22, .3]], critters: [{ row: 28, size: 13, secs: 34, delay: 4, dir: 1, kind: "flutter", faces: 1 }, { row: 52, size: 12, secs: 36, delay: 12, dir: -1, kind: "flutter", faces: 1 }] },
  dragon: { hero: "breathe", hero2: "sway", shadow: [[220, 1110, 330, 28, .3], [510, 1238, 170, 24, .3]], dropFx: ["glint"], critters: [{ row: 26, size: 13, secs: 34, delay: 4, dir: 1, kind: "flutter", faces: 1, behind: true }, { row: 50, size: 12, secs: 36, delay: 12, dir: -1, kind: "flutter", faces: 1, behind: true }] },
  space: { hero: "sway", hero2: "breathe", shadow: [[0, 0, 1, 1, 0]], fxOn: { flame: "hero2" }, critters: [{ row: 34, size: 13, secs: 40, delay: 4, dir: 1, kind: "glide", faces: -1, behind: true }, { row: 50, size: 12, secs: 50, delay: 12, dir: -1, kind: "glide", faces: 1 }] },
  // limbs: parts of the main sprite cut out (a polygon in sprite pixels, listed from its upper to its lower point on the right edge) and swung around a pivot, e.g. the waving arm.
  // shadow: soft ground shadow under the second object in picture units (the clean plate has none): centre x, centre y, width, height, strength.
  ants: { hero: "sway", hero2: "breathe", limbs: [{ poly: [[853, 158], [425, 158], [425, 256], [398, 256], [398, 300], [853, 300]], pivot: [398, 274], anim: "wave" }], shadow: [432, 1112, 470, 74, 0.34], critters: [{ row: 30, size: 13, secs: 26, delay: 4, dir: 1, kind: "glide", faces: 1, wings: [{ poly: [[360, 190], [500, 185], [620, 260], [720, 430], [760, 560], [630, 548], [450, 450], [370, 300]], pivot: [740, 555], deg: 13 }, { poly: [[318, 485], [350, 440], [415, 438], [460, 460], [530, 515], [630, 548], [580, 555], [500, 585], [450, 592], [390, 572], [330, 520]], pivot: [570, 565], deg: 16 }] }, { row: 54, size: 15, secs: 34, delay: 12, dir: -1, kind: "flutter", faces: 1 }] },
};
let actx = null;
const tapSounds = new Set();
function boing(scene, role) {
  try {
    if (localStorage.getItem("mg_vibrationEnabled") !== "false" && navigator.vibrate) navigator.vibrate(12);
    if (localStorage.getItem("mg_soundEnabled") === "false") return;
    const vol = Number(localStorage.getItem("mg_effects_volume") ?? 100) / 100; if (!(vol > 0)) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    if(!actx||actx.state==='closed')actx=new AC();
    if (actx.state === "suspended"||actx.state==='interrupted') actx.resume().catch(()=>{});
    const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    // Tiny phone speakers lose the old 130/150 Hz sine tones on Launchpad and
    // Castle. Keep every cue in an audible range, with gentle harmonics there.
    const pitch = ({ games: 430, town: 340, house: 540, underwater: 600, lighthouse: 720, "toy-box": 480, wheels: 430, dragon: 380, space: 360, 'make-believe':620,'holiday-mix':520 })[scene] || 350;
    o.type = ['toy-box','wheels','dragon'].includes(scene) ? "triangle" : "sine"; o.frequency.setValueAtTime(pitch, t); o.frequency.exponentialRampToValueAtTime(pitch * (role ? 1.3 : 1.7), t + .09); o.frequency.exponentialRampToValueAtTime(pitch * .9, t + .22);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16 * vol, t + .015); g.gain.exponentialRampToValueAtTime(0.0001, t + .26);
    o.connect(g); g.connect(actx.destination); tapSounds.add(o); o.onended = () => tapSounds.delete(o); o.start(t); o.stop(t + .28);
  } catch (e) {}
}
export const homeSceneHasArt = (scene) => !!(CONFIG[scene] && HOME_ART[scene]);
function load(src) {
  return new Promise((yes, no) => { const img = new Image(); img.decoding = "async"; img.onload = async () => { try { await img.decode(); yes(img); } catch (e) { no(e); } }; img.onerror = no; img.src = src; });
}
let request = 0, resizeStage = () => {}, disposeScene = () => {};
function stopHomeSound() { for (const node of tapSounds) { try { node.stop(); } catch {} } tapSounds.clear(); }
document.addEventListener("visibilitychange", () => { if (document.hidden) stopHomeSound(); });
addEventListener("resize", () => resizeStage());
export async function installHomeScene() {
  const home = document.getElementById("home-screen"), scene = document.documentElement.dataset.homeScene || "ants";
  if (!home || document.getElementById("home-art")?.dataset.scene === scene) return;
  const ticket = ++request, current = () => ticket === request && document.documentElement.dataset.homeScene === scene;
  try { await buildHomeScene(home, scene, current); }
  catch (e) {
    console.warn("Could not build Home scene", scene, e);
    if (!current()) return;
    // A failed asset still gets a decoded fallback, rather than a permanently blank Home.
    const file = window.mgHomeFile?.(scene);
    if (file) { try { await load(file); } catch {} }
    if (!current()) return;
    disposeScene(); document.getElementById("home-art")?.remove(); home.classList.remove("has-art");
    resizeStage = () => {};
  } finally {
    if (current()) delete document.documentElement.dataset.homeLoading;
  }
}
async function buildHomeScene(home, scene, current) {
  if (!homeSceneHasArt(scene)) throw Error("No layered Home scene");
  const art = HOME_ART[scene], motion = HOME_MOTION[scene], cfg = { ...CONFIG[scene], hero: motion.hero, hero2: motion.prop, dropFx: [] };
  // Extra character art (redrawn base without its moving parts, the moving parts themselves, expression patches). All or nothing.
  let rig = HOME_RIG[scene], rigImgs = null;
  if (rig && (cfg.rig === false || rig.W !== art.hero.sw || rig.H !== art.hero.sh)) rig = null;
  rig = homeRigMotion(scene, rig, art);
  const extraFiles = HOME_EXTRA_ART[scene] || [];
  const extraImages = await Promise.all(extraFiles.map(file => load(BASE + file)));
  const extras = new Map(extraFiles.map((file, i) => [file, extraImages[i]]));
  // Optimized builds omit the old whole hero when a rig supplies its base.
  const images = Promise.all([art.plate, rig?.base ? null : art.hero, art.hero2, ...art.critters].map(l => l ? load(BASE + l.file) : null));
  images.catch(() => {}); // The rig may still be loading when a required image fails.
  if (rig) {
    try {
      const list = [rig.base, rig.hero2, ...rig.parts, ...rig.patches, ...(rig.fx || []).flatMap((f) => f.frames), ...(rig.critFrames || []).flatMap((f) => f.frames)].filter(Boolean);
      const loaded = await Promise.all(list.map((l) => load(BASE + "top/" + l.file)));
      rigImgs = new Map(list.map((l, i) => [l.file, loaded[i]]));
    } catch (e) { rig = null; rigImgs = null; }
  }
  const [plate, originalHero, originalHero2, ...crits] = await images;
  if (!home.isConnected || !current()) return;
  let hero = originalHero, hero2 = originalHero2;
  if (rig && rig.base) hero = rigImgs.get(rig.base.file);
  if (!hero) hero = await load(BASE + art.hero.file); // If absent too, use the decoded flat fallback.
  if (!current()) return;
  if (rig && rig.hero2) hero2 = rigImgs.get(rig.hero2.file);
  const root = document.createElement("div"); root.id = "home-art"; root.dataset.scene = scene; root.setAttribute("aria-hidden", "true");
  const stage = document.createElement("div"); stage.className = "hs-stage"; root.appendChild(stage);
  let interactions;
  plate.className = "hs-plate"; plate.alt = ""; stage.appendChild(plate);
  decorateNewHomeBackground(scene,stage,extras);
  if (cfg.shadow) {
    (Array.isArray(cfg.shadow[0]) ? cfg.shadow : [cfg.shadow]).forEach(([cx, cy, w, h, a]) => {
      const sh = document.createElement("div");
      sh.className = "hs-shadow"; sh.style.cssText = `left:${(cx - w / 2) / HOME_ART_REF.width * 100}%;top:${(cy - h / 2) / HOME_ART_REF.height * 100}%;width:${w / HOME_ART_REF.width * 100}%;height:${h / HOME_ART_REF.height * 100}%;--sa:${a}`;
      stage.appendChild(sh);
    });
  }
  // The second object sits behind the main subject (as in the original pictures). Its picture lives in a box that sways or breathes,
  // with an inner hop layer so a tap makes it bounce too, and any effects that belong to it ride along inside.
  const s2 = art.hero2, box2 = document.createElement("div"), hop2 = document.createElement("div");
  box2.className = "hs-layer hs-back" + (cfg.hero2 ? " hs-" + cfg.hero2 : "");
  box2.style.cssText = `left:${s2.x}%;top:${s2.y}%;width:${s2.w}%;aspect-ratio:${s2.sw}/${s2.sh};transform-origin:${s2.ox}% ${s2.oy}%`;
  hop2.className = "hs-hop"; hero2.className = "hs-part"; hero2.alt = ""; hop2.appendChild(hero2); box2.appendChild(hop2); stage.appendChild(box2);
  const propDetails = decorateHomeProps(scene, { hop: hop2, img: hero2, spec: s2, extras });
  const tapZone = (spec, role, tap) => {
    // Include the lower blocks/bowls and the flower just above the cactus tip.
    const W = spec.sw, H = spec.sh, hp = spec.w * (HOME_ART_REF.width / HOME_ART_REF.height) * (H / W), t = tap || [0, -.025, 1, 1.025], A = spec.ab || { x: 0, y: 0, width: W, height: H };
    const zone = document.createElement("div"); zone.className = "hs-tap";
    zone.style.cssText = `left:${spec.x + spec.w * (A.x + A.width * t[0]) / W}%;top:${spec.y + hp * (A.y + A.height * t[1]) / H}%;width:${spec.w * A.width * t[2] / W}%;height:${hp * A.height * t[3] / H}%`;
    stage.appendChild(zone);
    zone.dataset.subject = role ? "prop" : "hero";
    zone.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); interactions?.react(role); });
  };
  tapZone(s2, 1, cfg.tap2);
  {
    // The main subject is built from the whole sprite (minus the cut-out parts) plus a copy of each part that moves on its own.
    const spec = art.hero, W = spec.sw, H = spec.sh, bp = (rig && rig.base) || { x: 0, y: 0, w: W, h: H };
    const pct = (x, y) => `${(x - bp.x) / bp.w * 100}% ${(y - bp.y) / bp.h * 100}%`;
    const box = document.createElement("div");
    box.className = "hs-layer hs-front" + (cfg.hero ? " hs-" + cfg.hero : ""); box.style.cssText = `left:${spec.x}%;top:${spec.y}%;width:${spec.w}%;aspect-ratio:${W}/${H};transform-origin:${spec.ox}% ${spec.oy}%`;
    // The base picture has each moving part cut out as a notch from its right edge (parts must touch the right edge).
    const P = (x, y) => `${(x - bp.x) / bp.w * 100}% ${(y - bp.y) / bp.h * 100}%`, notch = ["0 0", `${100}% 0`];
    (cfg.limbs || []).forEach((l) => l.poly.forEach(([x, y]) => notch.push(P(x, y))));
    notch.push("100% 100%", "0 100%");
    const hop = document.createElement("div"); hop.className = "hs-hop"; box.appendChild(hop);
    hero.className = "hs-part"; hero.alt = "";
    const at = (img, q) => { img.style.left = q.x / W * 100 + "%"; img.style.top = q.y / H * 100 + "%"; img.style.width = q.w / W * 100 + "%"; img.style.height = q.h / H * 100 + "%"; };
    if (rig && rig.base) at(hero, rig.base);
    hero.style.clipPath = `polygon(${notch.join(", ")})`;
    hop.appendChild(hero);
    const heroDetails = decorateHomeHero(scene, { hop, img: hero, base: bp, W, H, extras });
    (cfg.limbs || []).forEach((l) => {
      const arm = hero.cloneNode(); arm.className = "hs-part hs-" + l.anim; arm.style.clipPath = `polygon(${l.poly.map(([x, y]) => P(x, y)).join(", ")})`;
      arm.style.transformOrigin = pct(l.pivot[0], l.pivot[1]); hop.appendChild(arm);
    });
    if (rig) {
      // Moving parts sit over the base (or behind it); each swings, wiggles or flaps about its own pivot.
      rig.parts.forEach((q) => {
        const img = rigImgs.get(q.file).cloneNode(); img.className = "hs-rig hs-" + q.anim; img.alt = ""; at(img, q);
        img.style.transformOrigin = q.ox + "% " + q.oy + "%";
        const part = decorateHomePart(scene, img, q, extras);
        if (q.z === "back") hop.insertBefore(part, hop.firstChild); else hop.appendChild(part);
      });
      (rig.fx || []).filter((q) => !(cfg.dropFx && cfg.dropFx.includes(q.anim))).forEach((q) => {
        // Effect frames (flame, steam, sparkle...): a box holding every frame; the frames take turns, the box itself rises, pulses or glints.
        const w = document.createElement("div"), n = q.frames.length;
        w.className = "hs-rig hs-fx hs-fx-" + q.anim; w.style.cssText = `left:${q.x / W * 100}%;top:${q.y / H * 100}%;width:${q.w / W * 100}%;height:${q.h / H * 100}%;--fd:${q.dur}s;animation-delay:${q.delay}s`;
        q.frames.forEach((fr, i) => {
          const im = rigImgs.get(fr.file).cloneNode(); im.alt = ""; im.className = "hs-fxf";
          if (q.anim === "bloom") { im.style.animationName = "hsBloom" + i; im.style.animationDuration = q.dur + "s"; }
          else if (n > 1) { const speed = q.frameDur || q.dur; im.style.animationName = "hsFx" + n; im.style.animationDuration = speed + "s"; im.style.animationDelay = (i ? -((n - i) * speed / n) : 0) + "s"; }
          w.appendChild(im);
        });
        if (q.ref) { // placed in picture units on the stage (for effects that belong to the second object)
          // cfg.fxOn overrides the generated rig data's own q.on for an effect that was tagged the wrong owner
          // (the object it's drawn next to, not the one it should move/bounce with).
          const owner = (cfg.fxOn && cfg.fxOn[q.anim]) || q.on, onHero = owner === "hero";
          const sp = onHero ? spec : s2; // which object the effect belongs to (default: the second one)
          const bx = sp.x / 100 * HOME_ART_REF.width, by = sp.y / 100 * HOME_ART_REF.height, bw = sp.w / 100 * HOME_ART_REF.width, bh = bw * sp.sh / sp.sw;
          w.style.left = (q.x - bx) / bw * 100 + "%"; w.style.top = (q.y - by) / bh * 100 + "%"; w.style.width = q.w / bw * 100 + "%"; w.style.height = q.h / bh * 100 + "%";
          (onHero ? hop : q.followTop && propDetails.top ? propDetails.top : hop2).appendChild(w);
        } else if (q.stageBack) {
          const owner = document.createElement("div"); owner.className = "hs-effect-owner";
          owner.style.cssText = `left:${spec.x}%;top:${spec.y}%;width:${spec.w}%;aspect-ratio:${W}/${H}`;
          owner.appendChild(w); stage.insertBefore(owner, stage.querySelector(".hs-layer"));
        } else if (scene === "toy-box" && heroDetails.head) heroDetails.head.appendChild(w);
        else if (q.z === "back") hop.insertBefore(w, hop.firstChild); else hop.appendChild(w);
      });
      rig.patches.forEach((q) => { const img = rigImgs.get(q.file).cloneNode(); img.className = "hs-rig hs-patch hs-" + q.anim; img.alt = ""; at(img, q); (heroDetails.head || hop).appendChild(img); });
    }
    stage.appendChild(box);
    // Tap the character on top: a springy hop (squash, stretch, settle) with a tiny boing and a light buzz.
    tapZone(spec, 0, cfg.tap);
  }
  // Critters: the stored pictures, plus any extra creature that only exists as animation frames (rig.critFrames with c).
  const defs = art.critters.map((c, i) => ({ c, img: crits[i], i }));
  (rig && rig.critFrames || []).forEach((f) => { if (f.c) defs[f.i] = { c: { w: f.c.w, h: f.c.h, ab: { x: f.c.ab.x, y: f.c.ab.y, width: f.c.ab.width, height: f.c.ab.height } }, img: null, i: f.i }; });
  defs.forEach(({ c, img: img0, i }) => {
    const cc = { ...cfg.critters[i] }; if (!cfg.critters[i] || !c) return;
    if (scene === "underwater" && i === 1) cc.behind = true;
    if (scene === "space" || (scene === "town" && i === 1)) cc.behind = true;
    if (scene === "snacks" && i === 1) cc.behind = true;
    if (scene === "games" && i === 1) cc.wings = [
      { poly: [[315,700],[410,638],[485,650],[465,722],[382,815],[342,825]], pivot:[450,665], delay:0 },
      { poly: [[470,705],[570,650],[650,700],[583,825],[550,872],[500,850]], pivot:[600,690], delay:-.18 },
      { poly: [[870,740],[950,717],[975,760],[920,830],[850,855]], pivot:[945,735], delay:-.18 },
      { poly: [[1000,710],[1070,695],[1155,760],[1155,845],[1100,825]], pivot:[1035,720], delay:0 }
    ].map(w => ({ ...w, cls:"hs-leg", wt:.18, deg:9 }));
    const wrap = document.createElement("div"), fr = rig && (rig.critFrames || []).find((f) => f.i === i);
    let img = img0;
    if(scene==='make-believe'){
      c={w:800,h:800,ab:{x:0,y:0,width:800,height:800}};
      img=makeHomeFairy(extras);
    }
    if(scene==='house'&&i===0){
      c={w:543,h:724,ab:{x:17,y:29,width:518,height:671}};
      img=document.createElement('div');img.className='hs-wingbox hs-mouse-walk';img.style.aspectRatio='543/724';
      for(let frame=0;frame<4;frame++){
        const cell=document.createElement('div');cell.className='hs-mouse-frame';cell.style.setProperty('--frame',frame);
        const sprite=extras.get('refined/mouse-cheese-walk.webp').cloneNode();sprite.alt='';sprite.style.left=frame*-100+'%';cell.appendChild(sprite);img.appendChild(cell);
      }
    }
    if (fr) { // animated frames take the picture's place
      img = document.createElement("div"); img.className = "hs-wingbox"; img.style.aspectRatio = c.w + "/" + c.h;
      fr.frames.forEach((q, j) => {
        const im = rigImgs.get(q.file).cloneNode(); im.alt = ""; im.className = "hs-fxf";
        im.style.cssText = `left:${fr.cell.x}%;top:${fr.cell.y}%;width:${fr.cell.w}%;height:${fr.cell.h}%;animation-name:hsFx${fr.frames.length};animation-duration:${fr.dur}s;animation-delay:${j ? -((fr.frames.length - j) * fr.dur / fr.frames.length) : 0}s`;
        img.appendChild(im);
      });
    }
    if (!img) return;
    wrap.className = "hs-crit hs-" + cc.kind + (cc.dir < 0 ? " hs-rtl" : "") + (fr ? " hs-framed" : "");
    // Size by the creature itself (the picture has transparent margins around it) and centre it on its visible part.
    const visible = c.ab.width / c.w, imgW = cc.size / visible;
    wrap.style.setProperty("--ct", cc.row + "%"); wrap.style.setProperty("--cw", imgW + "%");
    wrap.style.setProperty("--cs", cc.secs + "s"); wrap.style.setProperty("--cd", cc.delay + "s");
    wrap.style.setProperty("--cb", ((c.ab.y + c.ab.height) / c.h * 100) + "%"); wrap.style.setProperty("--cx", ((c.ab.x + c.ab.width / 2) / c.w * 100) + "%"); wrap.style.setProperty("--cy", ((c.ab.y + c.ab.height / 2) / c.h * 100) + "%");
    img.alt = ""; let body = img;
    if (cc.wings) {
      // Wings flutter: the base picture has the wings cut out (even-odd holes) and each wing is a clipped copy that flaps about its root.
      const W = c.w, H = c.h, P = (x, y) => `${x / W * 100}% ${y / H * 100}%`;
      body = document.createElement("div"); body.className = "hs-wingbox"; body.style.aspectRatio = W + "/" + H;
      const holes = cc.wings.map((w) => { const pts = w.poly.map(([x, y]) => P(x, y)); return pts.join(", ") + ", " + pts[0] + ", 0 0"; });
      img.className = "hs-part"; img.style.clipPath = `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${holes.join(", ")})`; body.appendChild(img);
      cc.wings.forEach((w, k) => {
        const wing = img.cloneNode(); wing.className = "hs-part " + (w.cls || "hs-wing"); if (w.wt) wing.style.setProperty("--wt", w.wt + "s"); wing.style.clipPath = `polygon(${w.poly.map(([x, y]) => P(x, y)).join(", ")})`;
        wing.style.transformOrigin = P(w.pivot[0], w.pivot[1]); wing.style.animationDelay = (w.delay != null ? w.delay : k * -0.05) + "s"; wing.style.setProperty("--wd", (w.deg || 14) + "deg"); body.appendChild(wing);
      });
    }
    body.classList.add("hs-crit-img"); body.style.setProperty("--flip", (cc.kind === "glide" || cc.kind === "rise" || cc.kind === "swoop" ? 1 : cc.kind === "fall" ? cc.dir : -1) * (cc.faces || 1) > 0 ? 1 : -1); wrap.appendChild(body);
    // Ground and water critters walk behind the big objects (but in front of the background), flyers pass in front.
    const slide = scene === "penguin" && i === 0;
    const duneRoll=scene==='cactus'&&i===0;
    const giftGhost=scene==='holiday-mix';
    if (slide) { wrap.style.setProperty("--ct", "0%");wrap.dataset.directionPolicy='downhill-left'; }
    if(duneRoll||giftGhost)wrap.style.setProperty('--ct','0%');
    const route=document.createElement('div');route.className='hs-route'+(slide||duneRoll||giftGhost?'':' hs-bidirectional');
    route.dataset.critterIndex=String(i);
    route.dataset.directionPolicy=slide?'downhill-left':duneRoll?'terrain-return':giftGhost?'peek-both-sides':'alternating';route.style.cssText=`--cs:${cc.secs}s;--cd:${cc.delay}s`;
    route.appendChild(wrap);
    if(scene==='snacks'&&i===1){
      const following=wrap.cloneNode(true);following.classList.add('hs-following-ant');route.appendChild(following);route.dataset.copies='2';
    }
    const back = scene === "penguin" && i === 0 ? true : cc.behind != null ? cc.behind : cc.kind === "scuttle" || cc.kind === "roll" || cc.kind === "teeter", first = back && stage.querySelector(".hs-layer");
    if (first) stage.insertBefore(route, first); else stage.appendChild(route);
  });
  if(scene==='toy-box'){
    const route=document.createElement('div');route.className='hs-route hs-bidirectional';route.dataset.directionPolicy='alternating';route.style.cssText='--cs:18s;--cd:2s';
    const ball=document.createElement('div');ball.className='hs-bouncing-ball';
    const sprite=extras.get('../../items/beach-ball.webp').cloneNode();sprite.alt='';ball.appendChild(sprite);route.appendChild(ball);
    stage.insertBefore(route,stage.querySelector('.hs-layer'));
  }
  if (scene === "dragon") {
    // The castle is painted into the plate. A stationary, silhouette-clipped copy
    // restores its foreground depth without moving any background pixels.
    const castle = plate.cloneNode(); castle.className = "hs-plate hs-castle-occluder";
    const outline = [[0,1843],[0,950],[18,950],[70,795],[140,948],[155,948],[155,710],[250,496],[345,710],[320,710],[320,1020],[347,1020],[347,946],[408,802],[473,946],[473,1000],[510,1000],[510,1070],[565,1070],[565,1050],[615,1050],[615,1100],[680,1100],[742,1120],[742,1350],[853,1350],[853,1843]];
    castle.style.clipPath = `polygon(${outline.map(([x,y]) => `${x/853*100}% ${y/1843*100}%`).join(",")})`;
    stage.insertBefore(castle, stage.querySelector(".hs-layer"));
    // The large visible castle is part of the plate, but users still tap it.
    // Share the dragon's reaction; keep coin/dragon hit areas above this one.
    const castleTap=document.createElement('div');castleTap.className='hs-tap hs-castle-tap';castleTap.dataset.subject='castle';
    castleTap.style.cssText='inset:0;z-index:4;clip-path:'+castle.style.clipPath;
    castleTap.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();interactions?.react(0);});stage.appendChild(castleTap);
  }
  const size = () => {
    const w = home.clientWidth || innerWidth, h = home.clientHeight || innerHeight;
    const s = Math.max(w / HOME_ART_REF.width, h / HOME_ART_REF.height); // the same "cover, top, centred" fit as the original picture
    stage.style.width = HOME_ART_REF.width * s + "px"; stage.style.height = HOME_ART_REF.height * s + "px";
    stage.style.setProperty("--sw", HOME_ART_REF.width * s + "px");
    stage.style.setProperty("--sh", HOME_ART_REF.height * s + "px");
  };
  size(); resizeStage = size;
  disposeScene(); stopHomeSound();
  interactions = installHomeInteractions(root, home, scene, boing, stopHomeSound);
  disposeScene = interactions.cleanup;
  const previous = document.getElementById("home-art");
  if (previous) previous.replaceWith(root); else home.prepend(root);
  home.classList.add("has-art");
  home.dispatchEvent(new CustomEvent("home-scene-ready", { detail: { scene } }));
}
new MutationObserver(() => installHomeScene()).observe(document.documentElement, { attributes: true, attributeFilter: ["data-home-scene"] });
const home = document.getElementById("home-screen");
if (home) new ResizeObserver(() => resizeStage()).observe(home);
installHomeScene();
