# Real-device QA + real-mailbox check — Phase 1 wrap-up checklist

Owner-driven checklist for the items that CI / Playwright cannot
exercise honestly: A2HS, install prompts, offline behavior on a real
network, and real-mailbox email deliverability.

**Pre-requisites**

- Production build running on your machine, reachable from your phone
  on the same Wi-Fi. From the laptop terminal:

  ```bash
  npm run build
  ARCJET_KEY="" npm start
  ```

  The console will print `Network: http://172.x.x.x:3000` — that's
  the URL to open on your phone. Replace `localhost:3000` with that
  IP+port in every step below.

- A real Android phone with Chrome (any modern version) **and** ideally
  a real iPhone with Safari. If iOS isn't available, mark the iOS rows
  as DEFERRED and we'll wrap them separately.

- A live mailbox you can read on your phone — you've authorised me
  to use `choudharysuryansh1111@gmail.com` for the email check.

Tick each row as PASS / FAIL / DEFERRED. If anything is FAIL, jot the
symptom and what you saw (a screenshot if you can), and we fix before
Phase 1 closes.

---

## A. Android Chrome — install + PWA shell

| # | Step | Expected | Result |
|---|------|----------|--------|
| A1 | Open `http://<laptop-ip>:3000/welcome` in Chrome | `/welcome` renders with hero + "Get started" CTA | |
| A2 | Tap Chrome menu → "Install app" (or wait for the install banner to slide up) | Browser shows the install confirmation with `Mindset` name + icon | |
| A3 | Confirm install | App icon appears on the home screen with the maskable-512 icon (rounded corners, no white border) | |
| A4 | Launch the installed app from the home screen | Splash → `/welcome` (or `/user` if signed in). **No browser chrome visible** — full-screen standalone | |
| A5 | Inspect: is the install banner still visible inside the standalone app? | NO — the banner self-hides via `display-mode: standalone` detection | |
| A6 | Splash 50–100ms blank verification (Phase 1.2 deferral) | When launching from home screen, blank window is ≤ 100ms (close to imperceptible) before splash content paints. If it lingers, note duration | |
| A7 | Force network kill: airplane mode ON, leave Wi-Fi off | App still launches from home screen | |
| A8 | Navigate inside the app (e.g., go to a page you haven't visited yet) | The offline page renders ("You're offline") instead of a Chrome no-network error | |
| A9 | Reload `/login` or `/user` with airplane mode still on | Offline page renders | |
| A10 | Turn Wi-Fi back on, reload | Normal page loads, no stale offline page | |

## B. Onboarding gate — first-time user with a real session (Phase 1.3 deferral)

This exercises the redirect logic in
`src/app/(dashboard)/user/page.tsx` that smoke-tests bypassed via the
`mindset_onboarded=1` cookie.

| # | Step | Expected | Result |
|---|------|----------|--------|
| B1 | In a brand-new Chrome incognito tab on the **phone**, register via `/register` with a real email | Lands on `/verify-email?sent=1` after submit (matches the Playwright funnel result) | |
| B2 | Skip the verify link for now — go straight to `/user` by typing the URL | Redirected to `/onboarding` (NOT `/user`). 4-slide onboarding carousel renders | |
| B3 | Complete the 4 slides | `mindset_onboarded=1` cookie set; lands on `/user` | |
| B4 | Close incognito tab, open `/user` in a fresh incognito tab + sign back in | Lands on `/user` directly (no `/onboarding` redirect). The cookie OR the recorded activity check should skip the gate | |

## C. iOS Safari — Add to Home Screen (Phase 1.2 deferral)

If you don't have an iPhone, mark all of C as DEFERRED.

| # | Step | Expected | Result |
|---|------|----------|--------|
| C1 | Open `http://<laptop-ip>:3000/welcome` in iOS Safari | `/welcome` renders cleanly. iOS Safari shows the URL bar at the top | |
| C2 | Tap the share icon → "Add to Home Screen" | iOS A2HS sheet renders. Title is "Mindset" (from manifest `short_name`), icon is the 192px maskable PNG | |
| C3 | Confirm A2HS | App icon appears on the home screen with the iOS-style rounded mask applied | |
| C4 | Launch the installed app | Splash → `/welcome`. NO Safari chrome (no URL bar, no Safari "Done" button) — full-screen standalone | |
| C5 | Repeat steps A6–A10 on iOS (offline behavior) | Same expectations | |

## D. Full auth funnel on the **installed** Android PWA

If A1–A10 all pass, exercise the auth funnel ONCE through the installed app so we know it doesn't break under standalone mode.

| # | Step | Expected | Result |
|---|------|----------|--------|
| D1 | From the installed app, navigate to `/register` and sign up with a throwaway email | Lands on `/verify-email?sent=1` | |
| D2 | In your real inbox (separate tab/app), open the verification email; tap the link | The link opens the app (or browser, depending on Android's deep-link handling) and verifies — "Your email is verified" shows | |
| D3 | Sign in from the installed app's `/login` | Lands on `/user` (after onboarding if first time) | |
| D4 | Forgot password → enter your throwaway email → check inbox → tap reset link → set new password → submit | Auto-signs you in, lands on `/user` | |
| D5 | Fail login 5 times deliberately (wrong password) | Redirected to `/account-locked` with a live countdown | |
| D6 | Wait 15 min OR ask me to clear `lockedUntil` from DB on your laptop | Countdown hits 0:00, "Sign in now →" button appears | |
| D7 | Tap "Sign in now" → log in with the new password | Lands on `/user` | |

## E. Real-mailbox email deliverability (you authorised `choudharysuryansh1111@gmail.com`)

This is the only step I'll drive end-to-end via Playwright on the laptop — you just need to read your inbox.

I'll run a 3-email smoke and ping you with timings. The expected emails:

1. **Welcome** — sent at signup. Subject typically "Welcome to Mindset"
2. **Email verification** — sent at signup, contains the `/verify-email?token=...` link
3. **Password reset** — sent at `/forgot-password`, contains the `/reset-password?token=...` link

You verify, for each one:

| Item | Expected | Result |
|------|----------|--------|
| Arrives in **inbox**, not spam | Gmail's "Promotions" tab is acceptable; "Spam" is not | |
| FROM address | Matches `RESEND_FROM_EMAIL` env (likely `Mindset <something@mindset.org.in>` or the FALLBACK `Mindset <mindset.org.connect@gmail.com>` — see `src/lib/email-config.ts`) | |
| Reply-to is sensible | Not a no-reply if the template has support copy | |
| Branding | Mindset logo + warm colors render | |
| Footer support email | `mindset.org.connect@gmail.com` per `email-config.ts:47` | |
| Verification link works | Tapping opens `/verify-email?token=...` and verifies; no "invalid/expired" within a few minutes of receipt | |
| Reset link works | Same — tapping opens `/reset-password?token=...` with a working form | |

The `APP_BASE_URL` in the email links should be `https://mindset.org.in` per `email-config.ts:54` (server pulls `NEXT_PUBLIC_APP_URL` first; falls back to prod). For this LOCAL prod-build run the link will go to `mindset.org.in`, not your laptop — that's fine; it confirms the email body is production-ready. If you want the link to bounce back to your local instance, set `NEXT_PUBLIC_APP_URL=http://<laptop-ip>:3000` before `npm start`.

---

## How to send me the results

Reply in this conversation with the table rows that passed (`PASS`),
failed (`FAIL` + a short note + screenshot if you can), or deferred
(`DEFERRED` + reason).

If A+B+E all PASS, that's enough to declare Phase 1 done. C+D are
nice-to-have but can roll into a later session if you don't have an
iPhone or you're short on time tonight.
