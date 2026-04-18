// Free Pay ♾️ Service Worker — CC0 License
// Provides offline shell caching so the app is installable to the home screen
// and functions without a network connection (camera + local state still work).

const CACHE_NAME = "freepay-7g-v1";

// Static assets to pre-cache on install
const PRECACHE_URLS = ["/", "/index.html", "/manifest.json"];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch — Network-first for API, Cache-first for static assets ─────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests: always try network first, no caching
  if (url.pathname.startsWith("/api/")) {
    const offlineResponse = new Response(
      JSON.stringify({ error: "offline" }),
      { headers: { "Content-Type": "application/json" } }
    );
    event.respondWith(fetch(request).catch(() => offlineResponse));
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const cloned = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
        }
        return networkResponse;
      });
    })
  );
});
