// Website only (index.html does not register it inside the Android app, and removes one an older version installed there).
// Network first; the cached copy is only used when the network fails, so the game opens offline after a visit.
const CACHE = "measuring-game-v2";

self.addEventListener("activate", (event) => {
  // v1 cached every request it saw, forever. Drop it (and any other old cache).
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Only plain page loads: no POSTs, no database or sign-in traffic (those cannot be cached and failed loudly before).
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin && url.hostname !== "www.gstatic.com") return;
  event.respondWith(
    fetch(req)
      .then((response) => {
        if (response.ok && (response.type === "basic" || response.type === "cors")) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(req))
  );
});
