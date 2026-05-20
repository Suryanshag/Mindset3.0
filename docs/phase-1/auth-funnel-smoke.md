# Auth funnel smoke — sub-phase 1.4 wrap-up

End-to-end Playwright + Prisma exercise of the six restyled auth routes
plus the lockout coupling. Run with the dev server on `:3000` and
`ARCJET_KEY=""` so the per-IP rate limiter (5 req / 15 min) doesn't
interleave 429s with the test's request bursts:

```bash
ARCJET_KEY="" SMOKE=1 npm run dev
node scripts/smoke-auth-funnel.mjs
```

Each run uses a fresh `smoke-<timestamp>@mindset-test.local` user. The
runner cleans up the DB row + token children on success **and on
failure**, so a failing run never leaves orphan state.

## Run 2026-05-20 — ALL PASS (6/6)

```
[PASS] 1. Signup → /verify-email?sent=1 — user=cmpebghk token=50e256df…
[PASS] 2. Verify link → sign in → /user — landed=/user
[PASS] 3. Forgot → reset → auto-signin → /user — token=d28cc056…
[PASS] 4. Fail 5x → /account-locked → unlocked → sign in → /user
        — live 5-fail burst (ARCJET_KEY="" — fail-open)
[PASS] 5. Google OAuth (signIn() kicked off)
        — interactive Google flow not driven from CI;
          signIn(provider) request observed
[PASS] 6. callbackUrl=/user/practice preserved — landed=/user/practice
```

## What each step actually exercises

### 1. Signup → /verify-email?sent=1

Drives the `/register` two-step mobile form (Name → credentials + T&C)
end-to-end via real form fills. After submit:

- Asserts URL ends at `/verify-email?sent=1` (the post-signup redirect
  flip in commit `002bbe3`).
- Verifies `User` row exists in DB with `emailVerified = null`.
- Verifies a fresh `EmailVerificationToken` row was stored, with the
  expected `userId` association.

The Resend send is fire-and-forget; we don't assert delivery (the
`@mindset-test.local` domain would bounce regardless). The DB row is
the contract — that's what unblocks step 2's token path.

### 2. Verify via token → sign in → /user

Reads the token from `EmailVerificationToken` directly, navigates to
`/verify-email?token=<token>`, asserts the `"Your email is verified"`
success card renders, and confirms `user.emailVerified` flipped from
`null` to a timestamp. Then clears the session cookie and signs in via
the real `/login` form. Lands on `/user` (the role-home for `USER`).

The cross-tab `broadcastEmailVerified()` signal isn't asserted in this
run — there's only one Playwright tab.

### 3. Forgot → reset → auto-signin

Sign-out → `/forgot-password` form submit → asserts a fresh
`PasswordResetToken` row in DB → navigate `/reset-password?token=<token>`
→ fill new password (`SmokeReset2026##` — length 16, 4 char classes →
**Strong** per the locked policy) → submit → auto-signin lands on
`/user` directly, no extra login step.

The cooldown + completed-elsewhere localStorage signal aren't tested
here — they have their own component-level tests.

### 4. Fail 5x → /account-locked → unlocked affordance → sign in

Live burst of 5 wrong-password submits against `/api/auth/callback/
credentials`. After the 5th failure, the in-page submit handler:

- Sees `signIn(...)` return error.
- Calls `/api/auth/check-lock` with the user's email.
- Receives `{ locked: true, until: <ISO8601> }`.
- `router.push('/account-locked?until=<encoded ISO>')` succeeds.

Assertions:

- URL after the 5th submit matches `/account-locked` AND contains
  `until=`.
- DB confirms `user.lockedUntil > now`.

Then the smoke seeds an expired `until` and navigates to `/account-
locked?until=<past>` to verify the unlocked-state UI:

- The `"Sign in now →"` link is visible (the unlock affordance).
- Clicking it lands on `/login` (no query params).
- Signing in with the new password from step 3 lands on `/user`.

The inline-message fallback branch isn't directly exercised — `router.
push` doesn't throw in normal flow. It's preserved in code as graceful
degradation.

### 5. Google OAuth (kicked-off only)

We don't drive a real Google round-trip from a headless browser (CSRF,
network, Google's own bot detection). The smoke verifies:

- The `"Continue with Google"` button is rendered on `/login`.
- Clicking it triggers a request to `/api/auth/signin/google` (or a
  navigation toward `accounts.google.com`).

The interactive completion of the Google flow is verified manually
during real-device QA in sub-phase 1.5.

### 6. callbackUrl=/user/practice preserved

Navigate to `/login?callbackUrl=/user/practice`, sign in with the
post-step-3 password. Asserts the post-signin landing pathname is
**exactly** `/user/practice` (substring match would falsely pass on
the encoded callback in the initial URL).

## Known limitations + assumptions

- **Per-IP rate limit bypass:** the smoke requires
  `ARCJET_KEY=""` on the dev server. In production, the lockout flow
  still works; the 5-fail burst is what the limiter is designed to
  smooth out in the wild. The smoke is exercising the *wire-up*, not
  the rate-limit semantics.
- **Onboarding gate:** the runner sets a `mindset_onboarded=1` cookie
  on the context before any navigation so `/user` doesn't redirect to
  `/onboarding`. Real users will hit the gate; the gate is out of
  scope for the auth funnel.
- **Email delivery:** every step uses DB peeks for tokens rather than
  reading the user's inbox. Resend logs show successful sends (visible
  in the dev server output `[EMAIL] ✓ welcome sent to s***`) but
  delivery to `@mindset-test.local` is not asserted.
- **Cleanup is best-effort:** the `finally` block deletes the test
  user even on failure, so a crashed run still leaves the DB clean.
  If Prisma is itself broken the cleanup may fail — re-run with the
  same RUN_ID won't conflict because the email is timestamped.
