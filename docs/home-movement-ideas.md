# Home movement ideas to revisit

Saved November 1, 2026. The first ambient-movement pass is implemented below; later ideas remain discussion only.

## Implemented ambient pass

- Kitchen: separate utensils sway from fixed peg holes; the clean wall has no duplicate tools.
- Games: a restrained surfboard rock, with a long rest.
- Town: small flag flutters between larger tap actions.
- Wheels: porthole glint and staggered engine lights, appropriate to the rocket artwork.
- Ants: staggered antenna twitches with quieter intervals.
- Sunflower: a brief pollen shake from the flower head, also responding to the flower tap.
- Snacks: strawberry leaves rustle with a longer rest.
- Corgi: occasional ear perks using the existing isolated ears.
- Lighthouse: a small shore wash, behind the foreground objects.
- Underwater: two anchored background seaweed clusters catch the current.
- Toy Box: an occasional antenna light pulse.
- Penguin: a small cold-breath puff from the beak.
- Desert: the existing attached flower nudges in a gust.
- Giraffe: quieter attentive ear flicks; a new directional eye pose is not part of this pass.
- Castle: a short sleepy eye peek using the existing expression patch.
- Space: a brief exhaust boost and an occasional shooting star behind the characters and rocket.
- Make Believe: a short occasional wink and slower tail sway, using existing complete poses rather than cutting a new ear out of the body.
- Holiday Mixup: a gentle gift-stack wiggle between tap surprises.

All detail animations use the scene's existing pause/disposal and reduced-motion handling. Ambient motion never synthesizes taps, queues reactions or plays new sounds. Button sparkles are unchanged.

## New ideas awaiting discussion

- Wheels: bicycle or unicycle riding past, with correctly turning wheels/pedals.
- Toy Box: jack-in-the-box opening on tap and occasionally by itself; revisit the beach ball's bounce.
- Add missing measurement objects after reviewing the Home object audit: cherry, mouse, spinning top and a single toy jack are confirmed missing.
- Make Believe: rabbit, enchanted paper bird, little purple dragon, or glowing wisp alongside the fairy; no choice made yet.
- Surfboard beach: distant cruise ship and/or an occasional leaping dolphin with a splash; no implementation yet.

### Home object audit for discussion

Confirmed existing measurement objects: bicycle, unicycle, jack-in-the-box, dolphin, cruise ship, rabbit, pigeon, honeybee, butterfly, ladybug, jellyfish, flying saucer, and the main foreground subjects/props (including lighthouse, refrigerator, corgi, turtle, ice cream cone and crocodile/alligator).

Confirmed missing: cherry, mouse, spinning top, and a single toy jack. Other Home artwork without a corresponding specific object: seagull, small songbird, puffin, seal pup, hawk, tumbleweed, satellite, tropical fish, and ordinary crab (the current collection has a horseshoe crab, a different animal). The mouse's cheese wedge and the kitchen whisk/ladle/cooking turner also need review; a cheese wheel and grill spatula already exist. These are findings, not authorization to add all of them.

The beach ball's current bounce eases horizontal and vertical movement together. Proposed fix for discussion: steady horizontal travel, separate vertical bounce arcs, decreasing bounce height, and rotation matched to travel. No ball change is included in this ambient pass.

## Original suggestions

Start with the quieter scenes:
- Kitchen/fridge: utensils briefly sway and settle.
- Games: a loose piece rocks once.
- Town: a short mailbox-flag flutter.
- Wheels: headlights brighten briefly in sequence.

Other possibilities:
- Ants: an ant pauses and twitches its antennae.
- Sunflower: a brief pollen shake after the flower sways.
- Snacks: strawberry leaves rustle.
- Corgi: one ear lifts as if hearing something.
- Lighthouse: a small shore wave.
- Underwater: seaweed catches a current.
- Toy box: a subtle antenna pulse; the scene is already busy.
- Penguin: an occasional cold-breath puff.
- Desert: a gust nudges the cactus flower.
- Giraffe: a glance toward the ducks.
- Castle: the sleeping dragon opens one eye.
- Space: exhaust strengthens briefly and settles.
- Make Believe: a unicorn ear flick.
- Holiday Mixup: a gift wiggles.

Keep quiet intervals between actions. Birds flap occasionally; bugs flap continuously, like the fairy and bee. Keep wing roots and joints attached, preserve correct facing and rolling direction, and keep movement behind foreground objects where appropriate. Separate taps should animate independent objects together; repeated taps on an active object should neither interrupt nor queue another action.
