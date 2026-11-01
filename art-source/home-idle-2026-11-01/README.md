# Kitchen idle animation artwork

Generated with the built-in `image_gen` tool on November 1, 2026, using `anim/home-art/plate-house.webp` as the reference. PNG sources are retained here. Runtime WebP encodings preserve the utensil alpha and use quality 0.94:

- `kitchen-clean.png` → `anim/home-art/idle/kitchen-clean.webp` (854 × 1842).
- `kitchen-utensils.png` → `anim/home-art/idle/kitchen-utensils.webp` (2172 × 724).

Independent utensil crops are in `anim/home-idle-art.mjs`. The hanging holes pivot at 50% / 6% of their own cells; placement fits their source aspect ratios so bottom alignment cannot move the holes away from the rack pegs. All tools remain behind the foreground cans and fridge.

## Clean-wall prompt

Edit this exact portrait cartoon kitchen background plate. Remove ONLY the three utensils hanging on the wooden rack at the middle right: the whisk, slotted spatula and ladle, including their handles and their shadows. Restore the white tiled wall behind those three utensils seamlessly, with the same grout lines, tile edges, shading and perspective as adjacent tiles. Keep the wooden rack and its little mounting pegs/hooks intact. Leave the rest of the kitchen completely unchanged: lamp and light cone, tile wall everywhere else, herb pot, counter, cabinets, floor. Same tall portrait canvas, exact framing, no new objects, text or decoration. This clean wall will have separately animated utensils layered onto it.

## Utensil-sheet prompt

Create ONE transparent cartoon animation sprite sheet containing only the THREE hanging kitchen utensils from the reference kitchen picture. Match their exact simple softly shaded cozy mobile-game cartoon style and dark brown outlines. Three separate tools in a horizontal row, generously spaced with no touching: LEFT a silver wire whisk with a warm wood-brown handle; CENTER a silver slotted spatula/turner with a muted purple handle; RIGHT a silver round ladle with a teal-blue handle. Each tool hangs perfectly upright, handle at the top with a small rounded hanging hole, metal working end at the bottom. Every tool fully inside its own equal-width cell, similar total height, generous transparent margins all around. No rack, hooks, wall, shadows, background, text, labels, stars or other items. These independent pieces will swing around the top of their handles.
