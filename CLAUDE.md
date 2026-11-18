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
