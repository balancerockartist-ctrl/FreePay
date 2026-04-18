/* FreePay Service Worker
 *
 * Provides a basic "cache-first for static assets, network-first for API"
 * caching strategy so the app shell loads instantly on subsequent visits
 * and the app can be installed as a PWA.
 */

const CACHE_NAME = "freepay-v1";

// Static assets to pre-cache on install
const PRECACHE_URLS = ["/", "/index.html", "/static/js/main.chunk.js"];

// ── Install ───────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(
        PRECACHE_URLS.filter((url) => {
          // Silently skip URLs that may not exist in all build configurations
          return true;
        })
      ).catch(() => {
        // Non-fatal: pre-cache failures don't block installation
      })
    )
  );
});

// ── Activate ──────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first for same-origin API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for everything else (static assets, HTML shell)
  event.respondWith(
    caches.match(request).then(
      (cached) => cached ?? fetch(request).then((response) => {
        // Cache successful GET responses
        if (request.method === "GET" && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
    )
  );
});
