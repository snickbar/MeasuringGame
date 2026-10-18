# Second cutout review

The user reviewed all 480 artwork files and marked 81 for another pass. The full
input is retained in `original-picks.json`. Each of those 81 originals is backed
up in `originals/`; the other 399 files remain byte-identical.

`rules.json` records manually selected openings and protected material. The
cleanup also removes partially transparent pale edge specks immediately beside
dark outlines. Consequently some flagged images received only edge cleanup;
white materials, reflections, glass and fabric are not treated as background.
This is a review pass, not certification that every interior gap is perfect.

`manifest.json` records before/after fingerprints and changed pixel counts.
The compressed masks identify every changed alpha pixel. RGB channels and
dimensions are unchanged. The helmet chin pad and strap, feather interiors,
white fur, plates, flag stripes, and other white material are protected.

Regenerate from the retained originals with `scripts/clean-cutout-picks.py`
and the input export; `--apply` installs the candidates. Verify with
`scripts/verify-cutout-pass-2.py`, then rebuild the review data using
`scripts/build-cutout-review.mjs`.

The phone page now defaults to **Fixed—review again**, containing exactly these
81 images. Changed fingerprints clear their old Fix marks for a fresh verdict;
the original 399 Keep marks are preserved. New confirmations are keyed to the
new artwork fingerprints and persist across reloads.
