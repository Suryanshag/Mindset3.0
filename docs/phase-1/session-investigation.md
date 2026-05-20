# Session-persistence investigation

**Status (2026-05-20):** Findings surfaced for owner review. **No code changes proposed yet.** The owner's stated concern was: "always having to log in seems bad" — this document validates whether that concern reflects current behavior or whether the existing config is fine. Spoiler: **the existing config is fine for common PWA launches; the one realistic risk is users who skip >30 days, which is plausible for a wellness app.**

Evidence cited as `path:line` against the repo + `node_modules/next-auth/node_modules/@auth/core/src/`.

---

## 1. NextAuth session config

`src/lib/auth.ts:28`: `session: { strategy: 'jwt' }`. That is the only `session` field in the NextAuth options.

**No explicit `maxAge` or `updateAge` set.** So defaults apply.

NextAuth v5 (auth.js core 0.x) defaults, from `@auth/core/src/lib/init.ts`:
- Line 71: `const maxAge = 30 * 24 * 60 * 60` — **30 days** of idle lifetime.
- Line 119: `updateAge: 24 * 60 * 60` — **24 hours** between automatic JWT re-issues.
- Line 126: `jwt.maxAge` mirrors `session.maxAge` (also 30 days) when JWT strategy is in use.

In short: a returning user has 30 days of idle grace before re-auth is required. Each successful page load on day N within the window resets the clock; the JWT is re-encoded with a fresh `exp` once per 24 hours when the user is active.

## 2. Cookie configuration

No `cookies` block in `src/lib/auth.ts`. Defaults apply.

NextAuth v5 default for the session-token cookie (`@auth/core/src/lib/utils/cookie.ts:63-71`):

```ts
sessionToken: {
  name: `${cookiePrefix}authjs.session-token`,   // "__Secure-authjs.session-token" in prod
  options: {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: useSecureCookies,                    // true in production / HTTPS
  },
}
```

Notice: **no `maxAge` in the static defaults table.** This is by design — the cookie's `Max-Age` is set dynamically at write time, derived from `session.maxAge` (30 days). The session cookie is therefore **persistent**, not session-only. It survives:

- Browser close
- Tab close
- PWA "swipe-away" (Android task switcher) and re-launch
- Phone reboot (within the 30-day window)

The cookie is killed only on explicit deletion (signOut, manual cookie-clear, browser data clear, expiration).

**Implication for PWA standalone mode:** returning users do NOT face a session-only cookie. Cold PWA launches reuse the existing `__Secure-authjs.session-token`. There's no "inadvertent logout on cold launch" risk.

## 3. Strategy: JWT (not database)

`src/lib/auth.ts:28`. The session is a JWT carrying `id` + `role` (see `callbacks.jwt` and `callbacks.session` at lines 162-180). No `Session` DB table is consulted per request — the cookie itself is the source of truth.

This is desirable for PWA: cold launches don't pay a DB round-trip just to confirm the user is still logged in. The JWT is verified with the local `AUTH_SECRET` and decoded into the session object.

The Prisma adapter (`PrismaAdapter(prisma)` at line 27) is still wired in — it handles user/account row creation on Google sign-in via the `linkAccount` event (line 183). It does NOT issue or look up Session rows because strategy is JWT.

## 4. `updateAge` behavior

Default 24 hours. Meaning: if the user opens the app and the JWT was last re-encoded > 24 hours ago, NextAuth quietly re-issues a fresh JWT (same identity, fresh `iat` / `exp`). The 30-day idle clock starts again from the moment of re-issue.

Practical consequence:

- A user who opens the PWA at least once per day **effectively never expires** — their token gets refreshed daily, and each refresh extends the 30-day idle horizon.
- A user who opens the PWA weekly: refreshed weekly, never expires either.
- A user who opens the PWA monthly (~28-30 days between launches): borderline. If the gap is ≤ 30 days, refreshed and continues. If > 30 days, expired → forced re-auth.

For a mental health platform, monthly gaps are common (especially during low-activity periods between therapy session blocks). **This is the one realistic re-auth scenario.**

## 5. `/splash` redirect behavior with a valid session

`/splash` doesn't exist yet (sub-phase 1.3 work). But the redirect path will be the same as the existing dashboard layout uses: server-side `await auth()` to read the JWT cookie, then `redirect('/user')` if authed, `redirect('/welcome')` if not.

The `auth()` helper exported from `src/lib/auth.ts:25` is the NextAuth v5 server-side session reader. It:
1. Reads the `__Secure-authjs.session-token` cookie
2. Verifies the JWT signature with `AUTH_SECRET`
3. Returns `{ user: { id, role, ... } } | null`

For a returning PWA user with a valid (non-expired) cookie: `auth()` returns the session synchronously (no DB hit) → `redirect('/user')`. **No login prompt.** Confirmed by tracing the same flow on the dashboard layout at `src/app/(dashboard)/layout.tsx:9-13`.

For an expired cookie: `auth()` returns `null` → `redirect('/welcome')` (or `/login` from the dashboard). The user re-types credentials.

## 6. Explicit `signOut()` callers

Six call sites across the codebase, all user-initiated:

- `src/components/sign-out-button.tsx:13` — global signout button. `signOut({ redirect: false })`.
- `src/components/dashboard/sign-out-button.tsx:9` — dashboard signout. `signOut({ callbackUrl: '/' })`.
- `src/components/dashboard/doctor/sidebar.tsx:110` — doctor sidebar signout.
- `src/components/dashboard/admin/sidebar.tsx:114` — admin sidebar signout.
- `src/components/dashboard/user/sidebar.tsx:189` and `:303` — user sidebar (desktop + mobile variants of the same control).
- `src/lib/auth.ts:25` — the export, not a call site.

**No automatic signOut anywhere.** No token-rotation that nukes the cookie. No error-recovery flow that clears the session. No middleware that wipes credentials. Sessions are killed only when the user explicitly taps a sign-out control or when the JWT expires naturally.

---

## Verdict

The current config is **safer than the owner's concern implies**:

- Session cookie is persistent (survives PWA cold launch).
- JWT strategy avoids DB-roundtrip on every page load.
- 30-day idle + 24h auto-refresh means active users effectively never expire.
- No automatic / accidental signOut paths.

**The one realistic re-auth scenario:** a user who skips the app for > 30 days. For a wellness platform where users may step away for a month at a time between therapy session blocks, that's a not-uncommon path. Asking them to re-authenticate on return is not catastrophic — but it's a small friction cliff at exactly the moment they're trying to re-engage with their mental health practice. Worth softening.

---

## Three options for owner

### Option A — Extend `session.maxAge` to 60 days (recommended)

Single-line addition to `src/lib/auth.ts:28`:

```ts
session: { strategy: 'jwt', maxAge: 60 * 24 * 60 * 60 },
```

Doubles the idle horizon. `updateAge` stays at 24 hours. Active users still get daily refresh; inactive users now have 60 days before re-auth. Cost: a stolen JWT remains valid longer (rotation slower) — but the JWT carries no privileged scope beyond `id` + `role`, and the 24h re-issue cycle on active users limits stolen-token utility.

90 days is also defensible; goes further on user friction at the same cost ceiling.

### Option B — Confirm and document persistent cookies

This is **already the case** (see §2). Document it explicitly in `src/lib/auth.ts` with a comment so future maintainers don't accidentally pass `sessionToken.options.maxAge: undefined` or similar that would convert it to session-only. Two-line change.

Not really an option in the "we need to do this" sense — more of a "no action required, just affirm." Combine with A or C.

### Option C — Sliding-window refresh via `signIn` event or middleware

Add a `signIn` / `session` callback that re-issues the JWT on every successful read, regardless of the 24h `updateAge` threshold. Effect: every page load extends the idle horizon to the full 30 (or 60) days from that moment. Most aggressive option — keeps even sporadic users perpetually logged in until they explicitly sign out.

Cost: more JWT writes (every page load), slightly increased cookie churn, slightly more attractive for a stolen-cookie attacker (more chances to refresh into a fresh token). Effort: ~15 lines including the callback wiring.

Recommend AGAINST C unless owner has a strong "users must never re-auth" stance — the cost-benefit doesn't favor it over a generous A.

### Recommendation

**A + B together.** Single commit:

1. Set `session.maxAge: 60 * 24 * 60 * 60` (60 days) in `src/lib/auth.ts:28`.
2. Add a short comment block noting the cookie is intentionally persistent and the 30-day default was extended to 60 days for the mobile/PWA experience where monthly gaps are common.

Owner decides: do A alone, A + B, or different value (e.g., 90 days).

---

## What doesn't need changing

For completeness, things this investigation considered and ruled out as non-issues:

- **`updateAge`**: leave at 24h default. Going lower (e.g., 1h) increases JWT churn for negligible security gain on a JWT that carries minimal scope. Going higher (e.g., 7d) reduces refresh cadence and shortens the effective rolling window for active users — undesirable.
- **Cookie security flags**: defaults are correct (`httpOnly`, `sameSite: 'lax'`, `secure` in HTTPS). No need to touch.
- **Adapter**: PrismaAdapter is correctly retained for non-session work (account linking, password resets). It does not need to migrate to database sessions for this concern.
- **Logout flows**: all six explicit signOut callers are user-initiated controls. No accidental signout sources to fix.

## Action items for owner

1. Pick the session-maxAge horizon: keep 30 days, go to 60 days (recommended), or 90 days.
2. Once picked, a short `refactor(auth):` commit will land the change before Phase 1 closes (not part of 1.3, which is being built in parallel).
