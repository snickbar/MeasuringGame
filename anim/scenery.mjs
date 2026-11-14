import { FLOOR_DATA } from './scenery-data.mjs';

// Scenery follows the larger object's identity. Measurements never select a biome.
export const OBJECT_GROUPS = {
  grass: `adult-human ant backpack balloon barbecue-grill blade-of-grass bowling-ball bowling-pin bunny-ears capybara chocolate-bunny cockroach coffin confetti conversation-heart cupid cupids-arrow daisy duck easter-basket easter-egg egg-basket firecracker flamingo four-leaf-clover frisbee garden-gnome giant-anthill globe grill-spatula hamster heart hedgehog honeybee hot-air-balloon jelly-bean kangaroo ladybug lawn-flamingo locker long-stem-rose maraca marshmallow-chick mount-kilimanjaro noisemaker park-bench picnic-table pigeon pilgrim-hat pinata plastic-egg pogo-stick porta-potty rabbit school-bell shamrock skeleton snail sparkler stork suitcase sunflower teddy-bear tombstone tulip turtle uncle-sam-hat wind-turbine windmill`,
  beach: `aircraft-carrier beach-ball beach-towel beach-umbrella canoe cooler cruise-ship fishing-boat flip-flop grain-of-sand hammock lemonade-pitcher lighthouse mermaid palm-tree pool-noodle popsicle rowboat sailboat sand-dollar sandcastle seashell starfish sunglasses sunscreen-bottle surfboard titanic umbrella`,
  living: `acoustic-guitar bouquet broom candle clock comb corgi couch crayon dachshund disco-ball domestic-cat door drum-stick fake-mustache folding-chair grand-piano jeans jewelry-box ladder lava-lamp letter-block lunchbox mop necktie pearl-necklace pillow present queen-size-bed retro-cartridge saxophone sneaker toolbox trumpet tv-remote violin yoga-mat`,
  kitchen: `potato-chip-tube single-use-snack-bag soft-pretzel apple baby-bottle bagel baguette banana barstool bathtub beer-bottle blueberry boba-tea breakfast-tray butter-stick casserole-dish cheerio cheese-wheel chicken-nugget chili-pepper chocolate-drop cotton-candy cream-pie cucumber dinner-roll dog-bowl donut drinking-straw egg foot-long-sub french-fry grain-of-rice gummy-bear hamburger hot-dog ice-cream-cone ice-cube ketchup-bottle mashed-potatoes napkin pancakes peanut pineapple pizza-pie pizza-slice plunger pumpkin-pie refrigerator ribs soda-can strawberry stuffing sweet-potato-casserole taco teacup toothbrush toothpaste turkey watermelon wine-bottle`,
  tabletop: `nail hammer action-figure aa-battery boxing-glove button calculator champagne-glass chattering-teeth checkers-piece chocolate chocolate-box clown-nose coffee-mug convenient-receipt cork credit-card die domino dvd earbuds earbuds-case game-controller gold-coin green-beer-mug hairbrush handbag human-eyelash index-card jack-in-the-box key laptop lego-brick light-bulb lottery-ticket marble mothers-day-card notebook paintbrush paperclip pencil pencil-case penny ping-pong-ball playing-card poker-chip pool-cue poppy-seed quarter rubber-chicken rubber-duck rubiks-cube scissors scrunchie sesame-seed sheet-of-paper-a4 smartphone stethoscope toilet-paper-square tooth toy-car valentines-card vinyl-record whiskey-glass whoopee-cushion wine-glass wooden-block`,
  city: `airliner ambulance american-flag anvil bicycle big-ben billboard black-cat boeing-737 brooklyn-bridge burj-khalifa bus-shelter car car-tire carousel central-park christ-statue cn-tower colosseum countdown-sign double-decker-bus dumpster eiffel-tower empire-state-building excavator exit-sign fighter-jet fire-extinguisher fire-hydrant fire-truck fireworks flagpole garbage-truck gateway-arch ghost gold-bar golden-gate-bridge handcuffs helicopter hot-dog-cart house-brick ice-cream-truck kaiju leaning-tower-of-pisa license-plate locomotive london-eye mailbox manhole-cover minivan motorcycle newspaper-box notre-dame novelty-glasses olympic-pool parking-meter party-hat phone-booth power-line-tower robot school-bus scooter semi-truck shipping-container skateboard space-needle statue-of-liberty stop-sign streamer streetlight sydney-opera-house taj-mahal taxi telephone-pole times-square-ball tower-crane town-fountain traffic-cone traffic-light trash-can unicycle vending-machine washington-monument water-tower`,
  forest: `acorn alligator angel-falls bat bigfoot black-bear brown-bear deer dwarf fall-leaf frog gorilla green-anaconda komodo-dragon leprechaun-hat niagara-falls oak-tree owl panda pinecone saltwater-crocodile t-rex werewolf witch-hat`,
  farm: `baby-chick barn-silo barrel candy-corn carrot corn-on-the-cob corn-stalk cornucopia cow horse horseshoe pig pumpkin scarecrow teepee tractor`,
  snow: `candy-cane christmas-stocking christmas-tree cranberry gingerbread-house mistletoe mount-everest penguin polar-bear reindeer santa-hat sleigh snow-globe snowboard yeti`,
  desert: `cactus cowboy-hat elephant giraffe grand-canyon great-pyramid hippopotamus hoover-dam lion moai mount-fuji mummy ostrich rhinoceros sombrero stonehenge zebra`,
  underwater: `barracuda blue-whale dolphin electric-eel fishing-rod giant-squid great-white-shark hammerhead-shark jellyfish killer-whale koi-fish kraken loch-ness-monster manta-ray mariana-trench octopus pufferfish seahorse snorkel-mask stingray swordfish whale-shark`,
  space: `laser-sword alien flying-saucer saturn-rocket space-shuttle`,
  enchanted: `baby-dragon castle cauldron centaur cyclops fairy goblin leprechaun magic-wand minotaur pegasus phoenix pot-of-gold rainbow shillelagh troll unicorn western-dragon`,
  stadium: `baseball baseball-bat baseball-cap baseball-glove basketball basketball-backboard basketball-court blimp foam-finger football football-field football-helmet golf-ball golf-club hockey-puck hockey-stick jumbotron shuttlecock soccer-ball soccer-goal tennis-ball tennis-racket volleyball whistle`,
};
import { SCENE_MOVES } from './scenery-moves.mjs';
export const SCENERY_BY_OBJECT = Object.create(null);
Object.assign(SCENERY_BY_OBJECT, {
  cherry:'kitchen',mouse:'living','spinning-top':'tabletop','toy-jack':'tabletop',
  seal:'beach',satellite:'space',crab:'beach',tumbleweed:'desert','spaghetti-strainer':'kitchen','soup-ladle':'kitchen',
  'piggy-bank':'living',cupcake:'kitchen','sushi-piece':'kitchen','red-spotted-mushroom':'forest',fishbowl:'living','diving-helmet':'underwater','tape-measure':'tabletop','paint-palette':'tabletop',snowflake:'snow','water-drop':'kitchen',meteorite:'space',asteroid:'space',
  'tiger':'forest','moose':'forest','wolf':'forest','fox':'forest','raccoon':'forest','cheetah':'desert','camel':'desert','meerkat':'desert','monkey':'forest','koala':'forest','red-panda':'forest','squirrel':'forest','wild-turkey':'forest','sloth':'forest','bison':'grass','otter':'grass','peacock':'grass','llama':'farm','pony':'farm','sheep':'farm','goat':'farm','donkey':'farm','rooster':'farm','walrus':'beach','toucan':'forest','parrot':'forest','cobra':'desert','goldfish':'underwater','guinea-pig':'living','ferret':'living','tortoise':'grass','lobster':'underwater','clownfish':'underwater','tropical-fish':'underwater','sea-turtle':'underwater','shrimp':'underwater','oyster':'underwater','seagull':'beach','hawk':'forest','songbird':'grass','puffin':'beach','dragonfly':'grass','cheese-wedge':'kitchen','whisk':'kitchen','toaster':'kitchen','microwave':'kitchen','kettle':'kitchen','blender':'kitchen','frying-pan':'kitchen','fork':'kitchen','butcher-knife':'kitchen','stapler':'tabletop','screwdriver':'tabletop','camera':'tabletop','headphones':'tabletop','typewriter':'tabletop','microscope':'tabletop','beaker':'tabletop','pair-of-glasses':'tabletop','wristwatch':'tabletop','sock':'living','vacuum-cleaner':'living','rotary-phone':'living','boombox':'living','telescope':'living','shovel':'grass','rake':'grass','wheelbarrow':'grass','coiled-garden-hose':'grass','lawnmower':'grass','drone':'grass','drum-kit':'living','flute':'living','tuba':'living','accordion':'living','banjo':'living','feather':'grass','bird-nest':'forest','beehive':'grass','pine-tree':'forest','campfire':'forest','boulder':'desert','driftwood':'beach','icicle':'snow','dandelion':'grass','subway-train-car':'city','tow-truck':'city','bulldozer':'city','cable-car':'city','monster-truck':'city','tank':'desert','gondola':'beach','jet-ski':'beach','mount-rushmore':'desert','uluru':'desert','hollywood-sign':'desert','petra-treasury':'desert','parthenon':'desert','great-wall-of-china':'forest','machu-picchu':'forest','neuschwanstein-castle':'forest','tower-bridge':'city','petronas-towers':'city','taipei-101':'city','alcatraz':'beach',
  'tennis-court':'stadium','ice-hockey-rink':'stadium','coast-redwood':'forest',
  submarine:'underwater','cargo-ship':'beach','freight-train':'city','radio-mast':'city',
  'sports-stadium':'stadium','radio-telescope':'desert','water-slide':'beach',
  'roller-coaster':'city','airport-runway':'city'
});
for (const [scene, words] of Object.entries(OBJECT_GROUPS)) for (const id of words.split(/\s+/)) {
  if (SCENERY_BY_OBJECT[id]) throw new Error('Duplicate scenery assignment: ' + id);
  SCENERY_BY_OBJECT[id] = scene;
}
for (const [id, scene] of Object.entries(SCENE_MOVES)) SCENERY_BY_OBJECT[id] = scene;
export function sceneryFor(object) { return SCENERY_BY_OBJECT[object.id] || 'grass'; }

// A scene flagged night:true is always night; night:'dark' is night only when the app is in dark mode.
export const isNight = (config, dark) => config.night === 'dark' ? !!dark : !!config.night;

// Rooms, caves and the sea have no open sky, so they never get stars.
// Rooms get a lamp-lit night look instead of stars.
const INDOOR = new Set(['living', 'kitchen', 'tabletop', 'library', 'workshop']);
const NO_STARS = new Set(['living', 'kitchen', 'tabletop', 'library', 'workshop', 'cave', 'underwater']);

export const SETTINGS = {
  grass: { movers: ['butterflies'], floor: 'meadow-lane', floorTileWidth: 600, sky: ['#74bdf0', '#d6eefc'], nightSky: ['#0e1a38', '#33456b'], night: 'dark', floaters: ['cloud-set-meadow'], cloudClear: 240, flyers: 'geese', fireflies: true,
    // Layered scenery, back to front. `par` is how much of the climb each layer follows (1 = like the ground); `lift` is how far its skyline sits above the ground at the start.
    parallax: [{ img: 'meadow-peak', par: .07, lift: 350, single: { x: .38, w: 1.6, sy: 1.25 } }, { img: 'meadow-mountain', par: .12, lift: 250, scatter: { imgs: ['meadow-tree-1', 'meadow-tree-2', 'meadow-tree-3', 'meadow-tree-8'], n: 12, rows: [440, 690], w: [.028, .055], seed: 'm' } }, { img: 'meadow-hills', par: .28, lift: 175, scatter: { imgs: ['meadow-tree-1', 'meadow-tree-2', 'meadow-tree-3', 'meadow-tree-4', 'meadow-tree-5', 'meadow-tree-6', 'meadow-tree-7', 'meadow-tree-8', 'meadow-tree-9'].filter((_, i) => i !== 7), n: 16, rows: [380, 690], w: [.05, .095], seed: 'h' }, props: [{ img: 'meadow-barn', x: .3, row: 700, w: .15 }] }, { img: 'meadow-village', par: .5, lift: 100, spin: { img: 'meadow-blades', x: 1445, y: 437, size: 197, speed: .55 }, props: [{ img: 'meadow-cabin', x: .7, row: 900, w: .13 }] }, { img: 'meadow-near', par: .78, lift: 42 }],
    pieces: [{ img: 'meadow-balloon', cell: 1800, prob: .75, w: 58, speed: 6, bob: 5, sway: .04, minH: 420 }, { img: 'meadow-kite', cell: 1300, prob: .6, w: 62, speed: 9, bob: 12, sway: .16, minH: 380 }],
    skyPieces: [{ img: 'meadow-sun', y: 3100, x: .74, w: 130, day: true }, { img: 'meadow-sun', y: 21000, x: .3, w: 110, day: true }] },
  town: { sky: ['#74bdf0', '#d6eefc'], nightSky: ['#0e1a38', '#33456b'], night: 'dark',
    floaters: ['cloud-set-meadow'], cloudClear: 240, flyers: 'swallows',
    town: { street: 'town-reveal-street', walk: 'town-reveal-walk', shops: 'town-reveal-shops',
      hall: 'town-reveal-hall', rail: 'town-reveal-rail', meadow: 'town-reveal-meadow',
      city: 'town-reveal-city', train: 'town-train', sun: 'meadow-sun' } },
  beach: { sky: ['#72c9f4', '#e2f6ff'], nightSky: ['#17294f', '#526b91'], night: 'dark',
    floaters: ['cloud-set-day'], cloudClear: 210, flyers: 'gulls',
    coast: { sand: 'beach-coast-sand', sea: 'beach-coast-sea', point: 'beach-coast-point',
      foam: 'beach-coast-foam', wash: 'beach-coast-wash', wet: 'beach-coast-wet', fronds: 'beach-coast-fronds',
      boat: 'bw-sailboat', beam: 'beach-coast-beam' } },
  resort: { floor: 'resort-sand', floorTileWidth: 640, sky: ['#4fa8e8', '#bfe3f8'], floaters: ['cloud-set-resort'], cloudClear: 190, flyers: 'gulls', nightSky: ['#0e1a38', '#33456b'], night: 'dark',
    wash: { img: 'beach-wave-wash', scale: 1.15, start: 6, amp: 24 },
    parallax: [{ img: 'beach-peak', par: .07, lift: 330, single: { x: .45, w: 1.9, sy: 1.4, fill: '#98b628' } },
      { img: 'beach-lighthouse', par: .12, lift: 238, single: { x: .2, w: .2, sy: 1 } },
      { img: 'beach-headland', par: .12, lift: 170, scatter: { imgs: ['beach-plant-2', 'beach-plant-3', 'beach-plant-4', 'beach-plant-6', 'beach-plant-8'], n: 9, rows: [455, 525], w: [.026, .045], seed: 'b' } },
      { img: 'beach-islands', par: .22, lift: 120, drifters: [{ img: 'beach-boat', x: .3, row: 488, w: .05, speed: 4, bob: 1.5 }] },
      { img: 'beach-sea', par: .36, lift: 88, props: [{ img: 'beach-arch', x: .2, row: 535, w: .27, foam: 'beach-wave-foam' }], drifters: [{ img: 'beach-canoe', x: .72, row: 560, w: .075, speed: 8, bob: 2.5 }, { img: 'beach-buoy', x: .5, row: 600, w: .026, speed: 0, bob: 3, rate: 1.7 }] },
      { img: 'beach-shallow', par: .6, lift: 50, props: [{ img: 'beach-pier', x: .7, row: 508, w: .27 }], drifters: [{ img: 'beach-curl', x: .35, row: 600, w: .05, speed: 14, bob: 2 }] }],
    skyPieces: [{ img: 'resort-sun', y: 3100, x: .74, w: 150, day: true }, { img: 'resort-moon', y: 3100, x: .72, w: 120, night: true }, { img: 'resort-sun', y: 21000, x: .3, w: 120, day: true }, { img: 'resort-moon', y: 21000, x: .3, w: 100, night: true }] },
  boardwalk: { sky: ['#32a8eb', '#b9e7fa'], nightSky: ['#0e1a38', '#33456b'], night: 'dark',
    avenue: { shops: 'boardwalk-avenue', pier: 'boardwalk-pier', beach: 'boardwalk-beach', ocean: 'boardwalk-ocean', stand: 'fair-reveal-stand',
      wheel: 'fair-reveal-wheel', carriage: 'fair-reveal-carriage' },
    floaters: ['cloud-set-resort'], cloudClear: 190, flyers: 'gulls',
    skyPieces: [{ img: 'resort-sun', y: 5500, x: .74, w: 150, day: true }, { img: 'resort-moon', y: 5500, x: .2, w: 120, night: true }] },
  fair: { floor: 'fair-n-floor', floorTileWidth: 640,  sky: ['#7fc6f2', '#f1f8fc'], floaters: ['cloud-set-day'], flyers: 'swallows',
    parallax: [{ img: 'fair-n-farthest', par: 0.09, lift: 375, scale: 2.27 },
      { img: 'fair-n-big-0', par: .06, lift: 697, single: { x: 0.5, w: 1.25, sy: 1 } },
      { img: 'fair-n-far', par: 0.16, lift: 335, scale: 2.03, drifters: [{ img: 'fair-n-movers-0', x: 0.3, row: 591, w: 0.058, speed: 12, bob: 0 }, { img: 'fair-n-movers-3', x: 0.7, row: 591, w: 0.063, speed: 6, bob: 0 }] },
      { img: 'fair-n-mid', par: 0.34, lift: 300, scale: 1.53, props: [{ img: 'fair-n-reveals-0', x: 0.14, row: 591, w: 0.088 }, { img: 'fair-n-reveals-1', x: 0.5, row: 591, w: 0.104 }, { img: 'fair-n-reveals-2', x: 0.84, row: 591, w: 0.091 }, { img: 'fair-n-anim-0', x: 0.72, row: 591, w: 0.125, spin:  { img: 'fair-n-anim-1', fx: .5, fy: .1, size: 1.1, speed: .5 } }], drifters: [{ img: 'fair-n-movers-1', x: 0.5, row: 591, w: 0.081, speed: 8, bob: 0 }, { img: 'fair-n-movers-2', x: 0.8, row: 591, w: 0.080, speed: 6, bob: 0 }] },
      { img: 'fair-n-near', par: 0.6, lift: 135, scale: 1.15, props: [{ img: 'fair-n-loose-0', x: 0.06, row: 556, w: 0.11 }, { img: 'fair-n-loose-1', x: 0.24, row: 556, w: 0.11 }, { img: 'fair-n-loose-2', x: 0.42, row: 556, w: 0.1 }, { img: 'fair-n-loose-3', x: 0.6, row: 556, w: 0.115 }, { img: 'fair-n-loose-6', x: 0.78, row: 556, w: 0.13 }, { img: 'fair-n-loose-8', x: 0.93, row: 556, w: 0.08 }] }],
    pieces: [{ img: 'fair-n-movers-4', cell: 2300, prob: 0.6, w: 120, speed: 24, bob: 3, sway: 0.02, minH: 480, face: 1 }, { img: 'fair-n-movers-5', cell: 2000, prob: 0.6, w: 70, speed: 8, bob: 6, sway: 0.04, minH: 420, face: 1 }] },
  living: { floor: 'living-n-floor', floorTileWidth: 640, floorDrifters: [{ img: 'living-n-movers-0', lane: 0.5, w: 0.079, speed: 22, start: 0.2, bob: 0.3 }, { img: 'living-n-movers-3', lane: 0.5, w: 0.066, speed: 30, start: 0.55, bob: 0.3 }, { img: 'living-n-movers-1', lane: 0.5, w: 0.080, speed: 14, start: 0.8 }, { img: 'living-n-movers-4', lane: 0.5, w: 0.062, speed: 40, start: 0.35 }, { img: 'living-n-movers-5', lane: 0.5, w: 0.108, speed: 16, start: 0.1, bob: 0.3 }], sky: ['#f2e6d4', '#fff8e9'], layers: ['dust-motes'],
    parallax: [{ img: 'living-n-far', par: .16, lift: 330, scale: 0.85, props: [{ img: 'living-n-big-0', x: 0.5, row: 360, w: 0.234 }] },
      { img: 'living-n-mid', par: .34, lift: 166, scale: 0.75, props: [{ img: 'living-n-reveals-0', x: 0.14, row: 546, w: 0.144 }, { img: 'living-n-reveals-1', x: 0.5, row: 546, w: 0.088 }, { img: 'living-n-anim-0', x: 0.72, row: 546, w: 0.093, spin: { img: 'living-n-anim-1', fx: .5, fy: .45, size: .22, speed: 1.4, swing: .3, px: .5, py: 0 } }] },
      { img: 'living-n-near', par: .6, lift: 156, scale: 0.7, props: [{ img: 'living-n-loose-0', x: 0.08, row: 712, w: 0.043 }, { img: 'living-n-loose-2', x: 0.3, row: 712, w: 0.054 }, { img: 'living-n-loose-3', x: 0.55, row: 712, w: 0.081 }, { img: 'living-n-loose-7', x: 0.8, row: 712, w: 0.067 }] }],
    pieces: [{ img: 'living-n-movers-2', cell: 1700, prob: 0.6, w: 62, speed: 24, bob: 3, sway: 0.02, minH: 380, face: 1 }] },
  kitchen: { floor: 'kitchen-n-floor', floorTileWidth: 640, floorDrifters: [{ img: 'kitchen-n-movers-0', lane: 0.5, w: 0.059, speed: 18, start: 0.2, bob: 0.3 }, { img: 'kitchen-n-movers-1', lane: 0.5, w: 0.054, speed: 30, start: 0.5 }, { img: 'kitchen-n-movers-2', lane: 0.5, w: 0.060, speed: 22, start: 0.35, bob: 0.2 }, { img: 'kitchen-n-movers-3', lane: 0.5, w: 0.068, speed: 26, start: 0.7, bob: 0.3 }, { img: 'kitchen-n-movers-4', lane: 0.5, w: 0.035, speed: 34, start: 0.1, bob: 0.4 }], sky: ['#f1ebdf', '#fff9ed'], layers: ['dust-motes'],
    parallax: [{ img: 'kitchen-n-far', par: .16, lift: 330, scale: 0.85, props: [{ img: 'kitchen-n-big-0', x: 0.5, row: 360, w: 0.217 }] },
      { img: 'kitchen-n-mid', par: .34, lift: 166, scale: 0.75, props: [{ img: 'kitchen-n-reveals-0', x: 0.14, row: 546, w: 0.082 }, { img: 'kitchen-n-reveals-1', x: 0.5, row: 546, w: 0.084 }, { img: 'kitchen-n-reveals-2', x: 0.84, row: 546, w: 0.151 }, { img: 'kitchen-n-anim-0', x: 0.72, row: 546, w: 0.163, spin: { img: 'kitchen-n-anim-1', fx: .5, fy: .5, size: .5, speed: .35, px: .2, py: .86 } }] },
      { img: 'kitchen-n-near', par: .6, lift: 151, scale: 0.7, props: [{ img: 'kitchen-n-loose-0', x: 0.08, row: 690, w: 0.085 }, { img: 'kitchen-n-loose-2', x: 0.3, row: 690, w: 0.072 }, { img: 'kitchen-n-loose-3', x: 0.55, row: 690, w: 0.080 }, { img: 'kitchen-n-loose-6', x: 0.8, row: 690, w: 0.056 }] }],
    pieces: [{ img: 'kitchen-n-movers-5', cell: 1500, prob: 0.6, w: 46, speed: 6, bob: 5, sway: 0.03, minH: 380, face: 1 }] },
  tabletop: { floor: 'tabletop-n-floor', floorTileWidth: 640, floorDrifters: [{ img: 'tabletop-n-movers-0', lane: 0.5, w: 0.057, speed: 34, start: 0.2 }, { img: 'tabletop-n-movers-1', lane: 0.5, w: 0.072, speed: 26, start: 0.5, bob: 0.3 }, { img: 'tabletop-n-movers-2', lane: 0.5, w: 0.039, speed: 16, start: 0.7, bob: 0.3 }, { img: 'tabletop-n-movers-3', lane: 0.5, w: 0.053, speed: 20, start: 0.35, bob: 0.4 }, { img: 'tabletop-n-movers-4', lane: 0.5, w: 0.044, speed: 10, start: 0.85, bob: 0.3 }], sky: ['#e7dfce', '#fff8e9'],
    parallax: [{ img: 'tabletop-n-far', par: .16, lift: 330, scale: 0.85, props: [{ img: 'tabletop-n-big-0', x: 0.5, row: 360, w: 0.231 }] },
      { img: 'tabletop-n-mid', par: .34, lift: 166, scale: 0.75, props: [{ img: 'tabletop-n-reveals-0', x: 0.14, row: 546, w: 0.127 }, { img: 'tabletop-n-reveals-1', x: 0.5, row: 546, w: 0.111 }, { img: 'tabletop-n-reveals-2', x: 0.84, row: 546, w: 0.118 }, { img: 'tabletop-n-anim-0', x: 0.72, row: 546, w: 0.185, spin: { img: 'tabletop-n-anim-1', fx: .5, fy: .12, size: 1.05, speed: .7 } }] },
      { img: 'tabletop-n-near', par: .6, lift: 127, scale: 0.7, props: [{ img: 'tabletop-n-loose-0', x: 0.08, row: 582, w: 0.025 }, { img: 'tabletop-n-loose-2', x: 0.3, row: 582, w: 0.071 }, { img: 'tabletop-n-loose-4', x: 0.55, row: 582, w: 0.064 }, { img: 'tabletop-n-loose-5', x: 0.8, row: 582, w: 0.056 }] }],
    pieces: [{ img: 'tabletop-n-movers-5', cell: 1700, prob: 0.6, w: 58, speed: 24, bob: 3, sway: 0.02, minH: 380, face: 1 }] },
  city: { sky: ['#111d36', '#263675'], night: true,
    square: { street: 'times-square-street', sides: 'times-square-sides', tower: 'times-square-tower',
      sky: 'times-square-sky', skyscrapers: 'times-square-skyscrapers', cup: 'times-square-cup', circles: 'times-square-circles',
      star: 'times-square-star', ribbon: 'times-square-ribbon', steam: 'times-square-steam',
      spark: 'times-square-spark', grate: 'times-square-grate', marquee: 'times-square-marquee' } },
  forest: { floor: 'forest-n-floor', floorTileWidth: 640, overlapTerrain: true, sky: ['#9fc4b0', '#cfe3cf'],
    parallax: [{ img: 'forest-n-farthest', par: .10, lift: 555, scale: .60 },
      { img: 'forest-n-far2', par: .19, lift: 455, scale: .55 },
      { img: 'forest-n-big-0', par: .28, lift: 660, single: { x: .53, w: .96, sy: 1, hang: [{ img: 'forest-n-vine-4', fx: .1, fy: .37, w: .075, speed: .9, swing: .08 }, { img: 'forest-n-vine-3', fx: .27, fy: .38, w: .07, speed: .75, swing: .09 }, { img: 'forest-n-vine-2', fx: .72, fy: .38, w: .07, speed: .85, swing: .09 }, { img: 'forest-n-vine-1', fx: .9, fy: .37, w: .06, speed: .7, swing: .08 }] } },
      { img: 'forest-n-mid', par: .51, lift: 435, scale: .55, flows: [{ img: 'forest-n-fall', x: 470, y: 930, speed: 300, streaks: 16 }, { img: 'forest-n-water', x: 365, y: 1121, ripple: { rows: 8, speed: .5 } }] },
      { img: 'forest-n-near', par: .84, lift: 132, scale: .57 }],
    pieces: [{ img: 'forest-n-fly-0', cell: 1900, prob: 0.6, w: 64, speed: 26, bob: 3, sway: 0.02, minH: 420, face: 1 }, { img: 'forest-n-fly-1', cell: 2600, prob: 0.6, w: 46, speed: 18, bob: 5, sway: 0.03, minH: 520, face: 1 }] },
  farm: { floor: 'farm-n-floor', floorTileWidth: 640, overlapTerrain: true, sky: ['#c0dbe1', '#edf3e1'], floaters: ['cloud-set-day'],
    parallax: [{ img: 'farm-n-farthest', par: .11, lift: 505, scale: .71 },
      { img: 'farm-n-far', par: .28, lift: 410, scale: .82 },
      { img: 'farm-n-big-0', par: .28, lift: 544, single: { x: 0.63, w: .62, sy: 1, spin: { img: 'farm-n-rotor', fx: .5, fy: .347, size: 1.1, speed: .6 } } },
      { img: 'meadow-hills', par: .28, lift: 169, scale: .72, filter: 'saturate(1.25) hue-rotate(-17deg)' },
      { img: 'farm-n-mid', par: .56, lift: 315, scale: .55, props: [{ img: 'farm-n-line', x: 0.5, row: 1215, w: 0.82 }, { img: 'farm-n-laundry-0', x: 0.2250, row: 1147, w: 0.1228, move: { type: 'dangle', amp: 6, speed: 1.10, phase: 0.0 } }, { img: 'farm-n-laundry-1', x: 0.3380, row: 1169, w: 0.1015, move: { type: 'dangle', amp: 6, speed: 1.23, phase: 1.3 } }, { img: 'farm-n-laundry-2', x: 0.4493, row: 1158, w: 0.0982, move: { type: 'dangle', amp: 6, speed: 1.36, phase: 2.6 } }, { img: 'farm-n-laundry-3', x: 0.5667, row: 1170, w: 0.1105, move: { type: 'dangle', amp: 6, speed: 1.49, phase: 3.9 } }, { img: 'farm-n-laundry-4', x: 0.6788, row: 1164, w: 0.0859, move: { type: 'dangle', amp: 6, speed: 1.62, phase: 5.2 } }, { img: 'farm-n-laundry-5', x: 0.7856, row: 1167, w: 0.1097, move: { type: 'dangle', amp: 6, speed: 1.75, phase: 6.5 } }, { img: 'farm-n-crop-0', x: 0.07, row: 1170, w: 0.17, move: { type: 'rustle', amp: 3.5, speed: 1.2, phase: 0 } }, { img: 'farm-n-crop-6', x: 0.93, row: 1170, w: 0.2, move: { type: 'rustle', amp: 3.5, speed: 1.8, phase: 6 } }], vanes: [{ img: 'farm-n-vane', x: 235, y: 660, size: 110, pole: 36, speed: .45 }] },
      { img: 'farm-n-near', par: 1, lift: 720, single: { x: 0.5, w: 1.08, sy: 1 } }] },
  snow: { floor: 'snow-n-floor', floorTileWidth: 640, overlapTerrain: true,
    sky: ['#c2dcea', '#f0f6fb'], floaters: ['cloud-set-day'], layers: ['snowflakes'], nightBackdrop: 'snow-aurora',
    parallax: [
      { img: 'snow-climb-backdrop', par: .10, lift: 580, scale: .65 },
      { img: 'snow-climb-lift', par: .16, lift: 554, single: { x: .55, w: 1.23, sy: 1, liftChair: 'snow-climb-chair', overlapFrom: .95 } },
      { img: 'snow-climb-distant', par: .26, lift: 414, scale: .60 },
      { img: 'snow-climb-huge-tree', par: .36, lift: 520, single: { x: .62, w: .70, sy: 1 } },
      { img: 'snow-climb-middle', par: .57, lift: 307, scale: .56, props: [
        { img: 'snow-climb-ice-left', x: .355, row: 955, w: .032, move: { type: 'dangle', amp: 3, speed: 1.2 } },
        { img: 'snow-climb-ice-right', x: .825, row: 952, w: .029, move: { type: 'dangle', amp: 3, speed: .9 } },
      ] },
      { img: 'snow-climb-foreground', par: 1, lift: 0, scale: .57, grounded: true, props: [
        { img: 'snow-climb-pine-left', x: .12, row: 1085, w: .13, move: { type: 'rustle', amp: 2, speed: .9 } },
        { img: 'snow-climb-pine-right', x: .84, row: 1125, w: .16, move: { type: 'rustle', amp: 2, speed: 1.1 } },
      ] },
    ] },
  desert: { floor: 'desert-n-floor', floorTileWidth: 640, overlapTerrain: true,
    sky: ['#b8a1c9', '#d9b1c8', '#efbea9', '#f8dfb7'], floaters: ['cloud-set-sunset'],
    parallax: [
      { img: 'desert-climb-backdrop', par: .09, lift: 535, scale: .67 },
      { img: 'desert-climb-arch', par: .14, lift: 540, single: { x: .60, w: .86, sy: 1 } },
      { img: 'desert-climb-distant', par: .27, lift: 380, scale: .61 },
      { img: 'desert-climb-middle', par: .56, lift: 305, scale: .60, overlapFrom: .95, props: [
        { img: 'desert-n-anim-0', x: .58, row: 1090, w: .11,
          spin: { img: 'desert-climb-rotor', fx: .64, fy: .125, size: 1.40, speed: .65 } },
      ] },
      { img: 'desert-climb-foreground', par: 1, lift: 28, scale: .58, grounded: true, overlapFrom: .95, props: [
        { img: 'desert-climb-plant-0', x: .24, row: 1170, w: .095, move: { type: 'rustle', amp: 3, speed: 1.2 } },
        { img: 'desert-climb-plant-1', x: .79, row: 1230, w: .085, move: { type: 'rustle', amp: 4, speed: .9 } },
      ] },
    ],
    pieces: [{ img: 'desert-n-movers-2', cell: 850, prob: .66, w: 65, speed: 24, bob: 3, sway: .025, minH: 380, face: 1 }] },
  underwater: { floor: 'underwater-n-floor', floorTileWidth: 640, overlapTerrain: true,
    sky: ['#9ecfd3', '#c7e3df'], texture: 'water-light', layers: ['bubbles'],
    parallax: [
      { img: 'underwater-climb-backdrop', par: .10, lift: 545, scale: .65 },
      { img: 'underwater-climb-ship', par: .11, lift: 570, single: { x: .59, w: .87, sy: 1,
        spin: { img: 'underwater-climb-wheel', fx: .79, fy: .615, size: .10, speed: .36 } } },
      { img: 'underwater-climb-distant', par: .29, lift: 385, scale: .58, filter: 'saturate(.67)' },
      { img: 'underwater-climb-middle', par: .58, lift: 302, scale: .60, overlapFrom: .95 },
      { img: 'underwater-climb-foreground', par: 1, lift: 26, scale: .57, grounded: true, overlapFrom: .95, props: [
        { img: 'underwater-climb-kelp-0', x: .22, row: 1180, w: .10, move: { type: 'rustle', amp: 4, speed: .78 } },
        { img: 'underwater-climb-kelp-1', x: .75, row: 1185, w: .11, move: { type: 'rustle', amp: 5, speed: .95 } },
      ],
    pieces: [
      { img: 'underwater-n-movers-0', cell: 330, prob: .85, w: 53, speed: 42, bob: 4, sway: .025, minH: 60, face: 1 },
      { img: 'underwater-n-movers-1', cell: 720, prob: .60, w: 67, speed: 29, bob: 5, sway: .04, minH: 170, face: 1 },
    ] },
    ],
    pieces: [
      { img: 'underwater-n-movers-0', cell: 330, prob: .85, w: 53, speed: 42, bob: 4, sway: .025, minH: 60, face: 1 },
      { img: 'underwater-n-movers-1', cell: 720, prob: .60, w: 67, speed: 29, bob: 5, sway: .04, minH: 170, face: 1 },
    ] },
  space: { floor: 'space-n-floor', floorTileWidth: 640,  sky: ['#242341', '#383453'], texture: 'star-field', movers: ['twinkle'],
    parallax: [{ img: 'space-n-farthest', par: 0.09, lift: 375, scale: 2.3 },
      { img: 'space-n-far', par: 0.16, lift: 335, scale: 2.1 },
      { img: 'space-n-mid', par: 0.34, lift: 300, scale: 1.64, props: [{ img: 'space-n-reveals-0', x: 0.14, row: 591, w: 0.125 }, { img: 'space-n-reveals-1', x: 0.5, row: 591, w: 0.124 }, { img: 'space-n-reveals-2', x: 0.84, row: 591, w: 0.058 }, { img: 'space-n-anim-0', x: 0.72, row: 591, w: 0.087, spin:  { img: 'space-n-anim-1', fx: .5, fy: .06, size: 1.2, speed: .6 } }], drifters: [{ img: 'space-n-movers-3', x: 0.5, row: 591, w: 0.047, speed: 8, bob: 0 }] },
      { img: 'space-n-near', par: 0.6, lift: 135, scale: 1.75, props: [{ img: 'space-n-loose-0', x: 0.06, row: 389, w: 0.020 }, { img: 'space-n-loose-1', x: 0.24, row: 389, w: 0.019 }, { img: 'space-n-loose-2', x: 0.42, row: 389, w: 0.034 }, { img: 'space-n-loose-3', x: 0.6, row: 389, w: 0.033 }, { img: 'space-n-loose-6', x: 0.78, row: 389, w: 0.035 }, { img: 'space-n-loose-8', x: 0.93, row: 389, w: 0.028 }] }],
    pieces: [{ img: 'space-n-movers-0', cell: 2200, prob: 0.6, w: 110, speed: 40, bob: 3, sway: 0.02, minH: 520, face: 1 }, { img: 'space-n-movers-1', cell: 2600, prob: 0.6, w: 84, speed: 22, bob: 3, sway: 0.02, minH: 560, face: 1 }, { img: 'space-n-movers-2', cell: 2000, prob: 0.6, w: 80, speed: 10, bob: 3, sway: 0.02, minH: 460, face: 1 }, { img: 'space-n-movers-4', cell: 2400, prob: 0.6, w: 62, speed: 8, bob: 2, sway: 0.02, minH: 500, face: 1 }, { img: 'space-n-movers-5', cell: 3200, prob: 0.6, w: 100, speed: 52, bob: 3, sway: 0.02, minH: 620, face: 1 }],
    skyPieces: [{ img: 'space-n-big-0', y: 3600, x: .66, w: 190 }, { img: 'space-n-big-0', y: 15000, x: .25, w: 150 }] },
  enchanted: { sky: ['#c8badf', '#efe2f2'], layers: ['enchanted-mist', 'magic-motes'], fireflies: 'always' , tall: ['enchanted-tall-low', 'enchanted-tall-mid', 'enchanted-tall-high']},
  mountain: { floor: 'mountain-n-floor', floorTileWidth: 640, overlapTerrain: true,
    sky: ['#7fb0e6', '#d3e5f4'], floaters: ['cloud-set-day'],
    parallax: [
      { img: 'mountain-climb-backdrop', par: .10, lift: 577, scale: .65 },
      { img: 'mountain-climb-peak', par: .15, lift: 577, single: { x: .55, w: .97, sy: 1 } },
      { img: 'mountain-climb-distant', par: .28, lift: 446, scale: .59, flows: [{ img: 'mountain-flow-distant', x: 0, y: 0, ripple: { rows: 48, speed: 1.6 } }] },
      { img: 'mountain-climb-middle', par: .56, lift: 373, scale: .58, overlapFrom: .95, flows: [{ img: 'mountain-flow-middle', x: 0, y: 0, ripple: { rows: 46, speed: 1.25 } }], props: [
        { img: 'mountain-climb-gondola', x: .88, row: 741, w: .072, move: { type: 'dangle', amp: 5, speed: 1.15 } },
        { img: 'mountain-climb-flags', x: .24, row: 1010, w: .085, move: { type: 'rustle', amp: 4, speed: 1.6 } },
      ] },
      { img: 'mountain-climb-foreground', par: 1, lift: 0, scale: .58, grounded: true, overlapFrom: .95 },
    ] },
  jungle: { floor: 'jungle-n-floor', floorTileWidth: 640, overlapTerrain: true,
    sky: ['#80bddc', '#d1e9c7'], floaters: ['cloud-set-day'],
    parallax: [
      { img: 'jungle-n-far', par: .10, lift: 539, scale: 1.25, filter: 'brightness(.84)' },
      { img: 'jungle-climb-distant', par: .16, lift: 420, scale: .60, overlapFrom: .95 },
      { img: 'jungle-climb-temple', par: .23, lift: 554, single: { x: .55, w: .91, sy: 1, torches: { stand: 'jungle-climb-torch', flame: 'jungle-climb-flame' }, hang: [
        { img: 'forest-n-vine-2', fx: .34, fy: .40, w: .031, speed: .77, swing: .045 },
        { img: 'forest-n-vine-3', fx: .70, fy: .48, w: .035, speed: .92, swing: .05 },
      ] } },
      { img: 'jungle-climb-bank', par: .23, lift: 217, scale: .67, overlapFrom: .95 },
      { img: 'jungle-climb-middle', par: .56, lift: 387, scale: .59, overlapFrom: .95 },
      { img: 'jungle-climb-foreground', par: 1, lift: 0, scale: .58, grounded: true, overlapFrom: .95, props: [
        { img: 'jungle-n-loose-1', x: .23, row: 1155, w: .12, move: { type: 'rustle', amp: 4, speed: 1.05 } },
        { img: 'jungle-n-loose-0', x: .77, row: 1225, w: .10, move: { type: 'rustle', amp: 3, speed: .86 } },
      ] },
    ] },
  cave: { floor: 'cave-n-floor', floorTileWidth: 640,  sky: ['#1f1936', '#4a3c66'], night: true, floaters: ['mist-set'],
    parallax: [{ img: 'cave-n-farthest', par: 0.09, lift: 375, scale: 2.26 },
      { img: 'cave-n-big-0', par: .06, lift: 569, single: { x: 0.5, w: 1.25, sy: 1 } },
      { img: 'cave-n-far', par: 0.16, lift: 335, scale: 1.84, drifters: [{ img: 'cave-n-movers-5', x: 0.3, row: 591, w: 0.029, speed: 8, bob: 0 }] },
      { img: 'cave-n-mid', par: 0.34, lift: 300, scale: 1.57, props: [{ img: 'cave-n-reveals-0', x: 0.14, row: 591, w: 0.152 }, { img: 'cave-n-reveals-1', x: 0.5, row: 591, w: 0.134 }, { img: 'cave-n-reveals-2', x: 0.84, row: 591, w: 0.156 }, { img: 'cave-n-anim-0', x: 0.72, row: 591, w: 0.125, spin:  { img: 'cave-n-anim-1', fx: .83, fy: .78, size: .3, speed: 1.0, swing: .12, px: .5, py: 0 } }], drifters: [{ img: 'cave-n-movers-3', x: 0.5, row: 591, w: 0.033, speed: 10, bob: 0 }] },
      { img: 'cave-n-near', par: 0.6, lift: 135, scale: 1.0, props: [{ img: 'cave-n-loose-0', x: 0.06, row: 690, w: 0.050 }, { img: 'cave-n-loose-1', x: 0.24, row: 690, w: 0.053 }, { img: 'cave-n-loose-2', x: 0.42, row: 690, w: 0.061 }, { img: 'cave-n-loose-3', x: 0.6, row: 690, w: 0.016 }, { img: 'cave-n-loose-5', x: 0.78, row: 690, w: 0.077 }, { img: 'cave-n-loose-7', x: 0.93, row: 690, w: 0.034 }, { img: 'cave-n-movers-0', x: 0.4, row: 690, w: 0.094, move: { type: 'nod', amp: 4, speed: 0.7 } }] }],
    pieces: [{ img: 'cave-n-movers-0', cell: 1700, prob: 0.6, w: 70, speed: 26, bob: 3, sway: 0.02, minH: 380, face: 1 }, { img: 'cave-n-movers-1', cell: 1500, prob: 0.6, w: 56, speed: 14, bob: 6, sway: 0.05, minH: 340, face: 1 }, { img: 'cave-n-movers-2', cell: 2200, prob: 0.6, w: 76, speed: 24, bob: 3, sway: 0.02, minH: 440, face: 1 }] },
  volcano: { floor: 'volcano-n-floor', floorTileWidth: 640,  sky: ['#3d2433', '#7c4a48'], glow: '#ff7a3c', floaters: ['ember-set'],
    parallax: [{ img: 'volcano-n-farthest', par: 0.09, lift: 375, scale: 2.2 },
      { img: 'volcano-n-big-0', par: .06, lift: 398, single: { x: 0.5, w: 1.25, sy: 1 } },
      { img: 'volcano-n-far', par: 0.16, lift: 335, scale: 2.05 },
      { img: 'volcano-n-mid', par: 0.34, lift: 300, scale: 1.51, props: [{ img: 'volcano-n-reveals-0', x: 0.14, row: 591, w: 0.124 }, { img: 'volcano-n-reveals-1', x: 0.5, row: 591, w: 0.150 }, { img: 'volcano-n-reveals-2', x: 0.84, row: 591, w: 0.088 }, { img: 'volcano-n-anim-0', x: 0.72, row: 591, w: 0.144, spin:  { img: 'volcano-n-anim-1', fx: .5, fy: .1, size: .45, speed: .7 } }], drifters: [{ img: 'volcano-n-movers-3', x: 0.5, row: 591, w: 0.042, speed: 14, bob: 0 }] },
      { img: 'volcano-n-near', par: 0.6, lift: 135, scale: 2.03, props: [{ img: 'volcano-n-loose-0', x: 0.06, row: 577, w: 0.024 }, { img: 'volcano-n-loose-1', x: 0.24, row: 577, w: 0.031 }, { img: 'volcano-n-loose-2', x: 0.42, row: 577, w: 0.036 }, { img: 'volcano-n-loose-5', x: 0.6, row: 577, w: 0.011 }, { img: 'volcano-n-loose-6', x: 0.78, row: 577, w: 0.026 }, { img: 'volcano-n-loose-8', x: 0.93, row: 577, w: 0.056 }, { img: 'volcano-n-movers-4', x: 0.3, row: 577, w: 0.034, move: { type: 'hop', amp: 5, speed: 1 } }] }],
    pieces: [{ img: 'volcano-n-movers-0', cell: 1700, prob: 0.6, w: 72, speed: 26, bob: 3, sway: 0.02, minH: 400, face: 1 }, { img: 'volcano-n-movers-1', cell: 2400, prob: 0.6, w: 100, speed: 18, bob: 3, sway: 0.02, minH: 520, face: 1 }, { img: 'volcano-n-movers-2', cell: 2800, prob: 0.6, w: 90, speed: 22, bob: 3, sway: 0.02, minH: 560, face: 1 }, { img: 'volcano-n-movers-5', cell: 3000, prob: 0.6, w: 96, speed: 24, bob: 3, sway: 0.02, minH: 600, face: 1 }] },
  blossom: { floor: 'blossom-n-floor', floorTileWidth: 640,  sky: ['#f4d6e4', '#fcf0f2'], floaters: ['cloud-set-day'], flyers: 'doves', fireflies: true,
    parallax: [{ img: 'blossom-n-farthest', par: 0.09, lift: 375, scale: 2.32 },
      { img: 'blossom-n-big-0', par: .06, lift: 506, single: { x: 0.5, w: 1.25, sy: 1 } },
      { img: 'blossom-n-far', par: 0.16, lift: 335, scale: 1.95, drifters: [{ img: 'blossom-n-movers-0', x: 0.3, row: 591, w: 0.039, speed: 6, bob: 0 }, { img: 'blossom-n-movers-1', x: 0.7, row: 591, w: 0.064, speed: 14, bob: 0 }] },
      { img: 'blossom-n-mid', par: 0.34, lift: 300, scale: 1.56, props: [{ img: 'blossom-n-reveals-0', x: 0.14, row: 591, w: 0.122 }, { img: 'blossom-n-reveals-1', x: 0.5, row: 591, w: 0.249 }, { img: 'blossom-n-reveals-2', x: 0.84, row: 591, w: 0.131 }, { img: 'blossom-n-anim-0', x: 0.72, row: 591, w: 0.100, spin:  { img: 'blossom-n-anim-1', fx: .5, fy: .07, size: .75, speed: 1.3 } }, { img: 'blossom-n-movers-3', x: 0.55, row: 591, w: 0.033, move: { type: 'pop', amp: 0, speed: 0.4 } }] },
      { img: 'blossom-n-near', par: 0.6, lift: 135, scale: 1.0, props: [{ img: 'blossom-n-loose-0', x: 0.06, row: 617, w: 0.028 }, { img: 'blossom-n-loose-1', x: 0.24, row: 617, w: 0.052 }, { img: 'blossom-n-loose-3', x: 0.42, row: 617, w: 0.050 }, { img: 'blossom-n-loose-5', x: 0.6, row: 617, w: 0.048 }, { img: 'blossom-n-loose-7', x: 0.78, row: 617, w: 0.069 }, { img: 'blossom-n-loose-8', x: 0.93, row: 617, w: 0.051 }, { img: 'blossom-n-movers-2', x: 0.3, row: 617, w: 0.196, move: { type: 'nod', amp: 4, speed: 0.6 } }] }],
    pieces: [{ img: 'blossom-n-movers-2', cell: 1800, prob: 0.6, w: 70, speed: 12, bob: 6, sway: 0.05, minH: 400, face: 1 }, { img: 'blossom-n-movers-3', cell: 2400, prob: 0.6, w: 50, speed: 8, bob: 6, sway: 0.05, minH: 440, face: 1 }, { img: 'blossom-n-movers-5', cell: 2000, prob: 0.6, w: 70, speed: 7, bob: 4, sway: 0.03, minH: 480, face: 1 }] },
  library: { floor: 'library-n-floor', floorTileWidth: 640, floorDrifters: [{ img: 'library-n-movers-0', lane: 0.5, w: 0.063, speed: 24, start: 0.2, bob: 0.3 }, { img: 'library-n-movers-3', lane: 0.5, w: 0.063, speed: 12, start: 0.55 }, { img: 'library-n-movers-4', lane: 0.5, w: 0.041, speed: 18, start: 0.75, bob: 0.3 }, { img: 'library-n-movers-5', lane: 0.5, w: 0.062, speed: 10, start: 0.4, bob: 0.3 }], sky: ['#ecd6b2', '#f6e8cb'],
    parallax: [{ img: 'library-n-far', par: .16, lift: 330, scale: 0.85, props: [{ img: 'library-n-big-0', x: 0.5, row: 360, w: 0.198 }] },
      { img: 'library-n-mid', par: .34, lift: 166, scale: 0.75, props: [{ img: 'library-n-reveals-0', x: 0.14, row: 546, w: 0.084 }, { img: 'library-n-reveals-1', x: 0.5, row: 546, w: 0.095 }, { img: 'library-n-reveals-2', x: 0.84, row: 546, w: 0.057 }, { img: 'library-n-anim-0', x: 0.72, row: 546, w: 0.178, spin: { img: 'library-n-anim-1', fx: .86, fy: .45, size: .35, speed: 1.0, swing: .15, px: .5, py: 0 } }] },
      { img: 'library-n-near', par: .6, lift: 155, scale: 0.7, props: [{ img: 'library-n-loose-0', x: 0.08, row: 706, w: 0.053 }, { img: 'library-n-loose-2', x: 0.3, row: 706, w: 0.047 }, { img: 'library-n-loose-3', x: 0.55, row: 706, w: 0.028 }, { img: 'library-n-loose-5', x: 0.8, row: 706, w: 0.063 }] }],
    pieces: [{ img: 'library-n-movers-1', cell: 1800, prob: 0.6, w: 68, speed: 26, bob: 3, sway: 0.02, minH: 380, face: 1 }, { img: 'library-n-movers-2', cell: 2300, prob: 0.6, w: 64, speed: 16, bob: 5, sway: 0.03, minH: 440, face: 1 }] },
  workshop: { floor: 'workshop-n-floor', floorTileWidth: 640, floorDrifters: [{ img: 'workshop-n-movers-0', lane: 0.5, w: 0.032, speed: 20, start: 0.2, bob: 0.3 }, { img: 'workshop-n-movers-1', lane: 0.5, w: 0.061, speed: 40, start: 0.5 }, { img: 'workshop-n-movers-3', lane: 0.5, w: 0.043, speed: 10, start: 0.7 }, { img: 'workshop-n-movers-4', lane: 0.5, w: 0.038, speed: 26, start: 0.35, bob: 0.3 }, { img: 'workshop-n-movers-5', lane: 0.5, w: 0.071, speed: 16, start: 0.85 }], sky: ['#d6dbe0', '#eef0f2'],
    parallax: [{ img: 'workshop-n-far', par: .16, lift: 330, scale: 0.85, props: [{ img: 'workshop-n-big-0', x: 0.5, row: 360, w: 0.258 }] },
      { img: 'workshop-n-mid', par: .34, lift: 166, scale: 0.75, props: [{ img: 'workshop-n-reveals-0', x: 0.14, row: 546, w: 0.085 }, { img: 'workshop-n-reveals-1', x: 0.5, row: 546, w: 0.086 }, { img: 'workshop-n-reveals-2', x: 0.84, row: 546, w: 0.150 }, { img: 'workshop-n-anim-0', x: 0.72, row: 546, w: 0.152, spin: { img: 'workshop-n-anim-1', fx: .5, fy: .5, size: .7, speed: .8 } }] },
      { img: 'workshop-n-near', par: .6, lift: 154, scale: 0.7, props: [{ img: 'workshop-n-loose-0', x: 0.08, row: 704, w: 0.046 }, { img: 'workshop-n-loose-2', x: 0.3, row: 704, w: 0.081 }, { img: 'workshop-n-loose-3', x: 0.55, row: 704, w: 0.130 }, { img: 'workshop-n-loose-6', x: 0.8, row: 704, w: 0.117 }] }],
    pieces: [{ img: 'workshop-n-movers-2', cell: 1700, prob: 0.6, w: 62, speed: 26, bob: 3, sway: 0.02, minH: 380, face: 1 }] },
  rooftop: { sky: ['#8c76c7', '#f49b80'], nightSky: ['#262953', '#61547d'], night: 'dark', floaters: ['cloud-set-sunset'], cloudClear: 220,
    rooftop: { city: 'rooftop-sunset-city',
      far: 'rooftop-sunset-near', garden: 'rooftop-sunset-garden', deck: 'rooftop-sunset-deck',
      tower: 'rooftop-sunset-tower', hour: 'rooftop-sunset-hour', minute: 'rooftop-sunset-minute',
      sun: 'resort-sun', moon: 'resort-moon' } },
  stadium: { floor: 'stadium-n-floor', floorTileWidth: 640,  sky: ['#b9d9e8', '#e9f2ec'], floaters: ['cloud-set-day'],
    parallax: [{ img: 'stadium-n-farthest', par: 0.09, lift: 375, scale: 2.33 },
      { img: 'stadium-n-big-0', par: .06, lift: 463, single: { x: 0.5, w: 1.25, sy: 1 } },
      { img: 'stadium-n-far', par: 0.16, lift: 335, scale: 2.05, drifters: [{ img: 'stadium-n-movers-4', x: 0.7, row: 591, w: 0.035, speed: 12, bob: 0 }] },
      { img: 'stadium-n-mid', par: 0.34, lift: 300, scale: 1.56, props: [{ img: 'stadium-n-reveals-0', x: 0.14, row: 591, w: 0.055 }, { img: 'stadium-n-reveals-1', x: 0.5, row: 591, w: 0.046 }, { img: 'stadium-n-reveals-2', x: 0.84, row: 591, w: 0.108 }, { img: 'stadium-n-anim-0', x: 0.72, row: 591, w: 0.042, spin:  { img: 'stadium-n-anim-1', fx: .5, fy: .31, size: .85, speed: .5, px: .14, py: .89 } }], drifters: [{ img: 'stadium-n-movers-2', x: 0.3, row: 591, w: 0.044, speed: 10, bob: 0 }] },
      { img: 'stadium-n-near', par: 0.6, lift: 135, scale: 1.37, props: [{ img: 'stadium-n-loose-0', x: 0.06, row: 559, w: 0.060 }, { img: 'stadium-n-loose-2', x: 0.24, row: 559, w: 0.073 }, { img: 'stadium-n-loose-3', x: 0.42, row: 559, w: 0.025 }, { img: 'stadium-n-loose-5', x: 0.6, row: 559, w: 0.068 }, { img: 'stadium-n-loose-6', x: 0.78, row: 559, w: 0.031 }, { img: 'stadium-n-loose-7', x: 0.93, row: 559, w: 0.081 }], drifters: [{ img: 'stadium-n-movers-3', x: 0.5, row: 559, w: 0.042, speed: 24, bob: 0 }] }] },
};
const layeredReveals = {

  blossom: { fallingPetals: 'petal-leaf-set', parallax: [
    {"img":"blossom-reveal-back","par":0.09,"lift":622,"scale":0.65},
    {"img":"blossom-reveal-landmark","par":0.15,"lift":615,"single":{"x":0.54,"w":0.89,"sy":1}},
    {"img":"blossom-reveal-far","par":0.27,"lift":442,"scale":0.63,"overlapFrom":0.95},
    {"img":"blossom-reveal-mid","par":0.55,"lift":367,"scale":0.58,"overlapFrom":0.95,"props":[{"img":"blossom-reveal-lantern","glow":true,"x":0.57,"row":557,"w":0.043,"move":{"type":"dangle","amp":4,"speed":1.1}}]},
    {"img":"blossom-reveal-front","par":1,"lift":78,"scale":0.58,"grounded":true,"overlapFrom":0.95,"props":[{"img":"blossom-reveal-bamboo","x":0.15,"row":938,"w":0.11,"move":{"type":"rustle","amp":4,"speed":1.1}}]}
  ] },
  fair: { parallax: [
    {"img":"fair-reveal-back","par":0.09,"lift":588,"scale":0.65},
    {"img":"fair-reveal-stand","par":0.15,"lift":509,"single":{"x":0.54,"w":0.69,"sy":1,"spin":{"img":"fair-reveal-wheel","carriage":"fair-reveal-carriage","fx":0.5,"fy":0.145,"size":0.98,"speed":0.45}}},
    { img: 'fair-reveal-zoo', par: .15, lift: 305, scale: .56, overlapFrom: .95 },
    {"img":"fair-reveal-far","par":0.27,"lift":309,"scale":0.63,"overlapFrom":0.95},
    {"img":"fair-reveal-mid","par":0.55,"lift":342,"scale":0.58,"overlapFrom":0.95,"props":[]},
    {"img":"fair-reveal-front","par":1,"lift":5,"scale":0.58,"grounded":true,"overlapFrom":0.95,"props":[]}
  ] },
  cave: { roomBack: 'cave-reveal-wall', roomBackParallax: .12, floorInset: 0, parallax: [
    {"img":"cave-reveal-landmark","par":0.15,"lift":597,"single":{"x":0.54,"w":0.89,"sy":1},"glint":{"img":"cave-reveal-glint","points":[[0.37,0.33],[0.59,0.46],[0.71,0.61],[0.36,0.6],[0.18,0.51],[0.25,0.73],[0.54,0.83],[0.73,0.76]]}},
    {"img":"cave-reveal-far","par":0.27,"lift":402,"scale":0.63,"overlapFrom":0.95,"glint":{"img":"cave-reveal-glint","points":[[0.14,0.3],[0.22,0.35],[0.5,0.35],[0.57,0.45],[0.84,0.5],[0.08,0.86],[0.91,0.9]]}},
    {"img":"cave-reveal-mid","par":0.55,"lift":318,"scale":0.58,"overlapFrom":0.95,"props":[],"glint":{"img":"cave-reveal-glint","points":[[0.8,0.54],[0.9,0.65],[0.59,0.66],[0.54,0.76],[0.17,0.76],[0.39,0.78],[0.98,0.71]]}},
    {"img":"cave-reveal-front","par":1,"lift":49,"scale":0.58,"grounded":true,"overlapFrom":0.95,"props":[{"img":"cave-reveal-mushroom","x":0.72,"row":990,"w":0.085,"move":{"type":"pulse","amp":4,"speed":5}}],"glint":{"img":"cave-reveal-glint","points":[[0.31,0.79],[0.38,0.84],[0.91,0.84],[0.96,0.86]]}}
  ] },
  kitchen: { roomBack: 'kitchen-reveal-back', parallax: [
    {"img":"kitchen-reveal-landmark","par":0.15,"lift":460,"single":{"x":0.54,"w":0.89,"sy":1}},
    {"img":"kitchen-reveal-far","par":0.27,"lift":350,"scale":0.63,"overlapFrom":0.95},
    {"img":"kitchen-reveal-mid","par":0.55,"lift":290,"scale":0.58,"overlapFrom":0.95,"props":[{"img":"kitchen-reveal-pan","x":0.6,"row":810,"w":0.055,"move":{"type":"dangle","amp":4,"speed":1.1}},{"img":"kitchen-reveal-fan","x":0.23,"row":608,"w":0.12,"move":{"type":"spin","amp":4,"speed":1.1}},{"img":"kitchen-reveal-curtain","x":0.13,"row":803,"w":0.075,"move":{"type":"rustle","amp":4,"speed":1.1}}]},
    {"img":"kitchen-reveal-front","par":1,"lift":26,"scale":0.58,"grounded":true,"overlapFrom":0.95,"props":[]}
  ] },
  library: { roomBack: 'library-reveal-back', parallax: [
    {"img":"library-reveal-landmark","par":0.15,"lift":460,"single":{"x":0.54,"w":0.89,"sy":1}},
    {"img":"library-reveal-far","par":0.27,"lift":350,"scale":0.63,"overlapFrom":0.95},
    {"img":"library-reveal-mid","par":0.55,"lift":290,"scale":0.58,"overlapFrom":0.95,"props":[{"img":"library-reveal-chandelier","x":0.49,"row":694,"w":0.15,"move":{"type":"dangle","amp":4,"speed":1.1}},{"img":"library-reveal-armillary","x":0.7,"row":855,"w":0.11,"move":{"type":"spin","amp":4,"speed":1.1}},{"img":"library-reveal-curtain","x":0.2,"row":803,"w":0.07,"move":{"type":"dangle","amp":4,"speed":1.1}}]},
    {"img":"library-reveal-front","par":1,"lift":26,"scale":0.58,"grounded":true,"overlapFrom":0.95,"props":[]}
  ] },
  living: { roomBack: 'living-reveal-back', parallax: [
    {"img":"living-reveal-landmark","par":0.15,"lift":460,"single":{"x":0.54,"w":0.89,"sy":1,"hang":[{"img":"living-reveal-pendulum","fx":0.5,"fy":0.68,"w":0.16,"speed":1.1,"swing":0.08}],"spin":{"img":"living-reveal-hands","fx":0.5,"fy":0.4,"size":0.26,"speed":0.45,"py":0.9}}},
    {"img":"living-reveal-far","par":0.27,"lift":350,"scale":0.63,"overlapFrom":0.95},
    {"img":"living-reveal-mid","par":0.55,"lift":290,"scale":0.58,"overlapFrom":0.95,"props":[{"img":"living-reveal-curtain","x":0.14,"row":810,"w":0.072,"move":{"type":"dangle","amp":4,"speed":1.1}}]},
    {"img":"living-reveal-front","par":1,"lift":26,"scale":0.58,"grounded":true,"overlapFrom":0.95,"props":[]}
  ] },
  grass: { skyPieces: [{ img: 'meadow-sun', y: 3000, x: .74, w: 130, day: true }], parallax: [
    {"img":"grass-reveal-back","par":0.09,"lift":578,"scale":0.65},
    {"img":"grass-reveal-far","par":0.12,"lift":445,"scale":0.63,"overlapFrom":0.95},
    {"img":"grass-reveal-landmark","par":0.15,"lift":570,"single":{"x":0.54,"w":0.89,"sy":1,"spin":{"img":"grass-reveal-wheel","fx":0.72,"fy":0.73,"size":0.51,"speed":0.45}}},
    { img: 'grass-reveal-flowered-hills', par: .15, lift: 147, scale: .66 },
    {"img":"grass-reveal-mid","par":0.55,"lift":168,"scale":0.58,"overlapFrom":0.95,"props":[]},
    {"img":"grass-reveal-front","par":1,"lift":-28,"scale":0.58,"grounded":true,"overlapFrom":0.95,"props":[]}
  ] },
  space: { movers: ['twinkle', 'comet'], skyPieces: [{ img: 'space-reveal-planet', screenY: .145, par: .045, x: .5, wFrac: .65 }], parallax: [
    {"img":"space-reveal-landmark","par":0.15,"lift":568,"single":{"x":0.54,"w":0.89,"sy":1}},
    {"img":"space-reveal-back","par":0.22,"lift":340,"scale":0.63,"overlapFrom":0.95},
    {"img":"space-reveal-mid","par":0.55,"lift":309,"scale":0.58,"overlapFrom":0.95,"props":[]},
    {"img":"space-reveal-front","par":1,"lift":35,"scale":0.58,"grounded":true,"overlapFrom":0.95,"props":[{"img":"space-reveal-flag","x":0.18,"row":893,"w":0.057},{"img":"space-reveal-rover","x":0.64,"row":988,"w":0.155,"spin":{"img":"space-reveal-arm","fx":0.56,"fy":0.12,"size":0.40,"speed":1.1,"swing":0.20,"px":0.21,"py":0.96}}]}
  ] },

  stadium: { parallax: [
    { img: 'stadium-reveal-back', par: .09, lift: 700, single: { x: .5, w: 1.25, sy: 1, overlapFrom: .88 } },
    { img: 'stadium-reveal-far', par: .24, lift: 530, scale: .65, overlapFrom: .97,
      crowd: { img: 'stadium-reveal-fans', seats: [
        [113, 331], [278, 350], [541, 331], [650, 373],
        [119, 547], [235, 582], [453, 545], [628, 605],
        [111, 761], [272, 793], [568, 759], [624, 842],
        [124, 977], [327, 997], [481, 976], [661, 998],
      ] }, props: [
      { img: 'stadium-reveal-landmark', x: .78, snap: 14, w: .14 },
    ] },
  ] },
  tabletop: { roomBack: 'tabletop-reveal-back', parallax: [
    {"img":"tabletop-reveal-landmark","par":0.15,"lift":460,"single":{"x":0.54,"w":0.89,"sy":1}},
    {"img":"tabletop-reveal-far","par":0.27,"lift":350,"scale":0.63,"overlapFrom":0.95},
    {"img":"tabletop-reveal-mid","par":0.55,"lift":290,"scale":0.58,"overlapFrom":0.95,"props":[{"img":"tabletop-reveal-fan","x":0.73,"row":825,"w":0.12,"move":{"type":"spin","amp":4,"speed":1.1}},{"img":"tabletop-reveal-mobile","x":0.2,"row":746,"w":0.085,"move":{"type":"dangle","amp":4,"speed":1.1}}]},
    {"img":"tabletop-reveal-front","par":1,"lift":26,"scale":0.58,"grounded":true,"overlapFrom":0.95,"props":[]}
  ] },
  volcano: { parallax: [
    {"img":"volcano-reveal-back","par":0.09,"lift":625,"scale":0.65,"flows":[{"img":"volcano-flow-back","x":0,"y":0,"ripple":{"rows":30,"speed":2.1,"warm":true}}]},
    {"img":"volcano-reveal-landmark","par":0.15,"lift":549,"single":{"x":0.54,"w":0.89,"sy":1,"smoke":"mist"},"flows":[{"img":"volcano-flow-landmark","x":0,"y":0,"ripple":{"rows":30,"speed":2.1,"warm":true}}]},
    {"img":"volcano-reveal-far","par":0.27,"lift":415,"scale":0.63,"overlapFrom":0.95,"flows":[{"img":"volcano-flow-far","x":0,"y":0,"ripple":{"rows":30,"speed":2.1,"warm":true}}]},
    {"img":"volcano-reveal-mid","par":0.55,"lift":345,"scale":0.58,"overlapFrom":0.95,"flows":[{"img":"volcano-reveal-flow","x":0,"y":0,"ripple":{"rows":34,"speed":2.1,"warm":true}}]},
    {"img":"volcano-reveal-front","par":1,"lift":-30.72,"scale":0.58,"grounded":true,"overlapFrom":0.95,"props":[{"img":"volcano-reveal-flame","x":0.8,"row":945,"w":0.065,"move":{"type":"pulse","amp":4,"speed":5}}],"flows":[{"img":"volcano-flow-front","x":0,"y":0,"ripple":{"rows":30,"speed":2.1,"warm":true}}]}
  ] },
  workshop: { roomBack: 'workshop-reveal-back', parallax: [
    {"img":"workshop-reveal-landmark","par":0.15,"lift":460,"single":{"x":0.54,"w":0.89,"sy":1,"spin":{"img":"workshop-reveal-gear","fx":0.5,"fy":0.49,"size":0.77,"speed":0.45}}},
    {"img":"workshop-reveal-far","par":0.27,"lift":350,"scale":0.63,"overlapFrom":0.95},
    {"img":"workshop-reveal-mid","par":0.55,"lift":290,"scale":0.58,"overlapFrom":0.95,"props":[{"img":"workshop-reveal-cog","x":0.64,"row":825,"w":0.11,"move":{"type":"spin","amp":4,"speed":1.1}},{"img":"workshop-reveal-tool","x":0.21,"row":810,"w":0.045,"move":{"type":"dangle","amp":4,"speed":1.1}}]},
    {"img":"workshop-reveal-front","par":1,"lift":26,"scale":0.58,"grounded":true,"overlapFrom":0.95,"props":[]}
  ] },
};


for (const [id, scene] of Object.entries(layeredReveals)) {
  Object.assign(SETTINGS[id], {
    overlapTerrain: true, tall: undefined, pieces: undefined,
    floorDrifters: undefined, panels: undefined, decor: undefined, movers: undefined,
  }, scene);
}

const imageCache = new Map();
// Compress extreme object zooms into a gentle terrain zoom (1–1.35×).
export function groundScaleFor(cameraScale, finalScale) {
  const zoom = Math.max(0, Math.log(Math.max(cameraScale / finalScale, 1)));
  return 1 + .35 * (1 - Math.exp(-zoom * .22));
}
function loadImage(url) {
  if (!imageCache.has(url)) imageCache.set(url, new Promise(resolve => {
    const image = new Image(); image.onload = () => resolve(image); image.onerror = () => resolve(null); image.src = url;
  }));
  return imageCache.get(url);
}
// Load the selected kit before its first frame. A missing required floor falls back to grass.
export async function loadScenery(object, base) {
  const id = SETTINGS[object.sceneryOverride] ? object.sceneryOverride : sceneryFor(object), config = SETTINGS[id];
  const names = [!NO_STARS.has(id) && 'star-field', config.floor, ...Object.values(config.avenue || {}), ...Object.values(config.rooftop || {}), ...Object.values(config.coast || {}), ...Object.values(config.square || {}), ...Object.values(config.town || {}), config.fallingPetals, config.roomBack, config.texture, config.backdrop, ...(config.layers || []), config.nightBackdrop, config.wall, ...(config.tall || []), config.decor, ...(config.skyPieces || []).map(p => p.img), ...(config.parallax || []).flatMap(l => [l.img, l.single?.liftChair, l.glint?.img, l.crowd?.img, l.single?.spin?.carriage, l.single?.smoke, l.single?.torches?.stand, l.single?.torches?.flame, l.spin && l.spin.img, l.single && l.single.spin && l.single.spin.img, ...((l.single && l.single.hang) || []).map(q => q.img), ...(l.props || []).map(q => q.img), ...(l.props || []).map(q => q.spin && q.spin.img), ...(l.drifters || []).map(q => q.img), ...(l.glow || []), ...(l.flows || []).map(q => q.img), ...(l.vanes || []).map(q => q.img), ...(l.props || []).map(q => q.foam), ...((l.scatter && l.scatter.imgs) || [])]), ...(config.floorDrifters || []).map(q => q.img), config.wash && config.wash.img, config.wash && config.wash.foam, ...(config.pieces || []).map(q => q.img), ...(config.panels ? [config.panels.base, ...config.panels.mids, config.panels.top] : []), ...(config.floaters || [])].filter(Boolean);
  const images = Object.fromEntries(await Promise.all(names.map(async name => [name, await loadImage(base + name + '.webp')])));
  if ((config.town && Object.values(config.town).some(name => !images[name])) || (config.square && Object.values(config.square).some(name => !images[name])) || (config.coast && Object.values(config.coast).some(name => !images[name])) || (config.rooftop && Object.values(config.rooftop).some(name => !images[name])) || (config.floor && !images[config.floor]) || (config.avenue && ['pier', 'beach', 'ocean'].some(key => !images[config.avenue[key]]))) return { id: 'grass', config: SETTINGS.grass, images: {} };
  return { id, config, images };
}

// Repeating wall details share one camera offset.
// Geometry keeps these quiet patterns seamless at every phone width.
export function drawWallpaper(ctx, style, { width, height, shiftY, shiftX, dark }) {
  const tile = 56;
  const ox = ((shiftX * .08) % tile + tile) % tile;
  const oy = ((shiftY * .12) % tile + tile) % tile;
  ctx.save();
  for (let x = ox - tile; x < width; x += tile) {
    for (let y = oy - tile; y < height; y += tile) {
      const light = dark ? .7 : 1;
      if (style === 'tiles') {
        ctx.globalAlpha = .23 * light; ctx.fillStyle = '#789488';
        ctx.fillRect(x + 1, y + 1, 26, 26); ctx.fillRect(x + 29, y + 29, 26, 26);
        ctx.globalAlpha = .18 * light; ctx.strokeStyle = '#929b88'; ctx.lineWidth = 1;
        ctx.strokeRect(x + .5, y + .5, 28, 28); ctx.strokeRect(x + 28.5, y + .5, 28, 28);
        ctx.strokeRect(x + .5, y + 28.5, 28, 28); ctx.strokeRect(x + 28.5, y + 28.5, 28, 28);
      } else if (style === 'wood') {
        ctx.globalAlpha = .3 * light; ctx.strokeStyle = '#8a5a30'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x + .5, y); ctx.lineTo(x + .5, y + tile); ctx.moveTo(x + 28.5, y); ctx.lineTo(x + 28.5, y + tile); ctx.stroke();
        ctx.globalAlpha = .12 * light; ctx.fillStyle = '#6b4220'; ctx.fillRect(x + 4, y, 6, tile); ctx.fillRect(x + 36, y, 4, tile);
      } else if (style === 'brick') {
        ctx.globalAlpha = .3 * light; ctx.strokeStyle = '#7a4a3c'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(x, y + .5); ctx.lineTo(x + tile, y + .5); ctx.moveTo(x, y + 28.5); ctx.lineTo(x + tile, y + 28.5);
        ctx.moveTo(x + 28, y); ctx.lineTo(x + 28, y + 28); ctx.moveTo(x, y + 28); ctx.lineTo(x, y + tile); ctx.stroke();
      } else if (style === 'plaid') {
        ctx.globalAlpha = .13 * light; ctx.fillStyle = '#a88867';
        ctx.fillRect(x + 8, y, 10, tile); ctx.fillRect(x, y + 8, tile, 10);
        ctx.globalAlpha = .24 * light; ctx.strokeStyle = '#9b8061'; ctx.lineWidth = .8;
        ctx.beginPath(); ctx.moveTo(x + 28, y); ctx.lineTo(x + 28, y + tile);
        ctx.moveTo(x, y + 28); ctx.lineTo(x + tile, y + 28); ctx.stroke();
      } else {
        ctx.globalAlpha = .26 * light; ctx.strokeStyle = '#ad8c83'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(x, y + 28); ctx.lineTo(x + 28, y);
        ctx.lineTo(x + 56, y + 28); ctx.lineTo(x + 28, y + 56); ctx.closePath(); ctx.stroke();
        ctx.globalAlpha = .2 * light; ctx.fillStyle = '#ad8c83'; ctx.beginPath(); ctx.arc(x + 28, y + 28, 2, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  ctx.restore();
}

const backdropBounds = new WeakMap();
function visibleBounds(image) {
  if (backdropBounds.has(image)) return backdropBounds.get(image);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let left = canvas.width, top = canvas.height, right = -1, bottom = -1;
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
    if (data[(y * canvas.width + x) * 4 + 3] < 12) continue;
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  const bounds = right < left ? [0, 0, canvas.width, canvas.height] : [left, top, right - left + 1, bottom - top + 1];
  backdropBounds.set(image, bounds); return bounds;
}

// Rooted scenery shares the floor's exact camera translation on both axes.
// Atmospheric particles alone use slower parallax; vegetation must never leave its ground.
function drawBackdrop(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, groundScale = 1, anchorX = width / 2 }) {
  const name = dark && kit.config.nightBackdrop ? kit.config.nightBackdrop : kit.config.backdrop, image = kit.images[name]; if (!image) return;
  const bounds = visibleBounds(image), base = (floorY ?? height - 40) - 4 * groundScale + shiftY;
  if (kit.config.glow) {
    // Heat glow rising from the horizon, so the volcano feels lit from below.
    const g = ctx.createLinearGradient(0, base, 0, base - 260 * groundScale);
    g.addColorStop(0, kit.config.glow + (dark ? 'aa' : '70')); g.addColorStop(1, kit.config.glow + '00');
    ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, base - 260 * groundScale, width, 260 * groundScale); ctx.restore();
  }
  const alpha = { 'forest-greenery': .64, 'beach-sunset': .72, 'resort-sea': 1, 'farm-hay': 1,
    'desert-dunes': .72, 'desert-skyline': .95, 'enchanted-grove': .65, 'underwater-seaweed': .44, 'city-skyline': .85, 'stadium-stands': .75,
    'volcano-ridge': .9, 'blossom-trees': .85, 'library-wall': .95, 'workshop-wall': .95, 'snow-aurora': .9 }[name] ?? .8;
  ctx.save(); ctx.globalAlpha = alpha * (dark && name !== 'farm-hay' && name !== 'snow-aurora' ? .45 : 1);
  if (dark && name === 'farm-hay') ctx.filter = 'brightness(55%)';
  if (name === 'farm-hay' || name === 'underwater-seaweed') {
    const h = (name === 'farm-hay' ? 58 : 95) * groundScale;
    const w = h * bounds[2] / bounds[3];
    for (const [i, fraction] of [.14, .88].entries()) {
      const scale = i ? .8 : 1, x = anchorX + (width * fraction - anchorX) * groundScale - shiftX;
      ctx.drawImage(image, ...bounds, x - w * scale / 2, base - h * scale, w * scale, h * scale);
    }
  } else {
    const baseH = { 'forest-greenery': 170, 'beach-sunset': 125, 'resort-sea': 150, 'desert-dunes': 155, 'desert-skyline': 190, 'enchanted-grove': 180, 'city-skyline': 160, 'stadium-stands':300,
      'volcano-ridge': 190, 'blossom-trees': 200, 'library-wall': 230, 'workshop-wall': 230, 'snow-aurora': 200 }[name] ?? 160;
    const center0 = anchorX + (width / 2 - anchorX) * groundScale - shiftX;
    if (name === 'resort-sea') {
      // Whole strip across the screen; only the water part is stretched taller so the boats and island keep their shape.
      const w = width * 1.3 * groundScale, k = w / bounds[2], split = 399 - bounds[1], waterH = (bounds[3] - split) * k * 2.1, objH = split * k;
      ctx.drawImage(image, bounds[0], bounds[1], bounds[2], split, center0 - w / 2, base - waterH - objH, w, objH);
      ctx.drawImage(image, bounds[0], bounds[1] + split, bounds[2], bounds[3] - split, center0 - w / 2, base - waterH, w, waterH);
    } else {
      const baseH = { 'forest-greenery': 170, 'beach-sunset': 125, 'desert-dunes': 155, 'desert-skyline': 190, 'enchanted-grove': 180, 'city-skyline': 160, 'stadium-stands':300,
        'volcano-ridge': 190, 'blossom-trees': 200, 'library-wall': 230, 'workshop-wall': 230, 'snow-aurora': 200 }[name] ?? 160;
      const h = baseH * groundScale, w = Math.max(width + 100, baseH * bounds[2] / bounds[3]) * groundScale;
      ctx.drawImage(image, ...bounds, center0 - w / 2, base - h, w, h);
    }
  }
  ctx.restore();
}

// Atmospheric layers follow the climb with the original cloud parallax.
const tallSolid = new WeakMap();
// Where each panel is solid: first and last rows that are mostly opaque (as fractions of its height).
function solidRows(image) {
  if (tallSolid.has(image)) return tallSolid.get(image);
  const cw = 111, ch = 222, canvas = document.createElement('canvas'); canvas.width = cw; canvas.height = ch;
  const c = canvas.getContext('2d'); c.drawImage(image, 0, 0, cw, ch);
  const data = c.getImageData(0, 0, cw, ch).data;
  let top = -1, bottom = -1;
  for (let y = 0; y < ch; y++) {
    let n = 0; for (let x = 0; x < cw; x++) if (data[(y * cw + x) * 4 + 3] > 200) n++;
    if (n >= cw * .4) { if (top < 0) top = y; bottom = y; }
  }
  const rows = top < 0 ? [0, 1] : [top / ch, (bottom + 1) / ch];
  tallSolid.set(image, rows); return rows;
}
function seededFlip(seed, i) {
  let h = 2166136261;
  for (const c of `${seed}:${i}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) % 2 === 1;
}
// Tall climb backdrops: panels (low, mid, high) rooted to the ground. Each panel's faded lower edge sits
// behind the solid part of the panel in front of it, so land never starts in the middle of open sky.
function drawTall(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, groundScale = 1, anchorX = width / 2, seed = kit.id }) {
  const names = kit.config.tall; if (!names) return;
  // tallScale makes every panel bigger (fewer windows per climb); tallMeet is how far into the panel in front the next one tucks in.
  // Never narrower than the screen, even when the camera has zoomed out.
  const w = Math.max((width + 100) * groundScale, width + 60) * (kit.config.tallScale || 1), h = w * 2, meetAt = kit.config.tallMeet ?? .5;
  const center = Math.min(w / 2, Math.max(width - w / 2, anchorX + (width / 2 - anchorX) * groundScale - shiftX));
  const bottom0 = (floorY ?? height - 40) - 4 * groundScale + shiftY;
  const loop = names.slice(1), list = kit.config.tallRepeat ? [...names, ...Array.from({ length: 14 }, (_, k) => loop[k % loop.length])] : names;
  const tops = [];
  for (let i = 0; i < list.length; i++) {
    const image = kit.images[list[i]]; if (!image) { tops.push(null); continue; }
    if (i === 0) { tops.push(bottom0 - h); continue; }
    const front = tops[i - 1]; if (front == null) { tops.push(null); continue; }
    const [ft, fb] = solidRows(kit.images[list[i - 1]]), [, mb] = solidRows(image);
    const meet = front + (ft + (fb - ft) * meetAt) * h;
    tops.push(meet - mb * h);
  }
  for (let i = list.length - 1; i >= 0; i--) {
    const image = kit.images[list[i]], top = tops[i]; if (!image || top == null) continue;
    if (top + h < 0 || top > height) continue;
    ctx.save();
    ctx.globalAlpha = dark && !INDOOR.has(kit.id) ? .55 : 1;
    ctx.translate(center, 0);
    if (seededFlip(seed, i)) ctx.scale(-1, 1);
    ctx.drawImage(image, -w / 2, top, w, h);
    ctx.restore();
  }
}

// Floating pieces: each variety set is five different silhouettes in five equal columns.
// Every piece picks its own column, mirror, size and starting spot, so no two look alike.
const FLOATER_STYLE = {
  // cell = typical gap between pieces on screen (px), prob = chance each slot holds one, size = min/max width
  'cloud-set-day': { skip: [3], cell: 210, prob: .85, size: [110, 300], alpha: .9, vx: 4, vy: 0, par: .25 },
  'cloud-set-sunset': { skip: [0, 4], cell: 210, prob: .85, size: [110, 300], alpha: .9, vx: 4, vy: 0, par: .25 },
  'cloud-set-resort': { cell: 150, prob: .85, size: [60, 150], alpha: 1, vx: 4, vy: 0, par: .25 },
  'cloud-set-meadow': { cell: 150, prob: .85, size: [130, 330], alpha: 1, vx: 4, vy: 0, par: .25 },
  'mist-set': { cell: 420, prob: .7, size: [200, 360], alpha: .38, vx: 2, vy: 0, par: .6 },
  'ember-set': { skip: [4], cell: 110, prob: .85, size: [40, 90], alpha: .85, vx: 1.5, vy: -14, par: .5 },
  'petal-leaf-set': { skip: [4], cell: 170, prob: .8, size: [36, 82], alpha: .9, vx: 5, vy: 12, par: .5 },
};
const columnBoundsCache = new WeakMap();
function columnBounds(image, col, cols = 5) {
  let list = columnBoundsCache.get(image); if (!list) columnBoundsCache.set(image, list = []);
  if (list[col]) return list[col];
  const cw = Math.floor(image.naturalWidth / cols), ch = image.naturalHeight;
  const canvas = document.createElement('canvas'); canvas.width = cw; canvas.height = ch;
  const c = canvas.getContext('2d'); c.drawImage(image, col * cw, 0, cw, ch, 0, 0, cw, ch);
  const data = c.getImageData(0, 0, cw, ch).data;
  let left = cw, top = ch, right = -1, bottom = -1;
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    if (data[(y * cw + x) * 4 + 3] < 12) continue;
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  return list[col] = right < left ? [col * cw, 0, cw, ch] : [col * cw + left, top, right - left + 1, bottom - top + 1];
}
function unitRandom(seed, i, k) {
  let h = 2166136261;
  for (const c of `${seed}:${i}:${k}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}
// One travel direction per scene for the whole session (kept outside the kit, so a rebuilt kit or a new phase never flips the traffic).
const DRIFT_DIRS = new Map();
function driftDirFor(kit) { let d = DRIFT_DIRS.get(kit.id); if (!d) { d = Math.random() < .5 ? -1 : 1; DRIFT_DIRS.set(kit.id, d); } return d; }
function drawFloaters(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, time = 0, reduced, groundScale = 1, seed = kit.id }) {
  const gs = groundScale, base = (floorY ?? height - 40) - 4 * gs, groundTop = base + shiftY, t = reduced ? 0 : time;
  // Clouds all drift the same way; a new round (time restarting) picks the direction again at random.
  kit.driftDir = driftDirFor(kit); kit.lastTime = time; // picked once per scene, so nothing ever turns round while the stack builds
  const fades = kit.floatFades || (kit.floatFades = new Map()); if (fades.size > 3000) fades.clear();
  for (const [setIndex, name] of (kit.config.floaters || []).entries()) {
    const image = kit.images[name], style = FLOATER_STYLE[name]; if (!image || !style) continue;
    const cols = [0, 1, 2, 3, 4].filter(c => !(style.skip || []).includes(c)); // a twig floating alone would look wrong
    // Pieces live at fixed heights up the climb (their own scrolling speed `par`), each with its own hashed
    // position, size and drift, so no spot repeats and the same shapes never line up as you climb.
    const cell = style.cell / style.par, margin = style.size[1] * 1.2;
    const lo = Math.max(0, Math.floor((base + style.par * shiftY - height - margin) / (style.par * gs) / cell) - 1);
    const hi = Math.ceil((base + style.par * shiftY + margin) / (style.par * gs) / cell) + 1;
    for (let k = lo; k <= hi; k++) for (let m = 0; m < 2; m++) {
      const r = j => unitRandom(`${seed}${name}`, k * 2 + m, j);
      if (r(0) > (m ? style.prob * .3 : style.prob)) continue;
      const col = cols[Math.floor(r(1) * cols.length)], box = columnBounds(image, col);
      const size = style.size[0] * Math.pow(style.size[1] / style.size[0], Math.pow(r(2), 1.3)); // mostly small and medium, some large
      const w = size, h = w * box[3] / box[2];
      const yWorld = (k + r(6)) * cell, y = base + style.par * (shiftY - yWorld * gs) - h / 2;
      if (y > height + margin || y + h < -margin) continue;
      const span = width + w, frac = (((k * .618034 + setIndex * .37 + m * .5 + r(3) * .3) % 1) + 1) % 1; // evenly scattered across the width
      const x0 = frac * span - w / 2, x = (((x0 + t * style.vx * (name.startsWith('cloud') ? kit.driftDir : 1) * (.6 + r(5)) - shiftX * style.par * .3) % span) + span) % span - w / 2;
      const yy = y + t * style.vy * (.6 + r(7));
      const clear = kit.config.tall ? (width + 100) * gs * .95 : (kit.config.cloudClear ?? 90) * gs;
      const sky = name.startsWith('cloud') ? Math.max(0, Math.min(1, (groundTop - clear - (yy + h)) / (160 * gs))) : 1;
      // Ease each piece's visibility so it can never pop in or out when the camera zooms or climbs fast.
      const fk = `${name}${k}.${m}`, prev = fades.get(fk), vis = prev === undefined ? sky : prev + (sky - prev) * .06; fades.set(fk, vis);
      if (vis < .01) continue;
      ctx.save(); ctx.globalAlpha = style.alpha * (dark ? .6 : 1) * vis * (.75 + .25 * r(4));
      ctx.translate(x + w / 2, yy + h / 2); if (r(8) > .5) ctx.scale(-1, 1);
      ctx.drawImage(image, ...box, -w / 2, -h / 2, w, h); ctx.restore();
    }
  }
}


// Big far-away sky pieces (sun, rainbow) at fixed heights up the climb. They drift down slowly (par) like
// the clouds, and fade in only well above the horizon so nothing ever sits on the sea or ground.
function drawSkyPieces(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, groundScale = 1 }) {
  const gs = groundScale, base = (floorY ?? height - 40) - 4 * gs, par = .15;
  for (const p of kit.config.skyPieces || []) {
    const image = kit.images[p.img]; if (!image || (p.day && dark) || (p.night && !dark)) continue;
    const w = p.wFrac ? width * p.wFrac : p.w * gs, h = w * image.naturalHeight / image.naturalWidth;
    const yc = p.screenY === undefined ? base + par * (shiftY - p.y * gs) : height * p.screenY + shiftY * p.par;
    if (yc + h / 2 < 0 || yc - h / 2 > height) continue;
    const vis = Math.max(0, Math.min(1, (base + shiftY - (kit.config.cloudClear ?? 90) * gs * .9 - (yc + h / 2)) / (120 * gs)));
    if (vis < .01) continue;
    const x = width * p.x - shiftX * par * .3;
    ctx.save(); ctx.globalAlpha = vis * (dark ? .6 : 1); ctx.drawImage(image, x - w / 2, yc - h / 2, w, h); ctx.restore();
  }
}

// Layered scenery: wide strips drawn back to front, each following the climb at its own fraction (par), so the
// near layers slide away fast and the far ones slowly. Each layer is filled solid below its picture, so a gap can never open.
const layerInfo = new WeakMap();
function layerStats(image) {
  if (layerInfo.has(image)) return layerInfo.get(image);
  const w = image.naturalWidth, h = image.naturalHeight, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(image, 0, 0); const d = g.getImageData(0, 0, w, h).data, tops = [];
  for (let x = 0; x < w; x += 8) { let y = 0; while (y < h && d[(y * w + x) * 4 + 3] < 128) y++; tops.push(y); }
  const colTops = tops.slice(); tops.sort((a, b) => a - b);
  let r = 0, gr = 0, b = 0; for (let x = 0; x < w; x += 4) { const i = ((h - 1) * w + x) * 4; r += d[i]; gr += d[i + 1]; b += d[i + 2]; }
  const n = Math.ceil(w / 4), stats = { colTops, sky: tops[tops.length >> 1], fill: `rgb(${Math.round(r / n)},${Math.round(gr / n)},${Math.round(b / n)})` };
  layerInfo.set(image, stats); return stats;
}
const FLOW_CANVAS = new WeakMap();
// Only a continuous opaque region can cover the bottom of the panel behind it.
const terrainRows = new WeakMap();
function solidBottomRow(image, inset = 0) {
  let rows = terrainRows.get(image);
  if (!rows) terrainRows.set(image, rows = new Map());
  if (rows.has(inset)) return rows.get(inset);
  const { naturalWidth: w, naturalHeight: h } = image;
  const canvas = document.createElement('canvas');
  canvas.width = w - inset * 2; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, -inset, 0);
  const stride = canvas.width * 4;
  const pixels = ctx.getImageData(0, 0, canvas.width, h).data;
  let y = h - 1;
  for (; y >= 0; y--) {
    let opaque = true;
    for (let p = y * stride + 3; p < (y + 1) * stride; p += 4) {
      if (pixels[p] < 250) { opaque = false; break; }
    }
    if (!opaque) break;
  }
  rows.set(inset, y + 1);
  return y + 1;
}

function terrainLayout(kit, width, height, base, shiftY, gs, floorY) {
  const layout = new Map();
  const floor = kit.images[kit.config.floor];
  const floorScale = kit.config.floorTileWidth * gs / floor.naturalWidth;
  const floorTop = floorY + shiftY - floorInset(kit) * gs - FLOOR_DATA[kit.config.floor].surface * floor.naturalHeight * floorScale;
  const floorCover = floorTop + solidBottomRow(floor) * floorScale;
  let cover = Math.min(height, floorCover);
  for (const layer of [...kit.config.parallax].reverse()) {
    const image = kit.images[layer.img];
    if (!image) continue;
    const single = layer.single;
    const k = width * gs * (single ? single.w : 1.8 * (layer.scale || 1)) / image.naturalWidth;
    const drawHeight = image.naturalHeight * k * (single?.sy ?? 1);
    const grounded = layer.grounded || (single && layer.par === 1);
    const top = grounded ? floorCover + (5 - (layer.grounded ? layer.lift : 0)) * gs - drawHeight
      : base - layer.lift * gs + layer.par * shiftY - (single ? 0 : layerStats(image).sky * k);
    // Extend only the lower terrain. Camera bounds never change the speed of
    // the artwork, its skyline, or the props attached to it.
    const artBottom = top + drawHeight;
    // Standalone landmarks keep their proportions. Only terrain fills the overlap.
    const bottom = single && !grounded && !single.overlapFrom ? artBottom : Math.max(artBottom, cover + 2 * gs);
    layout.set(layer, { top, bottom });
    if (single && !grounded) continue;
    const inset = single ? Math.floor((single.w * gs - 1) * image.naturalWidth / (2 * single.w * gs)) : 0;
    const opaqueTop = top + solidBottomRow(image, Math.max(0, inset)) * k * (single?.sy ?? 1);
    if (opaqueTop < top + drawHeight) cover = Math.min(cover, opaqueTop);
  }
  return layout;
}

function drawTerrainImage(ctx, image, x, y, width, height, bottom, splitRatio = .88) {
  if (bottom <= y + height) {
    ctx.drawImage(image, x, y, width, height);
    return;
  }
  // Repeat the bottom artwork at its original scale. Mirroring alternate
  // sections keeps the shared edges aligned without stretching the scenery.
  ctx.drawImage(image, x, y, width, height);
  const sourceHeight = image.naturalHeight - Math.floor(image.naturalHeight * splitRatio);
  const stripHeight = height * sourceHeight / image.naturalHeight;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y + height, width, bottom - y - height);
  ctx.clip();
  for (let top = y + height, i = 0; top < bottom; top += stripHeight, i++) {
    ctx.save();
    ctx.translate(x, top + (i % 2 === 0 ? stripHeight : 0));
    if (i % 2 === 0) ctx.scale(1, -1);
    ctx.drawImage(image, 0, image.naturalHeight - sourceHeight, image.naturalWidth, sourceHeight,
      0, 0, width, stripHeight + .35);
    ctx.restore();
  }
  ctx.restore();
}

function drawLiftChairs(ctx, chair, x, y, width, height, time) {
  // Cable endpoints and tower crossings in the 700 × 429 illustration.
  const cable = [[435, 86], [389, 119], [267, 211], [175, 282], [154, 299]];
  const scaleX = width / 700, scaleY = height / 429;
  const spacing = 93, routeWidth = spacing * 3;
  const offset = (time * 30 + 25) % spacing;
  for (let travel = offset; travel < routeWidth; travel += spacing) {
    const cableX = cable[0][0] - travel;
    const segment = cable.findIndex(([px], index) => index > 0 && px <= cableX);
    const [ax, ay] = cable[segment - 1], [bx, by] = cable[segment];
    const cableY = ay + (by - ay) * (ax - cableX) / (ax - bx);
    ctx.save();
    ctx.globalAlpha *= Math.min(1, (routeWidth - travel) / 12);
    // The round hanger sits a little right of the sprite's left edge.
    ctx.drawImage(chair, x + (cableX - 13) * scaleX, y + cableY * scaleY,
      44 * scaleX, 53 * scaleY);
    ctx.restore();
  }
}

function drawTempleTorches(ctx, stand, flame, x, y, width, height, time, reduced) {
  const standH = width * .115, standW = standH * stand.naturalWidth / stand.naturalHeight;
  const flameH = width * .079, flameW = flameH * flame.naturalWidth / flame.naturalHeight;
  for (const [index, side] of [.38, .62].entries()) {
    const baseX = x + width * side, bowlY = y + height * .325 - standH;
    // The ledge occludes the foot of each stand.
    const exposed = .70;
    ctx.drawImage(stand, 0, 0, stand.naturalWidth, stand.naturalHeight * exposed,
      baseX - standW / 2, bowlY, standW, standH * exposed);
    const flicker = reduced ? 0 : Math.sin(time * 13 + index * 2) * .65 + Math.sin(time * 21 + index) * .35;
    ctx.save();
    ctx.translate(baseX, bowlY + standH * .035);
    ctx.rotate(flicker * .09);
    ctx.scale(1 - flicker * .07, 1 + flicker * .12);
    ctx.drawImage(flame, -flameW / 2, -flameH, flameW, flameH);
    ctx.restore();
  }
}

function drawFlow(ctx, kit, fl, x, top, k, ky, time, reduced) {
  const mask = kit.images[fl.img]; if (!mask) return;
  let oc = FLOW_CANVAS.get(fl); if (!oc) { oc = document.createElement('canvas'); oc.width = mask.naturalWidth; oc.height = mask.naturalHeight; FLOW_CANVAS.set(fl, oc); }
  const g = oc.getContext('2d'), W = oc.width, H = oc.height, n = fl.streaks || 9;
  g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
  if (fl.ripple) { // the creek: pale wavy lines drifting along the water, sliding slowly toward the viewer
    const rows = fl.ripple.rows || 9, tt = reduced ? 0 : time; if (!fl.ripple.warm) { g.fillStyle = 'rgba(30,140,190,.2)'; g.fillRect(0, 0, W, H); }
    const travel = tt * (fl.ripple.speed || .25);
    for (let r = -1; r <= rows; r++) {
      const yy = ((r + travel % 1) / rows) * H, amp = 2 + 5 * (yy / H), wl = 46 + 40 * (yy / H);
      g.beginPath(); for (let xx = -10; xx <= W + 10; xx += 8) { const y2 = yy + Math.sin(xx / wl * 6.283 + tt * 1.6 + yy / H * 18) * amp; xx < 0 ? g.moveTo(xx, y2) : g.lineTo(xx, y2); }
      g.strokeStyle = fl.ripple.warm ? 'rgba(255,175,48,.60)' : 'rgba(231,249,255,.65)'; g.lineWidth = 4 + 6 * (yy / H); g.stroke();
    }
    g.globalCompositeOperation = 'destination-in'; g.drawImage(mask, 0, 0); ctx.drawImage(oc, x + fl.x * k, top + fl.y * ky, W * k, H * ky); return;
  }
  g.fillStyle = 'rgba(40,150,200,.4)'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < n; i++) for (let r = 0; r < 2; r++) {
    const px = (i + .5) / n * W + Math.sin(i * 12.9) * 4, len = 26 + (i * 7) % 22, yy = (((reduced ? 0 : time) * fl.speed + i * 41 + r * (H + 30) / 2) % (H + 60)) - 40;
    g.fillStyle = r ? 'rgba(255,255,255,.85)' : 'rgba(210,245,255,.9)'; g.fillRect(px - 3, yy, 6, len * 1.4);
  }
  g.globalCompositeOperation = 'destination-in'; g.drawImage(mask, 0, 0);
  ctx.drawImage(oc, x + fl.x * k, top + fl.y * ky, W * k, H * ky);
}

function drawVolcanoSmoke(ctx, image, x, y, width, time, reduced) {
  if (!image) return;
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const age = ((reduced ? 0 : time * .38) + i / 4) % 1;
    const size = width * (.09 + age * .27);
    const h = size * image.naturalHeight / image.naturalWidth;
    ctx.globalAlpha = Math.sin(Math.PI * age) * .48;
    ctx.drawImage(image, x + width * age * .14 - size / 2,
      y - width * age * .45 - h / 2, size, h);
  }
  ctx.restore();
}

function drawWheelCarriages(ctx, image, x, y, width, height, angle, time, reduced) {
  const cabinWidth = width * .175;
  const cabinHeight = cabinWidth * image.naturalHeight / image.naturalWidth;
  for (let i = 0; i < 8; i++) {
    const position = angle + i * Math.PI / 4;
    ctx.save();
    ctx.translate(x + Math.cos(position) * width * .46, y + Math.sin(position) * height * .46);
    if (!reduced) ctx.rotate(Math.sin(time * 1.8 + i * 1.7) * .08);
    ctx.drawImage(image, -cabinWidth / 2, -cabinHeight * .07, cabinWidth, cabinHeight);
    ctx.restore();
  }
}

function drawCrystalGlints(ctx, sprite, points, x, y, width, height, time) {
  for (const [i, [fx, fy]] of points.entries()) {
    const phase = (time * .54 + i * .37 + fx) % 1;
    if (phase > .52) continue;
    const strength = Math.sin(Math.PI * phase / .52);
    const w = width * (.045 + .085 * strength);
    const h = w * sprite.naturalHeight / sprite.naturalWidth;
    ctx.save();
    ctx.globalAlpha *= strength;
    ctx.globalCompositeOperation = "screen";
    ctx.drawImage(sprite, x + width * fx - w / 2, y + height * fy - h / 2, w, h);
    ctx.restore();
  }
}

function drawSeatedFans(ctx, atlas, seats, left, top, scale, time, reduced) {
  for (const [i, [x, y]] of seats.entries()) {
    const cycle = (time + 1.37 * i) % (4.6 + .38 * (i % 5));
    const lift = reduced ? 0 : Math.max(0, Math.min(1, (cycle - .45) / .28, (1.77 - cycle) / .4));
    const rise = lift * lift * (3 - 2 * lift);
    const pose = rise > .55 ? 64 : 0;
    const width = 25 * scale;
    const seatY = top + y * scale;
    const center = left + x * scale;
    // The painted seat back hides the waist throughout the entire cheer.
    ctx.save();
    ctx.beginPath();
    ctx.rect(center - width / 2, seatY - width, width, width);
    ctx.clip();
    ctx.drawImage(atlas, (i % 4) * 64, pose, 64, 64,
      center - width / 2, seatY - (15 + 8 * rise) * scale, width, width);
    ctx.restore();
  }
}

function drawParallax(ctx, kit, { width, height, shiftY, floorY, dark, groundScale = 1, time = 0, reduced }) {
  const terrain = kit.config.overlapTerrain ? terrainLayout(kit, width, height, (floorY ?? height - 40) - 4 * groundScale, shiftY, groundScale, floorY ?? height - 40) : null;
  const gs = groundScale, base = (floorY ?? height - 40) - 4 * gs;
  for (const layer of kit.config.parallax || []) {
    const image = kit.images[layer.img]; if (!image) continue;
    if (layer.single) { // one big piece (the mountain) with its feet off-screen, not a tiling strip
      const sg = layer.single, w2 = width * sg.w * gs, h2 = w2 * image.naturalHeight / image.naturalWidth * sg.sy, y2 = terrain?.get(layer)?.top ?? base - layer.lift * gs + layer.par * shiftY;
      if (y2 < height) { ctx.save(); if (dark) ctx.filter = 'brightness(58%)'; drawTerrainImage(ctx, image, width * sg.x - w2 / 2, y2, w2, h2, terrain?.get(layer)?.bottom ?? y2 + h2, sg.overlapFrom); const glint = kit.images[layer.glint?.img]; if (glint && !reduced) drawCrystalGlints(ctx, glint, layer.glint.points, width * sg.x - w2 / 2, y2, w2, h2, time); for (const fl of layer.flows || []) drawFlow(ctx, kit, fl, width * sg.x - w2 / 2, y2, w2 / image.naturalWidth, h2 / image.naturalHeight, time, reduced); if (sg.smoke) drawVolcanoSmoke(ctx, kit.images[sg.smoke], width * sg.x, y2 + h2 * .085, w2, time, reduced); const stand = kit.images[sg.torches?.stand], flame = kit.images[sg.torches?.flame]; if (stand && flame) drawTempleTorches(ctx, stand, flame, width * sg.x - w2 / 2, y2, w2, h2, time, reduced); const chair = kit.images[sg.liftChair]; if (chair) drawLiftChairs(ctx, chair, width * sg.x - w2 / 2, y2, w2, h2, reduced ? 0 : time); for (const [hi, hg] of (sg.hang || []).entries()) { const hp = kit.images[hg.img]; if (!hp) continue; const hw = hg.w * w2, hh = hw * hp.naturalHeight / hp.naturalWidth; ctx.save(); ctx.translate(width * sg.x - w2 / 2 + hg.fx * w2, y2 + hg.fy * h2); ctx.rotate(reduced ? 0 : Math.sin(time * (hg.speed || .8) + hi * 1.9) * (hg.swing || .07) + Math.sin(time * (hg.speed || .8) * 2.3 + hi) * .015); ctx.drawImage(hp, -hw / 2, 0, hw, hh); ctx.restore(); } const sp2 = sg.spin && kit.images[sg.spin.img]; if (sp2) { const rs = sg.spin.size * w2, cx = width * sg.x - w2 / 2 + sg.spin.fx * w2, cy = y2 + sg.spin.fy * h2; ctx.save(); ctx.translate(cx, cy); const angle = reduced ? 0 : time * (sg.spin.speed || .5); if (sg.spin.mode === 'yaw') ctx.scale(.72 + .28 * Math.cos(angle), 1); else ctx.rotate(angle); const rh = rs * sp2.naturalHeight / sp2.naturalWidth; ctx.drawImage(sp2, -rs / 2, -(sg.spin.py ?? .5) * rh, rs, rh); ctx.restore(); const cabin = kit.images[sg.spin.carriage]; if (cabin) drawWheelCarriages(ctx, cabin, cx, cy, rs, rh, angle, time, reduced); } if (sg.fill && y2 + h2 < height) { ctx.fillStyle = sg.fill; ctx.fillRect(0, y2 + h2 - 1, width, height - y2 - h2 + 2); } ctx.restore(); }
      continue;
    }
    const st0 = layerStats(image), st = layer.skyRow !== undefined ? { ...st0, sky: layer.skyRow } : st0, tw = width * 1.8 * gs * (layer.scale || 1), k = tw / image.naturalWidth, th = image.naturalHeight * k;
    const top = terrain?.get(layer)?.top ?? base - layer.lift * gs + layer.par * shiftY - st.sky * k, bottom = top + th;
    let reach = top; // props can stand much taller than the layer picture, so keep drawing while any of them is on screen
    for (const q of layer.props || []) { const pic = kit.images[q.img]; if (pic && q.snap === undefined) reach = Math.min(reach, top + q.row * k - q.w * tw * pic.naturalHeight / pic.naturalWidth); }
    if (reach > height) continue;
    ctx.save(); if (dark) ctx.filter = 'brightness(58%)'; else if (layer.filter) ctx.filter = layer.filter;
    if (!terrain && !layer.noFill) { ctx.fillStyle = st.fill; ctx.fillRect(0, bottom - 1, width, height - bottom + 2); }
    for (const [bi, b] of (layer.beams || []).entries()) { // searchlights sweeping the sky from behind this skyline
      const px = width * b.x, py = top + st.sky * k + (b.drop || 30) * gs, len = (b.len || 560) * gs, ang = -Math.PI / 2 + (reduced ? 0 : Math.sin(time * (b.speed || .5) + bi * 2.1) * (b.swing || .5)) + (b.tilt || 0), spread = (b.spread || .042);
      const grad = ctx.createLinearGradient(px, py, px + Math.cos(ang) * len, py + Math.sin(ang) * len);
      grad.addColorStop(0, `rgba(${b.rgb || '255,250,225'},${.5 * (b.a ?? 1)})`); grad.addColorStop(.7, `rgba(${b.rgb || '255,250,225'},${.22 * (b.a ?? 1)})`); grad.addColorStop(1, `rgba(${b.rgb || '255,250,225'},0)`);
      ctx.fillStyle = grad; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(ang - spread) * len, py + Math.sin(ang - spread) * len); ctx.lineTo(px + Math.cos(ang + spread) * len, py + Math.sin(ang + spread) * len); ctx.closePath(); ctx.fill();
    }
    for (let x = (width - tw) / 2 - Math.ceil((width - tw) / 2 / tw) * tw; x < width; x += tw) {
      if (layer.wave && !reduced) { // wind: the foliage ripples sideways a little, the tops more than the bottoms
        const w = layer.wave, bs = 6 * gs;
        for (let y = 0; y < th; y += bs) {
          const sy = y / k, f = .35 + .65 * (1 - y / th), dx = Math.sin(time * w.speed + y * w.freq + x * .013) * w.amp * gs * f;
          ctx.drawImage(image, 0, sy, image.naturalWidth, Math.min(bs / k + 1, image.naturalHeight - sy), x + dx, top + y, tw + 1, bs + .6);
        }
      } else drawTerrainImage(ctx, image, x, top, tw + 1, th, terrain?.get(layer)?.bottom ?? bottom, layer.overlapFrom);
      const fans = kit.images[layer.crowd?.img];
      if (fans) drawSeatedFans(ctx, fans, layer.crowd.seats, x, top, k, time, reduced);
      const glint = kit.images[layer.glint?.img];
      if (glint && !reduced) drawCrystalGlints(ctx, glint, layer.glint.points, x, top, tw, th, time);
      for (const fl of layer.flows || []) drawFlow(ctx, kit, fl, x, top, k, k, time, reduced);
      if (layer.mirror) { // keep painting below the picture with its own lower rows, flipped back and forth, so no flat band or edge ever shows
        const m = Math.min(layer.mirror, image.naturalHeight - st.sky - 20), mh = m * k;
        for (let j = 0; bottom + j * mh < height && j < 8; j++) {
          const y0 = bottom + j * mh;
          ctx.save(); ctx.beginPath(); ctx.rect(x, y0, tw + 1, mh + 1); ctx.clip();
          if (j % 2 === 0) { ctx.translate(x, y0 + th); ctx.scale(1, -1); } else ctx.translate(x, y0 - (image.naturalHeight - m) * k);
          ctx.drawImage(image, 0, 0, tw + 1, th); ctx.restore();
        }
      }
      if (layer.glow && !reduced) { // neon signs that pulse and flicker: a copy of just the neon, added on top
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        layer.glow.forEach((gn, gi) => {
          const gp = kit.images[gn]; if (!gp) return;
          const ph = gi * 2.4 + (layer.par || 0) * 9, flick = Math.sin(time * 6.3 + ph * 3) > .94 || Math.sin(time * 2.1 + ph) > .985;
          ctx.globalAlpha = flick ? 0 : .22 + .55 * (.5 + .5 * Math.sin(time * 1.9 + ph));
          ctx.drawImage(gp, x, top, tw + 1, th);
        });
        ctx.restore();
      }
      if (layer.scatter) { // loose trees (no ground of their own) planted all over this layer, bottoms resting on the hill body
        const sc = layer.scatter, list = sc.imgs.map(n => kit.images[n]).filter(Boolean), spots = [];
        for (let i = 0; i < sc.n; i++) {
          const q = j => unitRandom(`${sc.seed}${layer.img}`, i, j);
          const fx = ((i * .618034 + q(2) * .25) % 1 + 1) % 1, edge = st.colTops[Math.min(st.colTops.length - 1, Math.floor(fx * st.colTops.length))] + 14; // never above the hill's own skyline
          const row = Math.max(edge, sc.rows[0] + (sc.rows[1] - sc.rows[0]) * q(1)), depth = Math.min(1, Math.max(0, (row - sc.rows[0]) / (sc.rows[1] - sc.rows[0])));
          spots.push({ fx, row, w: (sc.w[0] + (sc.w[1] - sc.w[0]) * depth) * (.85 + .3 * q(3)), flip: q(4) > .5, pic: list[Math.floor(q(5) * list.length)] });
        }
        spots.sort((a, b) => a.row - b.row);
        for (const t of spots) {
          if (!t.pic) continue;
          const ph = t.w * tw * .9, pw = ph * t.pic.naturalWidth / t.pic.naturalHeight, cx = x + t.fx * tw, cy = top + t.row * k;
          ctx.save(); ctx.translate(cx, cy - ph / 2); if (t.flip) ctx.scale(-1, 1); ctx.drawImage(t.pic, -pw / 2, -ph / 2, pw, ph); ctx.restore();
        }
      }
      for (const q of layer.drifters || []) { // boats and waves sliding along this layer, wrapping around its width
        const pic = kit.images[q.img]; if (!pic) continue;
        const pw = q.w * tw, ph = pw * pic.naturalHeight / pic.naturalWidth, travel = reduced ? 0 : time * (q.speed || 0) * gs * (driftDirFor(kit));
        const bob = reduced ? 0 : Math.sin(time * (q.rate || 1.2) + q.x * 9) * (q.bob || 0) * gs, px = ((q.x * tw + travel) % tw + tw) % tw;
        const back = q.speed && (driftDirFor(kit)) < 0; // pictures face right, so flip them whenever the piece is travelling left
        for (const dx of [px - tw, px]) { if (back) { ctx.save(); ctx.translate(x + dx, 0); ctx.scale(-1, 1); ctx.drawImage(pic, -pw / 2, top + q.row * k - ph + bob, pw, ph); ctx.restore(); } else ctx.drawImage(pic, x + dx - pw / 2, top + q.row * k - ph + bob, pw, ph); }
      }
      for (const q of layer.props || []) { // things on a far hill: hidden behind the nearer layer at first, revealed as it slides down
        const pic = kit.images[q.img]; if (!pic) continue;
        const pw = q.w * tw, ph = pw * pic.naturalHeight / pic.naturalWidth;
        const row = q.snap !== undefined ? st.colTops[Math.min(st.colTops.length - 1, Math.floor(((q.x % 1) + 1) % 1 * st.colTops.length))] + q.snap : q.row; // snap: stand on this layer's own skyline
        const ring = q.foam && kit.images[q.foam]; // a ripple of foam around a piece standing in the water
        if (ring) { const fw = pw * 1.3, fh = fw * ring.naturalHeight / ring.naturalWidth; ctx.globalAlpha = .9; ctx.drawImage(ring, x + q.x * tw - fw / 2, top + row * k - fh * .75, fw, fh); ctx.globalAlpha = 1; }
        const mv = q.move, mt = reduced ? 0 : time, mph = q.x * 17 + (mv && mv.phase || 0), msp = mv && mv.speed || 1, baseY = top + row * k, cxp = x + q.x * tw;
        let mTop = false, mAng = 0, mSy = 1, mDy = 0, mDx = 0, mAlpha = 1, mClip = false; // still animals: nod, breathe, hop, peek out of the ground, or fade in and out
        if (mv) {
          if (mv.type === 'spin') mAng = mt * msp;
          else if (mv.type === 'pulse') mSy = 1 + Math.sin(mt * msp + mph) * .09;
          else if (mv.type === 'glow') mAlpha = .82 + Math.sin(mt * msp + mph) * .17;
          else if (mv.type === 'nod') mAng = Math.sin(mt * msp + mph) * Math.min(mv.amp ?? 2, 4) * Math.PI / 180; // amp = degrees of head tilt
          else if (mv.type === 'sway') { mDx = Math.sin(mt * msp + mph) * (mv.amp ?? 6) * gs; mAng = Math.sin(mt * msp + mph + 1.2) * .035; mDy = Math.abs(Math.sin(mt * msp * 2 + mph)) * -1.5 * gs; } // a boat rocking from side to side
          else if (mv.type === 'rustle') mAng = (Math.sin(mt * msp + mph) + .45 * Math.sin(mt * msp * 2.7 + mph * 2)) * (mv.amp ?? 3) * Math.PI / 180; // leaves shivering in the breeze, pivoting at the stem
          else if (mv.type === 'dangle') { mAng = (Math.sin(mt * msp + mph) + .5 * Math.sin(mt * msp * 2.3 + mph * 1.7)) * (mv.amp ?? 5) * Math.PI / 180; mTop = true; } // hangs from its top edge and swings
          else if (mv.type === 'bob') mSy = 1 + Math.sin(mt * msp + mph) * Math.min(mv.amp ?? 2, 3) * .01; // amp = percent of breathing
          else if (mv.type === 'hop') { const c = (mt * msp + mph) % 4; mDy = c < .7 ? -Math.abs(Math.sin(c / .7 * Math.PI)) * (mv.amp ?? 9) * gs : 0; }
          else if (mv.type === 'peek') { const u = .5 + .5 * Math.sin(mt * msp + mph); mDy = (1 - Math.pow(u, .6)) * ph * Math.min(mv.amp > 1 ? .8 : (mv.amp ?? .6), .85); mClip = true; }
          else if (mv.type === 'pop') mAlpha = Math.max(0, Math.min(1, 1.6 * Math.sin(mt * msp * .35 + mph) + .5));
        }
        if (mAlpha > .01) {
          ctx.save(); if (mAlpha < 1) ctx.globalAlpha = mAlpha;
          if (mClip) { ctx.beginPath(); ctx.rect(cxp - pw, baseY - ph - 4, pw * 2, ph + 4 + 2); ctx.clip(); }
          ctx.translate(cxp + mDx, baseY + mDy - (mTop ? ph : 0)); if (mAng) ctx.rotate(mAng); if (mSy !== 1) ctx.scale(1, mSy); if (q.flip) ctx.scale(-1, 1);
          if (q.glow) {
            ctx.shadowColor = '#ffb54c';
            ctx.shadowBlur = pw * (reduced ? .65 : .65 + .38 * Math.sin(time * 2.4));
          }
          if (mv?.type === 'scan') ctx.scale(.76 + .24 * Math.cos(mt * msp), 1);
          if (mv?.type === 'spin') {
            ctx.rotate(-mAng);
            ctx.translate(0, -ph / 2);
            ctx.rotate(mAng);
            ctx.drawImage(pic, -pw / 2, -ph / 2, pw, ph);
          } else ctx.drawImage(pic, -pw / 2, mTop ? 0 : -ph, pw, ph);
          ctx.restore();
        }
        const turner = q.spin && kit.images[q.spin.img]; // a part of this prop that turns (blades, a wheel, a clock hand), pivoting where the picture says
        if (turner) {
          const sz = q.spin.size * pw, cx = x + q.x * tw - pw / 2 + q.spin.fx * pw, cy = top + row * k - ph + q.spin.fy * ph;
          const sh = sz * turner.naturalHeight / turner.naturalWidth, spd = q.spin.speed || .5; // swing: rocks back and forth by that many radians (a pendulum, a hanging sign, kelp); otherwise it turns all the way round
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(reduced ? 0 : q.spin.swing ? Math.sin(time * spd) * q.spin.swing : time * spd); ctx.drawImage(turner, -(q.spin.px ?? .5) * sz, -(q.spin.py ?? .5) * sh, sz, sh); ctx.restore();
        }
      }
      for (const vn of layer.vanes || []) { // a weather vane that turns round on its pole as the wind changes
        const vp = kit.images[vn.img]; if (!vp) continue;
        const vw = vn.size * k, vh = vw * vp.naturalHeight / vp.naturalWidth, vx = x + vn.x * k, vy = top + vn.y * k, tt = reduced ? 0 : time;
        ctx.save(); ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = Math.max(1.5, 5 * k); ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx, vy - (vn.pole || 40) * k); ctx.stroke();
        ctx.translate(vx, vy - (vn.pole || 40) * k); ctx.scale(reduced ? 1 : Math.cos(tt * (vn.speed || .5) + vn.x), 1); ctx.rotate(Math.sin(tt * 1.7) * .05); ctx.drawImage(vp, -vw / 2, -vh / 2, vw, vh); ctx.restore();
      }
      const sp = layer.spin, blades = sp && kit.images[sp.img];
      if (blades) { // a turning piece (windmill blades) sitting on this layer
        const px = x + sp.x * k, py = top + sp.y * k, size = sp.size * k;
        ctx.save(); ctx.translate(px, py); ctx.rotate(reduced ? 0 : time * sp.speed); ctx.drawImage(blades, -size / 2, -size / 2, size, size); ctx.restore();
      }
    }
    ctx.restore();
  }
}

// Indoor climb: wall pieces (windows, shelves, clocks...) scattered up the wall at random.
// Pieces never repeat back to back and the spacing, side and size change from one to the next.
const DECOR_TOP = 120000; // wall pieces keep coming this far up
const decorCache = new Map();
function decorSlots(seed, skip = []) {
  if (decorCache.has(seed)) return decorCache.get(seed);
  const slots = []; let y = 330 + 200 * unitRandom(seed, 0, 1), last = [-1, -1], lastSide = -1, k = 0;
  while (y < DECOR_TOP) {
    const r = j => unitRandom(`${seed}decor`, k, j);
    let col = Math.floor(r(1) * 5); while (last.includes(col) || skip.includes(col)) col = (col + 1) % 5;
    let side = r(2) < .4 ? 0 : r(2) < .8 ? 2 : 1; if (side === lastSide && r(6) < .75) side = side === 1 ? (r(7) < .5 ? 0 : 2) : 2 - side;
    slots.push({ col, side, y, flip: r(3) > .5, scale: .85 + .3 * r(4), jitter: (r(5) - .5) * .1 });
    last = [last[1], col]; lastSide = side; k++;
    y += 360 + 520 * r(8) + (r(9) < .2 ? 700 : 0); // now and then a long bare stretch
  }
  decorCache.set(seed, slots); return slots;
}
function drawDecor(ctx, kit, { width, height, shiftY, shiftX, floorY, groundScale = 1, anchorX = width / 2, seed = kit.id }) {
  const image = kit.images[kit.config.decor]; if (!image) return;
  const groundTop = (floorY ?? height - 40) - 4 * groundScale + shiftY, gs = groundScale;
  for (const sl of decorSlots(seed, kit.config.decorSkip)) {
    const box = columnBounds(image, sl.col), k = (kit.config.decorSizes[sl.col] / box[2]) * sl.scale * gs, w = box[2] * k, h = box[3] * k, cy = groundTop - sl.y * gs;
    if (cy + h / 2 < 0 || cy - h / 2 > height) continue;
    const wx = width * ([.2, .5, .8][sl.side] + sl.jitter), cx = anchorX + (wx - anchorX) * gs - shiftX;
    ctx.save(); ctx.translate(cx, cy); if (sl.flip) ctx.scale(-1, 1);
    ctx.shadowColor = 'rgba(40,25,10,.28)'; ctx.shadowBlur = 5 * gs; ctx.shadowOffsetY = 3 * gs; // mounted on the wall, not floating
    ctx.drawImage(image, ...box, -w / 2, -h / 2, w, h); ctx.restore();
  }
}


// Climb-aware indoor wall: a detailed base, a run of different middle panels, then the ceiling,
// stretched so the ceiling sits exactly at the top of the climb. Panels are plain-edged, so they join without seams.
const CEIL_FRAC = .125; // default share of the top panel that is ceiling (each room sets its own ceilFrac)
const topColorCache = new WeakMap();
function topColor(image) {
  if (topColorCache.has(image)) return topColorCache.get(image);
  const c = document.createElement('canvas'); c.width = 1; c.height = 1; const g = c.getContext('2d'); g.drawImage(image, 0, 0, 8, 8, 0, 0, 1, 1);
  const d = g.getImageData(0, 0, 1, 1).data, col = `rgb(${d[0]},${d[1]},${d[2]})`; topColorCache.set(image, col); return col;
}
const panelPlans = new Map();
function panelPlan(seed, mids, count) {
  const key = `${seed}:${count}`; if (panelPlans.has(key)) return panelPlans.get(key);
  const out = []; let last = -1;
  for (let i = 0; i < count; i++) {
    let k = i === 0 ? 0 : i === 1 ? 1 : Math.floor(unitRandom(`${seed}panel`, i, 1) * mids.length);
    if (k === last) k = (k + 1) % mids.length;
    out.push(k); last = k;
  }
  panelPlans.set(key, out); return out;
}
function drawPanels(ctx, kit, { width, height, shiftY, shiftX, floorY, groundScale = 1, anchorX = width / 2, climbPx = 0, seed = kit.id }) {
  const cfg = kit.config.panels, gs = groundScale, CEIL_FRAC = cfg.ceilFrac ?? .125, base = kit.images[cfg.base], top = kit.images[cfg.top];
  if (!base || !top) return;
  const groundTop = (floorY ?? height - 40) - 4 * gs + shiftY, hMin = 2 * (width + 8);
  const total = Math.max(climbPx > 0 ? climbPx : height * 3, hMin * 1.2);
  let n = Math.max(2, Math.round(total / (2 * (width + 10)) + CEIL_FRAC)); // independent of the camera's terrain zoom, so panels never jump
  let h = total / (n - CEIL_FRAC);
  while (h < hMin && n > 2) { n--; h = total / (n - CEIL_FRAC); }
  h = Math.max(h, hMin); const w = h / 2;
  const center = Math.min(w / 2, Math.max(width - w / 2, anchorX + (width / 2 - anchorX) * gs - shiftX));
  const topY = groundTop - n * h;
  ctx.save();
  ctx.fillStyle = topColor(top); ctx.fillRect(0, -1e5, width, 1e5 + topY + 2);
  const plan = panelPlan(seed, cfg.mids, Math.max(0, n - 2));
  for (let i = 0; i < n; i++) {
    const y = groundTop - (i + 1) * h; if (y + h < 0 || y > height) continue;
    const image = i === 0 ? base : i === n - 1 ? top : kit.images[cfg.mids[plan[i - 1]]]; if (!image) continue;
    ctx.save(); ctx.translate(center, 0); // no mirroring: the stripes are asymmetric, so flipping a panel would shift the pattern by one stripe
    ctx.drawImage(image, -w / 2, y, w, h + 1); ctx.restore();
  }
  ctx.restore();
}

// Old wall decor for indoor scenes: windows, shelves, pipes and so on, fixed to the wall at set heights up the climb.
function drawWallPieces(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, groundScale = 1, anchorX = width / 2, seed = kit.id }) {
  const image = kit.images[kit.config.wall]; if (!image) return;
  const groundTop = (floorY ?? height - 40) - 4 * groundScale + shiftY, first = 250, step = 150;
  const kMin = Math.max(0, Math.floor(((groundTop - height) / groundScale - first) / step) - 1);
  const kMax = Math.ceil((groundTop / groundScale - first) / step) + 1;
  for (let k = kMin; k <= kMax; k++) {
    const r = j => unitRandom(`${seed}wall`, k, j);
    const col = Math.floor(r(1) * 5), box = columnBounds(image, col);
    const w = (84 + 56 * r(2)) * groundScale, h = w * box[3] / box[2];
    const cx = anchorX + (width * (.1 + .8 * r(3)) - anchorX) * groundScale - shiftX;
    const bottom = groundTop - (first + k * step + 30 * r(4)) * groundScale;
    if (bottom < 0 || bottom - h > height) continue;
    ctx.save(); ctx.globalAlpha = dark ? .6 : .92;
    ctx.translate(cx, 0); if (r(5) > .5) ctx.scale(-1, 1);
    ctx.drawImage(image, ...box, -w / 2, bottom - h, w, h);
    ctx.restore();
  }
}

// Each scene has its own kind of bird, so the sky does not look the same everywhere.
const BIRD_STYLES = {
  gulls: { density: 0.45, groups: 1, n: [2, 3], size: [16, 22], speed: [14, 24], flap: 2.2, color: '#f6f3ec', edge: '#8a93a6', arc: .38, formation: 'loose' },
  geese: { density: 0.4, groups: 1, n: [5, 7], size: [9, 12], speed: [26, 36], flap: 1.7, color: '#566178', arc: .55, formation: 'v' },
  swallows: { density: 0.5, groups: 1, n: [3, 4], size: [7, 9], speed: [48, 70], flap: 5, color: '#3d465c', arc: .6, formation: 'scatter' },
  hawks: { density: 0.4, groups: 1, n: [1, 1], size: [22, 28], speed: [10, 16], flap: 0, color: '#5b4a43', arc: .22, formation: 'single' },
  doves: { density: 0.45, groups: 1, n: [2, 2], size: [12, 15], speed: [18, 28], flap: 2.6, color: '#f8f3ef', edge: '#a79fb0', arc: .5, formation: 'loose' },
};
// Moving background life, drawn in code: flocks of far-off birds by day, fireflies at night.
// Both drift past on their own and slide away slowly as the stack climbs.
function drawFlyers(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, time = 0, reduced, groundScale = 1, seed = kit.id }) {
  const kind = kit.config.flyers, glow = kit.config.fireflies;
  const t = reduced ? 0 : time, span = height * 2.4, groundTop = (floorY ?? height - 40) - 4 * groundScale + shiftY;
  const yOf = (r, par) => ((((r * span + shiftY * par) % span) + span) % span) - span * .3;
  const style = BIRD_STYLES[kind];
  if (style && !dark) {
    // Stadiums keep their birds high above the roof, not inside the stands.
    const clear = (kit.config.birdClear ? (width + 100) * groundScale * 2 * kit.config.birdClear : 340 * groundScale);
    for (const g of worldCells(groundTop, height, groundScale, 700)) {
      if (unitRandom(`${seed}${kind}p`, g, 0) > style.density) continue;
      const r = j => unitRandom(`${seed}${kind}`, g, j);
      const dir = r(1) > .5 ? 1 : -1, speed = (style.speed[0] + (style.speed[1] - style.speed[0]) * r(2)) * groundScale;
      const n = style.n[0] + Math.floor(r(3) * (style.n[1] - style.n[0] + 1));
      const gy = groundTop - (g * 700 + 700 * r(4)) * groundScale, cycle = width + 260 * groundScale;
      const gx = ((((r(5) * cycle + dir * t * speed - shiftX * .1) % cycle) + cycle) % cycle) - 130 * groundScale;
      const sky = Math.max(0, Math.min(1, (groundTop - clear - gy) / (90 * groundScale)));
      if (!sky) continue;
      ctx.save(); ctx.globalAlpha = .8 * sky; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let b = 0; b < n; b++) {
        const q = j => unitRandom(`${seed}${kind}b${g}`, b, j);
        const s = (style.size[0] + (style.size[1] - style.size[0]) * q(1)) * groundScale;
        const flap = style.flap ? Math.sin(t * style.flap * 2 + b * 1.7 + g * 2.3) : 0;
        let x, y;
        if (style.formation === 'v') { const rank = Math.ceil(b / 2); x = gx - dir * rank * s * 1.7; y = gy + (b % 2 ? 1 : -1) * rank * s * 1.1; }
        else if (style.formation === 'scatter') { x = gx - dir * q(2) * 90 * groundScale; y = gy + (q(3) - .5) * 70 * groundScale + Math.sin(t * 1.8 + q(4) * 6.28) * 14 * groundScale; }
        else if (style.formation === 'single') { x = gx + Math.sin(t * .35) * 40 * groundScale; y = gy + Math.sin(t * .5 + 1) * 10 * groundScale; }
        else { x = gx - dir * b * 32 * groundScale; y = gy + (b % 2 ? 1 : -1) * Math.ceil(b / 2) * 16 * groundScale; }
        const tip = style.flap ? -s * .55 * flap : -s * .1, lift = s * style.arc;
        const wing = () => {
          ctx.beginPath();
          ctx.moveTo(x - s, y + tip); ctx.quadraticCurveTo(x - s * .45, y - lift + tip * .35, x, y);
          ctx.quadraticCurveTo(x + s * .45, y - lift + tip * .35, x + s, y + tip);
          ctx.stroke();
        };
        if (style.edge) { ctx.strokeStyle = style.edge; ctx.lineWidth = Math.max(2.4, 3.8 * groundScale); wing(); }
        ctx.strokeStyle = style.color; ctx.lineWidth = Math.max(1.4, (style.edge ? 2 : 2.4) * groundScale); wing();
      }
      ctx.restore();
    }
  }
  if (glow && (dark || glow === 'always')) {
    for (const cellK of worldCells(groundTop, height, groundScale, 260)) for (let m = 0; m < 3; m++) {
      const i = cellK * 3 + m, r = j => unitRandom(`${seed}fire`, i, j);
      const x = ((r(1) * width + Math.sin(t * .5 + r(2) * 6.28) * 18 * groundScale - shiftX * .2) % width + width) % width;
      const y = groundTop - (cellK * 260 + r(3) * 260) * groundScale + Math.cos(t * .4 + r(4) * 6.28) * 12 * groundScale;
      if (y > groundTop - 12 * groundScale || y < -10) continue;
      const blink = Math.pow(Math.sin(t * 1.3 + r(5) * 6.28) * .5 + .5, 2), rad = (5 + 3 * r(6)) * groundScale;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad * 2.4);
      g.addColorStop(0, 'rgba(255,240,150,' + (.9 * blink) + ')'); g.addColorStop(1, 'rgba(255,240,150,0)');
      ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad * 2.4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }
}


// Moving life is placed per slice of the climb (world-fixed), so nothing repeats at the same spot as you go up.
function worldCells(groundTop, height, gs, cell) {
  const lo = Math.max(0, Math.floor((groundTop - height) / gs / cell) - 1), hi = Math.ceil(groundTop / gs / cell) + 1, out = [];
  for (let k = lo; k <= hi; k++) out.push(k);
  return out;
}
// Drifting art pieces (balloon, kite): placed per slice of the climb so they never repeat in the same spot,
// each drifting one way at its own pace, bobbing and swaying a little.
function drawSpritePieces(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, time = 0, reduced, groundScale = 1, seed = kit.id }) {
  const gs = groundScale, t = reduced ? 0 : time, groundTop = (floorY ?? height - 40) - 4 * gs + shiftY;
  for (const p0 of kit.config.pieces || []) {
    const image = kit.images[p0.img]; if (!image) continue;
    const p = p0;
    for (const cellK of worldCells(groundTop, height, gs, p.cell)) {
      const r = j => unitRandom(`${seed}${p.img}`, cellK, j); if (r(0) > p.prob) continue;
      const dir = r(1) > .5 ? 1 : -1, margin = p.w * gs * 1.5, c = width + margin * 2;
      const yWorld = cellK * p.cell + (.15 + .7 * r(3)) * p.cell, vis = Math.max(0, Math.min(1, (yWorld - p.minH) / 160)); if (vis < .01) continue;
      const x = ((((r(2) * c + dir * t * p.speed * gs - shiftX * .05) % c) + c) % c) - margin;
      const y = groundTop - yWorld * gs + Math.sin(t * .5 + r(4) * 6.28) * p.bob * gs, w = p.w * gs, h = w * image.naturalHeight / image.naturalWidth;
      if (y + h < 0 || y - h > height) continue;
      ctx.save(); ctx.globalAlpha = vis * (dark ? .7 : 1); ctx.translate(x, y); ctx.rotate(Math.sin(t * 1.3 + r(5) * 6.28) * p.sway); if (p.face && dir !== p.face) ctx.scale(-1, 1); // `face`: which way the picture points (1 = right), so it never flies backwards
      ctx.drawImage(image, -w / 2, -h / 2, w, h); ctx.restore();
    }
  }
}

// Other moving life, drawn in code. Each scene lists its own `movers`, so no two scenes share the same traffic.
function drawMovers(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, time = 0, reduced, groundScale = 1, seed = kit.id }) {
  const kinds = kit.config.movers; if (!kinds) return;
  const t = reduced ? 0 : time, gs = groundScale, span = height * 2.4;
  const groundTop = (floorY ?? height - 40) - 4 * gs + shiftY;
  const yOf = (r, par) => ((((r * span + shiftY * par) % span) + span) % span) - span * .3;
  const lane = (r0, dir, speed, margin, par = .1) => { const c = width + margin * 2; return ((((r0 * c + dir * t * speed - shiftX * par) % c) + c) % c) - margin; };
  for (const kind of kinds) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (kind === 'fish') {
      const cols = [['#f08a4b', '#fbd0a0'], ['#4f86c6', '#bcd8f2'], ['#e5c24b', '#fbefb0']];
      for (const cellK of worldCells(groundTop, height, gs, 170)) {
        const g = cellK, r = j => unitRandom(`${seed}fish`, g, j); if (r(0) > .5) continue;
        const big = r(9) > .75, ci = Math.floor(r(8) * 2), dir = r(1) > .5 ? 1 : -1, n = big ? 1 : 6, sz = (big ? 26 : 9) * gs;
        const gx = lane(r(2), dir, (big ? 14 : 30) * gs, 120 * gs), gy = groundTop - (cellK * 170 + r(3) * 170) * gs;
        if (gy > groundTop - 40 * gs) continue;
        for (let b = 0; b < n; b++) {
          const q = j => unitRandom(`${seed}fish${g}`, b, j);
          const x = gx - dir * q(1) * 70 * gs, y = gy + (q(2) - .5) * 60 * gs + Math.sin(t * 1.6 + q(3) * 6.28) * 6 * gs, wag = Math.sin(t * 7 + b) * .35 * sz;
          ctx.globalAlpha = .85; ctx.fillStyle = cols[big ? 2 : ci][0];
          ctx.beginPath(); ctx.ellipse(x, y, sz, sz * .5, 0, 0, 6.283); ctx.fill();
          ctx.beginPath(); ctx.moveTo(x - dir * sz * .8, y); ctx.lineTo(x - dir * sz * 1.6, y - sz * .55 + wag); ctx.lineTo(x - dir * sz * 1.6, y + sz * .55 + wag); ctx.closePath(); ctx.fill();
          ctx.fillStyle = cols[big ? 2 : ci][1]; ctx.beginPath(); ctx.ellipse(x + dir * sz * .1, y + sz * .15, sz * .6, sz * .22, 0, 0, 6.283); ctx.fill();
          ctx.fillStyle = '#2b3a4a'; ctx.beginPath(); ctx.arc(x + dir * sz * .6, y - sz * .1, Math.max(1.2, sz * .1), 0, 6.283); ctx.fill();
        }
      }
    } else if (kind === 'butterflies' && !dark) {
      for (let i = 0; i < 3; i++) {
        const r = j => unitRandom(`${seed}bf`, i, j);
        const x = lane(r(1), r(2) > .5 ? 1 : -1, 12 * gs, 60 * gs) + Math.sin(t * .9 + r(3) * 6.28) * 30 * gs;
        const y = groundTop - (50 + 170 * r(4)) * gs + Math.sin(t * 1.3 + r(5) * 6.28) * 22 * gs; // low, just above the grass
        const sky = Math.max(0, Math.min(1, (groundTop - 20 * gs - y) / (60 * gs))); if (!sky) continue;
        const flap = Math.abs(Math.sin(t * 9 + i * 2)) * .8 + .2, w = 7 * gs, col = ['#f2a65a', '#e58fb7', '#f6dc6a'][i % 3];
        ctx.globalAlpha = .9 * sky; ctx.fillStyle = col;
        for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + sd * w * .55 * flap, y - w * .3, w * .6 * flap, w * .75, sd * .5, 0, 6.283); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + sd * w * .4 * flap, y + w * .45, w * .4 * flap, w * .5, sd * -.4, 0, 6.283); ctx.fill(); }
        ctx.strokeStyle = '#5a4a40'; ctx.lineWidth = Math.max(1.4, 1.6 * gs); ctx.beginPath(); ctx.moveTo(x, y - w * .6); ctx.lineTo(x, y + w * .7); ctx.stroke();
      }
    } else if (kind === 'balloon' && !dark) {
      for (const cellK of worldCells(groundTop, height, gs, 1500)) {
      const r = j => unitRandom(`${seed}bal`, cellK, j), s = 26 * gs, dir = r(1) > .5 ? 1 : -1; if (r(0) > .6) continue;
      const x = lane(r(2), dir, 7 * gs, 90 * gs, .05), y = groundTop - (cellK * 1500 + r(3) * 1500) * gs + Math.sin(t * .4) * 6 * gs;
      if (y < groundTop - 300 * gs) {
        ctx.globalAlpha = .92;
        const cols = ['#e86f5c', '#f6d36a', '#e86f5c', '#f6d36a'];
        for (let k = 0; k < 4; k++) { ctx.fillStyle = cols[k]; ctx.beginPath(); ctx.ellipse(x + (k - 1.5) * s * .33, y, s * .24 * (k === 1 || k === 2 ? 1.1 : .8), s * .62, 0, 0, 6.283); ctx.fill(); }
        ctx.strokeStyle = '#5a4a40'; ctx.lineWidth = Math.max(1, gs); ctx.beginPath(); ctx.moveTo(x - s * .4, y + s * .6); ctx.lineTo(x - s * .15, y + s * 1.05); ctx.moveTo(x + s * .4, y + s * .6); ctx.lineTo(x + s * .15, y + s * 1.05); ctx.stroke();
        ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x - s * .17, y + s * 1.05, s * .34, s * .24);
      }
      }
    } else if (kind === 'plane' && !dark) {
      const r = j => unitRandom(`${seed}plane`, 0, j), dir = r(1) > .5 ? 1 : -1, s = 14 * gs;
      const x = lane(r(2), dir, 34 * gs, 200 * gs, .08), y = yOf(.05 + r(3) * .2, .2);
      if (y < groundTop - 320 * gs) {
        ctx.globalAlpha = .9; ctx.fillStyle = '#f4f1ea'; ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = Math.max(2, 2.4 * gs);
        ctx.beginPath(); ctx.ellipse(x, y, s * 1.2, s * .4, 0, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#d9604f'; ctx.beginPath(); ctx.moveTo(x - dir * s * .2, y); ctx.lineTo(x - dir * s * .9, y - s * .15); ctx.lineTo(x - dir * s * .6, y + s * .8); ctx.closePath(); ctx.fill();
      }
    } else if (kind === 'twinkle') {
      for (const cellK of worldCells(groundTop, height, gs, 200)) for (let m = 0; m < 3; m++) {
        const q = j => unitRandom(`${seed}tw`, cellK * 3 + m, j);
        const x = q(1) * width, y = groundTop - (cellK * 200 + q(2) * 200) * gs, a = .25 + .75 * Math.pow(Math.sin(t * (1 + q(3) * 1.6) + q(4) * 6.28) * .5 + .5, 2), z = (3 + 4 * q(5)) * gs;
        ctx.globalAlpha = a; ctx.fillStyle = q(6) > .7 ? '#ffe9a8' : '#ffffff';
        ctx.beginPath(); ctx.moveTo(x, y - z * 1.6); ctx.quadraticCurveTo(x, y, x + z * 1.6, y); ctx.quadraticCurveTo(x, y, x, y + z * 1.6); ctx.quadraticCurveTo(x, y, x - z * 1.6, y); ctx.quadraticCurveTo(x, y, x, y - z * 1.6); ctx.fill();
      }
    } else if (kind === 'comet') {
      for (const cellK of worldCells(groundTop, height, gs, 900)) {
        const q = j => unitRandom(`${seed}comet`, cellK, j); if (q(0) > .6) continue;
        const ph = (((t / (11 + 5 * q(1))) + q(2)) % 1 + 1) % 1; if (ph > .3) continue; const p = ph / .3, dir = q(3) > .5 ? 1 : -1;
        const x = (dir > 0 ? -.1 + 1.2 * p : 1.1 - 1.2 * p) * width, y = groundTop - (cellK * 900 + 120 + q(4) * 600) * gs + p * width * .3 * gs, L = 130 * gs;
        const tx = x - dir * L, ty = y - L * .3, g = ctx.createLinearGradient(x, y, tx, ty);
        g.addColorStop(0, 'rgba(210,235,255,.9)'); g.addColorStop(1, 'rgba(210,235,255,0)');
        ctx.globalAlpha = Math.min(1, p * 6, (1 - p) * 6); ctx.strokeStyle = g; ctx.lineWidth = 5 * gs; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, 4 * gs, 0, 6.283); ctx.fill();
      }
    } else if (kind === 'asteroid') {
      for (const cellK of worldCells(groundTop, height, gs, 1100)) {
        const q = j => unitRandom(`${seed}ast`, cellK, j); if (q(0) > .65) continue;
        const rad = (16 + 18 * q(1)) * gs, x = lane(q(2), q(3) > .5 ? 1 : -1, 5 * gs, 80 * gs, .05), y = groundTop - (cellK * 1100 + 100 + q(4) * 900) * gs, rot = t * (.25 + .3 * q(5)) * (q(3) > .5 ? 1 : -1);
        ctx.save(); ctx.globalAlpha = .95; ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = '#8c7f86'; ctx.strokeStyle = '#5d5360'; ctx.lineWidth = Math.max(1.5, 2 * gs);
        ctx.beginPath(); for (let v = 0; v < 9; v++) { const a = v / 9 * 6.283, rr = rad * (.78 + .3 * unitRandom(`${seed}astv${cellK}`, v, 1)); v ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#6c616c'; for (const [cx, cy, cr] of [[-.25, -.1, .22], [.2, .25, .16], [.15, -.3, .12]]) { ctx.beginPath(); ctx.arc(cx * rad, cy * rad, cr * rad, 0, 6.283); ctx.fill(); }
        ctx.restore();
      }
    } else if (kind === 'tumbleweed' && !dark) {
      const r = j => unitRandom(`${seed}tumble`, 0, j), rad = 13 * gs, x = lane(r(1), 1, 38 * gs, 80 * gs, .5), y = groundTop - rad - 6 * gs;
      if (y > -rad && y < height) {
        ctx.globalAlpha = .85; ctx.strokeStyle = '#a9855a'; ctx.lineWidth = Math.max(1.2, 1.5 * gs);
        const a0 = t * 38 * gs / rad; ctx.translate(x, y - Math.abs(Math.sin(t * 2.2)) * 7 * gs);
        for (let k = 0; k < 6; k++) { ctx.rotate(a0 * (k ? 0 : 1) + (k ? 1.05 : 0)); ctx.beginPath(); ctx.ellipse(0, 0, rad, rad * .55, 0, 0, 6.283); ctx.stroke(); }
      }
    }
    ctx.restore();
  }
}

// Indoor night: cool blue tint, warm lamp glows fixed to the wall (they scroll with the climb), and soft dark corners.
function drawIndoorNight(ctx, kit, { width, height, shiftY, floorY, groundScale = 1, seed = kit.id }) {
  ctx.save(); ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#6a6291'; ctx.fillRect(0, 0, width, height);
  const groundTop = (floorY ?? height - 40) - 4 * groundScale + shiftY, step = 330;
  const kMin = Math.max(0, Math.floor((groundTop - height) / groundScale / step) - 1), kMax = Math.ceil(groundTop / groundScale / step) + 1;
  ctx.globalCompositeOperation = 'screen';
  for (let k = kMin; k <= kMax; k++) {
    const x = width * (.15 + .7 * unitRandom(`${seed}lamp`, k, 1)), y = groundTop - (150 + k * step + 60 * unitRandom(`${seed}lamp`, k, 2)) * groundScale;
    const r = (150 + 60 * unitRandom(`${seed}lamp`, k, 3)) * groundScale, g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,196,120,.34)'); g.addColorStop(.5, 'rgba(255,170,90,.12)'); g.addColorStop(1, 'rgba(255,170,90,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
  const v = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * .3, width / 2, height / 2, Math.max(width, height) * .75);
  v.addColorStop(0, 'rgba(12,8,30,0)'); v.addColorStop(1, 'rgba(12,8,30,.5)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawTown(ctx, kit, options) {
  const { width, height, floorY, shiftY, time, reduced, dark } = options;
  const { town } = kit.config;
  const climb = Math.max(0, shiftY);
  const opening = Math.min(0, shiftY);
  // Keep the curb and road together, with a shallower dip than the measured objects.
  const groundShift = climb + opening * .55;
  const streetY = Math.min(floorY + groundShift - width * .105, floorY + shiftY - 3);
  const walkY = floorY + groundShift - width * .315;
  const separation = width * .16 * (1 - Math.exp(-climb / width));
  const shopsY = floorY - width * .57 + climb * .78 + opening * .72;
  const rearBase = floorY - width * .14;
  const hallY = rearBase - width * .89 + climb * .51 + opening * .40;
  const railY = rearBase - width * .99 + climb * .45 + opening * .25;
  const meadowY = rearBase - width * 1.21 + climb * .45 - separation;
  const cityY = rearBase - width * 1.45 + climb * .40 - separation;
  const picture = name => kit.images[town[name]];
  const terrain = (name, y, cover, artWidth = width) => {
    if (y >= height) return;
    const art = picture(name);
    const artHeight = artWidth * art.naturalHeight / art.naturalWidth;
    if (name === 'street') {
      drawTerrainImage(ctx, art, 0, y, width, artHeight, height, .85);
      return;
    }
    const bottom = y + artHeight;
    if (bottom < Math.min(height, cover)) {
      // Only extend the earth or foundation below the artwork; keep the illustrated details intact.
      ctx.drawImage(art, art.naturalWidth / 2, art.naturalHeight - 1, 1, 1,
        0, bottom - .5, width, Math.min(height, cover) - bottom + 1);
    }
    ctx.drawImage(art, (width - artWidth) / 2, y, artWidth, artHeight);
  };

  drawFloaters(ctx, kit, options);
  if (!dark) {
    const size = width * .14;
    ctx.drawImage(picture('sun'), width * .19, Math.max(width * .09, cityY - width * .17), size, size);
  }
  ctx.save();
  if (dark) ctx.filter = 'brightness(63%) saturate(78%)';
  terrain('city', cityY, meadowY + width * .20);
  terrain('meadow', meadowY, railY + width * .01, width * 1.15);
  // Use a larger illustrated embankment to keep its base behind the town hall.
  const railWidth = width * 1.5;
  terrain('rail', railY, shopsY + width * .29, railWidth);
  const train = picture('train');
  const trainW = width * .48;
  const trainH = trainW * train.naturalHeight / train.naturalWidth;
  const travel = width + trainW + 30;
  const trainX = reduced ? width * .22 : ((width * .64 + time * width * .12) % travel) - trainW;
  if (railY < height) ctx.drawImage(train, trainX, railY + width * .006 - trainH, trainW, trainH);
  terrain('hall', hallY, shopsY + width * .30);
  terrain('shops', shopsY, walkY + width * .10);
  terrain('walk', walkY, streetY + 1);
  terrain('street', streetY, height);
  ctx.restore();
}

function drawTimesSquare(ctx, kit, { width, height, floorY, shiftY, time, reduced }) {
  const { square } = kit.config;
  const scale = Math.max(width / 1024, (height * .2 + 52) / 680);
  const left = (width - 1024 * scale) / 2;
  const climb = Math.max(0, shiftY);
  const streetY = floorY - 560 * scale + shiftY;
  const skyY = floorY - 2180 * scale + climb * .075;
  const towerY = streetY - 890 * scale;
  const clock = reduced ? 0 : time;
  const image = name => kit.images[square[name]];
  const paint = (name, x, y, w, h) => ctx.drawImage(image(name), x, y, w, h);

  if (skyY > 0) ctx.drawImage(image('sky'), 512, 0, 1, 1, 0, 0, width, Math.min(height, skyY + 1));
  drawTerrainImage(ctx, image('sky'), left, skyY, 1024 * scale, 1536 * scale, height, .86);
  const skyscrapers = image('skyscrapers');
  const skyscraperY = height - 1820 * scale + climb * .23;
  if (skyscraperY < height) {
    paint('skyscrapers', left, skyscraperY, 1024 * scale,
      skyscrapers.naturalHeight * 1024 / skyscrapers.naturalWidth * scale);
  }

  if (streetY < height) paint('street', left, streetY, 1024 * scale, 1536 * scale);
  const towerScale = scale * .60;
  paint('tower', width / 2 - 234 * towerScale, towerY, 468 * towerScale, 1536 * towerScale);
  const screenW = 146 * towerScale;
  const screenH = 651 * towerScale;
  const screenY = towerY + 472 * towerScale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(width / 2 - screenW / 2, screenY, screenW, screenH);
  ctx.clip();
  const drift = Math.sin(clock * .65) * screenH * .13;
  paint('ribbon', width / 2 - screenW / 2, screenY - screenH * .14 + drift, screenW, screenH * 1.28);
  for (let i = 0; i < 3; i++) {
    const progress = (clock * .17 + i / 3) % 1;
    const size = screenW * .35;
    ctx.globalAlpha = Math.sin(Math.PI * progress) * .85;
    paint('spark', width / 2 + (i - 1) * screenW * .21 - size / 2, screenY + (1 - progress) * screenH, size, size);
  }
  ctx.restore();

  // The sidewalks, shops and street share a single perspective and camera position.
  const sidesY = streetY - 765 * scale;
  if (sidesY >= height) return;
  paint('sides', left, sidesY, 1024 * scale, 1135 * scale);

  if (!reduced) {
    const marquee = image('marquee');
    const frameWidth = marquee.naturalWidth / 2;
    const phase = Math.floor(clock / .72) % 2;
    ctx.drawImage(marquee, phase * frameWidth, 0, frameWidth, marquee.naturalHeight,
      left + 187 * scale, sidesY + 542 * scale, frameWidth * scale, marquee.naturalHeight * scale);

    // Repaint the existing lamp glass and theater posters with staggered dips.
    const lights = [[337, 671, 26, 26], [703, 649, 33, 30], [644, 690, 23, 24],
      [207, 751, 25, 69], [288, 744, 24, 65]];
    for (const [i, [x, y, w, h]] of lights.entries()) {
      const dim = Math.max(0, Math.sin(clock * (1.7 + i * .17) + i * 2.2)) ** 5;
      ctx.save();
      ctx.filter = `brightness(${1 - .40 * dim})`;
      ctx.drawImage(image('sides'), x, y, w, h, left + x * scale, sidesY + y * scale, w * scale, h * scale);
      ctx.restore();
    }
  }


  const billboard = (name, x, y, w, h, angle, zoom, hue, pulse) => {
    ctx.save();
    ctx.translate(left + x * scale, sidesY + y * scale);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#18154b';
    ctx.strokeStyle = name === 'cup' ? '#56dcff' : '#ff71da';
    ctx.lineWidth = 5;
    ctx.globalAlpha = pulse;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.beginPath();
    ctx.rect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10);
    ctx.clip();
    ctx.filter = hue ? `hue-rotate(${hue}deg)` : 'none';
    const icon = image(name);
    const iconH = h * .75 * zoom;
    const iconW = iconH * icon.naturalWidth / icon.naturalHeight;
    if (name === 'cup') {
      ctx.translate(0, iconH * .38);
      ctx.rotate(Math.sin(clock * 2.1) * .21);
      paint(name, -iconW / 2, -iconH * .88, iconW, iconH);
    } else {
      paint(name, -iconW / 2, -iconH / 2, iconW, iconH);
    }
    ctx.restore();
  };
  billboard('cup', 221, 401, 63, 136, .22, 1, 0, .95);
  billboard('circles', 797, 370, 74, 102, -.24, .70, clock * 46 % 360, .90 + .10 * Math.sin(clock * 2.3));
  billboard('star', 717, 548, 52, 71, -.23, .79 + .20 * Math.sin(clock * 2.0), 0, .88 + .12 * Math.sin(clock * 2.0));

  const grateX = left + 964 * scale;
  const grateY = sidesY + 1024 * scale;
  paint('grate', grateX - 32 * scale, grateY - 8 * scale, 64 * scale, 16 * scale);
  if (!reduced) {
    for (let i = 0; i < 2; i++) {
      const phase = (clock / 3.4 + .18 + i / 2) % 1;
      const w = (53 + 28 * phase) * scale;
      const h = (112 + 42 * phase) * scale;
      ctx.save();
      ctx.globalAlpha = Math.sin(Math.PI * phase) * .82;
      paint('steam', grateX - w / 2 - phase * 36 * scale,
        grateY - h - phase * 150 * scale, w, h);
      ctx.restore();
    }
  }
}

function drawBeachCoast(ctx, kit, options) {
  const { width, height, floorY, shiftY, time, reduced, dark } = options;
  const { coast } = kit.config;
  const sand = kit.images[coast.sand];
  const sea = kit.images[coast.sea];
  const point = kit.images[coast.point];
  const foam = kit.images[coast.foam];
  const climb = Math.max(0, shiftY);
  const seaY = floorY - width * .98 + climb * .17;
  const sandY = floorY - width * .37 + climb * .60 + Math.min(0, shiftY) * .45;
  const sandHeight = width * sand.naturalHeight / sand.naturalWidth;
  const pointWidth = width * .95;
  const pointHeight = pointWidth * point.naturalHeight / point.naturalWidth;
  const pointX = width * .16;
  const pointY = seaY + width * .17 - pointHeight;
  const pointScale = pointWidth / point.naturalWidth;
  const wet = kit.images[coast.wet];
  const wetY = floorY - width * .50 + climb * .37 + Math.min(0, shiftY) * .25;
  const clock = reduced ? 0 : time;
  const tide = reduced ? 0 : Math.sin(time * 1.65);
  const foamWidth = width * 1.05;
  const foamHeight = foamWidth * foam.naturalHeight / foam.naturalWidth;

  const foamX = (width - foamWidth) / 2;
  const foamY = wetY - width * .022 + tide * width * .032;
  const wash = kit.images[coast.wash];
  const washDepth = (wash.naturalHeight - foam.naturalHeight) * foamWidth / foam.naturalWidth;

  drawFloaters(ctx, kit, options);
  ctx.save();
  if (dark) ctx.filter = 'brightness(62%) saturate(80%)';
  if (wetY < height) {
    drawTerrainImage(ctx, wet, 0, wetY, width, width * wet.naturalHeight / wet.naturalWidth,
      Math.min(height, sandY + width * .18), .75);
    ctx.drawImage(wash, foamX, foamY - washDepth, foamWidth, foamHeight + washDepth);
  }
  const seaBottom = Math.min(height, wetY + width * .012);
  if (seaY < seaBottom) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, seaY, width, seaBottom - seaY);
    ctx.clip();
    drawTerrainImage(ctx, sea, 0, seaY, width, width * sea.naturalHeight / sea.naturalWidth,
      seaBottom, .82);
    ctx.restore();
  }
  const boat = kit.images[coast.boat];
  const boatWidth = width * .10;
  const boatHeight = boatWidth * boat.naturalHeight / boat.naturalWidth;
  const boatX = width * .19 + Math.sin(clock * .30) * width * .115;
  const boatY = seaY + width * .27 + Math.sin(clock * 2) * 2;
  if (boatY < height) ctx.drawImage(boat, boatX - boatWidth / 2, boatY - boatHeight, boatWidth, boatHeight);

  if (pointY < height) {
    ctx.drawImage(point, pointX, pointY, pointWidth, pointHeight);
    const fronds = kit.images[coast.fronds];
    ctx.save();
    ctx.translate(pointX + 451 * pointScale, pointY + 408 * pointScale);
    ctx.rotate(Math.sin(clock * 1.5) * .075);
    ctx.drawImage(fronds, -75 * pointScale, -82 * pointScale,
      fronds.naturalWidth * pointScale, fronds.naturalHeight * pointScale);
    ctx.restore();
  }
  if (wetY < height) {
    ctx.save();
    ctx.globalAlpha = .83 + tide * .09;
    ctx.drawImage(foam, foamX, foamY, foamWidth, foamHeight);
    ctx.restore();
  }
  if (sandY < height) drawTerrainImage(ctx, sand, 0, sandY, width, sandHeight, height, .73);
  if (isNight(kit.config, dark) && !reduced && pointY < height) {
    const sweep = time % 9;
    const beam = kit.images[coast.beam];
    const beamHeight = width * .15;
    ctx.save();
    ctx.filter = 'none';
    ctx.globalAlpha = .38 * Math.max(0, Math.sin(Math.PI * Math.min(1, sweep / 4.2)));
    ctx.translate(pointX + 295 * pointScale, pointY + 122 * pointScale);
    ctx.rotate(Math.PI - .04 - sweep * .075);
    ctx.drawImage(beam, 0, -beamHeight / 2, width * .68, beamHeight);
    ctx.restore();
  }
  ctx.restore();
}

function drawSunsetRooftops(ctx, kit, options) {
  const { width, height, floorY, shiftY, dark, time, reduced } = options;
  const art = kit.config.rooftop;
  const scale = Math.max(width / 1024, .29);
  const left = (width - 1024 * scale) / 2;
  const climb = Math.max(0, shiftY);
  const separation = 100 * (1 - Math.exp(-climb / 350));
  const cityY = floorY - 1890 * scale + climb * .16;
  const farY = floorY - 1160 * scale + climb * .16 + separation * .26;
  const gardenY = floorY - 830 * scale + climb * .16 + separation * .61;
  const deckY = floorY - 285 * scale + climb * .16 + separation + Math.min(0, shiftY);
  const towerY = farY - 195 * scale;
  const night = isNight(kit.config, dark);
  const city = kit.images[art.city];

  // Every illustrated panel is drawn once, at its native aspect ratio.
  const draw = (name, y, x = left) => {
    const image = kit.images[art[name]];
    const h = image.naturalHeight * scale;
    if (y < height && y + h > 0) ctx.drawImage(image, x, y, image.naturalWidth * scale, h);
  };

  ctx.save();
  if (night) ctx.filter = 'brightness(68%) saturate(70%) hue-rotate(22deg)';
  if (cityY > 0) {
    ctx.drawImage(city, 512, 0, 1, 1, 0, 0, width, Math.min(height, cityY + 1));
  }
  draw('city', cityY);
  ctx.restore();

  drawFloaters(ctx, kit, { ...options, dark: night });

  const celestial = kit.images[night ? art.moon : art.sun];
  const size = (night ? 100 : 116) * scale;
  const celestialY = cityY + (night ? 395 : 575) * scale;
  if (celestialY < height && celestialY + size > 0) {
    ctx.drawImage(celestial, width * .23 - size / 2, celestialY,
      size, size * celestial.naturalHeight / celestial.naturalWidth);
  }
  ctx.save();
  if (night) ctx.filter = 'brightness(72%) saturate(82%)';
  draw('far', farY);
  const towerX = left + 762 * scale;
  draw('tower', towerY, towerX);
  if (towerY < height) {
    const handSize = 96 * scale;
    for (const [hand, speed] of [[art.hour, .04], [art.minute, .48]]) {
      ctx.save();
      ctx.translate(towerX + 79 * scale, towerY + 206 * scale);
      ctx.rotate(reduced ? 0 : time * speed);
      ctx.drawImage(kit.images[hand], -handSize / 2, -handSize / 2, handSize, handSize);
      ctx.restore();
    }
  }
  draw('garden', gardenY);
  draw('deck', deckY);
  ctx.restore();
}

function drawBoardwalkAvenue(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, time, reduced, groundScale }) {
  const { avenue } = kit.config;
  const pier = kit.images[avenue.pier];
  const shops = kit.images[avenue.shops];
  const beach = kit.images[avenue.beach];
  const ocean = kit.images[avenue.ocean];
  const stand = kit.images[avenue.stand];
  const wheel = kit.images[avenue.wheel];
  const cabin = kit.images[avenue.carriage];

  // The shop artwork contains the front planks, so it must keep the same
  // position relative to the pier. Keep the deck covering the bottom of the
  // frame during the camera's opening dip, then scroll the whole path together.
  const artHeight = Math.min(height, pier.naturalHeight * width / pier.naturalWidth);
  const scaleY = artHeight / pier.naturalHeight;
  const baseY = height - artHeight;
  const climb = Math.max(0, shiftY);
  const pierY = baseY + climb * .26;
  const oceanY = baseY + climb * .13;
  const beachY = baseY + 628 * scaleY + climb * .20;
  const oceanHeight = ocean.naturalHeight * scaleY;
  const shopsY = pierY + 595 * scaleY;

  ctx.save();
  if (dark) ctx.filter = 'brightness(58%)';
  if (oceanY > 0) {
    // Extend the sky at its painted top edge while the horizon scrolls down.
    ctx.drawImage(ocean, ocean.naturalWidth / 2, 0, 1, 1, 0, 0, width, Math.min(height, oceanY + 1));
  }
  // Extend water behind the independently scrolling shoreline.
  const beachHeight = beach.naturalHeight * scaleY;
  if (oceanY < height) drawTerrainImage(ctx, ocean, 0, oceanY, width, oceanHeight, Math.min(height, beachY + 40 * scaleY), .84);
  if (beachY < height) drawTerrainImage(ctx, beach, 0, beachY, width, beachHeight, height, .75);
  ctx.restore();

  // Keep drifting clouds in the sky and behind the wheel.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, Math.max(0, oceanY + 463 * scaleY));
  ctx.clip();
  ctx.globalAlpha = Math.max(0, Math.min(1, (shiftY - 100) / 380));
  drawSkyPieces(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, groundScale });
  drawFloaters(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, time, reduced, groundScale });
  ctx.restore();

  ctx.save();
  if (dark) ctx.filter = 'brightness(58%)';
  if (pierY < height) ctx.drawImage(pier, 0, pierY, width, artHeight);
  if (wheel && stand && pierY < height) {
    const cx = width / 2;
    const cy = pierY + 336 * scaleY;
    const size = 317 * scaleY;
    const angle = reduced ? 0 : time * .27;
    const standHeight = 310 * scaleY;
    const standWidth = standHeight * stand.naturalWidth / stand.naturalHeight;
    ctx.drawImage(stand, cx - standWidth / 2, cy - standHeight * .14, standWidth, standHeight);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.drawImage(wheel, -size / 2, -size / 2, size, size);
    ctx.restore();
    if (cabin) drawWheelCarriages(ctx, cabin, cx, cy, size, size, angle, time, reduced);
  }
  if (shops && shopsY < height) ctx.drawImage(shops, 0, shopsY, width, shops.naturalHeight * scaleY);
  ctx.restore();
}

function drawFallingPetals(ctx, image, width, height, time, shiftY) {
  const box = columnBounds(image, 0);
  const travel = height + 40;
  for (let i = 0; i < 12; i++) {
    const y = ((i * travel / 12 + time * (30 + i % 4 * 7) + shiftY * .12) % travel + travel) % travel - 20;
    const x = width * (.07 + (i * .618 % 1) * .86) + Math.sin(time * 1.3 + i * 2) * 16;
    const size = 12 + i % 4 * 3;
    ctx.save();
    ctx.globalAlpha = .84;
    ctx.translate(x, y);
    ctx.rotate(Math.sin(time * 1.6 + i) * .7);
    ctx.drawImage(image, ...box, -size / 2, -size / 2, size, size * box[3] / box[2]);
    ctx.restore();
  }
}

export function drawSceneryLayers(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, time, reduced, groundScale = 1, anchorX = width / 2, pass = 'all', climbPx = 0 }) {
  const { config, images } = kit;
  ctx.save();
  const roomBack = images[config.roomBack];
  if (pass !== 'foreground' && roomBack) {
    const scale = Math.max(width / roomBack.naturalWidth, height / roomBack.naturalHeight);
    const w = roomBack.naturalWidth * scale, h = roomBack.naturalHeight * scale;
    const x = (width - w) / 2;
    if (config.roomBackParallax) {
      const offset = ((shiftY * config.roomBackParallax % (2 * h)) + 2 * h) % (2 * h);
      for (let y = offset - 2 * h, row = 0; y < height; y += h, row++) {
        if (y + h <= 0) continue;
        ctx.save();
        ctx.translate(x, y + (row % 2 ? h : 0));
        if (row % 2) ctx.scale(1, -1);
        ctx.drawImage(roomBack, 0, 0, w, h + .5);
        ctx.restore();
      }
    } else {
      ctx.drawImage(roomBack, x, (height - h) / 2, w, h);
    }
  }
  if (pass !== 'foreground' && config.wallpaper && !roomBack) {
    drawWallpaper(ctx, config.wallpaper, { width, height, shiftY, shiftX, dark });
  }
  if (pass !== 'foreground' && images[config.texture] && !(config.texture === 'star-field' && config.night === 'dark' && !dark)) {
    const tile = 360, offsetY = ((shiftY * .12) % tile + tile) % tile;
    const offsetX = ((shiftX * .08) % tile + tile) % tile;
    ctx.globalAlpha = (config.texture === 'star-field' ? (isNight(config, dark) ? .32 : .85) : .14) * (dark && kit.id !== 'space' ? .5 : 1);
    for (let y = offsetY - tile; y < height; y += tile) for (let x = offsetX - tile; x < width; x += tile) ctx.drawImage(images[config.texture], x, y, tile, tile);
  }
  // Night sky: stars behind everything else in every outdoor scene (space and the old city sky already have their own).
  if (pass !== 'foreground' && images['star-field'] && config.texture !== 'star-field' && !NO_STARS.has(kit.id) && (dark || config.night === true)) {
    const tile = 300, offsetY = ((shiftY * .06) % tile + tile) % tile, offsetX = ((shiftX * .04) % tile + tile) % tile;
    ctx.globalAlpha = .7;
    for (let y = offsetY - tile; y < height; y += tile) for (let x = offsetX - tile; x < width; x += tile) ctx.drawImage(images['star-field'], x, y, tile, tile);
  }
  ctx.globalAlpha = 1;
  // Sky textures stay behind clouds; rooted scenery and atmosphere are painted after them.
  if (pass === 'background') { ctx.restore(); return; }
  if (config.panels) drawPanels(ctx, kit, { width, height, shiftY, shiftX, floorY, groundScale, anchorX, climbPx });
  drawDecor(ctx, kit, { width, height, shiftY, shiftX, floorY, groundScale, anchorX });
  drawTall(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, groundScale, anchorX });
  if (config.town) {
    drawTown(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, time, reduced, groundScale });
  } else if (config.square) {
    drawTimesSquare(ctx, kit, { width, height, floorY, shiftY, time, reduced });
  } else if (config.coast) {
    drawBeachCoast(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, time, reduced, groundScale });
  } else if (config.rooftop) {
    drawSunsetRooftops(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, time, reduced, groundScale });
  } else if (config.avenue) {
    drawBoardwalkAvenue(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, time, reduced, groundScale });
  } else {
    drawSkyPieces(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, groundScale });
    drawFloaters(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, time, reduced, groundScale });
  }
  drawFlyers(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, time, reduced, groundScale });
  drawMovers(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, time, reduced, groundScale });
  drawBackdrop(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, groundScale, anchorX });
  drawParallax(ctx, kit, { width, height, shiftY, floorY, dark, groundScale, time, reduced });
  const petals = images[config.fallingPetals];
  if (petals && !reduced) drawFallingPetals(ctx, petals, width, height, time, shiftY);
  drawSpritePieces(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, time, reduced, groundScale }); // in front of the far layers, so nothing flies behind a hill and vanishes
  for (const [index, name] of (config.layers || []).entries()) {
    const image = images[name]; if (!image) continue;
    const wisp = ['mist', 'enchanted-mist', 'nebula'].includes(name);
    const size = name === 'nebula' ? Math.min(460, width * 1.15) : wisp ? Math.min(340, width * .9) : name === 'bubbles' ? 68 : name === 'snowflakes' ? 170 : 140;
    const aspect = image.naturalHeight / image.naturalWidth;
    ctx.globalAlpha = (name === 'mist' ? .45 : name === 'enchanted-mist' ? .38 : name === 'nebula' ? .6 : wisp ? .12 :
      name === 'bubbles' ? .72 : name === 'snowflakes' ? 1 : .22) * (dark ? .8 : 1);
    const span = height + size * aspect + 60;
    const copies = name === 'snowflakes' ? 5 : name === 'bubbles' ? 4 : 3;
    for (let i = 0; i < copies; i++) {
      const drift = reduced ? 0 : time * (name === 'bubbles' ? -5 : name === 'snowflakes' ? 7 : .6);
      const y = (((i * span / copies + index * 61 + shiftY * .18 + drift) % span) + span) % span - size * aspect;
      const x = width * [.12, .85, .4, .64, .26][i] + shiftX * .1;
      ctx.drawImage(image, x - size / 2, y, size, size * aspect);
    }
  }
  if (dark && INDOOR.has(kit.id)) drawIndoorNight(ctx, kit, { width, height, shiftY, floorY, groundScale });
  ctx.restore();
}

function floorInset(kit) { return kit.config.floorInset ?? (kit.config.floor === 'forest-floor' ? 20 : 14); }

export function drawSceneryFloor(ctx, kit, meta, { width, height, floorY, shiftX, groundScale = 1, anchorX = width / 2, dark }) {
  const image = kit.images[kit.config.floor]; if (!image) return;
  const tile = (kit.config.floorTileWidth || 380) * groundScale, tileH = tile * image.naturalHeight / image.naturalWidth;
  // The measured baseline is inside the solid surface, not perched on its upper edge.
  // Moss needs more depth so feet meet brown soil rather than the green rim.
  const inset = floorInset(kit) * groundScale;
  const top = floorY - tileH * meta.surface - inset;
  if (top >= height || top + tileH <= 0) return;
  const phase = shiftX + anchorX * (1 - groundScale);
  const offset = ((phase % tile) + tile) % tile - tile;
  ctx.save();
  if (isNight(kit.config, dark) || (dark && INDOOR.has(kit.id))) ctx.filter = 'brightness(60%)';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches, clock = reducedMotion ? 0 : performance.now() / 1000;
  for (const q of kit.config.floorDrifters || []) { // cars and bikes on the far street, just behind the sidewalk: they drive the way they face
    const pic = kit.images[q.img]; if (!pic) continue;
    const dir = driftDirFor(kit), vw = q.w * tile, vh = vw * pic.naturalHeight / pic.naturalWidth, span = width + vw * 2 + (q.gap || 0) * groundScale;
    const x = ((dir * clock * q.speed * groundScale + (q.start || 0) * span) % span + span) % span - vw, y = top + q.lane * tileH - vh + Math.sin(clock * 9 + (q.start || 0) * 40) * (q.bob || 0) * groundScale;
    if (dir < 0) { ctx.save(); ctx.translate(x + vw, 0); ctx.scale(-1, 1); ctx.drawImage(pic, 0, y, vw, vh); ctx.restore(); } else ctx.drawImage(pic, x, y, vw, vh);
  }
  for (let x = offset; x < width; x += tile) ctx.drawImage(image, x, top, tile + 1, tileH);
  const wash = kit.config.wash && kit.images[kit.config.wash.img];
  if (wash) { // a wave that rolls up the sand, then slides back out leaving a line of foam
    const t = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : performance.now() / 1000, ph = (Math.sin(t * .6) + 1) / 2, wh = tile * wash.naturalHeight / wash.naturalWidth * kit.config.wash.scale;
    const W2 = kit.config.wash, ww = tile * W2.scale, edge = tileH * .55 + W2.start * groundScale, wy = top + edge + ph * W2.amp * groundScale - wh * .92, foam = kit.images[W2.foam];
    for (let x = offset; x < width; x += ww) {
      if (foam) { const fh = ww * foam.naturalHeight / foam.naturalWidth; ctx.globalAlpha = Math.max(0, 1 - ph * 1.6) * .85; ctx.drawImage(foam, x, top + edge + W2.amp * groundScale - fh * .7, ww + 1, fh); }
      ctx.globalAlpha = .96; ctx.drawImage(wash, x, wy, ww + 1, wh);
    }
  }
  ctx.restore();
}
