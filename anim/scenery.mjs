// Scenery follows the larger object's identity. Measurements never select a biome.
export const OBJECT_GROUPS = {
  grass: `grain-of-sand ant ladybug honeybee acorn snail frog pinecone hamster blade-of-grass hedgehog turtle pigeon rabbit daisy long-stem-rose duck lawn-flamingo stork flamingo capybara adult-human giant-anthill kangaroo picnic-table park-bench sunflower central-park hot-air-balloon wind-turbine windmill`,
  beach: `sand-dollar seahorse starfish surfboard beach-towel pool-noodle umbrella palm-tree lighthouse dolphin barracuda stingray swordfish hammerhead-shark great-white-shark manta-ray killer-whale whale-shark blue-whale rowboat canoe fishing-boat titanic cruise-ship aircraft-carrier`,
  living: `tv-remote lava-lamp pillow acoustic-guitar trumpet violin saxophone drum-stick barstool folding-chair jeans broom mop ladder couch door queen-size-bed grand-piano yoga-mat`,
  kitchen: `blueberry cheerio gummy-bear chocolate-drop ice-cube strawberry chicken-nugget peanut egg apple french-fry whiskey-glass donut bagel butter-stick soda-can teacup hot-dog pancakes ice-cream-cone toothpaste toothbrush comb dog-bowl banana pizza-slice cucumber baby-bottle wine-glass boba-tea drinking-straw beer-bottle cream-pie pineapple wine-bottle foot-long-sub watermelon cotton-candy pizza-pie cheese-wheel baguette plunger bathtub refrigerator`,
  city: `house-brick handcuffs gold-bar exit-sign license-plate fire-extinguisher anvil manhole-cover car-tire trash-can traffic-cone fire-hydrant skateboard scooter newspaper-box traffic-light mailbox parking-meter hot-dog-cart unicycle bicycle dumpster robot basketball-backboard vending-machine motorcycle stop-sign phone-booth porta-potty bus-shelter town-fountain car taxi minivan ambulance ice-cream-truck jumbotron flagpole shipping-container soccer-goal streetlight carousel garbage-truck fire-truck excavator double-decker-bus school-bus helicopter telephone-pole billboard fighter-jet locomotive semi-truck basketball-court space-shuttle christ-statue boeing-737 water-tower power-line-tower statue-of-liberty olympic-pool leaning-tower-of-pisa notre-dame airliner taj-mahal blimp tower-crane big-ben football-field washington-monument sydney-opera-house space-needle colosseum gateway-arch eiffel-tower empire-state-building cn-tower burj-khalifa brooklyn-bridge golden-gate-bridge`,
  forest: `owl black-bear panda gorilla deer brown-bear komodo-dragon green-anaconda oak-tree t-rex alligator saltwater-crocodile niagara-falls angel-falls hoover-dam`,
  farm: `scarecrow pig horse cow corn-stalk tractor barn-silo teepee barrel`,
  snow: `penguin polar-bear snowboard mount-everest`,
  desert: `cactus great-pyramid grand-canyon mount-kilimanjaro ostrich zebra giraffe lion rhinoceros hippopotamus elephant moai stonehenge mount-fuji`,
  underwater: `jellyfish pufferfish koi-fish octopus electric-eel giant-squid mariana-trench`,
  space: `saturn-rocket`,
  enchanted: `magic-wand pegasus castle`,
  tabletop: `poppy-seed sesame-seed grain-of-rice human-eyelash die marble penny button tooth quarter checkers-piece lego-brick paperclip poker-chip ping-pong-ball cork clown-nose aa-battery letter-block domino key whistle rubiks-cube earbuds-case shuttlecock tennis-ball baseball wooden-block toy-car hockey-puck chattering-teeth credit-card playing-card rubber-duck scrunchie fake-mustache light-bulb toilet-paper-square dvd index-card lottery-ticket retro-cartridge smartphone game-controller pencil jack-in-the-box whoopee-cushion volleyball bowling-ball soccer-ball hairbrush basketball paintbrush frisbee football baseball-cap sheet-of-paper-a4 boxing-glove sneaker football-helmet vinyl-record laptop bowling-pin rubber-chicken cowboy-hat foam-finger tennis-racket baseball-bat earbuds pool-cue convenient-receipt hockey-stick`,
};
export const SCENERY_BY_OBJECT = Object.create(null);
for (const [scene, words] of Object.entries(OBJECT_GROUPS)) for (const id of words.split(/\s+/)) {
  if (SCENERY_BY_OBJECT[id]) throw new Error('Duplicate scenery assignment: ' + id);
  SCENERY_BY_OBJECT[id] = scene;
}
// The shuttle is a space object even though it launches from a city/airfield.
SCENERY_BY_OBJECT['space-shuttle'] = 'space';
for (const id of ['cockroach', 'golf-ball', 'pogo-stick']) SCENERY_BY_OBJECT[id] = 'grass';
for (const id of ['dachshund', 'corgi', 'domestic-cat']) SCENERY_BY_OBJECT[id] = 'living';
SCENERY_BY_OBJECT.stethoscope = 'tabletop';
SCENERY_BY_OBJECT['london-eye'] = 'city';
export function sceneryFor(object) { return SCENERY_BY_OBJECT[object.id] || 'grass'; }

export const SETTINGS = {
  grass: { clouds: true },
  beach: { floor: 'beach', sky: ['#b5d9ee', '#edf6f6'], clouds: true },
  living: { floor: 'hardwood', sky: ['#f2e6d4', '#fff8e9'], texture: 'indoor-wall', layers: ['dust-motes'] },
  kitchen: { floor: 'kitchen', sky: ['#f1e9d7', '#fff9ed'], texture: 'indoor-wall', layers: ['dust-motes'] },
  tabletop: { floor: 'tabletop', sky: ['#f3e7d2', '#fff8e9'], texture: 'indoor-wall' },
  city: { floor: 'pavement', sky: ['#c3d9e9', '#ecf2f3'], clouds: true },
  forest: { floor: 'forest-floor', sky: ['#b9d2c7', '#e3ede0'], layers: ['mist'] },
  farm: { floor: 'farm-floor', sky: ['#c0dbe1', '#edf3e1'], clouds: true },
  snow: { floor: 'snow-floor', sky: ['#c2dcea', '#f0f6fb'], clouds: true, layers: ['snowflakes'] },
  desert: { floor: 'desert-floor', sky: ['#ead5be', '#fff0da'], clouds: true },
  underwater: { floor: 'seabed', sky: ['#9ecfd3', '#c7e3df'], texture: 'water-light', layers: ['bubbles'] },
  space: { floor: 'moon-floor', sky: ['#242341', '#383453'], texture: 'star-field', layers: ['nebula'] },
  enchanted: { sky: ['#d8d0e9', '#f0e7ef'], clouds: true, layers: ['enchanted-mist', 'magic-motes'] },
};
const imageCache = new Map();
function loadImage(url) {
  if (!imageCache.has(url)) imageCache.set(url, new Promise(resolve => {
    const image = new Image(); image.onload = () => resolve(image); image.onerror = () => resolve(null); image.src = url;
  }));
  return imageCache.get(url);
}
// Load the selected kit before its first frame. A missing required floor falls back to grass.
export async function loadScenery(object, base) {
  const id = sceneryFor(object), config = SETTINGS[id];
  const names = [config.floor, config.texture, ...(config.layers || [])].filter(Boolean);
  const images = Object.fromEntries(await Promise.all(names.map(async name => [name, await loadImage(base + name + '.png')])));
  if (config.floor && !images[config.floor]) return { id: 'grass', config: SETTINGS.grass, images: {} };
  return { id, config, images };
}

// Image layers follow the climb with the same downward parallax as the original clouds.
export function drawSceneryLayers(ctx, kit, { width, height, shiftY, shiftX, dark, time, reduced }) {
  const { config, images } = kit;
  ctx.save();
  if (images[config.texture]) {
    const tile = 360, offsetY = ((shiftY * .12) % tile + tile) % tile;
    const offsetX = ((shiftX * .08) % tile + tile) % tile;
    ctx.globalAlpha = (config.texture === 'star-field' ? .85 : .14) * (dark && kit.id !== 'space' ? .5 : 1);
    for (let y = offsetY - tile; y < height; y += tile) for (let x = offsetX - tile; x < width; x += tile) ctx.drawImage(images[config.texture], x, y, tile, tile);
  }
  for (const [index, name] of (config.layers || []).entries()) {
    const image = images[name]; if (!image) continue;
    const wisp = ['mist', 'enchanted-mist', 'nebula'].includes(name);
    const size = wisp ? 240 : name === 'bubbles' ? 70 : 140;
    const aspect = image.naturalHeight / image.naturalWidth;
    ctx.globalAlpha = (wisp ? .12 : name === 'bubbles' ? .14 : .22) * (dark ? .65 : 1);
    const span = height + size * aspect + 60;
    for (let i = 0; i < 3; i++) {
      const drift = reduced ? 0 : time * (name === 'bubbles' ? -.9 : .6);
      const y = (((i * height * .43 + index * 61 + shiftY * .18 + drift) % span) + span) % span - size * aspect;
      const x = width * [.1, .72, .4][i] + shiftX * .1;
      ctx.drawImage(image, x - size / 2, y, size, size * aspect);
    }
  }
  ctx.restore();
}

export function drawSceneryFloor(ctx, kit, meta, { width, height, floorY, shiftX }) {
  const image = kit.images[kit.config.floor]; if (!image) return;
  const tile = 380, tileH = tile * image.naturalHeight / image.naturalWidth;
  // The measured baseline is inside the solid surface, not perched on its upper edge.
  // Moss needs more depth so feet meet brown soil rather than the green rim.
  const inset = kit.config.floor === 'forest-floor' ? 20 : 14;
  const top = floorY - tileH * meta.surface - inset;
  if (top >= height || top + tileH <= 0) return;
  const offset = ((shiftX % tile) + tile) % tile - tile;
  for (let x = offset; x < width; x += tile) ctx.drawImage(image, x, top, tile + 1, tileH);
}
