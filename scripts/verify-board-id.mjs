// Leaderboard keys: guests are listed under a one-way hash of their device id, never the id itself (see anim/board-id.mjs).
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { boardId, sha256Hex, isGuestId, BOARD_HASH_PREFIX } from '../anim/board-id.mjs';

const node = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
for (const s of ['', 'abc', 'a'.repeat(55), 'a'.repeat(56), 'a'.repeat(64), 'a'.repeat(1000), 'héllo wörld ✓', BOARD_HASH_PREFIX + '0123456789abcdef0123456789abcdef'])
  assert.equal(sha256Hex(s), node(s), 'SHA-256 matches Node for a ' + s.length + '-character string');
for (let i = 0; i < 200; i++) { const id = crypto.randomBytes(16).toString('hex'); assert.equal(boardId(id), node(BOARD_HASH_PREFIX + id).slice(0, 32)); }

const guest = '0123456789abcdef0123456789abcdef';
assert(isGuestId(guest) && /^[a-f0-9]{32}$/.test(boardId(guest)), 'a guest key is 32 hex characters (fits the database rules)');
assert.notEqual(boardId(guest), guest, 'a guest is never listed under their device id');
assert.equal(boardId(guest), boardId(guest), 'the same device always gets the same key');
assert.equal(boardId('Xy3kQ9uidFromGoogleSignIn12'), 'Xy3kQ9uidFromGoogleSignIn12', 'a signed-in uid stays as it is');

// The game posts and reads every board through boardKey(), never the raw device id.
const page = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert(!/'(?:daily|monthly|survival)\/'[^;\n]*\+\s*deviceId\b/.test(page), 'no leaderboard path is built from deviceId');
assert(!/r\.id === deviceId/.test(page), 'leaderboard rows compare with boardKey(), not deviceId');
assert(/path:'daily\/'\+daily\.date\+'\/'\+boardKey\(\)/.test(page) && /'survival\/'\+boardKey\(\)/.test(page), 'Daily and Survival post under boardKey()');
// The migration moves old entries to hashed keys, keeps the better Survival score, leaves uid / already-hashed entries alone.
const { planBoard, planAll } = await import('./migrate-board-ids.mjs');
const other = 'fedcba9876543210fedcba9876543210';
{
  const plan = planAll({
    daily: { '2026-11-20': { [guest]: { n: 'Sam', s: 250, a: [80, 85, 85], t: 1 }, Xy3kQ9uidFromGoogleSignIn12: { n: 'Ann', s: 200, a: [60, 70, 70], t: 1 } } },
    survival: { [guest]: { n: 'Sam', s: 9, t: 1 }, [boardId(guest)]: { n: 'Sam', s: 12, t: 2, h: 1 }, [other]: { n: 'Kim', s: 20, t: 1 } },
  });
  assert.deepEqual(plan['daily/2026-11-20/' + boardId(guest)], { n: 'Sam', s: 250, a: [80, 85, 85], t: 1, h: 1 }, 'a Daily entry moves to its hashed key');
  assert.equal(plan['daily/2026-11-20/' + guest], null, 'and the raw-id entry is removed');
  assert(!('daily/2026-11-20/Xy3kQ9uidFromGoogleSignIn12' in plan), 'signed-in entries are left alone');
  assert.equal(plan['survival/' + guest], null, 'an old Survival entry is removed');
  assert(!(('survival/' + boardId(guest)) in plan), 'a better hashed Survival entry is kept as it is');
  assert.equal(plan['survival/' + boardId(other)].s, 20, 'a Survival entry with no hashed twin moves');
  const again = planBoard({ [boardId(guest)]: { n: 'Sam', s: 12, t: 2, h: 1 } }, { best: true });
  assert.deepEqual(again, {}, 'running it again changes nothing');
  const better = planBoard({ [guest]: { n: 'Sam', s: 30, t: 1 }, [boardId(guest)]: { n: 'Sam', s: 12, t: 2, h: 1 } }, { best: true });
  assert.equal(better[boardId(guest)].s, 30, 'a better old Survival score replaces the hashed one');
}

console.log('PASS: leaderboard keys are a one-way SHA-256 of a guest device id (matches Node, stable, 32 hex), signed-in uids unchanged, and the game never posts or reads a board under the raw device id.');
