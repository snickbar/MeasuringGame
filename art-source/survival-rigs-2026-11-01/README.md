# Survival jointed animation art

Generated with the built-in `image_gen` tool on 2026-11-01. Transparent PNG sources are retained here; the runtime uses transparent WebP sheets in `icons/`.

- `knight-parts.png` → `icons/survival-knight-parts-v2.webp`
- `dragon-parts-v3.png` → `icons/survival-dragon-parts-v2.webp`
- Sheet coordinates and overlapping hinges: `anim/survival-rigs.mjs`.
- Single sword flourish / mouth opening and fire timing: `anim/which-bigger-summary.css`.

The dragon's cheek, upper jaw and throat remain fixed. Only the lower jaw and tongue rotate. The arm and jaw roots overlap their sockets, and the complete scene scales proportionally on narrow phones. No new sounds were added.

## Knight generation prompt

Reference: `icons/survival-knight-cheer.webp`.

Create a production cartoon game animation sprite sheet, landscape 2:1 canvas divided into TWO equal square cells side by side, transparent background. Reference is the existing cute closed-helmet silver knight with red plume, blue shield and white star. Match that exact simple glossy friendly game illustration style, dark brown outline, no skin or eyes. LEFT CELL: draw the whole same knight in the same standing three-quarter view, feet apart on baseline 94% down the cell, blue star shield raised in the hand on viewer RIGHT. OMIT ONLY his sword-holding arm on viewer LEFT, including sword and hand; instead leave a round silver shoulder socket on the left upper torso, seamlessly attached to chest. All other body parts intact and complete. RIGHT CELL: draw ONLY the missing sword-holding arm as one connected separate piece: round silver shoulder cap at its lower-right end, bent silver upper arm and forearm, metal gauntlet gripping golden hilt, complete silver sword extending upward-left as in reference. This separate piece will rotate about its shoulder to swing sword and lift it. Include generous circular shoulder cap overlap so it never disconnects. Whole arm and whole sword fully inside its cell. No body or other parts in this right cell. Both pieces should be large and crisp with generous margin and nothing touching across cells. Transparent alpha background. No text, grid lines, labels, decorations, floor or shadows. Do NOT draw a full second knight.

## Dragon generation and correction

Reference: `icons/survival-dragon-breathe.webp`. A right-facing green baby dragon sheet was generated with a fixed upper head/body and a separate lower-jaw piece. The fixed lower lip was removed in a second edit. The final edit follows the user's correction that only the lower jaw and tongue may move.

Final edit prompt:

Precise sprite sheet edit. Keep the entire large LEFT dragon EXACTLY unchanged in its current position, size and pixels as far as possible. Replace ONLY the isolated piece on the RIGHT. That right-hand part must consist ONLY of a slim lower jaw/chin and its pink tongue resting on it. Draw a narrow curved green lower chin strip with a pale green lower lip, and a simple soft pink tongue following the jaw. It should be a shallow scoop, about THREE times as wide as tall. Hinge/root at LEFT, chin tip at RIGHT, matching the dragon's right-facing side view and its outline/colors. NO big round green cheek at the hinge. NO red triangular mouth cavity. NO upper lip or upper jaw, NO throat, NO wall of mouth lining, NO tall membrane between the root and tip. Only the lower jaw and tongue will rotate; the cheek, upper jaw and throat are already on the fixed dragon head. The isolated piece should stay in the right-hand empty area, with generous transparent margin, and not touch the main dragon. No labels, marks, writing, shadow or background. Fully transparent alpha.
