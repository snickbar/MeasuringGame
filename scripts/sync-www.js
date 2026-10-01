// Copies the static web app (the actual source of truth lives at the repo
// root, same as the Firebase Hosting deploy) into www/, which is purely a
// generated Capacitor build input - never hand-edit anything under www/,
// run this (or `npm run sync`) instead and it'll be rebuilt fresh every time.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const WWW = path.join(ROOT, "www");

const FILES = ["index.html", "manifest.json", "sw.js", "privacy.html", "icon-192.png", "icon-512.png", "home-bg.jpg"];
const DIRS = ["icons", "avatars", "sfx"];

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

fs.rmSync(WWW, { recursive: true, force: true });
fs.mkdirSync(WWW, { recursive: true });

for (const f of FILES) {
  fs.copyFileSync(path.join(ROOT, f), path.join(WWW, f));
}
for (const d of DIRS) {
  copyDir(path.join(ROOT, d), path.join(WWW, d));
}

console.log("www/ synced from repo root (" + FILES.length + " files, " + DIRS.length + " folders).");
