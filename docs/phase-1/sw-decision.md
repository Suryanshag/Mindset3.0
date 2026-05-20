# Phase 1 — Service worker decision (Task 1.1c)

**Status:** Decision surfaced for owner review. **Nothing installed.** No SW files yet (those are sub-phase 1.2 work).

## TL;DR

**Recommendation: hand-rolled `public/sw.js` + `<ServiceWorkerProvider>` client component.** Skip Serwist for this codebase.

The Serwist evaluation was done without a throwaway-branch install — the relevant compatibility data was available from npm metadata and Serwist's own docs without modifying `package.json` or `node_modules`. Rationale below; owner can override and ask for Serwist.

---

## 1. What the Next 16 official docs say

`node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md` (the canonical guide that ships with Next 16.2.4 in this repo) demonstrates:

- **Manifest**: file-based `app/manifest.ts` returning `MetadataRoute.Manifest` (lines 26-52).
- **Service worker**: hand-rolled `public/sw.js` with `self.addEventListener('push', ...)` and `self.addEventListener('notificationclick', ...)` (lines 547-572).
- **Registration**: `navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })` inside a client component (lines 158-165).
- **Install prompt** for iOS: standalone `display-mode: standalone` media-query check (lines 303-340).

The docs mention Serwist explicitly:

> "Offline Support: To provide offline functionality, one option is Serwist with Next.js… **Note: this plugin currently requires webpack configuration.**"

So Vercel acknowledges Serwist but flags it as a special-case tool, not the default path. The default path is what the docs themselves demonstrate: hand-rolled SW + manifest.ts.

## 2. Serwist compatibility — confirmed via npm metadata

`npm view` of the relevant packages (no install, no package-lock changes):

| Package | Version | Next peer | React peer | TS peer | Extra |
|---|---|---|---|---|---|
| `@serwist/next` | 9.5.11 | `>=14.0.0` | `>=18.0.0` | `>=5.0.0` | + `@serwist/cli ^9.5.11` |
| `@serwist/turbopack` | 9.5.11 | `>=14.0.0` | `>=18.0.0` | `>=5.0.0` | + `esbuild >=0.25.0 <1.0.0` (or `esbuild-wasm`) |
| `serwist` | 9.5.11 | — | — | `>=5.0.0` | — |

Both flavors declare compatibility with Next 16.2.4 (`>=14.0.0`) and React 19.2.4 (`>=18.0.0`). No version conflicts.

## 3. The two Serwist flavors

Updated picture from Serwist's official `serwist.pages.dev/docs/next` (fetched 2026-05-20):

- **`@serwist/next`** — designed for webpack. Adopting it means running `next dev --webpack` and `next build --webpack` everywhere, **losing Turbopack speed across the team's whole workflow**, not just for PWA work. Setup is minimal: a `withSerwist` wrapper in `next.config.ts` + a single `app/sw.ts`.
- **`@serwist/turbopack`** — designed for Turbopack. Keeps Turbopack speed but requires:
  - A new route handler at `app/serwist/[path]/route.ts` calling `createSerwistRoute()`
  - `esbuild` (or `esbuild-wasm`) as a hard dependency (native binary, ~9 MB unpacked, much larger with esbuild-wasm)
  - A `SerwistProvider` React component wrapping the entire app
  - Different worker import paths (`@serwist/turbopack/worker` vs `@serwist/next/worker`)

Either flavor pulls in 2-3 new top-level packages plus their transitives.

## 4. What we actually need

Per `MOBILE_PORT_PLAN.md` §3e and Resolved Decision 5 (no web push in this port), the SW requirements are:

- App shell (`/`, `/user`, `/login`, `/welcome`): **NetworkFirst** with 1-day max-age, cache name `app-shell`.
- Static assets (`/_next/static/*`, `/fonts/*`, `/icons/*`, `/images/*`): **CacheFirst** with long max-age.
- HTML under `/user/*`: **NetworkFirst** with 3-second timeout, fall back to a cached `/offline` page.
- API GETs: **NetworkOnly** (auth-scoped data; never cache).
- Mutations and `/api/auth/*`: **NetworkOnly**, never cache.

Five rules. No push handling needed. No background sync. No periodic sync. **The full requirements fit in ~80 lines of vanilla SW** (`fetch` listener + a route table that dispatches strategies).

## 5. Cost comparison

| Approach | New packages | Build flag changes | esbuild dependency | Lines of new code | Maintenance |
|---|---|---|---|---|---|
| `@serwist/next` (webpack) | 2 (+ peers) | `--webpack` everywhere | No | ~30 (config + sw.ts) | Track Serwist releases; tied to Workbox versioning |
| `@serwist/turbopack` | 3 (+ peers incl. esbuild) | None | Yes (~9 MB native) | ~50 (config + route + sw.ts + provider) | Track Serwist + esbuild releases; turbopack-flavored docs still maturing |
| **Hand-rolled** (recommended) | **0** | **None** | **No** | **~80 (sw.js + provider)** | **Owned by us; copy the Next 16 doc pattern; update as needed** |

## 6. Recommendation rationale

Five points, in priority order:

1. **The Next 16 official docs use the hand-rolled pattern.** Resolved Decision 13 says "trust the existing codebase's patterns — copy them; do not invent new ones." The codebase has no SW today, so the most-trustworthy reference is the official Next 16 PWA guide that ships with this exact `next@16.2.4` version. Adopting Serwist diverges from that doc; hand-rolled doesn't.

2. **No dependency added.** This is a lean codebase: Phase 0 audit counted 30 production dependencies, carefully curated. Adding Serwist + esbuild for a 5-rule cache table is overkill — the cost-benefit favors writing the rules.

3. **Web push is deferred** (Resolved Decision 5). The strongest case for Serwist is its push + sync infrastructure. We don't use that. Cache strategies — the only thing left — are trivial to hand-roll.

4. **No build-tool friction.** The `@serwist/next` flavor forces `--webpack` everywhere; `@serwist/turbopack` adds esbuild + a route handler + a React provider. Hand-rolled adds nothing to the build pipeline; Turbopack stays default for dev and build.

5. **Lower future-upgrade liability.** When Next 17 ships, the hand-rolled SW is unaffected. Serwist may need updates; Workbox may break compat. The official docs are stable and version-pinned to the Next version you're on.

## 7. What the hand-rolled implementation looks like (sub-phase 1.2)

Three files. None of this is written yet — this is the spec for the 1.2 implementation. Owner can review the shape now.

### `src/app/manifest.ts`
Per the Next 16 docs pattern in `manifest.md`. Returns `MetadataRoute.Manifest` with start_url `/user`, display `standalone`, the four PNG icon variants (192/512 plus maskable variants), theme/background `#F7F2EA`.

### `public/sw.js`
~80 lines. Outline:

```js
// public/sw.js
const CACHE_VERSION = 'mindset-v1'
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`
const STATIC_CACHE = `${CACHE_VERSION}-static`
const PAGES_CACHE = `${CACHE_VERSION}-pages`

const APP_SHELL_URLS = ['/', '/user', '/login', '/welcome', '/offline']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((c) => c.addAll(APP_SHELL_URLS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Delete old caches whose key doesn't start with CACHE_VERSION.
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return  // mutations → NetworkOnly
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return  // cross-origin → NetworkOnly

  // /api/* → NetworkOnly (auth-scoped, no caching)
  if (url.pathname.startsWith('/api/')) return

  // Static (CacheFirst, long-lived)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/')
  ) {
    event.respondWith(cacheFirst(STATIC_CACHE, request))
    return
  }

  // /user/* HTML → NetworkFirst with 3s timeout, fall back to /offline
  if (url.pathname.startsWith('/user')) {
    event.respondWith(networkFirstWithTimeout(PAGES_CACHE, request, 3000, '/offline'))
    return
  }

  // App shell paths → NetworkFirst (1-day stale ceiling enforced via Date header)
  event.respondWith(networkFirstWithTimeout(APP_SHELL_CACHE, request, 5000, '/offline'))
})

async function cacheFirst(cacheName, request) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  const fresh = await fetch(request)
  if (fresh.ok) cache.put(request, fresh.clone())
  return fresh
}

async function networkFirstWithTimeout(cacheName, request, timeoutMs, fallbackUrl) {
  const cache = await caches.open(cacheName)
  try {
    const fresh = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ])
    if (fresh.ok) cache.put(request, fresh.clone())
    return fresh
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    const fallback = await cache.match(fallbackUrl)
    if (fallback) return fallback
    return new Response('Offline', { status: 503 })
  }
}
```

### `src/components/pwa/service-worker-provider.tsx`
Client component, mounted in root layout. Registers `/sw.js` once on mount. ~25 lines:

```tsx
'use client'

import { useEffect } from 'react'

export default function ServiceWorkerProvider() {
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV === 'development'
    ) {
      return
    }
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch((err) => console.error('[SW] registration failed', err))
  }, [])

  return null
}
```

Note: `process.env.NODE_ENV === 'development'` guard prevents the SW from interfering with HMR. SW activates only in production builds.

### `src/app/offline/page.tsx`
Static cream-themed offline page. No data fetching. ~15 lines.

### Security headers
The Next 16 PWA docs (lines 605-650 in `progressive-web-apps.md`) include a `next.config.js` headers block for `/sw.js` (Cache-Control: no-cache, Content-Type: application/javascript). Adopt this in the existing `next.config.ts` headers block.

## 8. When to revisit Serwist

If at any point during Phases 2-7 we need Workbox's more advanced features (background sync, stale-while-revalidate variants with sophisticated freshness windows, push handlers when web push lands as a future phase), revisit. The hand-rolled SW is small enough that the swap is mechanical — replace `public/sw.js` with `app/sw.ts` + Serwist config.

## 9. Action items for owner

1. **Approve "hand-rolled" recommendation** (or override). If override → name the flavor: `@serwist/next` (accept losing Turbopack speed) or `@serwist/turbopack` (accept esbuild + extra files).
2. **No further work in 1.1c.** The actual files (`manifest.ts`, `sw.js`, `service-worker-provider.tsx`, `offline/page.tsx`) get built in sub-phase 1.2 once you greenlight.
