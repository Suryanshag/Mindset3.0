// Mindset service worker.
//
// Hand-rolled per Next 16's official PWA guide
// (node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md).
// No Workbox / Serwist dependency. Cache strategy table per
// docs/phase-1/sw-decision.md §7.
//
// Cache strategy summary:
//   /_next/static/*, /fonts/*, /icons/*, /images/* → CacheFirst (long-lived)
//   /user/* HTML, /doctor/* HTML                   → NetworkFirst, 3s timeout, /offline fallback
//   App shell + everything else                    → NetworkFirst, 5s timeout, /offline fallback
//   GET requests only — mutations, /api/*, /api/auth/* fall through to network
//
// Bump CACHE_VERSION on any meaningful change. The activate handler deletes
// every cache whose key doesn't start with the current version, so old caches
// are evicted on next activation. skipWaiting()+clients.claim() let the new
// worker take control without a page reload (acceptable since the SW only
// caches non-sensitive shells; logged-in data goes through the live API).

const CACHE_VERSION = 'mindset-v2'
const APP_SHELL_CACHE = CACHE_VERSION + '-shell'
const STATIC_CACHE = CACHE_VERSION + '-static'
const PAGES_CACHE = CACHE_VERSION + '-pages'

const APP_SHELL_URLS = [
  '/',
  '/login',
  '/welcome',
  '/offline',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((c) => c.addAll(APP_SHELL_URLS).catch((err) => {
        // App-shell pre-cache must not block the SW from activating —
        // a single 404 in dev would otherwise wedge install.
        console.warn('[SW] app-shell precache partial', err)
      }))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(CACHE_VERSION))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Auth-scoped or sensitive: never cache. Let the network handle it
  // (NetworkOnly via fall-through — no event.respondWith() call).
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/_next/data/')) return

  // Long-lived static assets — CacheFirst.
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname === '/apple-touch-icon.png' ||
    url.pathname === '/favicon.ico'
  ) {
    event.respondWith(cacheFirst(STATIC_CACHE, request))
    return
  }

  // User dashboard HTML + doctor dashboard HTML — NetworkFirst with a tight
  // 3s timeout to keep perceived load fast on flaky networks, falling back
  // to a cached version and finally /offline. Both surfaces are authed,
  // session-rendered shells; the data layer always re-fetches live, so
  // serving a stale shell while a doctor's session list loads is acceptable.
  if (
    url.pathname.startsWith('/user') ||
    url.pathname.startsWith('/doctor')
  ) {
    event.respondWith(
      networkFirstWithTimeout(PAGES_CACHE, request, 3000, '/offline')
    )
    return
  }

  // Everything else (marketing, auth, public catalog pages) — NetworkFirst
  // with a more lenient 5s timeout. Same /offline fallback.
  event.respondWith(
    networkFirstWithTimeout(APP_SHELL_CACHE, request, 5000, '/offline')
  )
})

async function cacheFirst(cacheName, request) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  try {
    const fresh = await fetch(request)
    if (fresh.ok && fresh.status < 400) {
      // .clone() because the response body is a one-shot stream.
      cache.put(request, fresh.clone()).catch(() => {})
    }
    return fresh
  } catch (err) {
    // No network and no cache. Return a stub so the page doesn't hard-fail.
    return new Response('', { status: 504, statusText: 'Gateway Timeout' })
  }
}

async function networkFirstWithTimeout(cacheName, request, timeoutMs, fallbackUrl) {
  const cache = await caches.open(cacheName)
  try {
    const fresh = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeoutMs)
      ),
    ])
    if (fresh && fresh.ok && fresh.status < 400) {
      cache.put(request, fresh.clone()).catch(() => {})
    }
    return fresh
  } catch (err) {
    const cached = await cache.match(request)
    if (cached) return cached
    const fallback = await caches.match(fallbackUrl)
    if (fallback) return fallback
    return new Response(
      '<h1>Offline</h1><p>Please reconnect to use Mindset.</p>',
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }
}
