# Phase 2 — Real-device QA checklist

Owner-driven checklist for items CI can't honestly verify: the 3
engagement-state mobile home, mood check-in sheet persistence, SOS
triage flow, and the persistent SOS button visible across authenticated
routes.

## Pre-requisites

- Production build running on your laptop:
  ```bash
  npm run build
  ARCJET_KEY="" npm start
  ```
- Phone connected via USB with USB debugging on. Then:
  ```bash
  adb reverse tcp:3000 tcp:3000
  ```
  (See Phase 1's `wrapup-device-qa.md` if you need the longer setup.)
- A real Android Chrome browser to drive `http://localhost:3000`.
- An account with **some activity** if you want to exercise the
  Engaged state — see Section A2 for how to seed.

Tick PASS / FAIL / DEFERRED per row. FAILs gate Phase 2 closure.

---

## A. Mobile home — 3 engagement states + mood sheet

### A1 — Empty state (brand-new account)

| # | Step | Expected | Result |
|---|------|----------|--------|
| A1.1 | Sign up a new test account from /register (`empty-test+<ts>@mindset-test.local` is fine) | Lands on /verify-email?sent=1 | |
| A1.2 | In DB, run `UPDATE users SET email_verified = NOW() WHERE email = 'your test email'` so /user is reachable | (no UI change yet) | |
| A1.3 | Navigate to /user | Empty state renders: hero copy + 3 First-step cards (Find therapist / Write entry / Browse workshops). Bell HIDDEN. SOS button visible. | |
| A1.4 | Tap any First-step card | Navigates to the correct destination (/user/sessions/book, /user/practice/journal/new, /user/discover/workshops) | |

### A2 — Partial state (some activity)

To force Partial, write at least one journal entry OR log one mood OR
complete one assignment — but stay under the Engaged thresholds
(<3 sessions OR <3 journals OR <2 assignments).

| # | Step | Expected | Result |
|---|------|----------|--------|
| A2.1 | Navigate to /user | Partial state renders: MoodHero at top with 5 faces, "Take your next step" card (Journal / Library), NextSessionCard, For-today quick tiles, Reflection of the day, partial MoodWeek with dashed empty bars, workshop teaser carousel. Bell visible. SOS button visible. | |
| A2.2 | Tap a face in MoodHero | MoodSheet slides up from bottom with that face pre-selected | |
| A2.3 | Pick a different face in the sheet, type a one-line note, tap Save check-in | Sheet closes; page revalidates; the picked face appears as the selected face in MoodHero (scale-up + cream background) | |
| A2.4 | Re-open the sheet from any face, change the mood, save again | Mood updates (replaces the same day's check-in) | |
| A2.5 | Verify in DB: `SELECT * FROM mood_check_ins WHERE user_id = '<your id>' ORDER BY checked_in_at DESC LIMIT 1;` | The latest row reflects your last selection. `note` column has your typed text. | |

### A3 — Engaged state (≥3 sessions / ≥3 entries / ≥2 assignments)

To force Engaged: write 3+ journal entries, complete 2+ assignments
(or seed in DB), have 3+ past completed sessions.

| # | Step | Expected | Result |
|---|------|----------|--------|
| A3.1 | Navigate to /user | Engaged state renders: "A look back" cream card, "Continue between sessions" Card with up to 3 pending assignments (real ones from DB), NextSessionCard, MoodHero, full MoodWeek with week-average chip, Reflection of the day, workshop teaser. | |
| A3.2 | Tap a row in "Continue between sessions" | Navigates to `/user/practice/assignments/<id>` for that assignment | |
| A3.3 | MoodWeek chart shows your last 7 days correctly (today's slot is empty if you haven't checked in today; dashed for empty days) | Visual confirm | |

### A4 — Mobile home edge cases

| # | Step | Expected | Result |
|---|------|----------|--------|
| A4.1 | Resize browser to >1024px (desktop) | Desktop reflection-landing renders. Mobile home does NOT show. | |
| A4.2 | OS reduced-motion ON (Android Settings → Accessibility → Remove animations) → reload /user | Cards still appear but slideIn/fadeUp animations are skipped (no flash, no jitter) | |
| A4.3 | NextSessionCard when no upcoming session | Renders "Nothing scheduled" + Book button → /user/sessions/book | |

---

## B. SOS triage flow

### B1 — Header SOS button

| # | Step | Expected | Result |
|---|------|----------|--------|
| B1.1 | On /user, tap the soft-pink heart-plus circle in the top-right | Navigates to /user/sos | |
| B1.2 | Visit /user/sessions, /user/practice, /user/discover, /user/profile | SOS button currently NOT injected on those routes (Phase 2 placed the header inside the home page, not the global shell). Document as carry-forward for Phase 3. | DEFERRED |

### B2 — Triage state

| # | Step | Expected | Result |
|---|------|----------|--------|
| B2.1 | /user/sos loads | Soft-pink background, three Triage Cards visible: "I just need to talk" / "I'm having a hard time" / "I'm in danger…". Back button top-left. | |
| B2.2 | Tap "I just need to talk" | Slides to Support state with kicker "We're glad you're here" and headline "Here are people who'll listen." | |
| B2.3 | Tap back inside Support | Returns to triage | |

### B3 — Support state (helplines)

| # | Step | Expected | Result |
|---|------|----------|--------|
| B3.1 | Verify the 4 helplines render in order | iCall · Vandrevala · KIRAN · AASRA. Each shows name + hours + display number. iCall + Vandrevala show a WhatsApp affordance below the number. | |
| B3.2 | Tap iCall's "Call" button | Opens the system phone dialer with 9152987821 pre-filled | |
| B3.3 | Tap iCall's "WhatsApp" link | Opens WhatsApp (or browser, if WA not installed) at https://wa.me/919152987821 | |
| B3.4 | Tap "Find a therapist" CTA at the bottom | Navigates to /user/sessions/book | |

### B4 — Crisis state

| # | Step | Expected | Result |
|---|------|----------|--------|
| B4.1 | Back to triage → tap "I'm in danger…" | Slides to Crisis state. Warm-color buttons (orange terracotta / dark teal / navy) — NOT bright red. | |
| B4.2 | Tap "Call AASRA now" | System dialer opens with 9820466726 | |
| B4.3 | Tap "Call iCall" | System dialer opens with 9152987821 | |
| B4.4 | Tap "Call KIRAN" | System dialer opens with 18005990019 | |
| B4.5 | Tap "Or text iCall on WhatsApp" | Opens WhatsApp at wa.me/919152987821 | |
| B4.6 | Footer "112" link | Opens dialer with 112 | |

### B5 — Crisis-page constraints (visual confirm)

| # | Item | Expected | Result |
|---|------|----------|--------|
| B5.1 | No analytics fired (check DevTools Network) | No requests to GA, Mixpanel, or any tracking endpoint when on /user/sos | |
| B5.2 | Footer disclaimer present on every state | "Mindset is not an emergency service. If you or someone is in immediate danger, please call 112." | |

---

## C. Cross-cutting

| # | Item | Expected | Result |
|---|------|----------|--------|
| C1 | Desktop unaffected | Open /user on the laptop (>1024px) — reflection landing + side rail render same as Phase 1 | |
| C2 | Build + typecheck still green | (verified in CI on each commit; document only if you see a regression) | |
| C3 | PWA install banner still works | (no changes to install-banner.tsx — should still appear on /user after some engagement) | |

---

## How to report results

Reply with the rows that PASS / FAIL / DEFER. FAILs need a quick note
on the symptom. If A1+A2+B2+B3+B4 all PASS, that's enough to declare
Phase 2 closed. A3 (Engaged state) needs activity-rich account data —
defer if you don't have one easily ready.
