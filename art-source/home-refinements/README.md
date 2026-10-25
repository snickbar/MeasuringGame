# Home scene refinements, October 25, 2026

The two PNGs here are image-generation originals. Runtime versions are WebP in
`anim/home-art/refined/`; source artwork and this documentation do not ship.

- `robot-arm-open.png`: generated against `anim/home-art/top/toy-box-arm.webp`.
  Requested the same illustrated arm, shoulder/elbow geometry and colors, with
  an open blue hand and extended rounded robot fingers instead of a closed fist.
  The open variant appears only once the waving arm is raised.
- `corgi-bowl.png`: generated against `anim/home-art/hero2-corgi.webp`.
  Requested one matching red bowl with all loose kibble contained inside the rim,
  without airborne food or motion streaks. Its runtime placement follows the
  existing stack; the food alone rattles inside a fixed clipping region on tap.

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
