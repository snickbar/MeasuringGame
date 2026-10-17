# Reveal scenery

PNG artwork generated with the built-in image generator and reviewed in the scenery gallery. The existing grass and clouds remain in anim/.

Object assignments and rendering live in ../scenery.mjs. Floor alpha-surface positions and lower-edge colors live in ../scenery-data.mjs. Prompts are saved in prompts.md. The original generated PNGs are preserved without pixel edits.
## Live preview

Run `npm run preview:scenery` from the project, then open http://127.0.0.1:4173/anim/test.html. Local file URLs cannot load the live page's ES modules and game object list; they show a link to the served page instead.

The example selector covers all 13 settings. Play replays the reveal; the slider supports inspection. `node scripts/verify-reveal-test-page.cjs` exercises those controls while the preview server is running. `node scripts/verify-size-reveal-browser.cjs` independently tests the renderer at three phone widths.

City uses a permanent nighttime palette with restrained stars/clouds and dimmed pavement. Marine animals, including all sharks, use underwater scenery with a baseline inside the seabed surface; beach settings remain for coastal objects and boats.

The original camera and natural object positions are used throughout; no larger-object pinning or rescaling during stacking. Shared trimmed sprite poses remove transparent export margins before entry and stacking.

Indoor walls use seamless, low-contrast geometric patterns: warm living-room stripes, sage kitchen diamonds, and woven tabletop linen. Framed artwork is removed from every indoor setting. The tabletop uses a soft woven linen treatment. Underwater uses bubbles only, with slightly increased visibility.

## Background details

Six new original PNG layers add dense forest greenery, a beach sunset/ocean horizon, farm hay bales, distant sand dunes, an enchanted grove and underwater seaweed. They have fixed sizes and share the floor’s exact camera translation on both axes, so scenery remains attached during stacking and never wraps independently. Export padding is excluded from their placement bounds. Snowflakes fall at 7 pixels/second; bubbles rise at 5 pixels/second. Reduced-motion mode freezes ambient drift. The measured objects and camera are unaffected.

Open /anim/scenery-gallery.html on the local server to compare all settings with the actual renderer and individual replay buttons. Generation prompts are saved in background-details-prompts.json. Original PNGs remain unedited.

Desert uses a four-stop hazy lavender, pink, peach and warm cream sky gradient, without clouds or the dune backdrop. Atmospheric PNGs have stronger opacity and denser snow/bubble placement so their slow motion is visible behind measured objects.
