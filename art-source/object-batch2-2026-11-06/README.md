# Object artwork batch 2

105 individual transparent object illustrations, generated with the built-in image generation tool using the game's apple, coffee mug, ice cube and teacup as style references; animals also use the elephant reference.

The full supplied prompt set and sizes are in `manifest.json`. Existing names and IDs come from `../object-batch-2026-11-06/spec.json`; where sizes differ, this review uses the user's latest pasted prompts.

Original PNGs are kept here. `preview/` contains 512-pixel transparent copies for faster phone loading. Run `node scripts/build-object-batch2-review.cjs` from the project root to refresh the previews and picker data.

The separate orientation picker is `anim/object-review-batch2.html`. It contains only these 105 objects, uses separate browser storage, and exports `size-em-up-object-picks-batch2.json` tagged with this batch ID. Older picker exports are rejected here to prevent unrelated drafts from mixing in.

These are review assets, not active gameplay objects. No live catalog, Worlds, challenges, saved game orientations, or flair artwork is changed by this batch.

Review refinements requested during generation: natural closed mouths/beaks on the walrus, toucan and parrot; long loose tools upright rather than diagonally posed. Keep detail levels simple and readable at small sizes.
