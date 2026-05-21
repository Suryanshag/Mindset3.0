# Phase 5 — production-build smoke

Ran against `npm run build && ARCJET_KEY="" npm start` on 2026-05-22.

## Build output

Clean. Same two cosmetic `pg` SSL warnings as Phase 1-4. No app-level
errors. 8 new mobile components compile, 9 existing pages branched
without regressions.

## Lighthouse audit (Lighthouse 13.3.0, mobile)

### `/login` (baseline)

```
performance:     78
accessibility:   96
best-practices:  100
seo:             69
```

HTML report archived at `docs/phase-5/lighthouse-login.html`.

### Phase 4 → Phase 5 deltas

| Score          | P4 /login | P5 /login | Δ |
|----------------|-----------|-----------|---|
| Performance    | 79        | 78        | −1 |
| Accessibility  | 96        | 96        | =  |
| Best Practices | 100       | 100       | =  |
| SEO            | 69        | 69        | =  |

All scores within run-to-run noise.

### Authenticated routes

Headless Lighthouse can't audit /user/discover, /user/cart, /user/shop
behind auth. Device-QA Section F drives Chrome DevTools on the phone
after manual sign-in.

## Sub-phase 5.8 — DONE checklist

| Item                                          | Status |
|-----------------------------------------------|--------|
| `npm run build` clean                         | ✓ |
| Lighthouse /login BP + A11y ≥ 90              | ✓ (100 / 96) |
| Discover hub mobile                           | OWNER-DRIVEN — Section A |
| Workshops list + detail mobile                | OWNER-DRIVEN — Section B |
| Library mobile                                | OWNER-DRIVEN — Section C |
| NGO visits mobile                             | OWNER-DRIVEN — Section D |
| Shop catalog + detail mobile                  | OWNER-DRIVEN — Section E |
| Cart mobile                                   | OWNER-DRIVEN — Section F |
| Checkout mobile chrome                        | OWNER-DRIVEN — Section G (Razorpay flow untouched) |
| Backend schema changes                        | NONE (Phase 5 explicit non-goal honored) |
| Razorpay /api/payments/* untouched            | ✓ |
| CartProvider behavior unchanged               | ✓ (lazy-fetch + Perf-2 pattern preserved) |
| Footer contrast (Phase 3 fix)                 | ✓ still clean |
| Cookies banner contrast                       | DEFERRED — Phase 6 polish sprint |
