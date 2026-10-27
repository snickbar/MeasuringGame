// Debug / Admin tools (Settings > Debug / Admin): lock or unlock almost anything on this profile, in batches or one by one, and set coins.
// Built from the game's own catalogs, so new items show up here automatically. Everything writes straight to the profile.
// To hide the whole section for a release, set DEBUG_TOOLS = false in index.html.
export function installDebugTools(ctx) {
  const card = document.getElementById("settings-debug-card"), root = document.getElementById("debug-tools-root");
  if (!card || !root) return { refresh() {} };
  const P = () => ctx.profile() || {};
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const merge = (...patches) => Object.assign({}, ...patches);
  let status;
  const say = (msg) => { if (status) status.textContent = msg; };
  const run = async (patch, msg) => {
    try { await ctx.patch(patch); say(msg || "Done."); } catch (e) { say("That didn't save: " + String((e && e.message) || e).slice(0, 80)); }
    refresh();
  };
  // Buttons that wipe or lock things need a second tap.
  function btn(label, fn, opts = {}) {
    const b = el("button", "dbg-btn" + (opts.warn ? " dbg-warn" : "") + (opts.on ? " dbg-on" : ""), label); b.type = "button";
    let armed = null;
    b.addEventListener("click", () => {
      if (opts.warn && !armed) { b.textContent = "Tap again to confirm"; armed = setTimeout(() => { armed = null; b.textContent = label; }, 3000); return; }
      if (armed) { clearTimeout(armed); armed = null; b.textContent = label; }
      fn();
    });
    return b;
  }
  const row = (...kids) => { const r = el("div", "dbg-row"); kids.forEach((k) => k && r.appendChild(k)); return r; };

  // ---- item sets: each knows which items exist, which are on, and how to switch one / all of them ----
  const own = (cat) => (P().cosmetics && P().cosmetics.owned && P().cosmetics.owned[cat]) || {};
  const equipDefault = { borders: "classic", effects: "classic", colors: "default", backgrounds: "none", boards: "none", homeScreens: "ants" };
  const equipKey = { borders: "borders", effects: "effects", colors: "colors", backgrounds: "background", boards: "board", homeScreens: "homeScreen" };
  const equippedNow = (cat) => P().cosmetics && P().cosmetics.equipped && P().cosmetics.equipped[equipKey[cat]];

  // Cosmetics that can also be owned through a pack (flairs, backgrounds, boards).
  function cosmeticSet(cat, title, items, packKey, packs, keepOwned) {
    const inPack = (id) => packs.filter((pk) => pk.items.includes(id));
    const packOn = (pk) => !!(P()[packKey] || {})[pk.id];
    const isOn = (id) => !!own(cat)[id] || inPack(id).some(packOn);
    return {
      title, items, isOn,
      set(id, on) {
        const base = `cosmetics/owned/${cat}/`;
        if (on) return { [base + id]: true };
        const patch = { [base + id]: null };
        inPack(id).filter(packOn).forEach((pk) => { patch[`${packKey}/${pk.id}`] = null; pk.items.forEach((o) => { if (o !== id) patch[base + o] = true; }); });
        if (equippedNow(cat) === id) patch[`cosmetics/equipped/${equipKey[cat]}`] = equipDefault[cat];
        return patch;
      },
      all(on) {
        if (on) {
          const owned = { ...keepOwned }; items.forEach((i) => { owned[i.id] = true; });
          const packsOn = {}; packs.forEach((pk) => { packsOn[pk.id] = true; });
          return packs.length ? { [`cosmetics/owned/${cat}`]: owned, [packKey]: packsOn } : { [`cosmetics/owned/${cat}`]: owned };
        }
        return merge({ [`cosmetics/owned/${cat}`]: keepOwned && Object.keys(keepOwned).length ? keepOwned : null, [`cosmetics/equipped/${equipKey[cat]}`]: equipDefault[cat] }, packs.length ? { [packKey]: null } : {});
      },
    };
  }
  const sets = {};
  function build() {
    const C = ctx.catalog;
    sets.avatars = {
      title: "Avatars", items: C.avatars.filter((a) => a.tier !== "default").map((a) => ({ id: a.id, label: a.id, tier: a.tier })),
      isOn: (id) => !!(P().unlockedAvatars || {})[id],
      set: (id, on) => ({ [`unlockedAvatars/${id}`]: on ? true : null }),
      all: (on) => ({ unlockedAvatars: on ? Object.fromEntries(C.avatars.map((a) => [a.id, true])) : ctx.defaultUnlockedAvatars() }),
    };
    const claimOf = (id) => { const a = C.achievements.find((x) => x.home === id); return a ? a.id : null; };
    sets.homes = {
      title: "Home screens", items: C.homeScreens.filter((h) => h.id !== "ants").map((h) => ({ id: h.id, label: h.name })),
      isOn: (id) => !!own("homeScreens")[id],
      set(id, on) {
        const patch = { [`cosmetics/owned/homeScreens/${id}`]: on ? true : null }, a = claimOf(id);
        if (a) patch[`achClaimed/${a}`] = on ? true : null; // so the award shows as claimed / claimable again
        if (!on && equippedNow("homeScreens") === id) patch["cosmetics/equipped/homeScreen"] = "ants";
        return patch;
      },
      all(on) {
        const items = C.homeScreens.filter((h) => h.id !== "ants"), patch = { "cosmetics/owned/homeScreens": on ? Object.fromEntries(items.map((h) => [h.id, true])) : null };
        items.forEach((h) => { const a = claimOf(h.id); if (a) patch[`achClaimed/${a}`] = on ? true : null; });
        if (!on) patch["cosmetics/equipped/homeScreen"] = "ants";
        return patch;
      },
    };
    const paid = (list) => list.filter((i) => i.cost > 0).map((i) => ({ id: i.id, label: i.label }));
    const cat = C.cosmetics;
    sets.borders = cosmeticSet("borders", "Card borders", paid(cat.borders), null, [], { classic: true });
    sets.colors = cosmeticSet("colors", "Name colors", paid(cat.colors), null, [], { default: true });
    sets.flairs = cosmeticSet("effects", "Winner flairs", paid(cat.effects), "flairPacks", C.flairPacks.map((p) => ({ id: p.id, items: p.flairs })), { classic: true });
    const bgPacks = C.backgroundPacks.map((p) => ({ id: p.id, items: p.backgrounds.map((b) => b.id) }));
    ["bgpack1", "bgpack2"].forEach((id) => { if (!bgPacks.some((p) => p.id === id)) bgPacks.push({ id, items: C.monthBackgrounds.filter((m) => m.legacyPack === id).map((m) => m.id) }); });
    sets.backgrounds = cosmeticSet("backgrounds", "Backgrounds", C.backgroundPacks.flatMap((p) => p.backgrounds).concat(C.monthBackgrounds).map((b) => ({ id: b.id, label: b.label })), "backgroundPacks", bgPacks, {});
    sets.boards = cosmeticSet("boards", "Question boards", C.boardPacks.flatMap((p) => p.boards).map((b) => ({ id: b.id, label: b.label })), "boardPacks", C.boardPacks.map((p) => ({ id: p.id, items: p.boards.map((b) => b.id) })), {});
    sets.reactions = {
      title: "Reaction packs", items: C.emojiPacks.map((p) => ({ id: p.id, label: p.label.replace("Reaction ", "") })),
      isOn: (id) => !!(P().emojiPacks || {})[id],
      set: (id, on) => ({ [`emojiPacks/${id}`]: on ? true : null }),
      all: (on) => on ? { emojiPacks: Object.fromEntries(C.emojiPacks.map((p) => [p.id, true])) }
        : { emojiPacks: null, emojiOwned: null, reactionSlotsExtra: 0, activeEmojis: [...C.startEmojis], activeReactions: null },
    };
    sets.months = {
      title: "Monthly object packs", items: C.monthPacks.map((p) => ({ id: p.id, label: p.name.replace(" Object Pack", "") })),
      isOn: (id) => !!(P().holidayPacks || {})[id],
      set: (id, on) => ({ [`holidayPacks/${id}`]: on ? true : null }),
      all: (on) => ({ holidayPacks: on ? Object.fromEntries(C.monthPacks.map((p) => [p.id, true])) : null }),
    };
    sets.perks = {
      title: "Perks", items: [{ id: "hostUnlocked", label: "Host unlock" }, { id: "starterBundle", label: "Starter bundle" }],
      isOn: (id) => !!P()[id], set: (id, on) => ({ [id]: on }), all: (on) => ({ hostUnlocked: on, starterBundle: on }),
    };
  }

  // ---- worlds ----
  const worldPatch = (w, stars) => ({ [`worlds/${w}`]: stars == null ? null : Object.fromEntries(Array.from({ length: ctx.worldLevels }, (_, i) => ["l" + (i + 1), stars])) });
  const worldStars = (w) => { const d = (P().worlds || {})[w] || {}; let n = 0; for (let i = 1; i <= ctx.worldLevels; i++) n += Number(d["l" + i]) || 0; return n; };

  // ---- rendering ----
  const open = new Set(JSON.parse(sessionStorage.getItem("mg_dbgOpen") || "[]"));
  function section(key, title, summary, body) {
    const d = el("details", "dbg-sec"); d.open = open.has(key);
    d.addEventListener("toggle", () => { d.open ? open.add(key) : open.delete(key); try { sessionStorage.setItem("mg_dbgOpen", JSON.stringify([...open])); } catch (e) {} });
    const s = el("summary"); s.appendChild(el("span", "dbg-t", title)); if (summary) s.appendChild(el("span", "dbg-sum", summary)); d.appendChild(s);
    d.appendChild(body); return d;
  }
  function setBody(set) {
    const wrap = el("div", "dbg-body"), on = set.items.filter((i) => set.isOn(i.id)).length;
    wrap.appendChild(row(btn(`Unlock all (${set.items.length})`, () => run(set.all(true), `${set.title}: all unlocked.`)), btn("Lock all", () => run(set.all(false), `${set.title}: all locked.`), { warn: true })));
    const chips = el("div", "dbg-chips");
    set.items.forEach((i) => {
      const isOn = set.isOn(i.id), c = btn((isOn ? "✓ " : "") + i.label, () => run(set.set(i.id, !isOn), `${i.label}: ${isOn ? "locked" : "unlocked"}.`), { on: isOn });
      if (i.tier) c.dataset.tier = i.tier; chips.appendChild(c);
    });
    wrap.appendChild(chips); wrap.dataset.count = `${on}/${set.items.length}`; return wrap;
  }
  function coinsBody() {
    const wrap = el("div", "dbg-body"), input = el("input", "dbg-input"); input.type = "number"; input.min = "0"; input.inputMode = "numeric"; input.placeholder = "Exact coin amount";
    wrap.appendChild(row(input, btn("Set coins", () => run({ coins: Math.max(0, parseInt(input.value, 10) || 0) }, "Coins set."))));
    const add = (n) => run({ coins: Math.max(0, (P().coins || 0) + n) }, `${n > 0 ? "+" : ""}${n} coins.`);
    wrap.appendChild(row(...[10, 50, 100, 500, 1000, 5000, 25000].map((n) => btn("+" + n.toLocaleString(), () => add(n)))));
    wrap.appendChild(row(btn("-100", () => add(-100)), btn("-1,000", () => add(-1000)), btn("Coins to 0", () => run({ coins: 0 }, "Coins set to 0."), { warn: true })));
    wrap.appendChild(row(el("span", "dbg-label", "Free avatar pulls"), btn("+1", () => run({ freePulls: (P().freePulls | 0) + 1 }, "+1 free pull.")), btn("+5", () => run({ freePulls: (P().freePulls | 0) + 5 }, "+5 free pulls.")), btn("To 0", () => run({ freePulls: 0 }, "Free pulls set to 0."))));
    wrap.appendChild(row(el("span", "dbg-label", "Extra reaction slots"), ...[0, 1, 2].map((n) => btn(String(n), () => run({ reactionSlotsExtra: n }, `Extra reaction slots: ${n}.`), { on: (P().reactionSlotsExtra | 0) === n }))));
    return wrap;
  }
  function worldsBody() {
    const wrap = el("div", "dbg-body");
    wrap.appendChild(row(btn("Perfect all worlds", () => run(merge(...ctx.worlds.map((w) => worldPatch(w.id, 3))), "Every world: all stars.")), btn("1★ every level (all worlds)", () => run(merge(...ctx.worlds.map((w) => worldPatch(w.id, 1))), "Every world: 1 star per level.")), btn("Clear all worlds", () => run(merge(...ctx.worlds.map((w) => worldPatch(w.id, null))), "World progress cleared."), { warn: true })));
    ctx.worlds.forEach((w) => wrap.appendChild(row(el("span", "dbg-label", `${w.name} (${worldStars(w.id)}/${ctx.worldLevels * 3}★)`), btn("Clear", () => run(worldPatch(w.id, null), `${w.name} cleared.`)), btn("1★ each", () => run(worldPatch(w.id, 1), `${w.name}: 1 star per level.`)), btn("Perfect", () => run(worldPatch(w.id, 3), `${w.name}: perfect.`)))));
    return wrap;
  }
  function resetsBody() {
    const wrap = el("div", "dbg-body"), W = { warn: true };
    wrap.appendChild(row(
      btn("Claimed awards", () => run({ achClaimed: null }, "Awards can be claimed again (starter awards come back on their own)."), W),
      btn("Objects seen", () => run({ seenObjects: null, seenCombos: null, objectDiscoveries: null }, "Objects seen cleared."), W),
      btn("Daily ads", () => run({ adsWatchedCount: 0, adsWatchedDate: null }, "Daily ad count reset.")),
      btn("Tutorial", () => run({ tutorial: null }, "Tutorial reset."), W),
      btn("Daily challenge", () => run({ daily: null, dailyStreak: null }, "Daily challenge reset."), W),
      btn("Daily: play again (keep score)", () => run({ daily: null }, "Daily challenge can be played again. Your streak, history and leaderboard score stay; the replay isn't posted or paid.")),
      btn("Monthly challenge", () => run({ monthly: null }, "Monthly challenge reset."), W),
      btn("Survival best", () => run({ survival: null }, "Survival progress reset."), W),
      btn("Host free dates", () => run({ hostFreeDates: null }, "Host free dates reset."), W)));
    return wrap;
  }
  function masterBody() {
    const wrap = el("div", "dbg-body"), every = ["avatars", "homes", "borders", "colors", "flairs", "backgrounds", "boards", "reactions", "months", "perks"];
    const allOn = () => merge(...every.map((k) => sets[k].all(true)), ...ctx.worlds.map((w) => worldPatch(w.id, 3)));
    const allOff = () => merge(...every.map((k) => sets[k].all(false)), ...ctx.worlds.map((w) => worldPatch(w.id, null)));
    wrap.appendChild(row(btn("Unlock EVERYTHING", () => run(allOn(), "Everything unlocked (worlds perfect too)."), { warn: true }), btn("Lock EVERYTHING", () => run(allOff(), "Everything locked again. Coins are untouched."), { warn: true })));
    wrap.appendChild(el("p", "dbg-note", "Locking everything puts avatars, cosmetics, scenes, packs, perks and world stars back to a brand-new profile. Coins and stats stay."));
    return wrap;
  }

  let building = false;
  function refresh() {
    if (building || !root.isConnected) return;
    building = true;
    try {
      if (!sets.avatars) build();
      const scroller = document.getElementById("settings-screen"), keepScroll = scroller ? scroller.scrollTop : 0;
      const prev = status ? status.textContent : "";
      root.textContent = "";
      status = el("p", "dbg-status", prev || `Coins: ${(P().coins || 0).toLocaleString()} · tap a heading to open it.`); status.setAttribute("role", "status"); root.appendChild(status);
      const count = (s) => `${s.items.filter((i) => s.isOn(i.id)).length}/${s.items.length}`;
      const S = sets;
      [["master", "Everything", "", masterBody()], ["coins", "Coins & pulls", (P().coins || 0).toLocaleString() + " coins", coinsBody()],
        ["avatars", "Avatars", count(S.avatars), setBody(S.avatars)], ["homes", "Home screens", count(S.homes), setBody(S.homes)],
        ["worlds", "World stars", ctx.worlds.reduce((n, w) => n + worldStars(w.id), 0) + "★", worldsBody()],
        ["borders", "Card borders", count(S.borders), setBody(S.borders)], ["colors", "Name colors", count(S.colors), setBody(S.colors)],
        ["flairs", "Winner flairs", count(S.flairs), setBody(S.flairs)], ["backgrounds", "Backgrounds", count(S.backgrounds), setBody(S.backgrounds)],
        ["boards", "Question boards", count(S.boards), setBody(S.boards)], ["reactions", "Reaction packs", count(S.reactions), setBody(S.reactions)],
        ["months", "Monthly object packs", count(S.months), setBody(S.months)], ["perks", "Perks", count(S.perks), setBody(S.perks)],
        ["resets", "Reset progress", "", resetsBody()]].forEach(([k, t, sum, body]) => root.appendChild(section(k, t, sum, body)));
      if (scroller) scroller.scrollTop = keepScroll;
    } finally { building = false; }
  }
  card.addEventListener("toggle", () => { if (card.open) refresh(); });
  if (card.open) refresh();
  return { refresh: () => { if (card.open) refresh(); } };
}
