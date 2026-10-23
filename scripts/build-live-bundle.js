// Builds the "live update" bundle the native app downloads in the background.
// Runs in CI right before the Firebase Hosting deploy, so every merge to main
// publishes https://size-em-up.web.app/live/bundle.zip + live/version.json.
//
// The bundle is exactly what sync-www.js puts in www/ (the same files that
// ship inside the APK), zipped with index.html at the zip root.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const WWW = path.join(ROOT, "www");
const OUT = path.join(ROOT, "live");
const BASE_URL = "https://size-em-up.web.app/live";
const HOSTING = path.join(ROOT, "hosting");

execFileSync(process.execPath, [path.join(__dirname, "sync-www.js")], { stdio: "inherit" });

if(path.dirname(OUT)!==ROOT||path.basename(OUT)!=='live'||path.dirname(HOSTING)!==ROOT||path.basename(HOSTING)!=='hosting')throw Error('Unexpected deployment output path');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// Same version the bundle itself carries in app-version.json.
const version = JSON.parse(fs.readFileSync(path.join(WWW, "app-version.json"), "utf8")).version;

if(process.platform==='win32'){
  // Windows includes bsdtar. A file list avoids command-length limits and
  // preserves .well-known plus index.html at the exact archive root.
  const entries=path.join(OUT,'zip-entries.txt');
  const files=require('./production-files.cjs').list().concat('app-version.json');
  fs.writeFileSync(entries,files.join('\n')+'\n');
  try{execFileSync('tar.exe',['-a','-cf',path.join(OUT,'bundle.zip'),'-C',WWW,'-T',entries],{stdio:'inherit',windowsHide:true});}
  finally{fs.unlinkSync(entries);}
}else{
  execFileSync("zip", ["-qr",path.join(OUT,"bundle.zip"),"."], { cwd: WWW, stdio: "inherit" });
}

// The updater plugin refuses to install a bundle without its SHA-256 (lowercase hex) to verify the download.
const checksum = require("crypto").createHash("sha256").update(fs.readFileSync(path.join(OUT, "bundle.zip"))).digest("hex");

const manifest = { version, url: BASE_URL + "/bundle.zip", checksum, builtAt: new Date().toISOString() };
fs.writeFileSync(path.join(OUT, "version.json"), JSON.stringify(manifest, null, 2) + "\n");

// Hosting gets the same lean files as the APK, plus the update archive. Keep
// this staging directory separate so a subsequent APK cannot include its own ZIP.
fs.rmSync(HOSTING, {recursive:true,force:true});
fs.cpSync(WWW,HOSTING,{recursive:true});
fs.cpSync(OUT,path.join(HOSTING,'live'),{recursive:true});

const mb = (fs.statSync(path.join(OUT, "bundle.zip")).size / 1048576).toFixed(1);
console.log("live bundle " + version + " (" + mb + " MB) -> live/");
