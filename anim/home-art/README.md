# Home animation artwork

Generated with the built-in image_gen tool, using the existing `home-*.jpg` files as reference images. The local review gallery and full generation records remain in `output/home-animation-art/`; this repository folder contains the 83 selected PNGs and integration metadata.

## Contents

- `hero-*.png`: main character or stack, with real alpha transparency.
- `hero2-*.png`: second foreground object, with real alpha transparency.
- `plate-*.png`: opaque scene with both foreground subjects removed.
- `critter-*-a.png` / `critter-*-b.png`: separate transparent wandering sprites.
- `manifest.json`: filenames, reference scene, generation prompts, image dimensions and visible alpha bounds.
- `shared-sprites.json`: individual cloud bounds, six coin-view bounds and eight sparkle-motif cells. The coin views have unequal horizontal spacing, so use these rectangles instead of assuming six equal cells.

## Assembly notes for Claude

These are separate artwork candidates, not installed game assets. Original game pictures and application code are unchanged.

Generated sprites have different canvas dimensions and transparent margins. They are not pixel-aligned full-canvas drop-in replacements. Use each sprite's `alphaBounds` (alpha > 128) to fit the visible subject to the corresponding foreground object's bounds in the original reference. Preserve the sprite's aspect ratio; align its bottom and center within the placement guide rather than stretching it. `targetBoundsInReference` gives approximate placement guides in the original 704 x 1520 reference coordinate system. Compare the assembled scene with the original and refine positioning before enabling animations.

Background plates closely follow the reference scene but are AI reconstructions, not pixel-identical inpainting. Check the composite visually. Keep original JPGs as fallbacks. Animate these layers in code; the PNG files themselves are static.

No magenta-key removal is needed. Preserve the actual alpha channel. Apparent glow in the image generator's dark preview is not necessarily visible when properly alpha-composited; use the gallery and QA sheets to inspect the actual PNGs on solid backgrounds.

The complete set contains 16 scenes with five assets each, plus three shared effect sheets (83 assets total). Both original and normalized generation prompts are included in the manifest. The normalized prompts request true transparency instead of a magenta key color.

Generation prompts are preserved per asset in `manifest.json`.

## Packaging

The current production file list includes all 83 PNGs under this directory in the APK and live-update bundle. Markdown and JSON documentation are kept in Git for integration and are excluded from runtime packaging by the existing production-file rules. If future game code fetches these JSON files at runtime, explicitly add those files to the production allowlist. No game screen is switched to this artwork yet.
