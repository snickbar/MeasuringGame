#!/usr/bin/env python3
"""Batch-delete old Firebase Hosting versions to free storage quota.

Dry run by default: it only lists what it WOULD delete.
  python3 scripts/prune-hosting-versions.py --keep 5            # preview
  python3 scripts/prune-hosting-versions.py --keep 5 --apply    # really delete

Always kept: the newest --keep versions, and any version a channel (live or a preview) is serving.
Auth: env FIREBASE_ACCESS_TOKEN, else `gcloud auth print-access-token` (run `gcloud auth login` first).
"""
import argparse, json, os, subprocess, sys, urllib.request, urllib.error

API = "https://firebasehosting.googleapis.com/v1beta1"


def token():
    t = os.environ.get("FIREBASE_ACCESS_TOKEN")
    if t:
        return t.strip()
    return subprocess.check_output(["gcloud", "auth", "print-access-token"], text=True).strip()


def call(method, url, tok):
    req = urllib.request.Request(url, method=method, headers={"Authorization": "Bearer " + tok})
    with urllib.request.urlopen(req, timeout=60) as r:
        body = r.read()
    return json.loads(body) if body else {}


def paged(url, key, tok):
    out, page = [], ""
    while True:
        sep = "&" if "?" in url else "?"
        data = call("GET", url + sep + "pageSize=100" + ("&pageToken=" + page if page else ""), tok)
        out += data.get(key, [])
        page = data.get("nextPageToken", "")
        if not page:
            return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site", default="measuring-game")
    ap.add_argument("--keep", type=int, default=5, help="newest versions to keep (default 5)")
    ap.add_argument("--apply", action="store_true", help="actually delete (default is a dry run)")
    a = ap.parse_args()
    tok = token()
    base = f"{API}/sites/{a.site}"

    in_use = set()
    for ch in paged(base + "/channels", "channels", tok):
        v = (ch.get("release") or {}).get("version", {}).get("name")
        if v:
            in_use.add(v)

    versions = [v for v in paged(base + "/versions", "versions", tok) if v.get("status") != "DELETED"]
    versions.sort(key=lambda v: v.get("createTime", ""), reverse=True)
    keep = {v["name"] for v in versions[: a.keep]} | in_use
    doomed = [v for v in versions if v["name"] not in keep]

    print(f"{len(versions)} versions, keeping {len(versions) - len(doomed)} (newest {a.keep} + {len(in_use)} in use), deleting {len(doomed)}")
    for v in doomed:
        print(("DELETE " if a.apply else "would delete ") + v["name"].split("/")[-1], v.get("createTime", ""))
        if a.apply:
            try:
                call("DELETE", f"{API}/{v['name']}", tok)
            except urllib.error.HTTPError as e:
                print("  failed:", e.code, e.read()[:200], file=sys.stderr)
    if not a.apply and doomed:
        print("\nDry run only. Add --apply to delete.")


main()
