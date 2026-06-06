// MotusTots service worker — basic offline-capable cache.
const CACHE_NAME = "motustots-cache-v1"
const APP_SHELL = ["/", "/manifest.json", "/favicon.png", "/icons/icon-192.png", "/icons/icon-512.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL).catch(() => {})),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event

  // Only handle GET requests; let the network handle everything else (e.g. Supabase POSTs).
  if (request.method !== "GET") return

  // Never cache cross-origin API calls (e.g. Supabase) — always go to network.
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Network-first for navigations so users get fresh app updates, with cache fallback offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/"))),
    )
    return
  }

  // Cache-first for same-origin static assets.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        const copy = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        return response
      })
    }),
  )
})
