# Phase 7 — Real-device QA checklist

Owner-driven checklist for the two ported surfaces:
- Mobile notifications screen (Phase 7.1)
- Account-locked card polish (Phase 7.2d)

Phase 7.2a, 7.2b, 7.2c (ForgotPassword / ResetPassword / VerifyEmail)
shipped during Sprint Auth-Revamp in Phase 1 and were verified at parity
with the design during the Phase 7 audit — no code changes needed; no
re-QA needed.

## Pre-requisites

Same pattern as Phase 1-6.

```
npm run build && ARCJET_KEY="" npm start
adb reverse tcp:3000 tcp:3000
open http://localhost:3000 on the phone
```

---

## A. Mobile Notifications

| # | Step | Expected | Result |
|---|------|----------|--------|
| A1 | Seed >=3 unread notifications (book a session + register for a workshop + place a small order). Or via test API. | At least 3 rows of unread will appear in the next steps. | |
| A2 | Open /user/notifications on the phone | Header "Notifications" + back chevron. "Mark all read" button visible top-right (because hasUnreadOnLoad). | |
| A3 | Unread rows visual | 4px colored left bar matching the kind's tint (primary for SESSION_*, amber for WORKSHOP*, navy for ORDER, accent for REVIEW/ASSIGNMENT_COMPLETED). Full opacity. | |
| A4 | Read rows visual | No left bar, 0.7 opacity, faded text. | |
| A5 | Group headers | "Today" / "This week" / "Earlier" pre-section. Empty sections hidden. | |
| A6 | Tap a notification with `link` | Card flips to read styling INSTANTLY (optimistic UI). Navigation happens immediately. Server-side mark fires in background. | |
| A7 | Return to /user/notifications | Tapped row stays read (server caught up). Other rows still in their state. | |
| A8 | Generate a NEW unread notification while you're on this page (open another browser tab, trigger something that creates a Notification row, return to the notifications tab and refresh). | New row appears in Today bucket with colored left bar. "Mark all read" button still visible. | |
| A9 | Tap "Mark all read" | All unread rows flip to read styling INSTANTLY. Server `markAllNotificationsRead` fires in background. Button can disappear or stay (per design, stays while button still visible from initial load). | |
| A10 | Visit /user → check the spine bell badge | Badge cleared (0 unread). | |
| A11 | Empty state — read everything, then refresh | Card with bell icon + "You're all caught up" + "New nudges will land here." | |

## B. AccountLocked — soft-pink token polish

Trigger: fail login 5 times in a row with the same email. The 5th failure
locks the account for 15 minutes (per existing Sprint Auth-Revamp) and
the login page should redirect to /account-locked?until=...

| # | Step | Expected | Result |
|---|------|----------|--------|
| B1 | Hit /account-locked from a 5x-failed-login flow OR construct URL manually `?until=<ISO future date>` | "Account paused" eyebrow + "We've paused this account for safety" headline. Soft-pink card below with lock icon + mm:ss countdown. | |
| B2 | Card background tone | Soft-pink at ~35% alpha (same family as existing; now driven by `--soft-pink` token via color-mix). Visually identical to pre-7.2d at glance. | |
| B3 | Countdown ticks down each second | mm:ss formatting; reaches 0:00 and then "Your account is unlocked" copy + "Sign in now" CTA primary. | |
| B4 | Reset password CTA | Routes to /forgot-password. | |
| B5 | Back-to-login CTA when locked | Outlined button, returns to /login. | |
| B6 | Desktop variant at >1024px | Same soft-pink token applied to icon-tile + countdown chip backgrounds. Visual at glance unchanged. | |

## C. Cross-cutting (regression smoke)

| # | Step | Expected | Result |
|---|------|----------|--------|
| C1 | Phase 1 /forgot-password — input stage | Email input + Send reset link button. Unchanged from Sprint Auth-Revamp. | |
| C2 | /forgot-password sent stage | bg-cream card + check icon + 60s cooldown + amber expiry warning + Open mail app / Resend / Back-to-login. | |
| C3 | /reset-password with a real token | 4-bar PasswordStrengthBars + "Passwords match" / "Don't match yet" + Show/Hide. Submit unblocks at Fair or better. | |
| C4 | /verify-email-sent | bg-cream card + 60s cooldown + "Wrong email? Edit" link. | |
| C5 | Phase 6 /user/profile mobile | Avatar + therapist card + Settings/Functional/Help cards + Sign out. (Phase 6 regression check.) | |

## Sign-off

When every row above is verified Pass:

- [ ] Suryansh signs off
- [ ] Append "DONE" line to PORT_LOG.md Phase 7 entry
- [ ] Move on to Phase 8 (TWA wrapper + Bubblewrap)

If any FAIL: file the issue here under Section D, link to a fix branch.

## D. Issues found during QA

_None yet._
