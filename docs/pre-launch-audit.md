# Pre-Launch Audit Report

**Generated:** 2026-05-19 22:30 IST
**Test account:** choudharysuryansh1111@gmail.com (role: USER, verified, fresh JWT confirmed via `/api/auth/session`)
**Base URL:** https://mindset-ten.vercel.app
**Screenshots:** `docs/audit-screenshots/2026-05-19T22-13-49/`
**Driver:** Playwright 1.60.0 (headless, 1440×900)

---

## Summary

- **Public routes tested:** 18 (Phase 1)
- **Auth flows tested:** 4 (Phase 2)
- **Dashboard routes tested:** 20 (Phase 3)
- **Persistence flows tested:** 4 (Phase 4)
- **Payment flows tested:** 2 (Phase 5 — up to Razorpay modal; not completed)
- **Notifications flows tested:** 3 (Phase 6)
- **Cross-cutting checks:** 3 (Phase 7)
- **Critical bugs:** 3
- **High-severity bugs:** 2
- **Medium issues:** 4
- **Low / nice-to-fix:** 3
- **Working correctly:** the entire dashboard nav, all Phase 4 persistence flows (proves the recent Bug-3 fix held), cookie banner, robots/sitemap, JWT shape

JWT staleness is **not** present on this account — `/api/auth/session` returned `{"role":"USER"}` cleanly, so no false-positives from that bug class.

---

## Critical bugs (launch-blocking)

### C1 — `/refund-policy` returns 404

- **Route:** `/refund-policy`
- **Reproduction:** Visit `https://mindset-ten.vercel.app/refund-policy` (logged in OR out).
- **Expected:** A refund policy page renders.
- **Actual:** Next.js 404 page ("This page took a moment for itself"). The Terms of Use, in Section 8, says "see our refund policy" but doesn't link out — yet the page doesn't exist at the canonical URL.
- **Severity:** critical
- **Suggested fix:** Either (a) create `src/app/refund-policy/page.tsx` using the canonical draft already in `docs/refund-policy-audit.md`, or (b) update Terms §8 to be the canonical surface and remove any references to a separate `/refund-policy` page. Razorpay merchant policy effectively requires a public refund policy URL for the dispute flow — creating the page is the right move.
- **Screenshot:** `p1-refund-policy.png`

### C2 — `/workshops` public marketing page mixes Workshops + NGO Visits in one grid with no clear CTAs

- **Route:** `/workshops`
- **Reproduction:** Visit `/workshops` in incognito. Page heading reads "Workshops & NGO Visits — Events, learning sessions & community outreach". Grid shows 6 cards mixing workshop tiles (Stress & Burnout, Understanding Anxiety) AND NGO visit tiles (Asha Kiran Foundation, Deepalya School, Prayas Juvenile Aid Centre, Umeed Foundation) intermixed. Filter buttons "Workshops | NGO Visits" exist but the default view is "All".
- **Expected:** The page is named `/workshops` — should show workshops only. NGO visits have their own surface at `/ngo-visits`. Mixing them confuses category, breaks SEO intent, and contradicts the recent NGO Sprint scope.
- **Actual:** Cards mix categories. **No card has a visible CTA button** (no "Register", "Learn more", "Join"). Click behavior is ambiguous — cards may be clickable as a whole, but a workshop-curious user doesn't know whether clicking opens a detail page or scrolls. My probe found 52 elements matching `card` class but 0 elements matching `register|interest|join` button text.
- **Severity:** critical for marketing clarity at launch
- **Suggested fix:** Split into two surfaces: keep `/workshops` for workshops only (already covered by `src/app/workshops/page.tsx`'s "Workshops & Events" metadata), keep `/ngo-visits` for NGO visits only. If the combined hub is intentional, rename the route (`/events` perhaps) and add an explicit CTA per card.
- **Screenshot:** `p1-workshops.png`

### C3 — CSP blocks Google reCAPTCHA on every page

- **Route:** all public + dashboard routes
- **Reproduction:** Open DevTools console on any page. Site-wide CSP violation:
  > `Loading the script 'https://www.google.com/recaptcha/api.js?render=…' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com"`
- **Expected:** reCAPTCHA loads and provides bot protection on login / register / contact / forgot-password forms.
- **Actual:** Script is blocked on every page. **Bot protection on auth + contact forms is silently disabled.** No user-visible breakage; this is a security regression.
- **Severity:** critical for security; not user-visible
- **Suggested fix:** Add `https://www.google.com` and `https://www.gstatic.com` to the `script-src` directive in `next.config.ts` (or wherever the CSP is set, likely a `vercel.ts` / headers file). Also add the corresponding `frame-src` for reCAPTCHA iframe. Verify by reloading and confirming `grecaptcha` is on `window`.
- **Screenshot:** `p1-home.png` (banner overlap obscures relevant DevTools console; the error itself is in every Phase 1 finding's `consoleErrors` array in `_findings-phase-1-2.json`)

---

## High-severity issues

### H1 — `/api/ngo/join` endpoint deprecated but `/ngo-visits/join` route uses a meta-refresh redirect (not a true 307)

- **Route:** `/ngo-visits/join`
- **Reproduction:** `curl -I https://mindset-ten.vercel.app/ngo-visits/join` returns **200**, not 307. The body contains a `<meta http-equiv="refresh" content="1;url=/login?…">` plus an RSC NEXT_REDIRECT signal.
- **Expected:** A proper 307 redirect for crawler clarity and faster client behaviour.
- **Actual:** Next.js's `redirect()` in a streaming server component emits a 200 + RSC payload + meta-refresh fallback. Works in the browser, but search engines treating this as a 200 might index the redirect-stub URL. Old form HTML from a user's disk cache could also race the meta-refresh and flash the form briefly.
- **Severity:** high (caching / SEO)
- **Suggested fix:** Replace `redirect('/login?…')` inside `src/app/ngo-visits/join/page.tsx` with a `next.config.ts`-level rewrite/redirect (proper 308) so crawlers and caches see a real redirect status. Layout already has `robots: { index: false }` which mitigates SEO impact but the cache race is still real for users.
- **Screenshot:** none (HTTP-only finding; see `_findings-phase-1-2.json`)

### H2 — Notification badge does not clear after visiting `/user/notifications`

- **Route:** `/user/notifications`
- **Reproduction:**
  1. Sign in as Suryansh — spine bell shows "1" badge (one unread).
  2. Click the bell → lands on `/user/notifications`. Unread notification shows a green dot. There is a "Mark all read" button at top-right.
  3. Reload `/user` without clicking "Mark all read" — bell still shows "1".
  4. Even if you DO click "Mark all read", the bell may take time to update because `getUnreadNotificationCount` is wrapped in React `cache()` and the page may serve a stale render.
- **Expected per the NGO Sprint spec:** "On `/user/notifications` page load, mark all as read (already implemented per prior sprint)." Either visiting the page should auto-mark-as-read, or the "Mark all read" button should reliably clear the badge on next navigation.
- **Actual:** Page-load mark-as-read is not happening (or is happening but the spine read is stale). Explicit "Mark all read" click was not tested by the script.
- **Severity:** high (user trust — bell count is what drives engagement on this surface)
- **Suggested fix:** Confirm whether `/user/notifications/page.tsx` actually fires `prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } })` on render. If yes, the issue is React/Next cache — wrap the action in `revalidatePath('/user')` after the update. If no, add the mark-as-read mutation.
- **Screenshot:** `p3-notifications.png`, `p6-bell.png`, `p6-notifications.png`

---

## Medium issues

### M1 — `/user/discover/workshops/[id]` for past workshops shows no clear "this happened already" state

- **Route:** `/user/discover/workshops/cmp9ouypv0000l027kuy7gnjf` (workshop dated 18 May 2026, today is 19 May)
- **Reproduction:** Open the URL. Page renders the workshop hero, date "Monday, 18 May 2026 at 11:00 AM IST", description.
- **Expected:** A clear "This workshop has already happened" muted state, no Register button (since you cannot register).
- **Actual:** No register button is shown, but the page also doesn't explicitly say "past" — a user landing here from history would have to infer. The "Stress & Burnout" workshop (Mon 25 May) is correctly the only one shown on the list page, so the date-filter works on the list — the gap is in the detail page's UX for stale links.
- **Severity:** medium
- **Suggested fix:** Add a past-workshop state similar to the NGO-visit detail page (which I shipped with "This visit has already happened" in Sprint NGO-Dashboard, Task 4). Likely 5 lines in `src/app/(dashboard)/user/discover/workshops/[id]/page.tsx`.
- **Screenshot:** `p3-discover-workshop-detail.png`

### M2 — Cookie banner permanently overlaps page content on every dashboard page (no scroll-with-content; covers Save buttons)

- **Route:** every dashboard route, until consent is given
- **Reproduction:** Visit any `/user/*` page from a fresh browser context (Playwright's default). Cookie banner is `fixed bottom-0` at z-index 50, covering the bottom 80–120px of the viewport. On `/user/profile/personal` this overlaps the "Save changes" button at certain heights. Cookie banner contains 3 actions: Customize / Reject non-essential / Accept all.
- **Expected:** Banner doesn't permanently obscure interactable UI. Either auto-dismiss after first interaction, or push content up rather than overlay.
- **Actual:** Banner stays until the user clicks one of the three buttons. In screenshots `p3-profile-personal.png` and `p3-sessions-book-doctor.png` the banner directly overlaps Save and Pay controls respectively. A real user is likely to dismiss it once and not see it again; an audit user sees it on every page.
- **Severity:** medium (real-world impact small once user accepts/rejects once)
- **Suggested fix:** This is largely a Playwright artifact — real users hit this banner once and dismiss. But two small tweaks would help: (a) cap banner height on mobile, (b) reserve space at the bottom of the viewport via `padding-bottom: <banner-height>px` on `<body>` while the banner is visible.
- **Screenshot:** any `p3-*.png`

### M3 — `/api/ngo/join` deprecated endpoint still listed in sitemap

- **Route:** `/sitemap.xml` line for `/ngo-visits/join`
- **Reproduction:** `curl https://mindset-ten.vercel.app/sitemap.xml | grep ngo` returns a `<url>` entry for `/ngo-visits/join`.
- **Expected:** The deprecated redirect path should not be in the sitemap.
- **Actual:** It is (was committed before the redirect was added — left over from the previous SEO sprint).
- **Severity:** medium (SEO hygiene)
- **Suggested fix:** Remove the `/ngo-visits/join` entry from `src/app/sitemap.ts`. Re-deploy.
- **Screenshot:** none

### M4 — Invalid-email-format login: no client-side error surfaced

- **Route:** `/login`
- **Reproduction:** Type `not-an-email` in the email field, anything in password, click submit. No visible error appears.
- **Expected:** A friendly "Please enter a valid email" message, ideally inline under the email field.
- **Actual:** Submit appears to silently do nothing (probably the HTML5 `type="email"` validity check is blocking it, but no visible message). I could not detect a Playwright-visible error text matching `invalid|valid email`.
- **Severity:** medium (UX) — wrong-password case correctly shows "Invalid email or password", so the credentials path is fine.
- **Suggested fix:** Add a visible inline error tied to react-hook-form's email validation result. ~5 lines.
- **Screenshot:** `p2-invalid-email.png`

---

## Low / nice-to-fix

### L1 — Session booking for seeded doctor shows "No available slots at the moment"

- **Route:** `/user/sessions/book?doctorId=cmmk305d40002tb3e378vjp5f` (Dr. Ananya Sharma)
- **Reproduction:** Open the URL. Profile loads, but the slot picker says "No available slots at the moment."
- **Expected (for an audit smoke test):** At least one bookable future slot so payment flow can be exercised end-to-end. For a real user, this is fine if Dr. Ananya has no availability set.
- **Actual:** Empty. **This blocked Phase 5's session-payment flow from reaching the Razorpay modal.** Either no future slots exist, or the availability cron / admin hasn't populated them.
- **Severity:** low (operational; not a code bug — but it does mean the booking happy-path isn't tested end-to-end)
- **Suggested fix:** Have a doctor with at least one future slot for QA. Or seed a "QA doctor" with permanent rolling availability.
- **Screenshot:** `p3-sessions-book-doctor.png`, `p5-book-doctor.png`

### L2 — Workshop seeded ID `cmp9ouypv0000l027kuy7gnjf` is in the past, blocked Phase 5 workshop-register test

- **Route:** `/user/discover/workshops/cmp9ouypv0000l027kuy7gnjf`
- **Reproduction:** Open the URL. Workshop is dated 18 May 2026 (yesterday). No register button is shown (correct — past workshops can't be registered for).
- **Expected:** A future-dated seeded workshop ID for QA.
- **Actual:** Past workshop. Phase 5 logged "no register/pay/join button on workshop detail (may be already registered or free)."
- **Severity:** low (operational, same as L1)
- **Suggested fix:** Maintain a rolling "QA workshop" record dated +7 days that admin or a cron keeps fresh.
- **Screenshot:** `p3-discover-workshop-detail.png`, `p5-workshop-detail.png`

### L3 — `btn-primary` CSS class is referenced but not defined anywhere

- **Route:** `/ngo-visits` (CTA), navbar Dashboard/Login links
- **Reproduction:** `grep -rn "\.btn-primary" src/app/globals.css` returns nothing. The class is used in `src/components/navbar-auth.tsx` and `src/app/ngo-visits/join-cta.tsx`.
- **Expected:** A class used 8+ times has a CSS definition somewhere.
- **Actual:** It doesn't. The buttons still get *some* styling from neighboring utility classes and inline styles, but `btn-primary` is dead code.
- **Severity:** low (cleanup; no user-visible breakage at current scale)
- **Suggested fix:** Either define `.btn-primary` in `globals.css` or remove the class usage. The latter is safer for a soft launch.
- **Screenshot:** none

---

## Working as expected (green baseline)

These were tested and behaved correctly — establishes confidence that the recent sprint fixes held.

**Public marketing (Phase 1):**
- All 18 routes return 200 (except `/refund-policy` which is the critical bug above)
- `/robots.txt` correctly disallows `/user`, `/admin`, `/doctor`, `/verify-email`; lists Sitemap directive
- `/sitemap.xml` lists 13 URLs (correctly does NOT list `/refund-policy`)
- `/cookies` policy page renders (created in Sprint Launch-Prep Task 1)
- `/privacy-policy`, `/terms-of-use` render
- Cookie banner appears on first visit, "Customize" opens the preferences modal correctly (Sprint Launch-Prep Task 1 verified live)
- `/ngo-visits` Join Now CTA correctly routes to `/login?callbackUrl=%2Fuser%2Fdiscover%2Fngo-visits` when logged out (Bug 1 fix verified live)
- Wrong password on `/login` shows "Invalid email or password"

**Auth flows (Phase 2):**
- `/login` and `/register` pages load with forms
- `/forgot-password` route exists and loads

**Dashboard walkthrough (Phase 3):** all 20 routes loaded cleanly with no console errors beyond the known reCAPTCHA CSP noise (see C3):

- `/user` (home), `/user/sessions`, `/user/sessions/book`, `/user/sessions/book?doctorId=…`
- `/user/practice`, `/user/practice/journal`, `/user/practice/journal/new`, `/user/practice/assignments`
- `/user/discover`, `/user/discover/workshops`, `/user/discover/workshops/[id]`, `/user/discover/ngo-visits`
- `/user/library`, `/user/shop`, `/user/cart`, `/user/orders`
- `/user/notifications`, `/user/profile`, `/user/profile/personal`, `/user/reflection/today`

**Persistence (Phase 4) — all four pass, confirming the Bug 3 fix held:**
- Preferred language: write sentinel → save → reload → read back: ✅ identical
- Preferred language: clear → save → reload → read back empty: ✅ persists as cleared
- Phone field blanking: shows "Phone cannot be cleared. To remove it, contact support." inline error ✅
- Phone field label shows "Phone number (required)" when a value exists ✅
- Journal new entry: write → save → URL navigates from `/journal/new` to `/journal/<new-id>` ✅

**Cross-cutting (Phase 7):**
- `/api/auth/session` returns `{"user": {..., "role": "USER"}, "expires": "2026-06-18T17:04:41.750Z"}` — JWT correctly carries `role` for this account (no JWT-stale issue here)
- `robots.txt` has Sitemap directive, disallows the right routes
- `sitemap.xml` has 13 URL entries

**NGO sprint output verified live:**
- `/user/discover/ngo-visits` shows Asha Kiran Foundation with green "✓ Registered" pill (Suryansh has the NGO sprint test registration on this account)
- Spine bell shows correct unread count of 1 with coral badge (Sprint NGO-Dashboard notification bell)
- `/ngo-visits/join` correctly redirects (logged out → `/login`)

---

## Phase 5 — payment flows (not completed)

Both payment flows were blocked from end-to-end completion by seeded test data — not by code bugs:

| Flow | Result | Why |
|---|---|---|
| Session booking → Razorpay modal | **Blocked** | Dr. Ananya Sharma (`cmmk305d40002tb3e378vjp5f`) has no future availability — slot picker shows "No available slots at the moment." See L1. |
| Workshop registration → Razorpay modal | **Blocked** | Seeded workshop `cmp9ouypv0000l027kuy7gnjf` is dated 18 May 2026 (past). No register button is shown. See L2. |

**No PENDING Payment rows were created during this audit** — neither flow reached the Razorpay modal because both upstream steps were blocked.

**Suryansh manual TODO:** to actually exercise Phase 5, either (a) book a session for a doctor with active availability, or (b) register for "Stress & Burnout — A Recovery Workshop" (Mon 25 May, ₹500) which IS future-dated and bookable. Use Razorpay test card `4111 1111 1111 1111` per the sprint guardrails.

---

## DB rows created by this audit

These were the only durable side-effects:

1. **`JournalEntry`** — user `cmp46znjl000005l5qc9m3rg9` (Suryansh), id `cmpcvudqc000004l5gteg1ihp`, body "Audit 1779210247212: persistence check.", created 2026-05-19T17:03:57Z (UTC).
   - Visible at `/user/practice/journal/cmpcvudqc000004l5gteg1ihp` — safe to keep or delete.
2. **Profile updates** — `preferredLanguage` was written and then cleared during Phase 4. Net state: back to whatever it was before (empty). Phone was momentarily blanked but the sticky-required check prevented save; restored to `9718812356`.

Nothing else (no Payment rows, no Notifications, no Sessions, no WorkshopRegistrations).

---

## Recommendations

### Must fix before soft launch

- **C1**: Ship `/refund-policy` page (or delete every link to it). Razorpay merchant onboarding will require a public refund policy URL.
- **C2**: Decide whether `/workshops` shows workshops only or both. Either way, add per-card CTAs so users know they can click. Marketing-clarity blocker.
- **C3**: Fix the CSP so reCAPTCHA loads. Auth + contact forms are currently unprotected from automated abuse.
- **H1**: Convert `/ngo-visits/join` redirect to a `next.config.ts`-level 308 to fix the SEO + cache-race issue.
- **H2**: Confirm + repair the "visit `/user/notifications` should mark all as read" promise. Either auto-mark on page load OR document explicitly that "Mark all read" is the only way and ensure it actually clears the spine badge.

### Should fix before public launch

- **M1**: Past-workshop state on the detail page.
- **M3**: Remove `/ngo-visits/join` from the sitemap.
- **M4**: Inline error on invalid-email login.

### Nice-to-have, can wait

- **L1, L2**: Maintain seeded QA data (rolling doctor availability + a future-dated QA workshop). Operational, not a code change.
- **L3**: Remove or define `btn-primary` class.
- **M2**: Tweak cookie banner to either auto-dismiss after first interaction-elsewhere or push content up via padding-bottom.

### Notes for Suryansh

- **JWT health on your test account is fine** — `/api/auth/session` shows `role: USER` cleanly. The "stale JWT bouncing to /" symptom we diagnosed last sprint does not reproduce on this account today.
- **Phase 4 confirms the Bug 3 fix is live and works.** Phone sticky-required + other fields clearable + journal save persistence all green.
- **No payment was actually processed.** Phase 5 was blocked upstream by the seeded data. To test Razorpay end-to-end yourself, use the "Stress & Burnout" workshop on Mon 25 May (₹500) — that one IS future-dated. Use test card `4111 1111 1111 1111`.
- **Cookie banner appears on every dashboard screenshot** in this audit only because Playwright contexts are fresh. Real users see it once, dismiss, and don't see it again.

---

## How to reproduce this audit

```bash
# Phase 1 + 2 (incognito, public + auth)
AUDIT_OUT="docs/audit-screenshots/2026-05-19T22-13-49" npx tsx tools/audit-phase-1-2.ts

# Phase 4 + 5 + 6 + 7 (signed in as Suryansh)
AUDIT_PASSWORD='<password>' \
AUDIT_OUT="docs/audit-screenshots/2026-05-19T22-13-49" \
npx tsx tools/audit-phase-4-7.ts
```

Findings JSON: `docs/audit-screenshots/2026-05-19T22-13-49/_findings-phase-1-2.json` and `_findings-phase-4-7.json`.
