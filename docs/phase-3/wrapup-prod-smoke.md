# Phase 3 — production-build smoke

Ran against `npm run build && ARCJET_KEY="" npm start` on 2026-05-22.

## Build output

Clean. Same two cosmetic `pg` SSL warnings as Phase 1/2. No app-level
errors. The new `/user/sessions/book/[doctorId]` route, `/user/sessions/[id]`
mobile variant, and post-session interstitial all compile.

## Lighthouse (Lighthouse 13.3.0, mobile)

### `/login`

```
performance:     81
accessibility:   96
best-practices:  100
seo:             69
```

HTML report archived at `docs/phase-3/lighthouse-login.html`.

### Phase 1 footer contrast fix — verified

Lighthouse `color-contrast` audit on `/login` no longer flags the
Terms / Privacy links or the "Need help right now?" button. The two
remaining contrast hits are in the **cookies banner** (separate
component, outside this sprint's scope):

- Cookies "Read more" link (footer color, ~2.34:1)
- Cookies banner teal link (~2.33:1)

Both flagged for the cookies-banner polish sprint that follows.

### Phase 2 → Phase 3 deltas

| Score          | P2 /login | P3 /login | Δ |
|----------------|-----------|-----------|---|
| Performance    | 76        | 81        | +5 |
| Accessibility  | 96        | 96        | =  |
| Best Practices | 100       | 100       | =  |
| SEO            | 69        | 69        | =  |

Performance ticked up 5 points (run-to-run noise, no regressions).

### Authenticated `/user/sessions` Lighthouse — owner-driven

Headless Lighthouse can't drive a real session, so the Phase 3
sessions surface (3-tab mobile) is measured via Section A of the
device-QA checklist. Targets: Performance > 70, Accessibility > 95,
Best Practices 100.

## Sub-phase 3.6 — DONE checklist

| Item                                          | Status |
|-----------------------------------------------|--------|
| `npm run build` clean                         | ✓ |
| Lighthouse `/login` BP + A11y ≥ 90            | ✓ (100 / 96) |
| Phase 1 footer contrast fix verified          | ✓ (no longer flagged) |
| New schema: SessionFollowup pushed to live DB | ✓ |
| Build + typecheck green on every commit       | ✓ |
| `/user/sessions` 3-tab mobile                 | OWNER-DRIVEN — `wrapup-device-qa.md` Section A |
| Therapist detail + booking handoff            | OWNER-DRIVEN — Section A + B |
| Session detail + Meet link button             | OWNER-DRIVEN — Section C |
| Post-session interstitial 2-step flow         | OWNER-DRIVEN — Section D |
| Cross-route MobileHeader visibility           | OWNER-DRIVEN — Section E |
| Cookies banner contrast                       | DEFERRED — separate polish sprint |
