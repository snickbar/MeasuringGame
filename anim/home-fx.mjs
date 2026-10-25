// Builds the drifting-particle layer behind the Home buttons. The scene id comes from the page's top script (data-home-scene),
// so every Home picture gets its own mood. Pure decoration: pointer-events are off and Animation: Reduced hides it.
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const WARM = ["#ffb3c7", "#ffd27a", "#fff1b8"], LEAF = ["#9bd36a", "#c8e07a", "#e8b04a"], PARTY = ["#ff6b6b", "#ffd24a", "#5ec8ff", "#8be26a", "#c58bff"];
// kind: particle type, n: how many, extra: per-particle style tweaks
const PINK = ["#ff9ec0", "#ffc2d9", "#d9a8ff", "#ffe08a"], GOLD = ["#ffd24a", "#ffb23e", "#ffe9a0"], AUTUMN = ["#e8863a", "#d9532f", "#e8b04a", "#9bd36a"], FROST = ["#ffffff", "#d8f0ff"];
const SCENES = {
  'make-believe': [['sparkle',14,{ colors: PINK }],['petal',8,{ colors: PINK }],['mote',6]],
  'holiday-mix': [['snow',26],['sparkle',8],['confetti',6,{ colors: ["#ff6b6b", "#5ec8ff", "#8be26a", "#ffd24a"] }]],
  ants: [["mote", 12], ["petal", 9, { colors: LEAF }]],
  sunflower: [["mote", 12], ["petal", 9, { colors: GOLD }]],
  games: [["sparkle", 16], ["bubble", 8], ["confetti", 5, { colors: PARTY }]],
  house: [["mote", 12, { dr: 14 }], ["sparkle", 8], ["petal", 5, { colors: AUTUMN }]],
  snacks: [["petal", 10, { colors: LEAF }], ["mote", 8], ["sparkle", 4]],
  town: [["sparkle", 14], ["petal", 6, { colors: AUTUMN }], ["mote", 6]],
  corgi: [["petal", 11, { colors: AUTUMN }], ["mote", 6]],
  wheels: [["ember", 16], ["sparkle", 6], ["mote", 6, { dr: 60 }]],
  lighthouse: [["sparkle", 14], ["bubble", 8], ["snow", 6, { colors: FROST }]],
  underwater: [["bubble", 26], ["sparkle", 6]],
  "toy-box": [["confetti", 18, { colors: PARTY }], ["sparkle", 8], ["bubble", 4]],
  penguin: [["snow", 32], ["sparkle", 6]],
  cactus: [["mote", 14, { dr: 90 }], ["petal", 4, { colors: PINK }], ["sparkle", 4]],
  giraffe: [["petal", 10, { colors: LEAF }], ["mote", 10]],
  dragon: [["ember", 18], ["sparkle", 10], ["mote", 4]],
  space: [["star", 30], ["sparkle", 6], ["shoot", 1]],
};
function make(kind, opts = {}) {
  const el = document.createElement("i");
  el.className = "hf hf-" + kind;
  const rising = ["mote", "ember", "bubble"].includes(kind), falling = ["snow", "petal", "confetti"].includes(kind);
  el.style.setProperty("--x", rnd(2, 98).toFixed(1) + "%");
  if (kind === "star" || kind === "sparkle" || kind === "shoot") el.style.setProperty("--y", rnd(4, kind === "shoot" ? 30 : 78).toFixed(1) + "%");
  const size = kind === "bubble" ? rnd(12, 36) : kind === "snow" ? rnd(5, 11) : kind === "ember" ? rnd(7, 14) : kind === "star" ? rnd(5, 12) : kind === "sparkle" ? rnd(10, 20) : kind === "petal" ? rnd(11, 18) : kind === "confetti" ? rnd(8, 13) : rnd(7, 13);
  el.style.setProperty("--s", size.toFixed(1) + "px");
  const dur = rising ? rnd(9, 17) : falling ? rnd(8, 15) : kind === "shoot" ? 11 : rnd(2.2, 5);
  el.style.setProperty("--d", dur.toFixed(1) + "s");
  el.style.setProperty("--dl", (-rnd(0, dur)).toFixed(1) + "s");
  if (kind === "shoot") el.style.setProperty("--dl", (-rnd(0, 6)).toFixed(1) + "s");
  const drift = (opts.dr || 26) * (Math.random() < .5 ? -1 : 1) * rnd(.4, 1);
  el.style.setProperty("--dr", drift.toFixed(0) + "px");
  // Every particle gets its own see-through level, so the layer reads soft rather than busy.
  el.style.setProperty("--o", (kind === "shoot" ? 1 : rnd(.35, .85)).toFixed(2));
  if (opts.colors) el.style.setProperty("--c", pick(opts.colors));
  return el;
}
export function installHomeFx() {
  const home = document.getElementById("home-screen");
  if (!home) return;
  const scene = document.documentElement.dataset.homeScene || "ants";
  const previous = document.getElementById("home-fx");
  if (previous?.dataset.scene === scene) return;
  previous?.remove();
  const layer = document.createElement("div");
  layer.id = "home-fx";
  layer.dataset.scene = scene;
  layer.setAttribute("aria-hidden", "true");
  const small = Math.min(window.innerWidth, window.innerHeight) < 420;
  for (const [kind, n, opts] of SCENES[scene] || SCENES.ants) {
    const count = Math.max(0, Math.round(n * (small ? .6 : .95)));
    for (let i = 0; i < count; i++) layer.appendChild(make(kind, opts));
  }
  home.prepend(layer);
  // Shine sweep over the title letters: a copy of the title's shape (as a mask) with a light band sliding across it.
  const title = document.getElementById("home-title-img");
  if (title && !document.getElementById("home-title-shine")) {
    const shine = document.createElement("div");
    shine.id = "home-title-shine"; shine.setAttribute("aria-hidden", "true");
    shine.style.setProperty("--tm", `url("${title.src}")`);
    const fit = () => { if (title.naturalWidth) shine.style.setProperty("--ta", String(title.naturalWidth / title.naturalHeight)); };
    fit(); title.addEventListener("load", fit);
    title.after(shine);
  }
}
installHomeFx();
document.getElementById("home-screen")?.addEventListener("home-scene-ready", installHomeFx);
