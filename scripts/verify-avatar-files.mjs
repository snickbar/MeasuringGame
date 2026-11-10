// Every avatar the game knows about must have its picture, and every avatar picture must belong to an avatar.
// Pictures are .webp (the game looks for avatars/<id>.webp); a new avatar saved as .png, or left out of the lists, fails here.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const section = (re, what) => { const m = html.match(re); assert(m, `Could not find ${what} in index.html`); return m[1]; };

const tiers = new Set(section(/const AVATAR_TIERS = \{([\s\S]*?)\n  \};/, 'AVATAR_TIERS').match(/\bav\d+(?=:)/g));
const names = new Set(section(/const BOT_NAME_BY_AVATAR = \{([\s\S]*?)\n  \};/, 'BOT_NAME_BY_AVATAR').match(/\bav\d+(?=:)/g));
const files = fs.readdirSync('avatars');

const problems = [];
for (const f of files) if (!/^av\d+\.webp$/.test(f)) problems.push(`avatars/${f} is not an avatar picture named avNNN.webp (new art must be converted to WebP)`);
const pictures = new Set(files.filter((f) => /^av\d+\.webp$/.test(f)).map((f) => f.slice(0, -5)));
for (const id of tiers) if (!pictures.has(id)) problems.push(`${id} is in the game but avatars/${id}.webp does not exist`);
for (const id of pictures) if (!tiers.has(id)) problems.push(`avatars/${id}.webp has no rarity in AVATAR_TIERS (left over, or not added yet)`);
for (const id of tiers) if (!names.has(id)) problems.push(`${id} has no bot name`);
for (const id of names) if (!tiers.has(id)) problems.push(`${id} has a bot name but no rarity`);

assert.equal(problems.length, 0, '\n' + problems.join('\n'));
console.log(`pass: ${tiers.size} avatars, each with a rarity, a name and a .webp picture`);
