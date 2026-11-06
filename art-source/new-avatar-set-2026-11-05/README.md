# New avatar artwork

Twelve individual transparent PNG avatars generated with the built-in image_gen tool from the user's supplied prompts. These are review assets; no avatar IDs, rarity tiers, bot names or live catalog entries have been assigned.

Open [review.html](review.html) to compare all twelve, switch preview backgrounds, inspect 32/48/64-pixel samples and save review notes. Each large image opens its original PNG.

- `prompts.txt`: the original prompt set.
- `manifest.json`: selected filenames, prompts and reference information.
- `image-checks.json`: square-canvas, alpha transparency and unclipped-edge checks.
- Revised selections: `big-robot-suit-v3.png` follows the attached full-body cockpit mech layout in smooth cartoon art; `starfish-v2.png` has a gentler face; `basketball-sneaker-v2.png` has no face; `munchkin-calico-cat-v2.png` stands on four visible stubby legs. Earlier versions are retained.
- `revision-prompts.json` contains the four revision prompts; `reference-mech-layout.png` is the user's structural reference for the robot.

Style references: `avatars/av314.png`, `avatars/av315.png`, `avatars/av02.png` and `avatars/av05.png`. The female explorer additionally references the generated male explorer to keep their outfits consistent.

Review notes save automatically in the current browser, with an explicit **Save notes** button and visible status. They do not modify the artwork or sync to another browser/device. **Download notes backup** saves a portable JSON copy; **Restore notes backup** imports it. Keep that file when moving between a downloaded HTML page, a hosted preview or another device. If storage is blocked, the page reports it and retains a tab backup when possible. An HTML preview with scripts disabled cannot save notes; open the page in a regular browser.
