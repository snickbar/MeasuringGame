// Moves leaderboard entries stored under a guest's raw device id to the one-way hashed key the game now uses
// (anim/board-id.mjs), so no public leaderboard reveals a device id any more. Safe to run again: entries already
// marked h:1 and signed-in (uid) entries are left alone. If both an old and a hashed entry exist for the same
// player, the better score is kept (Survival) or the hashed one is kept (Daily/Monthly, one score per day/level).
//
// Usage (GitHub Actions > "Migrate leaderboard ids", dry run first):
//   FIREBASE_SERVICE_ACCOUNT='{...json...}' DRY_RUN=1 node scripts/migrate-board-ids.mjs
import { boardId, isGuestId } from '../anim/board-id.mjs';

const DATABASE_URL = 'https://measuring-game-default-rtdb.firebaseio.com';
const DRY_RUN = !/^(0|false|no)$/i.test(process.env.DRY_RUN || '1'); // a dry run unless DRY_RUN is explicitly false

// Pure: given one board's entries ({ id: entry }), the multi-path update that migrates it (paths relative to the board).
export function planBoard(entries, { best = false } = {}) {
  const updates = {};
  for (const [id, entry] of Object.entries(entries || {})) {
    if (!entry || typeof entry !== 'object' || !isGuestId(id) || entry.h === 1) continue;
    const key = boardId(id), existing = entries[key] || updates[key];
    if (!existing || (best && Number(entry.s) > Number(existing.s))) updates[key] = { ...entry, h: 1 };
    updates[id] = null;
  }
  return updates;
}
// Pure: the whole migration for { daily: {date: board}, monthly: {key: board}, survival: board }.
export function planAll({ daily = {}, monthly = {}, survival = {} } = {}) {
  const updates = {};
  const add = (prefix, plan) => { for (const [k, v] of Object.entries(plan)) updates[prefix + '/' + k] = v; };
  for (const [date, board] of Object.entries(daily || {})) add('daily/' + date, planBoard(board));
  for (const [key, board] of Object.entries(monthly || {})) add('monthly/' + key, planBoard(board));
  add('survival', planBoard(survival, { best: true }));
  return updates;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { default: admin } = await import('firebase-admin');
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set');
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)), databaseURL: DATABASE_URL });
  const db = admin.database();
  const [daily, monthly, survival] = await Promise.all(['daily', 'monthly', 'survival'].map(async (p) => (await db.ref(p).get()).val() || {}));
  const updates = planAll({ daily, monthly, survival });
  const moved = Object.values(updates).filter((v) => v !== null).length, removed = Object.values(updates).filter((v) => v === null).length;
  console.log(`${DRY_RUN ? '[dry run] would move' : 'Moving'} ${removed} leaderboard entries off raw device ids (${moved} written under hashed keys).`);
  for (const path of Object.keys(updates).slice(0, 20)) console.log('  ' + (updates[path] === null ? 'remove ' : 'write  ') + path.replace(/[a-f0-9]{32}/g, (m) => m.slice(0, 6) + '…'));
  if (!DRY_RUN && Object.keys(updates).length) await db.ref().update(updates);
  await admin.app().delete();
}
