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

---

## Phase 1 — sub-phase 1.5 (DONE) + Phase 1 closure

### 2026-05-21 — DONE — 1.4 cleanup commits

Three small standalone commits shipped before 1.5 to resolve UX drift surfaced during the 1.4 closeout. Conventions documented as cross-phase invariants above (kicker color, error tint mapping, motion deferral).

- `fc4993f` /login h1 32px (was 38px, family is 32px)
- `00a3459` shorten verbose placeholders to fit iPhone SE behind Show toggle
- `339f1a3` standardize utility sub-card radii — `rounded-2xl` default; `rounded-[26px]` reserved for hero cards only

### 2026-05-21 — DONE — Production build PWA smoke

`npm run build` clean. Manifest, service worker, offline page all serve correctly with expected headers + content. Lighthouse 13.3.0 mobile audit on `/welcome` and `/login`: Best Practices 100, Accessibility 96, Performance 72–81, SEO 66–69 (noindex auth routes always score low). See `docs/phase-1/wrapup-prod-smoke.md` for the full breakdown and `docs/phase-1/lighthouse-login.html` for the archived report.

**Note on the "Lighthouse PWA score ≥ 90" target:** Lighthouse 13 removed the dedicated PWA category in v12+. PWA-style checks now live under Best Practices (100) + a separate installability probe (manually verified — manifest valid, SW serves, icons present, scope correct). The Phase 0 plan's threshold should be re-interpreted as "Best Practices + Accessibility ≥ 90 + installability passes." All three clear.

### 2026-05-21 — FLAGGED for polish — Footer link contrast fails AA

Lighthouse audit of `/login` flagged two contrast failures, both in the AuthShell footer (`src/components/auth/auth-shell.tsx:122`):

- Terms / Privacy links use `color: rgba(30,68,92,0.55)` on cream → 2.94:1 (need 4.5:1)
- "Need help right now?" coral button — same surface, same fail

Fix is a surgical alpha bump (0.55 → ~0.72) on the muted links + a darker treatment or filled background on the coral helpline button. Not blocking Phase 1 closure; flagging for an early Phase 2 polish commit since Phase 2 starts with home dashboard chrome that shares the same shell.

### 2026-05-21 — DONE — Real-mailbox email deliverability

Sent the 3-email signup+reset flow to `choudharysuryansh1111+phase1smoke@gmail.com` (Gmail sub-addressed to avoid clashing with the owner's real account already in DB). Runner: `scripts/real-mailbox-smoke.mjs`. Welcome + Verification + Reset all triggered by the Resend `send()` call; DB tokens stored with expected expiries (24h / 15min). Owner verification of inbox-vs-spam and link-works pending — captured in `docs/phase-1/wrapup-device-qa.md` section E.

### 2026-05-21 — OWNER-DRIVEN — Real-device QA (deferred to owner's hardware)

Items the CI runner can't honestly verify, packaged as a checklist for the owner to walk through on their own hardware:

- Android Chrome install + maskable icon + standalone display-mode + offline behavior + auth funnel through the installed PWA (Section A)
- Onboarding gate end-to-end with a brand-new real session (Section B — Phase 1.3 deferral)
- iOS Safari A2HS sheet + post-install standalone (Section C — Phase 1.2 deferral)
- Full auth funnel from inside the installed PWA (Section D)

See `docs/phase-1/wrapup-device-qa.md`. The owner reports back PASS/FAIL per row; FAILs gate Phase 1 closure.

### 2026-05-21 — PHASE 1 — DONE

**Scope:** mobile-responsive shell + PWA installability + handoff-design auth restyle.

**Commits:** 27 in Phase 1 (`882a420^..ec07889`).
**LOC:** 11,040 insertions / 590 deletions across 59 files (`git diff --shortstat 882a420^..ec07889`).

**Routes touched / new:**
- `/welcome`, `/splash`, `/onboarding` — Phase 1.2 mobile shell
- `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` — Phase 1.4 auth restyle (5 routes)
- `/account-locked` — new route (1.4)
- `/offline` — PWA offline shell (1.2)

**New components / modules:**
- `src/components/auth/`: `mobile-field.tsx`, `mobile-back-button.tsx`, `password-strength-bars.tsx`, `mindset-loader.tsx`, `auth-shell.tsx` (mobile-augmented)
- `src/components/pwa/install-banner.tsx`
- `src/lib/validations/password-policy.ts` — single-source-of-truth password policy
- `public/sw.js` — hand-rolled service worker per Next 16 official PWA pattern
- `public/manifest.webmanifest` + maskable + any-purpose icons (192 + 512)
- `scripts/screenshot-*.mjs` — 5 per-route screenshot runners + 1 multi-purpose runner
- `scripts/smoke-auth-funnel.mjs` — 6-step end-to-end funnel smoke
- `scripts/real-mailbox-smoke.mjs` — 3-email deliverability runner

**Cross-phase invariants established (apply to Phases 2-6):**
1. Mobile form a11y baseline — 44×44 tap targets, focus-visible rings, iPhone SE 320×568 minimum viewport
2. React-key on conditional step wrappers — prevents input-state leakage in multi-step forms
3. Lift shared state out of mobile+desktop variants when redirects depend on derived state
4. Kicker color convention — `--primary` default, `--accent-deep` reserved for protective/destructive surfaces
5. Error/warning tint 3-tier semantic mapping — coral (field) / `--accent-tint` (block) / `--soft-pink` (page)

**Deferred to Phase 2 entry checklist:**
- Motion / animation token extraction (after Phase 2 lands its first kinetic surfaces)
- Footer Terms/Privacy + helpline-button contrast fix (`auth-shell.tsx:122`)
- Homepage Performance: 53 — bundle / hero asset optimisation
- Prod-build auth-funnel smoke flakiness on step 4 (form-input visibility race in prod; harden if it persists)
- Token-drift §2 `--color-text-muted` sync to design value (cosmetic, blocked on owner approval)

**Deferred to Phase 6 (delete-account + SOS surfaces):**
- First production uses of `--accent-deep` kicker beyond `/account-locked`
- First production use of `--soft-pink` page-level tint beyond `/account-locked`

**Tooling and ops:**
- Per-route Playwright screenshot scripts honor `DEVICE='iPhone SE'` for the 320×568 SE pass
- End-to-end smoke runs against `ARCJET_KEY=""` to let the live 5-fail lockout exercise complete; in production the per-IP 5/15min limiter remains intact
- Email-sender pool uses `PrismaPg` adapter with a tight `max:2` pool inside scripts (vs. `max:5` in app code) to avoid eating Neon connection budget during smokes

Phase 1 closure is conditional on the device-QA checklist (`wrapup-device-qa.md`) returning all-PASS or only DEFERRED-with-reason. Owner sign-off pending.

---

## Phase 2 — Mobile home + mood check-in sheet + SOS triage (DONE)

### 2026-05-22 — DONE — Phase 2 ports

**Scope:** mobile home dashboard with 3 engagement states, mood check-in bottom sheet, persistent SOS button affordance, /user/sos triage flow. Design source: `/tmp/mindset-design/app/` (zip provided 2026-05-21).

**Commits in Phase 2** (oldest first):
- `42c7a91` mobile/icons library — 37 line icons + IconPhone (new)
- `66a186f` mobile/ui primitives — Card, Pill, Chip, Avatar, SectionHead, ImageSlot, MoodFace, MOOD_INFO, Blob, TypeChip
- `fd1f055` design system CSS — `.ms-display`, `.ms-serif`, `.screen-scroll`, `fadeUp` / `slideIn` keyframes + `prefers-reduced-motion` opt-out. MobileShell `:has([data-mobile-fullbleed])` opt-out
- `121f6d7` mobile/header + sos-button — date + greeting + bell + persistent SOS link
- `f9d36ca` mobile/home — HomeEmpty / HomePartial / HomeEngaged dispatched by `getUserEngagementState`. MoodSheet bottom-sheet with `logMoodCheckIn`. New `getLastWeekMoods` helper.
- `1cfbad1` /user/sos — three-state SosFlow (triage / support / crisis). HELPLINES SSoT consumed (4 helplines, current numbers). Real `tel:` + `https://wa.me` links.

**6 commits, 3,341 insertions / 81 deletions across 13 files** (`git diff --shortstat 42c7a91^..1cfbad1`).

### 2026-05-22 — INVARIANT — Per-page mobile header (not shell-injected)

Phase 2 Task 2.1c specified "Wire mobile header into mobile shell". We deviated: the header is rendered by EACH page, not by `MobileShell`. Rationale:

- Pages need to vary header props (show/hide bell, show/hide SOS, custom name) and Next.js layouts can't receive props from their children.
- The design source itself renders `HomeHeader` inside each screen (home.jsx, journal.jsx, etc.) — the shell pattern would be a structural divergence from the design.
- Per-page injection keeps prop ownership local and avoids context-API plumbing for what's effectively static-per-route configuration.

**Apply in Phases 3–5:** every mobile authenticated page renders its own `<MobileHeader name={…} unreadCount={…} />` at the top. Pages that hide chrome (e.g. /user/sos, future /onboarding, splash) simply don't include the header. This convention covers Phases 3 (Therapy / Practice / Discover), 5 (Cart / Checkout), and 6 (Profile / SOS extensions).

### 2026-05-22 — INVARIANT — Inline styles preserved (no Tailwind conversion)

The Phase 2 ports keep the design's inline `style={{…}}` props verbatim. We do NOT convert to Tailwind utility classes. Reasons:

- CSS variables (`var(--primary)`, `var(--bg-card)`, etc.) drive theming, and inline-style consumption keeps the surface composable for dynamic values (e.g., `MoodHero` switches background per active face).
- Tailwind conversion loses the token-driven theming — `bg-primary` resolves at build time, `style={{ background: 'var(--primary)' }}` resolves at runtime against the live CSS variables.
- Phase 1 auth restyle used the same pattern; Phase 2 follows.

**Apply in Phases 3–6:** all ported design files keep inline styles. Tailwind is fine for utility wrapping (flex / grid / spacing) where no token reference is needed, but anything touching brand colors or font tokens goes inline.

### 2026-05-22 — DEFERRED — Cross-route persistent SOS

The SOS button is currently only on /user (rendered by `MobileHeader` which is only included on the home page). Other authenticated mobile routes (/user/sessions, /user/practice, /user/discover, /user/profile) don't render the header yet and so don't surface the SOS button.

The brief required SOS to be reachable from every authenticated route. Phase 2 only ports /user, so this is partial — Phase 3 (Therapy / Practice / Discover) will add `MobileHeader` to each of those routes, making SOS reachable everywhere by the time Phase 3 ships.

The bottom-nav (`src/components/dashboard/bottom-nav.tsx`) already includes 5 tabs (Home / Sessions / Practice / Discover / Profile); we did not insert SOS there because the brief said "skip if no bottom nav exists or header button is sufficient" — and header injection in upcoming phases will be sufficient.

### 2026-05-22 — DEFERRED — Upcoming-workshops API + "look back" aggregate

The mobile home's `WorkshopTeaser` renders 3 static example cards instead of real upcoming workshops. The existing `getNextWorkshop` only returns one workshop, not the three a teaser carousel needs. Phase 3's Discover / Workshops port will add `getUpcomingWorkshops(n: number)` and the teaser will switch to real data at that time.

The HomeEngaged "A look back" cream card currently uses generic copy. The design implied a synthesised line ("It's been 5 days since your session with Dr Priya. You've written 2 entries and completed 1 exercise since.") that would need a richer post-session aggregate query. Deferred to Phase 3 alongside the post-session-checkin work.

### 2026-05-22 — DEFERRED — Phase 3 entry checklist

Reminders carried forward into Phase 3:
- Apply per-page `<MobileHeader />` to /user/sessions, /user/practice, /user/discover, /user/profile (Therapy / Practice / Discover / Profile ports)
- Add `getUpcomingWorkshops(n)` helper, wire WorkshopTeaser to it
- Build the "A look back" post-session aggregate
- Footer Terms/Privacy contrast fix (Phase 1 deferral still open)
- Marketing homepage `/` Lighthouse Performance 53 (Phase 1 deferral)
- Motion / animation token extraction (deferred at Phase 1 closure; now we have auth + home + SOS motion data points — by Phase 3's first kinetic surface this becomes actionable)

### 2026-05-22 — Phase 2 closure pending owner device QA

Closure is conditional on `docs/phase-2/wrapup-device-qa.md` returning PASS on:
- Section A — empty / partial / engaged states + mood sheet persistence
- Section B — SOS triage three-state flow + real `tel:` / `wa.me` links

A3 (Engaged state with 3+ sessions / 3+ entries / 2+ assignments) is OK to defer if no activity-rich account is handy.

---

## Phase 3 — Sessions + Booking + Session Detail + Post-Session + Header rollout (DONE)

### 2026-05-22 — DONE — Phase 3 ports

**Scope:** /user/sessions 3-tab mobile (Upcoming / Find / Past), therapist detail page, session detail mobile variant, post-session interstitial (NEW backend), MobileHeader rollout to every authenticated route, Phase 1 footer contrast fix.

**Commits in Phase 3** (oldest first):
- `aac046e` schema — SessionFollowup model + saveSessionFollowup action + getPendingPostSession / getRecentSessionFollowups queries
- `e34494a` MobileHeader shell injection (data-no-mobile-header opt-out) + auth-shell footer contrast bump (0.55→0.72; coral→accent-deep on the helpline button)
- `780e1fc` /user/sessions mobile 3-tab surface with featured Upcoming card + therapist filter chips
- `9459e41` /user/sessions/book/[doctorId] therapist detail (no inline slot picker per kickoff)
- `a009094` /user/sessions/[id] mobile variant reusing Phase 1 SessionJoinCta + SessionUserNotes + CancelSessionButton
- `2ba8d6f` post-session interstitial (2-step: mood+note → rebook pick) wired through MobileShell auto-detection + HomeEngaged "Your last N sessions" feed

**6 commits, ~2,593 insertions / 66 deletions across 17 files** (`git diff --shortstat aac046e^..2ba8d6f`).

### 2026-05-22 — INVARIANT REVISION — MobileHeader is shell-injected (not per-page)

Phase 2 declared "Per-page mobile header (not shell-injected)" as a cross-phase invariant. Phase 3 deliberately reverses that:

- The brief required header visibility on 7 authenticated route trees. Per-page injection would have touched 7 page.tsx files, multiplying risk.
- The shell-injected pattern with a `data-no-mobile-header` opt-out (CSS `:has()` against the page subtree) covers every authenticated route by default; pages that need their own header chrome (home with state-specific bell, SOS with back-button chrome) opt out explicitly.

**Net effect:** the Phase 2 invariant is superseded. The current rule:
- Default: MobileShell renders `<MobileHeader />` for every authenticated route.
- Opt out: page wraps its content in `<div data-no-mobile-header>` and provides its own chrome.
- Current opt-outs: `/user` (home renders its own header per engagement state), `/user/sos`, `/user/sessions/book/[doctorId]`, `/user/sessions/[id]` (all four render their own back-arrow + custom chrome).

### 2026-05-22 — INVARIANT — `x-pathname` request header

`src/proxy.ts` now sets `x-pathname` on every request. Server Components can read the current route via `(await headers()).get('x-pathname')`.

**Why:** Next App Router doesn't expose `req.url` to RSCs by default; you have to forward via middleware. The pattern is documented in Next docs; we centralise it once in proxy so any RSC can rely on the header.

**Current consumers:**
- `MobileShell` post-session-interstitial skip-list (`/user/sos`)

**Future consumers in Phases 4–6:** any RSC that needs to vary behavior per-route without prop drilling. Don't reach for `useSearchParams` server-side — read `x-pathname` instead.

### 2026-05-22 — INVARIANT — SessionFollowup is the post-session record

The `SessionFollowup` row is the single source of truth for "has this user completed the post-session interstitial for session X?" The pending-detection query (`getPendingPostSession`) returns the most recent ended session WITHOUT a followup row.

**Apply in Phase 4+:**
- Any new post-session surface (e.g., late-followup nudge, "rate your therapist" prompt) writes to the existing `SessionFollowup` row by upserting on `sessionId`. Don't create new "did the user see X?" tables for the post-session surface family.
- "Ended" is computed as `date + SESSION_DURATION_MIN (60 min) < now`. There is no `Session.endsAt` column; using a constant duration aligns with `src/lib/session-window.ts`.

### 2026-05-22 — DEFERRED — Session detail timeline + pre-session work list

The design's session-detail screen has a rich "after this session" timeline (rendered journals + assignments + workshops attended between this session and the next) and a "before this session" pending-work list. Both need new aggregate queries (journal+assignment+workshop joined on date window keyed by session boundaries). Phase 4 candidate alongside Practice / Journal port.

### 2026-05-22 — DEFERRED — Therapist detail richer stats + fuzzy search

- TherapistDetail currently shows Experience + Session price. Design had Sessions delivered (420+) and Rating (4.9★) which need session-count + review-aggregate queries not present in the schema. Deferred to Phase 4 / 5 alongside review surfaces.
- Find-tab search field is rendered but non-functional — chip filtering is sufficient for the current ~10-therapist catalog. Wire fuzzy search when catalog grows or when search-by-symptom becomes a real path.

### 2026-05-22 — DEFERRED — Cookies banner contrast

Lighthouse `/login` audit now flags only the cookies-banner "Read more" link (~2.34:1) and the inline teal link (~2.33:1) on cream. Phase 1 footer contrast is resolved. Cookies banner is a separate component (`src/components/cookies/*`); fix queued for the next a11y polish sprint.

### 2026-05-22 — Phase 3 closure pending owner device QA

`docs/phase-3/wrapup-device-qa.md` 5 sections (A through E). FAILs gate Phase 3 closure. Section B (Razorpay booking) is the lowest-risk smoke since the payment flow itself wasn't touched — confirm one booking and move on.

### 2026-05-22 — DEFERRED — Phase 4 entry checklist

Reminders carried forward into Phase 4:
- Practice / Journal mobile ports (currently desktop-only on mobile)
- Discover mobile port (workshops, NGO, library, presenters)
- Profile mobile port
- Notifications mobile port
- Session detail "after this session" timeline + "before this session" work list
- Therapist detail aggregate stats (sessions delivered, rating)
- Cookies banner contrast fix
- `getUpcomingWorkshops(n)` helper for HomeEngaged WorkshopTeaser (Phase 2 deferral still open)
- Motion-token extraction (Phase 1 deferral; we now have auth + home + SOS + sessions + post-session motion patterns as data points)
