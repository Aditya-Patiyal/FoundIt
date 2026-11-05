// Minimal service worker — just enough to make the app installable (README §0).
// A real offline/caching strategy is deferred to Step 8 (polish). Keeping a
// fetch handler present is what satisfies the install criteria.

const CACHE = "wapas-shell-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Network-first passthrough. No aggressive caching yet, so nothing goes stale
// while we are still building features.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
