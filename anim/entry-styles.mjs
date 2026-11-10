// How an object travels along the ground on its way in. Pure functions of time, so seeking, skipping and late joins
// draw the same frame. Visual choices only: none of these change measurements, counts or arrival times.
//
// entryPose(kind, u, {thick, dist, dir}) says where one object is, u running 0..1 over its trip:
//   p     how much of the trip is done (0..1). The object is at start + (end - start) * p.
//   lift  pixels above the ground
//   rot   radians, clockwise positive (already flipped for dir)
//   sx,sy squash and stretch about the feet
// Every style ends exactly at rest: p 1, lift 0, rot a whole turn, sx = sy = 1.
//
// The first five kinds are the original ones and look exactly as they always did.

export const ENTRY_KINDS = ['slide', 'walk', 'drive', 'fly', 'sail', 'roll', 'bounce', 'scoot', 'waddle', 'skitter', 'skid', 'flap', 'tumble', 'swim'];

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const smooth = (x) => x * x * (3 - 2 * x);
const TAU = Math.PI * 2;
const tail = (u) => clamp((1 - u) * 5, 0, 1);   // eases a wobble out over the last fifth of the trip

const REST = { p: 1, lift: 0, rot: 0, sx: 1, sy: 1 };

// The original lift, in pixels above the ground. Kept as it was so existing objects do not change.
function legacyLift(kind, u, thick, dist) {
  const env = tail(u);
  if (kind === 'walk') {
    const amp = clamp(thick * 0.05 + 2, 3, 9);
    const cycles = clamp(Math.round(dist / (thick + 30) * 1.5), 3, 14);
    return amp * Math.abs(Math.sin(Math.PI * cycles * u)) * env;
  }
  if (kind === 'drive') return 1.3 * Math.abs(Math.sin(Math.PI * 30 * u)) * env;
  if (kind === 'fly') return 12 * Math.sin(Math.PI * u) * (0.8 + 0.2 * Math.sin(Math.PI * 8 * u));
  if (kind === 'sail') return 2 * Math.abs(Math.sin(Math.PI * 4 * u)) * env;
  return 10 * Math.abs(Math.sin(Math.PI * 3 * u)) * env;
}

export function entryPose(kind, uIn, { thick = 40, dist = 200, dir = 1 } = {}) {
  const u = clamp(uIn, 0, 1);
  if (u >= 1) return { ...REST };
  const ease2 = 1 - (1 - u) * (1 - u);
  switch (kind) {
    case 'roll': {
      const p = 1 - Math.pow(1 - u, 1.8);
      // A whole number of turns, so it comes to rest the right way up.
      const turns = Math.max(1, Math.round(dist / (Math.PI * Math.max(8, thick))));
      return { p, lift: 0, rot: dir * TAU * turns * p, sx: 1, sy: 1 };
    }
    case 'bounce': {
      const amp = clamp(thick * 0.95, 8, 56);
      const lift = amp * Math.abs(Math.sin(Math.PI * 3.5 * u)) * Math.pow(1 - u, 1.1);
      const sq = lift < 5 ? 1 - lift / 5 : 0;
      return { p: Math.pow(u, 0.9), lift, rot: 0, sx: 1 + 0.25 * sq, sy: 1 - 0.22 * sq };
    }
    case 'scoot': {
      const v = u * 5, k = Math.min(4, Math.floor(v)), f = v - k;
      let sx, sy;
      if (f < 0.35) { const s = Math.sin(Math.PI * f / 0.35); sx = 1 + 0.22 * s; sy = 1 - 0.24 * s; }
      else { const s = Math.sin(Math.PI * (f - 0.35) / 0.65); sx = 1 + 0.2 * s; sy = 1 - 0.15 * s; }
      return { p: (k + smooth(clamp((f - 0.35) / 0.65, 0, 1))) / 5, lift: 0, rot: 0, sx, sy };
    }
    case 'waddle': {
      const e = clamp((1 - u) * 4, 0, 1);
      return { p: 1 - Math.pow(1 - u, 1.4), lift: clamp(thick * 0.07, 2, 6) * Math.abs(Math.sin(Math.PI * 8 * u)) * e, rot: 0.2 * Math.sin(Math.PI * 8 * u) * e, sx: 1, sy: 1 };
    }
    case 'skitter': {
      const v = u * 4, k = Math.min(3, Math.floor(v)), f = v - k, burst = f < 0.55;
      return { p: (k + (burst ? smooth(f / 0.55) : 1)) / 4, lift: burst ? clamp(thick * 0.05, 1.5, 4) * Math.abs(Math.sin(Math.PI * f / 0.55 * 6)) : 0, rot: burst ? 0 : 0.05 * Math.sin(f * 55) * (1 - u), sx: 1, sy: 1 };
    }
    case 'skid': {
      return { p: 1 - Math.pow(1 - u, 4), lift: 0, rot: dir * 0.07 * Math.sin(Math.PI * clamp((u - 0.5) / 0.5, 0, 1)), sx: 1, sy: 1 };
    }
    case 'flap': {
      const amp = clamp(thick * 0.3, 5, 24);
      return { p: smooth(u), lift: (amp * 0.6 + amp * 0.35 * Math.sin(TAU * 3 * u)) * (1 - Math.pow(u, 4)), rot: -0.08 * Math.cos(TAU * 3 * u) * (1 - u), sx: 1, sy: 1 + 0.09 * Math.sin(TAU * u * 26) * (1 - u) };
    }
    case 'tumble': {
      const v = u * 4, k = Math.min(3, Math.floor(v)), f = v - k;
      return { p: (k + smooth(f)) / 4, lift: clamp(thick * 0.28, 5, 20) * Math.sin(Math.PI * f), rot: dir * (k + smooth(f)) * Math.PI / 2, sx: 1, sy: 1 };
    }
    case 'swim': {
      // A glide with a rolling bob and a little nose-pitch, like something moving through water.
      const e = tail(u), amp = clamp(thick * 0.18, 3, 14);
      return { p: 1 - Math.pow(1 - u, 1.6), lift: amp * (0.5 + 0.5 * Math.sin(TAU * 2.5 * u - Math.PI / 2)) * e, rot: dir * 0.1 * Math.sin(TAU * 2.5 * u) * e, sx: 1 + 0.04 * Math.sin(TAU * 6 * u) * e, sy: 1 - 0.04 * Math.sin(TAU * 6 * u) * e };
    }
    default:
      // slide, walk, drive, fly, sail: the original movement.
      return { p: ease2, lift: legacyLift(kind, u, thick, dist), rot: 0, sx: 1, sy: 1 };
  }
}

// ---- Choosing a style for an object, automatically ----

// Looked up in this order; the first match wins. Plain object ids.
const RULES = [
  ['swim', /^(goldfish|clownfish|shrimp|tropical-fish|koi-fish|pufferfish|jellyfish|octopus|sea-turtle|dolphin|swordfish|barracuda|stingray|manta-ray|hammerhead-shark|great-white-shark|whale-shark|killer-whale|blue-whale|giant-squid|electric-eel|seahorse|submarine)$/],
  ['skitter', /^(ant|cockroach|ladybug|mouse|crab|lobster|squirrel|meerkat|ferret|raccoon|hedgehog|hamster|guinea-pig)$/],
  ['flap', /^(honeybee|dragonfly|songbird|parrot|toucan|seagull|hawk|stork|feather|drone|pegasus|shuttlecock)$/],
  ['roll', /^(marble|cherry|blueberry|cheerio|penny|quarter|poker-chip|checkers-piece|vinyl-record|dvd|frisbee|car-tire|manhole-cover|cheese-wheel|watermelon|apple|donut|bagel|barrel|bowling-ball|soccer-ball|boulder|meteorite|asteroid|tumbleweed|tape-measure|pineapple|egg|acorn|button|golf-ball|sand-dollar|pizza-pie|dog-bowl|coiled-garden-hose|grain-of-sand|poppy-seed|sesame-seed|peanut|pinecone|hockey-puck)$/],
  ['bounce', /^(basketball|volleyball|tennis-ball|ping-pong-ball|baseball|football|rubber-duck|rubber-chicken|jack-in-the-box|pogo-stick|kangaroo|rabbit|frog|clown-nose|toy-jack|pool-noodle)$/],
  ['scoot', /^(pillow|mashed-potatoes|cupcake|cream-pie|pancakes|cotton-candy|chocolate-drop|gummy-bear|sushi-piece|snail|sloth|whoopee-cushion|beach-towel|scrunchie|sock|jeans|yoga-mat|starfish|oyster|fishbowl|cobra|green-anaconda|tortoise|turtle|red-spotted-mushroom|cheese-wedge|pizza-slice|hot-dog|foot-long-sub|french-fry|baguette|soft-pretzel|banana|cucumber|strawberry|chicken-nugget|giant-anthill|toothpaste|sponge|water-drop|snowflake|icicle|ice-cream-cone|boba-tea|baby-bottle)$/],
  ['waddle', /^(penguin|duck|puffin|pig|hippopotamus|walrus|seal|rooster|wild-turkey|panda|koala|capybara|pigeon|owl|robot|scarecrow|piggy-bank|fire-hydrant|mailbox|trash-can|traffic-cone|bowling-pin|moai|barstool|parking-meter|stop-sign|vending-machine|phone-booth|porta-potty|newspaper-box|lawn-flamingo|dumpster|cactus|snowman|sunflower|daisy|long-stem-rose|dandelion|red-panda)$/],
  ['skid', /^(toy-car|scooter|skateboard|motorcycle|snowboard|surfboard|wheelbarrow|hot-dog-cart|unicycle|bicycle|taxi|car|minivan|ice-cream-truck|ambulance|tractor|monster-truck|bulldozer|tank)$/],
  ['tumble', /^(die|lego-brick|letter-block|wooden-block|domino|rubiks-cube|ice-cube|gold-bar|house-brick|butter-stick|retro-cartridge|earbuds-case|smartphone|game-controller|tv-remote|laptop|toaster|microwave|stapler|camera|boombox|typewriter|rotary-phone|credit-card|playing-card|index-card|license-plate|sheet-of-paper-a4|lottery-ticket|toilet-paper-square|tooth|key|whiskey-glass|teacup|beaker|light-bulb|exit-sign|anvil|gold-bar|shipping-container|refrigerator|couch|queen-size-bed|piano|grand-piano|bathtub|park-bench|picnic-table|folding-chair)$/],
  ['walk', /^(tiger|cheetah|camel|monkey|wolf|fox|moose|bison|otter|llama|pony|sheep|goat|donkey|deer|horse|cow|zebra|brown-bear|black-bear|polar-bear|lion|gorilla|rhinoceros|giraffe|t-rex|komodo-dragon|alligator|saltwater-crocodile|corgi|dachshund|domestic-cat|elephant|adult-human|ostrich|peacock|flamingo|tortoise|capybara)$/],
];

// Old hand-picked entries that were stand-ins for something better: a seahorse or stingray "flew" because there was no swim.
const REPLACES = { seahorse: 'swim', stingray: 'swim', submarine: 'swim', honeybee: 'flap', ant: 'skitter', cockroach: 'skitter', ladybug: 'skitter', mouse: 'skitter' };

// Large structures glide in as they always did.
const STRUCTURE_MM = 2000;
const FILL = ['bounce', 'waddle', 'scoot', 'slide'];

function hash(text) { let h = 0; for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0; return h; }

// saved is the style the page already chose by hand, if any (its table). Returns one of ENTRY_KINDS.
// lean is true for an object that comes in lying down and swings up to stand: it cannot also spin or tip over, so
// those two styles give way to ones that keep it flat.
export function entryKindFor(object, saved, lean = false) {
  const kind = pickKind(object, saved);
  if (lean && kind === 'roll') return 'scoot';
  if (lean && kind === 'tumble') return 'skid';
  return kind;
}

function pickKind(object, saved) {
  const id = object?.id || '';
  const mm = Number(object?.mm) || 0;
  if (REPLACES[id]) return REPLACES[id];
  if (saved && saved !== 'slide') return saved;                      // a deliberate choice stays
  if (saved === 'slide' && mm >= STRUCTURE_MM) return 'slide';       // a building or landmark: it glides
  for (const [kind, re] of RULES) if (re.test(id)) return kind;
  if (mm >= STRUCTURE_MM) return 'slide';
  return FILL[hash(id) % FILL.length];
}

// ---- Landing effects: what puffs out when an object lands on the stack (only the first few landings get one) ----
export const LANDING_EFFECTS = ['stars', 'dust', 'sparkle', 'confetti', 'splash', 'hearts'];

const SHINY = /^(gold-bar|penny|quarter|poker-chip|whiskey-glass|wine-glass|wristwatch|light-bulb|key|trophy|diving-helmet|beaker|fishbowl|snowflake|ice-cube|marble|vinyl-record|dvd|handcuffs|tuba|trumpet|saxophone|flute|stethoscope)$/;
const TREAT = /^(cupcake|donut|ice-cream-cone|pizza-slice|pizza-pie|cotton-candy|gummy-bear|chocolate-drop|cream-pie|pancakes|bagel|cherry|strawberry|jack-in-the-box|whoopee-cushion|clown-nose|fake-mustache|hot-dog|french-fry|soft-pretzel|chicken-nugget|sushi-piece|cheerio|dinner-roll|birthday-cake|party-hat|balloon)$/;
const CUTE = /^(hamster|rabbit|panda|penguin|domestic-cat|corgi|dachshund|duck|rubber-duck|koala|sloth|capybara|pig|hedgehog|guinea-pig|otter|red-panda|puffin|owl|kangaroo|llama|sheep|goat|pony|meerkat|squirrel|ferret|raccoon|mouse|frog|ladybug|honeybee|songbird|piggy-bank|lawn-flamingo)$/;
const WET = /^(water-drop|boba-tea|baby-bottle|teacup|soda-can|beer-bottle|wine-bottle|toothpaste|oyster|sand-dollar|crab|lobster)$/;
const HEAVY = /^(anvil|bathtub|couch|refrigerator|queen-size-bed|grand-piano|gold-bar-stack|boulder|manhole-cover|car-tire|shipping-container|dumpster|vending-machine|barrel|cheese-wheel|bowling-ball)$/;

export function landingEffectFor(object, kind) {
  const id = object?.id || '';
  const mm = Number(object?.mm) || 0;
  if (SHINY.test(id)) return 'sparkle';
  if (TREAT.test(id)) return 'confetti';
  if (kind === 'swim' || WET.test(id)) return 'splash';
  if (CUTE.test(id)) return 'hearts';
  if (HEAVY.test(id) || mm >= 1500 && !['walk', 'flap'].includes(kind)) return 'dust';
  return 'stars';
}
