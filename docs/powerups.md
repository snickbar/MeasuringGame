# Solo power-ups

Power-ups are available in Quick Game (solo, with bots), Worlds, and Survival. Party, Daily Challenge, and Monthly Challenge—including practice—do not offer them. They are bought for the current question, with no inventory.

Quick Game keeps the object pictures directly beneath the question. Buffer and Reveal use measured spare space beneath the tips (up to two slots) and beside the object pictures (one slot). The remaining controls occupy a single row above the player cards. Layout is recalculated when the viewport or question/tip sizes change; buttons remain at least 44 pixels wide and tall. Long tips release their slots instead of overlapping controls. If space is tight, the sidebar row scrolls horizontally with a swipe hint instead of adding another row. Only relevant, unused actions appear. Tapping immediately purchases and uses the action; unaffordable actions are disabled. Explanations and prices live in the Power-ups card in How to Play. Worlds and Survival retain their compact row and existing untimed flow without adding Second Chance; purchases there are also immediate.

Prices are centralized in `anim/powerups.mjs` and remain adjustable:

| Power-up | Coins | Effect |
| --- | ---: | --- |
| Reroll small | 5 | Replace the smaller object |
| Reroll big | 5 | Replace the larger object |
| Reroll both | 10 | Replace both objects |
| 10% buffer | 10 | Move the guess toward the answer by 10% of the answer, capped at exact |
| Item reveal | 10 | One four-second relative-size preview, without measurements |
| 50/50 | 2 | Remove choices while retaining a correct and an incorrect alternative |

Only one reroll is allowed per question. A reroll preserves other purchased effects and restarts an existing Quick Game timer. Reveal requires four seconds remaining in a timed question; the timer keeps running. Reduced-motion preferences use a static comparison for the same four seconds.

The buffer preserves the entered guess. Results, winners, accuracy, achievements, Worlds stars, Survival safety, and rewards use the improved value. For example, 95 versus an answer of 100 becomes 100 and beats an unbuffered 97. Second Chance always shows original guesses and no buffer adjustment or indicator.

Purchases debit a profile transaction, save a receipt, and validate the question and deadline again before applying. Quick Game effects and their receipt markers are saved in a room transaction. Invalidated purchases refund once. Interrupted receipts are reconciled on reconnect; cancellation markers prevent a late room write from applying after recovery has refunded it. Settled profile receipts are bounded; pending receipts are retained.

## Verification

Run `npm test` for measurement/prompt checks, power-up rules, wallet idempotency, actual host scoring, and actual Worlds rewards/history. Run `npm run sync-www` to refresh the generated Android input.

Run `node scripts/verify-powerups-browser.cjs` for the isolated Chromium controller check (Windows Chrome by default, or set `CHROME_PATH`). It uses actual emulated 320, 390, and 430 pixel mobile viewports and real animation frames. It checks spare-space placement, single-row card displacement, long tips, tall boards, touch targets, help content, immediate purchases, double taps, phase rules, refunds, untimed modes, four-second reveal, and recovery. The wallet and room are isolated in memory. A live Firebase and native Android smoke test remains appropriate before merging.

The separate welcome/account achievements and end-of-game coin-screen plan are not implemented by this change.
