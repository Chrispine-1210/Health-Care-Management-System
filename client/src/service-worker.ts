/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'thandizo-v3';
const CACHE_PREFIX = 'thandizo-';
const STATIC_DESTINATIONS = new Set(['script', 'style', 'image', 'font', 'manifest']);
const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Thandizo Healthcare Offline</title><style>body{font-family:system-ui,sans-serif;margin:0;display:grid;min-height:100vh;place-items:center;background:#f8fafc;color:#0f172a}.card{max-width:34rem;margin:1rem;padding:2rem;border-radius:1.5rem;background:white;box-shadow:0 20px 50px rgba(15,23,42,.12)}h1{margin:0 0 .75rem;color:#15803d}</style></head><body><main class="card"><h1>Thandizo Healthcare is offline</h1><p>Please reconnect to the internet and refresh. We avoid serving stale healthcare screens so you always see current clinical and order information.</p></main></body></html>`;

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(self.skipWaiting());
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

async function networkOnlyNavigation(request: Request) {
  try {
    return await fetch(request, { cache: 'no-store' });
  } catch {
    return new Response(OFFLINE_HTML, {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

async function networkFirst(request: Request) {
  try {
    const response = await fetch(request);
    if (shouldCacheResponse(response)) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) || new Response('Offline - cached data unavailable', { status: 503 });
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
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (shouldCacheResponse(response)) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
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
