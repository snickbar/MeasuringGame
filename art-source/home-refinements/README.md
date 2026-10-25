# Home scene refinements, October 25, 2026

The PNGs here are image-generation originals. Source artwork and this
documentation do not ship; the game uses lossless WebP versions.

- `robot-arm-open.png`: generated against `anim/home-art/top/toy-box-arm.webp`.
  Requested the same illustrated arm, shoulder/elbow geometry and colors, with
  an open blue hand and extended rounded robot fingers instead of a closed fist.
  The open variant appears only once the waving arm is raised.
- `corgi-bowl.png`: generated against `anim/home-art/hero2-corgi.webp`.
  Requested one matching red bowl with all loose kibble contained inside the rim,
  without airborne food or motion streaks. Its runtime placement follows the
  existing stack; the food alone rattles inside a fixed clipping region on tap.
- `sliding-penguin.png`: generated against `anim/home-art/top/penguin-base.webp`.
  Requested one friendly belly-sliding penguin facing left, matching the main
  character's charcoal outlines, soft shading, cream belly and pale yellow cheek.
  No ground, shadow, glow or scenery, with actual alpha transparency. Runtime:
  `anim/home-art/critter-penguin-a.webp`. The complete normalized prompt and
  updated alpha bounds are in `anim/home-art/manifest.json`; the layout is rebuilt
  with `node scripts/build-home-art-layout.cjs`. Sliding timing and depth remain
  unchanged.

`scripts/refine-home-cutouts.py` preserves original dimensions and RGB while
removing the low-alpha matte fringe on solid moving cutouts. Smoke, flame and
other translucent effects are excluded. Local originals are archived in the
ignored `before-matte-cleanup/` folder; Git retains the original assets too.

Motion is maintained in `anim/home-motion.mjs` and `.css`, rather than generated
rig metadata. The cube slice uses a five-sided CSS cuboid so real side faces turn
into view. All other moving pieces use existing illustrated artwork. The castle
occlusion layer is a stationary clipped copy of its background plate.

Validation: all sixteen scenes rendered at phone size; idle and both tap gestures
sampled visually. Browser checks cover 320/390/430 px widths, lower-block hit
coverage, open/closed robot hand, lamp states, layer ordering, fresh tap timing,
reduced motion and navigation cleanup.

## Complete stack layers and return routes

`layers-*.png` are new built-in image-generation originals. Each of the eight
two-cell sheets contains a complete lower stack and a completely separate top
object. The top object contains no part of the next object down. The dog bowl
cell is empty; `layers-kibble.png` supplies individual animated food pieces.
`layers-robot-palm.png` corrects the hand's palm/thumb orientation.

Normalized generation prompts and selected original paths are recorded in
`layers-generation.json`. `scripts/register-home-layers.py` converts these PNGs
to lossless WebP without changing their alpha, and measures the independent cell
bounds in `anim/home-layer-sheets.mjs`. `anim/home-layer-art.mjs` assembles them
using CSS cell selection and anchors, avoiding cuts through assembled artwork.
The coin uses its circular face cell on the front/back of a cylinder with a gold
edge. The two ladybug wings hinge independently using existing artwork.

Wandering sprites alternate between an original and mirrored route, preserving
their facing direction automatically. The two picnic ants share one route and
follow one another in front of the objects. The toy ball uses existing beach-ball
art and bounces behind the toys. The sliding penguin is deliberately excluded from
return routes: it descends from the right-hand hill and then travels left.

Validation covers complete stationary stacks, independent source cells, 23
separate food pieces behind the front bowl rim, exactly one visible frame per ant,
mirrored crossings, satellite/bird depth, bouncing ball height, downhill travel,
two-sided coin geometry, and phone widths of 320/390/430 pixels.
