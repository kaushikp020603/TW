/* THE ARCANA service worker: offline fallback + fast repeat visits.
   - Pages: network first; if offline, show the last copy you visited, else /offline.
   - Static assets (JS/CSS/fonts/images/icons): cache first, refreshed in the background.
   - Never touches /api or /admin, so bookings and the admin portal always use live data. */
const VERSION = "arcana-v1";
const SHELL = ["/offline", "/icons/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

const isStatic = (u) => u.pathname.startsWith("/_next/static/") || u.pathname.startsWith("/img/") || u.pathname.startsWith("/icons/") || /\.(?:woff2?|png|jpg|jpeg|webp|svg|ico)$/.test(u.pathname);

self.addEventListener("fetch", (e) => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;

  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); } return res; })
      .catch(async () => (await caches.match(req)) || (await caches.match("/offline")) || new Response("Offline", { status: 503 })));
    return;
  }
  if (isStatic(url)) {
    e.respondWith(caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); } return res; }).catch(() => hit);
      return hit || net;
    }));
  }
});
