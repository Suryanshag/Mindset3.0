# Mobile Port Log

Cross-phase log of work done, things flagged for later phases, and items deferred from the strict scope of one phase to another. Lives across all phases. Updated as work progresses; not deleted between phases.

Format: each entry has a date, a phase scope, a category (DONE / FLAGGED / DEFERRED / HANDOFF-DRIFT), and a one-paragraph body.

---

## Phase 1 — sub-phase 1.1

### 2026-05-20 — DONE — Diff sign-off, token aliases, helplines foundation, SW decision

Sub-phase 1.1 closed: diff-auth.md authored and signed off by owner with all 7 questions resolved; `src/lib/safety/helplines.ts` built and HelplineModal refactored to consume it; `globals.css` extended with 24 bare-name handoff aliases (`--bg-app`, `--primary`, `--accent`, `--text`, shadows, etc.) pointing at existing `--color-X` source tokens where possible; service-worker decision document recommends hand-rolled `public/sw.js` over Serwist (approved by owner; no new packages). Commits: `2a1d515` (helplines), `117d6d5` (token aliases), `882a420` (docs), `81b28a8` (Vandrevala correction).

### 2026-05-20 — FLAGGED — HANDOFF-DRIFT: iCall hours in `app/sos.jsx`

The Claude-Design handoff at `Mindset Android app/Mindset (2)/app/sos.jsx` lists iCall hours as "Mon–Sat, 8 PM – 10 PM" (or similar inverted form). The verified TISS source publishes **Mon–Sat, 10 AM – 8 PM**. The new `src/lib/safety/helplines.ts` constant uses the verified TISS hours. **When sub-phase 6 Day 1-2 ports the `/user/sos` screen, copy hours from `helplines.ts` and ignore whatever hour-string is in the handoff JSX.** Same caveat applies to any other place in the handoff that hardcodes helpline metadata.

### 2026-05-20 — FLAGGED — HANDOFF-DRIFT: Vandrevala number in handoff JSX and original brief

Both the original owner brief (`+911860266234`, `1860-2662-345`) and the Claude-Design handoff bundle reference Vandrevala's older toll-free number. Vandrevala's official contact page now publishes **`+91 9999 666 555`** as the single canonical number for both voice and WhatsApp. The constant in `src/lib/safety/helplines.ts` was updated 2026-05-20 (commit `81b28a8`). Any further references to Vandrevala in handoff JSX or future copy should be sourced from `HELPLINES`, not from the handoff or older brief notes.

### 2026-05-20 — DEFERRED — Verification gate scope conversation

`docs/phase-1/diff-auth.md` §F.4 surfaced that the existing app **does not gate `/user` access on `emailVerified`** — unverified users browse with only a banner. Confirmed via `src/app/(dashboard)/layout.tsx:9-13`, `src/app/(dashboard)/user/layout.tsx:30-37`, and absence of middleware. Per owner direction 2026-05-20, **this is not a Phase 1 item** — `/verify-email?sent=1` correctly offers a "Skip for now" link to `/user` per Resolved Decision 3 case (a), because that matches today's behavior.

Worth a dedicated conversation after Phase 1 wraps. **Unverified users currently have full `/user` access with only a banner warning.** Worth deciding what unverified users *should* be allowed to do — journaling, mood check-ins, and breathing are likely fine (low-risk, user-private); booking a therapy session (clinical, payment, doctor-impacting) probably isn't. Defer to a separate auth-hardening sprint that can think through the model holistically.

### 2026-05-20 — DEFERRED — Token: `--color-text-faint` AA exception

`docs/phase-1/token-drift.md` resolved option (a): design value `#9A968F` rejected on WCAG AA grounds (3.05:1 on cream fails 4.5:1 floor for normal text). Production `#6B6862` retained. The muted/faint ladder will visually "collapse" once the `--color-text-muted` sync lands at the start of sub-phase 1.4 (both stops resolve to `#6B6862`). Revisit during a dedicated accessibility-tuning pass that can rebalance both stops while preserving AA — not this port.

### 2026-05-20 — DEFERRED — `terms-of-use` and `not-found.tsx` helpline duplicates

`src/lib/safety/helplines.ts` is the new source of truth for helpline data, but two non-auth consumers still hold local hardcoded copies: `src/app/terms-of-use/page.tsx` (legal-style listing of three helplines) and `src/app/not-found.tsx` (single iCall reference). Documented inside the helplines module. **Any future helpline-number change needs a parallel edit to those two files** until they migrate. Migration is low-priority; could roll into the Phase 6 SOS work or a separate doc-pages cleanup.

---

## Phase 1 — sub-phase 1.2

### 2026-05-20 — DONE — PWA shell

Hand-rolled PWA shell shipped: `src/app/manifest.ts` (file-based), `scripts/generate-pwa-icons.mjs` + five generated icon variants, `public/sw.js` (Next 16 official-guide pattern, 5 cache rules), `src/app/offline/page.tsx`, `src/components/pwa/service-worker-provider.tsx` (production-only registration), `src/components/pwa/install-banner.tsx` (beforeinstallprompt + iOS A2HS variant, cookie-tracked dismissal), `src/app/layout.tsx` updated with `Viewport` export + appleWebApp metadata + new icon paths + provider mounts, `next.config.ts` updated with /sw.js-specific headers. Smoke-tested via `npm run dev` — all endpoints clean, all meta tags present. **No new packages.** Commit: `f49a0b9`.

### 2026-05-20 — DEFERRED to 1.5 — Production-build PWA smoke test

The dev-mode `process.env.NODE_ENV !== 'production'` gate in `service-worker-provider.tsx` correctly skips SW registration in `npm run dev` (so HMR + stale-build issues don't fight the SW). End-to-end PWA verification therefore happens in sub-phase 1.5 against a real production build, not in 1.2.

**1.5 checklist (do not combine with dev-mode testing):**

1. `npm run build && npm start`
2. **Real Android device** test:
   - Install prompt appears (Chrome's `beforeinstallprompt`)
   - "Install" CTA fires the OS prompt
   - App installs to home screen and opens in standalone mode
   - Install banner does NOT reappear once installed (`display-mode: standalone` check)
   - Cookie-tracked dismissal persists for 30 days when user taps X
   - Network kill (airplane mode) → `/offline` renders for un-cached `/user/*` URLs; static assets still load
3. **Real iOS device** test (or Xcode Safari simulator if no device is available — **not** Chrome DevTools mobile emulation, which doesn't render iOS Safari A2HS UX accurately):
   - iOS instructional sheet renders correctly (share-icon glyph recognizable, copy matches iOS labeling)
   - "Add to Home Screen" path works
   - Once added: launching from home-screen icon opens in standalone, banner hides
   - Cookie-tracked dismissal persists across Safari tabs and home-screen launches
4. **Lighthouse PWA audit** on the production URL — target ≥ 90. Address any gaps before declaring 1.5 done.
5. **Owner's personal Android device** also tests independently.

### 2026-05-20 — DEFERRED to 1.5 — Splash 50-100ms blank on browser visit

`src/app/splash/splash-screen.tsx` server-renders a primary-coloured hold div before client JS hydrates and decides whether to animate. PWA cold launches paper over this with the OS splash; **browser visits to `/splash` show a 50-100ms blank primary surface before the immediate `router.replace()`.** Owner-confirmed acceptable in dev; verify perceived smoothness during 1.5 real-device QA. If it's noticeable, the fix is to server-render the static brand background + logo (without animation) so the non-animated path doesn't look empty during hydration.

### 2026-05-20 — DEFERRED to 1.5 — Onboarding gate end-to-end with real session

Sub-phase 1.3 smoke-tested the onboarding gate via curl (`/onboarding` unauthed → 307 to `/login`), but the full path with a real authenticated session was not exercised. **During 1.5 real-device QA, cover the fresh-signup-to-onboarding-to-dashboard loop end-to-end:**

1. Sign up with a brand-new email on a real Android device.
2. Complete the auth flow → confirm redirect to `/onboarding`.
3. Walk through all four slides (Check in / Therapy / Journal / Workshops).
4. Tap "Get started" on slide 4 → confirm `mindset_onboarded=1` cookie is set (1-year, `httpOnly: false`) and landing on `/user`.
5. Close + re-open the app → confirm landing directly on `/user` (gate doesn't re-fire).
6. Sign out and sign back in → confirm still on `/user` (cookie persists).
7. **Edge case:** clear cookies on the test device, then sign in to an account that has activity → confirm `userHasOnboardingActivity` returns true and the gate skips onboarding (returning user on fresh device).

### 2026-05-20 — DEFERRED to 1.5 — iOS A2HS variant explicit verification

Sub-task of the production-build smoke test, called out separately because iOS Safari has the most quirks:

- The iOS share-glyph in the banner must render as the system share icon at the user's device DPR — verify on a real device, not a screenshot.
- The "Add to Home Screen" copy must match what iOS itself labels the action (currently "Add to Home Screen" — iOS has been stable on this string across iOS 16/17/18; verify in 1.5).
- The dismissal cookie persists across both regular Safari tabs AND home-screen launches (PWA standalone mode shares cookies with Safari per-origin on iOS).

If iOS labeling changes in a future iOS version, the banner copy in `install-banner.tsx` will need a small update — flag for ops monitoring.

---

## Cross-phase invariants

### 2026-05-20 — INVARIANT — Mobile form accessibility baseline

Every restyled mobile form in Phases 2–5 inherits the following from sub-phase 1.4. These are not aspirational — they are the floor. **Diff passes must flag any restyle that doesn't meet all three.**

1. **44×44 minimum tap target** (WCAG 2.5.5 — Target Size). Applies to every interactive element: buttons, links, toggles, checkbox/radio chrome, icon buttons. Visible chrome can stay smaller, but the hit zone must reach 44×44 via padding, negative margins, or a hidden `::before` overlay. The new components establish this:
   - `<MobileBackButton>` renders at 44×44 visible.
   - `<MobileField>`'s trailing slot is caller-managed; trailing buttons (e.g., Show / Hide toggles) must explicitly set `minWidth: 44, minHeight: 44`.
   - Text-only links (e.g., "Forgot password?") need `minHeight: 44` + horizontal padding.
2. **Visible focus-visible ring** (WCAG 2.4.7 — Focus Visible). Every interactive element must show a visible focus indicator when reached by keyboard. `<MobileField>` composes a 2px `--primary` ring into its box-shadow on focus; `<MobileBackButton>` uses a `focus-visible:outline` in `--primary`. New components that introduce additional interactive surfaces (e.g., the Phase 6 SOS button, the mood face buttons in the home check-in sheet) must follow the same pattern. Pure `:hover` styling does not satisfy this requirement.
3. **Form fits + scrolls above the soft keyboard** at iPhone SE width (375×667 for the current 3rd-gen SE; Playwright defaults to 1st-gen 320×568 which is a stricter test). When a field is focused on a real device, the focused input must be visible above the keyboard. Mobile browsers handle this automatically when the page is naturally scrollable; restyles that lock the AuthShell or layout to `min-h-screen` + `items-center` can break this by pushing top content off-screen. The current `AuthShell` mobile layout is unchanged and acceptable; future surfaces with form chrome must verify on a real device during 1.5 and subsequent phase QA.

The new mobile auth primitives in `src/components/auth/` (`mobile-field.tsx`, `mobile-back-button.tsx`, `password-strength-bars.tsx`) ship this baseline by construction. Reuse them where possible; copy the pattern (44×44 + focus-visible + scrollable) when introducing new interactive chrome elsewhere. `MobileField`'s trailing slot auto-wraps interactive children (button / role="button" / onClick) in a 44×44 min container, so new callers don't have to remember.

**Minimum verification viewport — iPhone SE 320×568**, not iPhone 14 (390×664). Every restyle screenshot pass captures both. The owner originally referenced 3rd-gen SE (375×667); Playwright's `devices['iPhone SE']` defaults to 1st-gen 320×568, which is a stricter test. If the form survives 320×568, the wider 375×667 is implicit. `scripts/screenshot-mobile.mjs` takes a `DEVICE` env var; `DEVICE='iPhone SE' node scripts/screenshot-mobile.mjs ...` runs the SE pass.

### 2026-05-20 — INVARIANT — React-key on conditional step wrappers

When a route renders different content in different states via conditional `<div>` blocks of the **same type**, React reconciles them as the same DOM position and reuses underlying form input nodes across the transition. The user's typed value from step N then leaks into step N+1's first input even though the React form state (RHF, controlled props) treats them as different fields. Discovered while smoke-testing `/register` step 1 → step 2: an "Aanya" typed into the Name field surfaced as `input[name="email"].value === "Aanya"` after `setStep(1)`.

**Fix pattern:** attach explicit `key="step-N"` props to each conditional wrapper. React then treats them as distinct subtrees and fully unmounts/remounts.

```tsx
{step === 0 ? (
  <div key="step-0">…name field…</div>
) : (
  <div key="step-1">…credentials fields…</div>
)}
```

Applies to every multi-step / multi-state mobile form coming later:
- Phase 3: session booking flow (therapist → slot → payment review)
- Phase 4: BREATHING assignment timer (pre / during / done)
- Phase 5: 3-step checkout (cart → address+delivery → payment)
- Phase 6: account-delete 4-step flow (reason → confirm → password → done)
- Anywhere a route uses local `useState` to swap between visual stages with uncontrolled or RHF-registered inputs underneath.

The bug is silent — no React warning, no console error. It surfaces only at the user's eyes ("why is my name in the email box?"). Diff passes for restyles that introduce multi-step forms should explicitly grep for the `step === N ? … : …` pattern and verify each branch has a `key` prop.

---

## Ops notes (cross-phase)

### 2026-05-20 — OPS — Quarterly helpline number check

Indian mental health helpline numbers change occasionally — Vandrevala's 2026-05-20 switch from `1860-2662-345` to `+91 9999 666 555` is a recent example. **Recurring action item: quarterly, verify each helpline against its official contact page.**

Sources to check:
- **iCall**: <https://icallhelpline.org/> and <https://tiss.ac.in/view/6/projects/icall-telephonic-counselling-service-for-individua/contact-us-6/> (TISS-affiliated)
- **Vandrevala**: <https://www.vandrevalafoundation.com/free-counseling/contact-us>
- **KIRAN**: <https://pib.gov.in> (search "KIRAN Mental Health Helpline") for the current toll-free
- **AASRA**: <https://www.aasra.info/contact.html>

If any value drifts, update `src/lib/safety/helplines.ts` (the single source of truth) and recommit with a `fix(safety):` message naming the source page consulted. Also bump the verification date in the file header comment.

Suggested cadence: 1st of January, April, July, October. Could be a `/schedule` reminder if owner wants the system to nudge.

---

## Phase 1 — sub-phase 1.3 (in progress)

_(Entries to be added as 1.3 work lands.)_
