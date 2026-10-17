# Solo power-ups

Power-ups are available in Quick Game (solo, with bots), Worlds, and Survival. Party, Daily Challenge, and Monthly Challenge—including practice—do not offer them. They are bought for the current question, with no inventory.

Quick Game keeps the object pictures directly beneath the question. A compact three-column power-up box sits beneath the timer/tips, above the player cards. Only relevant, unused actions appear there, including the waiting buffer or Second Chance 50/50. Tapping immediately purchases and uses the action; unaffordable actions are disabled. Explanations and prices live in the new Power-ups card in How to Play. Worlds and Survival retain their compact row and existing untimed flow without adding Second Chance; purchases there are also immediate.

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

Run `node scripts/verify-powerups-browser.cjs` for the isolated Chromium controller check (Windows Chrome by default, or set `CHROME_PATH`). It checks the sidebar box, object placement, help content, immediate purchases without dialogs, double taps, reroll state, waiting layout, Second Chance visibility, insufficient funds, deadline refunds, untimed Worlds purchases, four-second reveal, excluded modes, and idempotent interrupted-purchase recovery. The isolated test uses an in-memory wallet/room and drives animation frames from Chromium's virtual test clock. A live Firebase and native Android smoke test remains appropriate before merging.

The separate welcome/account achievements and end-of-game coin-screen plan are not implemented by this change.
