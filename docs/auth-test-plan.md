# Auth Revamp — Test Plan

Sprint date: 2026-05-13
Branch: `main`
Commits: see "Commit map" at the bottom.

This is the manual test matrix Suryansh runs against the Vercel preview deployment after this sprint. Mark each case `PASS` or `FAIL` in the right column as you go.

## Pre-flight

- [ ] `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in Vercel Preview env (Suryansh confirmed).
- [ ] `NEXT_PUBLIC_APP_URL` is set to the Vercel preview origin so the Origin-check helper allows in-app requests.
- [ ] `RESEND_API_KEY` + `RESEND_FROM_EMAIL` are set (verification + password-reset emails depend on these).
- [ ] Vercel build is green for the head commit.

## Cases

### 1. Google new-user signup — ✅

User: `cmp427ei7000004l5d8orxfjf` (choudharysuryansh1111@gmail.com), tested 2026-05-13 07:22 UTC.

| Step | Expectation | Result |
|---|---|---|
| Click "Continue with Google" on /login or /register | Redirected to Google consent | ✅ |
| Approve consent | Lands on `/user` dashboard | ✅ |
| `SELECT id,"emailVerified" FROM "User" WHERE id=...` | row exists, `emailVerified` non-null | ✅ `emailVerified=2026-05-13T07:22:18.370Z` |
| `SELECT * FROM "Account" WHERE "userId"=...` | one row, `provider='google'` | ✅ `provider=google, type=oidc, providerAccountId=104051979114446713420` |
| Dashboard UI | No verify banner | ✅ Suryansh confirmed visually |
| `SELECT kind FROM auth_events WHERE user_id=... ORDER BY created_at` | `REGISTER_GOOGLE` then `LOGIN_GOOGLE_SUCCESS` | ✅ both present, REGISTER_GOOGLE at 07:22:18.593 → LOGIN_GOOGLE_SUCCESS at 07:22:19.034 |
| `lastLoginAt` bumped on signIn event | recent | ✅ `last_login_at=2026-05-13T07:22:18.820Z` |
| `locked_until` / `failed_login_attempts` | null / 0 | ✅ |

### 2. Google returning login
| Step | Expectation | Result |
|---|---|---|
| Sign out, click "Continue with Google" with the same Google account | Same User row, no new Account row | |
| `User.lastLoginAt` | bumped | |
| `auth_events.kind` | new `LOGIN_GOOGLE_SUCCESS` row | |

### 3. Google collision (Option A) — ✅

User: `cmp54smvb000004i59zmpvelr` (mindset.tech.dev@gmail.com), tested 2026-05-14 01:41 UTC.

| Step | Expectation | Result |
|---|---|---|
| Sign up via credentials with email X, verify, sign out | done | ✅ from Case 4 |
| Click "Continue with Google" with same email X | Redirected to `/login?error=email_exists` with helpful copy | ✅ "An account with this email already exists. Sign in with your password below, or use 'Forgot password' to reset it." |
| `Account` for that user | NO `provider='google'` row | ✅ zero rows |
| `User` row | unchanged (no `lastLoginAt`/`emailVerified` overwrite) | ✅ emailVerified + last_login_at identical to Case 4 finish state |
| `auth_events.kind` | `LOGIN_GOOGLE_BLOCKED` with `{reason:'email_exists_credentials'}` | ✅ row at 01:41:26 |

### 4. Email signup — ✅ (signup + verification path)

User: `cmp54smvb000004i59zmpvelr` (mindset.tech.dev@gmail.com), tested 2026-05-14 01:22–01:35 UTC.
Bugs found inline: honeypot autofill regression (fix `8756eaf`); missing NEXT_PUBLIC_APP_URL → broken verify links (fix `c01c232`). Resend test-sender restriction surfaced (out-of-scope infra — needs domain verification on resend.com/domains).

| Step | Expectation | Result |
|---|---|---|
| Fill signup form, submit | 201, lands on `/user` | ✅ (after honeypot fix `8756eaf`) |
| Email inbox | Welcome + "Verify your Mindset email" both arrive | ✅ to Resend-verified address only |
| Dashboard | Amber verify banner visible | ✅ |
| Click verification link → /verify-email?token=... | Success state, "Your email is verified" | ✅ (after fix `c01c232`) |
| Reload dashboard | Banner gone | ⏳ visual confirm post-verify |
| `auth_events` trail | REGISTER_SUCCESS, EMAIL_VERIFICATION_SENT, EMAIL_VERIFIED | ✅ all present (3× EMAIL_VERIFICATION_SENT due to re-sends; 1 EMAIL_VERIFIED at 01:35:39) |
| `email_verification_tokens`: third token used, prior two invalidated | as designed | ✅ |
| Honeypot block (deferred — needs second user) | 200 returned, no User row | ⏳ Case 10 |

### 5. Email login
| Step | Expectation | Result |
|---|---|---|
| Valid credentials | redirected to role home | |
| 4 wrong passwords | each shows "Invalid email or password" | |
| 5th wrong password | UI shows "Too many failed attempts. Try again in 15 minutes." | |
| Correct password during lockout window | still blocked, same message | |
| Postgres: `User.lockedUntil` | non-null, ~15 min ahead | |
| `auth_events` | 4× `LOGIN_FAILED` (with attempt counts), then `ACCOUNT_LOCKED` | |
| Wait 15 min / clear `lockedUntil` manually | login works again, `failedLoginAttempts=0`, `lastLoginAt` bumped, `LOGIN_SUCCESS` logged | |

### 6. Booking gate — unverified credentials user — ✅ (validated against production API directly)

User: `cmp54smvb000004i59zmpvelr` (mindset.tech.dev@gmail.com), tested 2026-05-14.
Pre-existing blocker surfaced — `/api/doctors/lookup` is a non-existent endpoint referenced by the booking page, so we couldn't reach the gate via UI. Logged in "Out of scope bugs". Validation switched to direct API call with a forged session JWT (tools/forge-session-and-call.mjs) to exercise the gate without the UI in the way.

| Step | Expectation | Result |
|---|---|---|
| Set `emailVerified=NULL` for the test user | banner appears, gate active | ✅ DB updated, banner expected visually |
| Hit `/api/user/sessions/book` with a forged session JWT | API returns 403 "Please verify your email to book sessions" | ✅ exact 403 + body match |
| Confirm no rows leaked past the gate | 0 Session, 0 Payment for this user | ✅ both 0 |
| Restore `emailVerified` to a non-null value | gate no longer blocks | ✅ restored |
| Re-hit the API with placeholder IDs | hits schema validation (400) instead of gate (403) | ✅ status=400, error="Invalid cuid" — proves gate was passed |

### 7. Booking allowed — verified user — ✅

Originally written for a fresh Google user; switched to the same verified credentials user since (a) the original Google user was deleted before Case 4 setup, and (b) the gate is auth-method-agnostic — what matters is `User.emailVerified` being non-null. Case 1 already proved Google's `linkAccount` event sets `emailVerified`, so the composition holds.

| Step | Expectation | Result |
|---|---|---|
| Forged session with verified user; hit `/api/user/sessions/book` with a real doctorId + real slotId | gate passes; deeper validation fires | ✅ status=400, error="This slot is in the past" (post-gate check at line 39) |
| Side effects | 0 Sessions, 0 Payments, slot stays unbooked | ✅ all zero |
| Google's linkAccount sets emailVerified (from Case 1) | non-null after Google signup | ✅ already confirmed |

Note: live future slots don't exist in the seed (dev data only). End-to-end "books a real session" would need a fresh future slot; pre-existing data issue, out of auth scope.

### 8. Password reset
| Step | Expectation | Result |
|---|---|---|
| /forgot-password with real email | Generic success copy; reset email arrives | |
| /forgot-password with fake email | Same success copy; no email sent | |
| `auth_events` | `PASSWORD_RESET_REQUESTED` rows for both (different `metadata.userExisted`) | |
| Click reset link, set new password | success; `auth_events` `PASSWORD_RESET_COMPLETED` row | |
| User can log in with new password | yes | |
| Old password no longer works | yes | |
| Reset link used twice | second time "already been used" | |
| Expired link (manually expire in DB, or wait 15 min) | "expired" state | |
| Origin check: POST /api/auth/reset-password with `Origin: https://evil.test` | 403 cross-origin response | |

### 9. AuthEvent integrity
Run on Vercel Preview DB after the matrix above:

```sql
SELECT kind, COUNT(*) FROM auth_events GROUP BY kind ORDER BY kind;
```

- [ ] At least one row for each of: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGIN_GOOGLE_SUCCESS`, `LOGIN_GOOGLE_BLOCKED`, `REGISTER_SUCCESS`, `REGISTER_FAILED`, `REGISTER_GOOGLE`, `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET_COMPLETED`, `EMAIL_VERIFICATION_SENT`, `EMAIL_VERIFIED`, `ACCOUNT_LOCKED`.

```sql
SELECT metadata FROM auth_events WHERE metadata IS NOT NULL LIMIT 50;
```

- [ ] No raw passwords, tokens, or full unmasked emails in any `metadata` payload. (The `logAuthEvent` sanitiser masks email-shaped strings whose key contains "email" and drops `password`/`token`/`secret` keys outright.)

### 10. Session callback
- [ ] `GET /api/auth/me` returns only `id`, `name`, `email`, `phone`, `role`, `address`, `image`, `createdAt`. No `password`, `failedLoginAttempts`, `lockedUntil`, `lastLoginAt`.
- [ ] Decode the JWT in the `next-auth.session-token` cookie (jwt.io); claims are limited to `id` + `role` plus NextAuth defaults (`sub`, `iat`, `exp`, `jti`, `name`, `email`, `picture`).

### 11. Cookies in production preview
- [ ] `next-auth.session-token` is `HttpOnly`, `Secure`, `SameSite=Lax`. (NextAuth v5 defaults — verify no overrides slipped in.)

## Out of scope bugs

| Area | Issue | Note |
|---|---|---|
| Prisma schema vs DB drift | The DB has Workshop columns (`cancel_reason`, `cancelled_at`, `meet_link`, `min_capacity`, `presenter_id`, `presenter_split_pct`, `status`, `type`), a `presenters` table, and `PresenterTier`/`WorkshopStatus`/`WorkshopType` enums that aren't in the schema. `PaymentType` is also unaligned. | This pre-dates the auth sprint. Running `prisma db push` would drop them, so the migration was applied via `prisma db execute` against `prisma/sql/auth_revamp_google.sql` instead. Suryansh: please decide whether to remove these orphaned tables/columns or add them back to schema.prisma. |
| Public `/doctors` page CTA | "Book a Session" button on the doctor-detail card points to `/#apply-now` (a contact-form anchor on home) instead of `/user/sessions/book?doctorId=...`. Pre-existing; surfaced during Case 5 setup on 2026-05-14. | `src/app/doctors/page.tsx:296` — hardcoded anchor. Should route logged-in users to `/user/sessions/book?doctorId=<id>` and logged-out users to `/login?callbackUrl=/user/sessions/book?doctorId=<id>`. Not part of auth sprint. |
| Missing `/api/doctors/lookup` endpoint | `src/app/(dashboard)/user/sessions/book/page.tsx:50` calls `/api/doctors/lookup?doctorId=...` but the only doctor API routes that exist are `/api/doctors` (list) and `/api/doctors/[slug]`. The fetch 404s; the page shows "Doctor not found" for any direct booking link. Pre-existing (committed in `7de6be9`). | Either (a) add a lookup-by-id endpoint, or (b) change the page to use `/api/doctors/${doctor.slug}` and pass slug through the URL. Blocks Case 5 UI flow — validated via direct API call instead. |
| Resend test-sender restriction | `RESEND_FROM_EMAIL=onboarding@resend.dev` only delivers to the Resend account owner (`mindset.tech.dev@gmail.com`). All other recipients get a silent 403 from Resend. | Infra fix: verify a domain at https://resend.com/domains, update RESEND_FROM_EMAIL to `noreply@<verified-domain>` in Vercel. Blocks normal email delivery for welcome, verification, password reset, session confirmations, order receipts. |
| `NEXT_PUBLIC_APP_URL` not set in Vercel | Caused verify-email links to render as `verify-email?token=...` (no scheme/host), which browsers resolved to nonsense. Fixed defensively in code (`c01c232`) by deriving base URL from the request, but env var still needs to be set so the Origin-check helper can enforce CSRF. | Vercel → Settings → Env Vars → add `NEXT_PUBLIC_APP_URL=https://mindset-ten.vercel.app` for Production + Preview. |

## Commit map

1. `d8eb40c` — Task 1: schema migration (auth_revamp_google)
2. `16c6e63` — Task 2: AuthEvent logger
3. `b477c3e` — Task 3: Google OAuth provider + Option-A collision
4. `16c5750` — Task 4: login + register UI revamp + honeypot
5. `f1396ba` — Task 5: forgot/reset UI revamp + 60s resend cooldown
6. `56f1bd1` — Task 6: account lockout + /api/auth/check-lock
7. `cee37c5` — Task 7: email verification flow + relaxed password policy + booking gate
8. _(this commit)_ — Task 8: hardening + test plan

## Schema diff summary

- `User.password` → nullable (1 column nullability change)
- `User`: +`failed_login_attempts INT default 0`, +`locked_until TIMESTAMP(3)`, +`last_login_at TIMESTAMP(3)` (3 new columns)
- New models: `AuthEvent`, `EmailVerificationToken` (2 new tables)
- New enum: `AuthEventKind` with 12 kinds

No DROPs.
