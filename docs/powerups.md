# Solo power-ups

Power-ups are available in Quick Game (solo, with bots), Worlds, and Survival. Party, Daily Challenge, and Monthly Challenge—including practice—do not offer them. They are bought for the current question, with no inventory.

The answer screen has one compact row with five icons, short labels, and prices. Selecting an icon opens a purchase dialog. Submitted Quick Game guesses get a single buffer button beneath the guess; Second Chance gets a single 50/50 button. Neither phase adds an empty tray. Worlds and Survival keep their existing untimed flow without adding Second Chance.

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

Run `node scripts/verify-powerups-browser.cjs` for the isolated Chromium controller check (Windows Chrome by default, or set `CHROME_PATH`). It passed the five-button row, purchases/cancellation, double taps, reroll state, waiting layout, Second Chance visibility, insufficient funds, deadline refunds, untimed Worlds purchases, four-second reveal, excluded modes, and idempotent interrupted-purchase recovery. The isolated test uses an in-memory wallet/room and drives animation frames from Chromium's virtual test clock. A live Firebase and native Android smoke test remains appropriate before merging.

The separate welcome/account achievements and end-of-game coin-screen plan are not implemented by this change.
