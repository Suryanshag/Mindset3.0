# Phase 3 — Real-device QA checklist

Owner-driven checklist for the 5 Phase 3 surface clusters:
A — Sessions tabs + therapist list/detail
B — Booking flow (existing Razorpay; visual chrome only)
C — Session detail + Meet link button states
D — Post-session interstitial
E — MobileHeader cross-route visibility

## Pre-requisites

Same as Phase 1/2:
- `npm run build && ARCJET_KEY="" npm start` on the laptop
- Phone connected via USB with USB debugging on; `adb reverse tcp:3000 tcp:3000`
- Chrome (or Brave) on the phone, open `http://localhost:3000`

Tick PASS / FAIL / DEFERRED. FAIL = symptom + screenshot.

---

## A. Sessions tabs + therapist list/detail

| # | Step | Expected | Result |
|---|------|----------|--------|
| A1 | Open /user/sessions | "Therapy" header + 3-tab pill: Upcoming / Find a therapist / Past | |
| A2 | Tap **Upcoming** | If sessions exist: primary-bg featured card with avatar + date + Join chip (or countdown). "Next up" list below. "Book another session" dashed CTA at the bottom | |
| A3 | Tap **Find a therapist** | Search bar (non-functional), specialization chip filters, real Doctor list with avatar + name + type + experience + price | |
| A4 | Tap a therapist card | Lands on /user/sessions/book/<doctorId> | |
| A5 | Therapist detail renders | Tinted hero (primary or accent depending on type) + back arrow + heart, large avatar, type kicker, name, specialization. Stats (Experience + Session price). About paragraph (real bio). Qualifications card. Focus chips. Sticky "Book a session" pill at bottom with price | |
| A6 | Tap **Past** | List of past sessions (latest 20) with avatar + name + status + date | |

## B. Booking flow (Razorpay untouched)

| # | Step | Expected | Result |
|---|------|----------|--------|
| B1 | From therapist detail, tap "Book a session" | Lands on /user/sessions/book?doctorId=<id> (existing Razorpay-integrated page) | |
| B2 | Pick a slot, continue | Razorpay modal opens with test card pre-filled (4111 1111 1111 1111) | |
| B3 | Submit payment | Verify-first flow fires (existing). Confirmation screen renders | |
| B4 | After confirmation, navigate to /user/sessions Upcoming tab | New session visible in the list | |
| B5 | DB sanity: `SELECT * FROM payments ORDER BY created_at DESC LIMIT 1` | Payment row with `razorpay_payment_id` set, status PAID | |

## C. Session detail + Meet link

| # | Step | Expected | Result |
|---|------|----------|--------|
| C1 | Tap an upcoming session card | /user/sessions/[id] mobile variant: tinted hero (primary/accent by doctor.type), back arrow, date + time pill, large avatar, status badge, name, designation + duration | |
| C2 | If session is > 15 min away | Join button shows "Join link will be active 15 minutes before the session" (existing SessionJoinCta logic) | |
| C3 | If session is < 15 min away AND has meetLink | Prominent "Join session" button. Tapping opens the meetLink (Google Meet app on Android) | |
| C4 | Cancel CTA visibility | Visible when > 24h before start. < 24h shows "Can't cancel within 24 hours of start time." copy. Cancelled sessions show "Book again" CTA | |

## D. Post-session interstitial

To exercise: have an account with at least one ended session that has
NO SessionFollowup row. Quick way: write a row to DB:
```sql
-- Mark a session as ended without a followup
UPDATE sessions SET date = NOW() - INTERVAL '2 hours' WHERE id = 'your_session_id';
DELETE FROM session_followups WHERE session_id = 'your_session_id';
```

| # | Step | Expected | Result |
|---|------|----------|--------|
| D1 | Open /user | The post-session interstitial appears INSTEAD of the home dashboard. Avatar + "After your session with Dr X". Step 1 dots: filled, dim | |
| D2 | Tap a face | Active mood scaled up + tinted. Continue button enables | |
| D3 | Type a note (optional) → tap Continue | Step 2 renders: 3 rebook options with date suggestions | |
| D4 | Pick "Same time next week" → tap "Pick a slot" | Navigates to /user/sessions/book?doctorId=<id> | |
| D5 | Go back to /user | Interstitial does NOT re-appear (followup row exists) | |
| D6 | DB sanity: `SELECT * FROM session_followups ORDER BY completed_at DESC LIMIT 1` | Row with `post_mood`, `homework_note`, `rebook_intent` matching your input | |
| D7 | Tap "Skip" on step 1 (with a fresh ended session) | Interstitial closes immediately. Followup row exists with all-null fields | |
| D8 | Visit /user/sos when interstitial is pending | SOS triage renders, NOT the interstitial (skip-list works) | |

After completing D1-D6, the HomeEngaged "Your last N sessions" panel
should reflect this followup if the user is in Engaged state (≥3
sessions / ≥3 entries / ≥2 assignments). Otherwise HomePartial doesn't
show that block.

## E. MobileHeader cross-route visibility

| # | Step | Expected | Result |
|---|------|----------|--------|
| E1 | Navigate to /user/sessions | MobileHeader visible top: date + greeting + bell (with unread dot if any) + soft-pink SOS button | |
| E2 | Navigate to /user/practice, /user/discover, /user/profile, /user/notifications, /user/cart, /user/orders | Same MobileHeader on each | |
| E3 | Tap SOS button from any of those routes | Lands on /user/sos | |
| E4 | /user (home) — header is still rendered, but by the home component itself (with state-specific bell-hide on empty state) | Verify: empty state HIDES bell; partial/engaged SHOW bell | |
| E5 | /user/sos — no header at top (back-button chrome instead) | Verify: shell header NOT rendered on the SOS triage page | |

---

## Reporting

Reply with PASS / FAIL / DEFERRED per row. FAILs need a short note +
screenshot. If A1-A6 + C1-C4 + D1-D6 + E1-E5 all PASS, Phase 3 closes.
B (Razorpay booking) is well-tested from prior sprints — a smoke
through one booking is enough to confirm the visual wrapper didn't
break the underlying flow.
