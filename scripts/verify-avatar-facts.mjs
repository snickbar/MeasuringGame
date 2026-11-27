// Every avatar needs a fun fact (shown at Avatar Level 1), and none may be empty or too long for the card.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { AVATAR_FACTS } from '../anim/avatar-facts.mjs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const tiers = html.slice(html.indexOf('const AVATAR_TIERS'));
const ids = [...tiers.slice(0, tiers.indexOf('};')).matchAll(/(av\d+):\s*"/g)].map((m) => m[1]);
assert.ok(ids.length > 300, 'could not read the avatar list');
const missing = ids.filter((id) => !AVATAR_FACTS[id]);
assert.deepEqual(missing, [], `avatars without a fun fact: ${missing.join(', ')}`);
const stray = Object.keys(AVATAR_FACTS).filter((id) => !ids.includes(id));
assert.deepEqual(stray, [], `facts for avatars that do not exist: ${stray.join(', ')}`);
const long = ids.filter((id) => AVATAR_FACTS[id].length > 90);
assert.deepEqual(long, [], `fun facts too long (90 max): ${long.join(', ')}`);
console.log(`Avatar facts check passed: ${ids.length} avatars, all have a fun fact.`);
