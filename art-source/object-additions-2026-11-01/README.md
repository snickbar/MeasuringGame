# Ten regular object additions

Added November 1, 2026. All ten are ordinary Standard objects in the general pool and collection, with permanent IDs and explicit measurement wording. They do not require a seasonal pack or the Make Believe setting.

| ID | Representative size | Measured boundary | Worlds |
|---|---:|---|---|
| cherry | 25 mm | Fruit diameter, excluding stem | Tiny Things, Snack Time |
| mouse | 180 mm | Nose to tail tip, including tail | Critters |
| spinning-top | 100 mm | Bottom point to top of handle | Games & Sports, Toy Box |
| toy-jack | 30 mm | Opposite tips of a single jack | Tiny Things, Games & Sports, Toy Box |
| seal | 1500 mm | Adult harbor seal, snout to rear flipper tips, stretched out | Critters, Under the Sea |
| satellite | 21000 mm | Communications satellite, tip to tip with panels extended | Wheels & Wings |
| crab | 300 mm | Red rock crab, claw tip to claw tip with claws spread | Critters, Under the Sea |
| tumbleweed | 600 mm | Dry plant diameter | General pool; no forced World assignment |
| spaghetti-strainer | 250 mm | Bowl diameter, excluding handles | Around the House |
| soup-ladle | 300 mm | Top of handle to bottom of bowl | Around the House |

These are fixed representative sizes for gameplay, not universal sizes for variable animals, plants or manufactured items. The mouse and crab boundaries include the tail and claws at the user's request. The mouse uses a body-plus-tail value consistent with the ranges in the [University of Michigan Animal Diversity Web account](https://animaldiversity.org/accounts/Mus_musculus/). Adult seal size is within the [Smithsonian harbor seal range](https://www.nationalzoo.si.edu/animals/harbor-seal). The satellite span uses the 21 m communications-relay scale described in [NASA's TDRS paper](https://ntrs.nasa.gov/api/citations/20180003337/downloads/20180003337.pdf); its artwork is a simplified generic satellite, not a technical TDRS diagram. The crab's spread-claw span is a representative pose, not a carapace-width measurement.

## Art provenance

Seven original transparent PNGs were generated with the built-in `image_gen` tool. Exact prompts and reference paths for the first six are in `prompts.json`; the later ladle is in `soup-ladle-prompt.json`. Three complete existing Home sprites were reused: the isolated cherry cell from `refined/layers-cherry.webp`, crab from `critter-games-b.webp`, and tumbleweed from `critter-cactus-a.webp`. Existing Home artwork/animation is unchanged.

`manifest.json` records source paths, crop bounds, runtime paths and dimensions. Runtime assets are alpha WebPs encoded at quality .95 with a 480-pixel longest visible edge and 12-pixel margins. Sources and documentation stay out of production packages.

## Validation

`verify-object-additions-browser.cjs` checks all ten icons, transparent corners, real measurement guides and both roles in the actual reveal renderer at 320/390/430 pixel widths. `verify-measurements.cjs` covers all 563 definitions and 158,203 pair ratios/prompts. The object workshop includes these in its New objects filter and preserves existing 45-degree rotation settings.
