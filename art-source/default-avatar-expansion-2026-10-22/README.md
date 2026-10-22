# Default avatar expansion and review concepts

The built-in image-generation tool created twelve new transparent avatars, with the existing game avatars as style references. The complete prompt set and original generated paths are in `generation.json`; the raw PNGs are preserved here. The game exports use the generated alpha, crop only empty transparent canvas, and fit the artwork into a 256px transparent square. No existing avatar image is overwritten.

- av314–315: Curly Kai and Bookish Bea (two kids).
- av316–317: Silver Skye and Freckle Frank (two adults).
- av318–319: Grandma Mei and Grandpa Dev (two grandparents).
- av320–322: a platypus, pangolin and Malayan tapir.
- av323–325: a backpack, closed book and artist’s palette.

The full previous avatar roster was checked before choosing subjects: the originally considered otter, rabbit and turtle were rejected because they were already represented. The selected three animal species and three object subjects are new to the avatar roster. People have different combinations of age, hair, facial features and clothing. The first boy’s eyes were revised to match the set’s simple dark oval eyes.

All twelve additions are Default/free. `previous-tiers.json` captures the previous registry; every previous tier is unchanged. The review page (`anim/avatar-tier-review.html`) includes exactly 42 Default and 123 Common avatars, supports group changes and two-card position/group swaps, and exports a validated JSON file. Rare and Ultra are excluded from both the displayed data and allowed imports. The page does not change the live registry.

Four proposed object revisions are stored separately in `anim/artwork-candidates-2026-10-22-v3/`. They use the existing object art as references, preserving the grey minivan, airliner direction, Notre-Dame tower facade and London Eye identity. Their prompts are also in `generation.json`. These are previews only; `items/` images, object dimensions and orientation settings are unchanged. `anim/artwork-comparison.html` presents original/proposed pairs with zoom, inspection backgrounds, choices and JSON export.

`anim/mode-identity-mockups.html` is a standalone HTML/CSS concept using the game’s actual art and Fredoka font. Six mode families each have start, question and result previews. No mode styling is applied to the actual game.

The implemented discovery feature records first encounters atomically with completed-round receipts. Previously seen objects are not reclassified as new. Both sides count; completed missed and abandoned rounds count, but discovery never finishes/wins a game. Recent objects appear on the existing Objects page, and each finished session can show a compact strip inside its existing result card. Object popups show available appearance counts, without measurements. Profile normalization retains the new metadata. Tests cover transaction retries, older profiles, session scope, actual profile loading/UI, safe swaps and every review image at phone widths.
