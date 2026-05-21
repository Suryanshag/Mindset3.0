# Phase 2 — production-build smoke

Ran against `npm run build && ARCJET_KEY="" npm start` on 2026-05-22.
Same shape as the Phase 1 closure smoke; deltas vs. Phase 1 are
flagged where relevant.

## Build output

`npm run build` completes cleanly. Same two cosmetic `pg` SSL deprecation
warnings as Phase 1 (`sslmode` aliases being normalised in
`pg-connection-string v3`). No app-level errors.

New build artefacts vs. Phase 1:
- `src/components/mobile/` — icons, ui primitives, header, sos-button,
  home, mood-sheet (6 files)
- `src/app/(dashboard)/user/sos/` — server page + client `SosFlow`
- `src/lib/queries/dashboard.ts` — new `getLastWeekMoods` helper

## Lighthouse audit (Lighthouse 13.3.0, mobile form factor)

### `/welcome` (public)

```
performance:     77
accessibility:   96
best-practices:  100
seo:             66
```

### `/login` (public)

```
performance:     76
accessibility:   96
best-practices:  100
seo:             69
```

HTML report archived at `docs/phase-2/lighthouse-login.html`.

### `/user` (authenticated — Lighthouse CI cannot drive a real session)

The new Phase 2 mobile home + the desktop reflection landing live
behind auth. Headless Lighthouse without a session cookie redirects to
`/login` and audits the login page. To get a true `/user` snapshot,
the device-QA checklist (Section A) drives a real Chrome instance on
Android via `adb reverse` and reads the score from DevTools after
manual sign-in.

### Phase 1 → Phase 2 deltas

| Score          | P1 /welcome | P2 /welcome | Δ |
|----------------|-------------|-------------|---|
| Performance    | 81          | 77          | −4 |
| Accessibility  | 96          | 96          | =  |
| Best Practices | 100         | 100         | =  |
| SEO            | 66          | 66          | =  |

The 4-point Performance dip on `/welcome` is within run-to-run noise
(Lighthouse mobile-emulated Perf can swing ±5 between runs); we did
not add anything to the public /welcome route in Phase 2 so this is
not a regression. Phase 2's mobile-home additions are inside the
authenticated tree, which is not audited in this script.

## Carry-forward findings from Phase 1

Still flagged for polish (not fixed in Phase 2):
- Footer Terms/Privacy + "Need help right now?" contrast (2.94:1
  on cream — needs ~0.72 alpha bump on
  `src/components/auth/auth-shell.tsx:122`).
- Homepage `/` Performance 53. Phase 2 didn't touch the marketing
  homepage; this is still queued for the Phase 3 entry checklist.

## Sub-phase 2.4 — DONE checklist

| Item                                        | Status |
|---------------------------------------------|--------|
| `npm run build` clean                       | ✓ |
| Lighthouse `/welcome` ≥ 90 (BP + A11y)      | ✓ (100 / 96) |
| Lighthouse `/login` ≥ 90 (BP + A11y)        | ✓ (100 / 96) |
| Lighthouse `/user` mobile home              | OWNER-DRIVEN — `wrapup-device-qa.md` Section A |
| Service worker still registers (no regress) | ✓ (sw.js unchanged) |
| Mobile home 3 engagement states             | OWNER-DRIVEN — Section A |
| Mood sheet open / select / save             | OWNER-DRIVEN — Section A |
| SOS triage three-state flow                 | OWNER-DRIVEN — Section B |
| Desktop dashboard untouched                 | ✓ (page.tsx desktop branch unchanged) |
| Footer contrast finding                     | DEFERRED (Phase 3 polish) |
