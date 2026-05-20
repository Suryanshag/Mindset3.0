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

### 2026-05-20 — DEFERRED to 1.5 — iOS A2HS variant explicit verification

Sub-task of the production-build smoke test, called out separately because iOS Safari has the most quirks:

- The iOS share-glyph in the banner must render as the system share icon at the user's device DPR — verify on a real device, not a screenshot.
- The "Add to Home Screen" copy must match what iOS itself labels the action (currently "Add to Home Screen" — iOS has been stable on this string across iOS 16/17/18; verify in 1.5).
- The dismissal cookie persists across both regular Safari tabs AND home-screen launches (PWA standalone mode shares cookies with Safari per-origin on iOS).

If iOS labeling changes in a future iOS version, the banner copy in `install-banner.tsx` will need a small update — flag for ops monitoring.

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
