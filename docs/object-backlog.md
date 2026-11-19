# Requested object additions

Approved for the object list November 1, 2026. Checked entries are integrated measurement objects; unchecked entries remain planned additions.

## First group

- [x] Cherry — 25 mm fruit diameter, excluding the stem.
- [x] House mouse — 180 mm nose to tail tip, including the tail.
- [x] Spinning top — 100 mm upright height including the handle.
- [x] Single toy jack — 30 mm tip-to-tip span; one jack rather than a pile.
- [x] Spaghetti strainer — 250 mm bowl diameter, excluding the handles.
- [x] Soup ladle — 300 mm from the top of the handle to the bottom of the bowl.

## Additional Home artwork gaps

- [x] Seagull
- [x] Small songbird
- [x] Puffin
- [x] Seal — adult harbor seal, 1.5 m snout to rear flipper tips, stretched out.
- [x] Hawk
- [x] Tumbleweed — 600 mm diameter of a representative dry plant.
- [x] Satellite — 21 m representative communications satellite span with panels extended.
- [x] Tropical fish
- [x] Ordinary crab — red rock crab, 300 mm claw-tip span with claws spread; distinct from the existing horseshoe crab.
- [x] Cheese wedge — distinct from the existing cheese wheel.
- [x] Kitchen whisk

Cooking turner was declined by the user on November 6. It is not a planned addition; the existing grill spatula remains.

Bicycle, unicycle, jack-in-the-box, rabbit, dolphin, and cruise ship already exist as measurement objects. Their new Home animation artwork does not add duplicate collection entries.

## Batch 2 (November 6, 2026) — path to 500+ standard objects

Completed November 6. All 105 objects are active with production WebP artwork, scenery, Worlds assignments and the user's approved picker settings. Standard + fantasy objects: 501; total catalog including seasonal objects: 681. Approved choices are archived in `art-source/object-batch2-2026-11-06/approved-choices.json`; seven picker IDs map to live IDs through `anim/object-batch2-ids.mjs`. Checked against every seasonal pack; left out as duplicates: backpack, scissors, barbecue grill, spider web, tulip, bat, alarm clock (New Year "clock"), harp (St. Patrick's Irish harp), bucket (beach bucket), roast turkey (kept the live wild turkey).

## Batch 3 (November 19, 2026) — everyday objects + Retro Rewind World

Data: `art-source/object-batch3-2026-11-19/batch3.json` (50 new objects: id, name, plural, mm, measured dimension, Worlds, entrance style, scenery, art description). In the game as `BATCH3_DEFS` in `index.html`; an object only appears once its id is added to `BATCH3_IMAGE_IDS` and `items/<id>.webp` exists (like the seasonal packs). Entrance styles are in `anim/entry-styles.mjs`, scenery in `anim/scenery.mjs`. Retro Rewind opens as a World once 15 of its objects are live; it also needs a home screen (`home-retro.webp`), badge, survival emblem and reveal backdrop art.

Already in the game and reused (no duplicates added): motorcycle, rake, trash can (garbage can), rotary phone, lava lamp, tie-dye shirt (June pack). Existing retro items placed in the Retro World: rotary phone, lava lamp, boombox, vinyl record, retro game cartridge (left exactly as it was), typewriter.

Generic names and designs for branded things (no logos, no known characters): Walkman, Atari, VW Beetle, Cabbage Patch, Barbie, Felix clock, Slinky, Magic 8 Ball, Etch A Sketch, Mr. Potato Head, Tamagotchi, Game Boy, Radio Flyer, Beanie Baby, Trapper Keeper, Transformer, Super Soaker, Blockbuster card, TI-86, Lisa Frank folders.

Open interpretations (change if wrong): "25c machine" = quarter gumball machine; "NY world's fair tower" = a Unisphere-style globe (43 m); McDonald's toys = one generic kids' meal toy; memorial wristband = plain rubber awareness wristband.

- [ ] All 50 objects waiting for artwork (then add ids to `BATCH3_IMAGE_IDS`, set picker settings in the Object Orientation picker)
- [ ] Retro Rewind World art: home screen, reveal backdrop, badge, survival emblem
