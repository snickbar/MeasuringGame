// Scenery follows the larger object's identity. Measurements never select a biome.
export const OBJECT_GROUPS = {
  grass: `acorn adult-human ant blade-of-grass capybara central-park cockroach daisy duck flamingo frog giant-anthill golf-ball grain-of-sand hamster hedgehog honeybee hot-air-balloon kangaroo ladybug lawn-flamingo long-stem-rose park-bench picnic-table pigeon pinecone pogo-stick rabbit snail stork sunflower turtle wind-turbine windmill`,
  beach: `aircraft-carrier beach-towel canoe cruise-ship fishing-boat lighthouse palm-tree pool-noodle rowboat sand-dollar starfish surfboard titanic umbrella`,
  living: `acoustic-guitar barstool broom corgi couch dachshund domestic-cat door drum-stick folding-chair grand-piano jeans ladder lava-lamp mop pillow queen-size-bed saxophone trumpet tv-remote violin yoga-mat`,
  kitchen: `apple baby-bottle bagel baguette banana bathtub beer-bottle blueberry boba-tea butter-stick cheerio cheese-wheel chicken-nugget chocolate-drop comb cotton-candy cream-pie cucumber dog-bowl donut drinking-straw egg foot-long-sub french-fry gummy-bear hot-dog ice-cream-cone ice-cube pancakes peanut pineapple pizza-pie pizza-slice plunger refrigerator soda-can strawberry teacup toothbrush toothpaste watermelon whiskey-glass wine-bottle wine-glass`,
  city: `airliner ambulance anvil basketball-backboard basketball-court bicycle big-ben billboard blimp boeing-737 brooklyn-bridge burj-khalifa bus-shelter car car-tire carousel christ-statue cn-tower colosseum double-decker-bus dumpster eiffel-tower empire-state-building excavator exit-sign fighter-jet fire-extinguisher fire-hydrant fire-truck flagpole football-field garbage-truck gateway-arch gold-bar golden-gate-bridge handcuffs helicopter hot-dog-cart house-brick ice-cream-truck jumbotron leaning-tower-of-pisa license-plate locomotive london-eye mailbox manhole-cover minivan motorcycle newspaper-box notre-dame olympic-pool parking-meter phone-booth porta-potty power-line-tower robot school-bus scooter semi-truck shipping-container skateboard soccer-goal space-needle statue-of-liberty stop-sign streetlight sydney-opera-house taj-mahal taxi telephone-pole tower-crane town-fountain traffic-cone traffic-light trash-can unicycle vending-machine washington-monument water-tower`,
  forest: `alligator angel-falls black-bear brown-bear deer gorilla green-anaconda hoover-dam komodo-dragon niagara-falls oak-tree owl panda saltwater-crocodile t-rex`,
  farm: `barn-silo barrel corn-stalk cow horse pig scarecrow teepee tractor`,
  snow: `mount-everest penguin polar-bear snowboard`,
  desert: `cactus elephant giraffe grand-canyon great-pyramid hippopotamus lion moai mount-fuji mount-kilimanjaro ostrich rhinoceros stonehenge zebra`,
  underwater: `barracuda blue-whale dolphin electric-eel giant-squid great-white-shark hammerhead-shark jellyfish killer-whale koi-fish manta-ray mariana-trench octopus pufferfish seahorse stingray swordfish whale-shark`,
  space: `saturn-rocket space-shuttle`,
  enchanted: `castle magic-wand pegasus`,
  tabletop: `aa-battery baseball baseball-bat baseball-cap basketball bowling-ball bowling-pin boxing-glove button chattering-teeth checkers-piece clown-nose convenient-receipt cork cowboy-hat credit-card die domino dvd earbuds earbuds-case fake-mustache foam-finger football football-helmet frisbee game-controller grain-of-rice hairbrush hockey-puck hockey-stick human-eyelash index-card jack-in-the-box key laptop lego-brick letter-block light-bulb lottery-ticket marble paintbrush paperclip pencil penny ping-pong-ball playing-card poker-chip pool-cue poppy-seed quarter retro-cartridge rubber-chicken rubber-duck rubiks-cube scrunchie sesame-seed sheet-of-paper-a4 shuttlecock smartphone sneaker soccer-ball stethoscope tennis-ball tennis-racket toilet-paper-square tooth toy-car vinyl-record volleyball whistle whoopee-cushion wooden-block`,
};
export const SCENERY_BY_OBJECT = Object.create(null);
for (const [scene, words] of Object.entries(OBJECT_GROUPS)) for (const id of words.split(/\s+/)) {
  if (SCENERY_BY_OBJECT[id]) throw new Error('Duplicate scenery assignment: ' + id);
  SCENERY_BY_OBJECT[id] = scene;
}
export function sceneryFor(object) { return SCENERY_BY_OBJECT[object.id] || 'grass'; }

export const SETTINGS = {
  grass: { clouds: true },
  beach: { floor: 'beach', sky: ['#b5d9ee', '#edf6f6'], clouds: true },
  living: { floor: 'hardwood', sky: ['#f2e6d4', '#fff8e9'], wallpaper: 'stripes', artwork: true, layers: ['dust-motes'] },
  kitchen: { floor: 'kitchen', sky: ['#f1e9d7', '#fff9ed'], wallpaper: 'diamonds', artwork: true, layers: ['dust-motes'] },
  tabletop: { floor: 'tabletop', sky: ['#f3e7d2', '#fff8e9'], wallpaper: 'dots', artwork: true },
  city: { floor: 'pavement', sky: ['#111d36', '#354265'], night: true, clouds: true, texture: 'star-field' },
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
  const names = [config.floor, config.texture, config.artwork && 'wall-picture', ...(config.layers || [])].filter(Boolean);
  const images = Object.fromEntries(await Promise.all(names.map(async name => [name, await loadImage(base + name + '.png')])));
  if (config.floor && !images[config.floor]) return { id: 'grass', config: SETTINGS.grass, images: {} };
  const decorSeed = [...object.id].reduce((seed, ch) => (seed * 31 + ch.charCodeAt(0)) >>> 0, 0);
  return { id, config, images, decorSeed };
}

// Repeating wall details share one camera offset; pictures stay attached to the wall.
// Geometry keeps these quiet patterns seamless at every phone width.
export function drawWallpaper(ctx, style, { width, height, shiftY, shiftX, dark }) {
  const tile = style === 'stripes' ? 48 : 56;
  const ox = ((shiftX * .08) % tile + tile) % tile;
  const oy = ((shiftY * .12) % tile + tile) % tile;
  ctx.save();
  ctx.globalAlpha = dark ? .045 : .085;
  ctx.fillStyle = style === 'diamonds' ? '#728e83' : style === 'dots' ? '#a18b70' : '#ae8d78';
  for (let x = ox - tile; x < width; x += tile) {
    if (style === 'stripes') { ctx.fillRect(x, 0, 13, height); continue; }
    for (let y = oy - tile; y < height; y += tile) {
      ctx.beginPath();
      if (style === 'dots') ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      else { ctx.moveTo(x, y - 5); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 5); ctx.lineTo(x - 4, y); ctx.closePath(); }
      ctx.fill();
    }
  }
  ctx.restore();
}

// Image layers follow the climb with the same downward parallax as the original clouds.
export function drawSceneryLayers(ctx, kit, { width, height, shiftY, shiftX, dark, time, reduced }) {
  const { config, images } = kit;
  ctx.save();
  if (config.wallpaper) {
    drawWallpaper(ctx, config.wallpaper, { width, height, shiftY, shiftX, dark });
    // Stable variation per larger object avoids flickering on replay or redraw.
    if (images['wall-picture'] && kit.decorSeed % 3 !== 0) {
      const size = kit.id === 'tabletop' ? 150 : 180;
      const period = height + size;
      const y = ((height * .15 + shiftY * .12) % period + period) % period - size * .3;
      const x = width * (kit.decorSeed % 2 ? .22 : .78) + shiftX * .08;
      ctx.globalAlpha = dark ? .16 : .3;
      ctx.drawImage(images['wall-picture'], x - size / 2, y, size, size);
    }
  }
  if (images[config.texture]) {
    const tile = 360, offsetY = ((shiftY * .12) % tile + tile) % tile;
    const offsetX = ((shiftX * .08) % tile + tile) % tile;
    ctx.globalAlpha = (config.texture === 'star-field' ? (config.night ? .32 : .85) : .14) * (dark && kit.id !== 'space' ? .5 : 1);
    for (let y = offsetY - tile; y < height; y += tile) for (let x = offsetX - tile; x < width; x += tile) ctx.drawImage(images[config.texture], x, y, tile, tile);
  }
  for (const [index, name] of (config.layers || []).entries()) {
    const image = images[name]; if (!image) continue;
    const wisp = ['mist', 'enchanted-mist', 'nebula'].includes(name);
    const size = wisp ? 240 : name === 'bubbles' ? 80 : 140;
    const aspect = image.naturalHeight / image.naturalWidth;
    ctx.globalAlpha = (wisp ? .12 : name === 'bubbles' ? .24 : .22) * (dark ? .65 : 1);
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
  ctx.save();
  if (kit.config.night) ctx.globalAlpha = .65;
  for (let x = offset; x < width; x += tile) ctx.drawImage(image, x, top, tile + 1, tileH);
  ctx.restore();
}
