/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = "thandizo-v3";
const CACHE_PREFIX = "thandizo-";
const STATIC_DESTINATIONS = new Set(["script", "style", "image", "font", "manifest"]);
const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Thandizo Healthcare Offline</title><style>body{font-family:system-ui,sans-serif;margin:0;display:grid;min-height:100vh;place-items:center;background:#f8fafc;color:#0f172a}.card{max-width:34rem;margin:1rem;padding:2rem;border-radius:1.5rem;background:white;box-shadow:0 20px 50px rgba(15,23,42,.12)}h1{margin:0 0 .75rem;color:#15803d}</style></head><body><main class="card"><h1>Thandizo Healthcare is offline</h1><p>Please reconnect to the internet and refresh. We avoid serving stale healthcare screens so you always see current clinical and order information.</p></main></body></html>`;

function deleteOldCaches() {
  return caches.keys().then((cacheNames) => {
    const deletions = cacheNames
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name));

    return Promise.all(deletions).then(() => undefined);
  });
}

function shouldCacheResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  return response.ok && !contentType.includes("text/html");
}

function offlineNavigationResponse() {
  return new Response(OFFLINE_HTML, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function networkOnlyNavigation(request: Request) {
  return fetch(request, { cache: "no-store" }).catch(() => offlineNavigationResponse());
}

function cacheResponse(request: Request, response: Response) {
  if (!shouldCacheResponse(response)) return Promise.resolve();

  return caches.open(CACHE_NAME).then((cache) => {
    return cache.put(request, response.clone());
  });
}

function networkFirst(request: Request) {
  return fetch(request)
    .then((response) => {
      return cacheResponse(request, response).then(() => response);
    })
    .catch(() => {
      return caches.match(request).then((cached) => {
        return cached || new Response("Offline - cached data unavailable", { status: 503 });
      });
    });
}

function cacheFirst(request: Request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;

    return fetch(request).then((response) => {
      return cacheResponse(request, response).then(() => response);
    });
  });
}

self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(deleteOldCaches().then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event: FetchEvent) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname === "/service-worker.js") return;

  if (event.request.mode === "navigate") {
    event.respondWith(networkOnlyNavigation(event.request));
    return;
  }

  if (url.pathname.startsWith("/api")) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (STATIC_DESTINATIONS.has(event.request.destination)) {
    event.respondWith(cacheFirst(event.request));
  }
});

self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || "New notification from Thandizo Healthcare",
    icon: "/manifest.json",
    badge: "/manifest.json",
    tag: data.tag || "notification",
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(self.registration.showNotification(data.title || "Thandizo Healthcare", options));
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("navigate" in client) {
          return (client as WindowClient).navigate("/orders");
        }
      }

      if (clients.openWindow) {
        return clients.openWindow("/orders");
      }
    }),
  );
});
