# Desktop Sprint A — Test Plan

Target: Vercel preview deploy of `main` post-`e6c88fa`.

Six commits in this sprint:
- `591d737` — Task 1: `/api/doctors/lookup` endpoint
- `f1612bf` — Task 2: `getUpcomingItems()` query
- `62d2fcd` — Task 3: `ComingUpRail` + desktop shell wiring
- `f46f6c2` — Task 4: Email-verify banner inside desktop main column
- `e6c88fa` — Task 5: Booking page desktop polish
- (this doc) — Task 6

Annotations:
- `[code-verified]` — assertion is true by virtue of the code, no browser run needed
- `[browser]` — must be confirmed in a real browser session

---

## Cases

### Case 1 — Empty-state user, /user @ ≥1024px
- [ ] Spine + center + rail visible
- [ ] Rail shows "First steps" with 3 cards (Find a therapist / Write first entry / Browse workshops)
- [code-verified] Logic gate: `pathname === '/user' && engagementState === 'empty'` → `showFirstStepsFallback === true`; `items.length === 0 && showFirstSteps === true` → `<FirstStepsRail />` renders.
- `[browser]` Confirm visually.

### Case 2 — Engaged user with ≥1 upcoming item, /user
- [ ] Rail header reads "Coming up"
- [ ] First item visible with correct type chip (Session / Workshop / Circle)
- [ ] Date+time line formatted: "Today, 4:00 PM" / "Tomorrow, 6:30 PM" / "Wed, 14 Nov · 4:00 PM"
- `[browser]` Visual confirmation. If type chip color looks wrong, screenshot the chip — CSS variables drive the tint colors.

### Case 3 — Click rail item card
- [ ] Navigates to the item's detail page
  - Session item → `/user/sessions/[id]`
  - Workshop/Circle item → `/user/discover/workshops/[id]`
- [code-verified] Card has `role="link"`, `onClick={() => router.push(item.href)}`, and keyboard Enter/Space handlers. The Join button click bubbles are excluded via `e.target.closest('a[data-join]')`.

### Case 4 — Join window open (within 15 min of start, meetLink present)
- [ ] Primary "Join" button appears on the card
- [ ] Clicking opens `meetLink` in a new tab (`target="_blank"`)
- [code-verified] `isJoinWindowOpen(startsAt, durationMin)` returns true when `now ≥ start - 15min && now ≤ start + 60min`; only renders the button if `canJoin && item.meetLink`.
- `[browser]` Requires a real session/workshop within the window or a test row inserted.

### Case 5 — Join window NOT open
- [ ] Countdown text shown ("in 2 days" / "in 3 hours" / "in 12 min" / "starting soon"), no Join button
- [code-verified] Mutually exclusive render branch: `canJoin && item.meetLink` → button else `<p>formatCountdown(startsAt)</p>`.

### Case 6 — Rail persists across routes
- [ ] Visit `/user/practice` → rail still shows Coming up with same items
- [code-verified] `DesktopContent` is part of the layout via `DesktopShell`; `upcomingItems` is fetched once per request in `DesktopShell` and passed to `DesktopContent`; the rail isn't bound to any particular route except the explicit force-hide list.
- `[browser]` Confirm visually.

### Case 7 — Journal /new force-hides rail
- [ ] Visit `/user/practice/journal/new` → rail hidden, main widens
- [code-verified] `HIDE_RAIL_ROUTES` set contains `'/user/practice/journal/new'` in `desktop-content.tsx`; `forceHideRail` is `true` for that pathname → `showRail = false` → no `<aside>` rendered → CSS uses `.no-rail` width.

### Case 8 — Journal /[id]/edit force-hides rail
- [ ] Visit `/user/practice/journal/[id]/edit` → rail hidden, regex match works
- [code-verified] `JOURNAL_EDIT_RE = /^\/user\/practice\/journal\/[^/]+\/edit$/` matches `/user/practice/journal/abc123/edit`. Tested in head: `JOURNAL_EDIT_RE.test('/user/practice/journal/abc123/edit') === true`, `JOURNAL_EDIT_RE.test('/user/practice/journal/abc/edit/sub') === false`.

### Case 9 — /user/discover shows rail
- [ ] Rail visible with Coming up items (if any)
- [code-verified] No route-specific suppression on `/user/discover` paths.

### Case 10 — /user/sessions/book shows rail, page loads
- [ ] Rail visible; doctor-list page renders the grid
- `[browser]` Confirm doctors load via `/api/doctors`. If empty, seed one doctor in admin first.

### Case 11 — /user/sessions/book?doctorId=X
- [ ] `/api/doctors/lookup?doctorId=X` returns doctor + slots
- [ ] Doctor card renders with photo, designation, price
- [ ] SlotsCalendar shows available slots (if any in next 14 days)
- `[curl-verifiable]` `curl 'https://<preview-url>/api/doctors/lookup?doctorId=<id>'` should return `{ success: true, data: { id, slug, photo, ..., slots: [...] } }`.
- `[browser]` Verify slot selection + book flow proceeds to Razorpay (Step 5 below).

### Case 12 — Mobile viewport (768px)
- [ ] `MobileShell` active, no desktop rail visible
- [code-verified] Layout splits `lg:hidden` (mobile shell) vs `hidden lg:block` (desktop shell). At 768px, only the mobile shell is in the DOM tree.

### Case 13 — Viewport 1024–1279px
- [ ] `with-rail` mode collapses to `no-rail` per existing CSS (verify via DevTools)
- `[browser]` Requires manual breakpoint check. The current sprint did not change the responsive collapse behavior — preserved from prior CSS.

### Case 14 — Email-unverified user, desktop, banner across routes
- [ ] Banner visible on /user, /user/practice, /user/discover, etc.
- [ ] Banner is sticky-top inside the main column (above the centered content, below where the spine starts)
- [ ] Banner does NOT span over the spine column
- [code-verified] `<VerifyEmailBanner>` is rendered inside `<main>` of `DesktopContent` with `sticky top-0 z-20`. The layout passes `showVerifyBanner = !user.emailVerified` to `DesktopShell` → `DesktopContent`.

### Case 15 — Click "Send link" on verify banner
- [ ] Sending state → "Sending…", then "Link sent — check your inbox"
- [ ] Email arrives in inbox
- `[browser]` Backend `/api/auth/email/send-verification` already existed; banner UI unchanged in this sprint.

### Case 16 — Verify email then return to dashboard
- [ ] After clicking link in email, `user.emailVerified` set, banner gone on next page load
- [code-verified] `showVerifyBanner = !user?.emailVerified` in the layout. When set, the prop chain stops the banner from rendering.

---

## Summary

- 6 commits pushed to `main`: see SHA list at top.
- Code-verified cases: 1 (partial), 3, 4 (partial), 5, 6 (partial), 7, 8, 9, 12, 14 (partial), 16.
- Browser-required cases: 1 (visual), 2, 4 (live data), 5 (live data), 10, 11 (end-to-end), 13 (viewport), 15 (email send).
- Out-of-scope findings logged separately to `docs/known-bugs.md`.

---

## End-to-end booking smoke test (Task 5)

Live-data smoke against the Vercel preview:

1. [ ] `/doctors` (public) → click a doctor card → lands on `/user/sessions/book?doctorId=X`
2. [ ] Doctor details + slots load (validates Task 1's `/api/doctors/lookup`)
3. [ ] Select a slot, click Book → opens Razorpay
4. [ ] Cancel Razorpay → returns to page with cancellation message, slot still selectable
5. [ ] Complete payment (Razorpay test card `4111 1111 1111 1111`) → confirms session
6. [ ] Lands on `/user/sessions` with new session visible
7. [ ] Visit `/user` → new session appears in "Coming up" rail (the upcoming-items query picks it up immediately on next page load)

Failures logged inline (mark ❌ next to step and add a brief note).

---

## Sign-off

**Desktop Dashboard Sprint A production-ready?** _(to fill in after browser run)_
