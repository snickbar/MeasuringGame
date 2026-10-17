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
    'desert-dunes': .72, 'enchanted-grove': .65, 'underwater-seaweed': .44, 'city-skyline': .85 }[name];
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
    const baseH = { 'forest-greenery': 170, 'beach-sunset': 125, 'desert-dunes': 155, 'enchanted-grove': 180, 'city-skyline': 160 }[name];
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
