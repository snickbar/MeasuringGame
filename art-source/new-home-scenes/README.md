# Make Believe and Holiday Mixup Home scenes

Approved concepts: a unicorn beside spell books; a snowman with bunny ears beside mixed holiday gifts, with a friendly ghost.

Original PNG artwork was created with the built-in image generator. `generation.json` records the original prompts; `revision-v2-prompts.json` records the revised artwork and final source selections. These source files do not ship. Runtime art is lossless WebP with original alpha preserved. `scripts/register-new-home-art.py` converts whole images and measures independent atlas cells; it does not paint or cut parts out of assembled scenes. Run it before `node scripts/build-home-art-layout.cjs` when replacing the source art. `rendered-home-v2-*` are screenshots of the native layered renderer without UI, used for matching Style previews and fallback images.

## Animation rules carried forward

- Clean plates contain no moving foreground subjects. Never reveal a mismatched static picture before the decoded scene is ready.
- Moving parts are complete isolated drawings, including attachment roots. Never animate a rectangular slice containing the background or the object underneath.
- The unicorn faces the player; aligned complete expression cells give a brief tap wink without moving its body. The v3 atlas supplies a separate complete tail, gently swaying behind the reconstructed rump without carrying any body pixels. Its built-in image-generation prompt is recorded in `revision-v3-prompts.json`. The snowman wears a visible bunny-ear headband; independent complete twig arms rotate behind the intact body at overlapping shoulder roots.
- Both lower stacks remain rigid. The spell book uses generated cover/page textures on continuously hinged 3D surfaces, never closed/open pose swaps. Four opaque sides, a bottom cover and a binding strip close the spine seam. Twelve colored sparkles rise from the opening on idle and tap gestures. The replacement gift lid lifts straight up together with the turkey. The turkey sits in front of the back rim and behind a stationary front-wall copy, so its lower body stays inside the box throughout the gesture.
- Keep the fairy and ghost behind both foreground subjects. Separate complete fairy wing pairs flap about their roots; the body travels both ways and mirrors with its route. The ghost peeks on both sides of the same gift stack and turns while occluded. Neither fades away halfway across its visible path. A separate pastel rainbow fades slowly behind all foreground subjects.
- Protect the title and bottom buttons, preserve phone scaling, pause when Home is hidden, and honor reduced motion.

Placement and reactions live in `anim/home-new-scenes.mjs` and `.css`. Generated source bounds are in `anim/home-new-art.mjs`. Scene loading, ordering and lifecycle use the existing Home renderer.

Both homes use the existing World completion achievement and Style selection system. Claiming them preserves the currently equipped Home and remains idempotent.

## Verification

`npm run test:home` covers all 18 scenes at 320, 390 and 430 px, decoded loading, rigid stacks, contact points, continuous hinge movement, wing flaps, wink, dual arm waves, turkey emergence, rainbow fade/layers, creature ordering, alternating travel/peeks, actual tap hit targets, 36 scheduled audio cues, offscreen pause and reduced motion. Audio checks also cover phone-range pitches (including clearer Castle/Launchpad tones), volume/mute and suspended/interrupted/closed context recovery. `npm test` covers real World rewards and startup/Random selection. `npm run test:package` checks runtime imports/art and excludes these source files. Phone contact sheets are generated locally under `output/home-scene-audit/` for visual review.
