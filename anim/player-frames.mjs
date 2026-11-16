const styles = [
  "Soft bevel (default)", "Carved wood", "Stitched leather", "Patchwork quilt", "Enamel pin",
  "Hammered metal", "Riveted steel", "Stained glass", "Mosaic tile", "Neon tubing", "Marquee bulbs",
  "Frosted glass", "Forged ember", "Crystal facets", "Mossy stone", "Woven rattan", "Wrapped ribbon",
  "Layered paper", "Arcade pixel", "Candy shell", "Water ripple",
];

const shinyFrames = new Set([4, 5, 6, 7, 9, 10, 11, 13, 19, 20]);
const colors = [
  ["Gold", "#c49538"], ["Green", "#5b903b"], ["Blue", "#397eb6"],
  ["Purple", "#8861ad"], ["Red", "#b14752"], ["Brown", "#986b4d"],
];

function shadedPalette(tint, shiny) {
  const brightness = ([r, g, b]) => r * 0.2126 + g * 0.7152 + b * 0.0722;
  const average = brightness(tint);
  const middle = Math.max(100, Math.min(151, average));
  const chroma = tint.map((channel) => channel - average);
  const darkest = -Math.min(...chroma);
  const brightest = Math.max(...chroma);
  return Array.from({ length: 256 }, (_, light) => {
    const level = light < 128
      ? 24 + (middle - 24) * light / 128
      : middle + (213 - middle) * (light - 128) / 127;
    const strength = light < 128 ? 0.24 + light / 210 : 0.85 - (light - 128) / 420;
    const colorStrength = Math.min(strength, darkest ? level / darkest : 1,
      brightest ? (255 - level) / brightest : 1);
    const glint = shiny ? Math.max(0, (light - 244) / 11) * 0.65 : 0;
    return chroma.map((channel) => {
      const shade = level + channel * colorStrength;
      return shade + (255 - shade) * glint;
    });
  });
}

export function buildPlayerFramePreview(getPlayer) {
  const root = document.createElement("div");
  root.className = "dbg-body";
  root.innerHTML = `
    <style>
      .frame-preview-controls { display:flex; flex-wrap:wrap; gap:8px; align-items:end; margin-bottom:12px; }
      .frame-preview-controls label { display:grid; gap:4px; font-weight:700; }
      .frame-preview-controls select { max-width:100%; font:inherit; }
      .frame-preview-control { display:grid; gap:4px; max-width:100%; }
      .frame-preview-stepper { display:flex; align-items:center; gap:4px; }
      .frame-preview-stepper select { min-width:0; }
      .dbg-body .frame-preview-stepper button { box-sizing:border-box; flex:0 0 24px;
        display:grid; place-items:center; width:24px; height:26px; min-width:0; min-height:0;
        margin:0; padding:0; border:1px solid #c7aa83; border-image:none; border-radius:6px;
        background:#fff8e6; color:#3b2b1e; box-shadow:none; text-shadow:none; font:600 17px/1 system-ui; }
      .frame-preview-grid { display:grid; gap:12px; }
      .frame-preview-grid figure { margin:0; }
      .frame-preview-grid figcaption { margin-bottom:4px; font-size:.8rem; font-weight:700; }
      .frame-preview-card { display:flex; align-items:center; gap:8px; position:relative;
        box-sizing:border-box; padding:12px 16px; min-height:64px; color:#3b2b1e;
        border:3px solid #c7aa83; border-radius:13px; background:#fff8e6; overflow-wrap:anywhere; }
      .frame-preview-card.has-frame { border-color:transparent; background-clip:padding-box; }
      .frame-preview-card.has-frame::after { content:""; position:absolute; inset:-3px; pointer-events:none;
        border:var(--frame-edge, 17px) solid transparent; border-image:var(--frame-art) 38 repeat; }
      .frame-preview-card img { width:42px; height:42px; object-fit:contain; flex:none; }
      .frame-preview-card small { display:block; }
      .frame-preview-card.is-compact { flex-direction:column; justify-content:center;
        width:110px; min-height:128px; text-align:center; --frame-edge:13px; }
      .frame-preview-card.is-results { min-height:98px; }
      .frame-preview-card.is-results img { width:54px; height:54px; }
    </style>
    <div class="frame-preview-controls">
      <div class="frame-preview-control">
        <strong>Frame</strong>
        <div class="frame-preview-stepper">
          <button type="button" data-step-frame="-1" aria-label="Previous frame">‹</button>
          <select data-frame aria-label="Frame"></select>
          <button type="button" data-step-frame="1" aria-label="Next frame">›</button>
        </div>
      </div>
      <div class="frame-preview-control">
        <strong>Color</strong>
        <div class="frame-preview-stepper">
          <button type="button" data-step-color="-1" aria-label="Previous color">‹</button>
          <select data-palette aria-label="Preset color"></select>
          <button type="button" data-step-color="1" aria-label="Next color">›</button>
          <input type="color" data-color aria-label="Custom color">
        </div>
      </div>
      <label>Tint <select data-tint><option value="shaded">Shaded</option><option value="original">Original</option><option value="none">Grayscale</option></select></label>
    </div>
    <div class="frame-preview-grid"></div>
    <p class="dbg-note" role="status" data-preview-status>Sample scores. Preview choices are temporary.</p>`;

  const select = root.querySelector("[data-frame]");
  const color = root.querySelector("[data-color]");
  const paletteSelect = root.querySelector("[data-palette]");
  const tintMode = root.querySelector("[data-tint]");
  const status = root.querySelector("[data-preview-status]");
  const grid = root.querySelector(".frame-preview-grid");
  select.append(...styles.map((style, index) => new Option(style, String(index))));
  select.value = "1";
  paletteSelect.append(...colors.map(([label, hex]) => new Option(label, hex)), new Option("Custom", ""));
  color.value = paletteSelect.value = colors[0][1];
  paletteSelect.lastElementChild.disabled = true;
  const cards = [
    ["Lobby", "", "Ready"],
    ["In-game", "is-compact", "4 pts"],
    ["Final results", "is-results", "1st place · 92% accuracy · 15 pts"],
  ].map(([label, type, detail]) => {
    const figure = document.createElement("figure");
    figure.innerHTML = `<figcaption>${label}</figcaption><div class="frame-preview-card ${type}">
      <img alt=""><div><strong></strong><small>${detail}</small></div></div>`;
    grid.append(figure);
    return figure.lastElementChild;
  });

  const images = new Map();
  const canvas = document.createElement("canvas");
  let request = 0;
  function applyArt(url) {
    for (const card of cards) {
      card.classList.toggle("has-frame", Boolean(url));
      card.style.setProperty("--frame-art", url ? `url("${url}")` : "none");
      card.style.borderColor = !url && tintMode.value !== "none" ? color.value : "";
    }
  }
  async function updateArt() {
    const currentRequest = ++request;
    const id = Number(select.value);
    status.textContent = "Sample scores. Preview choices are temporary.";
    if (id === 0) {
      applyArt(null);
      return;
    }
    try {
      if (!images.has(id)) {
        const image = new Image();
        image.src = new URL(`./player-frames/${id}.png`, import.meta.url);
        images.set(id, image);
      }
      const image = images.get(id);
      await image.decode();
      if (currentRequest !== request) return;
      if (tintMode.value === "none") {
        applyArt(image.src);
        return;
      }
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const tint = color.value.slice(1).match(/../g).map((hex) => parseInt(hex, 16));
      const palette = tintMode.value === "shaded" ? shadedPalette(tint, shinyFrames.has(id)) : null;
      for (let i = 0; i < pixels.data.length; i += 4) {
        const light = pixels.data[i];
        for (let channel = 0; channel < 3; channel++) {
          pixels.data[i + channel] = palette ? palette[light][channel] : light < 128
            ? tint[channel] * light / 128
            : tint[channel] + (255 - tint[channel]) * (light - 128) / 127;
        }
      }
      ctx.putImageData(pixels, 0, 0);
      applyArt(canvas.toDataURL());
    } catch {
      if (currentRequest !== request) return;
      images.delete(id);
      applyArt(null);
      status.textContent = "This frame couldn’t load. Try selecting it again.";
    }
  }
  root.refreshPlayer = () => {
    const { name, avatar } = getPlayer();
    for (const card of cards) {
      card.querySelector("strong").textContent = name || "Player";
      card.querySelector("img").src = avatar;
    }
  };
  select.addEventListener("change", updateArt);
  tintMode.addEventListener("change", updateArt);
  color.addEventListener("input", () => {
    paletteSelect.value = colors.some(([, hex]) => hex === color.value) ? color.value : "";
    if (tintMode.value === "none") tintMode.value = "shaded";
    updateArt();
  });
  paletteSelect.addEventListener("change", () => {
    color.value = paletteSelect.value;
    color.dispatchEvent(new Event("input"));
  });
  for (const button of root.querySelectorAll("[data-step-frame]")) {
    button.addEventListener("click", () => {
      select.selectedIndex = (select.selectedIndex + Number(button.dataset.stepFrame) + styles.length) % styles.length;
      updateArt();
    });
  }
  for (const button of root.querySelectorAll("[data-step-color]")) {
    button.addEventListener("click", () => {
      const step = Number(button.dataset.stepColor);
      const index = colors.findIndex(([, hex]) => hex === color.value);
      const next = index < 0 ? (step > 0 ? 0 : colors.length - 1) : (index + step + colors.length) % colors.length;
      paletteSelect.value = colors[next][1];
      paletteSelect.dispatchEvent(new Event("change"));
    });
  }
  root.refreshPlayer();
  updateArt();
  return root;
}
