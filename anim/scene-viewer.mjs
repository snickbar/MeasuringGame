// Scene viewer (Settings > Debug / Admin tools): pick any reveal scene, a small object and a big object, then watch the real reveal.
// Plays the same engine the game uses, so what you see here is what players get. Shown only where the debug tools are.
// Move a scene to the front when its artwork or layout changes. Scenes without
// a recent revision appear alphabetically after this list.
const recentScenes = [
  "boardwalk", "blossom", "cave", "space", "fair", "mountain", "jungle", "grass", "farm", "stadium",
  "city", "volcano", "rooftop", "beach",
  "living", "kitchen", "tabletop", "library", "workshop", "desert",
  "underwater", "snow", "forest",
];
const sceneLabels = {
  space: "Moon", jungle: "Temple", grass: "Meadow", fair: "County Fair",
  city: "Times Square at Night", cave: "Crystal Cave", blossom: "Cherry Blossom",
  rooftop: "Rooftops at Sunset", living: "Living Room", resort: "Beach Resort",
  tabletop: "Tabletop",
};
const sceneLabel = (id) => sceneLabels[id] ?? id.charAt(0).toUpperCase() + id.slice(1);

export function buildSceneViewer({ loadAnim, objects }) {
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const wrap = el("div", "dbg-body scene-viewer");
  const byId = new Map(objects.map((o) => [o.id, o]));
  const sorted = objects.slice().sort((a, b) => a.name.localeCompare(b.name));
  const pick = (label, value) => {
    const s = el("select", "dbg-input"); s.style.width = "100%"; s.setAttribute("aria-label", label);
    sorted.forEach((o) => { const op = el("option", "", o.name); op.value = o.id; s.appendChild(op); });
    if (byId.has(value)) s.value = value; return s;
  };
  const field = (label, control) => { const r = el("label", "dbg-row"); r.appendChild(el("span", "dbg-label", label)); r.appendChild(control); return r; };
  const KEY = "scene-viewer-last";
  let saved = {}; try { saved = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { saved = {}; }
  const small = pick("Small object", saved.small || "soccer-ball"), big = pick("Big object", saved.big || "empire-state-building");
  const scene = el("select", "dbg-input"); scene.style.width = "100%"; scene.setAttribute("aria-label", "Scene");
  const look = el("select", "dbg-input"); look.style.width = "100%"; look.setAttribute("aria-label", "Day or night");
  [["day", "Day"], ["night", "Night"]].forEach(([v, t]) => { const o = el("option", "", t); o.value = v; look.appendChild(o); });
  const count = el("input", "dbg-input"); count.type = "number"; count.min = "1"; count.max = "5000"; count.placeholder = "auto"; count.inputMode = "numeric";
  look.value = saved.look === "night" ? "night" : "day"; if (saved.count) count.value = saved.count;
  const remember = () => { try { localStorage.setItem(KEY, JSON.stringify({ scene: scene.value, small: small.value, big: big.value, look: look.value, count: count.value })); } catch (e) { /* storage unavailable */ } };
  [small, big, scene, look, count].forEach((c) => c.addEventListener("change", remember));
  const stage = el("div", "scene-viewer-stage"); stage.style.cssText = "width:100%;min-height:80px;border-radius:10px;overflow:hidden;background:#fff8ec";
  const note = el("p", "dbg-note", "Pick a scene and press Play. Leave the count on auto to use the real size ratio, or type a number of small objects to make the stack taller.");
  const buttons = el("div", "dbg-row");
  const mkBtn = (label, fn) => { const b = el("button", "dbg-btn", label); b.type = "button"; b.addEventListener("click", fn); buttons.appendChild(b); return b; };
  // Pause and scrub: the reveal runs on this clock instead of the real one, so it can be frozen or dragged to any moment for screenshots.
  const timeline = el("input", "dbg-input"); timeline.type = "range"; timeline.min = "0"; timeline.max = "20"; timeline.step = "0.01"; timeline.value = "0"; timeline.setAttribute("aria-label", "Timeline");
  timeline.style.width = "100%";
  const timeLabel = el("span", "dbg-label", "0.00 s");
  let pos = 0, playing = true, lastReal = 0, running = false, curScene = null, startOpts = null, pauseBtn = null;
  const clock = () => { const r = performance.now(); if (playing) pos += (r - lastReal) / 1000; lastReal = r; return pos * 1000; };
  const setPaused = (p) => { playing = !p; lastReal = performance.now(); if (pauseBtn) pauseBtn.textContent = p ? "▶ Resume" : "⏸ Pause"; };
  let ids = [], mod = null, ctl = null, ctlLook = null, token = 0, tour = false;

  async function setup() {
    if (ids.length) return;
    const m = await import("./scenery.mjs");
    const available = Object.keys(m.SETTINGS);
    ids = [
      ...recentScenes.filter((id) => Object.hasOwn(m.SETTINGS, id)),
      ...available.filter((id) => !recentScenes.includes(id))
        .sort((a, b) => sceneLabel(a).localeCompare(sceneLabel(b))),
    ];
    const auto = el("option", "", "Auto (follows the big object)"); auto.value = ""; scene.appendChild(auto);
    ids.forEach((id) => { const o = el("option", "", sceneLabel(id)); o.value = id; scene.appendChild(o); });
    scene.value = saved.scene !== undefined && (saved.scene === "" || ids.includes(saved.scene)) ? saved.scene : "rooftop";
  }
  async function play() {
    const my = ++token; remember();
    note.textContent = "Loading…";
    try {
      await setup();
      mod = mod || await loadAnim();
      if (!mod) { note.textContent = "The animation engine did not load."; return; }
      const theme = look.value === "night" ? mod.DARK_THEME : mod.LIGHT_THEME;
      if (!ctl || ctlLook !== look.value) {
        if (ctl) try { ctl.destroy(); } catch (e) { /* rebuilding */ }
        stage.textContent = ""; ctl = mod.createStackAnimation(stage, { theme, imageUrl: (o) => o.image }); ctlLook = look.value;
      }
      const u = byId.get(small.value), b = byId.get(big.value);
      const n = Math.max(1, Math.min(5000, Math.round(+count.value || (b.mm / u.mm))));
      const unit = { ...u }, target = { ...b, mm: u.mm * n, sceneryOverride: scene.value || undefined };
      stage.style.width = "100%";
      const sc = await ctl.prepare(unit, target, { hMax: 330, minStageH: 700 });
      if (my !== token) return;
      note.textContent = `${u.plural || u.name} vs ${b.name}: ${n.toLocaleString()} stacked · scene ${scene.value ? sceneLabel(scene.value) : "Auto"} · ${look.value}`;
      curScene = sc; pos = 0; lastReal = performance.now(); setPaused(false);
      timeline.max = String(sc.duration || 20); timeline.value = "0"; timeLabel.textContent = "0.00 s";
      startOpts = { startAt: 0, now: clock,
        onFrame: (t) => { running = true; if (document.activeElement !== timeline) timeline.value = String(t); timeLabel.textContent = t.toFixed(2) + " s"; },
        onDone: () => { running = false; if (tour && my === token) setTimeout(() => nextScene(true), 1500); } };
      running = true; ctl.start(sc, startOpts);
    } catch (e) { note.textContent = "That didn't play: " + String((e && e.message) || e).slice(0, 80); }
  }
  async function nextScene(auto) {
    await setup();
    const opts = ids, i = opts.indexOf(scene.value);
    if (auto && i >= opts.length - 1) { tour = false; tourBtn.textContent = "Play every scene"; return; }
    scene.value = opts[(i + 1 + opts.length) % opts.length]; play();
  }
  async function prevScene() { await setup(); const i = ids.indexOf(scene.value); scene.value = ids[(i - 1 + ids.length) % ids.length]; play(); }
  const tourBtn = el("button", "dbg-btn", "Play every scene"); tourBtn.type = "button";
  tourBtn.addEventListener("click", async () => {
    await setup(); tour = !tour; tourBtn.textContent = tour ? "Stop tour" : "Play every scene";
    if (tour) { scene.value = ids[0]; play(); } else token++;
  });
  mkBtn("▶ Play", () => { tour = false; tourBtn.textContent = "Play every scene"; play(); });
  pauseBtn = mkBtn("⏸ Pause", () => setPaused(playing));
  timeline.addEventListener("input", () => { // dragging the slider pauses and shows that moment
    pos = +timeline.value; setPaused(true); timeLabel.textContent = pos.toFixed(2) + " s";
    if (curScene && ctl && !running) { running = true; ctl.start(curScene, startOpts); }
  });
  mkBtn("◀ Prev scene", () => { tour = false; prevScene(); });
  mkBtn("Next scene ▶", () => { tour = false; nextScene(false); });
  buttons.appendChild(tourBtn);
  [scene, look].forEach((s) => s.addEventListener("change", () => { tour = false; play(); }));
  setup();
  [field("Scene", scene), field("Small object", small), field("Big object", big), field("Count", count), field("Look", look)].forEach((f) => wrap.appendChild(f));
  const scrubber = el("div", "dbg-row");
  scrubber.style.cssText = "display:grid;grid-template-columns:minmax(0,1fr) 7ch;align-items:center;gap:8px";
  timeline.style.minWidth = "0";
  timeLabel.style.cssText = "white-space:nowrap;text-align:right;font-variant-numeric:tabular-nums";
  scrubber.append(timeline, timeLabel);
  wrap.append(buttons, note, stage, scrubber);
  return wrap;
}
