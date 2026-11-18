# Size Em Up! - rules for changes

## Equipped player frames must never be lost (check EVERY time)
Players can equip a custom border ("player frame"). It must show on every player card in every mode: High Stakes cards
(including your turn), High/Low player cards, score cards, High Stakes final rows, lobby cards, Bluff cards.
Changes to card layout, borders, backgrounds, glows, padding or z-index keep breaking it, so after ANY such change:

1. Run `npm run test:frames` (scripts/verify-frames-browser.cjs). It checks every card template still renders the frame
   and, in a real browser, that the frame picture is drawn, visible and not turned off by another rule.
2. If you add a new kind of player card, give it the frame: add `player-frame-host` to the card (see `hsFrameCls(p)`),
   append the frame art (see `hsFrameArt(p)` / `showPlayerFrame`), and add the card to the case list in that script.
3. A card's own border or glow must never replace the frame. Keep the card border transparent and draw glows on
   pseudo-elements underneath the frame art (see `.hs-pl.turn.player-frame-host`).

## Other checks before pushing
`npm run sync-www`, `npm run test:css`, `node scripts/verify-animation-properties.mjs`, `node scripts/verify-size-budget.mjs`.
When the user points out a visual problem on one screen, check and fix it on every game mode and screen.

## Number keypads must keep their feedback (check EVERY time)
Every number keypad presses on touch-down and gives the tap sound, a tiny buzz and a brief brightness glow on the key and the typed number
(`numpadFeedback`, the team keypad handler, and the shared `.dc-key` handler (every typed-answer keypad except the team one is built by `kpKeysHtml()`)). Never replace them with click-only handlers, and
give any new keypad kind the same treatment. Run `npm run test:numpad` after touching keypads, question screens or input code.

## Keypads must never pass the bottom edge (check EVERY time)
Every mode's keypad and its Lock/Submit button must stay fully on screen, and the question board must not collapse, on small phones.
After touching keypads, key sizes, the question board or `anim/play-layout.*`, run `npm run test:keypad-fit` (the pinned-layout audit at
360x640, 360x740, 390x650, 392x830 and 412x915; Bluff has no keypad so it is skipped). If a screen is too tall, shrink the keys
(the density rules in `anim/play-layout.css`) rather than let anything run off the bottom. Known gaps: 320x568 and 320x650 are not yet supported by every mode.

## Result screens must fit (check EVERY time)
After touching the answer reveal papers, the wait scene after Lock it in, `anim/play-layout.*` or the reveal CSS, run `npm run test:result-fit`
(360x640, 360x740, 393x786, 412x915). It fails on a big empty gap under the question board, papers shrunk below 0.65, the last paper unable to
scroll into view, or a wait screen that overflows. Not every paper has to be visible at once: with many players the worst ones may scroll away,
but the papers must not shrink tiny to fit all 10.

## The default avatar only changes in Settings
Picking an avatar for one game (the name/avatar screen, its random button, or the automatic swap when someone else has taken yours) only changes
`currentAvatar` for that game. The saved default (`mg_avatar`) is written only by `setDefaultAvatar()`, called from the Settings picker (and its random
button) and Equip in the shop. A new game starts from `defaultAvatarId()`. Run `npm run test:avatar-default` after touching avatar pickers.

## The party result layout must survive the phase change
`applyPhase` clears `data-play-layout` on every non-question phase (`restoreHighLow`). Reveal and summary put it back with `keepParty`; without it the papers and score cards are cut by a flat edge under the board even though the test fixtures (which set the attribute by hand) pass. Run `npm run test:result-layout` after touching `applyPhase` or the play-layout.
