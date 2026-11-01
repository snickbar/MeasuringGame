# Survival jointed animation art

Generated with the built-in `image_gen` tool on 2026-11-01. Transparent PNG sources are retained here; the runtime uses transparent WebP sheets in `icons/`.

- `knight-parts.png` → `icons/survival-knight-parts-v2.webp`
- `dragon-parts-v3.png` → `icons/survival-dragon-parts-v2.webp`
- Sheet coordinates and overlapping hinges: `anim/survival-rigs.mjs`.
- Sword flourish / mouth opening, sustained fire and burning-X timing: `anim/which-bigger-summary.css`.

The dragon's cheek, upper jaw and throat remain fixed. Only the lower jaw and tongue rotate. The arm and jaw roots overlap their sockets, and the complete scene scales proportionally on narrow phones. No new sounds were added.

## Straight sword correction (November 1 follow-up)

Built-in `image_gen` editing was used to straighten the blade, grip and pommel onto one axis. Final transparent source: `knight-straight-sword.png`; runtime encoding: `icons/survival-knight-parts-v3.webp` (1774 × 887, WebP quality 0.96, alpha preserved). Only the corrected right-hand arm crop is used from this new sheet. The body still uses the original v2 sheet, so its artwork is unchanged. The arm crop now starts at y=80 to retain the entire blade tip; its shoulder pivot remains (1605,650) in source coordinates and the same position in the assembled character.

The first edit requested a straight common blade/grip/pommel axis while preserving the arm, hand and body. The final correction prompt, using that first edit as its reference, was:

> Correct the RIGHT sword only. The current sword blade still bends left at the hilt! It must be almost VERTICAL directly above the gold pommel, all on one line. On this 1774x887 canvas, place the sword TIP roughly at x1320 y115, the middle of the gold crossguard at x1355 y450, and the gold bottom pommel remains at x1370 y575. These three points lie on one straight axis. The blade must lean only very slightly to the left, about 6 degrees from vertical. Currently it leans about 25 degrees, which is wrong. Rotate/redraw the blade around its base to bring its tip RIGHTWARD until it is above the grip and pommel. Make the gold crossguard nearly horizontal and perpendicular to this nearly vertical sword. Keep silver blade width, length, cartoon shading and outline matching. Leave the hand, armored arm, shoulder and the whole knight on the left entirely unchanged. Do not redraw other parts. Same canvas, transparent background, no text.

The burning X reuses the existing `survival-dragon-flame.webp` as three upward flame tongues. Its ignition follows the first fire impact at 2.4 seconds; the stream stays visible for about five seconds. These visual loops never replay life deductions, shield spending, rewards or impact sounds.

## Knight generation prompt

Reference: `icons/survival-knight-cheer.webp`.

Create a production cartoon game animation sprite sheet, landscape 2:1 canvas divided into TWO equal square cells side by side, transparent background. Reference is the existing cute closed-helmet silver knight with red plume, blue shield and white star. Match that exact simple glossy friendly game illustration style, dark brown outline, no skin or eyes. LEFT CELL: draw the whole same knight in the same standing three-quarter view, feet apart on baseline 94% down the cell, blue star shield raised in the hand on viewer RIGHT. OMIT ONLY his sword-holding arm on viewer LEFT, including sword and hand; instead leave a round silver shoulder socket on the left upper torso, seamlessly attached to chest. All other body parts intact and complete. RIGHT CELL: draw ONLY the missing sword-holding arm as one connected separate piece: round silver shoulder cap at its lower-right end, bent silver upper arm and forearm, metal gauntlet gripping golden hilt, complete silver sword extending upward-left as in reference. This separate piece will rotate about its shoulder to swing sword and lift it. Include generous circular shoulder cap overlap so it never disconnects. Whole arm and whole sword fully inside its cell. No body or other parts in this right cell. Both pieces should be large and crisp with generous margin and nothing touching across cells. Transparent alpha background. No text, grid lines, labels, decorations, floor or shadows. Do NOT draw a full second knight.

## Dragon generation and correction

Reference: `icons/survival-dragon-breathe.webp`. A right-facing green baby dragon sheet was generated with a fixed upper head/body and a separate lower-jaw piece. The fixed lower lip was removed in a second edit. The final edit follows the user's correction that only the lower jaw and tongue may move.

Final edit prompt:

Precise sprite sheet edit. Keep the entire large LEFT dragon EXACTLY unchanged in its current position, size and pixels as far as possible. Replace ONLY the isolated piece on the RIGHT. That right-hand part must consist ONLY of a slim lower jaw/chin and its pink tongue resting on it. Draw a narrow curved green lower chin strip with a pale green lower lip, and a simple soft pink tongue following the jaw. It should be a shallow scoop, about THREE times as wide as tall. Hinge/root at LEFT, chin tip at RIGHT, matching the dragon's right-facing side view and its outline/colors. NO big round green cheek at the hinge. NO red triangular mouth cavity. NO upper lip or upper jaw, NO throat, NO wall of mouth lining, NO tall membrane between the root and tip. Only the lower jaw and tongue will rotate; the cheek, upper jaw and throat are already on the fixed dragon head. The isolated piece should stay in the right-hand empty area, with generous transparent margin, and not touch the main dragon. No labels, marks, writing, shadow or background. Fully transparent alpha.
