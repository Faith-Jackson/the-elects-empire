const CACHE_NAME = 'imperial-empire-v2';
const STATIC_CACHE = 'imperial-static-v2';
const API_CACHE = 'imperial-api-v1';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.tsx',
  // Vite assets will be handled by the fetch listener normally, 
  // but we can add key entry points.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Static assets cached');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log('Deleting old cache:', cacheName);
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

  // Cache Bible API requests
  if (url.hostname === 'bible-api.com') {
    event.respondWith(
      caches.open(API_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Standard Stale-While-Revalidate for other assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(STATIC_CACHE).then((cache) => {
          if (event.request.method === 'GET' && !url.pathname.startsWith('/api')) {
            cache.put(event.request, networkResponse.clone());
          }
        });
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});
