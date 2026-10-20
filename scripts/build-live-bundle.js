// Builds the "live update" bundle the native app downloads in the background.
// Runs in CI right before the Firebase Hosting deploy, so every merge to main
// publishes https://size-em-up.web.app/live/bundle.zip + live/version.json.
//
// The bundle is exactly what sync-www.js puts in www/ (the same files that
// ship inside the APK), zipped with index.html at the zip root.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const WWW = path.join(ROOT, "www");
const OUT = path.join(ROOT, "live");
const BASE_URL = "https://size-em-up.web.app/live";

execSync("node " + JSON.stringify(path.join(__dirname, "sync-www.js")), { stdio: "inherit" });

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// Same version the bundle itself carries in app-version.json.
const version = JSON.parse(fs.readFileSync(path.join(WWW, "app-version.json"), "utf8")).version;

execSync("zip -qr " + JSON.stringify(path.join(OUT, "bundle.zip")) + " .", { cwd: WWW, stdio: "inherit" });

const manifest = { version, url: BASE_URL + "/bundle.zip", builtAt: new Date().toISOString() };
fs.writeFileSync(path.join(OUT, "version.json"), JSON.stringify(manifest, null, 2) + "\n");

const mb = (fs.statSync(path.join(OUT, "bundle.zip")).size / 1048576).toFixed(1);
console.log("live bundle " + version + " (" + mb + " MB) -> live/");
