// Minimal service worker so the admin panel is installable as a PWA.
// It doesn't cache aggressively (the dashboard must stay live) — it just
// satisfies the install criteria and passes requests through to the network,
// falling back to the cached shell only when offline.
const CACHE = "arigato-admin-v1";
const SHELL = ["/admin", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Keep a fresh copy of navigations for an offline fallback.
        if (request.mode === "navigate") {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached ?? caches.match("/admin"))),
  );
});
