// Avatar Level 4: Colors. An avatar's colour is painted on the phone: the masks in avatar-color-masks.png say which pixels are
// the avatar's clothes (or fur, or whatever its main colour is), and those pixels are shifted to the chosen hue. Nothing but the
// masks and a little data ships, no extra pictures. The data and masks are built by scripts/build-avatar-colors.py.
import { AVATAR_COLOR_DATA, COLOR_MASK_CELL, COLOR_MASK_COLS } from "./avatar-colors-data.mjs";

export const COLOR_SHADES = {
  P: { name: "Pink", hue: 330 }, B: { name: "Blue", hue: 215 }, G: { name: "Green", hue: 130 }, U: { name: "Purple", hue: 280 },
  Y: { name: "Yellow", hue: 50 }, R: { name: "Red", hue: 0 }, T: { name: "Teal", hue: 175 },
};
const TINT_ADD = { w: 0.36, g: 0.46, k: 0.5, c: 0.42, G: 0.64 };
const MASK_ORDER = Object.keys(AVATAR_COLOR_DATA);

// The colours an avatar offers besides its own: [{ name, hue }]. Empty for an id that has none.
export function colorChoices(id) {
  const data = AVATAR_COLOR_DATA[id];
  return data ? [...data.split("|")[1]].map((letter) => ({ name: COLOR_SHADES[letter].name, hue: COLOR_SHADES[letter].hue })) : [];
}
export const colorHue = (id, name) => colorChoices(id).find((c) => c.name === name)?.hue;
export const hasColors = (id) => colorChoices(id).length > 0;

function parseLayers(id) {
  return AVATAR_COLOR_DATA[id].split("|")[0].split(",").map((l) => ({ kind: l[0], cen: l.length > 1 ? Number(l.slice(1)) : 0 }));
}
function hsvToRgb(h, s, v) {
  const hh = (((h % 360) + 360) % 360) / 60, i = Math.floor(hh) % 6, f = hh - Math.floor(hh);
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  return [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i];
}
// One pixel of one layer: returns [r, g, b] in 0..1 for the original pixel (r, g, b in 0..1) painted toward `target` hue.
function paint(kind, cen, target, r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn + 1e-9, s = d / (mx + 1e-9), v = mx;
  const h = (mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
  const hue = (h + 360) % 360;
  if (kind === "F") return hsvToRgb(target, 0.36, 0.97);
  if (kind === "t") return hsvToRgb(target, 0.5, Math.min(1, v * 1.5 + 0.12));
  if (kind in TINT_ADD) {
    const fade = kind === "k" ? 1 : Math.min(1, Math.max(0, (v - 0.5) / 0.25));
    return hsvToRgb(target, Math.min(0.75, Math.max(0, s + TINT_ADD[kind] * fade)), kind === "k" ? Math.min(1, v * 1.5 + 0.1) : v * 0.97);
  }
  if (kind === "f") return hsvToRgb(target + (((hue + 180) % 360) - 180) * 0.1, s, v);
  return hsvToRgb(target + (((hue - cen + 540) % 360) - 180) * 0.6, kind === "b" ? Math.max(s, 0.55) : s, v);
}
// Paints `px` (RGBA bytes) in place. `weights[i]` is layer i's mask, 0..1 per pixel; later layers go over earlier ones.
export function recolorPixels(px, weights, layers, target) {
  const n = px.length / 4;
  for (let li = 0; li < layers.length; li++) {
    const w = weights[li], { kind, cen } = layers[li];
    const base = px.slice(); // every layer reads the original pixels, as the build rules do
    for (let i = 0; i < n; i++) {
      const wi = w[i];
      if (wi <= 0.004) continue;
      const o = i * 4, [r, g, b] = paint(kind, cen, target, base[o] / 255, base[o + 1] / 255, base[o + 2] / 255);
      px[o] = Math.round(px[o] + (r * 255 - px[o]) * wi); px[o + 1] = Math.round(px[o + 1] + (g * 255 - px[o + 1]) * wi); px[o + 2] = Math.round(px[o + 2] + (b * 255 - px[o + 2]) * wi);
      if (kind === "F") px[o + 3] = Math.round(px[o + 3] + (255 - px[o + 3]) * wi);
    }
  }
}

const done = new Map(), working = new Map();
let sheetPromise = null;
const fullUrl = (path) => new URL(path, document.baseURI).href;
function loadSheet() {
  return sheetPromise || (sheetPromise = (async () => {
    const image = new Image(); image.src = fullUrl("anim/avatar-color-masks.png"); await image.decode();
    const canvas = document.createElement("canvas"); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true }); ctx.drawImage(image, 0, 0);
    return canvas;
  })().catch((e) => { sheetPromise = null; throw e; }));
}
export const colorKey = (id, name) => id + "|" + name;
// The picture of avatar `id` painted `name`, as a data address, once it is ready (null until then or when it cannot be made).
export const recoloredAvatar = (id, name) => done.get(colorKey(id, name)) || null;
// Makes it. Resolves to the data address, or null when this avatar has no such colour or something failed (the original shows then).
export function makeRecoloredAvatar(id, name) {
  const key = colorKey(id, name), hue = colorHue(id, name);
  if (done.has(key)) return Promise.resolve(done.get(key));
  if (hue === undefined) return Promise.resolve(null);
  if (working.has(key)) return working.get(key);
  const job = (async () => {
    const [image, sheet] = await Promise.all([(async () => { const im = new Image(); im.src = fullUrl("avatars/" + id + ".webp"); await im.decode(); return im; })(), loadSheet()]);
    const w = image.naturalWidth, h = image.naturalHeight, layers = parseLayers(id), slot = MASK_ORDER.indexOf(id);
    const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true }); ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, w, h);
    // The mask cell is drawn up to the picture's size (smoothly, so the edge is soft) and read back as one weight per pixel.
    const m = document.createElement("canvas"); m.width = w; m.height = h;
    const mctx = m.getContext("2d", { willReadFrequently: true }); mctx.imageSmoothingQuality = "high";
    mctx.drawImage(sheet, (slot % COLOR_MASK_COLS) * COLOR_MASK_CELL, Math.floor(slot / COLOR_MASK_COLS) * COLOR_MASK_CELL, COLOR_MASK_CELL, COLOR_MASK_CELL, 0, 0, w, h);
    const mask = mctx.getImageData(0, 0, w, h).data, weights = layers.map((_, li) => {
      const out = new Float32Array(w * h);
      for (let i = 0; i < out.length; i++) out[i] = Math.min(1, Math.max(0, (mask[i * 4 + li] / 255 - 0.25) * 2)); // a little sharper than the smooth scale-up
      return out;
    });
    recolorPixels(pixels.data, weights, layers, hue);
    ctx.putImageData(pixels, 0, 0);
    const url = canvas.toDataURL();
    done.set(key, url);
    return url;
  })().catch(() => null).finally(() => working.delete(key));
  working.set(key, job);
  return job;
}
