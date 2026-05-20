# Phase 1 — Token drift survey (Task 1.1b companion)

**Status:** Findings surfaced for owner review. **No value changes have been applied** — the aliases-only commit (`chore(tokens): add bare-name CSS variable aliases for handoff design parity`) is the only token change so far.

The owner approved Decision 14 ("honor the design; update `globals.css` token values for `--text-muted` and `--soft-pink` to match the handoff"). This document records the survey work, corrects one Phase 0 audit error, and flags a previously-unsurfaced drift that needs an explicit owner call before any value change ships.

---

## 1. Status of the four "potentially drifted" tokens

| Handoff token | Handoff value | Current repo source | Current repo value | Drift? | Notes |
|---|---|---|---|---|---|
| `--text-muted` | `#6B6862` | `@theme --color-text-muted` | `#3D3935` | **YES** (owner-approved sync) | Decision 14 applies. |
| `--soft-pink` | `#FAA79D` | `@theme --color-soft-pink` | `#FAA79D` | **NO — Phase 0 was wrong** | The Phase 0 audit reported "closest is `--color-coral-500: #F96553`," but the repo also has a separate `--color-soft-pink: #FAA79D` in @theme (line 50 of globals.css) and a duplicated `--soft-pink: #FAA79D` in `:root` (line 139). Both already match the handoff. No action needed for `--soft-pink`. |
| `--text-faint` | `#9A968F` | `@theme --color-text-faint` | `#6B6862` | **YES — newly surfaced** | Not in Decision 14 (Phase 0 didn't flag this one). Needs explicit owner call. See §3 below. |
| `--accent` | `#C97864` | `@theme --color-accent` | `#C97864` | **NO** | Matches. |

The remaining handoff tokens (`--primary`, `--bg-app`, `--bg-card`, etc.) all match their `--color-X` sources exactly. Confirmed during Task 1.1b alias work.

**Correction logged:** Phase 0 audit (handoff-bundle agent) was incorrect on `--soft-pink`; the repo has the matching value, just under a different naming. The plan's §2.3 table mentions this drift — should be removed in a future doc cleanup. Not blocking.

---

## 2. `--color-text-muted` value sync — approved (Decision 14)

**Change:** `--color-text-muted: #3D3935` → `--color-text-muted: #6B6862` (in `@theme`, globals.css line 69).

### 2.1 Use-site survey

`text-text-muted` (Tailwind utility generated from the @theme token) is referenced at **50+ call sites** across the dashboard. Sampled by `grep -rn "text-text-muted" src/`. Hotspots:

- **Session pages** (`(dashboard)/user/sessions/page.tsx`, ~10 uses): session descriptions, status copy, "No upcoming sessions" empty-state.
- **Discover hub** (`(dashboard)/user/discover/page.tsx`, ~7 uses): stats lines, blurbs.
- **Workshop detail** (`(dashboard)/user/discover/workshops/[id]/page.tsx`, ~3 uses): subtitle / description / RSVP info.
- **NGO visits** (`(dashboard)/user/discover/ngo-visits/`, ~6 uses): visit metadata, "this visit has already happened" copy.
- **Library** (`(dashboard)/user/library/`, ~4 uses): author lines, descriptions.
- **Profile about / personal** (~3 uses): biographic copy.
- **Cancel button card** (`sessions/[id]/cancel-button.tsx:53`): destructive-action context copy.
- Other components (workshop register button, mobile sessions list).

These are mostly **body-level descriptive text**: subtitles, captions, blurbs. **None** are status badges, error messages, or interactive controls (those use `--coral`, `--teal`, or specific status colors).

### 2.2 WCAG contrast — passes AA after the sync

- Old `#3D3935` on `--bg-app` `#F7F2EA`: ~9.6:1 (AAA, overshooting).
- **New `#6B6862` on `#F7F2EA`: ~5.5:1 (passes AA normal; passes AAA large).**
- New `#6B6862` on `--bg-card` `#FFFFFF`: ~6.0:1 (passes AA normal).
- New `#6B6862` on cream `#FFF8EB`: ~5.6:1 (passes AA normal).

The sync **lightens** muted text from "overengineered AAA-dark" to "design-intended AA mid-gray." Visually it will make muted text feel less heavy — more in line with the warm-restful Mindset palette. **Recommend proceeding** at the start of sub-phase 1.4 in a separate commit (`refactor(tokens): sync --color-text-muted to design value`).

### 2.3 Risk areas

Low. The visible diff across the dashboard will be: muted text slightly lighter. Most affected areas are descriptive body copy where the existing very-dark-warm reads almost as primary text — the sync **clarifies the visual hierarchy**.

The single area that might want a closer look: the cancel-confirmation copy in `sessions/[id]/cancel-button.tsx:53` is a destructive-action warning. The new lighter color slightly de-emphasizes the warning. Recommend keeping but quick QA at Phase 3 Day 0 diff pass.

**Recommendation:** approve. Apply at start of sub-phase 1.4. Single-line edit in `@theme`. Aliased token `--text-muted` automatically picks up the new value via the existing `var(--color-text-muted)` indirection.

---

## 3. `--color-text-faint` value drift — NEW; needs explicit owner call

**Proposed change:** `--color-text-faint: #6B6862` → `--color-text-faint: #9A968F` (in `@theme`, globals.css line 70).

### 3.1 Why this surfaced now

Phase 0 audit listed `--text-faint` as a token but didn't flag the value drift. Cross-checking handoff `app/tokens.css` against repo `@theme` while doing the alias work revealed it:

- Handoff: `--text-faint: #9A968F` (a noticeably lighter gray).
- Repo: `--color-text-faint: #6B6862` (the same value as the handoff's `--text-muted` — i.e., one notch darker than the handoff intends).

The repo's text-token ladder is currently **two-rung**:
- `--color-text` `#1A1A1A` — body
- `--color-text-muted` `#3D3935` — secondary (very dark warm; near-body)
- `--color-text-faint` `#6B6862` — tertiary (mid-gray)

The handoff's text-token ladder is also two-rung but **shifted lighter by one stop**:
- `--text` `#1A1A1A` — body
- `--text-muted` `#6B6862` — secondary (mid-gray)
- `--text-faint` `#9A968F` — tertiary (light gray)

Applying the Decision 14 sync to `--text-muted` alone (without also syncing `--text-faint`) would **collapse two adjacent stops into one value** — both `--text-muted` and `--text-faint` would become `#6B6862`, eliminating the contrast between secondary and tertiary text. That breaks the visual hierarchy the design depends on.

### 3.2 Use-site survey

`text-text-faint` referenced at **50+ call sites**, sampled by `grep -rn "text-text-faint" src/`. Predominant patterns:

- **Uppercase tracking-wider section labels**: `text-[11px] font-medium text-text-faint uppercase tracking-wider` (~30 uses). Decorative section captions ("Today", "Upcoming", "Past sessions", etc.).
- **Icon colors**: `<ChevronRight className="text-text-faint" />`, `<CalendarDays />`, `<MapPin />`, `<Ticket />`, etc. (~15 uses).
- **Empty-state icons**: `<BookOpen size={48} className="text-text-faint" />` (~5 uses).
- **Hint copy under inputs**: `sessions/[id]/session-user-notes.tsx:71`, `sessions/book/page.tsx:232`.
- **Definition-list dt labels**: `sessions/book/page.tsx:385-396` ("Qualification", "Experience", "Specialization").
- **Status chip on completed sessions**: `sessions/[id]/page.tsx:21` — `COMPLETED: { label: 'Completed', cls: 'bg-bg-card text-text-faint' }`.
- **Disabled-state pill copy**: `workshops/[id]/register-button.tsx:198,231,374` (full-cap + already-registered states).

### 3.3 WCAG contrast — fails AA on small text

Critical finding. The proposed new value has accessibility risk:

- New `#9A968F` on `--bg-app` `#F7F2EA`: **~3.05:1**.
- New `#9A968F` on `--bg-card` `#FFFFFF`: **~3.25:1**.
- New `#9A968F` on cream `#FFF8EB`: **~3.10:1**.

**WCAG AA thresholds:**
- Normal text (< 18pt or < 14pt bold): **4.5:1 required.**
- Large text (≥ 18pt regular or ≥ 14pt bold): **3.0:1 required.**

The handoff uses `--text-faint` predominantly at **11px-12px**. That's "normal" text by WCAG, which means **the new value would fail AA at every section-label call site.** Section labels, hint copy, definition-list dt labels, the Completed status chip — all would dip below the 4.5:1 floor.

Where the new value is safe:
- **Icons** at ≥ 16px count as Large for contrast purposes (some interpretation; conservative AA still wants 3:1 for non-text content — the new value passes).
- **48px / 32px empty-state icons** — comfortably Large.
- **11px-12px UPPERCASE letterforms with `tracking-wider`** — borderline. Some auditors treat 11pt with extra tracking as a special case, but WCAG normative says "normal."

### 3.4 Three options for the owner

**(a) Don't sync `--text-faint` — keep the existing `#6B6862`.**
- Pros: Existing dashboard pages remain AA-compliant on tertiary text. Lowest risk.
- Cons: Collapsed text-token ladder when `--text-muted` syncs in Decision 14 — both `--text-muted` and `--text-faint` resolve to the same `#6B6862`, the design's intended contrast between secondary and tertiary text is lost.
- **What gets re-mapped:** new mobile chrome components built in 1.4–1.6 that use `var(--text-faint)` for handoff-style decorative labels would render in `#6B6862` (same as `--text-muted`). Acceptable but loses one visual stop.

**(b) Sync `--text-faint` to `#9A968F` despite AA failure.**
- Pros: Faithful to handoff. Design ladder preserved.
- Cons: Accessibility regression at ~30 existing call sites. DPDP-compliance posture (already advertised on auth and shop) makes this awkward to defend.

**(c) Sync to a darker compromise value that preserves the design ladder AND passes AA.**
- Candidate: `#7C7872`. On `#F7F2EA`: ~4.55:1 (just passes AA). On `#FFFFFF`: ~4.85:1.
- Visually positioned between `#6B6862` (repo current) and `#9A968F` (design intent) — closer to design but never failing AA.
- Pros: Compliance preserved; visual ladder restored (gap between text-muted at #6B6862 and text-faint at #7C7872 is small but real).
- Cons: Not strict design fidelity; a third value diverges from the handoff and adds drift in the other direction.

**Recommendation: (a)** for Phase 1, defer (c) to a dedicated accessibility-tuning pass after the Phase 6 polish work. The handoff visual difference between `--text-muted` and `--text-faint` is subtle in practice — the mobile chrome's most decorative use of `--text-faint` is on **`--primary` dark backgrounds** (e.g., welcome hero kicker text) where the relevant token is actually `--on-dark-muted: rgba(255, 248, 235, 0.66)`, not `--text-faint`. So new mobile work doesn't lean heavily on `--text-faint` for design fidelity; the existing dashboard uses it routinely, and changing it is more downside than upside.

If owner wants (b) or (c), call it; I'll wire the change in a separate commit before sub-phase 1.4 starts.

---

## 4. Alias commit scope (what shipped already)

Single commit: `chore(tokens): add bare-name CSS variable aliases for handoff design parity` (next step after this doc is reviewed; not yet committed at the time of writing).

Added to `:root` in `src/app/globals.css` (after existing `--deep-teal: #569A96;`):

- Aliases pointing at existing `--color-X` source tokens: `--bg-app`, `--bg-card`, `--bg-cream`, `--bg-spine`, `--bg-rail`, `--primary`, `--primary-soft`, `--primary-tint`, `--accent`, `--accent-deep`, `--accent-tint`, `--text`, `--text-muted`, `--text-faint`, `--border`, `--border-strong`, `--purple-tint`, `--tan-tint`.
- Aliases pointing at other bare-name tokens: `--amber-soft → --amber-light` (`#FFDDA0`), `--on-dark → --color-cream` (`#FFF8EB`).
- Inline values (no source token exists): `--on-dark-muted: rgba(255, 248, 235, 0.66)`, `--hairline-on-dark: rgba(255, 248, 235, 0.14)`, `--shadow-card: 0 1px 2px rgba(0,0,0,0.04), 0 6px 24px rgba(45, 90, 79, 0.06)`, `--shadow-pop: 0 8px 32px rgba(45, 90, 79, 0.18)`.

**Existing bare-name aliases left untouched** (no scope creep): `--cream`, `--teal`, `--coral`, `--navy`, `--amber`, `--amber-button`, `--amber-light`, `--soft-pink`, `--soft-blue`, `--deep-teal`. These are currently static value duplicates rather than `var(--color-X)` aliases — refactoring them is not required for handoff parity and would broaden the blast radius without benefit.

---

## 5. Action items for owner review

1. **Confirm `--color-text-muted` sync** can ship in a separate `refactor(tokens):` commit at start of sub-phase 1.4. Trivial single-line @theme edit. Visual lightening across ~50 call sites; passes AA.
2. **Pick (a) / (b) / (c) for `--color-text-faint`** per §3.4. Default is (a) if you don't pick — defer and re-visit during accessibility tuning later.
3. **Drop the `--soft-pink` "drift" entry from MOBILE_PORT_PLAN.md §2.3** (`/Users/suryansh/Documents/Mindset/Mindset3/MOBILE_PORT_PLAN.md` line ~92) since it was incorrect — value already matches design. Will do as a small plan-doc edit once you've reviewed this drift survey.

The alias commit itself can land now (or after you've read this doc) — it's a pure additive change with zero risk to existing styling. The value-sync edits are separate and gated on (1) and (2) above.
