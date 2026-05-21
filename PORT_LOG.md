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

### 2026-05-20 — INVARIANT — Lift state out of mobile/desktop variants when redirects depend on derived state

When a route renders both a `lg:hidden` mobile variant and a `hidden lg:block` desktop variant and **either variant decides its redirect target from a hook that reads session / engagement / step state**, the inactive variant's `useEffect` will fire on the same state change and race the active variant to `router.push()`. The inactive variant has different local guards (different `isLoading`, different submitted state) and will usually win the race — landing the user on the wrong destination.

**Discovered:** `/register` post-signup landed on `/user` instead of `/verify-email?sent=1`. Both `MobileRegisterForm` and `DesktopRegisterForm` called `useRegisterState()` separately; on submit, the active variant fired `router.push('/verify-email?sent=1')` and the inactive variant's `useEffect` saw `status === 'authenticated'` and fired `router.replace(ROLE_HOME[role])` a tick later. The inactive variant's `isLoading` was `false` (it never submitted), so its guard didn't fire.

**Fix pattern:** lift the shared hook to a single `<RoutePageInner>` wrapper that calls the hook once and passes the result down to both variants as a prop. Each variant becomes a pure renderer of the shared state.

```tsx
function RegisterPageInner() {
  const state = useRegisterState() // ← called once
  return (
    <>
      <div className="lg:hidden"><MobileRegisterForm state={state} /></div>
      <div className="hidden lg:block"><DesktopRegisterForm state={state} /></div>
    </>
  )
}
```

**Apply in Phases 2–5 wherever multi-variant components decide redirect targets from derived state:**
- Phase 2: home engagement state (`/user` deciding which dashboard chunk loads based on `latestEngagementSummary` + `currentStreak`)
- Phase 3: session state (`/user/practice/[id]` deciding between waiting-room / live / ended)
- Phase 4: assignment state (BREATHING redirecting to results after completion)
- Phase 5: checkout step (cart → address → payment, each step redirect-on-success)
- Phase 6: account-delete flow (each step's confirm-and-redirect)

The bug is silent on first render (only one variant is in the DOM via CSS, but **both effects run** because both are mounted in the React tree). It surfaces only at the user's eyes ("why did I land on /user when I just signed up?"). Adding `isLoading` guards to the effect helps but doesn't fix the root cause — the inactive variant's `isLoading` will always be `false` because it never submitted.

### 2026-05-21 — INVARIANT — Kicker color convention (welcoming vs protective)

The small uppercase kicker above the page headline encodes semantic intent through color. Two values, in opposition.

**`--primary`** (teal-green `#2D5A4F`) — **default**. Used for routes about welcoming, building, or progressing the user. Every Phase 1 auth route's mobile kicker uses this:
- /login — "WELCOME BACK"
- /register — "ALMOST THERE" / "GOOD TO MEET YOU"
- /forgot-password — "RESET PASSWORD"
- /reset-password — "ALMOST THERE"
- /verify-email-sent — "CONFIRM YOUR EMAIL"

Apply by default in Phase 2-5 wherever a kicker appears.

**`--accent-deep`** (terracotta `#9A3412`) — **reserved**. Used for routes about pausing, protecting, or asking the user to stop and think before continuing. The warm tone reads "be careful, slow down" rather than "you've messed up". Current and planned uses:
- /account-locked — "ACCOUNT PAUSED"
- Phase 6 /user/sos — SOS triage state kickers
- Phase 6 /user/profile/delete-account — destructive-action confirmation kickers
- Any future "high-stakes" surface where the visual semantic should be "pause"

**Do not** use `--accent-deep` kickers on routine surfaces. The protective tint loses meaning if it appears on regular dashboard cards, modals, or non-destructive interactions. If a Phase 2-5 surface feels like it warrants `--accent-deep`, surface for owner discussion before adopting.

### 2026-05-21 — INVARIANT — Error / warning tint semantic mapping (3 escalation levels)

Three tints, three levels of severity. **Don't collapse them.** Each surface tint encodes a distinct intent and a distinct expected user response.

| Tint | Color | Level | Expected response |
|------|-------|-------|-------------------|
| **Coral / error-coral** | `rgba(249,101,83,0.08)` bg + `#991B1B` text + `--coral` icon | **Field-level error.** Single-field rejection, inline validation, recoverable typo | Fix the one field |
| **`--accent-tint`** | `#FBE9DD` bg + `--accent-deep` text/icon | **Block-level warning.** Whole-card warning or informational state, no immediate action required | Read the message; optional next-step CTA |
| **`--soft-pink`** | `rgba(250,167,157,0.18)` bg + `--accent-deep` text/icon | **Page-level protective state.** Full-screen "we're pausing you for safety" | Wait, reset, or take the protective alternative path |

Current uses:
- Coral: /register validation pills, /reset-password confirm-password mismatch, all /login submit errors
- Accent-tint: /verify-email expired/invalid/used token icons, /reset-password invalid-token state
- Soft-pink: /account-locked card; planned for /user/sos triage state

**Apply consistently in Phases 2-6.** Audit each restyle for tint use:
- Field-level → coral
- Block-level warning inside a working surface → `--accent-tint`
- Page-level protective surface → `--soft-pink`

If a new surface needs a 4th tint, surface for owner discussion before adding — the 3-tier mapping should cover virtually every case.

### 2026-05-21 — DEFERRED — Motion / animation token extraction

Animation timings are currently sprinkled ad-hoc across the 6 auth routes:
- `ms-fade-up .6s both` — primary entrance animation
- `ms-fade-up .6s .1s both` — secondary card entrance
- `ms-fade-up .6s .2s both` — tertiary
- Various `transition-opacity duration-150` for hover/tap

**Don't extract to a tokens module yet.** Phase 2-4 will add new motion patterns:
- Phase 2: mood check-in sheet open/close animations
- Phase 3: slot picker reveal, booking confirmation transitions, doctor-list lazy-load fades
- Phase 4: BREATHING timer pre→during→done state transitions

We don't have enough data points to know canonical values. Premature extraction would lock us into auth-route timing that may not fit kinetic UI in later phases.

**Action:** schedule a dedicated `refactor(motion): extract animation tokens` commit AFTER Phase 2 lands. By then we'll have ≥2 distinct kinetic surfaces (auth + check-in sheet) to draw canonical timings from. Add to the Phase 3 entry checklist as a prerequisite — Phase 3 animations should reference the extracted tokens rather than inline values.

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

---

## Phase 1 — sub-phase 1.4 (DONE)

### 2026-05-20 — DONE — Auth restyle complete, 6/6 routes shipped

Commits in 1.4 (foundation → smoke), oldest first:

1. `390363e` foundation — password policy module + mobile components
2. `a1b3204` /login restyle + screenshot tooling
3. `1e1a004` a11y — 44×44 tap targets + focus-visible rings
4. `d32cdca` PORT_LOG — mobile-form a11y baseline invariant
5. `389b991` /register restyle (two-step mobile)
6. `0b100dc` MobileField auto-enforces 44×44 on interactive trailings
7. `8d9b6f0` PORT_LOG — React-key invariant + iPhone SE minimum
8. `9ce6b26` /forgot-password restyle (3 stages preserved)
9. `d99dedd` /reset-password restyle + auto-signin + policy SSoT
10. `ffaa6cd` password-policy thresholds locked with rationale
11. `002bbe3` /verify-email restyle (?sent=1 + 5 token states + /register redirect flip)
12. `bbb3076` /forgot-password MindsetLoaderOverlay typo fix
13. `d0fce6e` /account-locked + /login lockout redirect (coupled)
14. `04c39e3` end-to-end auth funnel smoke (6/6 PASS)

**14 commits, 4630 insertions / 550 deletions across 26 files** (`git diff --shortstat 390363e^..04c39e3`).

Smoke covers signup → verify → forgot/reset → 5-fail lockout → Google OAuth button → callbackUrl preservation. See `docs/phase-1/auth-funnel-smoke.md`.

### 2026-05-20 — FLAGGED — UX drift across the 6 restyled auth routes

Surfaced during the 1.4 smoke + screenshot review. Not fixed in 1.4; flagging for owner decision on a small polish pass before/after 1.5.

1. **Mobile h1 size — /login is the outlier at 38px.** Every other auth route's primary mobile heading is `fontSize: 32`. /login's `Good to see you again.` is `fontSize: 38` (login/page.tsx:210). Either /login drops to 32 to match the family, or the others get reviewed for too-small. Pick one.

2. **Kicker color — /account-locked uses `--accent-deep`, every other route uses `--primary`.** The choice is *intentional* (warm color reads "paused" not "welcome") but worth owner confirmation. If the owner agrees, document it as the convention for warning/safety surfaces. If not, drop /account-locked to `--primary` and find another way to differentiate.

3. **Error / warning palette — three different mobile surface tints.**
   - Form error pills (register, forgot-password, reset-password): `rgba(249,101,83,0.08)` + `#991B1B` text — coral-on-pale-coral.
   - Token-flow error icons (verify-email, reset-password): `--accent-tint` (#FBE9DD) + `--accent-deep` (#9A3412) — peach-on-deep-orange.
   - Account-locked card: `rgba(250,167,157,0.18)` + `--accent-deep` — soft-pink-on-deep-orange.
   The differentiation reads as "validation error" vs "verification failed" vs "safety pause" semantically, but the three surface tints are close enough that a reader doesn't get a clear signal. Consider collapsing token-flow + account-locked to the same `--accent-tint` (or vice-versa), and keep coral as the form-error-specific tone.

4. **iPhone SE rendering — /login password placeholder truncates.** Captured during /account-locked malformed screenshot pass (`screenshots/phase-1/4-auth/account-locked-malformed-iphone-se.png`). `Enter your passw…` is cut off because the Show button takes ~80px of the field's 320px width. Shorter placeholder ("Password" or "Your password") or moving Show below the field would fix it. Other routes don't have this because they use shorter placeholders or no trailing button.

5. **Sub-card corner radius — two values used.** `rounded-[26px]` on /verify-email-sent + /account-locked sub-cards, `rounded-2xl` and `rounded-xl` elsewhere. Pick one and align.

6. **Animation timing — `.6s` + variable delays (`.1s`, `.2s`).** Consistent in spirit but the actual delay values are sprinkled ad-hoc across files. Worth extracting to a tokens module if we keep them, or dropping the staggered delays if owner finds them gimmicky.

### 2026-05-20 — DEFERRED to 1.5 — Items flagged for Phase 1 wrap-up

- **Production build smoke**: every screenshot above was captured against `npm run dev` with Turbopack. The shipped app uses `npm run build` + `npm start`. Run the same smoke against the production build before declaring Phase 1 closed.
- **Real-device QA**: capture the 6 routes on at least one Android (Chrome) and one iOS (Safari) handheld. iPhone SE Playwright viewport tests the layout floor; real Safari renders the keyboard, scrolls, animations, and font subpixels differently.
- **Lighthouse PWA score ≥ 90**: token-drift doc §3 holds `--color-text-faint` at `#6B6862` for AA contrast; Lighthouse may still flag the lighter text on cream backgrounds. Run an audit.
- **PORT_LOG token-drift §2 sync** (cosmetic): if owner approves the `--color-text-muted` design value (#6B6862), the alias in globals.css §155 follows automatically.
- **Splash 50–100ms blank verification** (deferred from 1.2): verify on production build that the initial blank flash is within budget after PWA install.
- **iOS A2HS variant verification** (deferred from 1.2): Add-to-Home-Screen flow on iOS Safari renders manifest theme/icons differently from Android — explicit pass needed.
- **Onboarding gate end-to-end with real session**: smoke step 2 sets `mindset_onboarded=1` cookie to bypass the `/user` → `/onboarding` redirect. Real first-time users hit the redirect; the gate has not been exercised end-to-end with a fresh authenticated session in 1.4.
- **Cross-tab `mindset:password-reset-complete` signal** (verified at unit level only): exercise two tabs side-by-side to confirm the listener clears stale UI in tab B when tab A completes a reset.
- **Email deliverability**: `[EMAIL] ✓` dev-server logs confirm the Resend `send()` returned ok, but `@mindset-test.local` won't be a delivered inbox. A 1.5 pass should send to a real mailbox and confirm the email looks correct (link works, branding, footer).
