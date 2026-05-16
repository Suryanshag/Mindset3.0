# Known Bugs — promoted from sprint findings

Out-of-scope issues encountered during sprints. Kept here so they don't get lost in sprint-specific docs.

---

## Resolved-by-design

### Google Meet link not auto-generating — **resolved by manual workflow** — 2026-05-16

Originally flagged after case 1 smoke: every booking ended up with
`Session.meetLink = null` because `src/lib/google-calendar.ts`'s service-
account approach can't create Meet conferences (Google anti-abuse policy).

**Resolution**: switched to a manual doctor-paste workflow. Webhook no
longer calls `createMeetLinkForSession` (removed in commit `20c1ab3`).
Doctor receives a notification email with a deep link to
`/doctor/calendar?highlight={sessionId}` and pastes a Meet/Zoom/Whereby
URL. User dashboard shows a clear "therapist will add the link" message
until the link lands.

See `docs/operations.md` § "Session Meet links" for the full runbook.

`src/lib/google-calendar.ts` is intentionally retained for the eventual
switch to OAuth2 or DWD, when booking volume justifies the additional
infra complexity.

---

## Desktop dashboard (Sprint A — coming-up rail) leftovers — 2026-05-14

### Dead code: RailPortal-based rails

Three components portal-inject content into `#desktop-rail-content`:
- `src/components/dashboard/desktop/home-rail.tsx` — rendered via `<RailPortal>` in `src/app/(dashboard)/user/page.tsx` lines 163–165
- `src/components/dashboard/desktop/session-rail.tsx` — rendered via `<RailPortal>` in `src/app/(dashboard)/user/sessions/[id]/page.tsx` lines 270–282
- `src/components/dashboard/desktop/writing-rail.tsx` — rendered via `<RailPortal>` in `src/app/(dashboard)/user/reflection/today/page.tsx` lines 60–66

The portal target `<div id="desktop-rail-content" />` was removed from `desktop-content.tsx` in commit `62d2fcd` when the unified `ComingUpRail` took over. `RailPortal.tsx` itself looks up the target via `document.getElementById('desktop-rail-content')` and short-circuits to `null` when not found, so these consumers silently no-op.

**Impact:** wasted bytes shipped on `/user`, `/user/sessions/[id]`, `/user/reflection/today`. No runtime errors, no broken UX (ComingUpRail covers the slot they used to fill).

**Cleanup (Sprint B candidate):** delete `RailPortal`, `home-rail`, `session-rail`, `writing-rail`, and the import + render sites. The page components still render their main content fine without these.

### Dead code: `hide-rail.tsx`

`HideRail` was a client component that mutated `.desktop-shell`'s classlist to force `with-rail → no-rail`. Used only on `/user/reflection/today` for empty users.

Removed from `/user/reflection/today/page.tsx` in commit `62d2fcd` because the new unified rail logic in `DesktopContent` handles that case correctly (empty user → `upcomingItems.length === 0` → `showRail = false`), and keeping HideRail would create a latent conflict for users with workshop registrations but no sessions (HideRail would hide the rail despite valid items).

**Cleanup (Sprint B candidate):** delete `src/components/dashboard/desktop/hide-rail.tsx`.

### `/api/doctors` route inconsistency

`src/app/api/doctors/route.ts` (the list endpoint, pre-existing):
- Uses raw `NextResponse.json(...)` instead of the `successResponse / errorResponse / serverErrorResponse` helpers from `@/lib/api-response`
- No `publicGetLimiter` rate-limiting wrapper

The new `/api/doctors/lookup` (Task 1, commit `591d737`) follows the project conventions for both. The list endpoint should be brought in line for consistency and basic abuse protection.

**Cleanup:** small refactor — wrap with `publicGetLimiter.protect(req)` + `handleArcjetDenial`, swap to `successResponse(...)` / `errorResponse(...)`.

### VerifyEmailBanner — duplicate instance across viewport toggle

The banner is now rendered in two places:
- `src/app/(dashboard)/user/layout.tsx` inside the `lg:hidden` div (mobile)
- `src/components/dashboard/desktop-content.tsx` via the `showVerifyBanner` prop (desktop)

Each is a separate React component instance with its own `dismissed` state. If a user dismisses on desktop, then resizes to mobile, the mobile banner still shows (its state is independent). Vice versa.

**Impact:** minor — banner has a small dismiss button as a soft no, and the underlying server-side `showVerifyBanner` derivation still returns true until `user.emailVerified` is set. Most users won't toggle viewports mid-session.

**Cleanup:** hoist banner state to a context provider, or store dismissal in localStorage with a short TTL so both instances read the same flag.

### Tiptap editor — duplicate "underline" extension warning

Console warning from the rich-text editor on admin workshop create:

```
[tiptap warn]: Duplicate extension names found: ['underline']. This can lead to issues.
```

Likely caused by `StarterKit` from `@tiptap/starter-kit` v3 including underline by default, AND the project separately importing `@tiptap/extension-underline`. Both register the same extension name.

**Impact:** functional but noisy. May cause subtle behavior issues with underline formatting depending on which extension wins.

**Cleanup:** check `RichTextEditor` (`src/components/ui/rich-text-editor.tsx`), remove the separate `@tiptap/extension-underline` import if StarterKit already covers it, or disable underline in StarterKit config.

### CSP blocking Vercel Live feedback widget + Google reCAPTCHA

Browser console on production:

```
Loading the script 'https://vercel.live/_next-live/feedback/feedback.js' violates
the following Content Security Policy directive:
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com"
```

Same error for `https://www.google.com/recaptcha/api.js`.

The Vercel feedback widget is benign — it's only injected on preview deploys, and blocking it doesn't affect production users. **No action needed unless preview-deploy feedback is wanted.**

The reCAPTCHA block IS a real issue if any form relies on it (auth flows have `react-google-recaptcha-v3` imported). If a server-side action expects a captcha token but the script can't load, the form will fail silently or with a generic error.

**Cleanup:** review the CSP in `next.config.ts` / middleware, add `https://www.google.com` and `https://www.gstatic.com` to `script-src`. Optionally add `https://vercel.live` if preview feedback is desired.

---

## Resolved by removal

### Mindfulness card on /user/practice — removed 2026-05-16

The `/user/practice` hub previously rendered a disabled "Mindfulness — Coming soon" card linked to `#`. The route `/user/practice/mindfulness` 404s and no actual feature exists behind it.

**Resolution:** Mindfulness entry removed from the `sections` array in `src/app/(dashboard)/user/practice/page.tsx`. The 2-card grid (Journal + Assignments) now uses `lg:grid-cols-2` so the remaining cards take more horizontal space.

The route `/user/practice/mindfulness` still 404s but no UI links to it. Revisit when the feature is actually built.
