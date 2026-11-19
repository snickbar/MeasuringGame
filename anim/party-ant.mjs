// Classic Party ant: stands on top of the TOP score card (the leader's, not yours) for the whole round result and reacts to EVERY
// answer as its paper is revealed (worst first, winner last). Four reactions by finishing place: lose, soso, close (2nd), win.
// Temporary art: one existing ant picture per reaction + a small code wobble. When the hand-drawn sheets arrive, give a reaction
// a `frames` count and a new `src` (strip, frames side by side) and the stepper below plays it; nothing else has to change.
const ART = (f) => `anim/mode-mascots/${f}.webp`;
const POSES = {
  idle: { src: "classic-ant-flag", wobble: "idle" },
  lose: { src: "classic-ant-step-two", wobble: "wince" },
  soso: { src: "classic-ant-step-one", wobble: "sway" },
  close: { src: "party-ant-tutorial", wobble: "tilt" },
  win: { src: "party-ant-banner", wobble: "hop" },
};
const FRAME_MS = 260;

// Finishing place of the paper at `index` of `order` (order is worst first, winner last).
export function antTier(index, count) {
  if (index === count - 1) return "win";
  if (count >= 3 && index === count - 2) return "close";
  if (index < Math.max(1, Math.floor(count / 3))) return "lose";
  return "soso";
}

export function createPartyAnt({ hud, cardFor, reduceMotion = () => false }) {
  let el = null, img = null, raf = 0, standKey = null, seen = 0, stepTimer = 0, calmTimer = 0;

  function build() {
    el = document.createElement("div");
    el.className = "pa-ant";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<div class="pa-pop"><i class="pa-sprite"></i></div>';
    img = el.querySelector(".pa-sprite");
    hud.appendChild(el);
  }
  function setPose(name, frames = 1) {
    const p = POSES[name];
    img.style.setProperty("--n", String(frames));
    img.style.backgroundImage = `url(${ART(p.src)})`;
    el.dataset.reaction = name;
    img.dataset.wobble = reduceMotion() ? "none" : p.wobble;
    img.style.backgroundPosition = "0 0";
  }
  function replay(name) { // restart the wobble even when the same reaction plays twice in a row
    img.dataset.wobble = "none"; void img.offsetWidth;
    setPose(name);
  }

  // Keep him on the top edge of the top card: it moves while the scores re-sort and the column scrolls, and he goes with it.
  function place() {
    raf = 0;
    if (!el || standKey === null) return;
    const card = cardFor();
    let off = true;
    if (card && card.isConnected) {
      const board = hud.querySelector(".question-prompt");
      const c = card.getBoundingClientRect(), h = hud.getBoundingClientRect();
      const w = el.offsetWidth, ht = el.offsetHeight;
      const x = Math.round(c.left + c.width / 2 - h.left - w / 2), y = Math.round(c.top - h.top - ht + 5);
      if (el._x !== x || el._y !== y) { el.style.transform = `translate(${x}px, ${y}px)`; el._x = x; el._y = y; }
      const colBottom = card.parentElement ? card.parentElement.getBoundingClientRect().bottom : h.bottom;
      off = (board && c.top < board.getBoundingClientRect().top) || c.top > colBottom - 4;
    }
    el.classList.toggle("off", off);
    raf = requestAnimationFrame(place);
  }

  function hide() {
    clearTimeout(calmTimer); clearInterval(stepTimer);
    standKey = null; seen = 0;
    cancelAnimationFrame(raf); raf = 0;
    if (el) { el.classList.remove("on"); el.classList.add("off"); }
  }

  function stand(key) {
    if (standKey === key) return;
    hide();
    standKey = key; seen = 0;
    if (!el) build();
    setPose("idle");
    el.classList.remove("on"); void el.offsetWidth; el.classList.add("on");
    raf = requestAnimationFrame(place);
  }

  // Call on every render of the reveal: `order` worst-first, `revealIndex` = papers shown so far. Reacts to the newest one.
  function sync(key, order, revealIndex) {
    stand(key);
    if (revealIndex <= seen) return;
    const index = revealIndex - 1; // the paper that was just revealed
    seen = revealIndex;
    const name = antTier(index, order.length);
    clearTimeout(calmTimer);
    calmTimer = setTimeout(() => {
      if (standKey !== key) return;
      replay(name);
      // after a reaction he goes back to waiting, except the winner's celebration, which he keeps through the summary
      if (name !== "win") calmTimer = setTimeout(() => { if (standKey === key) replay("idle"); }, 1500);
    }, 650); // once the paper has finished flipping
  }

  return { stand, sync, hide, get reaction() { return el?.dataset.reaction || null; } };
}
