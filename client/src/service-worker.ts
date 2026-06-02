/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'thandizo-v2';
const APP_SHELL_URL = '/index.html';
const PRECACHE_URLS = [APP_SHELL_URL, '/manifest.json'];
const STATIC_DESTINATIONS = new Set(['script', 'style', 'image', 'font', 'manifest']);

// Install event - cache only the app shell and stable public metadata. Avoid
// caching '/' so a bad navigation response cannot become the permanent startup
// page for the app.
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Gracefully handle failures
        console.log('Some assets failed to cache');
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      ))
      .then(() => self.clients.claim()),
  );
});

function shouldCacheResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';

  return response.ok && !contentType.includes('text/html');
}

function networkFirst(request: Request, fallbackUrl?: string) {
  return fetch(request).then((response) => {
    if (shouldCacheResponse(response)) {
      const responseClone = response.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, responseClone);
      });
    }
    return response;
  }).catch(() => {
    return caches.match(request).then((cached) => {
      if (cached) return cached;
      if (fallbackUrl) return caches.match(fallbackUrl);
      return undefined;
    }).then((cached) => {
      return cached || new Response('Offline - cached data unavailable', { status: 503 });
    });
  });
}

// Fetch event - network first for navigations/API, cache first for immutable assets
self.addEventListener('fetch', (event: FetchEvent) => {
  if (event.request.method !== 'GET') {
    return;
  }
}

self.addEventListener('fetch', (event: FetchEvent) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname === '/service-worker.js') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(networkOnlyNavigation(event.request));
    return;
  }

  if (url.pathname.startsWith('/api')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (!STATIC_DESTINATIONS.has(event.request.destination)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (shouldCacheResponse(response)) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    }),
  );
});

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'New notification from Thandizo Healthcare',
    icon: '/manifest.json',
    badge: '/manifest.json',
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Thandizo Healthcare', options),
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('navigate' in client) {
          return (client as WindowClient).navigate('/orders');
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/orders');
      }
    }),
  );
});
