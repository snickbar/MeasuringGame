# Mode mascot source artwork

30 final PNGs across nine mascot sets: Classic Party ant, Team vs Team dogs/cats, Worlds fox, Team Worlds monkeys, Bluff raccoon, High Stakes piggy bank, Daily rooster, Monthly squirrel and Quick Game robot.

Open `index.html` for the review gallery. `manifest.json` lists the selected final filename for every requested pose and its banner reference. Files ending in `-v2.png` supersede the corresponding earlier image; earlier attempts remain only as generation history. The final delivery ZIP contains the 30 selected images, not the superseded attempts.

The original images have white backgrounds and remain unchanged. At the user's request, all 30 selected images also have transparent-alpha PNG versions in `transparent/`; these are the preferred set for integration. Open `transparent/index.html` to review them against checkerboard, light or dark backgrounds. Banners are landscape, tutorial/cheer poses square. The images are not integrated into gameplay. Existing High/Low, Survival and Which Is Bigger mascots are unchanged. Additional results-screen expressions remain deferred.

User revision: the raccoon holds a blank spiral-bound notepad instead of a playing card in all three poses. The original pasted request is archived in `requested-prompts.txt`; the manifest includes the revised raccoon prompts. Anatomical corrections removed extra hands/arms from the fox and monkey banners. The rooster tutorial omits its banner's hay bale and sun.

Regenerate the gallery and review sheets with `node scripts/build-mascot-review.cjs`. `review/dimensions.json` records the final image sizes.

Run `node scripts/build-transparent-mascot-review.cjs` to verify every transparent PNG has a real alpha channel, transparent corners, visible opaque character details and the original aspect ratio. It rebuilds the transparent gallery, alpha report and light/dark review sheets. Background removal used the built-in image tool; the scripts only inspect, compose review sheets and package the files.
