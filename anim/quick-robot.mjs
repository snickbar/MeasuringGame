// Quick Game robot: reacts to YOUR round result by standing on your Player card in the score column.
// Three tiers (win 60%+, so-so 40-59%, lose under 40%), three animations each. The pick is random but never the one
// he played last time. Each animation is one strip image (frames side by side) stepped through by CSS (quick-robot.css).
const REACTIONS = {
  win: [["win-jump", 3], ["win-confetti", 4], ["win-dance", 4]],
  soso: [["soso-shrug", 2], ["soso-scratch", 3], ["soso-meh", 2]],
  lose: [["lose-slump", 3], ["lose-spring", 3], ["lose-sink", 2]],
};
const ART = (id) => `anim/mode-mascots/quick-robot-react-${id}.webp`;

export const robotTier = (accuracy) => accuracy >= 60 ? "win" : accuracy >= 40 ? "soso" : "lose";

// Random one of the tier's three, never repeating `last` (the id he played most recently).
export function pickRobotReaction(tier, last, random = Math.random) {
  const pool = REACTIONS[tier].filter(([id]) => id !== last);
  return pool[Math.floor(random() * pool.length)];
}

// hud: the fixed game container the robot is added to (nothing in it clips, so he can overlap the question board).
// cardFor(): your own score card element (or null). reduceMotion(): true when animation should be skipped.
export function createQuickRobot({ hud, cardFor, reduceMotion = () => false }) {
  let el = null, raf = 0, shownKey = null, last = null, timer = 0;

  function build() {
    el = document.createElement("div");
    el.className = "qr-robot off";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<div class="qr-pop"><i class="qr-sprite"></i></div>';
    hud.appendChild(el);
  }

  // Keep him on the card's top edge (the card moves while the scores re-sort or the column scrolls).
  function place() {
    raf = 0;
    if (!el || shownKey === null) return;
    const card = cardFor();
    if (card && card.isConnected) {
      const board = hud.querySelector(".question-prompt");
      const c = card.getBoundingClientRect(), h = hud.getBoundingClientRect();
      const w = el.offsetWidth, ht = el.offsetHeight;
      const x = Math.round(c.left + c.width / 2 - h.left - w / 2), y = Math.round(c.top - h.top - ht + 5);
      if (el._x !== x || el._y !== y) { el.style.transform = `translate(${x}px, ${y}px)`; el._x = x; el._y = y; }
      // Scrolled up under the board: he would float over the board, so he steps out until the card comes back.
      const hidden = board && c.top < board.getBoundingClientRect().bottom - 2;
      el.classList.toggle("off", !!hidden);
    } else el.classList.add("off");
    raf = requestAnimationFrame(place);
  }

  function hide() {
    clearTimeout(timer);
    shownKey = null;
    cancelAnimationFrame(raf); raf = 0;
    if (el) { el.classList.add("off"); el.classList.remove("on"); }
  }

  // key: one value per round (the same round shown twice keeps the same animation). accuracy: your accuracy, 0-100.
  function show(key, accuracy) {
    if (shownKey === key) return;
    shownKey = key;
    if (!el) build();
    const [id, frames] = pickRobotReaction(robotTier(accuracy), last);
    last = id;
    clearTimeout(timer);
    el.classList.remove("on");
    el.classList.add("off");
    timer = setTimeout(() => {
      if (shownKey !== key) return;
      const sprite = el.querySelector(".qr-sprite");
      sprite.style.setProperty("--n", String(frames));
      sprite.style.backgroundImage = `url(${ART(id)})`;
      el.dataset.reaction = id;
      el.classList.toggle("still", !!reduceMotion());
      // Restart the pop and the frames from the first one.
      el.classList.remove("on"); void el.offsetWidth; el.classList.add("on");
      if (!raf) raf = requestAnimationFrame(place);
    }, 700); // after your paper has flipped
    if (!raf) raf = requestAnimationFrame(place);
  }

  return { show, hide, get reaction() { return el?.dataset.reaction || null; } };
}
