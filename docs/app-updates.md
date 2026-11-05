# App update delivery

After the one-time installation of the update-delivery APK, the app discovers updates at `https://raw.githubusercontent.com/snickbar/MeasuringGame/app-updates/version.json`. ZIPs are immutable GitHub release assets under `web-<full commit SHA>`. Firebase's existing `/live/version.json` is a fallback if GitHub discovery or downloading fails. No Firebase billing or quota change is required.

Every push to main runs **Publish app live update**, independently of the Firebase deployment. It builds the lean production ZIP, checks the updater and package, uploads ZIP plus manifest to a draft release, publishes the release, then updates the public pointer. A failed upload never moves the pointer. Reruns reuse the published ZIP and its checksum; older runs cannot replace a newer pointer. Releases remain available for clients already downloading them.

Build versions use the commit's UTC timestamp to the second and its short SHA, so an APK and web update from the same commit have the same version. Updates validate metadata and forward the SHA-256 to the native plugin, queue for the next launch, retain the running bundle, and use the plugin's existing rollback mechanism. Settings offers Restart now; automatic checks never restart an active game. Automatic downloads retain the existing Wi-Fi/data-saver restriction.

## Publishing manually

Normally push main and inspect its publishing workflow. With an authenticated GitHub CLI, an already committed checkout can also publish by setting `LIVE_BUNDLE_BASE_URL` to `https://github.com/snickbar/MeasuringGame/releases/download/web-<full HEAD SHA>`, running `node scripts/build-live-bundle.js`, `npm run test:updates`, `node scripts/verify-production-package.mjs`, then `node scripts/publish-live-update.cjs`.

Use `npm run cap:sync` and the existing Android build for native changes. Incrementing the commit count gives the APK a higher version code, clearing old downloaded web bundles on install. Keep using the same signing key when updating an installed sideloaded app. A web update cannot add new native plugins or permissions.

## Verification

`npm run test:updates` covers primary availability, Firebase fallback, HTTP 509, failed ZIP download, missing/invalid metadata, checksum forwarding, failed cached bundles, queueing, timeouts, and concurrent checks. Public release downloads and the pointer should also be checked after publication. Native installation, download, and restart still need a phone smoke test.

Run `node scripts/verify-published-update.cjs <installer-version>` for a real public download check. It requires a newer published version, checks the manifest's app-compatible CORS header, downloads the full ZIP from GitHub, hashes its bytes, checks `app-version.json` inside it, and exercises the app's queueing logic through an adapter. It saves the ZIP and verification report under `output/update-delivery/`; it does not install anything. This passed on October 25, 2026 with a 164,452,055-byte GitHub ZIP, independently of Firebase. The native plugin still needs a phone check after the bootstrap install.

Phone smoke test: install `Size-Em-Up-2026-10-25-update-delivery.apk` over the existing app, open Settings → About → Check for updates, let it download, then choose Restart now. Verify the displayed build changes and profile/coins remain intact. The installer starts at `1.0.20261025165810-ff872f5`; the GitHub channel already has a newer update for testing.

References: [GitHub release download links](https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases) and [Capgo manual update flow](https://capgo.app/docs/plugins/updater/self-hosted/manual-update/).

## Profile saves (do not use whole-profile transactions)
A transaction on `profiles/<id>` ended in Firebase "maxretry" for a grown profile: the career save queue never emptied ("Saving progress..."), award claims snapped back, and lobbies/starts waited seconds. The app's `runTransaction` wrapper now turns every whole-profile transaction into a read + small `update()` of only the changed paths (`changeProfile`, `anim/profile-diff.mjs`). `npm test` runs `verify-no-profile-transactions.mjs`, which fails if anything calls Firebase transactions directly. Transactions on small leaves (`profiles/<id>/coins`) and on rooms are fine. Tapping the "Saving progress" pill shows the connection, account and profile-size line.

Profile balance changes now use `anim/profile-writes.mjs`: each small update includes the next `_writeVersion`, and database validation rejects a stale version atomically with its reward receipt, spend or unlock. The losing client rereads and reapplies its original change; genuine permission errors surface immediately and contention retries are bounded. Award claims, coin grants and offline merges use this same path. Deploy the matching `database.rules.json` before releasing this code. `npm run test:profile-rules` checks concurrent rewards, duplicate receipts and unrelated setting writes against the local Firebase emulator, without touching production profiles.

Starter Bundle categories that have no unowned item bank a `freeCategoryPulls/<category>` credit. Credits remain when a category is empty and are consumed ahead of general free pulls/coins once that category has an item again. Failed capsule saves release the shop controls and show a retry message.

## Redeem codes

Settings > Redeem a code. A signed-in (Google) account can use each code once; guests are asked to sign in first. The coins and the `redeemedCodes/<CODE>` mark are written in one profile update, so a retry or second device cannot pay twice. Rules live in `anim/redeem-codes.mjs` (tested by `scripts/verify-redeem-codes.mjs`). `THANKYOU` (100 coins) is built in. To send a new code without an app update, add `codes/<CODE>` in the Firebase console, e.g. `{ "coins": 250, "expires": 1767225600000 }` (`expires` in ms is optional; `"active": false` switches a code off). Codes are capitals and digits only. The `codes` rule in `database.rules.json` must be deployed once (`firebase deploy --only database`) for database codes to be readable; the built-in code works without it.
