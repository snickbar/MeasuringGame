// Deletes abandoned rooms from the Realtime Database.
//
// A room is "stale" when NO player in it is currently connected AND its last
// activity is older than the time-to-live (24 hours by default). Last activity is
// the newest of: rooms/<code>/lastActive (written by the app while anyone has the
// room open) and every player's joinedAt / disconnectedAt (so rooms made by older
// app versions, which never wrote lastActive, are still judged fairly).
//
// Usage (in CI - see .github/workflows/cleanup-stale-rooms.yml):
//   FIREBASE_SERVICE_ACCOUNT='{...json...}' node scripts/cleanup-stale-rooms.mjs
// Env: DRY_RUN=1 only logs what would be deleted; TTL_HOURS (default 24).
const DATABASE_URL = "https://measuring-game-default-rtdb.firebaseio.com";
const TTL_MS = (Number(process.env.TTL_HOURS) || 24) * 3600 * 1000;
const DRY_RUN = /^(1|true|yes)$/i.test(process.env.DRY_RUN || "");
const PAGE = 200;

// Pure decision function (exported so it can be tested without a database).
export function judgeRoom(room, now, ttlMs = TTL_MS) {
  if (!room || typeof room !== "object") return { stale: true, reason: "empty", lastActivity: 0 };
  const players = room.players && typeof room.players === "object" ? Object.values(room.players) : [];
  if (players.some((p) => p && p.connected === true)) return { stale: false, reason: "someone connected", lastActivity: now };
  let last = typeof room.lastActive === "number" ? room.lastActive : 0;
  for (const p of players) {
    if (!p) continue;
    if (typeof p.joinedAt === "number") last = Math.max(last, p.joinedAt);
    if (typeof p.disconnectedAt === "number") last = Math.max(last, p.disconnectedAt);
  }
  const age = now - last;
  // last === 0 means no timestamp anywhere: nothing can say it is recent, so it is leftover junk.
  if (age > ttlMs) return { stale: true, reason: last ? `idle ${(age / 3600000).toFixed(1)}h` : "no activity recorded", lastActivity: last };
  return { stale: false, reason: `active ${(age / 3600000).toFixed(1)}h ago`, lastActivity: last };
}

export async function deleteIfStale(roomRef, now = Date.now, ttlMs = TTL_MS) {
  // The transaction retries if a player reconnects or the code is reused while
  // cleanup is running. An old listing is never authority to delete a room.
  return roomRef.transaction(current => {
    if (!current || !judgeRoom(current, now(), ttlMs).stale) return undefined;
    return null;
  });
}

async function main() {
  const { default: admin } = await import("firebase-admin"); // loaded here so judgeRoom() can be tested without it
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT is not set");
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)), databaseURL: DATABASE_URL });
  const db = admin.database();
  const now = Date.now();
  let scanned = 0, stale = 0, kept = 0, startAfter = null;
  console.log(`${DRY_RUN ? "DRY RUN - " : ""}deleting rooms with nobody connected and idle > ${TTL_MS / 3600000}h`);
  for (;;) {
    let q = db.ref("rooms").orderByKey().limitToFirst(PAGE);
    if (startAfter) q = q.startAfter(startAfter);
    const snap = await q.get();
    if (!snap.exists()) break;
    const batch = [];
    snap.forEach((child) => { batch.push([child.key, child.val()]); startAfter = child.key; });
    for (const [code, room] of batch) {
      scanned++;
      const v = judgeRoom(room, now);
      if (v.stale) {
        const deleted = DRY_RUN || (await deleteIfStale(db.ref(`rooms/${code}`))).committed;
        if (deleted) {
          stale++;
          console.log(`${DRY_RUN ? "would delete" : "delete"} ${code}: ${v.reason}`);
        } else {
          kept++;
          console.log(`keep ${code}: activity changed since listing`);
        }
      } else kept++;
    }
    if (batch.length < PAGE) break;
  }
  console.log(`scanned ${scanned}, ${DRY_RUN ? "would delete" : "deleted"} ${stale}, kept ${kept}`);
  await admin.app().delete();
}

import { pathToFileURL } from "node:url";
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => { console.error(err); process.exit(1); });
}
