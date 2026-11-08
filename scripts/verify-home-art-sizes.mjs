// The Home scene cannot appear until every picture on it has been downloaded and decoded, so the wandering creatures are
// stored at the size they are drawn at (scripts/shrink-home-critters.py), not at the size they were generated.
// This keeps new or replaced creature art from quietly undoing that.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { HOME_ART } from '../anim/home-art-layout.mjs';

// The pixel size of a WebP file, read from its header (extended, lossless or plain).
export function webpSize(bytes) {
  assert(bytes.length > 30 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP', 'Not a WebP file');
  const kind = bytes.toString('ascii', 12, 16);
  if (kind === 'VP8X') return { width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) };
  if (kind === 'VP8L') { const bits = bytes.readUInt32LE(21); return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff) }; }
  if (kind === 'VP8 ') return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  throw new Error('Unknown WebP chunk ' + kind);
}

// The header reader, on files built by hand for each of the three layouts.
function header(kind, fill) {
  const bytes = Buffer.alloc(40); bytes.write('RIFF', 0, 'ascii'); bytes.writeUInt32LE(32, 4); bytes.write('WEBP', 8, 'ascii'); bytes.write(kind, 12, 'ascii'); fill(bytes); return bytes;
}
assert.deepEqual(webpSize(header('VP8X', b => { b.writeUIntLE(1401, 24, 3); b.writeUIntLE(1121, 27, 3); })), { width: 1402, height: 1122 });
assert.deepEqual(webpSize(header('VP8L', b => { b[20] = 0x2f; b.writeUInt32LE(351 | (281 << 14), 21); })), { width: 352, height: 282 });
assert.deepEqual(webpSize(header('VP8 ', b => { b.writeUInt16LE(640, 26); b.writeUInt16LE(480, 28); })), { width: 640, height: 480 });
assert.throws(() => webpSize(Buffer.alloc(40)), /Not a WebP file/);

const dir = new URL('../anim/home-art/', import.meta.url);
const sizeOf = file => webpSize(fs.readFileSync(new URL(file, dir)));
// Sprite sheets the game crops by pixel position (anim/home-new-art.mjs) keep their full size.
const SHEETS = new Set(['critter-holiday-mix-a.webp', 'critter-make-believe-a.webp']);
const MAX_WIDTH = 400, MAX_HEIGHT = 600; // the largest creature is drawn about 350 px wide on a 1700 px wide Home picture

let checked = 0;
for (const [scene, art] of Object.entries(HOME_ART)) {
  for (const critter of art.critters || []) {
    const { width, height } = sizeOf(critter.file);
    if (SHEETS.has(critter.file)) {
      assert.deepEqual({ width, height }, { width: critter.w, height: critter.h }, `${critter.file} is cropped by pixel position and keeps its size`);
      continue;
    }
    assert(width <= MAX_WIDTH && height <= MAX_HEIGHT, `${scene}: ${critter.file} is ${width}x${height}; run python3 scripts/shrink-home-critters.py`);
    // The game places a creature by percentages of the original picture, so the shape must not change.
    assert(Math.abs(width / height / (critter.w / critter.h) - 1) < 0.01, `${scene}: ${critter.file} has a different shape than the layout expects`);
    checked++;
  }
}
assert.equal(checked, 32, 'Every wandering creature picture except the two sprite sheets is checked');

// The shrink script's table is what the files hold.
const script = fs.readFileSync(new URL('../scripts/shrink-home-critters.py', import.meta.url), 'utf8');
const table = [...script.matchAll(/'([a-z-]+-[ab])': \((\d+), (\d+)\)/g)];
assert.equal(table.length, checked, 'The script lists exactly the pictures that are checked here');
for (const [, name, width, height] of table) assert.deepEqual(sizeOf(`critter-${name}.webp`), { width: +width, height: +height }, `${name} is stored at the size the script says`);

console.log(`Home art sizes: ${checked} creature pictures are stored at their drawn size, the two sprite sheets keep theirs, and the header reader works.`);
