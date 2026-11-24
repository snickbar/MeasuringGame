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

// What the ant says about the round on the summary, from the reveal order (worst first, winner last).
const pick = (list, random) => list[Math.floor(random() * list.length)];
export function antSaying(order, nameOf = () => "", random = Math.random) {
  const n = order.length;
  if (!n) return "";
  const best = order[n - 1], acc = Number(best.accuracyPercent);
  if (!Number.isFinite(acc)) return "";
  const second = n > 1 ? Number(order[n - 2].accuracyPercent) : NaN;
  const name = nameOf(best.playerId) || "Someone";
  if (n > 1 && Number.isFinite(second) && second === acc) return pick(["A tie! Split the crumbs.", "Dead even! Ant-ticlimactic.", "Two winners. Share the sugar!"], random);
  if (acc >= 95) return pick([`Bullseye, ${name}! Ant-credible.`, `${name} nailed it! Antastic.`, `Wow, ${name}! Spot on.`], random);
  if (acc < 40) return pick(["Nobody close. Even my antennae know better.", "Whoa, far off! Back to the anthill.", "Not one near it. Keep trying!"], random);
  if (n > 1 && Number.isFinite(second) && acc - second < 5) return pick(["Tiny gap! This colony is sharp.", "So close, you two! Antsy finish."], random);
  return pick([`${name} wins the round!`, `Nice one, ${name}! Ant-tastic.`, `${name} takes the crumb!`], random);
}
// The cats and dogs are the game's mascots, not a team: they comment on the whole round. totals: {teamColor: points this round} for every team.
export function teamSaying(set, totals, random = Math.random) {
  const teams = Object.keys(totals).filter((t) => Number.isFinite(totals[t]));
  if (!teams.length) return "";
  const cats = set === "cats", top = Math.max(...teams.map((t) => totals[t])), leaders = teams.filter((t) => totals[t] === top);
  if (top <= 0) return pick(cats ? ["Not one point? Meow-ch.", "Nobody scored. Next round!"] : ["No points! Ruff round.", "Nobody scored. Fetch some next time!"], random);
  if (leaders.length > 1) return pick(cats ? ["A tie! Meow-vellous.", "Dead even. Cat nap?"] : ["A tie! Bone-afide.", "Dead even! Fetch a rematch."], random);
  const w = leaders[0][0].toUpperCase() + leaders[0].slice(1) + " team";
  return pick(cats ? [`${w} takes it! Purr-fect.`, `Nice round, ${w}!`] : [`Woof! ${w} wins the round!`, `Good job, ${w}!`], random);
}

export function createPartyAnt({ hud, cardFor, reduceMotion = () => false }) {
  let el = null, img = null, sayEl = null, sayKey = null, raf = 0, standKey = null, seen = 0, stepTimer = 0, calmTimer = 0, held = false, setName = "ant";

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
      if (sayEl && board) { const room = el.getBoundingClientRect().right - 2 - board.getBoundingClientRect().right - 8; sayEl.style.maxWidth = Math.round(Math.max(84, Math.min(140, room))) + "px"; }
      const colBottom = card.parentElement ? card.parentElement.getBoundingClientRect().bottom : h.bottom;
      off = held || (board && c.top < board.getBoundingClientRect().top) || c.top > colBottom - 4;
    }
    el.classList.toggle("off", off);
    raf = requestAnimationFrame(place);
  }

  // A speech bubble above the mascot, once per key (say(null) removes it). Styled like the Quick robot's.
  function say(key, text = "") {
    if (key === null || !text) { if (sayEl) { sayEl.remove(); sayEl = null; } sayKey = null; return; }
    if (!el || sayKey === key) return;
    sayKey = key;
    if (sayEl) sayEl.remove();
    sayEl = document.createElement("div");
    sayEl.className = "qr-say";
    sayEl.textContent = text;
    el.appendChild(sayEl);
  }

  function hide() {
    say(null);
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

  return { stand, sync, hide, use, say, hold: setHeld, get reaction() { return el?.dataset.reaction || null; } };
}
