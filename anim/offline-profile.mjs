// Offline-first profile writes. While the phone has no connection, every profile write (coins, rewards,
// stats, unlocks...) is applied to a saved local copy of the profile and shown at once, instead of waiting
// for the server. When the connection returns, the offline changes are merged into whatever the server
// has now (a three-way merge: what we last synced, what we have now, what the server has now), so coins
// are added rather than overwritten and nothing is counted twice.
//
// The copy is kept in the same shape Firebase hands back (arrays as arrays, empty values dropped) so the
// game's own write functions work on it unchanged.
import { normalize, present } from './local-rooms.mjs';

const KEY = (id) => 'mg_profileSync_' + id;
const clone = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const parts = (p) => String(p || '').split('/').filter(Boolean);

// merge(server, base, local): keeps the server's newer data and replays only what this device changed.
export function mergeProfile(server, base, local, baseless = base === null || base === undefined) {
  if (same(local, base)) return server === undefined ? null : server;     // nothing changed here
  if (same(server, base)) return local;                                   // nothing changed on the server
  if (isObj(local) && isObj(server)) {
    const out = {};
    const b = isObj(base) ? base : {};
    for (const k of new Set([...Object.keys(server), ...Object.keys(local), ...Object.keys(b)])) {
      const v = mergeProfile(server[k], b[k], local[k], baseless);
      if (v !== null && v !== undefined) out[k] = v;
    }
    return Object.keys(out).length ? out : null;
  }
  if (typeof local === 'number' && typeof server === 'number' && typeof base === 'number') return server + (local - base); // coins etc.
  // A counter that did not exist when we last synced was created offline: add it. But if we never synced at all (no base),
  // our numbers are just starting defaults, so keep the larger one instead of adding them on top of the real balance.
  if (typeof local === 'number' && typeof server === 'number' && base == null) return baseless ? Math.max(server, local) : server + local;
  if (Array.isArray(local) && Array.isArray(server)) {                    // lists changed on both sides: keep both sets of entries
    const seen = new Set(server.map((x) => JSON.stringify(x)));
    const before = new Set((Array.isArray(base) ? base : []).map((x) => JSON.stringify(x)));
    return [...server, ...local.filter((x) => { const j = JSON.stringify(x); return !before.has(j) && !seen.has(j); })];
  }
  return local;                                                           // text/flags: this device's change wins
}

export function createOfflineProfile({ storage = (typeof localStorage !== 'undefined' ? localStorage : null), now = () => Date.now() } = {}) {
  const states = new Map(); // id -> { base, local, dirty }
  const timers = new Map();

  function load(id) {
    if (states.has(id)) return states.get(id);
    let st = null;
    try { st = JSON.parse(storage?.getItem(KEY(id)) || 'null'); } catch { st = null; }
    if (!st || typeof st !== 'object') st = { base: null, local: null, dirty: false, token: null };
    states.set(id, st);
    return st;
  }
  function saveNow(id) {
    timers.delete(id);
    try { storage?.setItem(KEY(id), JSON.stringify(states.get(id))); } catch { /* storage full: still works in memory */ }
  }
  function save(id) { if (!timers.has(id) && typeof setTimeout === 'function') timers.set(id, setTimeout(() => saveNow(id), 400)); }

  function getAt(root, rel) {
    let v = root;
    for (const k of parts(rel)) { if (v === null || typeof v !== 'object') return null; v = v[k] === undefined ? null : v[k]; }
    return v === undefined ? null : v;
  }
  function setAt(root, rel, value) {
    const ks = parts(rel);
    if (!ks.length) return value;
    const out = isObj(root) || Array.isArray(root) ? clone(root) : {};
    let n = out;
    for (const k of ks.slice(0, -1)) { if (n[k] === null || typeof n[k] !== 'object') n[k] = {}; n = n[k]; }
    if (value === null) delete n[ks.at(-1)]; else n[ks.at(-1)] = value;
    return out;
  }
  const tidy = (v) => present(normalize(v, now));
  // Each batch of offline changes carries a one-time token. It is written into the profile together with the
  // merged changes, so if a sync succeeds but the app dies before it can tell, the retry sees the token and skips.
  const markDirty = (st) => { st.dirty = true; if (!st.token) st.token = 't' + now().toString(36) + Math.random().toString(36).slice(2, 8); };

  return {
    state: load,
    isDirty: (id) => !!load(id).dirty,
    hasBase: (id) => load(id).base !== null,
    // A brand new profile that has never been seen on the server needs a starting copy to write onto.
    seedIfEmpty(id, value) { const st = load(id); if (st.local === null) { st.local = tidy(value); save(id); } },
    local: (id) => clone(load(id).local),
    // The listener delivered fresh server data. While offline changes are waiting to merge, keep showing them.
    serverSnapshot(id, data) {
      const st = load(id);
      if (st.dirty) return { data: clone(st.local), pending: true };
      st.base = clone(data); st.local = clone(data); save(id);
      return { data, pending: false };
    },
    // Runs the game's own transaction function against the local copy. Returns { committed, value }.
    transaction(id, rel, fn) {
      const st = load(id);
      const current = getAt(st.local, rel);
      const next = fn(clone(current));
      if (next === undefined) return { committed: false, value: clone(current) };
      const value = tidy(next);
      st.local = tidy(setAt(st.local, rel, value));
      markDirty(st); save(id);
      return { committed: true, value: clone(getAt(st.local, rel)) };
    },
    update(id, rel, values) {
      const st = load(id);
      let local = st.local;
      for (const [k, v] of Object.entries(values || {})) local = setAt(local, [rel, k].filter(Boolean).join('/'), v === undefined ? null : tidy(v));
      st.local = tidy(local); markDirty(st); save(id);
    },
    set(id, rel, value) {
      const st = load(id);
      st.local = tidy(setAt(st.local, rel, value === undefined ? null : tidy(value)));
      markDirty(st); save(id);
    },
    // For the one real transaction sent when the connection is back.
    mergeInto: (id) => (serverNow) => {
      const st = load(id);
      if (st.token && serverNow?.offlineSyncs?.[st.token]) return undefined;  // already merged earlier
      const merged = mergeProfile(clone(serverNow), st.base, st.local);
      if (merged === null) return undefined;
      const syncs = { ...(merged.offlineSyncs || {}), ...(st.token ? { [st.token]: now() } : {}) };
      const newest = Object.entries(syncs).sort((a, b) => b[1] - a[1]).slice(0, 6);   // keep only the latest few
      merged.offlineSyncs = Object.fromEntries(newest);
      return merged;
    },
    markSynced(id, value) {
      const st = load(id);
      st.base = clone(value); st.local = clone(value); st.dirty = false; st.token = null; saveNow(id);
    },
    flush(id) { saveNow(id); },
  };
}
