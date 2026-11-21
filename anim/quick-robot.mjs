// Quick Game robot: stands on YOUR Player card in the score column for the whole round result.
//  - He slides in from the right and waits in a happy standing pose with a tiny sway while the papers are revealed (stand()).
//  - When YOUR paper is revealed he plays his reaction to YOUR accuracy on a loop (react()).
// Three tiers (win 60%+, so-so 40-59%, lose under 40%), three animations each. The pick is random but never the one he
// played last time. Each animation is one strip image (frames side by side); the frames are stepped from here (not by an
// endless CSS animation) and the sheet is shown through quick-robot.css.
const REACTIONS = {
  win: [["win-jump", 3], ["win-confetti", 4], ["win-dance", 4]],
  soso: [["soso-shrug", 2], ["soso-scratch", 3], ["soso-meh", 2]],
  lose: [["lose-slump", 3], ["lose-spring", 3], ["lose-sink", 2]],
};
const IDLE = ["idle", 1]; // him standing with a small smile, fists on his hips (the still pose, used for reduced motion)
// While he waits he plays a little story of hand-drawn poses from one 12-pose sheet (quick-robot-idle-sheet.webp), then starts over.
// [pose, how long it is held in ms]. Poses: 0 rest, 1 glance left, 2 glance right, 3 blink, 4 whistle lift, 5 whistle polish, 6 antenna left,
// 7 antenna right, 8 arms left + foot tap, 9 arms right + foot tap, 10 small hop, 11 watches the papers.
export const IDLE_STORY = [
  [0, 1800], [3, 160], [0, 1100], [1, 750], [0, 250], [2, 750], [0, 1300], [3, 160], [0, 700],
  [6, 420], [7, 420], [6, 420], [7, 420], [0, 1400],
  [4, 900], [5, 1100], [4, 500], [0, 1500],
  [11, 1700], [0, 900],
  [8, 330], [9, 330], [8, 330], [9, 330], [0, 1100],
  [10, 520], [0, 1600],
];
const IDLE_SHEET = ["idle-sheet", 12];
const FRAME_MS = 260;
const ART = (id) => id === "idle-sheet" ? "anim/mode-mascots/quick-robot-idle-sheet.webp" : `anim/mode-mascots/quick-robot-react-${id}.webp`;

export const robotTier = (accuracy) => accuracy >= 60 ? "win" : accuracy >= 40 ? "soso" : "lose";

// Random one of the tier's three, never repeating `last` (the id he played most recently).
export function pickRobotReaction(tier, last, random = Math.random) {
  const pool = REACTIONS[tier].filter(([id]) => id !== last);
  return pool[Math.floor(random() * pool.length)];
}

// hud: the fixed game container the robot is added to (nothing in it clips, so he can overlap the question board).
// cardFor(): your own score card element (or null). reduceMotion(): true when animation should be skipped.
export function createQuickRobot({ hud, cardFor, reduceMotion = () => false }) {
  let el = null, sprite = null, raf = 0, standKey = null, reactKey = null, last = null, stepTimer = 0, idleTimer = 0, reactTimer = 0, held = false;

  function build() {
    el = document.createElement("div");
    el.className = "qr-robot";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<div class="qr-pop"><i class="qr-sprite"></i></div>';
    sprite = el.querySelector(".qr-sprite");
    hud.appendChild(el);
  }

  function setFrame(i, frames) { sprite.style.backgroundPosition = frames > 1 ? `${(i / (frames - 1)) * 100}% 0` : "0 0"; }
  function setStrip(id, frames) {
    sprite.style.setProperty("--n", String(frames));
    sprite.style.backgroundImage = `url(${ART(id)})`;
    el.dataset.reaction = id;
    setFrame(0, frames);
  }
  function stopFrames() { clearInterval(stepTimer); clearTimeout(idleTimer); stepTimer = idleTimer = 0; }
  // the waiting story: step through IDLE_STORY until his reaction starts (or he is hidden)
  function playIdle(key) {
    let i = 0;
    const next = () => {
      if (standKey !== key || reactKey === key) return;
      const [pose, ms] = IDLE_STORY[i % IDLE_STORY.length];
      setFrame(pose, IDLE_SHEET[1]);
      i++;
      idleTimer = setTimeout(next, ms);
    };
    idleTimer = setTimeout(next, 1300); // after he has slid in
  }

  // Keep him on the card's top edge: the card moves while the scores re-sort and while the column scrolls, and he scrolls with it.
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
      // He only steps out once his feet are above the question board (he would be up in the header) or below the score column.
      const colBottom = card.parentElement ? card.parentElement.getBoundingClientRect().bottom : h.bottom;
      off = held || (board && c.top < board.getBoundingClientRect().top) || c.top > colBottom - 4;
    }
    el.classList.toggle("off", off);
    raf = requestAnimationFrame(place);
  }

  function hide() {
    clearTimeout(reactTimer); stopFrames();
    standKey = reactKey = null; held = false;
    cancelAnimationFrame(raf); raf = 0;
    if (el) { el.classList.remove("on", "reacting"); el.classList.add("off"); }
  }

  // Waiting pose for the whole reveal. key: one value per round.
  function stand(key, hold = false) {
    if (standKey === key) return;
    hide();
    standKey = key;
    if (!el) build();
    if (reduceMotion()) setStrip(IDLE[0], IDLE[1]); else { setStrip(IDLE_SHEET[0], IDLE_SHEET[1]); setFrame(0, IDLE_SHEET[1]); playIdle(key); }
    el.classList.remove("reacting", "on");
    held = !!hold;
    if (!held) { void el.offsetWidth; el.classList.add("on"); } // he slides in from the right once, when he first appears
    el.classList.toggle("still", !!reduceMotion());
    raf = requestAnimationFrame(place);
  }

  // Hide him in place (he keeps his spot, and does NOT slide in again when he comes back) while a full-screen scene covers the board.
  function setHeld(on) {
    held = !!on;
    if (!held && el && standKey !== null && !el.classList.contains("on")) { void el.offsetWidth; el.classList.add("on"); }
  }

  // Your paper is revealed: play the reaction to your accuracy (0-100), looping. Does nothing twice for the same round.
  function react(key, accuracy) {
    if (standKey !== key) stand(key);
    if (reactKey === key) return;
    reactKey = key;
    clearTimeout(reactTimer);
    reactTimer = setTimeout(() => { // once your paper has finished flipping
      if (reactKey !== key) return;
      const [id, frames] = pickRobotReaction(robotTier(accuracy), last);
      last = id;
      stopFrames();
      setStrip(id, frames);
      el.classList.add("reacting");
      if (reduceMotion()) { setFrame(frames - 1, frames); return; } // reduced motion: hold the last pose
      let i = 0;
      stepTimer = setInterval(() => { i = (i + 1) % frames; setFrame(i, frames); }, FRAME_MS);
    }, 300); // `accuracy` is only passed once your paper is completely revealed (flair included)
  }

  return { stand, react, hide, hold: setHeld, get reaction() { return el?.dataset.reaction || null; }, get reacting() { return !!el && el.classList.contains("reacting"); } };
}
