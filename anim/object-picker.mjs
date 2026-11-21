// Object picker (Settings > Debug / Admin tools): set how every object stands and how it enters the reveal.
// It lists ALL objects from the game, so a new object shows up here as soon as it is live (ones with no saved
// orientation are marked "new"). Choices are drafts kept on this device; "Copy choices" exports them and
// scripts/apply-picker-drafts.mjs bakes them into anim/orient-data.js and the MOTION table.
// Previews play the real reveal engine with the draft passed in (orientationFor / motionFor), nothing global changes.
import { ORIENT } from "./orient-data.js";
import { ENTRY_KINDS, entryKindFor } from "./entry-styles.mjs";

const KEY = "object-picker-drafts-v1";
const DEFAULT = { rot: 0, flip: false, leanL: "ccw", leanR: "cw", mirR: false };
const ROTS = [0, 90, 180, 270];
const LEANS = [["ccw", "Turns counter-clockwise"], ["cw", "Turns clockwise"], ["none", "Stays as it is"]];

export function buildObjectPicker({ loadAnim, objects }) {
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const wrap = el("div", "dbg-body object-picker");
  const sorted = objects.slice().sort((a, b) => a.name.localeCompare(b.name));
  const byId = new Map(objects.map((o) => [o.id, o]));
  let drafts = {};
  try { drafts = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { drafts = {}; }
  const saveDrafts = () => { try { localStorage.setItem(KEY, JSON.stringify(drafts)); } catch (e) { /* storage unavailable */ } };

  const savedOrient = (id) => ORIENT[id] || null;
  const orientNow = (id) => ({ ...DEFAULT, ...(savedOrient(id) || {}), ...((drafts[id] || {}).orient || {}) });
  let savedEntrance = () => null;
  const motionNow = (id) => { const d = (drafts[id] || {}).motion; return d || savedEntrance(id) || "auto"; };
  const isChanged = (id) => !!drafts[id];
  const isNew = (id) => !savedOrient(id);

  let cur = sorted[0] && sorted[0].id, filter = "all", query = "";
  const last = (() => { try { return localStorage.getItem(KEY + "-last"); } catch (e) { return null; } })();
  if (last && byId.has(last)) cur = last;

  const select = el("select", "dbg-input"); select.style.width = "100%"; select.setAttribute("aria-label", "Object");
  const search = el("input", "dbg-input"); search.type = "search"; search.placeholder = "Search objects"; search.style.width = "100%"; search.setAttribute("aria-label", "Search objects");
  const filterSel = el("select", "dbg-input"); filterSel.style.width = "100%"; filterSel.setAttribute("aria-label", "Show");
  const summary = el("p", "dbg-note");
  const status = el("p", "dbg-note");
  const row = (...kids) => { const r = el("div", "dbg-row"); kids.forEach((k) => r.appendChild(k)); return r; };
  const btn = (label, fn) => { const b = el("button", "dbg-btn", label); b.type = "button"; b.addEventListener("click", fn); return b; };
  const field = (label, control) => { const r = el("label", "dbg-row"); r.appendChild(el("span", "dbg-label", label)); r.appendChild(control); return r; };

  function visibleObjects() {
    const q = query.trim().toLowerCase();
    return sorted.filter((o) => {
      if (filter === "new" && !isNew(o.id)) return false;
      if (filter === "changed" && !isChanged(o.id)) return false;
      return !q || o.name.toLowerCase().includes(q) || o.id.includes(q);
    });
  }
  function fillSelect() {
    const list = visibleObjects(); select.textContent = "";
    list.forEach((o) => { const op = el("option", "", (isChanged(o.id) ? "● " : isNew(o.id) ? "NEW " : "") + o.name); op.value = o.id; select.appendChild(op); });
    if (!list.some((o) => o.id === cur)) cur = list[0] ? list[0].id : null;
    if (cur) select.value = cur;
    const nNew = objects.filter((o) => isNew(o.id)).length, nChg = Object.keys(drafts).length;
    [...filterSel.options].forEach((o) => { o.textContent = ({ all: `All objects (${objects.length})`, new: `New, never set (${nNew})`, changed: `My changes (${nChg})` })[o.value]; });
    summary.textContent = `${list.length} shown · ${nChg} changed · ${nNew} new`;
  }
  ["all", "new", "changed"].forEach((v) => { const o = el("option", "", v); o.value = v; filterSel.appendChild(o); });

  // ---- preview and controls ----
  const thumbBox = el("div"); thumbBox.style.cssText = "display:flex;gap:10px;align-items:flex-end;justify-content:center;background:#fff8ec;border-radius:10px;padding:10px;min-height:120px";
  const thumbBefore = el("img"), thumbAfter = el("img");
  [thumbBefore, thumbAfter].forEach((i) => { i.style.cssText = "max-width:42%;max-height:140px;object-fit:contain"; i.alt = ""; i.draggable = false; });
  const cap = (img, text) => { const f = el("div"); f.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;min-width:0"; f.append(img, el("span", "dbg-note", text)); return f; };
  thumbBox.append(cap(thumbBefore, "As drawn (art file)"), cap(thumbAfter, "As it stands in the game"));

  const rotRow = el("div", "dbg-row"), rotBtns = ROTS.map((r) => { const b = btn(r + "°", () => set((s) => { s.rot = r; })); rotRow.appendChild(b); return [r, b]; });
  const flipBtn = btn("Flip", () => set((s) => { s.flip = !s.flip; }));
  const mirBtn = btn("Mirror when on the right", () => set((s) => { s.mirR = !s.mirR; }));
  const leanL = el("select", "dbg-input"), leanR = el("select", "dbg-input");
  [leanL, leanR].forEach((s) => { s.style.width = "100%"; LEANS.forEach(([v, t]) => { const o = el("option", "", t); o.value = v; s.appendChild(o); }); });
  leanL.setAttribute("aria-label", "Small object lean"); leanR.setAttribute("aria-label", "Big object lean");
  leanL.addEventListener("change", () => set((s) => { s.leanL = leanL.value; })); leanR.addEventListener("change", () => set((s) => { s.leanR = leanR.value; }));
  const leanNote = el("p", "dbg-note"); leanNote.style.color = "#a04000";
  const entry = el("select", "dbg-input"); entry.style.width = "100%"; entry.setAttribute("aria-label", "How it enters");
  entry.addEventListener("change", () => setMotion(entry.value));

  function fillEntrySelects() {
    const o = byId.get(cur); if (!o) return;
    const auto = entryKindFor(o, "slide", false);
    entry.textContent = "";
    const a = el("option", "", `Auto (${auto})`); a.value = "auto"; entry.appendChild(a);
    ENTRY_KINDS.forEach((k) => { const op = el("option", "", k === "slide" ? "slide (always, never auto)" : k); op.value = k === "slide" ? "only-slide" : k; entry.appendChild(op); });
  }
  function set(fn) {
    if (!cur) return;
    const s = orientNow(cur); fn(s);
    const same = savedOrient(cur) && Object.keys(DEFAULT).every((k) => s[k] === ({ ...DEFAULT, ...savedOrient(cur) })[k]);
    const d = drafts[cur] || {};
    if (same) delete d.orient; else d.orient = s;
    commit(d); render();
  }
  function setMotion(v) {
    const d = drafts[cur] || {};
    if (v === (savedEntrance(cur) || "auto")) delete d.motion; else d.motion = v;
    commit(d); render();
  }
  // Every change replays the reveal after a short pause, so you see the result without pressing Watch.
  let replayTimer = 0, replayOnGo = false;
  const replaySoon = () => { clearTimeout(replayTimer); replayTimer = setTimeout(() => { if (wrap.isConnected) test(); }, 350); };
  function commit(d) { if (Object.keys(d).length) drafts[cur] = d; else delete drafts[cur]; saveDrafts(); replaySoon(); }

  function render() {
    const o = byId.get(cur); if (!o) return;
    const s = orientNow(cur), m = motionNow(cur);
    thumbBefore.src = o.image; thumbAfter.src = o.image;
    thumbAfter.style.transform = `${s.flip ? "scaleX(-1) " : ""}rotate(${s.rot}deg)`;
    rotBtns.forEach(([r, b]) => b.classList.toggle("dbg-on", s.rot === r));
    flipBtn.classList.toggle("dbg-on", !!s.flip); mirBtn.classList.toggle("dbg-on", !!s.mirR);
    leanL.value = s.leanL; leanR.value = s.leanR; entry.value = m;
    const lying = (side) => side === "cw" || side === "ccw", swap = { roll: "scoot", tumble: "skid" }[m];
    leanNote.textContent = swap && (lying(s.leanL) || lying(s.leanR)) ? `${m} can't be used while it swings up to stand, so it plays as ${swap}. Set "swings up" to "Stays as it is" on the side you want to see it.` : "";
    status.textContent = isChanged(cur) ? "You changed this one (kept on this device until you copy and send it)." : isNew(cur) ? "New: nothing saved for this object yet, so it uses the default pose." : "Matches what is saved in the game.";
    const label = select.querySelector(`option[value="${CSS.escape(cur)}"]`);
    if (label) label.textContent = (isChanged(cur) ? "● " : isNew(cur) ? "NEW " : "") + o.name;
    const nChg = Object.keys(drafts).length;
    summary.textContent = summary.textContent.replace(/· \d+ changed/, `· ${nChg} changed`);
  }
  function go(id) { const changed = id !== cur; cur = id; try { localStorage.setItem(KEY + "-last", id); } catch (e) { /* storage unavailable */ } fillEntrySelects(); render(); if (select.value !== id) select.value = id; if (changed && replayOnGo) replaySoon(); }
  select.addEventListener("change", () => go(select.value));
  search.addEventListener("input", () => { query = search.value; fillSelect(); if (cur) go(cur); });
  filterSel.addEventListener("change", () => { filter = filterSel.value; fillSelect(); if (cur) go(cur); });
  const step = (d) => { const l = visibleObjects(), i = l.findIndex((o) => o.id === cur); if (!l.length) return; go(l[(i + d + l.length) % l.length].id); };

  // ---- live test in the real reveal ----
  const partner = el("select", "dbg-input"); partner.style.width = "100%"; partner.setAttribute("aria-label", "Test against");
  sorted.forEach((o) => { const op = el("option", "", o.name); op.value = o.id; partner.appendChild(op); });
  partner.value = byId.has("empire-state-building") ? "empire-state-building" : sorted[sorted.length - 1].id;
  partner.addEventListener("change", replaySoon);
  const stage = el("div"); stage.style.cssText = "width:100%;min-height:80px;border-radius:10px;overflow:hidden;background:#fff8ec";
  const testNote = el("p", "dbg-note", "Plays the real reveal with your draft and the saved entrance. The object you picked plays as the small one if it is smaller than the object you test against, otherwise as the big one.");
  let mod = null, ctl = null, token = 0;
  async function test() {
    const my = ++token, o = byId.get(cur), p = byId.get(partner.value);
    if (!o || !p || o.id === p.id) { testNote.textContent = "Pick a different object to test against."; return; }
    testNote.textContent = "Loading…";
    try {
      mod = mod || await loadAnim();
      if (!mod) { testNote.textContent = "The animation engine did not load."; return; }
      // The engine keeps each object's turned picture for the life of the animation, so a fresh one is built every time:
      // otherwise a turn, flip or lean changed after the first watch would still show the old pose.
      if (ctl) { try { ctl.destroy(); } catch (e) { /* rebuilding */ } stage.textContent = ""; }
      ctl = mod.createStackAnimation(stage, {
        theme: mod.LIGHT_THEME, imageUrl: (x) => x.image,
        orientationFor: (x) => ({ ...DEFAULT, ...(ORIENT[x.id] || {}), ...(((drafts[x.id] || {}).orient) || {}) }),
        motionFor: (x, right, lean = false) => {
          const d = (drafts[x.id] || {}).motion, v = d || (mod.savedEntranceOf ? mod.savedEntranceOf(x.id) : null);
          return entryKindFor(x, v && v !== "auto" ? v : "slide", !!lean);
        },
      });
      const small = o.mm <= p.mm ? o : p, big = small === o ? p : o;
      const n = Math.max(1, Math.min(5000, Math.round(big.mm / small.mm)));
      const sc = await ctl.prepare({ ...small }, { ...big, mm: small.mm * n }, { hMax: 330, minStageH: 700 });
      if (my !== token) return;
      testNote.textContent = `${small.name} (small) vs ${big.name} (big): ${n.toLocaleString()} stacked.`;
      ctl.start(sc, {});
    } catch (e) { testNote.textContent = "That didn't play: " + String((e && e.message) || e).slice(0, 80); }
  }

  // ---- export ----
  const out = el("textarea", "dbg-input"); out.readOnly = true; out.rows = 5; out.style.cssText = "width:100%;font-size:11px;display:none"; out.setAttribute("aria-label", "Exported choices");
  async function copyChoices() {
    const text = JSON.stringify({ objectPickerChoices: 1, drafts }, null, 1);
    out.value = text; out.style.display = Object.keys(drafts).length ? "block" : "none";
    try { await navigator.clipboard.writeText(text); status.textContent = `Copied ${Object.keys(drafts).length} object change(s). Paste them to Claude to lock them into the game. For a long list, use Save as file.`; }
    catch (e) { out.focus(); out.select(); status.textContent = "Select the text below and copy it."; }
  }
  // Saves every choice as a file: the Android app shares it through the native sheet (Save to Files, Drive, email...),
  // a browser uses the share sheet or a normal download. This avoids the size limit of copying a long list.
  async function saveFile() {
    const n = Object.keys(drafts).length;
    if (!n) { status.textContent = "Nothing to save yet: change an object first."; return; }
    const text = JSON.stringify({ objectPickerChoices: 1, drafts }, null, 1), name = "object-choices.json";
    const plugins = (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && window.Capacitor.Plugins) || {};
    try {
      if (plugins.Filesystem && plugins.Share) {
        const f = await plugins.Filesystem.writeFile({ path: name, data: text, directory: "CACHE", encoding: "utf8" });
        await plugins.Share.share({ title: "Object choices", files: [f.uri], dialogTitle: "Save object choices" });
        status.textContent = `Saved ${n} object change(s) as ${name}.`; return;
      }
      const file = new File([text], name, { type: "application/json" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "Object choices" }); status.textContent = `Saved ${n} object change(s).`; return; }
      const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000); status.textContent = `Saved ${n} object change(s) as ${name}.`;
    } catch (e) {
      if (e && (e.name === "AbortError" || /cancel/i.test(String(e.message || e)))) return;
      out.value = text; out.style.display = "block"; status.textContent = "Couldn't save a file here. Use Copy choices instead.";
    }
  }
  const resetThis = btn("Reset this object", () => { delete drafts[cur]; saveDrafts(); fillSelect(); go(cur); replaySoon(); });
  resetThis.classList.add("dbg-warn");

  wrap.append(
    el("p", "dbg-note", "Every object in the game is listed here, so new ones appear on their own. Stand each one the way you want it, pick how it enters, and press Test."),
    search, field("Show", filterSel), field("Object", select), summary,
    row(btn("◀ Prev", () => step(-1)), btn("Next ▶", () => step(1))),
    thumbBox,
    field("Turn the picture", rotRow), row(flipBtn, mirBtn),
    field("Small: swings up", leanL), field("Big: swings up", leanR),
    field("How it enters", entry), leanNote, row(btn("▶ Watch it enter", test)),
    status,
    stage, testNote, field("Test against", partner),
    row(btn("Save as file", saveFile), btn("Copy choices", copyChoices), resetThis), out,
  );
  fillSelect(); if (cur) go(cur);
  replayOnGo = true;
  // The saved entrances live in the engine, so load it once and show them in the list.
  Promise.resolve(loadAnim()).then((m) => { if (!m || !m.savedEntranceOf) return; mod = m; savedEntrance = m.savedEntranceOf; if (cur) go(cur); }).catch(() => {});
  return wrap;
}
