import { MEASURE_DETAILS } from "./measure-details.mjs";
import { measurementGuideAxis, objectEntrancePose, REGIONS } from "./measurement-guides.mjs";

// "How is this measured?" popup: the object upright, bold marching arrows along the measured edge, one sentence, optional chips.
const S = 200, PX = 128;
const CSS = `
#measure-popup{position:fixed;inset:0;z-index:1500;display:flex;align-items:center;justify-content:center}
#measure-popup .mp-dim{position:absolute;inset:0;background:rgba(20,30,50,.45);pointer-events:none}
#measure-popup .mp-card{position:relative;background:#fffaf0;border:3px solid #6b4a2a;border-radius:18px;box-shadow:0 8px 0 rgba(0,0,0,.25);padding:14px 16px 16px;width:min(88vw,340px);text-align:center;animation:popIn 260ms ease}
#measure-popup .mp-tabs{display:flex;gap:6px;justify-content:center;margin-bottom:8px}
#measure-popup .mp-tab{flex:1;max-width:150px;margin:0;padding:6px 8px;border-radius:12px;border:2px solid #d9c3a3;background:#fff3d6;color:#6b4a2a;font:700 14px 'Fredoka',sans-serif;text-transform:capitalize;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;touch-action:manipulation}
#measure-popup .mp-tab.on{background:#ffe3b4;border-color:#d99a3c}
#measure-popup .mp-type{display:inline-block;margin:0 0 6px;padding:2px 10px;border-radius:999px;background:#ffe3b4;border:2px solid #d99a3c;color:#6b4a2a;font:700 12px 'Fredoka',sans-serif;letter-spacing:1px;text-transform:uppercase}
#measure-popup .mp-stage{position:relative;width:${S + 34}px;height:${S + 30}px;margin:0 auto}
#measure-popup .mp-pic{position:absolute;left:0;top:0;width:${S}px;height:${S}px}
#measure-popup .mp-pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;max-width:none;max-height:none;margin:0;display:block}
#measure-popup .mp-arrow{position:absolute;overflow:visible}
#measure-popup .mp-arrow svg{position:absolute;overflow:visible}
#measure-popup .dl{fill:none;stroke:#d63a1f;stroke-width:3.5;stroke-linecap:round;stroke-dasharray:6 6;animation:mpMarch 1s linear infinite;vector-effect:non-scaling-stroke}
#measure-popup .hd{fill:none;stroke:#d63a1f;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:30;stroke-dashoffset:30;animation:mpDraw .5s .2s ease-out forwards}
@keyframes mpMarch{to{stroke-dashoffset:-12}}
@keyframes mpDraw{to{stroke-dashoffset:0}}
#measure-popup .mp-text{font:600 17px/1.3 'Fredoka',sans-serif;color:#4a2c12;margin:4px 0 0}
#measure-popup .mp-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:8px}
#measure-popup .mp-chip{font:700 13px 'Fredoka',sans-serif;padding:3px 10px;border-radius:999px;border:2px solid}
#measure-popup .mp-chip.yes{background:#e3f6dc;border-color:#58a83c;color:#2d6a1a}
#measure-popup .mp-chip.no{background:#fde2de;border-color:#d4574a;color:#8c2518}
#measure-popup .mp-ok{margin:12px auto 0;display:block;padding:8px 26px;border-radius:14px;border:0;background:#4caf50;box-shadow:0 4px 0 #2e7d32;color:#fff;font:700 17px 'Fredoka',sans-serif;touch-action:manipulation}
#measure-popup .mp-ok:active,#measure-popup .mp-tab:active{filter:brightness(1.15)}
@media (prefers-reduced-motion:reduce){#measure-popup .dl{animation:none}#measure-popup .hd{animation:none;stroke-dashoffset:0}}
`;
const boundsCache = new Map();
function loadImage(src) { return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
function alphaBox(ctx) {
  const d = ctx.getImageData(0, 0, PX, PX).data; let x0 = PX, y0 = PX, x1 = -1, y1 = -1;
  for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) if (d[(y * PX + x) * 4 + 3] > 40) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return x1 < 0 ? { l: 0, t: 0, r: 1, b: 1 } : { l: x0 / PX, t: y0 / PX, r: (x1 + 1) / PX, b: (y1 + 1) / PX };
}
// Visible art box (fractions of the square picture) before and after the pose is applied.
async function measureArt(object, pose) {
  const key = object.image + "|" + pose.rotation + "|" + pose.mirrored;
  if (boundsCache.has(key)) return boundsCache.get(key);
  let out = { orig: { l: 0, t: 0, r: 1, b: 1 }, posed: { l: 0, t: 0, r: 1, b: 1 } };
  const img = await loadImage(object.image);
  if (img) try {
    const c = document.createElement("canvas"); c.width = c.height = PX; const ctx = c.getContext("2d", { willReadFrequently: true });
    const sc = Math.min(PX / img.naturalWidth, PX / img.naturalHeight), iw = img.naturalWidth * sc, ih = img.naturalHeight * sc;
    ctx.drawImage(img, (PX - iw) / 2, (PX - ih) / 2, iw, ih); out.orig = alphaBox(ctx);
    ctx.clearRect(0, 0, PX, PX);
    const quarter = Math.abs(pose.rotation) % 180 === 90, fit = quarter ? Math.min(1, PX / ih, PX / iw) : 1;
    ctx.save(); ctx.translate(PX / 2, PX / 2); if (pose.mirrored) ctx.scale(-1, 1); if (pose.rotation) ctx.rotate(pose.rotation * Math.PI / 180); ctx.scale(fit, fit);
    ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih); ctx.restore(); out.posed = alphaBox(ctx);
  } catch { /* unreadable canvas: arrows span the whole picture */ }
  boundsCache.set(key, out); return out;
}
function arrowHtml(vertical, r) {
  const L = r.l * S, T = r.t * S, W = (r.r - r.l) * S, H = (r.b - r.t) * S;
  if (!vertical) return `<div class="mp-arrow" style="left:${L}px;top:${Math.min(r.b * S + 3, S + 3)}px;width:${W}px;height:16px"><svg style="left:0;top:0;width:100%;height:16px" viewBox="0 0 100 16" preserveAspectRatio="none"><path class="dl" d="M50 8L0 8"/><path class="dl" d="M50 8L100 8"/></svg><svg style="left:-3px;top:0;width:12px;height:16px" viewBox="0 0 12 16"><path class="hd" d="M10 2L2 8L10 14"/></svg><svg style="right:-3px;top:0;width:12px;height:16px" viewBox="0 0 12 16"><path class="hd" d="M2 2L10 8L2 14"/></svg></div>`;
  return `<div class="mp-arrow" style="left:${Math.min(r.r * S + 12, S + 12)}px;top:${T}px;width:16px;height:${H}px"><svg style="left:0;top:0;width:16px;height:100%" viewBox="0 0 16 100" preserveAspectRatio="none"><path class="dl" d="M8 50L8 0"/><path class="dl" d="M8 50L8 100"/></svg><svg style="left:-2px;top:-3px;width:20px;height:12px" viewBox="0 0 20 12"><path class="hd" d="M2 10L10 2L18 10"/></svg><svg style="left:-2px;bottom:-3px;width:20px;height:12px" viewBox="0 0 20 12"><path class="hd" d="M2 2L10 10L18 2"/></svg></div>`;
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function measureSentence(object) {
  const d = MEASURE_DETAILS[object.id];
  const dim = object.measurement?.dimension || "length";
  return { text: d?.[0] || `Measured by its ${dim}.`, chips: d?.[1] || [] };
}

// ids: one or two object ids; getObject(id) -> object with {id,name,image,measurement}. Returns {close}.
// The clock stays bright: the dim layer gets a hole where the visible timer sits.
const CLOCKS = [".hs-clock:not(.idle)", ".hud-timer-col"];
function cutClock(dim) {
  for (const sel of CLOCKS) for (const el of document.querySelectorAll(sel)) {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (r.width < 8 || r.height < 8 || cs.visibility === "hidden" || cs.display === "none" || r.bottom < 0 || r.top > innerHeight) continue;
    const p = 4, x0 = Math.max(0, r.left - p), y0 = Math.max(0, r.top - p), x1 = Math.min(innerWidth, r.right + p), y1 = Math.min(innerHeight, r.bottom + p);
    dim.style.clipPath = `polygon(evenodd,0 0,100% 0,100% 100%,0 100%,0 0,${x0}px ${y0}px,${x0}px ${y1}px,${x1}px ${y1}px,${x1}px ${y0}px,${x0}px ${y0}px)`;
    return;
  }
}
export function openMeasurePopup({ ids, startId, getObject, onClose, sound, brightClock }) {
  document.getElementById("measure-popup")?.remove();
  if (!document.getElementById("measure-popup-css")) { const st = document.createElement("style"); st.id = "measure-popup-css"; st.textContent = CSS; document.head.append(st); }
  const objs = ids.map(getObject).filter(Boolean); if (!objs.length) return null;
  const ov = document.createElement("div"); ov.id = "measure-popup";
  ov.innerHTML = `<div class="mp-dim"></div><div class="mp-card" role="dialog" aria-modal="true" aria-label="How it is measured"><div class="mp-tabs"></div><div class="mp-type"></div><div class="mp-stage"><div class="mp-pic"></div></div><p class="mp-text"></p><div class="mp-chips"></div><button type="button" class="mp-ok">Got it</button></div>`;
  const tabs = ov.querySelector(".mp-tabs"), stage = ov.querySelector(".mp-stage"), pic = ov.querySelector(".mp-pic");
  let token = 0, closed = false;
  async function show(i) {
    const my = ++token, o = objs[i], pose = objectEntrancePose(o.id, false);
    tabs.hidden = objs.length < 2;
    tabs.querySelectorAll(".mp-tab").forEach((b, j) => b.classList.toggle("on", j === i));
    const dim = o.measurement?.dimension || "length";
    ov.querySelector(".mp-type").textContent = dim;
    const { text, chips } = measureSentence(o);
    ov.querySelector(".mp-text").textContent = text;
    ov.querySelector(".mp-chips").innerHTML = chips.map((c) => { const no = /^[✗✕✘×]/.test(c); return `<span class="mp-chip ${no ? "no" : "yes"}">${esc(c)}</span>`; }).join("");
    stage.querySelectorAll(".mp-arrow").forEach((a) => a.remove());
    pic.innerHTML = `<img alt="" draggable="false" src="${esc(o.image)}" style="${pose.mirrored || pose.rotation ? `transform:${pose.mirrored ? "scaleX(-1) " : ""}${pose.rotation ? `rotate(${pose.rotation}deg)` : ""}` : ""}">`;
    const art = await measureArt(o, pose); if (my !== token || closed) return;
    const quarter = Math.abs(pose.rotation) % 180 === 90;
    const ow = art.orig.r - art.orig.l, oh = art.orig.b - art.orig.t;
    const axis = measurementGuideAxis(o, { width: ow, height: oh });
    const vertical = (axis === "vertical") !== quarter;
    const reg = REGIONS[o.id] || [0, 0, 1, 1], p = art.posed, pw = p.r - p.l, ph = p.b - p.t;
    const r = { l: p.l + pw * reg[0], t: p.t + ph * reg[1], r: p.l + pw * reg[2], b: p.t + ph * reg[3] };
    stage.insertAdjacentHTML("beforeend", arrowHtml(vertical, r));
  }
  objs.forEach((o, i) => { const b = document.createElement("button"); b.type = "button"; b.className = "mp-tab"; b.textContent = o.name; b.addEventListener("pointerdown", (e) => { e.stopPropagation(); }); b.addEventListener("click", (e) => { e.stopPropagation(); show(i); }); tabs.append(b); });
  const close = () => { if (closed) return; closed = true; ov.remove(); onClose?.(); };
  ov.querySelector(".mp-ok").addEventListener("click", (e) => { e.stopPropagation(); sound?.("popup-close"); close(); });
  ov.addEventListener("click", (e) => { if (!e.target.closest(".mp-card")) { sound?.("popup-close"); close(); } });
  document.body.append(ov);
  if (brightClock) cutClock(ov.querySelector(".mp-dim"));
  show(Math.max(0, objs.findIndex((o) => o.id === startId)));
  return { close };
}
