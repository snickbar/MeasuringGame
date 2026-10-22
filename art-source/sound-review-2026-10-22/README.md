# Sound replacement review

`round-1.json` preserves the user's submitted Keep/Change decisions, validated against all 42 current role fingerprints. Sixteen moments were marked Change, 24 Keep, and two were undecided.

`candidate-sources.json` records the 48 selected source files from `C:/Projects/assets`, their source/output hashes, trims, gain and format conversion. The complete inventory of 10,326 loose audio files and archive entries is in ignored `output/sound-asset-audit/inventory.json`. The loose count includes alternate formats and 192 kHz copies. The Ultimate UI ZIP contains a further 140 audio entries; the two FilmCow ZIPs duplicate extracted packs.

The preview clips are mono 16-bit WAVs at their original sample rates, with modest RMS balancing, a peak limit, silence trimming and short fades. The script uses Python + numpy. Rebuild with:

`python scripts/build-sound-options.py --assets C:/Projects/assets --picks "path/to/size-em-up-sound-review.json"`

FilmCow recorded and designed assets are covered by the locally included `C:/Projects/assets/license.pdf` (FilmCow Royalty Free SFX Library License Agreement); primary source: https://filmcow.itch.io/filmcow-sfx. Other FilmCow packs retain their original creator/source folder names. The category folders (Musical Effects, UI, Items, Card and Board, Retro, Other) are user-supplied assets without creator/license metadata in their WAV headers. Source provenance is retained rather than inventing attribution. JDSherbert assets were inventoried but not included in these preview clips; their default terms prohibit sharing raw assets/public asset repositories.

The comparison page itself never changes game audio. Its original reference stays frozen, and candidate drumroll builds append the user's separate ending choice. Shared cues are selected independently by role (for example roundwin versus star; best versus perfect/lead; partial-object cardflip versus ordinary cardflip).

Selections use both original-sound and candidate-set fingerprints. Export/import is role-based, versioned and rejects duplicate or mismatched entries. Keep/Change decisions from round 1 remain intact; candidate selections live in their own storage key. No sounds are applied to the game by this page.

## Applied round two

`round-2.json` archives the October 22 export: eight selected replacements, five Keep original, two More options (suspense build and ending), and one unselected (game start). `applied-sounds.json` lists the eight approved clips copied byte-for-byte into `sfx/reviewed/`, with the selected gains. The game routes coin rewards to a single jingle, leaving countdowns alone; Worlds and Team Worlds stars retain the old star chime independently of the new round-win cue. Thirty-four original role fingerprints remain unchanged.

`build-sound-review.cjs` refreshes the live review from actual game wiring. The round-one options remain a frozen reference and are labeled accordingly. Its baseline link recognizes applied clips only when their path, hash and gain still match the approval; it does not silently approve later audio edits. `verify-reviewed-sounds.cjs` checks exact clips, 34 unchanged roles, shared-role isolation, actual sound routing, effects volume, mute, and cancellation of the suspense follow-up.
