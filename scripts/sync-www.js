// Copies the static web app (the actual source of truth lives at the repo
// root) into www/, which is purely a
// generated Capacitor build input - never hand-edit anything under www/,
// run this instead and it'll be rebuilt fresh every time. Firebase Hosting is
// staged separately from these same production files by build-live-bundle.js.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const WWW = path.join(ROOT, "www");

const {list}=require('./production-files.cjs');
if(path.dirname(WWW)!==ROOT||path.basename(WWW)!=='www')throw Error('Unexpected build output path');

fs.rmSync(WWW, { recursive: true, force: true });
fs.mkdirSync(WWW, { recursive: true });

const files=list();
for (const f of files) {
  const dest=path.join(WWW,f);fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.copyFileSync(path.join(ROOT,f),dest);
}

// Stamp the build so the native app can tell whether a downloaded live-update
// bundle is newer than the files it is already running (see the live-update
// check in index.html). The version sorts as a plain string: the 12-digit
// UTC timestamp is fixed-width.
let sha = process.env.GITHUB_SHA || "";
if (!sha) {
  try { sha = require("child_process").execSync("git rev-parse HEAD", { cwd: ROOT }).toString().trim(); } catch (e) { sha = "local"; }
}
const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12);
const version = "1.0." + stamp + "-" + sha.slice(0, 7);
fs.writeFileSync(path.join(WWW, "app-version.json"), JSON.stringify({ version }) + "\n");

console.log("www/ synced with " + files.length + " production files; review assets excluded.");
