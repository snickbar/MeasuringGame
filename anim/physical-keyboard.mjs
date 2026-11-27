// Typing on a real keyboard (laptop / desktop browsers). The game's keypads are on-screen buttons, so a physical key simply presses the matching
// on-screen key, the same way a finger would: digits, the decimal point and Backspace on the number pads, letters and digits on the name / code
// keyboards, and Enter for Lock it in / Save name. Nothing here knows how a mode works; a key is used only when it is on screen, enabled and not
// covered by a popup, so keys never reach a pad you cannot see.
// The number pads fire on pointerdown (that is where the tap sound, the buzz and the glow come from), so a physical digit sends the same pointerdown.

// Every mode's submit button (Lock it in, send the High Stakes fake answer). The first one that is on screen and enabled is used.
const SUBMIT = ["#submit-guess-btn", "#dc-submit", "#wl-submit", "#mo-submit", "#sv-submit", "#wb-lock", "#hs-fake-send"];
// "Save name" style buttons that close a text keyboard (the name screen, Settings): used for Enter when that keyboard has no Done key of its own.
const SAVE = ["#name-edit-btn", "#settings-name-edit"];

// On screen, big enough to tap, and nothing (a popup, another screen) on top of its middle.
export function usable(el) {
  if (!el || el.disabled) return false;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return false;
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return false;
  const top = document.elementFromPoint(x, y);
  return !!top && (top === el || el.contains(top));
}
const firstUsable = (selector, root = document) => [...root.querySelectorAll(selector)].find(usable);

// "5" -> the 5 key of whichever number pad is showing; "back" -> its backspace key.
function numberKey(k) {
  const selector = k === "back" ? '.dc-key[data-k="back"], #backspace-btn' : `.dc-key[data-k="${k}"], .num-btn[data-val="${k}"]`;
  return firstUsable(selector);
}
function press(el) {
  el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, composed: true, button: 0, pointerType: "mouse", isPrimary: true }));
}

// Name / join-code / promo-code keyboards (renderCustomKeyboard): the keys that are showing, letters and digits, Backspace, Done.
function textKeyboard() {
  return [...document.querySelectorAll(".custom-kbd")].find((kb) => !kb.hidden && firstUsable(".kbd-key", kb));
}

function editableTarget(t) {
  if (!t || t.nodeType !== 1) return false;
  if (t.isContentEditable || t.tagName === "TEXTAREA" || t.tagName === "SELECT") return true;
  return t.tagName === "INPUT" && !t.readOnly && !["button", "checkbox", "radio", "range", "submit", "reset"].includes(t.type);
}

// Returns true when the key was used.
export function handleKey(e) {
  if (e.defaultPrevented || e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return false;
  if (editableTarget(e.target)) return false;
  const key = e.key;
  let k = null;
  if (/^[0-9]$/.test(key)) k = key; else if (key === "." || key === ",") k = "."; else if (key === "Backspace" || key === "Delete") k = "back";
  const enter = key === "Enter";
  // Enter on a button other than a key or Lock it in is that button's own business (it clicks it).
  if (enter && e.target?.closest?.("button, a, [role=button], summary") && !e.target.closest(".dc-key, .num-btn, #backspace-btn, .kbd-key, " + SUBMIT.join(","))) return false;

  // 1) the number pads
  if (k !== null) {
    const el = numberKey(k);
    if (el) { if (e.repeat && k !== "back") return true; press(el); return true; }
  }
  if (enter && !e.repeat && !textKeyboard()) {
    const lock = SUBMIT.map((s) => firstUsable(s)).find(Boolean);
    if (lock) { lock.click(); return true; }
  }

  // 2) the text keyboards
  const kb = textKeyboard();
  if (!kb) return false;
  let btn = null;
  if (key === "Backspace") btn = firstUsable('[data-action="backspace"]', kb);
  else if (/^[a-z0-9]$/i.test(key)) btn = firstUsable(`.kbd-key[data-key="${key.toUpperCase()}"]`, kb);
  else if (enter && !e.repeat) btn = firstUsable('[data-action="done"]', kb) || SAVE.map((s) => firstUsable(s)).find((b) => b && /^save/i.test(b.textContent.trim()));
  if (!btn) return false;
  btn.click();
  return true;
}

export function installPhysicalKeyboard() {
  document.addEventListener("keydown", (e) => { if (handleKey(e)) e.preventDefault(); });
  // A key you clicked with the mouse keeps focus, and Space would press it again: keys only react to the typed keys above.
  const spaceOnKey = (e) => { if (e.key === " " && e.target?.closest?.(".dc-key, .num-btn, #backspace-btn, .kbd-key")) e.preventDefault(); };
  document.addEventListener("keydown", spaceOnKey); document.addEventListener("keyup", spaceOnKey);
}
