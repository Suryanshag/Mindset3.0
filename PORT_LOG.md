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

## Phase 1 — sub-phase 1.2 (in progress)

_(Entries to be added as 1.2 work lands.)_
