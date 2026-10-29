// Solo games live entirely on the phone: this is a tiny in-memory stand-in for the Firebase paths under
// rooms/<CODE>, so Quick Game works with no connection (and online solo games stop costing network round trips).
// It copies the Firebase behaviours the game relies on: null/empty values are dropped, arrays come back as
// arrays, serverTimestamp placeholders are resolved, onValue fires only when the value really changed,
// and transactions run against the current value. The rooms are saved to localStorage so closing the app
// mid-game and coming back (Rejoin) still works.

const SAVE_KEY = 'mg_localRooms';
const KEEP_MS = 24 * 60 * 60 * 1000;

const clone = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
const parts = (p) => String(p || '').split('/').filter(Boolean);

// Firebase drops nulls and empty containers, and stores arrays as objects keyed by index.
function normalize(v, now) {
  if (v === undefined || v === null) return null;
  if (typeof v === 'object' && v['.sv'] === 'timestamp') return now();
  if (Array.isArray(v)) {
    const out = {};
    v.forEach((x, i) => { const n = normalize(x, now); if (n !== null) out[i] = n; });
    return Object.keys(out).length ? out : null;
  }
  if (typeof v === 'object') {
    const out = {};
    for (const [k, x] of Object.entries(v)) { const n = normalize(x, now); if (n !== null) out[k] = n; }
    return Object.keys(out).length ? out : null;
  }
  return v;
}
// ...and hands objects with dense integer keys back as arrays.
function present(v) {
  if (v === null || typeof v !== 'object') return v;
  const keys = Object.keys(v);
  const out = {};
  for (const k of keys) out[k] = present(v[k]);
  if (keys.length && keys.every((k) => /^(0|[1-9]\d*)$/.test(k))) {
    const max = Math.max(...keys.map(Number));
    if (max < keys.length * 2) { const arr = []; for (let i = 0; i <= max; i++) arr.push(out[i] === undefined ? null : out[i]); return arr; }
  }
  return out;
}

class LocalSnapshot {
  constructor(path, value) { this._path = path; this._v = value; this.key = parts(path).at(-1) ?? null; }
  val() { return clone(present(this._v)); }
  exists() { return this._v !== null && this._v !== undefined; }
  hasChildren() { return !!this._v && typeof this._v === 'object' && Object.keys(this._v).length > 0; }
  get size() { return this._v && typeof this._v === 'object' ? Object.keys(this._v).length : 0; }
  child(p) {
    let v = this._v;
    for (const k of parts(p)) { if (v === null || typeof v !== 'object') { v = null; break; } v = v[k] === undefined ? null : v[k]; }
    return new LocalSnapshot(this._path + '/' + parts(p).join('/'), v);
  }
  forEach(cb) {
    if (!this._v || typeof this._v !== 'object') return false;
    for (const [k, x] of Object.entries(this._v)) if (cb(new LocalSnapshot(this._path + '/' + k, x)) === true) return true;
    return false;
  }
  toJSON() { return this.val(); }
}

export function createLocalRooms({ storage = (typeof localStorage !== 'undefined' ? localStorage : null), now = () => Date.now() } = {}) {
  const rooms = new Map();      // CODE -> normalized tree
  const touched = new Map();    // CODE -> last write time (for pruning)
  const listeners = new Set();
  let saveTimer = null;

  // ---- persistence ----
  try {
    const saved = JSON.parse(storage?.getItem(SAVE_KEY) || '{}');
    for (const [code, entry] of Object.entries(saved)) {
      if (entry && entry.t && now() - entry.t < KEEP_MS && entry.v) { rooms.set(code, entry.v); touched.set(code, entry.t); }
    }
  } catch { /* unreadable save: start clean */ }
  function saveNow() {
    saveTimer = null;
    try {
      const out = {};
      for (const [code, v] of rooms) out[code] = { t: touched.get(code) || now(), v };
      storage?.setItem(SAVE_KEY, JSON.stringify(out));
    } catch { /* storage full or blocked: the game still works in memory */ }
  }
  function scheduleSave() { if (!saveTimer && typeof setTimeout === 'function') saveTimer = setTimeout(saveNow, 300); }

  // ---- tree helpers ----
  const codeOf = (path) => parts(path)[0] === 'rooms' ? parts(path)[1] : undefined;
  const owns = (path) => { const c = codeOf(path); return !!c && rooms.has(c); };
  function readNode(path) {
    const ps = parts(path);
    const code = ps[1];
    let v = rooms.get(code) ?? null;
    for (const k of ps.slice(2)) { if (v === null || typeof v !== 'object') return null; v = v[k] === undefined ? null : v[k]; }
    return v;
  }
  function writeNode(path, value) {
    const ps = parts(path), code = ps[1];
    const next = normalize(value, now);
    if (ps.length === 2) { if (next === null) rooms.delete(code); else rooms.set(code, next); }
    else {
      let root = rooms.get(code);
      if (!root) root = {};
      let n = root;
      const keys = ps.slice(2);
      const stack = [];
      for (const k of keys.slice(0, -1)) {
        if (n[k] === undefined || n[k] === null || typeof n[k] !== 'object') n[k] = {};
        stack.push([n, k]);
        n = n[k];
      }
      const last = keys.at(-1);
      if (next === null) delete n[last]; else n[last] = next;
      // prune containers that became empty
      for (let i = stack.length - 1; i >= 0; i--) { const [parent, k] = stack[i]; if (!Object.keys(parent[k]).length) delete parent[k]; else break; }
      if (Object.keys(root).length) rooms.set(code, root); else rooms.delete(code);
    }
    touched.set(code, now());
    scheduleSave();
  }
  const related = (a, b) => a === b || a.startsWith(b + '/') || b.startsWith(a + '/');
  function notify(path) {
    for (const l of [...listeners]) {
      if (!related(path, l.path)) continue;
      queueMicrotask(() => { if (listeners.has(l)) l.run(); });
    }
  }
  const norm = (p) => parts(p).join('/');

  // ---- the Firebase-shaped API ----
  const makeRef = (path) => { const p = norm(path); return { __local: true, path: p, key: parts(p).at(-1) ?? null }; };
  const api = {
    owns,
    ref: makeRef,
    isLocalRef: (r) => !!(r && r.__local),
    // Creates a brand new local room (a solo game) and starts owning its code.
    create(code, value) { rooms.set(code, {}); writeNode('rooms/' + code, value); notify('rooms/' + code); },
    drop(code) { rooms.delete(code); touched.delete(code); scheduleSave(); },
    codes: () => [...rooms.keys()],
    flush: saveNow,

    async get(r) { return new LocalSnapshot(r.path, clone(readNode(r.path))); },
    async set(r, value) { writeNode(r.path, value); notify(r.path); },
    async update(r, values) {
      for (const [k, v] of Object.entries(values || {})) writeNode(r.path + '/' + norm(k), v);
      notify(r.path);
    },
    async remove(r) { writeNode(r.path, null); notify(r.path); },
    push(r, value) {
      const key = 'L' + now().toString(36) + Math.random().toString(36).slice(2, 8);
      const child = makeRef(r.path + '/' + key);
      if (value !== undefined) { writeNode(child.path, value); notify(child.path); }
      child.then = undefined; // callers sometimes await the result; the ref itself is not thenable
      return child;
    },
    onValue(r, cb, options) {
      if (options && options.onlyOnce) { let off = () => {}; let done = false; off = api.onValue(r, (snap) => { if (done) return; done = true; queueMicrotask(() => off()); cb(snap); }); return off; }
      let last;
      const l = { path: r.path, run() {
        const v = readNode(r.path), s = JSON.stringify(v);
        if (s === last) return;
        last = s;
        cb(new LocalSnapshot(r.path, clone(v)));
      } };
      listeners.add(l);
      queueMicrotask(() => { if (listeners.has(l)) { const v = readNode(r.path); last = JSON.stringify(v); cb(new LocalSnapshot(r.path, clone(v))); } });
      return () => listeners.delete(l);
    },
    onChildAdded(r, cb) {
      const seen = new Set();
      const l = { path: r.path, run() {
        const v = readNode(r.path);
        if (!v || typeof v !== 'object') return;
        for (const [k, x] of Object.entries(v)) if (!seen.has(k)) { seen.add(k); cb(new LocalSnapshot(r.path + '/' + k, clone(x))); }
      } };
      listeners.add(l);
      queueMicrotask(() => { if (listeners.has(l)) l.run(); });
      return () => listeners.delete(l);
    },
    async runTransaction(r, fn) {
      const previous = clone(readNode(r.path));
      const next = fn(clone(previous));
      if (next === undefined) return { committed: false, snapshot: new LocalSnapshot(r.path, previous) };
      writeNode(r.path, next);
      notify(r.path);
      return { committed: true, snapshot: new LocalSnapshot(r.path, clone(readNode(r.path))) };
    },
    // Disconnect handlers only matter for rooms on the server.
    onDisconnect() {
      const noop = async () => {};
      return { set: noop, update: noop, remove: noop, cancel: noop, setWithPriority: noop };
    },
  };
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow(); });
  }
  return api;
}
