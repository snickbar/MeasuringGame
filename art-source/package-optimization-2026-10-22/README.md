# Production package optimization

The original PNGs remain recoverable from the source commit recorded in
`verification.json`. Every changed file keeps its PNG format, dimensions,
color mode, decoded pixels and all non-IDAT chunks (including color profiles).
Only the compressed pixel stream changes. No sprites were resized or redrawn.

598 PNGs decreased from 67,810,062 to 62,098,381 bytes. Browser canvas comparison
confirmed identical rendered pixels for all 598. A paired desktop Chromium
benchmark using preloaded blobs measured aggregate median decoding of 589 ms
before and 553 ms after. This is a desktop measurement, not a phone benchmark;
the runtime image format, dimensions and rendering code are unchanged.

`scripts/production-files.cjs` is the runtime manifest. It keeps the current
scenery, code, artwork, selected sounds, fonts and their license, home screens,
app links and share image. Review tools, rejected alternatives, three obsolete
scenery images, unused sound files and design metadata remain in the repository
but do not ship in the APK or live update.

`www/` is generated native input. `hosting/` is generated from those same files
plus `live/`, and is now Firebase's public directory. Keeping Hosting staging
separate prevents accidentally packing the update ZIP inside an APK. The local
development server still exposes the original source and review pages.

A comparable ZIP measurement decreased from 117,524,827 to approximately
98.9 million bytes (about 16%). Exact archive sizes vary slightly by ZIP tool,
timestamps and the generated build-version file. The generated Windows update
archive was checked for CRC integrity, correct root paths, app links and its
SHA-256 manifest checksum.

Verification: full `npm test`; production dependency/sound/scenery manifest
checks; full-game isolated browser tests serving `www/` at 320, 390 and 430 px;
all-image rendered-pixel and decoding checks. Optional PNG preparation uses
`scripts/optimize-png-losslessly.py`; normal production builds require no Pillow.
