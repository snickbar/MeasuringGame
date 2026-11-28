# Supporter Pass and the ad spots

Decided with the owner on November 27, 2026. Prices and limits are a proposal that can change; everything is built with a fake purchase and a fake ad until launch (see pre-launch.md).

## The pass
- $2.99 a month or $19.99 a year. It is a time window (`profile.supporterUntil`, server milliseconds, plus `supporterPlan`), so it simply stops when the time runs out. Buying again adds time on top.
- Shop > Offers: the pass card sits under the Party Mode card until Party Mode is owned, then goes on top (`renderSupporterUi`). The card opens a details sheet with Monthly / Yearly.
- Perks:
  1. **Double coins with no ad.** Every "watch an ad to double" button becomes "Double coins · Free". It is still one tap, and still only double, never 4x. All the sites go through `adOrPass()`; the game reward screen gets the same through its `ad` and `free` ports (anim/game-rewards.mjs).
  2. **One free random capsule pull a day** (`profile.passPullDate`, claimed from the pass card or the Capsules tab; adds to `freePulls`).
  3. **Exclusive looks** (below) and a small medal beside the name.
- Nothing the pass gives changes how a game is won, so it is never pay-to-win. No gold player card (yellow is already a player colour).

## Exclusive looks
- Six auras (Golden glow, Starlight, Ember, Aurora, Meadow, Moonlight) in `SUPPORTER_AURAS` (anim/avatar-auras.mjs): the same effects as the level-6 auras, but in their own fixed colour, never the card colour. A supporter's aura needs no avatar level and applies to whatever avatar they play (`profile.supporterAura`); an aura picked in Edit for one game still wins for that game.
- Six name colours in `NAME_COLOURS` (index.html), with a glowing golden one (`profile.supporterNameColor`). They keep a dark outline so they read on any card colour.
- Chosen in the pass card > Choose your extras (`openSupporterExtras`).
- Everyone sees them: a supporter's room entry carries `supporter`, `nameColor` and `avatarAura` (`supporterRoomLook`, kept in step by `syncSupporterLookToRoom`). `nameHtml(player)` draws the medal (before the name, so a long name never hides it) and the colour on the player cards.
- **Borders are not built yet**: they need new frame art. Add them to the extras sheet (a third tab) when the art exists, through the existing player frame system (see CLAUDE.md, equipped player frames).

## Ad spots (rewarded ads only, nobody is forced to watch)
- Ad meter on the Capsules tab: watch 3 ads, get 1 random pull, once a day. This is the only capped spot.
- Free power-ups: any power-up you cannot afford is free for one ad, once per power-up per question, no daily cap.
- Double coins after a game, free revive in solo modes, the Coin Booster ad, and one extra hosted game.
- A 2-second guard after any ad stops a stray tap from starting another.

## Tests
`npm run test:supporter-pass`, `test:ad-meter`, `test:free-powerups`, `test:auras`. To check that a supporter's medal and name colour never break a card, run the layout tests with `SUP_STRESS=1` (every player becomes a supporter), for example
`SUP_STRESS=1 PLAY_LAYOUT_RESULTS=1 PLAY_LAYOUT_SIZES='[[360,640],[412,915]]' node scripts/verify-play-layout-browser.cjs`.
