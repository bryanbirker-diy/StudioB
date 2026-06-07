// sw.js — ours service worker
// Minimal: caches app shell for offline support + enables PWA install prompt.

const CACHE = 'ours-v2';

// Files to pre-cache (app shell)
const PRECACHE = [
  '/',
  '/index.html',
  '/hub.jsx',
  '/firebase-config.js',
  '/firebase-auth.jsx',
  '/projects/Pantry/wireframe-base.css',
  '/projects/Pantry/',
  '/projects/Pantry/index.html',
  '/projects/Pantry/store.js',
  '/projects/Pantry/app.jsx',
  '/projects/Exploring/',
  '/projects/Exploring/index.html',
  '/projects/Exploring/store.js',
  '/projects/Exploring/app.jsx',
];

// Install: pre-cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
      .catch(err => console.warn('sw precache partial failure:', err))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for Firebase/CDN, cache-first for local files
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always go to network for Firebase API calls and CDN scripts
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('unpkg.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('accounts.google.com')
  ) {
    return; // let the browser handle it normally
  }

  // For same-origin requests: cache-first with network fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {
          // Offline and not cached — return hub for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
    );
  }
});
