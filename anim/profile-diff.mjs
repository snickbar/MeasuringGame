// The changed parts of a profile as a flat { "a/b/c": value | null } map for a multi-path update().
// Whole-profile transactions kept failing with "maxretry" (the profile never matched the server's copy closely
// enough to commit), so saves send only what changed instead. Arrays are replaced whole; null removes a key.
const plain = v => v !== null && typeof v === 'object' && !Array.isArray(v);
export function diffPaths(before, after, prefix = '', out = {}) {
  const a = plain(before) ? before : {}, b = plain(after) ? after : {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const path = prefix ? prefix + '/' + key : key, x = a[key], y = b[key];
    if (y === undefined || y === null) { if (x !== undefined && x !== null) out[path] = null; continue; }
    if (plain(y) && plain(x)) { diffPaths(x, y, path, out); continue; }
    if (JSON.stringify(x) !== JSON.stringify(y)) out[path] = y;
  }
  return out;
}
