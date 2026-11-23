"""Cuts the drive-in, food-truck and diner scene art (art-source/new-scenes-2026-11-22) into anim/scenery/*.webp."""
import pathlib, sys
import numpy as np
from PIL import Image
root = pathlib.Path(__file__).resolve().parent.parent
src = root / "art-source/new-scenes-2026-11-22"
out = root / "anim/scenery"
sys.path.insert(0, str(root / "scripts"))
import importlib.util
spec = importlib.util.spec_from_file_location("cut", root / "scripts/cut-highlow-sheets.py")
# reuse key_out without running that script's cutting code
code = open(root / "scripts/cut-highlow-sheets.py").read().split("def cells")[0]
ns = {"__file__": str(root / "scripts/cut-highlow-sheets.py")}; exec(code, ns); key_out = ns["key_out"]
def save(im, name, q=80):
    p = out / (name + ".webp"); im.save(p, quality=q, method=6); print(name, im.size, p.stat().st_size // 1024, "KB")
def fit_w(im, w):
    if im.width <= w: return im
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
def seamless(im, o):
    a = np.array(im.convert("RGB")).astype(float); h, w, _ = a.shape
    res = a[:, : w - o].copy(); t = (np.arange(o) / o)[None, :, None]
    res[:, :o] = a[:, w - o:] * (1 - t) + a[:, :o] * t
    return Image.fromarray(res.astype("uint8"))
def trim(im, pad=4):
    bb = im.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
    im = im.crop(bb)
    c = Image.new("RGBA", (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0)); c.alpha_composite(im, (pad, pad)); return c
def decontaminate(t, name):
    """Soft glows and shadows drawn over magenta come out pink/purple. Rebuild them as real transparency."""
    a = np.array(t).astype(float); r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    pink = (np.minimum(r, b) - g) > (12 if "steam" in name else 50)
    if "steam" in name or "head" in name:
        k = np.clip(g / 255, 0, 1); a[..., 3] = np.where(pink, al * k, al)
        for i, v in enumerate((255, 242, 214)): a[..., i] = np.where(pink, v, a[..., i])
    elif "tail" in name:
        k = np.clip(1 - b / 255, 0, 1); a[..., 3] = np.where(pink, al * k, al)
        for i, v in enumerate((255, 50, 36)): a[..., i] = np.where(pink, v, a[..., i])
    elif "car" in name:
        sh = pink & (np.maximum(r, b) < 215)
        if name.split("-")[-1].isdigit() and int(name.split("-")[-1]) >= 6:   # the second set has purple bodies: only the soft shadow under the car goes
            sh = ((np.minimum(r, b) - g) > 95) & (np.abs(r - b) < 70) & (np.arange(a.shape[0])[:, None] > a.shape[0] * (.9 if name.endswith('-6') else .55)); a[..., 3] = np.where(sh, al * 0.4, al)
        for i in range(3): a[..., i] = np.where(sh, 10, a[..., i])
    return Image.fromarray(a.clip(0, 255).astype("uint8"), "RGBA")
def sheet(file, cols, rows, names, maxside=420):
    im = key_out(Image.open(src / file)); w, h = im.size; cw, ch = w / cols, h / rows
    for i, n in enumerate(names):
        r, c = divmod(i, cols)
        tile = im.crop((round(c * cw), round(r * ch), round((c + 1) * cw), round((r + 1) * ch)))
        t = decontaminate(trim(tile), n); s = maxside / max(t.size)
        if s < 1: t = t.resize((round(t.width * s), round(t.height * s)), Image.LANCZOS)
        save(t, n)
def frames(file, names, w=480):
    im = Image.open(src / file).convert("RGB"); W, H = im.size
    a = np.array(im).astype(int); mag = (np.abs(a - [255, 0, 255]).sum(axis=2) < 120)
    # gutters are magenta lines: find the rows/cols that are mostly magenta
    colm = mag.mean(axis=0) > .6; rowm = mag.mean(axis=1) > .6
    def spans(m):
        res = []; s = None
        for i, v in enumerate(m):
            if not v and s is None: s = i
            if v and s is not None:
                if i - s > 60: res.append((s, i))
                s = None
        if s is not None and len(m) - s > 60: res.append((s, len(m)))
        return res
    cs, rs = spans(colm), spans(rowm); print("frames cols", cs, "rows", rs)
    k = 0
    for r in rs:
        for c in cs:
            if k < len(names):
                f = im.crop((c[0] + 2, r[0] + 2, c[1] - 2, r[1] - 2)); save(fit_w(f, w), names[k]); k += 1
def apron_fade(im, from_row=.72, bottom=.18, side=.08):
    """Soften the gravel or grass apron around a building so it melts into the lot instead of ending in a hard box."""
    a = np.array(im).astype(float); h, w = a.shape[:2]
    y = np.arange(h)[:, None] / h; x = np.arange(w)[None, :] / w
    fade_b = np.clip((1 - y) / bottom, 0, 1)                                  # bottom rows fade out
    fade_s = np.clip(np.minimum(x, 1 - x) / side, 0, 1)                        # side edges fade, only in the apron zone
    zone = np.clip((y - from_row) / .06, 0, 1)
    a[..., 3] *= np.minimum(1, fade_b + (1 - zone)) * (1 - zone + zone * fade_s)
    return Image.fromarray(a.clip(0, 255).astype("uint8"), "RGBA")
def tall(file, name, key, w=900, apron=False):
    im = Image.open(src / file)
    im = key_out(im) if key else im.convert("RGB")
    if apron: im = apron_fade(im)
    save(fit_w(im, w), name)
def sky_cut(file, name, w=900, tol=11, feather=14):
    """A backdrop whose plain sky is removed (transparent) so the scene's own stars, clouds and fireflies show behind the skyline."""
    from PIL import ImageFilter
    im = Image.open(src / file).convert("RGB"); a = np.array(im).astype(int); h, wd, _ = a.shape
    sky = np.zeros((h, wd), bool); live = np.ones(wd, bool)
    for y in range(1, h):
        d = np.abs(a[y] - a[y - 1]).sum(axis=1)
        live &= d < tol
        sky[y] = live
    sky[0] = True
    m = Image.fromarray(np.where(sky, 0, 255).astype("uint8")).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    out_im = im.convert("RGBA"); out_im.putalpha(m)
    # fade the skyline a little so no hard sky-coloured fringe shows
    bb = out_im.getchannel("A").getbbox(); out_im = out_im.crop((0, max(0, bb[1] - 4), wd, h))
    save(fit_w(out_im, w), name)
def ground(file, name, w=1500):
    im = Image.open(src / file).convert("RGB"); im = seamless(im, round(im.width * .08)); save(fit_w(im, w), name)
def melt_bottom(name, color, frac=.13):
    """Darken the bottom of a backdrop toward the colour at the top of the floor picture, so the two meet without a seam."""
    f = out / (name + ".webp"); a = np.array(Image.open(f).convert("RGBA")).astype(float); h = a.shape[0]
    t = np.clip((np.arange(h) / h - (1 - frac)) / frac, 0, 1)[:, None, None] ** 1.4
    a[..., :3] = a[..., :3] * (1 - t) + np.array(color) * t
    Image.fromarray(a.clip(0, 255).astype("uint8"), "RGBA").save(f, quality=85, method=6)
ONLY = sys.argv[1:]
if not ONLY:
  pass
  # --- drive-in
  ground("drivein-01-ground.png", "drivein-ground")
  sheet("drivein-02-cars.png", 3, 2, [f"drivein-car-{i}" for i in range(6)])
  tall("drivein-03-screen.png", "drivein-screen", True)
  tall("drivein-04-snack-stand.png", "drivein-snack-stand", True, apron=True)
  sky_cut("drivein-05-backdrop.png", "drivein-backdrop")
  frames("drivein-06-movie-frames.png", [f"drivein-movie-{i}" for i in range(6)])
  sheet("drivein-07-snack-animation.png", 4, 2, ["drivein-neon-on", "drivein-neon-off", "drivein-bulbs-a", "drivein-bulbs-b", "drivein-pop-0", "drivein-pop-1", "drivein-pop-2", "drivein-window-glow"], 300)
  # --- food trucks
  ground("foodtrucks-01-ground.png", "foodtruck-ground")
  for f, n in (("foodtrucks-02-left-trucks.png", "foodtruck-left"), ("foodtrucks-03-right-trucks.png", "foodtruck-right")):   # the sidewalk melts into the lawn instead of ending in a hard edge
      save(fit_w(apron_fade(key_out(Image.open(src / f)), .82, .2, .001), 900), n)
  tall("foodtrucks-04-backdrop.png", "foodtruck-backdrop", False)
  sheet("foodtrucks-05-park-props.png", 4, 2, ["foodtruck-bench", "foodtruck-lamppost", "foodtruck-bins", "foodtruck-hydrant", "foodtruck-picnic", "foodtruck-cafe", "foodtruck-menu-sign", "foodtruck-planter"], 300)
  sheet("foodtrucks-06-street-carts.png", 4, 2, ["foodtruck-cart-pretzel", "foodtruck-cart-hotdog", "foodtruck-cart-lemonade", "foodtruck-cart-nuts", "foodtruck-cart-icecream", "foodtruck-balloons", "foodtruck-cart-shaved", "foodtruck-cart-popcorn"], 300)
  sheet("foodtrucks-07-animation.png", 4, 2, ["foodtruck-steam-0", "foodtruck-steam-1", "foodtruck-steam-2", "foodtruck-lights-a", "foodtruck-lights-b", "foodtruck-bunting-a", "foodtruck-bunting-b", "foodtruck-open"], 300)
  # --- diner
  ground("diner-01-ground.png", "diner-ground")
  tall("diner-02-building.png", "diner-building", True, apron=True)
  sheet("diner-03-roadside-props.png", 4, 2, ["diner-pole-sign", "diner-pumps", "diner-phone-booth", "diner-news-boxes", "diner-soda-machine", "diner-barrel", "diner-bench", "diner-lamp"], 300)
  sheet("diner-04-vehicles.png", 3, 2, ["diner-car-wagon", "diner-car-pickup", "diner-car-convertible", "diner-car-van", "diner-car-sidecar", "diner-car-rig"], 400)
  sky_cut("diner-05-highway.png", "diner-highway"); melt_bottom("diner-highway", (47, 34, 55))
  tall("diner-06-backdrop.png", "diner-backdrop", False)
  sheet("diner-07-animation.png", 4, 2, ["diner-sign-on", "diner-sign-off", "diner-open-on", "diner-open-off", "diner-head-0", "diner-head-1", "diner-tail", "diner-steam"], 300)

# --- drive-in props, more cars and light pieces (second round)
src = root / "art-source/drivein-props-2026-11-22"
sheet("drivein-props.png", 4, 2, ["drivein-prop-speaker", "drivein-prop-lamp", "drivein-prop-ticket", "drivein-prop-arch", "drivein-prop-fence", "drivein-prop-bin", "drivein-prop-sign", "drivein-prop-bulbpole"], 420)
sheet("drivein-cars-2.png", 3, 2, [f"drivein-car-{i}" for i in range(6, 12)])
sheet("drivein-lights.png", 4, 2, ["drivein-lights-a", "drivein-lights-b", "drivein-arch-on", "drivein-arch-off", "drivein-booth-bright", "drivein-booth-dim", "drivein-tail-bright", "drivein-tail-dim"], 520)
