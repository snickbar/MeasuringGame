// Checks the stale-room decision used by the daily cleanup (scripts/cleanup-stale-rooms.mjs).
import { judgeRoom } from "./cleanup-stale-rooms.mjs";
const H = 3600000, now = 1e12, ok = (c, m) => { if (!c) { console.log("FAIL", m); process.exitCode = 1; } else console.log("ok  ", m); };
ok(!judgeRoom({ players: { a: { connected: true, joinedAt: now - 99 * H } } }, now).stale, "connected player keeps an old room");
ok(judgeRoom({ players: { a: { connected: false, disconnectedAt: now - 25 * H, joinedAt: now - 30 * H } } }, now).stale, "all gone 25h = stale");
ok(!judgeRoom({ players: { a: { connected: false, disconnectedAt: now - 23 * H } } }, now).stale, "gone 23h = kept");
ok(!judgeRoom({ lastActive: now - 2 * H, players: { a: { connected: false, disconnectedAt: now - 30 * H } } }, now).stale, "recent lastActive beats old disconnect");
ok(judgeRoom({ lastActive: now - 26 * H }, now).stale, "no players, old lastActive = stale");
ok(judgeRoom({ players: { a: { connected: false } } }, now).stale, "no timestamps at all = junk");
ok(judgeRoom(null, now).stale, "null room = stale");
