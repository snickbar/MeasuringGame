// Draws the shareable result card (1080x1350) onto a canvas and returns a PNG blob.
// Pure drawing: the caller supplies already-resolved text and image URLs.
const W = 1080, H = 1350;
const INK = "#5a3a1a", ORANGE = "#c8660a";
const FONT = "Fredoka, 'Baloo 2', 'Arial Rounded MT Bold', system-ui, sans-serif";

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(ctx, text, maxW, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const keep = lines.slice(0, maxLines);
    let last = keep[maxLines - 1];
    while (last.length > 1 && ctx.measureText(last + "…").width > maxW) last = last.slice(0, -1);
    keep[maxLines - 1] = last + "…";
    return keep;
  }
  return lines;
}

function fitText(ctx, text, weight, startSize, maxW) {
  let size = startSize;
  do { ctx.font = `${weight} ${size}px ${FONT}`; size -= 2; } while (ctx.measureText(text).width > maxW && size > 16);
}

function drawContain(ctx, img, x, y, w, h) {
  if (!img) return;
  const s = Math.min(w / img.width, h / img.height);
  const dw = img.width * s, dh = img.height * s;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function outlinedText(ctx, text, x, y, fill, stroke, lw) {
  ctx.lineJoin = "round";
  ctx.lineWidth = lw;
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

/**
 * spec: {
 *   modeLabel, question?, small?:{image,guess}, big?:{image},
 *   headline, headlineLabel, player:{name, avatar, subtitle}, dots?:string[],
 *   logo, footer?
 * }
 */
export async function renderShareCard(spec) {
  if (document.fonts && document.fonts.load) {
    try { await Promise.all([document.fonts.load(`700 40px Fredoka`), document.fonts.load(`600 40px Fredoka`)]); } catch (err) {}
  }
  const [logo, avatar, small, big] = await Promise.all([
    loadImage(spec.logo), loadImage(spec.player && spec.player.avatar),
    loadImage(spec.small && spec.small.image), loadImage(spec.big && spec.big.image),
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Sky and sand, clipped to a rounded card.
  ctx.save();
  rr(ctx, 0, 0, W, H, 56); ctx.clip();
  const sky = ctx.createLinearGradient(0, 0, 0, 700);
  sky.addColorStop(0, "#9fd3f2"); sky.addColorStop(1, "#d3ebfa");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 700);
  const sand = ctx.createLinearGradient(0, 700, 0, H);
  sand.addColorStop(0, "#f6e6c3"); sand.addColorStop(1, "#f0d9a5");
  ctx.fillStyle = sand; ctx.fillRect(0, 700, W, H - 700);

  // Logo
  if (logo) drawContain(ctx, logo, 270, 20, 540, 252);

  // Mode pill
  if (spec.modeLabel) {
    ctx.font = `700 46px ${FONT}`;
    const pw = Math.min(900, ctx.measureText(spec.modeLabel).width + 110);
    ctx.fillStyle = "#eda650"; rr(ctx, (W - pw) / 2, 258, pw, 82, 41); ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = "#6e4217"; ctx.stroke();
    outlinedText(ctx, spec.modeLabel, W / 2, 316, "#fff", "#6e4217", 8);
  }

  const hasObjects = !!(spec.question || big || small);
  if (spec.question) {
    ctx.font = `600 46px ${FONT}`;
    const lines = wrapLines(ctx, spec.question, 840, 3);
    const bh = 54 + lines.length * 56;
    ctx.fillStyle = "rgba(255,255,255,.94)"; rr(ctx, 68, 362, 944, bh, 44); ctx.fill();
    ctx.fillStyle = INK;
    lines.forEach((l, i) => ctx.fillText(l, W / 2, 362 + 30 + 46 + i * 56));
  }

  let headlineY = 975;
  if (hasObjects) {
    if (big) drawContain(ctx, big, 600, 540, 280, 290);
    if (small) {
      drawContain(ctx, small, 170, 735, 240, 95);
      if (spec.small.guess) { ctx.font = `700 40px ${FONT}`; ctx.fillStyle = INK; ctx.fillText(spec.small.guess, 290, 722); }
    }
  } else {
    headlineY = 800;
  }

  // Headline number
  const hl = String(spec.headline || "");
  fitText(ctx, hl, 700, hasObjects ? 150 : 320, 900);
  outlinedText(ctx, hl, W / 2, headlineY, ORANGE, "#fff", 14);
  if (spec.headlineLabel) {
    ctx.font = `700 52px ${FONT}`;
    ctx.fillStyle = INK;
    ctx.fillText(spec.headlineLabel, W / 2, headlineY + 76);
  }

  // Player row
  const py = 1080;
  ctx.fillStyle = "#fffdf6"; rr(ctx, 68, py, 944, 166, 60); ctx.fill();
  ctx.lineWidth = 7; ctx.strokeStyle = "#c9a26d"; ctx.stroke();
  if (avatar) drawContain(ctx, avatar, 100, py + 18, 130, 130);
  const p = spec.player || {};
  const dots = spec.dots || [];
  const textMax = 944 - 190 - (dots.length ? dots.length * 56 + 40 : 40);
  ctx.textAlign = "left";
  fitText(ctx, String(p.name || "").toUpperCase(), 700, 62, textMax);
  ctx.fillStyle = INK; ctx.fillText(String(p.name || "").toUpperCase(), 250, py + 82);
  if (p.subtitle) { ctx.font = `600 36px ${FONT}`; ctx.fillStyle = "#8a6a3f"; ctx.fillText(p.subtitle, 250, py + 128); }
  dots.forEach((c, i) => {
    const cx = 1012 - 40 - (dots.length - 1 - i) * 56 - 24;
    ctx.beginPath(); ctx.arc(cx, py + 83, 22, 0, Math.PI * 2);
    ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = "rgba(60,40,10,.55)"; ctx.stroke();
  });

  // Footer
  ctx.textAlign = "center";
  ctx.font = `700 46px ${FONT}`;
  const foot = spec.footer || "Think you can beat me?";
  const brand = "Size Em Up";
  const fw = ctx.measureText(foot).width, bw = ctx.measureText(brand).width, tri = 40, gap = 20;
  const total = fw + gap + tri + 12 + bw;
  let x = (W - total) / 2;
  ctx.textAlign = "left"; ctx.fillStyle = INK;
  ctx.fillText(foot, x, 1313);
  x += fw + gap;
  ctx.beginPath(); ctx.moveTo(x, 1280); ctx.lineTo(x + tri, 1297); ctx.lineTo(x, 1314); ctx.closePath(); ctx.fill();
  ctx.fillText(brand, x + tri + 12, 1313);
  ctx.restore();

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}
