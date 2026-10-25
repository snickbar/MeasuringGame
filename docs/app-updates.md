# App update delivery

After the one-time installation of the update-delivery APK, the app discovers updates at `https://raw.githubusercontent.com/snickbar/MeasuringGame/app-updates/version.json`. ZIPs are immutable GitHub release assets under `web-<full commit SHA>`. Firebase's existing `/live/version.json` is a fallback if GitHub discovery or downloading fails. No Firebase billing or quota change is required.

Every push to main runs **Publish app live update**, independently of the Firebase deployment. It builds the lean production ZIP, checks the updater and package, uploads ZIP plus manifest to a draft release, publishes the release, then updates the public pointer. A failed upload never moves the pointer. Reruns reuse the published ZIP and its checksum; older runs cannot replace a newer pointer. Releases remain available for clients already downloading them.

Build versions use the commit's UTC timestamp to the second and its short SHA, so an APK and web update from the same commit have the same version. Updates validate metadata and forward the SHA-256 to the native plugin, queue for the next launch, retain the running bundle, and use the plugin's existing rollback mechanism. Settings offers Restart now; automatic checks never restart an active game. Automatic downloads retain the existing Wi-Fi/data-saver restriction.

## Publishing manually

Normally push main and inspect its publishing workflow. With an authenticated GitHub CLI, an already committed checkout can also publish by setting `LIVE_BUNDLE_BASE_URL` to `https://github.com/snickbar/MeasuringGame/releases/download/web-<full HEAD SHA>`, running `node scripts/build-live-bundle.js`, `npm run test:updates`, `node scripts/verify-production-package.mjs`, then `node scripts/publish-live-update.cjs`.

Use `npm run cap:sync` and the existing Android build for native changes. Incrementing the commit count gives the APK a higher version code, clearing old downloaded web bundles on install. Keep using the same signing key when updating an installed sideloaded app. A web update cannot add new native plugins or permissions.

## Verification

`npm run test:updates` covers primary availability, Firebase fallback, HTTP 509, failed ZIP download, missing/invalid metadata, checksum forwarding, failed cached bundles, queueing, timeouts, and concurrent checks. Public release downloads and the pointer should also be checked after publication. Native installation, download, and restart still need a phone smoke test.

References: [GitHub release download links](https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases) and [Capgo manual update flow](https://capgo.app/docs/plugins/updater/self-hosted/manual-update/).
