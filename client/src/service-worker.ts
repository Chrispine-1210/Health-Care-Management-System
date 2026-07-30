/// <reference lib="webworker" />

const sw = globalThis as unknown as ServiceWorkerGlobalScope;

const CACHE_PREFIX = 'thandizo-';
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const APP_SHELL_URL = '/index.html';
const PRECACHE_URLS = [APP_SHELL_URL, '/manifest.json'];
const STATIC_DESTINATIONS = new Set(['script', 'style', 'image', 'font', 'manifest']);

sw.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => sw.skipWaiting()),
  );
});

sw.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      ))
      .then(() => sw.clients.claim()),
  );
});

function shouldCacheResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type') || '';
  return response.ok && !contentType.includes('text/html');
}

async function networkFirst(request: Request): Promise<Response> {
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

async function cacheFirst(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (shouldCacheResponse(response)) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkOnlyNavigation(request: Request): Promise<Response> {
  try {
    return await fetch(request);
  } catch {
    return (await caches.match(APP_SHELL_URL)) || new Response('Offline', { status: 503 });
  }
}

sw.addEventListener('fetch', (event: FetchEvent) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== sw.location.origin || url.pathname === '/service-worker.js') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(networkOnlyNavigation(event.request));
    return;
  }

  if (url.pathname.startsWith('/api')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (STATIC_DESTINATIONS.has(event.request.destination)) {
    event.respondWith(cacheFirst(event.request));
  }
});

sw.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(sw.registration.showNotification(data.title || 'Thandizo Healthcare', {
    body: data.body || 'New notification from Thandizo Healthcare',
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: data.tag || 'notification',
    requireInteraction: Boolean(data.requireInteraction),
  }));
});

sw.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      const client = clientList[0] as WindowClient | undefined;
      if (client) {
        await client.navigate('/orders');
        return client.focus();
      }
      return sw.clients.openWindow('/orders');
    }),
  );
});
