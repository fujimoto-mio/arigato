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

// --- Web Push: show a notification when a tip/review arrives ---
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "ARIGATO TiP", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "ARIGATO TiP";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.tag || "arigato-tip",
    renotify: true,
    data: { url: data.url || "/admin/notifications" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/admin/notifications";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus an existing admin tab if one is open; otherwise open a new one.
      for (const client of clients) {
        if (client.url.includes("/admin") && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
