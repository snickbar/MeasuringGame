import { configureMascot } from './mascot-poses.mjs';
// Party and team mascots follow the top score card and react to each revealed paper.
// The shared pose controller handles the hand-drawn idle and outcome loops.
const POSE_SETS={ant:true,cats:true,dogs:true};

// Finishing place of the paper at `index` of `order` (order is worst first, winner last).
export function antTier(index, count) {
  if (index === count - 1) return "win";
  if (count >= 3 && index === count - 2) return "close";
  if (index < Math.max(1, Math.floor(count / 3))) return "lose";
  return "soso";
}

export function createPartyAnt({ hud, cardFor, reduceMotion = () => false }) {
  let el = null, img = null, raf = 0, standKey = null, seen = 0, stepTimer = 0, calmTimer = 0, held = false, setName = "ant";

  function build() {
    el = document.createElement("div");
    el.className = "pa-ant";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<div class="pa-pop"><i class="pa-sprite"></i></div>';
    img = el.querySelector(".pa-sprite");
    hud.appendChild(el);
  }
  function setPose(name) {
    const mood = name === 'win' || name === 'close' ? 'win' : name === 'lose' ? 'lose' : name === 'soso' ? 'soso' : 'idle';
    img.dataset.wobble='none';
    configureMascot(img,setName,mood,{key:standKey+':'+seen,still:reduceMotion()});
    el.dataset.reaction=name;el.dataset.set=setName;
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
      off = held || (board && c.top < board.getBoundingClientRect().top) || c.top > colBottom - 4;
    }
    el.classList.toggle("off", off);
    raf = requestAnimationFrame(place);
  }

  function hide() {
    clearTimeout(calmTimer); clearInterval(stepTimer);
    standKey = null; seen = 0;
    cancelAnimationFrame(raf); raf = 0;
    held = false;
    if (el) { el.classList.remove("on"); el.classList.add("off"); }
  }

  // Which mascot stands this round: "ant", "cats" or "dogs". Takes effect the next time he stands (a new round).
  function use(name) { if (POSE_SETS[name]) setName = name; }

  function stand(key, hold = false) {
    if (standKey === key) return;
    hide();
    standKey = key; seen = 0;
    if (!el) build();
    setPose("idle");
    el.classList.remove("on");
    held = !!hold;
    if (!held) { void el.offsetWidth; el.classList.add("on"); } // he slides in from the right once, when he first appears
    raf = requestAnimationFrame(place);
  }

  // Hide him in place (he keeps his spot, and does NOT slide in again when he comes back) while a full-screen scene covers the board.
  function setHeld(on) {
    held = !!on;
    if (!held && el && standKey !== null && !el.classList.contains("on")) { void el.offsetWidth; el.classList.add("on"); } // first time he shows: slide in
  }

  // Call on every render of the reveal: `order` worst-first, `revealIndex` = papers completely revealed so far (flair included). Reacts to the newest one.
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
      // Keep this answer’s chosen reaction looping until the next answer is revealed.
    }, 300); // `revealIndex` only counts papers that are completely revealed, flair included; a short beat, then he reacts
  }

  return { stand, sync, hide, use, hold: setHeld, get reaction() { return el?.dataset.reaction || null; } };
}
