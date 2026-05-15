const CACHE_VERSION = 'v3';
const STATIC_CACHE = `imperial-static-${CACHE_VERSION}`;
const API_CACHE = `imperial-api-${CACHE_VERSION}`;
const RUNTIME_CACHE = `imperial-runtime-${CACHE_VERSION}`;

// Only cache the shell — Vite hashed assets are cached at runtime
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Pre-caching app shell');
      return cache.addAll(SHELL_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete any cache that doesn't match our current version
          if (![STATIC_CACHE, API_CACHE, RUNTIME_CACHE].includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Supabase realtime websocket connections
  if (url.pathname.includes('/realtime/') || url.protocol === 'ws:' || url.protocol === 'wss:') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Cache Bible API requests with stale-while-revalidate
  if (url.hostname === 'bible-api.com') {
    event.respondWith(
      caches.open(API_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse); // Fallback to cache on network failure
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Skip Supabase API calls — always fetch fresh
  if (url.hostname.includes('supabase.co')) return;

  // Skip Groq API calls
  if (url.hostname.includes('groq.com')) return;

  // For navigation requests, serve index.html (SPA routing)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // For Vite hashed assets (JS/CSS), cache on first fetch (immutable)
  if (url.pathname.match(/\/assets\/.*\.[a-f0-9]+\.(js|css|woff2?)$/)) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Default: Network-first with cache fallback for other static assets
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse.ok && url.origin === self.location.origin) {
          const responseClone = networkResponse.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
