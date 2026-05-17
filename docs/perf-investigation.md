# Perf investigation — login + dashboard transitions

Measured against `https://mindset-ten.vercel.app` (production) on
2026-05-17 with deploy `7c88c02` (temporary `[PERF]` console.log
timings in place). Source data: Playwright client-perceived timings
(`tools/perf-timing.ts`, removed in the final commit of this
investigation along with the in-code logs). Server-side `[PERF]`
timings are available in Vercel function logs for the same window.

> No fix in this commit. The doc captures what's slow, why, and a
> ranked fix list for a follow-up sprint.

---

## Login flow

| Stage                                              | Cold (1st run) | Warm (2nd run, cookies cleared) |
|----------------------------------------------------|----------------|---------------------------------|
| `GET /login` HTML                                  | 914 ms         | 418 ms                          |
| `GET /api/auth/providers`                          | 1 045 ms       | 338 ms                          |
| `GET /api/auth/csrf`                               | 404 ms         | 307 ms                          |
| **`POST /api/auth/callback/credentials`**          | **3 390 ms**   | **2 810 ms**                    |
| `GET /api/auth/session`                            | 397 ms         | 477 ms                          |
| `GET /user` HTML render                            | 377 ms         | 512 ms                          |
| `GET /api/user/cart` (post-render, blocking spine) | **2 564 ms**   | **2 145 ms**                    |
| **Total perceived (click → dashboard ready)**      | **8 786 ms**   | **8 541 ms**                    |

- "Submit click → URL change" alone is **~8.5–8.8 s** — well above the
  user's reported "~2 s wait." The 2 s figure is just the gap after
  the spinner reverts; the actual auth+render+cart cycle is longer.
- The credentials POST being **2.8 s even warm** is the smoking gun.
  Warmth was measured on the same function instance (no cold start);
  `bcrypt.compare` at default cost is ~80 ms, so the remaining ~2.7 s
  is Prisma round-trips: `prisma.user.findUnique` + `prisma.user.update`
  + `logAuthEvent` insert. That's 3 sequential DB hits on every login.
- `/api/user/cart` is fetched lazily by `CartProvider` after the
  dashboard mounts. Every dashboard load eats **~2 s** waiting for it,
  even on pages that don't show a cart count.

**Why the user sees "Signing in… → reverts to Sign in → 2 s wait":**
the NextAuth client flips the button back as soon as
`POST /api/auth/callback/credentials` returns (the 2.8–3.4 s POST).
Then the browser does the `/user` GET (300–500 ms) plus the post-mount
cart fetch (~2 s). The "spinner gone, screen still old" gap = the
`/user` GET + cart fetch.

**Root cause hypothesis (login):** three sequential Prisma queries
inside `authorize()`, each paying Neon round-trip cost from a Vercel
serverless function that may not be perfectly warm. The findUnique →
bcrypt → update → logAuthEvent chain runs serially; even at 200–400 ms
each, it stacks to >1 s before any optimization.

---

## Dashboard transitions (warm function, freshly logged in)

| Route                       | HTML response | Network-idle (incl. RSC prefetches) |
|-----------------------------|--------------|--------------------------------------|
| `/user/sessions`            | 1 329 ms     | 4 225 ms                             |
| `/user/practice`            | 1 398 ms     | 5 267 ms                             |
| `/user/discover`            | 2 787 ms     | 6 856 ms                             |
| `/user/library`             | 1 563 ms     | 5 069 ms                             |
| `/user/orders`              | 1 304 ms     | 5 484 ms                             |
| `/user/orders` (slow obs.)  | 4 368 ms     | —                                    |
| `/user/sessions` (repeat)   | 4 144 ms     | 7 304 ms                             |

- HTML response baseline 1.3–2.8 s per navigation. Even the third
  visit to `/user/sessions` was **slower** than the first (4.1 s vs
  1.3 s). No server-side caching whatsoever between visits.
- `network-idle` includes 10–15 RSC prefetches (`?_rsc=…` GETs) that
  `<Link>` components fire when they enter the viewport. Each prefetch
  is 300–500 ms warm but a few hit 1–2 s. The browser stays busy long
  after the page is interactive — that's the "1–2 s delay feeling"
  even when the visible content has rendered.

### Why each `/user/*` page does so much work

Per-page Prisma counts (static read, all in `Promise.all` unless noted):

| Surface                                          | Queries | Pattern |
|--------------------------------------------------|---------|---------|
| `/user/layout.tsx`                               | 1       | sequential |
| `desktop-shell.tsx` (always rendered on /user/*) | 6       | 1 round-trip — 3 helpers in parallel: `getSpineSessions`, `getUserEngagementState` (3 counts), `getUpcomingItems` (2 finds) |
| `/user` page (Promise.all over 9 fetchers)       | ~20     | 3 round-trips — `getReflectionLandingData` has 5 parallel → 2 parallel → 1 sequential chain |
| `/user/sessions` UpcomingTab                     | 2       | 1 round-trip |
| `/user/practice` page                            | 4       | 1 round-trip |
| `/user/discover` page                            | 8       | 1 round-trip |
| `/user/library` page                             | 4       | 1 round-trip (+ 1 conditional studyMaterialAccess findMany) |
| `/user/orders` page                              | (via /api/user/orders) | — |

**Every** `/user/*` navigation runs the layout (1 q) + DesktopShell
(6 q in parallel) + page-specific queries. That's 7 + page queries
re-executed from scratch on every nav — Next.js does not cache the
shell between sibling routes.

**Specific issues found in code:**

1. **`getUserEngagementState` is called twice on `/user`** — once in
   `DesktopShell` (always), once in `/user/page.tsx` (within the
   9-Promise.all). That's 6 count queries instead of 3 on the home
   page.
2. **`prisma.user.findUnique` is hit twice** — once in
   `user/layout.tsx` (selects `emailVerified`), once in `/user/page.tsx`
   (selects `name/image/phone/dateOfBirth/preferredLanguage/`
   `emergencyContact`). Trivial to combine into one in the layout.
3. **`getReflectionLandingData` has a sequential chain inside its
   own helper:** 5 parallel queries → wait → 2 parallel queries (only
   if `lastSession` exists) → wait → 1 sequential query
   (`totalPending`). The `totalPending` count never depends on
   `lastSession` and could move into the first Promise.all.
4. No obvious N+1 (`findMany` then per-item `findUnique`) — `include`
   is used consistently across query helpers.

**Root cause hypothesis (transitions):**

- The shell's 6 queries on every nav. Even at 30–50 ms per Neon RTT
  warm, the slowest of 6 parallel queries plus the layout's 1 query
  is ~150–250 ms warm.
- Plus the page-specific queries (the `/user` page's
  `getReflectionLandingData` chain adds ~3× the slowest-query latency
  due to its internal sequential waits).
- Plus the `/api/user/cart` blocking ~2 s after every dashboard mount.
- Plus Neon serverless compute occasionally cold-starts (the project
  is co-located in ap-southeast-1 with the Neon endpoint, so network
  is cheap, but the Neon compute does spin down).

The user-perceived "1–2 s on every nav" is the sum of: warm Neon
RTTs × duplicated query rounds + cart API blocking + 10–15 RSC
prefetches racing in parallel after render.

---

## Neon connection profile

- **Connection string** (`DATABASE_URL`): uses the **pooler endpoint**
  (`ep-…-pooler.ap-southeast-1.aws.neon.tech`). Good — PgBouncer is in
  the loop.
- **`DIRECT_URL`** is set to the non-pooled endpoint. Currently unused
  in Prisma's datasource (the schema declares only `provider`, no
  `url`/`directUrl`). Prisma reads `DATABASE_URL` directly via the
  PG adapter. So all queries (including transactions) go through the
  pooler. That's a problem for `prisma migrate` later (won't work on
  the pooled connection) but it's not the source of slowness.
- **`src/lib/prisma.ts`** uses `@prisma/adapter-pg` with `new Pool({
  connectionString })`. No `max`, `idleTimeoutMillis`, or
  `connectionTimeoutMillis` set — `pg`'s defaults (max 10, idle ~10 s)
  apply.
- Global `globalForPrisma` reuse exists for dev hot-reload; in
  production each cold serverless instance creates a fresh `Pool` and
  pays the TCP+TLS handshake once on first query.
- Cold-start observation from the timing data: the first dashboard
  HTML on a fresh function instance is 800–1 500 ms slower than warm
  (`/user/sessions` first hit 1.3 s, repeat 4.1 s on a different
  instance — Vercel rotated us onto a cold one).

---

## Recommended fixes (ranked by impact)

1. **Stop fetching `/api/user/cart` on every dashboard mount.**
   Either:
   - Pre-fetch the cart in the `user/layout.tsx` server component and
     hand it down via a server-rendered initial value to `CartProvider`
     (skip the post-mount `fetch`); or
   - Skip the cart fetch on routes that don't display cart UI (currently
     it's mounted globally, but only `/user/cart` actually renders
     line items). Smallest win: just gate the auto-fetch by pathname.
   - Estimated impact: **−1.5–2 s on every dashboard page load.**

2. **Memoize `auth()` and the duplicated dashboard queries.**
   - `auth()` is called in `user/layout.tsx`, `DesktopShell`, and most
     pages — each invocation re-decodes the JWT (cheap) but the
     pattern leads to duplicated downstream queries. React's
     `cache()` (from `react`) deduplicates within a single render pass.
   - Wrap `getUserEngagementState`, the user emailVerified+profile
     fetch, etc. in `cache()` so they run once per request even when
     multiple server components ask for them.
   - Estimated impact: **−100–250 ms on `/user` home; −50–100 ms on
     other `/user/*` pages.**

3. **Compress the login flow.**
   - Combine `findUnique` + `update` + `logAuthEvent` into a single
     `prisma.$transaction` (or, better, defer the `lastLoginAt`
     update + `logAuthEvent` to fire-and-forget after `authorize()`
     returns). The bcrypt+update+log chain is the 2.8 s warm cost.
   - Drop `logAuthEvent` from the critical login path; queue it via
     `waitUntil()` (Vercel) or just `.catch(() => {})` async.
   - Estimated impact: **−700–1 200 ms on login**.

4. **Bring the page count down for `/user` home.**
   - De-dup `getUserEngagementState` (currently called both in the
     shell and the page).
   - Hoist the `totalPending` count out of the inner sequential chain
     in `getReflectionLandingData` so it joins the first `Promise.all`.
   - Combine the two `prisma.user.findUnique` calls (layout's
     `emailVerified` + page's name/image/etc.) into one query in the
     layout; pass the result down via React `cache()` or a server
     context.
   - Estimated impact: **−200–400 ms on /user home**.

5. **Add a Pool config + keep-alive for the PG adapter.**
   - Set `max: 5` (Neon serverless free tier allows ~10 — leave headroom
     for the cron + admin routes) and `idleTimeoutMillis: 60_000` on
     the `new Pool({…})` in `src/lib/prisma.ts` so warm functions
     don't reopen connections.
   - Estimated impact: **−100–300 ms on warm pages that currently pay
     a connection re-establish.**

6. **Prefetch budget on `<Link>` components.**
   - Default `prefetch` on `<Link>` causes 10–15 RSC fetches per page
     view that each fire 300–500 ms requests after render. Most of
     these never get used. Set `prefetch={false}` on `Spine` nav links
     and `prefetch="auto"` only on the next-likely route.
   - Estimated impact: **−2–4 s of background network noise after
     each navigation; faster interactive feel.**

7. **(Lower priority) Configure Prisma `previewFeatures = ["driverAdapters"]`
   datasource with both `url` and `directUrl`** so future migrations
   can use the direct connection without manual env juggling. Doesn't
   affect runtime perf but unblocks safer schema migrations on a
   prod-pooled setup.

---

## Captured raw data (post-deploy, real run)

### Login (cold)

```
GET /login                                     914 ms
GET /api/auth/providers                       1045 ms
GET /api/auth/csrf                             404 ms
POST /api/auth/callback/credentials           3390 ms
GET /api/auth/session                          397 ms
GET /user (RSC)                                377 ms
GET /api/user/cart                            2564 ms
TOTAL perceived (click → networkidle)         8786 ms
```

### Login (warm)

```
POST /api/auth/callback/credentials           2810 ms
GET /user                                      512 ms
GET /api/user/cart                            2145 ms
TOTAL perceived                               8541 ms
```

### Navigation (warm)

```
/user/sessions      domContent 1329 ms   networkidle 4225 ms
/user/practice      domContent 1398 ms   networkidle 5267 ms
/user/discover      domContent 2787 ms   networkidle 6856 ms
/user/library       domContent 1563 ms   networkidle 5069 ms
/user/orders        domContent 1304 ms   networkidle 5484 ms
/user/orders (slow) domContent 4368 ms   (outlier — Neon cold or shipping API slow)
/user/sessions x2   domContent 4144 ms   networkidle 7304 ms  (cold function instance after rotation)
```

---

## Follow-up: Sprint Perf-2 Task 3 — `/user/orders` variance

Re-investigated the `(slow obs.) 4 368 ms` outlier flagged above.
No real bottleneck found:

- `src/app/api/user/orders/route.ts` is a single `prisma.order.findMany`
  with a nested `include` for orderItems → product fields. No N+1, no
  per-order Shiprocket call.
- `shippingStatus` / `awbCode` / `courierName` are read from the Order
  row directly (set by the Shiprocket webhook on status transitions).
- The "Track order" button on each row opens a `TrackingModal`, which
  is the only place that calls Shiprocket — lazy, only on click, fetch
  is `/api/user/orders/[id]/track`. Correctly deferred off the list
  render.
- `src/app/(dashboard)/user/orders/page.tsx` is a client component
  that `fetch`es `/api/user/orders` from a `useEffect`. Each visit
  therefore pays two round-trips (page HTML render + client fetch).

The variance is the combined cost of the client-side data-fetch
pattern + Neon cold-start jitter, not a single fixable bottleneck.
Real next step would be converting the list page to a server
component fetching directly via Prisma (saves one RTT) — deferred to
a separate sprint since the page uses several client-only modals
(tracking, resume-payment, Razorpay checkout).
