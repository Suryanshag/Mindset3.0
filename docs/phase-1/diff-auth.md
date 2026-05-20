# Phase 1 — Auth diff report

**Sub-phase 1.1, Task 1.1a — owner-signed-off 2026-05-20.** Compares the existing `(auth)` routes against the handoff `app/auth.jsx` and `app/auth-recovery.jsx` screens, route-by-route, per §0C diff-first discipline. **No restyle has begun.**

Evidence is cited as `path:line` against `/Users/suryansh/Documents/Mindset/Mindset3/` (existing) and `Mindset Android app/Mindset (2)/app/` (handoff).

All seven open questions from the initial diff are now resolved — see §J (Resolved decisions) at the bottom. Decisions are reflected inline in §A–§H. The verification gate investigation called out in Decision 3 has been completed; finding in §F.4.

---

## A. Shared scaffolding observations

Before the route-by-route diff, three structural facts hold across all auth routes — note these once.

### A.1 AuthShell desktop split must survive the mobile restyle

`src/components/auth/auth-shell.tsx:27` renders a `flex flex-col lg:flex-row` two-column layout: a **45% gradient brand panel** on `lg` (`auth-shell.tsx:29-100`) and a **55% form panel** with mobile-only wordmark header, footer link cluster, and DPDP encryption strip (`auth-shell.tsx:103-148`).

The handoff designs are mobile-only and don't show this desktop column. Per §0C ("design wins on visual; existing wins on data shape") and §3b ("no `(mobile)` route group"), **the lg desktop column must be preserved as-is** — the handoff's mobile chrome (back-arrow header, big serif display headline, pill CTAs, rounded `<Field>` inputs) is grafted into the right-side column on mobile-and-below breakpoints. On `lg+` the existing two-column layout continues to render the existing form treatment.

### A.2 Auth-only safety affordance: `HelplineModal`

`src/components/auth/helpline-modal.tsx:6-10` lists iCall (9152987821), Vandrevala (1860-266-2345), and **KIRAN** (1800-599-0019). The handoff `app/sos.jsx` (per Phase 0 audit) lists iCall, Vandrevala, and **AASRA**.

**Resolved (owner Decision 2):** Don't pick — include **all four** helplines plus existing two from a single source-of-truth module at `src/lib/safety/helplines.ts`. Order: iCall (TISS-affiliated, generally highest trust), Vandrevala, KIRAN, AASRA. The module is built **before** the auth restyle as a foundation commit (`chore(safety): centralize helplines source of truth`); `HelplineModal`, `/user/sos` (Phase 6), and any future SOS surface all import from it.

**Phone numbers verified 2026-05-20** via TISS, Vandrevala Foundation, PIB government release, and AASRA official sources. **One content correction:** existing `HelplineModal` says iCall hours are "Mon–Sat, 8 am – 10 pm" but the official TISS source says **Mon–Sat, 10 AM – 8 PM** (the existing hours are inverted). The new constant uses the verified TISS hours.

`AuthShell` exposes this via a "Need help right now?" footer button (`auth-shell.tsx:132-139`). The handoff auth screens **do not show** a helpline entry point on auth pages — but losing it would be a regression. **Preserve.** Same modal, same trigger placement.

### A.3 Token vocabulary mismatch — to be fixed in Task 1.1b

Existing auth code reads `var(--cream)`, `var(--teal)`, `var(--coral)`, `var(--navy)`, `var(--font-heading)` (e.g., `login/page.tsx:144,157,166,198`). These are **older bare-name aliases** the codebase relies on — they must already exist in `globals.css` somewhere, otherwise the current auth pages would render broken. (Quick verification step in 1.1b: confirm before adding more aliases.)

The handoff uses `var(--primary)`, `var(--accent)`, `var(--bg-app)`, `var(--bg-card)`, `var(--on-dark)`, `var(--text)`, `var(--text-muted)`, `var(--text-faint)`, `var(--border)`, `var(--border-strong)`, `var(--primary-tint)`, `var(--accent-tint)`, `var(--shadow-card)`, `var(--shadow-pop)`, plus the `MOOD_INFO` palette and the `--soft-pink` / `--soft-blue` / `--amber-soft` / `--purple-tint` extras.

**Decision for 1.1b:** add the bare-name aliases pointing at the existing `--color-X` source-of-truth (per the kickoff prompt), AND keep the existing `--cream` / `--teal` / `--coral` / `--navy` / `--font-heading` aliases intact. Two name systems coexist during the restyle until everything migrates.

### A.4 Animation keyframes

The handoff designs reference keyframes that don't exist in `globals.css`: `markIn`, `markSpin`, `fadeUp`, `slideIn`, `popIn`, `typeIn`, `floatA`, `floatB`, `loadBar`, `orbit`, `spin`. `globals.css` already has `pl1-a/b/c` for the existing `MindsetLoader` (referenced at `mindset-loader.tsx:17`). **Add the handoff keyframes once, share across all new routes.** Treat this as a single foundational commit in sub-phase 1.3 (before splash/welcome) — not in 1.1b.

---

## B. `/login` vs handoff `app/auth.jsx → Login`

### B.1 Existing UI (`src/app/(auth)/login/page.tsx`)

- `'use client'` (line 1). Wrapped in `<AuthShell>` (no headline prop → default "Your mental health, supported with care.").
- `<Suspense>` fallback `minHeight:420` while `useSearchParams` resolves (lines 308-313).
- **Already-signed-in redirect**: useEffect at lines 45-50 checks `useSession()`, redirects to `ROLE_HOME[role]` (admin/doctor/user).
- **OAuth error copy**: `OAUTH_ERROR_COPY` covers `email_exists`, `OAuthSignin`, `OAuthCallback`, `OAuthAccountNotLinked`, `Callback`, `AccessDenied` (lines 22-30). Display via `?error=` query param.
- **Password-reset success banner**: `?message=password-reset` renders teal-tinted "Password reset successfully" banner with `CheckCircle` icon (lines 152-160).
- **Form** (react-hook-form + `loginSchema` from `@/lib/validations/auth`):
  - Hero: "Welcome back" (24px `sm:text-3xl`, navy, `--font-heading`) + "Sign in to continue your journey." sub.
  - `<GoogleButton callbackUrl={callbackUrl ?? '/user'} />`.
  - "or continue with email" divider.
  - Email input (cream bg, transparent border, teal focus, coral error).
  - Password input via `<PasswordInput>` (eye toggle). "Forgot password?" inline above right.
  - Submit pill (teal, coral on error, shows `<Loader2>` + "Signing in…"). Renders `<MindsetLoader>` overlay while in flight.
  - Footer link "New here? Create account" (coral).
- **Locked-account handling** (lines 78-110): on `result?.error`, POSTs to `/api/auth/check-lock` with `email`; if `{ locked: true, until }`, computes minutes-remaining and renders the lock message inline. **Does NOT route to `/(auth)/account-locked`** — locked state shows as an inline error on `/login` today. We need to add that route (B.6) and update this handler to redirect.
- **Success path**: `signIn('credentials', { redirect:false })` → `getSession()` → push to `callbackUrl` or role home. `setIsLoading(false)` deliberately not called on success so the loader stays through navigation (lines 119-123).

### B.2 Handoff UI (`auth.jsx:136-186`, `Login`)

- Mobile-only screen, `--bg-app` background, `overflowY:auto`.
- **Back-arrow circular button** in header (40×40, `--bg-card` bg, `--shadow-card`). No equivalent in existing route — existing has no back button because users land here via direct URL or `/welcome` link.
- **Hero**: small uppercase kicker "Welcome back" (`--primary`), large 38px display "Good to see you again." over two lines, navy/`--text` color.
- **`<Field>` inputs** (`auth.jsx:188-200`): rounded card-style (`--bg-card` bg, 18px radius, `--shadow-card`, uppercase 11px label, leading icon in `--primary`, optional trailing "Show" toggle).
- "Forgot password?" link aligned right.
- Primary submit pill (full-width 999px radius, `--primary` bg, `--on-dark` text, 16px padding) with `<Spinner>` + "Signing you in…" when loading.
- "New to Mindset? Create one" link with `--primary` bold.
- Footer text "Mindset cares about your privacy — all sessions are end-to-end encrypted." (already present in `AuthShell` footer — handoff duplicates inside the screen body).
- **No Google OAuth on this screen** — handoff puts Google on `/welcome` only.

### B.3 Action — `/login` restyle

| Aspect | Existing | Handoff | Restyle action |
|---|---|---|---|
| Layout | `AuthShell` two-column on `lg`; single-col mobile | Mobile single-screen | **Keep `AuthShell` desktop.** On `lg:hidden` panel, swap the form content for the handoff structure. |
| Back arrow | none | top-left 40×40 circle | **Add** the back-arrow on mobile only. Navigates to `/welcome` if referrer was `/welcome`, otherwise to `/`. |
| Hero | 2xl/3xl "Welcome back" + sub | uppercase kicker + 38px display "Good to see you again." | **Adopt handoff** on mobile. Desktop keeps "Welcome back" 3xl. |
| Inputs | inline label-above + cream bg input | rounded `<Field>` card with leading icon + trailing "Show" | **Build a shared `<MobileField>`** at `src/components/auth/mobile-field.tsx`. Use only inside `lg:hidden` markup. Wire to `register('email'|'password')`. |
| Password | `<PasswordInput>` (eye toggle) | `<Field trailing="Show">` text button | Keep `<PasswordInput>` desktop, use `<MobileField>` with `trailing="Show"` on mobile. Both toggle `type=password\|text`. |
| Forgot link | inline above password label, right-aligned | below password Field, right-aligned | **No functional change** — just place it under the field, keep right-align. |
| Google button | top of form via `<GoogleButton>` | not on this screen | **Resolved (owner Decision 6, part 1):** keep `<GoogleButton>` on mobile. Lowest-friction auth; conversion-critical. Render under the email/password form with the "or continue with" divider. Intentional divergence from handoff. |
| Submit | rounded-xl teal pill | rounded-999 pill primary-on-on-dark | **Visual change only.** Reuse handler. |
| Already-signed-in redirect | preserve | n/a | **Preserve.** No change. |
| OAuth error copy | preserve | n/a | **Preserve.** |
| Password-reset success banner | preserve | n/a | **Preserve.** |
| Lockout inline message | preserve as fallback | should redirect to `/(auth)/account-locked` | **Update (resolved by owner Decision 5):** on `{ locked: true, until }`, `router.push('/account-locked?until=' + encodeURIComponent(until))`. **No email in URL** (privacy: browser history, referrer, analytics leakage). Inline message stays as fallback if redirect fails. The locked screen renders countdown only (no "we've paused [email]" personalization) per option (c). |
| MindsetLoader on submit | preserve | handoff uses inline Spinner | **Keep `MindsetLoader`** — visually distinctive Mindset brand asset, regression to lose. |
| Suspense fallback | preserve | n/a | **Preserve.** |
| Footer DPDP strip (AuthShell) | preserve | not shown in handoff | **Preserve.** Handoff's "all sessions are end-to-end encrypted" inline line is less rigorous; keep the AuthShell DPDP version instead — they say the same thing in slightly different words; one is enough. |
| HelplineModal entry point | preserve | not shown | **Preserve.** |

### B.4 Server contract — confirmed unchanged

`signIn('credentials')` (NextAuth), `/api/auth/check-lock` POST, `getSession()`, `/api/user/me` is **not** called (the code comment at `login/page.tsx:113-116` explicitly notes the JWT-only path). No auth-logic changes in 1.4a.

---

## C. `/register` vs handoff `app/auth.jsx → SignUp` (2-step)

### C.1 Existing UI (`src/app/(auth)/register/page.tsx`)

- `'use client'`, `<AuthShell headline="Build a steady, kinder relationship with yourself.">`.
- **Single-form** (not stepped). Fields: name, email, phone (optional), password (with `<PasswordStrength>`), confirm password.
- **Honeypot** field `website_url` inside an `inert aria-hidden` div positioned `-9999px` (lines 171-192). POSTs ref'd value in submit body (line 80). API handler at `/api/auth/register` returns `id="honeypot"` on bot detection (line 92-95) → silent redirect to `/login?message=registered`.
- `<GoogleButton callbackUrl="/user" />` at top, then "or continue with email" divider.
- Hero "Create your account" + "Join the Mindset community." sub.
- After successful POST + signIn → push to `/user`. No verification-required step in this flow — verification happens later via the `<VerifyEmailBanner>` on dashboard, redirected via separate `/verify-email` for the link click.
- **Already-signed-in redirect** via `useSession()` at lines 43-47.
- `<MindsetLoader message="Creating your account…" />` overlay during submit.

### C.2 Handoff UI (`auth.jsx:212-274`, `SignUp` + `NameStep` + `CredsStep`)

- 2-step header with progress bar (`auth.jsx:228-241`): two 4px bars, fill = `--primary` for completed/current.
- Back arrow in header (40×40 circle) — back from step 0 → `onBack` (welcome), step 1 → step 0.
- **Step 0 = `NameStep`** (`auth.jsx:318-332`): "Step 1 of 2" kicker, "What should we call you?" display 32px, "Used in your greeting and journal — keep it as casual as you like." muted note. **Large bottom-border-only input** (no card), `--font-display` 36px, transparent bg.
- **Step 1 = `CredsStep`** (`auth.jsx:334-350`): "Step 2 of 2" kicker, "Almost there." display, "We use your email for session reminders and gentle nudges only." note. Two `<Field>` inputs (Email + Password+Show toggle), and a **T&C checkbox** (defaulted checked, `accentColor: --primary`).
- Footer line "Therapist? Accounts are created by our admin team — request access." (`auth.jsx:269`). Owner has said therapist accounts are admin-only.
- **No phone field** in handoff. Existing has phone (optional).
- **No password strength indicator** in handoff. (Handoff `ResetPassword` has one — `auth-recovery.jsx:141-148` — but `SignUp.CredsStep` doesn't.) Existing has `<PasswordStrength>` inline.
- **No confirm-password field** in handoff. Existing has it.

### C.3 Action — `/register` restyle

| Aspect | Existing | Handoff | Restyle action |
|---|---|---|---|
| Stepping | single form | 2 steps with progress bar | **Mobile only**: build a 2-step UI on `lg:hidden` using internal state. Desktop `lg:` keeps single-form. Justification: the 2-step pattern is a mobile-thumb-friendly affordance; on a wide screen the single form is more efficient. Decided per kickoff prompt option (a). |
| Phone field | optional, on form | omitted | **Resolved (owner Decision 6, part 3):** keep optional on mobile. Used for session reminders downstream — don't drop the collection point. Place under email in step 1. |
| Confirm password | required | omitted | **Preserve.** Add as an additional field in step 1 — mobile has the room. Reason: a missed typo in a new account is a real support cost. |
| `<PasswordStrength>` | inline below password | omitted | **Preserve, render with handoff visual.** Resolved (owner Decision 4): use `<PasswordStrengthBars>` (4-bar visual) that calls into a **shared** policy module `src/lib/validations/password-policy.ts` exporting both `passwordSchema` and `scorePassword()`. Bars + submit-disable both read from this one source of truth. Bar visual without server-policy semantics is forbidden. |
| Honeypot | inert hidden field | n/a | **Preserve.** Critical anti-bot. |
| reCAPTCHA | `<RecaptchaProvider>` in root layout (per Phase 0 audit) | n/a | **Preserve.** Silent. |
| T&C checkbox | not present | present, default checked | **Resolved (owner Decision 6, part 2):** add on mobile step 1, **default UNCHECKED**. Default-checked is a dark pattern and DPDP-risky. Link to `/terms-of-use` + `/privacy-policy`. Block submit until checked. |
| Hero copy | "Create your account" + "Join the Mindset community." | step kickers + display per step | **Adopt handoff** on mobile. Desktop keeps existing. |
| Submit | "Create account" pill + arrow | "Continue" → "Create account" + check | **Adopt handoff** pill style on mobile. |
| MindsetLoader | "Creating your account…" | inline `<Spinner>` + "Creating your account…" | **Keep `MindsetLoader`** — brand asset. Trigger on final submit. |
| Already-signed-in redirect | preserve | n/a | **Preserve.** |
| POST `/api/auth/register` contract | preserve | n/a | **Preserve.** Same body shape (name, email, phone, password, website_url). |
| Auto-signin after registration | preserve | n/a | **Preserve.** |
| Email verification handoff | existing `VerifyEmailBanner` on dashboard + separate `/verify-email` flow | not surfaced in handoff signup | **Preserve.** Don't introduce a forced verification step before reaching `/user` — that's a regression. Existing pattern is fine. |
| GoogleButton | on register page | only on `/welcome` per handoff | **Decision**: keep on mobile `/register` too. Same reason as `/login` (B.3). |

### C.4 New shared component

Both `/login` mobile and `/register` mobile want `<MobileField>` — same pattern. Build once at `src/components/auth/mobile-field.tsx`, parameterized with `label`, `icon` (Lucide icon node), `trailing` (optional ReactNode), and the usual input props via spread. Forward refs so `react-hook-form`'s `{...register('foo')}` works. RHF-compatible.

---

## D. `/forgot-password` vs handoff `app/auth-recovery.jsx → ForgotPassword`

### D.1 Existing UI (`src/app/(auth)/forgot-password/page.tsx`)

- `'use client'`, `<AuthShell headline="A reset link, on its way.">`.
- Two visible states: **input** (default) and **submitted**.
  - Input: Mail icon header (12×12 rounded), "Forgot password?" hero, "Enter your email and we'll send you a reset link." sub, email field with cream bg + teal focus, "Send reset link" CTA, "Back to login" link.
  - Submitted: `CheckCircle` icon, "Check your email" hero, "If an account exists for X, you'll receive a password reset link." copy, **warning chip** "The link expires in 15 minutes. Didn't get it? Check spam, or resend below." (amber-tinted), "Resend link" / "Resend in Xs" button, "Back to login".
- **Third state**: `completedElsewhere` (lines 75-106) — fires when another tab completes a reset; switches this tab into a "Password reset in another tab" card with a "Go to login" CTA. Triggered by a `storage` event listener (lines 32-42) reading `mindset:password-reset-complete` from localStorage, with a 30-minute freshness window.
- Calls `POST /api/auth/forgot-password` with `{ email }`. Resend cooldown 60s.

### D.2 Handoff UI (`auth-recovery.jsx:6-99`)

- Back arrow header. Two stages: `input` and `sent`.
- Input: kicker "Reset password", display "What's your email?", serif italic sub "We'll send a reset link if this account exists.", `<Field type="email">`, full-width pill "Send reset link" with arrow icon at the bottom (uses `marginTop:auto`).
- Sent: centered card-in-card with `--bg-cream` background, check icon in tinted circle, display "We sent a link to X" (X = email in `--primary`), copy "Check spam if you don't see it in a minute.", two pills: "Open mail app" (primary) + "Resend in Xs / Resend link" (outline).

### D.3 Action — `/forgot-password` restyle

| Aspect | Existing | Handoff | Restyle action |
|---|---|---|---|
| Stages | input + submitted + completedElsewhere | input + sent | **Preserve all three** existing states. Restyle visual for input + submitted; keep completedElsewhere state with handoff visual treatment. |
| Hero | Mail-icon-circle + 2xl/3xl "Forgot password?" | kicker + 32px display "What's your email?" | **Adopt handoff** on mobile. Desktop keeps existing. |
| Helper copy | "Enter your email…" plain | serif italic "We'll send a reset link if this account exists." | **Adopt handoff** mobile. |
| Email field | inline cream-bg input | `<Field>` card | **Adopt** `<MobileField>` from C.4. |
| Submit CTA | "Send reset link" pill + arrow + loader | "Send reset link" pill + arrow | **Visual change only.** |
| Submitted hero | CheckCircle 14×14 + "Check your email" 2xl/3xl | check-circle-in-card + "We sent a link to X" 24px | **Adopt handoff** mobile. |
| Expiry warning | amber chip "expires in 15 minutes" | not present in handoff | **Preserve.** Important info; mobile can render as a small line below the body copy in a `--amber-soft` chip. |
| Resend button | full-width pill, "Resend in Xs / Resend link" | same | **No change.** |
| "Open mail app" button | not present | primary pill | **Add (low priority).** Use `mailto:` link or `intent://` for Android. Falls back to no-op on devices where mail-app deep-link isn't reachable. Document the limitation. |
| "Back to login" link | inline arrow-back link | not in handoff sent state | **Preserve.** |
| `completedElsewhere` state | full screen card with "Go to login" | not in handoff | **Preserve.** Use handoff card visual. |
| `mindset:password-reset-complete` localStorage signal | preserve | n/a | **Preserve.** Cross-tab sync is a real UX win. |
| POST `/api/auth/forgot-password` contract | preserve | n/a | **Preserve.** |

---

## E. `/reset-password` vs handoff `app/auth-recovery.jsx → ResetPassword`

### E.1 Existing UI (`src/app/(auth)/reset-password/page.tsx`)

- `'use client'`, `<AuthShell headline="One more step to get you back in.">`.
- **Token gate** (lines 26-35): on mount, GET `/api/auth/reset-password?token=X` to validate. Three states: `checking` (spinner), `valid` (form), `invalid` (XCircle + "This link has expired" copy + "Request new link" CTA).
- Form: Lock-icon-circle + "Set a new password" 2xl/3xl + "Choose a strong password for your account." sub. Two `<PasswordInput>` fields with `<PasswordStrength>` under password and a "match/don't match" line under confirm.
- Validation (lines 37-44): client-side `passwordValid(p)` mirrors server policy: ≥10 chars + 3-of-4 classes.
- Success state: CheckCircle + "Password reset successfully" + auto-redirect to `/login?message=password-reset` after 2.5 s. Writes `mindset:password-reset-complete` localStorage timestamp (lines 67-73) so other tabs notice.
- Submit POST `/api/auth/reset-password` with `{ token, password }`.

### E.2 Handoff UI (`auth-recovery.jsx:115-174`)

- Back-arrow header.
- Hero: kicker "Almost there", 32px display "Create a new password."
- Two `<Field>` password inputs (with Show/Hide toggle that flips both).
- **4-bar strength indicator** (`auth-recovery.jsx:141-148`) using local `_strength()` (8/cls/digit/symbol, max 4) and `_STRENGTH_LABEL` + `_STRENGTH_COLOR` arrays.
- Match indicator under confirm: check icon + "Passwords match" green, or dot + "Don't match yet" muted (`auth-recovery.jsx:153-158`).
- Disabled "Reset & sign in" pill until `pw1.length && pw2.length && s >= 2 && matches`.

### E.3 Action — `/reset-password` restyle

| Aspect | Existing | Handoff | Restyle action |
|---|---|---|---|
| Token gate | preserve (checking / valid / invalid) | not present in handoff (assumes link is good) | **Preserve.** Restyle the invalid state's icon container to soft-pink card with handoff visual; keep the existing copy ("This link has expired" + "Request new link"). |
| Hero | Lock-icon + 2xl/3xl "Set a new password" | kicker + display "Create a new password." | **Adopt handoff** on mobile. |
| Password fields | `<PasswordInput>` each | `<Field>` each with Show toggle | **Use `<MobileField>` (from C.4)** with `type=password` + trailing Show toggle. Single shared show-state for both fields (handoff pattern). |
| Strength bar | `<PasswordStrength>` (1 bar + label) | 4 separate bars + label | **Resolved (owner Decision 4):** build `<PasswordStrengthBars>` consuming the shared `scorePassword()` from `src/lib/validations/password-policy.ts`. Renders 4 bars per handoff visual. **Server policy is the single source of truth.** Submit button enable/disable also reads `meetsPolicy` from the same module. The handoff's looser `_strength()` heuristic (length≥8) is **not** used — would let users see "Strong" on a password the server rejects, which is a UX-disaster bug we prevent by sharing one source. The existing `passwordValid` inline logic in `reset-password/page.tsx:37-44` is replaced by an import from the new module. |
| Match indicator | "Passwords do not match" / "Passwords match" | dot + "Don't match yet" / check + "Passwords match" | **Adopt handoff** visuals. Same logic. |
| Submit | "Reset password" pill | "Reset & sign in" pill | **Resolved (owner Decision 6, part 4):** use "Reset & sign in" copy and add programmatic `signIn('credentials', { email, password })` after success, redirect to `/user`. Re-typing the just-set password is friction theatre. The legacy `/login?message=password-reset` redirect path is **dropped** for fresh reset links — the success-banner branch stays only as a fallback if `signIn()` itself errors. |
| Auto-signin after reset | not implemented (redirects to /login banner) | implied by "Reset & sign in" copy | **Resolved (owner Decision 6, part 4):** add `signIn('credentials')` post-success → `/user`. See row above. |
| Cross-tab signal | preserve | n/a | **Preserve.** |
| Token validation API call | preserve | n/a | **Preserve.** |

---

## F. `/verify-email` vs handoff `app/auth-recovery.jsx → VerifyEmail`

### F.1 Existing UI (`src/app/(auth)/verify-email/page.tsx`)

- `'use client'`, `<AuthShell headline="One quick check, and you're set.">`.
- **Five token states** via `useEffect` POSTing to `/api/auth/email/verify`: `verifying` (spinner), `success`, `expired`, `invalid`, `used`. Each non-success state has tailored copy in the `copy` object at lines 99-112.
- Success state: CheckCircle + "Your email is verified" + "Go to your dashboard" CTA. Calls `broadcastEmailVerified()` for cross-tab signaling (verifies in the banner component too) + `router.refresh()`.
- Error state: XCircle + state-specific title/body + "Open dashboard" + "Back to login" buttons.

### F.2 Handoff UI (`auth-recovery.jsx:179-226`)

- **Different model.** Handoff `VerifyEmail` is the **post-signup "check your inbox"** screen, not the **post-link-click verification result** screen. It shows:
  - Back arrow header.
  - Kicker "Confirm your email", display "Check your inbox.", serif italic "We sent a link to X. Tap it to verify."
  - Card with "Open mail app" button + monospace `Resend in 0:XX` countdown (60s).
  - Footer link "Wrong email? Edit" → `onEdit` (back to register email step).

The handoff has no UI for the link-click verification result; presumably that's a backend redirect + banner.

### F.3 Action — `/verify-email` restyle

This is the **biggest semantic gap** in the auth flow. There are **two different screens** the handoff implies and only one route in the existing app.

| Aspect | Existing | Handoff | Restyle action |
|---|---|---|---|
| Route purpose | Post-link-click result (5 states, validates `?token=X`) | Post-signup "check your inbox" + resend | **Resolved (owner Decision 3):** single route, two stages via `?sent=1` query parameter — mirrors `/forgot-password`'s input/sent stage pattern. No new route. |
| Post-signup display | currently the `<VerifyEmailBanner>` shows on `/user` after registration; no dedicated screen | handoff has a full screen | **Resolved (owner Decision 3):** add `?sent=1` stage; route there after signup. **"Skip for now" link to `/user` retained** — investigation in §F.4 confirms unverified users are NOT blocked from `/user` today; verification is a banner-driven nudge, not a hard gate. |
| Link-click result | Preserve all 5 states | not in handoff | **Preserve.** Restyle the success state's check-circle-in-card to match handoff visual treatment for completion screens. |
| Cross-tab signal | preserve | n/a | **Preserve.** |
| Open mail app button | not present | present | **Add.** |
| Resend countdown | not present on `/verify-email` (existing banner has resend) | 60s mono countdown | **Add** for the new sent stage. `POST /api/auth/email/send-verification` is confirmed in `src/components/auth/verify-email-banner.tsx:33` (already used by the dashboard banner — authenticated, no body required, returns ok/error). Wire same handler into the `?sent=1` stage with the 60s countdown. |
| "Wrong email? Edit" link | not present | present | **Add.** Routes back to `/register?step=email` (the new mobile 2-step from C.3). On `lg+` desktop where the form is single-step, route to `/register` and focus the email field via a small autoFocus hint. |
| `broadcastEmailVerified` | preserve | n/a | **Preserve.** |

### F.4 Verification-gate investigation result (Decision 3 follow-up)

Per owner Decision 3, the skip-link question depended on whether unverified users can access `/user`. Read the gate logic:

- **`src/app/(dashboard)/layout.tsx:9-13`** — checks only `session?.user`; redirects to `/login` if absent. **No `emailVerified` check.**
- **`src/app/(dashboard)/user/layout.tsx:30-37`** — fetches `user.emailVerified` via `getCurrentUserBasics`, **uses it only to toggle the `<VerifyEmailBanner>` visibility** (`showVerifyBanner = !user?.emailVerified`). **No redirect.** Verified and unverified users both render the dashboard.
- **`src/components/auth/verify-email-banner.tsx:54`** — banner copy says "Verify your email to book sessions." This implies the **booking** flow may have its own per-action gate (Phase 0 audit didn't flag one; reasonable to assume booking checks `emailVerified` server-side in `/api/payments/create-order` SESSION branch — worth confirming during Phase 3 but irrelevant to Phase 1).
- **No `middleware.ts`** at repo root or `src/`.
- **`src/lib/auth.ts`** — no `emailVerified` gate in any callback (only `linkAccount` event sets it on Google sign-in at line 189).

**Conclusion:** Unverified users CAN access `/user` with banner nudge. Per owner Decision 3 case (a), **"Skip for now" → `/user` is correct.** This matches the existing user flow exactly (today's post-signup redirect is direct to `/user`); the `?sent=1` stage is a soft addition the user can dismiss.

---

## G. `/(auth)/account-locked` — **new route**

### G.1 Existing

No such route. Locked-account handling is inline on `/login` (B.1) via the `/api/auth/check-lock` POST inside the credentials-error branch. Renders the lock message as a plain text error inside the existing alert div.

### G.2 Handoff UI (`auth-recovery.jsx:231-294`)

- Back arrow header.
- **Soft-pink card** (`--soft-pink` background) with lock icon in white-ish circle (`--accent-deep`) + kicker "Account paused" + display "We've paused this account for safety."
- Below the card: serif italic "Too many sign-in attempts. Try again in 15 minutes, or reset your password now."
- **32px monospace countdown** mm:ss in `--primary`.
- Two pills: "Reset password" (primary) → `onReset` → `/forgot-password`; "Back to login" (outline) → `onBack` → `/login`.

### G.3 Action — build `/(auth)/account-locked`

**New file**: `src/app/(auth)/account-locked/page.tsx`.

**Resolved (owner Decision 5):** **No identifier in the URL** — privacy concern (browser history, referrer leak, analytics). Pass only `?until=<ISO8601>`. The locked screen renders the countdown without personalization ("we've paused this account for safety" — no email shown). Going with option (c) from the kickoff: simplest, leakproof, and the handoff copy doesn't actually require an email-personalized message.

Approach:
1. Create the route as a client component. Input from URL params: `?until=<ISO8601>` only. If `until` is absent or in the past, redirect to `/login` immediately (lock has lifted).
2. Computes mm:ss countdown client-side. When countdown hits 00:00, automatically swaps to a "You can try signing in again now" state with a single "Back to login" pill. (Handoff doesn't show this end state; reasonable default.)
3. Use `<AuthShell>` wrapper — desktop column unchanged on `lg+`. Mobile-only renders the soft-pink lock card.
4. **Update `/login` handler** (`login/page.tsx:78-110`): on `{ locked: true, until }`, instead of setting an inline error, do `router.push('/account-locked?until=' + encodeURIComponent(lockData.until))`. **No email parameter.** **Keep** the inline message as a fallback if the redirect ever fails — never strand the user.
5. The "Back to login" CTA returns to `/login` with **no email prefill**. The user re-types — small friction, but the leakproof default is worth it.
6. Lockout `AuthEvent` is already logged at the lockout boundary — verified in `src/lib/auth.ts:97-98` (`kind: 'ACCOUNT_LOCKED'` fire-and-forget). No change to logging.

**Helpline footer link**: the lock screen's "or reset your password now" copy is mild. Worth flagging that someone hitting account-locked might also need the helpline — verify `AuthShell` footer (which contains the helpline button) renders below the lock card on mobile. It does, since this is wrapped in `<AuthShell>`.

---

## H. New mobile-only components needed

Building these once, in this order, will keep the restyle clean and consistent:

1. **`src/lib/validations/password-policy.ts`** (NEW module — foundation for #3 below). Exports `passwordSchema` (Zod schema: min 10 + 3-of-4 classes; replaces the inline policy in `src/lib/validations/auth.ts`'s `registerSchema` and the `passwordValid` inline in `reset-password/page.tsx:37-44`) AND `scorePassword(value: string) => { score: 0|1|2|3|4, label: 'Too short'|'Weak'|'Fair'|'Good'|'Strong', meetsPolicy: boolean }`. **Single source of truth.** Server validates with `passwordSchema`; client renders bars from `scorePassword().score` and disables submit on `!meetsPolicy`. Refactor existing `<PasswordStrength>` to also consume `scorePassword()` so desktop and mobile share semantics.
2. **`src/components/auth/mobile-field.tsx`** (`<MobileField>`) — handoff `<Field>` analogue. RHF-compatible (forwardRef so `{...register('foo')}` works). Used by /login, /register, /forgot-password, /reset-password, /verify-email.
3. **`src/components/auth/password-strength-bars.tsx`** (`<PasswordStrengthBars>`) — 4-bar version, consumes `scorePassword()` from the new policy module (per owner Decision 4). The handoff's looser `_strength()` heuristic is **not** used.
4. **`src/components/auth/mobile-back-button.tsx`** (`<MobileBackButton>`) — 40×40 circular bg-card shadow. Used in every auth screen header on mobile.
5. **`src/components/auth/mobile-auth-header.tsx`** (`<MobileAuthHeader>`) — optional back button + progress bar (for register 2-step + onboarding 4-step in sub-phase 1.3).

No additions to `src/components/auth/auth-shell.tsx` itself — the new chrome lives inside the form panel.

---

## I. Server contracts — confirmed unchanged for Phase 1.4

| Route | API | Verb | Body | Behavior |
|---|---|---|---|---|
| `/login` (credentials path) | `/api/auth/[...nextauth]` (NextAuth) | POST | `{ email, password }` via `signIn('credentials')` | unchanged |
| `/login` (lock check) | `/api/auth/check-lock` | POST | `{ email }` | unchanged |
| `/register` | `/api/auth/register` | POST | `{ name, email, phone?, password, website_url }` | unchanged |
| `/forgot-password` | `/api/auth/forgot-password` | POST | `{ email }` | unchanged |
| `/reset-password` (validate) | `/api/auth/reset-password?token=X` | GET | — | unchanged |
| `/reset-password` (submit) | `/api/auth/reset-password` | POST | `{ token, password }` | unchanged |
| `/verify-email` (link click) | `/api/auth/email/verify` | POST | `{ token }` | unchanged |
| `/verify-email?sent=1` (resend) | `/api/auth/email/send-verification` | POST | (verify auth requirement) | **verify; possibly already in place** |
| `/(auth)/account-locked` | — | — | — | reads `?until=` and `?email=` from URL; no API call |

Per Phase 0 §3a constraint ("**No new server actions** other than what Phase 1 requires (none, since existing handlers cover everything)"), this is consistent — no new endpoints are needed if the resend endpoint already exists.

---

## J. Resolved decisions (owner sign-off 2026-05-20)

All seven open questions are now resolved. The decisions are binding for sub-phase 1.4.

1. **AuthShell preservation.** Desktop two-column at `lg:` stays untouched. Handoff mobile chrome grafts into the form panel on `lg:hidden`. No `(mobile)` route group.
2. **Helpline source of truth.** Include all four: iCall, Vandrevala, KIRAN, AASRA. Build `src/lib/safety/helplines.ts` as the single import point. Order: iCall first. Foundation commit before the auth restyle. Phone numbers verified 2026-05-20; iCall hours corrected from existing inverted "8 AM – 10 PM" to verified TISS "10 AM – 8 PM."
3. **`/verify-email` semantic gap.** Single route, two stages via `?sent=1` query parameter. **"Skip for now" link is kept** — investigation in §F.4 confirmed unverified users are not blocked from `/user` today (banner-driven nudge only).
4. **Password strength.** Server policy is the source of truth. Build shared module `src/lib/validations/password-policy.ts` exporting `passwordSchema` (Zod) and `scorePassword()`. `<PasswordStrengthBars>` and submit-disable both read from this module. Handoff's looser `_strength()` heuristic is rejected.
5. **Account-locked URL params.** Pass only `?until=<ISO8601>` — **no email identifier in URL** (privacy: history, referrer, analytics leakage). Lock screen renders countdown without "we paused [email]" personalization. "Back to login" returns to `/login` with no prefill — user re-types.
6. **Five product decisions** (all locked):
   - Google button on mobile `/login` + `/register`: **keep both**.
   - T&C checkbox default: **unchecked**.
   - Phone field on mobile `/register`: **keep optional**.
   - Auto-signin after `/reset-password`: **yes** — `signIn('credentials')` programmatic call + redirect to `/user`.
   - Helpline source of truth: addressed in Decision 2.
7. **PasswordStrengthBars semantics.** Bound to `scorePassword()` from the shared policy module. Bar visual without server-policy semantics is forbidden — see Decision 4.

The `docs/phase-1/token-drift.md` companion (Task 1.1b) will surface a related drift on `--color-text-muted` and a previously-unflagged drift on `--color-text-faint`; both stay deferred until owner reviews that document.

---

## K. Restyle order in sub-phase 1.4

Day 4 (per §3f Phase 1):
1. `<MobileField>`, `<PasswordStrengthBars>`, `<MobileBackButton>` — foundational components.
2. `/login` — easiest, lowest risk; reveals any token gaps before touching the more complex routes.
3. `/register` (2-step mobile, single-form desktop) — the largest restyle.
4. `/forgot-password`, `/reset-password` — share `<MobileField>` and the cross-tab signal logic.
5. `/verify-email` — includes the new `?sent=1` stage if owner approves question J.6.
6. `/(auth)/account-locked` — new route, and the `/login` lockout-redirect wire-up.

Day 5: Playwright iPhone 14 (390×844) screenshots for every restyled route under `screenshots/phase-1/`; smoke-test the full funnel per the kickoff checklist; commit.

---

## L. What's NOT in this diff

Out of scope for Task 1.1a (per kickoff prompt):
- Splash, Welcome, Onboarding (sub-phase 1.3).
- PWA shell (sub-phase 1.2).
- Token alignment + value drift (Task 1.1b).
- Serwist verification (Task 1.1c).
- Mobile header SOS injection (Phase 2).

These are linked from the §3f phase plan; nothing to flag here.
