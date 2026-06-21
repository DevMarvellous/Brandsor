/* Brandsor service worker — intentionally minimal and conservative.
 * It exists to make the app installable and to give a graceful offline fallback.
 * It NEVER caches API responses, auth, or cross-origin requests (Supabase, Gemini,
 * Google Fonts) so it can't serve stale or another user's data. */
const CACHE = "brandsor-v1";
const APP_SHELL = ["/", "/dashboard", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Only handle our own origin; leave Supabase/Gemini/fonts/etc. untouched.
  if (url.origin !== self.location.origin) return;
  // Never cache API routes — they're per-user and must always be fresh.
  if (url.pathname.startsWith("/api/")) return;

  // Navigations: network-first, fall back to cache (then the app shell) offline.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(req);
        } catch {
          const cache = await caches.open(CACHE);
          return (await cache.match(req)) || (await cache.match("/")) || Response.error();
        }
      })()
    );
    return;
  }

  // Static build assets: cache-first (they're content-hashed and immutable).
  if (url.pathname.startsWith("/_next/") || APP_SHELL.includes(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const fresh = await fetch(req);
          if (fresh.ok) cache.put(req, fresh.clone());
          return fresh;
        } catch {
          return cached || Response.error();
        }
      })()
    );
  }
});
