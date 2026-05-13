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

### 1. Google new-user signup
| Step | Expectation | Result |
|---|---|---|
| Click "Continue with Google" on /login or /register | Redirected to Google consent | |
| Approve consent | Lands on `/user` dashboard | |
| Postgres: `SELECT id,"emailVerified" FROM "User" WHERE email=...` | row exists, `emailVerified` non-null | |
| Postgres: `SELECT * FROM "Account" WHERE provider='google' AND ...` | Account row exists | |
| Dashboard UI | No verify banner | |
| Postgres: `SELECT kind FROM auth_events WHERE user_id=... ORDER BY created_at` | includes `REGISTER_GOOGLE` and `LOGIN_GOOGLE_SUCCESS` | |

### 2. Google returning login
| Step | Expectation | Result |
|---|---|---|
| Sign out, click "Continue with Google" with the same Google account | Same User row, no new Account row | |
| `User.lastLoginAt` | bumped | |
| `auth_events.kind` | new `LOGIN_GOOGLE_SUCCESS` row | |

### 3. Google collision (Option A)
| Step | Expectation | Result |
|---|---|---|
| Sign up via credentials with email X, verify, sign out | done | |
| Click "Continue with Google" with same email X | Redirected to `/login?error=email_exists` with helpful message | |
| Postgres: `Account` for that user | NO `provider='google'` row | |
| Postgres: `User` row | unchanged (no `lastLoginAt`/`emailVerified` overwrite from this attempt) | |
| `auth_events.kind` | `LOGIN_GOOGLE_BLOCKED` with metadata `{reason:'email_exists_credentials'}` | |

### 4. Email signup
| Step | Expectation | Result |
|---|---|---|
| Fill signup form, submit | 201, lands on `/user` | |
| Email inbox | Welcome + "Verify your Mindset email" both arrive | |
| Dashboard | Amber verify banner visible | |
| Click verification link → /verify-email?token=... | Success state, "Your email is verified" | |
| Reload dashboard | Banner gone | |
| Open devtools, set the honeypot input `name="website_url"` to a value, submit | 200 returned, NO new `User` row in DB | |
| `auth_events.kind` for the honeypot attempt | `REGISTER_FAILED` with metadata `{reason:'honeypot'}` | |

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

### 6. Booking gate — unverified credentials user
| Step | Expectation | Result |
|---|---|---|
| Brand-new credentials signup, do NOT click verify link | Banner visible, can browse | |
| Try to book a session from /user/sessions/book | API returns 403, UI shows "Please verify your email to book sessions" | |
| Click banner "Send link" → click email → /verify-email | success | |
| Retry booking | Allowed through to Razorpay checkout | |

### 7. Booking allowed — Google user
| Step | Expectation | Result |
|---|---|---|
| Brand-new Google signup, no email click | dashboard with no banner | |
| Try to book a session | Allowed through to Razorpay checkout | |

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
