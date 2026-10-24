# Top character animation art

Additional home-scene animation source artwork, generated using the built-in image generator from `Top-Character-Art-Prompts.txt` and the current `anim/home-art/*.webp` references.

Open `index.html` to review the available PNGs by scene. The page supports checkerboard, white, magenta, dark blue, and green backgrounds and enlarged previews. `manifest.json` records sources, prompts, image dimensions and alpha bounds. Per-image `.png.json` files preserve the generation record.

## Approved adjustments

The user approved adding missing features: open eyes on the top soda can, a porthole on the launch rocket, a small antenna on the robot, and a visible corgi tail. Matching base variants are included separately rather than replacing runtime files.

Some original blink prompts described poses already present in the references. The user approved opposite poses. Use these filenames instead:

| Original requested filename | Actual counterpart |
| --- | --- |
| top-games-blink.png | top-games-eyes-open.png |
| top-corgi-blink.png | top-corgi-eyes-open.png |
| top-underwater-blink.png | top-underwater-eyes-open.png |
| top-dragon-blink.png | top-dragon-eyes-open.png |
| top-town-door-open.png | top-town-door-closed.png |

## Integration

These are source illustrations, not a completed animation rig. Generated images are not guaranteed pixel-identical outside the edited region. Small parts may use different canvas sizes and scales; register them against the matching base using their visible alpha bounds, with a local attachment point. Test each combination for seams, jumps and exposed gaps before shipping.

Use the added-feature bases for the corresponding blink, glint, light and tail animations. The existing corgi is the no-tail base. For the Space waving arm, the intended moving part is the viewer-right arm of the top crocodile.

Effect sheets use separate frames with transparent gutters. Suggested grid cells in the manifest must be visually checked and may need local anchor adjustments; they are not a claim of identical frame registration or timing.

PNG alpha is preserved; no magenta background removal is needed. Keep original source PNGs outside the app package if making smaller runtime WebP versions. The live game and APK have not been changed by this asset-generation task.

This Git folder includes the 72 selected PNGs, review gallery, original prompts, generation records and manifest. Superseded attempts and local QA tools remain in `output/top-character-art/` and are intentionally excluded here. This source folder is outside the runtime packaging directories, so these original PNGs do not increase the APK size until runtime versions are integrated.
