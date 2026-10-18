# Fourth cutout review

Source: `size-em-up-cutout-picks (18).json`, exported 2026-10-18; 7 Fix / 473 Keep.
All source fingerprints matched the current artwork before editing.

The six gap corrections remove alpha only from hand-selected connected regions,
with at most two pale edge pixels of growth. Original colors and dimensions stay
unchanged. The pearl necklace also repairs 24 enclosed transparent glare spots:
alpha becomes opaque, existing visible colors stay, and missing hidden RGB inside
those highlight holes becomes white. The clasp opening remains transparent.

`originals/` contains reversible source copies; the manifest records hashes and
counts. `*-patch.npz` stores exact before/after pixels and the allowed masks.
Candidates and before/after pictures were visually inspected in
`output/cutout-pass-4/` before applying the changes.

Only these seven images enter the new Fixed—review again section. The 473 Keep
decisions remain. Verification checks exact edits and preservation, rather than
claiming that every possible artwork defect has been found.
