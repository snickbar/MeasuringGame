const styles = [
  "Soft bevel (default)", "Carved wood", "Stitched leather", "Patchwork quilt", "Enamel pin",
  "Hammered metal", "Riveted steel", "Stained glass", "Mosaic tile", "Neon tubing", "Marquee bulbs",
  "Frosted glass", "Forged ember", "Crystal facets", "Mossy stone", "Woven rattan", "Wrapped ribbon",
  "Layered paper", "Arcade pixel", "Candy shell", "Water ripple",
];

export function buildPlayerFramePreview(getPlayer) {
  const root = document.createElement("div");
  root.className = "dbg-body";
  root.innerHTML = `
    <style>
      .frame-preview-controls { display:flex; flex-wrap:wrap; gap:8px; align-items:end; margin-bottom:12px; }
      .frame-preview-controls label { display:grid; gap:4px; font-weight:700; }
      .frame-preview-controls select { max-width:100%; font:inherit; }
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
      <label>Frame <select data-frame></select></label>
      <label>Color <input type="color" value="#bb8251" data-color></label>
      <label><span>Use color <input type="checkbox" data-tint></span></label>
    </div>
    <div class="frame-preview-grid"></div>
    <p class="dbg-note" role="status" data-preview-status>Sample scores. Preview choices are temporary.</p>`;

  const select = root.querySelector("[data-frame]");
  const color = root.querySelector("[data-color]");
  const useTint = root.querySelector("[data-tint]");
  const status = root.querySelector("[data-preview-status]");
  const grid = root.querySelector(".frame-preview-grid");
  select.append(...styles.map((style, index) => new Option(style, String(index))));
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
      card.style.borderColor = !url && useTint.checked ? color.value : "";
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
      if (!useTint.checked) {
        applyArt(image.src);
        return;
      }
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const tint = color.value.slice(1).match(/../g).map((hex) => parseInt(hex, 16));
      for (let i = 0; i < pixels.data.length; i += 4) {
        const light = pixels.data[i];
        for (let channel = 0; channel < 3; channel++) {
          pixels.data[i + channel] = light < 128
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
  useTint.addEventListener("change", updateArt);
  color.addEventListener("input", () => {
    useTint.checked = true;
    updateArt();
  });
  root.refreshPlayer();
  return root;
}
