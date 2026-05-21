# Phase 4 — production-build smoke

Ran against `npm run build && ARCJET_KEY="" npm start` on 2026-05-22.

## Build output

Clean. Same two cosmetic `pg` SSL warnings as Phase 1-3. No app-level
errors. New /user/practice/breathe route compiles, existing /user/practice,
/user/practice/journal{,/new,/[id]}, /user/practice/assignments{,/[id]}
all compile.

## Lighthouse audit (Lighthouse 13.3.0, mobile)

### `/login` (baseline, unchanged this phase)

```
performance:     79
accessibility:   96
best-practices:  100
seo:             69
```

HTML report archived at `docs/phase-4/lighthouse-login.html`.

### Phase 3 → Phase 4 deltas

| Score          | P3 /login | P4 /login | Δ |
|----------------|-----------|-----------|---|
| Performance    | 81        | 79        | −2 |
| Accessibility  | 96        | 96        | =  |
| Best Practices | 100       | 100       | =  |
| SEO            | 69        | 69        | =  |

Performance dropped 2 points (within run-to-run noise; Lighthouse mobile
emulation typically swings ±5 between runs). Phase 4 added no new
synchronous work to /login.

### Authenticated /user/practice and /user/practice/breathe

Headless Lighthouse can't drive an authenticated session. Practice and
Breathe metrics are captured in device-QA Section E with Chrome
DevTools on the phone after manual sign-in.

## Sub-phase 4.5 — DONE checklist

| Item                                          | Status |
|-----------------------------------------------|--------|
| `npm run build` clean                         | ✓ |
| Lighthouse /login BP + A11y ≥ 90              | ✓ (100 / 96) |
| New routes added                              | /user/practice/breathe |
| Backend schema changes                        | none (Phase 4 explicit non-goal) |
| Build + typecheck green on every commit       | ✓ |
| Practice hub mobile (3 tiles)                 | OWNER-DRIVEN — `wrapup-device-qa.md` Section A |
| Journal list + composer mobile                | OWNER-DRIVEN — Section B |
| Assignments list + detail mobile              | OWNER-DRIVEN — Section C |
| Breathe pre/during/post flow                  | OWNER-DRIVEN — Section D |
| Home Breathe tile fix                         | OWNER-DRIVEN — Section A.4 |
| Footer contrast (Phase 3 resolved)            | ✓ still clean |
| Cookies banner contrast                       | DEFERRED — separate polish sprint (Phase 3 carry-forward) |
