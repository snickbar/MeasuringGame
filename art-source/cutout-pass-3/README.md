# Third cutout review

Source: user export `size-em-up-cutout-picks (3).json`, 36 Fix / 444 Keep.

Originals are saved before modification. Corrections use hand-selected enclosed
regions, bounded pale edges, and saved alpha restoration. Original RGB and image
dimensions are unchanged. No blanket white-color removal is used.

The basketball backboard returns exactly to its pre-pass-2 artwork, following the
user's fallback instruction. The Space Needle's solid middle is restored from
the saved image. Existing transparent pearl-highlight centers predate these
cleanup passes (also present in the Git version); this pass clears the clasp and
restores the saved surrounding edge alpha without inventing replacement pixels.

`rules.json` records selections, `manifest.json` records hashes and counts, and
each `*-alpha.npz` stores the exact original and final alpha channel. Candidates
and before/after images are in `output/cutout-pass-3/` for visual inspection.

The latest 36 files appear in the phone page's Fixed—review again section with
fresh decisions. The 444 unchanged Keep choices remain available.

Verification establishes exact edits and preservation, not that every possible
artwork defect has been found. The user can mark any remaining problem again.
