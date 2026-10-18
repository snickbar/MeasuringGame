# Reviewed object transparency cleanup

480 runtime WebP images were audited: 479 objects plus the alternate donut.
Eleven images received alpha-only corrections in reviewed empty openings:
soccer goal, tennis racket, teacup, power-line tower, tower crane, shuttlecock,
Brooklyn Bridge, excavator, barstool, folding chair and motorcycle.
The other 469 runtime files remain byte-identical.

The initial visual pass missed four enclosed openings; its completeness claim
was too strong. Edge/padding statistics cannot certify interior cutout quality.
The closer follow-up focuses on open geometry. Pixel verification proves that
reviewed changes preserve artwork; it does not prove every possible unwanted
background pocket has been identified.

Original compressed files are retained in `originals/`. `manifest.json` records
all original file hashes, corrected components, dimensions and changed counts.

The user explicitly approved precise pixel-preserving cleanup after AI cutout
candidates left speckles in fine netting. None of those generated candidates
are used. Final images retain every source RGB pixel and original dimensions,
change alpha only inside reviewed background openings, and use lossless WebP
encoding. White structural materials, feathers, ceramic surfaces and intentional
highlights are protected. Ambiguous white structural illustrations are retained.

Run `scripts/audit-object-padding.py` for a read-only catalog audit,
`scripts/clean-object-transparency.py` for candidate comparisons, and add
`--apply` only to reproduce the reviewed edits from the retained originals.
Run `scripts/verify-object-transparency.py` to check RGB/dimension preservation,
the exact alpha changes, protected materials and unchanged unrelated files.
These scripts require Pillow and NumPy.
