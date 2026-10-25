# Make Believe and Holiday Mixup Home scenes

Approved concepts: a unicorn beside spell books; a snowman with bunny ears beside mixed holiday gifts, with a friendly ghost.

Original PNG artwork was created with the built-in image generator. `generation.json` records prompts, references and source outputs. These source files do not ship. Runtime art is lossless WebP with original alpha preserved. `scripts/register-new-home-art.py` converts whole images and measures independent atlas cells; it does not paint or cut parts out of assembled scenes. Run it before `node scripts/build-home-art-layout.cjs` when replacing the source art.

## Animation rules carried forward

- Clean plates contain no moving foreground subjects. Never reveal a mismatched static picture before the decoded scene is ready.
- Moving parts are complete isolated drawings, including attachment roots. Never animate a rectangular slice containing the background or the object underneath.
- Unicorn body, tail and ear are separate cells. The tail root overlaps behind the body; the ear overlaps at its base.
- Both lower stacks remain rigid. The complete closed/open top books share a contact point. The complete gift lid covers the opening at rest and lifts only when tapped.
- Keep the fairy and ghost behind both foreground subjects. The fairy travels both ways and mirrors with its route. The ghost peeks on both sides of the same gift stack and turns while occluded. Neither fades away halfway across its visible path.
- Protect the title and bottom buttons, preserve phone scaling, pause when Home is hidden, and honor reduced motion.

Placement and reactions live in `anim/home-new-scenes.mjs` and `.css`. Generated source bounds are in `anim/home-new-art.mjs`. Scene loading, ordering and lifecycle use the existing Home renderer.

Both homes use the existing World completion achievement and Style selection system. Claiming them preserves the currently equipped Home and remains idempotent.

## Verification

`npm run test:home` covers all 18 scenes at 320, 390 and 430 px, decoded loading, rigid stacks, contact points, creature ordering, alternating travel/peeks, taps, offscreen pause and reduced motion. `npm test` covers real World rewards and startup/Random selection. `npm run test:package` checks runtime imports/art and excludes these source files. Phone contact sheets are generated locally under `output/home-scene-audit/` for visual review.
