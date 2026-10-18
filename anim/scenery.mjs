// Scenery follows the larger object's identity. Measurements never select a biome.
export const OBJECT_GROUPS = {
  grass: `adult-human ant backpack balloon barbecue-grill blade-of-grass bowling-ball bowling-pin bunny-ears capybara chocolate-bunny cockroach coffin confetti conversation-heart cupid cupids-arrow daisy duck easter-basket easter-egg egg-basket firecracker flamingo four-leaf-clover frisbee garden-gnome giant-anthill globe grill-spatula hamster heart hedgehog honeybee hot-air-balloon jelly-bean kangaroo ladybug lawn-flamingo locker long-stem-rose maraca marshmallow-chick mount-kilimanjaro noisemaker park-bench picnic-table pigeon pilgrim-hat pinata plastic-egg pogo-stick porta-potty rabbit school-bell shamrock skeleton snail sparkler stork suitcase sunflower teddy-bear tombstone tulip turtle uncle-sam-hat wind-turbine windmill`,
  beach: `aircraft-carrier beach-ball beach-towel beach-umbrella canoe cooler cruise-ship fishing-boat flip-flop grain-of-sand hammock lemonade-pitcher lighthouse mermaid palm-tree pool-noodle popsicle rowboat sailboat sand-dollar sandcastle seashell starfish sunglasses sunscreen-bottle surfboard titanic umbrella`,
  living: `acoustic-guitar bouquet broom candle clock comb corgi couch crayon dachshund disco-ball domestic-cat door drum-stick fake-mustache folding-chair grand-piano jeans jewelry-box ladder lava-lamp letter-block lunchbox mop necktie pearl-necklace pillow present queen-size-bed retro-cartridge saxophone sneaker toolbox trumpet tv-remote violin yoga-mat`,
  kitchen: `apple baby-bottle bagel baguette banana barstool bathtub beer-bottle blueberry boba-tea breakfast-tray butter-stick casserole-dish cheerio cheese-wheel chicken-nugget chili-pepper chocolate-drop cotton-candy cream-pie cucumber dinner-roll dog-bowl donut drinking-straw egg foot-long-sub french-fry grain-of-rice gummy-bear hamburger hot-dog ice-cream-cone ice-cube ketchup-bottle mashed-potatoes napkin pancakes peanut pineapple pizza-pie pizza-slice plunger pumpkin-pie refrigerator ribs soda-can strawberry stuffing sweet-potato-casserole taco teacup toothbrush toothpaste turkey watermelon wine-bottle`,
  tabletop: `aa-battery boxing-glove button calculator champagne-glass chattering-teeth checkers-piece chocolate chocolate-box clown-nose coffee-mug convenient-receipt cork credit-card die domino dvd earbuds earbuds-case game-controller gold-coin green-beer-mug hairbrush handbag human-eyelash index-card jack-in-the-box key laptop lego-brick light-bulb lottery-ticket marble mothers-day-card notebook paintbrush paperclip pencil pencil-case penny ping-pong-ball playing-card poker-chip pool-cue poppy-seed quarter rubber-chicken rubber-duck rubiks-cube scissors scrunchie sesame-seed sheet-of-paper-a4 smartphone stethoscope toilet-paper-square tooth toy-car valentines-card vinyl-record whiskey-glass whoopee-cushion wine-glass wooden-block`,
  city: `airliner ambulance american-flag anvil bicycle big-ben billboard black-cat boeing-737 brooklyn-bridge burj-khalifa bus-shelter car car-tire carousel central-park christ-statue cn-tower colosseum countdown-sign double-decker-bus dumpster eiffel-tower empire-state-building excavator exit-sign fighter-jet fire-extinguisher fire-hydrant fire-truck fireworks flagpole garbage-truck gateway-arch ghost gold-bar golden-gate-bridge handcuffs helicopter hot-dog-cart house-brick ice-cream-truck kaiju leaning-tower-of-pisa license-plate locomotive london-eye mailbox manhole-cover minivan motorcycle newspaper-box notre-dame novelty-glasses olympic-pool parking-meter party-hat phone-booth power-line-tower robot school-bus scooter semi-truck shipping-container skateboard space-needle statue-of-liberty stop-sign streamer streetlight sydney-opera-house taj-mahal taxi telephone-pole times-square-ball tower-crane town-fountain traffic-cone traffic-light trash-can unicycle vending-machine washington-monument water-tower`,
  forest: `acorn alligator angel-falls bat bigfoot black-bear brown-bear deer dwarf fall-leaf frog gorilla green-anaconda komodo-dragon leprechaun-hat niagara-falls oak-tree owl panda pinecone saltwater-crocodile t-rex werewolf witch-hat`,
  farm: `baby-chick barn-silo barrel candy-corn carrot corn-on-the-cob corn-stalk cornucopia cow horse horseshoe pig pumpkin scarecrow teepee tractor`,
  snow: `candy-cane christmas-stocking christmas-tree cranberry gingerbread-house mistletoe mount-everest penguin polar-bear reindeer santa-hat sleigh snow-globe snowboard yeti`,
  desert: `cactus cowboy-hat elephant giraffe grand-canyon great-pyramid hippopotamus hoover-dam lion moai mount-fuji mummy ostrich rhinoceros sombrero stonehenge zebra`,
  underwater: `barracuda blue-whale dolphin electric-eel fishing-rod giant-squid great-white-shark hammerhead-shark jellyfish killer-whale koi-fish kraken loch-ness-monster manta-ray mariana-trench octopus pufferfish seahorse snorkel-mask stingray swordfish whale-shark`,
  space: `alien flying-saucer saturn-rocket space-shuttle`,
  enchanted: `baby-dragon castle cauldron centaur cyclops fairy goblin leprechaun magic-wand minotaur pegasus phoenix pot-of-gold rainbow shillelagh troll unicorn western-dragon`,
  stadium: `baseball baseball-bat baseball-cap baseball-glove basketball basketball-backboard basketball-court blimp foam-finger football football-field football-helmet golf-ball golf-club hockey-puck hockey-stick jumbotron shuttlecock soccer-ball soccer-goal tennis-ball tennis-racket volleyball whistle`,
};
export const SCENERY_BY_OBJECT = Object.create(null);
for (const [scene, words] of Object.entries(OBJECT_GROUPS)) for (const id of words.split(/\s+/)) {
  if (SCENERY_BY_OBJECT[id]) throw new Error('Duplicate scenery assignment: ' + id);
  SCENERY_BY_OBJECT[id] = scene;
}
export function sceneryFor(object) { return SCENERY_BY_OBJECT[object.id] || 'grass'; }

export const SETTINGS = {
  grass: { clouds: true },
  beach: { floor: 'beach', sky: ['#e3c4cf', '#fae4c4'], backdrop: 'beach-sunset' },
  living: { floor: 'hardwood', sky: ['#f2e6d4', '#fff8e9'], wallpaper: 'lattice', layers: ['dust-motes'] },
  kitchen: { floor: 'kitchen-bw', floorTileWidth: 760, sky: ['#f1ebdf', '#fff9ed'], wallpaper: 'tiles', layers: ['dust-motes'] },
  tabletop: { floor: 'tabletop', sky: ['#e7dfce', '#fff8e9'], wallpaper: 'plaid' },
  city: { floor: 'pavement', sky: ['#111d36', '#354265'], night: true, clouds: true, texture: 'star-field', backdrop: 'city-skyline' },
  forest: { floor: 'forest-floor', sky: ['#b9d2c7', '#e3ede0'], backdrop: 'forest-greenery', layers: ['mist'] },
  farm: { floor: 'farm-floor', sky: ['#c0dbe1', '#edf3e1'], clouds: true, backdrop: 'farm-hay' },
  snow: { floor: 'snow-floor', sky: ['#c2dcea', '#f0f6fb'], clouds: true, layers: ['snowflakes'] },
  desert: { floor: 'desert-floor', sky: ['#b8a1c9', '#d9b1c8', '#efbea9', '#f8dfb7'], backdrop: 'desert-dunes' },
  underwater: { floor: 'seabed', sky: ['#9ecfd3', '#c7e3df'], texture: 'water-light', backdrop: 'underwater-seaweed', layers: ['bubbles'] },
  space: { floor: 'moon-floor', sky: ['#242341', '#383453'], texture: 'star-field', layers: ['nebula'] },
  enchanted: { sky: ['#c8badf', '#efe2f2'], backdrop: 'enchanted-grove', layers: ['enchanted-mist', 'magic-motes'] },
  stadium: { floor: 'stadium-turf', floorTileWidth:760, sky:['#b9d9e8','#e9f2ec'], backdrop:'stadium-stands' },
};
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
  const id = sceneryFor(object), config = SETTINGS[id];
  const names = [config.floor, config.texture, config.backdrop, ...(config.layers || [])].filter(Boolean);
  const images = Object.fromEntries(await Promise.all(names.map(async name => [name, await loadImage(base + name + '.png')])));
  if (config.floor && !images[config.floor]) return { id: 'grass', config: SETTINGS.grass, images: {} };
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
  const name = kit.config.backdrop, image = kit.images[name]; if (!image) return;
  const bounds = visibleBounds(image), base = (floorY ?? height - 40) - 4 * groundScale + shiftY;
  const alpha = { 'forest-greenery': .64, 'beach-sunset': .72, 'farm-hay': 1,
    'desert-dunes': .72, 'enchanted-grove': .65, 'underwater-seaweed': .44, 'city-skyline': .85, 'stadium-stands': .75 }[name];
  ctx.save(); ctx.globalAlpha = alpha * (dark && name !== 'farm-hay' ? .45 : 1);
  if (dark && name === 'farm-hay') ctx.filter = 'brightness(55%)';
  if (name === 'farm-hay' || name === 'underwater-seaweed') {
    const h = (name === 'farm-hay' ? 58 : 95) * groundScale;
    const w = h * bounds[2] / bounds[3];
    for (const [i, fraction] of [.14, .88].entries()) {
      const scale = i ? .8 : 1, x = anchorX + (width * fraction - anchorX) * groundScale - shiftX;
      ctx.drawImage(image, ...bounds, x - w * scale / 2, base - h * scale, w * scale, h * scale);
    }
  } else {
    const baseH = { 'forest-greenery': 170, 'beach-sunset': 125, 'desert-dunes': 155, 'enchanted-grove': 180, 'city-skyline': 160, 'stadium-stands':300 }[name];
    const h = baseH * groundScale, w = Math.max(width + 100, baseH * bounds[2] / bounds[3]) * groundScale;
    const center = anchorX + (width / 2 - anchorX) * groundScale - shiftX;
    ctx.drawImage(image, ...bounds, center - w / 2, base - h, w, h);
  }
  ctx.restore();
}

// Atmospheric layers follow the climb with the original cloud parallax.
export function drawSceneryLayers(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, time, reduced, groundScale = 1, anchorX = width / 2, pass = 'all' }) {
  const { config, images } = kit;
  ctx.save();
  if (pass !== 'foreground' && config.wallpaper) {
    drawWallpaper(ctx, config.wallpaper, { width, height, shiftY, shiftX, dark });
  }
  if (pass !== 'foreground' && images[config.texture]) {
    const tile = 360, offsetY = ((shiftY * .12) % tile + tile) % tile;
    const offsetX = ((shiftX * .08) % tile + tile) % tile;
    ctx.globalAlpha = (config.texture === 'star-field' ? (config.night ? .32 : .85) : .14) * (dark && kit.id !== 'space' ? .5 : 1);
    for (let y = offsetY - tile; y < height; y += tile) for (let x = offsetX - tile; x < width; x += tile) ctx.drawImage(images[config.texture], x, y, tile, tile);
  }
  // Sky textures stay behind clouds; rooted scenery and atmosphere are painted after them.
  if (pass === 'background') { ctx.restore(); return; }
  drawBackdrop(ctx, kit, { width, height, shiftY, shiftX, floorY, dark, groundScale, anchorX });
  for (const [index, name] of (config.layers || []).entries()) {
    const image = images[name]; if (!image) continue;
    const wisp = ['mist', 'enchanted-mist', 'nebula'].includes(name);
    const size = wisp ? Math.min(340, width * .9) : name === 'bubbles' ? 110 : name === 'snowflakes' ? 170 : 140;
    const aspect = image.naturalHeight / image.naturalWidth;
    ctx.globalAlpha = (name === 'mist' ? .45 : name === 'enchanted-mist' ? .38 : wisp ? .12 :
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
  ctx.restore();
}

export function drawSceneryFloor(ctx, kit, meta, { width, height, floorY, shiftX, groundScale = 1, anchorX = width / 2 }) {
  const image = kit.images[kit.config.floor]; if (!image) return;
  const tile = (kit.config.floorTileWidth || 380) * groundScale, tileH = tile * image.naturalHeight / image.naturalWidth;
  // The measured baseline is inside the solid surface, not perched on its upper edge.
  // Moss needs more depth so feet meet brown soil rather than the green rim.
  const inset = (kit.config.floor === 'forest-floor' ? 20 : 14) * groundScale;
  const top = floorY - tileH * meta.surface - inset;
  if (top >= height || top + tileH <= 0) return;
  const phase = shiftX + anchorX * (1 - groundScale);
  const offset = ((phase % tile) + tile) % tile - tile;
  ctx.save();
  if (kit.config.night) ctx.filter = 'brightness(65%)';
  for (let x = offset; x < width; x += tile) ctx.drawImage(image, x, top, tile + 1, tileH);
  ctx.restore();
}
