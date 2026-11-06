# Object artwork batch 2

105 individual transparent object illustrations, generated with the built-in image generation tool using the game's apple, coffee mug, ice cube and teacup as style references; animals also use the elephant reference.

The full supplied prompt set and sizes are in `manifest.json`. Existing names and IDs come from `../object-batch-2026-11-06/spec.json`; where sizes differ, this review uses the user's latest pasted prompts.

Original PNGs are kept here. `preview/` contains 512-pixel transparent copies for faster phone loading. Run `node scripts/build-object-batch2-review.cjs` from the project root to refresh the previews and picker data.

The separate orientation picker is `anim/object-review-batch2.html`. It contains only these 105 objects, uses separate browser storage, and exports `size-em-up-object-picks-batch2.json` tagged with this batch ID. Older picker exports are rejected here to prevent unrelated drafts from mixing in.

The user's completed November 6 review is saved in `approved-choices.json`. All 105 objects were reviewed; 71 have orientation changes. The picker builder validates and applies these settings after generating its initial defaults, so rebuilding preserves the approved choices. Sizes, measurement dimensions, and travel styles match the supplied batch defaults.

All 105 approved objects are active in the standard gameplay pool with production WebP artwork, scenery and Worlds assignments from the live integration. Measurements, orientations and travel styles match the approved export. Seven picker IDs map to their established live IDs through `anim/object-batch2-ids.mjs`. Run `node scripts/activate-object-batch2.mjs` to reapply the approved settings. The isolated batch picker remains available for reviewing the source artwork.

Review refinements requested during generation: natural closed mouths/beaks on the walrus, toucan and parrot; long loose tools upright rather than diagonally posed. Keep detail levels simple and readable at small sizes.
