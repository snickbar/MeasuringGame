# Flying Home dragon refinement

Generated with the built-in imagegen tool on October 31, 2026, using `home-dragon.jpg` for style and `critter-dragon-b.webp` for the right-facing flight pose.

The old flying sprite was a flat silhouette without an eye, mouth, scale spots or wing ribs. This sheet supplies three complete independent pieces: detailed wingless body, near wing, far wing. Roots overlap behind the intact body; no facial, tail or foot pixels are cut out for animation.

Prompt: create a friendly glossy green baby dragon with open expressive eye, smiling muzzle, nostril, cream belly, ivory horns, dorsal spikes and simple scale spots, facing right with tucked legs and tail curling left. Keep the whole wingless body in one piece. Draw two independent complete green wings with cream membranes and rib lines, with generous fleshy roots. Separate all three pieces on a fully transparent wide sheet with no labels, shadows, background or overlap. Match the existing cozy mobile-game scene and keep details readable at small size.

Source sheet: 2172 × 724 PNG. Runtime sheet: `anim/home-art/flying-dragon-parts-v2.webp`.

Source crop rectangles `[x,y,width,height]`:

- Body: `[23,106,878,490]`
- Near wing: `[906,92,649,496]`
- Far wing: `[1673,161,476,362]`

Placement and hinge metadata live in `anim/home-flight.mjs`.
