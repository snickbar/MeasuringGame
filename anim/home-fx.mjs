// Builds the drifting-particle layer behind the Home buttons. The scene id comes from the page's top script (data-home-scene),
// so every Home picture gets its own mood. Pure decoration: pointer-events are off and Animation: Reduced hides it.
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const WARM = ["#ffb3c7", "#ffd27a", "#fff1b8"], LEAF = ["#9bd36a", "#c8e07a", "#e8b04a"], PARTY = ["#ff6b6b", "#ffd24a", "#5ec8ff", "#8be26a", "#c58bff"];
// kind: particle type, n: how many, extra: per-particle style tweaks
const SCENES = {
  ants: [["mote", 14], ["petal", 4, { colors: LEAF }]],
  sunflower: [["mote", 16], ["petal", 4, { colors: WARM }]],
  games: [["sparkle", 14], ["bubble", 4]],
  house: [["mote", 16, { dr: 14 }], ["sparkle", 6]],
  snacks: [["petal", 6, { colors: LEAF }], ["mote", 8]],
  town: [["sparkle", 12], ["mote", 6]],
  corgi: [["petal", 7, { colors: LEAF }], ["mote", 6]],
  wheels: [["ember", 14], ["sparkle", 6]],
  lighthouse: [["sparkle", 14], ["bubble", 3]],
  underwater: [["bubble", 20]],
  "toy-box": [["confetti", 14, { colors: PARTY }], ["sparkle", 6]],
  penguin: [["snow", 26], ["sparkle", 6]],
  cactus: [["mote", 16, { dr: 90, colors: null }], ["petal", 0]],
  giraffe: [["mote", 14], ["petal", 4, { colors: LEAF }]],
  dragon: [["ember", 16], ["sparkle", 10]],
  space: [["star", 26], ["shoot", 1]],
};
function make(kind, opts = {}) {
  const el = document.createElement("i");
  el.className = "hf hf-" + kind;
  const rising = ["mote", "ember", "bubble"].includes(kind), falling = ["snow", "petal", "confetti"].includes(kind);
  el.style.setProperty("--x", rnd(2, 98).toFixed(1) + "%");
  if (kind === "star" || kind === "sparkle" || kind === "shoot") el.style.setProperty("--y", rnd(4, kind === "shoot" ? 30 : 78).toFixed(1) + "%");
  const size = kind === "bubble" ? rnd(6, 20) : kind === "snow" ? rnd(3, 7) : kind === "ember" ? rnd(4, 9) : kind === "star" ? rnd(3, 8) : kind === "sparkle" ? rnd(5, 11) : kind === "petal" ? rnd(6, 10) : kind === "confetti" ? rnd(5, 9) : rnd(4, 9);
  el.style.setProperty("--s", size.toFixed(1) + "px");
  const dur = rising ? rnd(9, 17) : falling ? rnd(8, 15) : kind === "shoot" ? 11 : rnd(2.2, 5);
  el.style.setProperty("--d", dur.toFixed(1) + "s");
  el.style.setProperty("--dl", (-rnd(0, dur)).toFixed(1) + "s");
  if (kind === "shoot") el.style.setProperty("--dl", (-rnd(0, 6)).toFixed(1) + "s");
  const drift = (opts.dr || 26) * (Math.random() < .5 ? -1 : 1) * rnd(.4, 1);
  el.style.setProperty("--dr", drift.toFixed(0) + "px");
  if (rising) el.style.setProperty("--o", rnd(.45, .9).toFixed(2));
  if (opts.colors) el.style.setProperty("--c", pick(opts.colors));
  return el;
}
export function installHomeFx() {
  const home = document.getElementById("home-screen");
  if (!home || document.getElementById("home-fx")) return;
  const scene = document.documentElement.dataset.homeScene || "ants";
  const layer = document.createElement("div");
  layer.id = "home-fx";
  layer.setAttribute("aria-hidden", "true");
  const small = Math.min(window.innerWidth, window.innerHeight) < 420;
  for (const [kind, n, opts] of SCENES[scene] || SCENES.ants) {
    const count = Math.max(0, Math.round(n * (small ? .8 : 1.3)));
    for (let i = 0; i < count; i++) layer.appendChild(make(kind, opts));
  }
  home.prepend(layer);
}
installHomeFx();
