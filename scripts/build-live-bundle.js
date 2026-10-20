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

let sha = process.env.GITHUB_SHA || "";
if (!sha) {
  try { sha = execSync("git rev-parse HEAD", { cwd: ROOT }).toString().trim(); } catch (e) { sha = "local"; }
}
sha = sha.slice(0, 7);
const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12); // YYYYMMDDHHMM
const version = "1.0." + stamp + "-" + sha;

execSync("zip -qr " + JSON.stringify(path.join(OUT, "bundle.zip")) + " .", { cwd: WWW, stdio: "inherit" });

const manifest = { version, url: BASE_URL + "/bundle.zip", builtAt: new Date().toISOString() };
fs.writeFileSync(path.join(OUT, "version.json"), JSON.stringify(manifest, null, 2) + "\n");

const mb = (fs.statSync(path.join(OUT, "bundle.zip")).size / 1048576).toFixed(1);
console.log("live bundle " + version + " (" + mb + " MB) -> live/");
