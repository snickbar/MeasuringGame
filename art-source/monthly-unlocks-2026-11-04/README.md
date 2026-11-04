# Monthly unlock artwork

65 individual assets generated from the 61 supplied monthly unlock prompts, plus the requested donkey and round fiesta piñata alternatives and two transparent coin-slot options, using the built-in image generator. The overly detailed initial pieces were simplified, the sun was redesigned, and the alternate bird, bat and pumpkin frames were generated against their matching first frames. Original white backgrounds and separate sheets/layers are preserved. These are review assets; no live game artwork is replaced by this batch.

`prompts.json` records the supplied prompts and intended month for each asset. Beside revised source PNGs, `.png.json` records preserve effective generation prompts and reference inputs. `manifest.json` lists all final assets and provenance. `gallery.html` groups artwork and 36 animated composition previews by month, with review marks and downloadable notes saved locally on the reviewer's device.

Month directories preserve the full source PNGs. `review/` and `thumbs/` contain lighter JPEGs for phone viewing. `motion/` contains prepared transparent WebP layers and individual sheet pieces for the previews. Existing `beach-ball`, `wishbone`, and `sleigh` art is reused.

Rebuild after editing source PNGs:

```
node scripts/prepare-monthly-unlock-review.cjs
node scripts/encode-monthly-unlock-motion.cjs
node scripts/build-monthly-unlock-gallery.cjs
```

The motion encoder uses the repository's isolated headless-browser fixture. Preview animations pause outside the viewport, run without sound, and can be replayed. They are review compositions rather than installed game changes.
