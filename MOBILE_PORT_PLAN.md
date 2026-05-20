# Mobile Port Plan

**Owner-approved as of 2026-05-20** (pending final confirmation of these amendments)
**Status:** Phase 0 — Discovery & Planning (no code changes yet; Phase 1 not started)
**Author:** Phase 0 audit, 2026-05-20; Amendments A/B/C applied 2026-05-20
**Target:** Ship mindset.org.in as a mobile-first responsive experience inside the same Next.js app, then wrap as a TWA for Play Store.

---

## 0A. Approved schema changes

Exactly **one** schema change is approved for this entire port. No others.

- **`AuthEventKind` enum** — add a new value `ACCOUNT_DELETED`. Used by the new `requestAccountDeletion` server action and by the nightly hard-delete cron to record the lifecycle. Single-line Prisma migration.

Any other schema-change need that arises during Phases 1–7 must be flagged to the owner and approved separately before being implemented.

## 0B. Approved net-new email templates

Two new React Email templates are approved. No others. Both follow the existing template style in `src/emails/*.tsx`, use the centralized `FROM_EMAIL` from `src/lib/email-config.ts`, and are dispatched fire-and-forget via `src/lib/email-service.ts` to match existing patterns.

- **`account-deletion-requested.tsx`** — Sent on submission of the deletion form. Confirms the 7-day cooling-off window, names the calendar date the hard-delete will run, and includes a "Cancel deletion" link/CTA pointing to a sign-in flow that restores the account.
- **`account-deletion-completed.tsx`** — Sent on day 7 by the nightly cron immediately after the hard-delete transaction commits. Confirms what was retained (clinical notes per RCI, payment receipts per Indian tax law, audit logs per security) and what was deleted. Final touchpoint.

Post-session feedback emails and daily reflection prompt emails are **deferred to a later sprint** and are explicitly **not** part of this port.

---

## 0C. Architectural posture — Option Z, diff-first

The new Claude-Design mobile UI **replaces** the existing mobile/desktop user dashboard in place. It is **not** a parallel route group. URLs are unchanged; layouts and styling are restyled in place; data shapes and server actions stay the same.

The existing `/user/*` tree and the handoff design are **functionally similar but not identical**. Before restyling any route in Phases 2–5, the implementer must produce a per-route **diff report** containing:

1. What's in the existing route that's missing from the design → **must be preserved**.
2. What's in the design that's missing from the existing route → **must be added**.
3. What's in both but rendered differently → **design wins on visual, existing wins on data shape**.

These diffs are produced **at the start of each implementation phase, route by route** — not upfront in Phase 0. The owner reviews each phase's diffs before restyling begins, so nothing important is silently dropped.

---

## 0. Method and skills used

- Loaded `superpowers:using-superpowers` (introduction) and `superpowers:brainstorming` (planning protocol).
- Per skill priority rules, the project's `CLAUDE.md` is the design spec for Phase 0; this document is the deliverable.
- Discovery executed by three parallel `Explore` agents reading only inside `Mindset3/` and `Mindset Android app/Mindset (2)/`. Cross-checked critical files (`package.json`, `manifest.webmanifest`, `src/components/dashboard/user/mobile-header.tsx`, `src/app/(dashboard)/user/sessions/[id]/page.tsx`) directly.
- No production file was modified. No package installed. No dev server started. No schema or route was touched.

---

## 1. Critical framework note (read first)

The production stack is **Next.js 16.2.4 / React 19.2.4 / NextAuth v5 (`5.0.0-beta.30`) / Prisma 7.7.0 / Tailwind v4 / next-auth + Neon Postgres**.

`AGENTS.md` at the repo root explicitly warns:

> "This is NOT the Next.js you know. This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code."

**Implication for this port:**
- `next-pwa` was last tested against Next.js 14 and is unlikely to work cleanly with Next 16. Plan assumes **Serwist** (the maintained successor) or a **hand-rolled service worker** behind `app/sw.ts`. Final choice deferred to Phase 1 day 1 after verifying against the local Next 16 docs and Context7.
- All framework-level questions (route handlers, `app/manifest.ts` vs `public/manifest.webmanifest`, `next/font`, server actions caching) must be verified against `node_modules/next/dist/docs/` before any code is written.
- The code-review-graph MCP (declared in CLAUDE.md) should be the primary code-exploration tool during implementation phases; Phase 0 used Explore agents to produce the audit, which is now the authoritative reference.

---

## 2. Discovery snapshot — what already exists

### 2.1 Route inventory (user-facing)

The `(dashboard)/user/*` tree already contains **every major route the handoff design needs**, and every one of them is wrapped in `<MobileShell>` + `<BottomNav>` with a `lg:` breakpoint split to a `<DesktopShell>`. Existing user routes (all mobile-responsive today unless flagged):

| Existing route | Notes |
|---|---|
| `/user` | Home, server-side calls `getReflectionLandingData` and `getUserEngagementState`; layout has `MobileHeader` with greeting + stat chips |
| `/user/sessions` | Sessions index |
| `/user/sessions/[id]` | Detail; has `SessionJoinCta`, `CancelSessionButton`, `SessionUserNotes` |
| `/user/sessions/book` | Booking flow exists |
| `/user/practice` | Hub |
| `/user/practice/journal` | List + `/new`, `/[id]`, `/[id]/edit` |
| `/user/practice/assignments` | List + `/[id]` |
| `/user/shop`, `/user/shop/[id]`, `/user/cart`, `/user/orders`, `/user/orders/[id]`, `/user/orders/checkout`, `/user/payments`, `/user/addresses` | Full commerce flow |
| `/user/discover`, `/user/discover/workshops`, `/user/discover/workshops/[id]`, `/user/discover/ngo-visits`, `/user/discover/ngo-visits/[id]` | Discover hub |
| `/user/library`, `/user/library/[id]` | Owned content |
| `/user/profile` + `personal`, `addresses`, `payments`, `notifications`, `help`, `about` | Settings tree |
| `/user/notifications` | Notification center |
| `/user/reflection/today` | Daily reflection prompt |
| `(auth)/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` | All responsive; AuthShell wraps |

**Admin routes (`/admin/*`)** are desktop-only and **not in scope** for the mobile port. Doctor routes (`/doctor/*`) are responsive but also out of scope for the consumer-facing mobile app.

### 2.2 Net-new routes the handoff design implies

These do not exist today and must be added:

| Net-new screen | Proposed route |
|---|---|
| Splash (animated logo, 2.2 s auto-advance) | `/splash` (or in-app overlay; see §3) |
| Welcome (pre-auth landing with Sign in / Sign up / Google) | `/welcome` |
| Onboarding (4-slide tutorial after first signup) | `/onboarding` |
| Account locked (post-lockout messaging) | `/(auth)/account-locked` (display variant of `/login`) |
| Account deletion 4-step | `/user/profile/delete-account` |
| Breathe (standalone breathing exercise) | `/user/practice/breathe` |
| SOS triage | `/user/sos` |
| Insights (weekly mood/practice analytics) | `/user/insights` |
| Post-session wrap-up (user-initiated: mood → optional homework prompt → rebook) | `/user/sessions/[id]/wrap-up` |
| Account-deletion hard-delete cron | `/api/cron/account-deletion` (route, not a screen) |

### 2.3 Tokens — already aligned

`src/app/globals.css` defines a `@theme` block (Tailwind v4 native) whose dashboard tokens **match the handoff `app/tokens.css` exactly on values**, only the **names differ** (repo uses `--color-X`, design uses bare `--X`). Examples:

| Handoff token | Existing repo token | Same value? |
|---|---|---|
| `--bg-app: #F7F2EA` | `--color-bg-app: #F7F2EA` | ✅ |
| `--bg-card: #FFFFFF` | `--color-bg-card: #FFFFFF` | ✅ |
| `--primary: #2D5A4F` | `--color-primary: #2D5A4F` | ✅ |
| `--primary-tint: #DDE9DC` | `--color-primary-tint: #DDE9DC` | ✅ |
| `--accent: #C97864` | `--color-accent: #C97864` | ✅ |
| `--accent-tint: #FBE9DD` | `--color-accent-tint: #FBE9DD` | ✅ |
| `--navy: #1E445C` | `--color-navy: #1E445C` | ✅ |
| `--text: #1A1A1A` | `--color-text: #1A1A1A` | ✅ |
| `--text-muted: #6B6862` | (close: `--color-text-muted: #3D3935`) | ⚠️ value drift |
| `--soft-pink: #FAA79D` | `--color-soft-pink: #FAA79D` | ✅ (Phase 0 misread; values match — see `docs/phase-1/token-drift.md`) |
| `--soft-blue: #A1CCE7` | `--color-soft-blue: #A1CCE7` | ✅ |
| `--amber: #FFAA11` | `--color-amber-500: #FFAA11` | ✅ |

**Action (Phase 1):** add bare-name aliases in `globals.css` (e.g., `--bg-app: var(--color-bg-app)`) so handoff-style class strings (`style={{ background: 'var(--bg-app)' }}`) work without rewriting every component. The actual drifts are documented in `docs/phase-1/token-drift.md` after the sub-phase 1.1b survey: `--text-muted` syncs to design value at the start of sub-phase 1.4 (passes AA); `--text-faint` is held at the production value as an **accessibility exception** to Resolved Decision 14 (design value `#9A968F` measures 3.05:1 on `--bg-app`, failing WCAG AA at 4.5:1). The `--soft-pink` "drift" reported in the original Phase 0 audit was a misread — production and design both hold `#FAA79D`.

### 2.4 Fonts — already loaded

`src/app/layout.tsx` loads via `next/font/google`:

- **Nunito** (body) — weights 400/600/700/800/900, var `--font-nunito`
- **Barlow Condensed** (display) — weights 600/700/800, var `--font-heading-var`
- **Source Serif 4** (serif italic) — weights 400/600 (italic + roman), var `--font-serif-var`

Handoff `Mindset.html` uses the same three families. **No font work required.**

### 2.5 Existing server actions and queries we'll reuse

**Actions (`src/lib/actions/`):**
- `assignments.ts`: `completeAssignment`, `skipAssignment` — already handle JOURNAL_PROMPT auto-journal-entry creation and engagement events
- `journal.ts`: `createJournalEntry`, `updateJournalEntry`, `saveDraft`, `publishDraft`, `discardDraft`, `deleteJournalEntry` — full draft lifecycle
- `mood.ts`: `logMoodCheckIn` — upserts today's mood, logs engagement
- `sessions.ts`: `cancelSession` — 24-hour rule already enforced
- `workshops.ts`: `registerForWorkshop` (free)
- `ngo.ts`: `registerForNgoVisit`
- `notifications.ts`: `markNotificationRead`, `markAllNotificationsRead`
- `upload-avatar.ts`: Cloudinary

**Queries (`src/lib/queries/`):**
- `dashboard.ts`: `getNextWorkshop`, `getUpcomingSession`, `getUserStreak`, `getUserStats`, `getTodaysMoodCheckIn`, `getUnreadNotificationCount`, **`getUserEngagementState`** (returns `'empty' | 'partial' | 'engaged'` — matches the handoff Home 3-state design exactly)
- `reflection.ts`: `getSpineSessions`, **`getReflectionLandingData`**, `getChapterData`
- `journal.ts`: `getJournalEntries`, `getJournalEntry`, `getLatestJournalEntry`, `getActiveDraft`, `getPendingJournalPrompt`
- `upcoming.ts`: `getUpcomingItems` (sessions + workshop registrations, merged)
- `cart.ts`: `getInitialCartItems`
- `current-user.ts`: `getCurrentUserBasics`

The **engagement-state alignment is the most important discovery of this audit**: the server already classifies users into the same three buckets the design's Home Empty / Partial / Engaged states require. The home screen is a direct wiring job, not an invention.

### 2.6 Integrations confirmed in place

- **Razorpay** — `src/lib/razorpay.ts`, `POST /api/payments/create-order` discriminates SESSION / PRODUCT / EBOOK / WORKSHOP, webhook at `POST /api/payments/webhook` (HMAC-validated, fans out to email + Shiprocket + DoctorEarning).
- **Resend (email)** — 18 React Email templates already exist; full list in §6 below.
- **Cloudinary** — avatars only, `mindset/avatars` folder.
- **Shiprocket** — `src/lib/shiprocket.ts`, `src/lib/create-shipment-for-order.ts`, webhook at `POST /api/shiprocket/webhook`.
- **Arcjet** — five limiter profiles (auth, sensitive, form, api, public-get) applied across routes.
- **Google Calendar** — `src/lib/google-calendar.ts` present but **dormant**; `Session.calendarEventId` field exists but creation/update calls are not wired into current flows.
- **OpenRouter / LLM** — none.
- **reCAPTCHA v3** — silent, wraps registration via `RecaptchaProvider`.

### 2.7 PWA state today

- `public/manifest.webmanifest` exists with `start_url: /user`, `display: standalone`, `theme_color: #F7F2EA`.
- Icons: only `/images/Logo.jpg` referenced for both 192×192 and 512×512 (no purpose-tagged maskable icon, no proper PNG sizes).
- **No service worker.** No `next-pwa`, no `serwist`, no `workbox` in `package.json`. No `public/sw.js`.
- No install prompt component. No iOS A2HS instructions. No `.well-known/assetlinks.json`.

---

## 3. The plan

### 3a. Gap analysis — handoff screen vs existing route

| Handoff screen | Existing route | Action |
|---|---|---|
| Splash | — | **new-route** `/splash` (client component; redirects after 2.2 s) |
| Welcome | — | **new-route** `/welcome` (public) |
| Login | `/login` | **port-in-place** (restyle to handoff visual) |
| Sign up (2-step) | `/register` | **port-in-place** (restyle; honeypot already there) |
| Onboarding (4 slides) | — | **new-route** `/onboarding` (gated: shows once on first auth) |
| Loader (post-login / signup) | — | **port-in-place** (integrate into existing loaders; reuse `MindsetLoader`) |
| Forgot Password | `/forgot-password` | **port-in-place** |
| Reset Password | `/reset-password` | **port-in-place** |
| Verify Email | `/verify-email` | **port-in-place** |
| Account Locked | — | **new-route** `/(auth)/account-locked` (or query-state on `/login`) |
| Home (Empty / Partial / Engaged) | `/user` | **port-in-place** — wire `getUserEngagementState` → three variants |
| Mood check-in sheet | `MoodCheckIn` component exists | **port-in-place** (already wired to `logMoodCheckIn`) |
| Therapy / Sessions list (3 tabs) | `/user/sessions` | **port-in-place** (restyle to upcoming / find / past tabs) |
| Therapist Detail | `/user/sessions/book` flow | **merge-with-existing** (booking detail step) |
| Therapist Booking | `/user/sessions/book` | **port-in-place** |
| Session Detail (state-aware: Upcoming / Joinable / Awaiting feedback / Completed) | `/user/sessions/[id]` | **port-in-place** — refine existing route; add state-driven CTA + "Awaiting feedback" banner |
| Post-Session wrap-up (mood → optional homework → rebook) | — | **new-route** `/user/sessions/[id]/wrap-up` — **user-initiated only** (no auto-trigger) |
| Practice Hub | `/user/practice` | **port-in-place** |
| Journal list (calendar strip + filters) | `/user/practice/journal` | **port-in-place** |
| Journal New (composer + mood footer) | `/user/practice/journal/new` | **port-in-place** |
| Assignments (pending / completed tabs) | `/user/practice/assignments` | **port-in-place** |
| Assignment Detail (5 type UIs) | `/user/practice/assignments/[id]` | **port-in-place** (one switch on `assignment.type`) |
| Breathing Timer (3-min default) | — | **new-component** + reused inside assignment detail and `/user/practice/breathe` |
| Discover Hub | `/user/discover` | **port-in-place** |
| Workshops list / detail | `/user/discover/workshops`, `[id]` | **port-in-place** |
| Shop list / detail | `/user/shop`, `[id]` | **port-in-place** |
| Cart | `/user/cart` | **port-in-place** |
| Checkout 3-step | `/user/orders/checkout` | **port-in-place** (verify steps match: cart → address+delivery → payment) |
| Orders list / detail | `/user/orders`, `[id]` | **port-in-place** |
| Library list / reader | `/user/library`, `[id]` | **port-in-place** |
| Study Materials | (in `/user/discover` discovery; purchase via existing EBOOK Razorpay flow) | **port-in-place** |
| NGO Visits list / detail / join | `/user/discover/ngo-visits`, `[id]` | **port-in-place** |
| Addresses management | `/user/addresses` (and `/user/profile/addresses`) | **port-in-place** |
| Profile + Settings tree | `/user/profile/*` | **port-in-place** |
| Edit Profile | `/user/profile/personal` | **port-in-place** |
| Settings — Notifications | `/user/profile/notifications` | **port-in-place** |
| Settings — Privacy | — | **new-route** `/user/profile/privacy` (Phase 6, alongside account-delete) |
| Settings — Help | `/user/profile/help` | **port-in-place** |
| Breathe (standalone) | — | **new-route** `/user/practice/breathe` |
| SOS triage (3 states) | — | **new-route** `/user/sos` + persistent button injected into mobile header |
| Notifications screen | `/user/notifications` | **port-in-place** (list view of `Notification` model) |
| Insights (weekly chart) | — | **new-route** `/user/insights` (derive from `MoodCheckIn` + `EngagementEvent` history) |
| Account Delete (4-step DPDP) | — | **new-route** `/user/profile/delete-account` + new server action |

### 3b. Proposed route structure

**Recommendation:** **no `(mobile)` route group is needed.** All dashboard routes already split mobile vs desktop at the layout level via `MobileShell` (`lg:hidden`) and `DesktopShell` (`hidden lg:block`). The mobile port is a styling, content, and component-composition pass — same URLs, same server data — with a few net-new routes that don't have a desktop counterpart (`/splash`, `/welcome`, `/onboarding`, `/user/sos`, `/user/insights`, `/user/practice/breathe`, `/user/sessions/[id]/wrap-up`, `/user/profile/privacy`, `/user/profile/delete-account`, `/(auth)/account-locked`).

For these net-new routes:
- `/splash`, `/welcome`, `/onboarding` live at the **app root** (outside any group) because they should not redirect through the dashboard layout.
- `/user/sos`, `/user/insights`, `/user/practice/breathe`, `/user/sessions/[id]/wrap-up`, `/user/profile/privacy`, `/user/profile/delete-account` live inside `(dashboard)/user/...` and use the existing `MobileShell` (with one variant: `wrap-up` and `breathe` should be **full-screen** — disable the `BottomNav` via a layout segment opt-out or a `hideNav={true}` prop).
- `/(auth)/account-locked` slots into the existing auth group; or it can be a query state on `/login?locked=1` to avoid the extra route. **Recommend the route** for analytics and a stable URL.
- `/api/cron/account-deletion` is an API route, not a UI screen — companion to §3d's deletion lifecycle.

### 3c. Database additions needed

**Per the owner's rule: exactly one schema change approved** (see §0A — adding `AuthEventKind.ACCOUNT_DELETED` to the existing enum). All other handoff features can be implemented with the existing schema. Specifically:

- **BREATHING** assignment completion → `AssignmentResponse.metadata` (JSON) stores `{ durationSeconds: 180 }` and any other timer/cycle data. No column needed.
- **Mood check-in** → `MoodCheckIn` already exists (`mood: int 1-5`, `note`, `checkedInDate`, upsertable per day).
- **Engagement state for Home Empty / Partial / Engaged** → `getUserEngagementState(userId)` already returns the right enum.
- **Notifications screen** → `Notification` model and `NotificationKind` enum cover SESSION_REMINDER / WORKSHOP / WORKSHOP_REGISTRATION_CONFIRMED / ORDER / REVIEW_PROMPT / SYSTEM / ASSIGNMENT_NEW / ASSIGNMENT_COMPLETED. No new kinds required for the mobile design.
- **SOS triage** → no database side; hotline numbers and routing are static config / env values.
- **Insights screen** → derived from `MoodCheckIn` history + `EngagementEvent` log; no new table.
- **Library / Study Materials** → `StudyMaterial` + `StudyMaterialAccess` cover it.
- **NGO Visits** → `NgoVisit`, `NgoJoinRequest`, `WhatsappLink` cover the design.
- **Workshops free + paid** → `Workshop` + `WorkshopRegistration` + `Payment(type=WORKSHOP)` cover both.

**Account deletion** — fully resolved (§3g Resolved Decision 7). Approach: anonymize-in-place + cascade-delete user-private rows + retain `Session` / `Payment` / `Order` / `AuthEvent` / `AssignmentResponse` for clinical / tax / audit retention. The one approved schema change (§0A — `AuthEventKind.ACCOUNT_DELETED`) encodes the two-stage deletion lifecycle (requested → cancelled? → completed) via `AuthEvent` rows without adding any `User` columns.

### 3d. Server action / query additions needed

**New server actions:**

1. **`requestAccountDeletion(reason, freeText)`** — Phase 6 work. **Two-stage with 7-day cooling-off (owner-approved):**
   - **Stage 1 (immediate, on submission):** Set a `deletionRequestedAt` marker on the User row. Since no schema column exists for this, encode it via the approved enum addition: create an `AuthEvent` row with the new `AuthEventKind.ACCOUNT_DELETED` value and a `metadata` JSON payload `{ stage: 'requested', scheduledHardDeleteAt: <ISO8601 day-7> }`. Auth callbacks (login + Google `signIn` + credentials `authorize`) check for the most-recent `ACCOUNT_DELETED` AuthEvent with `stage: 'requested'` and block sign-in. Server-side queries that surface user-private data treat the account as deleted. Send the `AccountDeletionRequested` email (see §0B) with the scheduled hard-delete date and a sign-in-to-cancel link.
   - **Stage 2 (day 7, by cron):** Hard-delete runs. Anonymize `User.name`, `email`, `phone`, `image`, `dateOfBirth`, `address`, `emergencyContact`; null out `password`; cascade-delete `JournalEntry` (including drafts), `MoodCheckIn`, `CartItem`, `Address`, `EngagementEvent`, `Notification`, `EmailVerificationToken`, `PasswordResetToken`. **Retain** `Session` (with redacted `notes`, `userNotes`), `Payment`, `Order`, `OrderItem`, `AuthEvent`, `AssignmentResponse` (clinical/legal retention per RCI + Indian tax law + audit). Write a second `AuthEvent` row with `AuthEventKind.ACCOUNT_DELETED` and `metadata: { stage: 'completed' }`. Send the `AccountDeletionCompleted` email immediately after the transaction commits.
   - Cancellation: if the user signs in during the 7-day window via the email's cancel link, the most-recent `requested` AuthEvent is superseded by a new one with `metadata: { stage: 'cancelled' }`; the auth block lifts. Mechanism documented in Phase 6.
2. **`completeBreathingAssignment(assignmentId, durationSeconds, cyclesCompleted?)`** — Phase 4 work. Thin wrapper over `completeAssignment` that fills `metadata` JSON correctly. *Alternative: don't add this — let the existing `completeAssignment(formData)` accept a metadata field. Decide during Phase 4 implementation.* Per owner Answer 8, the timer is fixed 3 min default with Start/Pause/Stop/Done; user can stop early; actual elapsed seconds are written into `AssignmentResponse.metadata.durationSeconds`. Custom durations live on the standalone Breathe screen, not in assignment completion.
3. **`logSosEvent(action)`** — Phase 6 work. Lightweight `EngagementEvent` row. Optional telemetry; deferrable.

**New queries (likely):**

1. **`getInsightsData(userId, windowDays=30)`** — aggregates `MoodCheckIn` by week, counts `EngagementEvent` by `kind`, and produces the 4-week mood trend + practice tile data the design's Insights screen renders.
2. **`getNotificationFeed(userId, cursor?)`** — paginated feed grouping notifications by day. Today's `getUnreadNotificationCount` is just a count; for a list view we need the items themselves. May already be doable with an inline Prisma query inside the page — no separate file required. Decide during Phase 6 implementation.
3. **`getSessionDetailState(session)`** — pure function (no DB) that derives the four state-aware buckets for Session Detail: `Upcoming` (now < startsAt − 15 min), `Joinable` (startsAt − 15 min ≤ now ≤ startsAt + 60 min), `AwaitingFeedback` (now > startsAt + durationMin, status ≠ COMPLETED, no AssignmentResponse from session window, no post-session mood logged in window), `Completed` (status === COMPLETED OR feedback recorded). Lives in `src/lib/session-state.ts`. Used by the Session Detail page and by the home/notification banner that points users to `/user/sessions/[id]/wrap-up`.
4. **`getDoctorDisplayName(doctor)`** — per owner Answer 1, lives in `src/lib/format-doctor.ts`. Returns `"Dr. {name}"` if `doctor.type === 'PSYCHOLOGIST'`; else returns `doctor.designation` (the existing string field, e.g. "M.A. Counselling Psychology") alongside the name. Used everywhere a therapist name renders.

**Ruthlessness check:** the temptation is to add helpers prematurely. The principle is: **try to use the existing action/query first**, and only carve out a new one when the existing API can't express the new caller's needs. Concretely, `completeAssignment` accepts `formData`; if Phase 4 can pack BREATHING metadata into that without API churn, do that and skip the new wrapper.

**New API route (cron):**

- **`/api/cron/account-deletion`** — Phase 6. Runs nightly (Vercel cron, schedule TBD with owner — likely 03:00 IST off-peak). Scans `AuthEvent` rows where `kind === 'ACCOUNT_DELETED'`, `metadata.stage === 'requested'`, and `createdAt < now - 7 days`, with no superseding `stage: 'cancelled'` event for the same user. For each, runs the Stage-2 anonymize transaction described in action #1, then sends the `AccountDeletionCompleted` email. Idempotent: re-runs on already-deleted users are no-ops.

### 3e. PWA setup plan

**Important:** Final SW package choice deferred to Phase 1 day 1; verify against `node_modules/next/dist/docs/` (per AGENTS.md) and Context7. The proposal below is the **recommended default**.

#### Manifest (replaces today's thin one)

Move to **file-based** `src/app/manifest.ts` (Next-native, type-safe). Contents:

```ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mindset',
    short_name: 'Mindset',
    description: 'Mental health care — accessible, affordable, stigma-free',
    start_url: '/user',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#F7F2EA',
    background_color: '#F7F2EA',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    categories: ['health', 'lifestyle', 'medical'],
  }
}
```

**Icon work required:** generate four PNGs from the cream brand logo (any 192/512 + maskable-padded 192/512). Cannot reuse `/images/Logo.jpg` directly — Play Store requires PNG and maskable variants. **Block on owner asset delivery** OR generate via tool in Phase 1 from the existing logo + safe-area padding.

#### Service worker

**Recommendation: Serwist** (`@serwist/next`). Reasons:
- Successor to `next-pwa`, actively maintained, supports App Router and Next 16-compatible patterns.
- Workbox-based caching strategies out of the box.
- TypeScript-native.

If Serwist proves incompatible with Next 16.2.4, fallback is a **hand-rolled `public/sw.js`** registered in a small client `<ServiceWorkerProvider/>` component (mounted in root layout). The custom path is more work but has zero ecosystem risk.

**Cache strategy (minimum viable for Phase 1):**
- App shell (`/`, `/user`, `/login`, `/welcome`): **NetworkFirst** with `cacheName: app-shell` (1-day max).
- Static assets (`/_next/static/*`, `/fonts/*`, `/icons/*`, `/images/*`): **CacheFirst** with long max-age.
- HTML pages under `/user/*`: **NetworkFirst** with 3-second timeout, fall back to a cached `/offline` page.
- API GETs: **NetworkOnly** (avoid stale auth-scoped data). Mutations and `/api/auth/*`: **NetworkOnly**, no caching.
- A single `/offline.tsx` route renders a cream-themed "You're offline — your last reflections are still saved here" message.

Push notifications (web push + VAPID) are **deferred to Phase 8** (post-TWA) per the user's scope; the Notifications screen reads from the existing `Notification` DB model only (see Open Question 5).

#### Install prompt component

A new client component `<InstallBanner/>` mounted in the root layout for authenticated users:
- Listens for `beforeinstallprompt`, captures the event, hides itself if `display-mode: standalone` is active.
- Cookie-tracked dismissal (`mindset_install_dismissed`, 30-day TTL) so we don't nag.
- iOS-specific: detect iOS Safari + non-standalone → show a small "Tap [share] then **Add to Home Screen**" sheet with the proper icon glyph (iOS does not fire `beforeinstallprompt`).
- Visual placement: under the mobile header, dismissible with an X. Never blocks content.

#### Other PWA wiring

- `<meta name="theme-color" content="#F7F2EA">` in root metadata (already partially set; verify per Next 16 metadata API).
- `apple-touch-icon` link in metadata (180×180 PNG).
- `<meta name="apple-mobile-web-app-capable" content="yes">` and `apple-mobile-web-app-status-bar-style` (light or `default`).
- **No `.well-known/assetlinks.json` yet.** Flagged for Phase 7 (TWA) — it requires the production SHA-256 fingerprint of the Android package.

#### iOS Add-to-Home-Screen modal

A one-time modal shown when an iOS Safari user opens the site authenticated and has not dismissed. Plain HTML/CSS; no service worker dependency. Reuses the install-dismissed cookie.

### 3f. Phased implementation plan

Each phase commits separately. Each phase ends with a screenshot dump at iPhone 14 viewport (390 × 844) under `screenshots/phase-N/<route-name>.png` for every new or restyled route. Each phase pauses for owner smoke test before the next phase begins. Verification is via `npm run dev` (not `next build`) per the user's stored preference.

#### Phase 1 — PWA shell + auth restyle (~5 working days)

- Day 1: Verify Serwist vs Next 16 compatibility (consult `node_modules/next/dist/docs/` + Context7); install or build SW.
- Day 1–2: `src/app/manifest.ts`, icons (PNG generation), root metadata updates, `<InstallBanner/>`, iOS A2HS modal.
- Day 2–3: Token aliases (bare-name CSS vars referencing existing `--color-X`). Done in sub-phase 1.1b via `chore(tokens): add bare-name CSS variable aliases for handoff design parity`. Value sync for `--color-text-muted` (3D3935 → 6B6862) deferred to a standalone `refactor(tokens):` commit at the start of sub-phase 1.4. `--color-text-faint` value retained as an accessibility exception (see Resolved Decision 14).
- Day 3: `/splash`, `/welcome` (public routes; the existing marketing `/` stays untouched).
- Day 4: Restyle `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`; add `/(auth)/account-locked`.
- Day 4–5: `/onboarding` (4 slides, gated by `mindset_onboarded` cookie); smoke test full auth funnel; screenshots.

> **Diff-first preamble (Phases 2–5).** Every implementation phase below begins with a route-by-route diff pass per §0C: list what's in the existing route that's missing from the design (preserve), what's in the design that's missing from the existing route (add), and what's rendered differently (design wins on visual, existing wins on data shape). Diffs are surfaced to the owner before the route is restyled. Treat this as Day 0 of each phase; budget half a day of phase capacity for it.

#### Phase 2 — Home + reflection wiring (~4 working days, includes Day 0 diffs)

- Day 0 (half-day): Diff pass for `/user` and the `MobileHeader`. Owner reviews.
- Day 1: Verify `getUserEngagementState` returns Empty / Partial / Engaged; create three Home variant components.
- Day 2: Wire mood hero → existing `MoodCheckIn` sheet / `logMoodCheckIn` action; wire next-session card → `getUpcomingSession`; wire reflection-on-last-session → `getReflectionLandingData`. Implement the soft-reframe practice tile per Resolved Decision 4 — never the word "streak"; "X days of practice this month" or "X check-ins this week"; render nothing when zero.
- Day 3: Inject persistent `<SosButton/>` into `mobile-header.tsx` and `header.tsx` (desktop user header) per Resolved Decision 3. Hide on auth, onboarding, splash, the SOS screen itself, checkout, and wrap-up.
- Day 4: Quick tiles (Breathe, Journal, SOS), workshop teaser via `getNextWorkshop`, Awaiting-feedback banner (renders when `getSessionDetailState` returns `AwaitingFeedback` for the user's most recent past session — links to `/user/sessions/[id]/wrap-up`). Screenshots.

#### Phase 3 — Therapy (~5.5 working days, includes Day 0 diffs)

- Day 0 (half-day): Diff pass for `/user/sessions`, `/user/sessions/[id]`, `/user/sessions/book`, therapist directory. Owner reviews.
- Day 1: Sessions index — 3 tabs (Upcoming / Find / Past); use `getUpcomingItems` + a new past-sessions query (or inline Prisma). Use `getDoctorDisplayName()` for therapist labels.
- Day 2: Therapist directory / detail — wire `/api/doctors/lookup` and `/api/doctors/[slug]`; use `getDoctorDisplayName()` for honorific (Resolved Decision 1: "Dr." only for `PSYCHOLOGIST`; else show `designation` string).
- Day 3: Booking flow — already exists at `/user/sessions/book`; restyle.
- Day 4: **Session Detail state-aware refinement** (replaces former SessionLive). `/user/sessions/[id]` reads `getSessionDetailState(session)` and renders:
  - **Upcoming** (now < startsAt − 15 min): countdown, session info, disabled join button, "Add to calendar" if available.
  - **Joinable** (startsAt − 15 min ≤ now ≤ startsAt + 60 min): "Join via Meet" button that opens `Session.meetLink` in a new tab / system intent. Never an iframe — Google blocks Meet embedding.
  - **Awaiting feedback** (now > startsAt + 60 min AND `status !== 'COMPLETED'` AND no AssignmentResponse from session window AND no post-session mood in window): soft banner "How did your session with [therapist] go?" with tap-to-rate CTA → `/user/sessions/[id]/wrap-up`.
  - **Completed** (`status === 'COMPLETED'` OR feedback recorded): chapter view as today; no banner.
  No `startSessionLive` action. No 4-state in-call UI. No iframe. No auto-trigger. Plain state derivation from existing fields.
- Day 4.5: User-initiated wrap-up route `/user/sessions/[id]/wrap-up`. Reached **only** via the Awaiting-feedback banner on Session Detail, OR via the home Awaiting-feedback banner, OR via a `Notification` row (created when `now > startsAt + durationMin` and status ≠ COMPLETED — kind `REVIEW_PROMPT` already exists). Flow:
  - **Step 1 — mood check.** Writes today's `MoodCheckIn` via existing `logMoodCheckIn`. No schema change; the session linkage is implicit by timestamp.
  - **Step 2 — homework prompt (conditional).** Read any pending `Assignment` from that session's doctor, created within ±2 hours of `Session.startsAt` (Resolved Decision 2). If found, surface it; "Got it" / "Add reminder". If none, **skip this step entirely** — go straight to Step 3.
  - **Step 3 — rebook prompt.** Same time next week / in two weeks / I'll book later → routes into existing booking flow.
  - Skipping leaves the banner in place; it re-appears on next app open until the user wraps explicitly or dismisses with "Skip this one."
- Day 5: Session detail timeline view (existing chapter logic, restyled). Screenshots.

#### Phase 4 — Practice (~5 working days, includes Day 0 diffs)

- Day 0 (half-day): Diff pass for `/user/practice`, journal routes, assignments routes. Owner reviews.
- Day 1: Practice hub restyle.
- Day 2: Journal list — calendar strip with mood dots (derived from `getJournalEntries` + `MoodCheckIn`); composer reuses `createJournalEntry`.
- Day 3–4: Assignments — list (Pending / Completed tabs); detail with `switch (assignment.type)` rendering 5 completion UIs:
  - JOURNAL_PROMPT → textarea; on submit, existing `completeAssignment` auto-creates the journal entry.
  - WORKSHEET → render `Assignment.instructions` as **Markdown**; user submits free-text into `AssignmentResponse.responseText` (Resolved Decision 6).
  - READING → mark-as-read CTA + optional reflection textarea.
  - BREATHING → embed `<BreathingTimer/>` (fixed 3-min default, Start/Pause/Stop/Done; user can stop early); on done, pack `{ durationSeconds: <actual elapsed> }` into `metadata` (Resolved Decision 8).
  - CUSTOM → textarea + optional mood.
- Day 5: `<BreathingTimer/>` component, screenshots.

#### Phase 5 — Discover + Commerce (~6 working days, includes Day 0 diffs)

- Day 0 (half-day): Diff pass for discover hub, workshops, shop, cart, checkout, orders, library, study materials, NGO routes, addresses. Owner reviews.
- Day 1: Discover hub.
- Day 2: Workshops list / detail / register (free uses `registerForWorkshop`; paid uses `/api/payments/create-order` with `type: WORKSHOP`).
- Day 3: Shop list / detail (existing routes).
- Day 4: Cart + 3-step checkout (`/user/orders/checkout`). Confirm the existing checkout already splits into cart → address+delivery → payment.
- Day 5: Orders, Library, Study Materials, NGO Visits.
- Day 6: Addresses management; screenshots.

#### Phase 6 — Safety + polish (~5 working days)

- Day 1–2: SOS triage 3 states (Triage → Support | Crisis). Phone numbers wired to iCall, Vandrevala, AASRA via `tel:` and WhatsApp deep links. "Connect now to a Mindset therapist" → routes to a waiting state that booking-redirects to `/user/sessions/book?urgent=1`.
- Day 2: Breathe screen — 3 exercises (Box 4·4·4·4, 4-7-8 Calming, Coherent 5·5), 3 lengths (2 / 5 / 10 min — this is where custom durations live, per Resolved Decision 8), animated circle with proper keyframe timings.
- Day 3: Insights — `MoodCheckIn` 4-week trend + stat tiles + "patterns" narrative card (derived heuristics, not LLM).
- Day 3–4: Notifications screen — paginated list of `Notification` rows; existing `markNotificationRead` + `markAllNotificationsRead` actions.
- Day 4–5: Account deletion 4-step flow (`/user/profile/delete-account`) + the new `requestAccountDeletion` server action with 7-day cooling-off + nightly cron at `/api/cron/account-deletion` + the two new email templates `AccountDeletionRequested` / `AccountDeletionCompleted` + the single approved enum addition `AuthEventKind.ACCOUNT_DELETED` (Resolved Decision 7). DPDP-friendly retention copy on step 1. Cancellation path: user clicks the cancel link in the requested email, signs in normally, sign-in callback detects an active deletion request and presents a "Welcome back — your deletion has been cancelled" confirmation.
  - Privacy settings page (`/user/profile/privacy`) with "Delete my account" row → `/user/profile/delete-account`, "Download my data" row → placeholder for now ("Email hello@mindset.org.in to request"; real export deferred), and condensed in-app retention copy mirroring `/privacy-policy`.
- Screenshots.

#### Phase 7 — TWA wrap (mostly ops; ~3 working days)

- `@bubblewrap/cli` to generate `.aab` from the deployed PWA URL.
- `public/.well-known/assetlinks.json` populated with the production SHA-256 fingerprint from the generated keystore.
- Play Console listing copy, screenshots, content rating, privacy policy URL (uses existing `/privacy-policy`).
- Internal-track submission; iterate on rejections.

**Estimated total Phase 1–6 working days: ~30.5 days (~6 calendar weeks at standard pace, possibly compressible to 4 weeks with two reviewers).** Phase 3 dropped one day (no SessionLive) and gained half a day (Awaiting-feedback banner logic across Home + Session Detail + Notification linkage). Phases 2–5 each include a half-day Day 0 diff pass, already counted. Phase 7 adds another ~3 working days but is mostly ops and may run in parallel with Phase 6 polish.

### 3g. Resolved decisions

All 15 open questions from the original draft have been answered by the owner. No questions remain open. The resolutions below are now binding for Phases 1–7.

1. **`Dr.` honorific.** "Dr." only when `Doctor.type === 'PSYCHOLOGIST'`. For `COUNSELOR`, show `Doctor.designation` (the existing string field). Build helper `getDoctorDisplayName(doctor)` at `src/lib/format-doctor.ts` and use it everywhere a therapist name renders.
2. **Post-session homework.** Doctor pre-creates. The wrap-up screen reads any pending `Assignment` from that session's doctor created within ±2 hours of `Session.startsAt`. If none exist, **skip the homework step entirely** — mood check → straight to rebook. **No user-self-assignment.**
3. **Persistent SOS button.** Mobile + desktop user headers only. Not on doctor/admin headers. Hidden on: auth screens, onboarding, splash, the SOS screen itself, checkout flows, the wrap-up flow.
4. **Streak display.** Soft reframe. Use `getUserStreak` data but render as **"X days of practice this month"** or **"X check-ins this week"**. **Never use the word "streak."** Never show "0 day streak" — if the value is 0, render nothing.
5. **Web push notifications.** Out of scope. Notifications screen is a list view of existing `Notification` rows only. No VAPID, no Push API, no service worker push handlers.
6. **WORKSHEET data model.** `Assignment.instructions` rendered as Markdown; user submits free-text into `AssignmentResponse.responseText`. Structured forms deferred.
7. **Account deletion.** Anonymize-in-place + cascade-delete user-private rows + retain Session/Payment/Order/AuthEvent/AssignmentResponse. Two emails: `AccountDeletionRequested` on submission and `AccountDeletionCompleted` after hard-delete. **7-day cooling-off window**: mark account as deleted immediately (auth blocks login; queries treat as deleted); hard-delete runs on day 7 via nightly cron at `/api/cron/account-deletion`. Single approved schema change: add `AuthEventKind.ACCOUNT_DELETED` to the enum (see §0A). Two new email templates required (see §0B).
8. **BREATHING timer.** Fixed 3-minute default in assignment completion with Start / Pause / Stop / Done; user can stop early; log actual elapsed seconds into `AssignmentResponse.metadata.durationSeconds`. Custom durations (2 / 5 / 10 min) live only on the standalone `/user/practice/breathe` screen. Doctor-set durations deferred.
9. **Onboarding gating.** Cookie `mindset_onboarded=1` (1-year, client-side detectable — `httpOnly: false`) set on tutorial completion. Show tutorial only when: cookie missing **AND** `User.sessionsCompleted === 0` **AND** 0 journal entries **AND** 0 mood check-ins. The activity check handles new devices gracefully.
10. **Splash vs marketing.** Distinct. `/splash` is the PWA launch screen — fast, branded, redirects to `/login` (if not authed) or `/user` (if authed). Public marketing `/` untouched. Detect PWA launch via `display-mode: standalone` media query **or** `?source=pwa` URL param appended to the manifest's `start_url`.
11. **(Resolved by Amendment B.)** No SessionLive component, no 4-state UI, no 3-state collapse. Replaced by Session Detail state-aware logic (Upcoming / Joinable / Awaiting feedback / Completed) plus user-initiated wrap-up. No `startSessionLive` action.
12. **Doctor mobile.** Out of scope. User-facing only. Doctor mobile is a separate future project.
13. **Next 16 specifics.** Follow `AGENTS.md` strictly. Read `node_modules/next/dist/docs/` for any Next.js framework question. Use Context7 MCP where training data may be stale. Copy existing codebase patterns; do not invent new ones.
14. **Token drift.** Honor the design **where it doesn't degrade accessibility**. After the sub-phase 1.1b survey + WCAG analysis in `docs/phase-1/token-drift.md`, the locked positions are:
    - **`--color-text-muted`**: sync repo `#3D3935` → design `#6B6862`. Passes WCAG AA across all ~50 call sites (~5.5:1 on `--bg-app`). Shipped as a standalone `refactor(tokens):` commit at the start of sub-phase 1.4.
    - **`--color-text-faint`**: **explicit exception** — design value `#9A968F` rejected on accessibility grounds (measures 3.05:1 on cream `#F7F2EA`, failing WCAG AA's 4.5:1 floor for normal text; ~30 existing call sites at 11px-12px would all regress). Production value `#6B6862` retained. The muted/faint ladder remains "collapsed" until a dedicated accessibility-tuning pass can rebalance both stops while preserving AA.
    - **`--soft-pink`**: not drifted; production already matches design (Phase 0 audit misread; corrected in §2.3 above).
15. **Email templates.** Only the two new templates noted in §0B (account-deletion requested / completed). Post-session feedback and daily reflection prompt emails deferred. Match existing styling and `FROM_EMAIL` centralization.

### 3h. Packages list

| Package | Why | When |
|---|---|---|
| `@serwist/next` (or `serwist`) | Service worker + Workbox for Next 16. Verify compatibility before installing. | Phase 1 |
| `sharp` (devDependency) | Generate PNG icons (192/512 + maskable variants) from existing logo. May already be transitively installed. | Phase 1 |
| `@bubblewrap/cli` (devDependency) | TWA `.aab` generation for Play Store. | Phase 7 |

**Already installed (no install needed):**
- `playwright` — for screenshot dumps each phase.
- `lucide-react` — icon set already in use; covers the handoff's icon needs without porting `icons.jsx`.
- `react-hook-form` + `zod` — for new auth/account-delete/breathing forms.
- `sonner` — toast layer.

**Not adding:**
- `next-pwa` — superseded by Serwist, unlikely to support Next 16.
- `framer-motion` — `gsap` is already loaded; reuse it for animations (splash, breathing circle, mood face transitions).
- Any state-manager library — server components + existing `CartProvider` pattern suffice.

---

## 4. Stop conditions and handoff

This is Phase 0. The plan has been amended per the owner's three structural amendments (A: diff-first restyle in place; B: no SessionLive, user-initiated wrap-up only; C: Open Question 11 resolved by B) and all 15 questions are answered (see §3g). **No implementation begins until the owner confirms the amended plan and greenlights Phase 1.**

When Phase 1 begins, the first action is:
1. Verify Serwist + Next 16.2.4 compatibility against `node_modules/next/dist/docs/` and Context7.
2. Use the code-review-graph MCP (`semantic_search_nodes`, `query_graph`, `get_impact_radius`) as the primary code-exploration tool, per `Mindset3/CLAUDE.md`.
3. Open a phase-1 branch, restate the day-1 plan there with concrete tasks, and proceed.
