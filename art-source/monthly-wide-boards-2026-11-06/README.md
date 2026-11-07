# Wider monthly question boards

12 new PNG illustrations redraw the existing monthly boards at exactly 2:1. These were generated from the supplied prompts using the corresponding live board as a visual reference; no existing artwork was stretched.

Papel Picado, Spring Meadow and Love Letters were generated first. The other nine optional boards are included too. Designs preserve the existing palette, style and motifs while following the requested edge/corner placement changes and keeping broad writing areas clear.

Open `index.html` to compare each original with its new wide redraw and optionally overlay a sample question. Click any new board for its full PNG. Original reference copies are in `originals/`; the live `monthly/art/` files remain untouched. The supplied fox-pose prompts are archived with the pasted request but were outside this board-only task.

`manifest.json` lists the selected final PNG for each month, its original reference and the user's prompt. `review/dimensions.json` records the verified dimensions and 2:1 ratios. Pool Deck's `-v2.png` removes an unintended clock; the earlier attempt is retained only as generation history and is excluded from the final ZIP.

White outer backgrounds are retained as requested; the board interiors remain colored and opaque. The boards are source assets for review, not active gameplay replacements yet. Run `node scripts/build-wide-board-review.cjs` to rebuild comparisons and dimension checks.
