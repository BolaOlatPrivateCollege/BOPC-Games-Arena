// Service Worker for BOPC Games Arena
const CACHE_VERSION = 'v2'
const CACHE_NAME = `bopc-games-arena-cache-${CACHE_VERSION}`
// Keep a small set of static assets cached; avoid precaching index.html to prevent stale HTML
const ASSETS_TO_CACHE = [
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  )
  // Activate this service worker as soon as it's finished installing
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key)
        })
      )
    )
  )
  // Take control of uncontrolled clients as soon as possible
  self.clients.claim()

  // Notify clients that a new service worker is active
  event.waitUntil(
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        try {
          client.postMessage({ type: 'SW_ACTIVATED', version: CACHE_VERSION })
        } catch (e) {}
      })
    })
  )
})

// Allow the page to tell the SW to skip waiting and activate immediately
self.addEventListener('message', (event) => {
  if (!event.data) return
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const acceptHeader = event.request.headers.get('accept') || ''

  // For navigation requests (HTML pages), use network-first strategy
  if (event.request.mode === 'navigate' || acceptHeader.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Update the cache for the navigation request with the latest HTML
          const copy = networkResponse.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy))
          return networkResponse
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match('/index.html')
        })
    )
    return
  }

  // For other requests (assets), use cache-first then network fallback
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse
      return fetch(event.request).then(networkResponse => {
        // Only cache same-origin, successful responses
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone))
        }
        return networkResponse
      }).catch(() => {
        // no-op: let browser handle missing resources (may show errors)
      })
    })
  )
})
