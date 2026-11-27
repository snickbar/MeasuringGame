"""Draws the pin badges for the Avatars achievements into icons/badges/ (hexagon pin, bronze/silver/gold rim, small stars = tier).
Ladders: rising-star, maxed-out, style-icon, point-collector, aura-collector (one file per tier, -i ... -v).
Single badges: pin-full-look, pin-mirror-mirror, pin-lucky-star.
Run: python3 scripts/make-avatar-badge-art.py   (needs playwright + Pillow). Wired in index.html (BADGE_LADDER_ART / BADGE_SINGLE_ART)."""
import io, math, pathlib
from PIL import Image
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parent.parent
dst = root / "icons" / "badges"
INK = "#4a2f1c"
RIMS = {"bronze": ("#e0a06a", "#b8723a"), "silver": ("#d4d9ea", "#9aa4c2"), "gold": ("#ffdc4f", "#e0a91c")}
ROMAN = ["i", "ii", "iii", "iv", "v"]

def star(cx, cy, ro, ri, fill="#ffd23f", rot=-90, sw=3.2):
    pts = []
    for i in range(10):
        r = ro if i % 2 == 0 else ri
        a = math.radians(rot + i * 36)
        pts.append(f"{cx + math.cos(a) * r:.1f},{cy + math.sin(a) * r:.1f}")
    return f'<polygon points="{" ".join(pts)}" fill="{fill}" stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round"/>'

def sparkle(cx, cy, r, fill="#fff7c2"):
    return (f'<path d="M{cx},{cy - r} Q{cx + r * .18},{cy - r * .18} {cx + r},{cy} Q{cx + r * .18},{cy + r * .18} {cx},{cy + r} '
            f'Q{cx - r * .18},{cy + r * .18} {cx - r},{cy} Q{cx - r * .18},{cy - r * .18} {cx},{cy - r}Z" fill="{fill}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>')

def face(cx, cy, r, fill="#ffd23f"):
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{INK}" stroke-width="3.4"/>'
            f'<circle cx="{cx - r * .36}" cy="{cy - r * .12}" r="{r * .1}" fill="{INK}"/><circle cx="{cx + r * .36}" cy="{cy - r * .12}" r="{r * .1}" fill="{INK}"/>'
            f'<path d="M{cx - r * .42},{cy + r * .26} Q{cx},{cy + r * .66} {cx + r * .42},{cy + r * .26}" fill="none" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>')

def art_rising_star():
    return ('<path d="M64 20 L86 46 L73 46 L73 78 L55 78 L55 46 L42 46 Z" fill="#6fcf5a" stroke="%s" stroke-width="3.4" stroke-linejoin="round"/>' % INK
            + star(64, 52, 24, 10.5) + sparkle(94, 34, 8) + sparkle(34, 62, 6))

def art_maxed_out():
    cols = ["#9ad0f0", "#7fc3e8", "#6fcf5a", "#ffb84d", "#ff8a4d", "#ffd23f"]
    bars = ""
    for i, c in enumerate(cols):
        h = 12 + i * 8
        bars += f'<rect x="{27 + i * 12}" y="{86 - h}" width="10" height="{h}" rx="3" fill="{c}" stroke="{INK}" stroke-width="3"/>'
    return bars + star(88, 28, 14, 6.2)

def art_style_icon():
    dots = [("#ff5a5a", 46, 46), ("#4fb0e0", 66, 38), ("#6fcf5a", 86, 48), ("#ffd23f", 40, 68)]
    d = "".join(f'<circle cx="{x}" cy="{y}" r="7.5" fill="{c}" stroke="{INK}" stroke-width="2.6"/>' for c, x, y in dots)
    return ('<path d="M64 24 C94 22 108 44 104 64 C100 80 84 76 80 84 C76 94 64 98 52 92 C30 84 22 62 30 44 C37 30 50 25 64 24 Z" fill="#f6d9a0" stroke="%s" stroke-width="3.6" stroke-linejoin="round"/>' % INK
            + d + f'<ellipse cx="72" cy="72" rx="7" ry="6" fill="#fff3d6" stroke="{INK}" stroke-width="2.6"/>')

def art_point_collector():
    def coin(cx, cy, top=False):
        s = (f'<path d="M{cx - 26},{cy} v10 a26,10 0 0 0 52,0 v-10Z" fill="#e0a91c" stroke="{INK}" stroke-width="3.2" stroke-linejoin="round"/>'
             f'<ellipse cx="{cx}" cy="{cy}" rx="26" ry="10" fill="#ffd23f" stroke="{INK}" stroke-width="3.2"/>')
        if top: s += f'<text x="{cx}" y="{cy + 5}" text-anchor="middle" font-family="Fredoka, Arial Rounded MT Bold, Arial, sans-serif" font-weight="800" font-size="14" fill="{INK}">AP</text>'
        return s
    return coin(64, 78) + coin(64, 62) + coin(64, 46, True) + sparkle(98, 36, 8) + sparkle(30, 44, 6)

def art_aura_collector():
    rings = ('<circle cx="64" cy="58" r="33" fill="none" stroke="#c9a6ff" stroke-width="5" stroke-dasharray="3 7" stroke-linecap="round"/>'
             '<circle cx="64" cy="58" r="26" fill="#ffe9f6" stroke="#f26fa0" stroke-width="3.2"/>')
    return rings + face(64, 58, 17) + sparkle(98, 32, 8) + sparkle(30, 80, 7) + sparkle(98, 82, 5)

def art_full_look():
    rays = "".join(f'<line x1="64" y1="58" x2="{64 + math.cos(math.radians(a)) * 38:.1f}" y2="{58 + math.sin(math.radians(a)) * 38:.1f}" stroke="#ffb84d" stroke-width="4" stroke-linecap="round" opacity=".85"/>' for a in range(0, 360, 30))
    return (rays + f'<circle cx="64" cy="58" r="25" fill="#7fc3e8" stroke="{INK}" stroke-width="3.6"/>' + face(64, 58, 19, "#ffd23f")
            + star(88, 78, 11, 5, "#ff5a8a", sw=2.8) + sparkle(36, 30, 7))

def art_mirror():
    return (f'<rect x="58" y="76" width="12" height="26" rx="6" fill="#b87a3a" stroke="{INK}" stroke-width="3.2"/>'
            f'<circle cx="64" cy="52" r="28" fill="#c9a26d" stroke="{INK}" stroke-width="3.6"/>'
            f'<circle cx="64" cy="52" r="21" fill="#cfeefc" stroke="{INK}" stroke-width="3"/>'
            '<path d="M50 44 Q54 36 62 34" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>'
            '<path d="M52 56 Q54 52 57 51" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>'
            + star(72, 58, 9, 4, "#ffd23f", sw=2.6) + sparkle(100, 30, 7))

def art_lucky_star():
    return ('<path d="M20 90 Q46 70 70 46" fill="none" stroke="#9ad0f0" stroke-width="9" stroke-linecap="round" opacity=".9"/>'
            '<path d="M18 74 Q38 62 56 48" fill="none" stroke="#c9a6ff" stroke-width="6" stroke-linecap="round" opacity=".9"/>'
            + star(80, 50, 27, 12) + sparkle(104, 84, 8) + sparkle(36, 40, 6) + sparkle(50, 98, 5))

def pin(art, rim, tier=None):
    light, dark = RIMS[rim]
    hexp = lambda r, cy=64: " ".join(f"{64 + math.cos(math.radians(a)) * r:.1f},{cy + math.sin(math.radians(a)) * r:.1f}" for a in range(-90, 270, 60))
    pips = ""
    if tier is not None:
        n = tier + 1
        for i in range(n):
            pips += star(64 + (i - (n - 1) / 2) * 12, 101, 5.4, 2.4, "#ffd23f", sw=1.6)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="512" height="512">'
            f'<polygon points="{hexp(61)}" fill="{light}" stroke="{INK}" stroke-width="4.5" stroke-linejoin="round"/>'
            f'<polygon points="{hexp(50)}" fill="#fff3d6" stroke="{INK}" stroke-width="3.4" stroke-linejoin="round"/>'
            f'<path d="M14 40 L64 8 L114 40" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>'
            f'<g transform="translate(0,-2)">{art}</g>{pips}</svg>')

LADDERS = {"rising-star": (art_rising_star, 5), "maxed-out": (art_maxed_out, 5), "style-icon": (art_style_icon, 4),
           "point-collector": (art_point_collector, 5), "aura-collector": (art_aura_collector, 3)}
SINGLES = {"pin-full-look": (art_full_look, "gold"), "pin-mirror-mirror": (art_mirror, "silver"), "pin-lucky-star": (art_lucky_star, "gold")}

def tier_rim(i):   # the same split the Badges tab uses: first step bronze, second silver, the rest gold
    return "bronze" if i == 0 else "silver" if i == 1 else "gold"

jobs = []
for name, (fn, steps) in LADDERS.items():
    for i in range(steps): jobs.append((f"{name}-{ROMAN[i]}", pin(fn(), tier_rim(i), i)))
for name, (fn, rim) in SINGLES.items(): jobs.append((name, pin(fn(), rim)))

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 512, "height": 512})
    for name, svg in jobs:
        pg.set_content(f'<html><body style="margin:0;background:transparent">{svg}</body></html>')
        png = pg.screenshot(omit_background=True, clip={"x": 0, "y": 0, "width": 512, "height": 512})
        Image.open(io.BytesIO(png)).convert("RGBA").resize((128, 128), Image.LANCZOS).save(dst / f"{name}.webp", quality=92, method=6)
    b.close()
print(f"wrote {len(jobs)} badge pins to icons/badges/")
