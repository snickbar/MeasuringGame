import assert from 'node:assert/strict';
import { BUILT_IN_CODES, normalizeCode, codeReward, resolveCode, applyRedeem } from '../anim/redeem-codes.mjs';

assert.equal(BUILT_IN_CODES.THANKYOU.coins, 100, 'THANKYOU gives 100 coins');
assert.equal(normalizeCode(' thank-you '), 'THANKYOU', 'case, spaces and dashes are ignored');
assert.equal(normalizeCode(null), '');
assert.equal(normalizeCode('a'.repeat(50)).length, 20);

assert.deepEqual(resolveCode('THANKYOU', null), { coins: 100 });
assert.equal(resolveCode('NOPE', null), null, 'unknown code');
assert.deepEqual(resolveCode('SPRING', { coins: 250 }), { coins: 250 }, 'database code');
assert.equal(resolveCode('toString', null), null, 'object prototype names are not codes');
assert.equal(resolveCode('SPRING', { coins: 250, expires: 1000 }, 2000), null, 'expired');
assert.deepEqual(resolveCode('SPRING', { coins: 250, expires: 3000 }, 2000), { coins: 250 }, 'not yet expired');
assert.equal(resolveCode('SPRING', { coins: 250, active: false }), null, 'switched off');
for (const bad of [0, -5, 2.5, '12abc', 1e9, null, undefined]) assert.equal(codeReward({ coins: bad }), null, 'bad coins ' + bad);

const p = { coins: 40, redeemedCodes: { OLD: 1 } };
const first = applyRedeem(p, 'THANKYOU', { coins: 100 }, 777);
assert.equal(first.status, 'ok');
assert.equal(first.profile.coins, 140);
assert.deepEqual(first.profile.redeemedCodes, { OLD: 1, THANKYOU: 777 });
assert.equal(p.coins, 40, 'input profile untouched');
const again = applyRedeem(first.profile, 'THANKYOU', { coins: 100 }, 888);
assert.equal(again.status, 'used', 'second try is refused');
assert.equal(again.profile.coins, 140, 'no second payment');
assert.equal(applyRedeem({}, 'THANKYOU', { coins: 100 }, 1).profile.coins, 100, 'works on an empty profile');
console.log('PASS: redeem codes - normalising, built-in and database codes, expiry, one use per account.');
