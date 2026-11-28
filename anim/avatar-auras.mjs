// Avatar Level 6: Auras. A small animated effect drawn around and behind an avatar picture, always in the player's card colour for the game.
// The effect is a layer placed just behind the picture (never inside the card's layout), so no card changes size or shifts.
// A picture asks for one by carrying data-aura="glow" (and data-aura-slot="3", the player's slot colour); installAuras() does the rest.
export const AURAS = [
  { id: "glow", name: "Glow" }, { id: "sparkle", name: "Sparkles" }, { id: "flame", name: "Flames" }, { id: "bolt", name: "Lightning" },
  { id: "bubble", name: "Bubbles" }, { id: "orbit", name: "Orbit" }, { id: "ring", name: "Ring" }, { id: "ripple", name: "Ripples" },
  { id: "heart", name: "Hearts" }, { id: "confetti", name: "Confetti" }, { id: "spot", name: "Spotlight" }, { id: "halo", name: "Halo" },
  { id: "gyro", name: "Gyroscope" },
];
export const AURA_IDS = AURAS.map((a) => a.id);
// Each effect's own colour, shown wherever there is no game card colour yet (the avatar card, Edit, the pickers). In a game the effect
// takes the player's card colour instead, so it always matches the border.
export const AURA_DEFAULT_COLOUR = {
  glow: "#f4b94a", sparkle: "#ffd84a", flame: "#ff4b2b", bolt: "#ffe14a", bubble: "#4fb0e0", orbit: "#9b6bff",
  ring: "#f26fa0", ripple: "#3ab5a6", heart: "#ff5a7a", confetti: "#ff9f1c", spot: "#ffe9a8", halo: "#ffd34a", gyro: "#ffd35a",
};
// Supporter Pass aura (Founders): Eclipse, a dark disc behind the head with a bright rim and a slowly turning crown of golden rays. It has its own fixed
// gold colour (never the card colour), so a supporter's look stays theirs. `own` means it draws its own pieces below; an entry with `parts` is instead
// built from the effects above. Only supporters can pick it (index.html checks that); everyone sees it.
export const SUPPORTER_AURAS = [
  { id: "eclipse", name: "Eclipse", colour: "#ffc83a", own: true },
];
export const SUPPORTER_AURA_IDS = SUPPORTER_AURAS.map((a) => a.id);
export const isSupporterAura = (id) => SUPPORTER_AURA_IDS.includes(id);
export const isAura = (id) => typeof id === "string" && (AURA_IDS.includes(id) || SUPPORTER_AURA_IDS.includes(id));
export const auraName = (id) => AURAS.find((a) => a.id === id)?.name || SUPPORTER_AURAS.find((a) => a.id === id)?.name || "None";

const MIN_SIZE = 36;   // narrower pictures (the small stamps in lists) get no aura
const FULL_SIZE = 64;  // pictures this wide get the full effect; narrower ones a calmer one with fewer pieces
const BOLTS = ["8,24 17,31 11,40 21,47 14,58", "92,30 83,38 90,46 80,53 87,66", "28,6 34,15 27,19 38,27", "72,94 66,85 74,80 63,72", "12,76 20,70 16,82 26,86", "90,12 82,18 89,24"];
const d = (v) => v.toFixed(2);

// The pieces of one effect as HTML. Everything moves by transform or opacity only, so ten players in a room stay smooth.
export function auraPieces(kind, calm) {
  const sup = SUPPORTER_AURAS.find((x) => x.id === kind);
  if (sup && !sup.own) return sup.parts.map((part) => `<span class="part a-${part}">${auraPieces(part, calm)}</span>`).join("");
  let h = "";
  if (kind === "glow") h = '<span class="g1"></span>';
  if (kind === "sparkle") { const n = calm ? 4 : 7; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.4, r = 54 + (i % 2) * 7; h += `<span class="sp" style="left:${d(50 + Math.cos(a) * r)}%;top:${d(50 + Math.sin(a) * r)}%;animation-delay:-${d(i * 0.37)}s;animation-duration:${d(1.7 + i % 3 * 0.35)}s"></span>`; } }
  if (kind === "flame") { h = '<span class="base"></span>'; const n = calm ? 4 : 8; for (let i = 0; i < n; i++) h += `<span class="fl" style="left:${i % 2 ? -4 + i * 2 : 96 - i * 2}%;top:${72 + (i % 3) * 8}%;animation-delay:-${d(i * 0.23)}s,-${d(i * 0.17)}s"></span>`; }
  if (kind === "bolt") h = '<svg viewBox="0 0 100 100" aria-hidden="true">' + BOLTS.slice(0, calm ? 3 : 6).map((p, i) => `<polyline points="${p}" style="animation-delay:-${d(i * 0.43 + 1.2)}s"/>`).join("") + "</svg>";
  if (kind === "bubble") { const n = calm ? 4 : 8; for (let i = 0; i < n; i++) { const s = 11 + (i * 5) % 9; h += `<span class="bb" style="left:${i % 2 ? -8 + (i % 4) * 2 : 92 - (i % 4) * 2}%;top:${80 - (i % 3) * 10}%;width:${s}%;height:${s}%;animation-delay:-${d(i * 0.41)}s;animation-duration:${d(2.6 + i % 3 * 0.5)}s"></span>`; } }
  if (kind === "orbit") {
    // Two tight rings turning opposite ways, balls spread evenly on each (3 + 3, or 2 + 2 on small pictures). Sizes vary a little so it feels alive.
    const ring = (cls, n, start, sizes) => {
      let balls = "";
      for (let i = 0; i < n; i++) { const a = start + i / n * Math.PI * 2, s = sizes[i % sizes.length]; balls += `<span class="orb" style="left:${d(50 + Math.cos(a) * 50)}%;top:${d(50 + Math.sin(a) * 50)}%;width:${s}%;height:${s}%;margin:-${d(s / 2)}% 0 0 -${d(s / 2)}%"></span>`; }
      return `<span class="${cls}">${balls}</span>`;
    };
    const n = calm ? 2 : 3;
    h = ring("ring", n, -Math.PI / 2, [12, 9, 11]) + ring("ring r2", n, Math.PI / 2 + Math.PI / n, [8, 10, 7]);
  }
  if (kind === "ring") h = '<span class="rb"></span>';
  if (kind === "ripple") h = [0, 0.9, 1.8].map((s) => `<span class="rp" style="animation-delay:-${s}s"></span>`).join("");
  if (kind === "heart") { const n = calm ? 4 : 8; for (let i = 0; i < n; i++) { const s = 19 + (i * 4) % 8; h += `<span class="ht" style="left:${i % 2 ? -6 + (i % 3) * 3 : 92 - (i % 3) * 3}%;top:${78 - (i % 3) * 9}%;width:${s}%;height:${s}%;animation-delay:-${d(i * 0.4)}s,-${d(i * 0.3)}s"></span>`; } }
  if (kind === "confetti") { const n = calm ? 5 : 10, cols = ["var(--c)", "var(--cl)", "var(--cd)"]; for (let i = 0; i < n; i++) { const w = 7 + (i * 3) % 5; h += `<span class="cf" style="left:${i % 2 ? -8 + (i % 4) * 5 : 90 - (i % 4) * 5}%;top:${-4 + (i % 3) * 10}%;width:${w}%;height:${d(w * 0.55)}%;background:${cols[i % 3]};animation-delay:-${d(i * 0.33)}s;animation-duration:${d(2.4 + i % 3 * 0.4)}s"></span>`; } }
  if (kind === "spot") h = '<span class="cone"></span><span class="pool"></span>';
  if (kind === "halo") h = '<span class="hl"></span>';
  if (kind === "eclipse") h = '<span class="cor c1"></span><span class="cor c2"></span><span class="disc"></span><span class="flare"></span>';
  // Three thin rings tilted on different axes, each turning on its own, each carrying one bead of light (two rings on small pictures).
  if (kind === "gyro") h = (calm ? [1, 2] : [1, 2, 3]).map((n) => `<span class="gy gy${n}"></span>`).join("");
  return h;
}

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const mixHex = (hex, toWhite, k) => "#" + hexToRgb(hex).map((x) => Math.round(x + ((toWhite ? 255 : 0) - x) * k).toString(16).padStart(2, "0")).join("");

// Starts watching the page. `tints` are the slot colours as "#rrggbb" (slot 1 is tints[0]); a picture without a slot (0) gets its effect's own colour.
// Returns { refresh(root) } for a screen that wants its pictures checked right away.
export function installAuras(tints, fallback = "#f4b94a") {
  const live = new Set();
  const sizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver((entries) => { for (const e of entries) place(e.target); }) : null;
  function colourOf(img) {
    const slot = Number(img.dataset.auraSlot) || 0, fixed = SUPPORTER_AURAS.find((x) => x.id === img.dataset.aura);
    if (fixed) return fixed.colour;
    const hex = /^#[0-9a-f]{6}$/i.test(tints[slot - 1] || "") ? tints[slot - 1] : AURA_DEFAULT_COLOUR[img.dataset.aura] || fallback;
    return hex;
  }
  function build(img, fx, w) {
    const kind = img.dataset.aura, calm = w < FULL_SIZE, hex = colourOf(img), s = fx.style;
    const sig = kind + "|" + (calm ? 1 : 0) + "|" + hex;
    if (fx.dataset.sig === sig) return;
    fx.dataset.sig = sig;
    fx.className = "aura-fx a-" + kind + (calm ? " calm" : "");
    s.setProperty("--c", hex); s.setProperty("--cl", mixHex(hex, true, 0.5)); s.setProperty("--cd", mixHex(hex, false, 0.28)); s.setProperty("--rgb", hexToRgb(hex).join(" "));
    fx.innerHTML = auraPieces(kind, calm);
  }
  function drop(img) {
    img._auraFx?.remove(); img._auraFx = null; live.delete(img); sizeObserver?.unobserve(img);
  }
  function place(img) {
    if (!img.isConnected || !isAura(img.dataset.aura)) { drop(img); return; }
    let fx = img._auraFx;
    const w = img.offsetWidth, h = img.offsetHeight;
    if (w < MIN_SIZE) { if (fx) fx.hidden = true; return; }
    if (!fx) {
      fx = img._auraFx = document.createElement("span");
      fx.setAttribute("aria-hidden", "true");
      if (getComputedStyle(img).position === "static") img.style.position = "relative";   // so the picture paints over its own aura
      img.before(fx);
      live.add(img); sizeObserver?.observe(img);
    }
    fx.hidden = false;
    build(img, fx, w);
    const s = fx.style;
    s.left = img.offsetLeft + "px"; s.top = img.offsetTop + "px"; s.width = w + "px"; s.height = h + "px";
  }
  function refresh(root = document) {
    const found = root.nodeType === 1 && root.matches?.("img[data-aura]") ? [root] : [];
    if (root.querySelectorAll) found.push(...root.querySelectorAll("img[data-aura]"));
    for (const img of found) place(img);
    for (const img of [...live]) if (!img.isConnected || !isAura(img.dataset.aura)) drop(img);   // a picture that lost its aura or left the page
  }
  let queued = false, pending = new Set();
  const flush = () => { queued = false; const nodes = [...pending]; pending = new Set(); for (const n of nodes) if (n.isConnected) refresh(n); for (const img of [...live]) if (!img.isConnected) drop(img); };
  const queue = (node) => { pending.add(node); if (!queued) { queued = true; requestAnimationFrame(flush); } };
  new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "attributes") { queue(r.target); continue; }
      for (const n of r.addedNodes) if (n.nodeType === 1 && !n.classList.contains("aura-fx")) queue(n);
    }
    if (live.size && !queued) { queued = true; requestAnimationFrame(flush); }   // removals: sweep layers whose picture is gone
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-aura", "data-aura-slot"] });
  // Pictures can move without changing size (a list above them grows), so every second the layers follow their pictures.
  setInterval(() => { if (!document.hidden) for (const img of live) place(img); }, 1000);
  addEventListener("resize", () => { for (const img of live) place(img); });
  refresh(document);
  return { refresh };
}
