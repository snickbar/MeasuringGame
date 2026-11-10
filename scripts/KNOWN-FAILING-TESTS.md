# Browser tests that fail today (checked 2026-11-10)

Run `npm run test:browser-extra` for the browser tests that pass and are not part of `npm test`.

These browser tests fail on the commit before the WebP conversion too, so they are not caused by it. Each is either a
test that fell behind the game, a real layout/behavior problem, or something the headless Chrome in the cloud workspace
does differently from a real phone. None has been sorted into those groups yet. Run them on the PC with real Chrome first.

auto-fit (opening pot vs Deal button at small widths), lobby-pinning (same), bluff, bottom-actions, buffer-results,
capsule-recovery, discoveries, exit-confirm, game-polish ("World can resume"), packed-game (same), game-rewards (horizontal
overflow), high-low-reveal and hl-heart ("Bird mark follows live motion"), input-responsiveness ("Rapid input regression"),
mode-identity, party-tutorial, play-layout, powerups (solo layout at 320x700), scenery-choices, settings-name,
which-bigger-summary.

`verify-game-setup-browser` was removed: the setup screens were redesigned and its fake page no longer matched.
`npm run test:profile-rules` needs the Firebase emulator, which the cloud workspace does not have.
