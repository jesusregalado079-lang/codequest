// Page loads (HTML) are network-first so an update always shows on next open;
// other assets are stale-while-revalidate for speed. Both fall back to cache
// offline. Bump CACHE to force a clean purge when the caching logic changes.
const CACHE = 'codequest-v2';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;

  // HTML navigations: always try the network first, fall back to cache offline.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        try {
          const res = await fetch(e.request);
          if (res.ok) cache.put(e.request, res.clone());
          return res;
        } catch {
          return (await cache.match(e.request)) || (await cache.match('index.html'));
        }
      })
    );
    return;
  }

  // Everything else: serve cached instantly, refresh in the background.
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request);
      const fresh = fetch(e.request)
        .then((res) => {
          if (res.ok) cache.put(e.request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});
