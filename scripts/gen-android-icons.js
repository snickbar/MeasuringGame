// Regenerates the Android launcher icon mipmaps (legacy + adaptive
// foreground) from icon-512.png. Run this again any time that source image
// changes: `node scripts/gen-android-icons.js`.
const { Jimp } = require("jimp");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "icon-512.png");
const RES = path.join(ROOT, "android", "app", "src", "main", "res");

const DENSITIES = [
  { name: "mdpi", legacy: 48, adaptive: 108 },
  { name: "hdpi", legacy: 72, adaptive: 162 },
  { name: "xhdpi", legacy: 96, adaptive: 216 },
  { name: "xxhdpi", legacy: 144, adaptive: 324 },
  { name: "xxxhdpi", legacy: 192, adaptive: 432 },
];

// Fraction of the adaptive canvas the art should fill, centered - keeps it
// inside Android's "safe zone" so aggressive launcher icon masks (circle,
// squircle, etc.) don't crop the art's own border off.
const SAFE_ZONE_RATIO = 0.65;

(async () => {
  const source = await Jimp.read(SRC);

  for (const d of DENSITIES) {
    const dir = path.join(RES, `mipmap-${d.name}`);

    const legacy = source.clone().resize({ w: d.legacy, h: d.legacy });
    await legacy.write(path.join(dir, "ic_launcher.png"));
    await legacy.clone().write(path.join(dir, "ic_launcher_round.png"));

    const artSize = Math.round(d.adaptive * SAFE_ZONE_RATIO);
    const art = source.clone().resize({ w: artSize, h: artSize });
    const canvas = new Jimp({ width: d.adaptive, height: d.adaptive, color: 0x00000000 });
    const offset = Math.round((d.adaptive - artSize) / 2);
    canvas.composite(art, offset, offset);
    await canvas.write(path.join(dir, "ic_launcher_foreground.png"));

    console.log(d.name, "done");
  }
})();
