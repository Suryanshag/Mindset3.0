# Phase 4 — Real-device QA checklist

Owner-driven checklist for the Practice cluster: hub, Journal, Assignments,
and the new Breathe page. Five sections (A through E).

## Pre-requisites

Same as Phase 1-3:
- `npm run build && ARCJET_KEY="" npm start` on the laptop
- Phone via USB with USB debugging on; `adb reverse tcp:3000 tcp:3000`
- Chrome / Brave on the phone, open `http://localhost:3000`

Tick PASS / FAIL / DEFERRED per row.

---

## A. Practice hub

| # | Step | Expected | Result |
|---|------|----------|--------|
| A1 | Open /user/practice | "Practice" 32px display header + serif "Your space between sessions." subtitle | |
| A2 | Stat pill | If user has journal entries: "Xd since last entry · X pending assignment(s)" pill in primary-tint. Hides when both null/0. | |
| A3 | Three tiles render | Journal (accent-tint), Assignments (primary-tint with badge bubble if > 0 pending), Mindfulness (bg-cream, "Coming soon", visibly disabled) | |
| A4 | Open /user (home), tap Breathe tile | Lands on /user/practice/breathe (NOT /user/discover or /user/practice). Phase 4 home tile fix verified | |
| A5 | Tap Mindfulness tile | No-op (no navigation, no error). Disabled state | |
| A6 | Tap Journal tile | Lands on /user/practice/journal (Section B) | |
| A7 | Tap Assignments tile | Lands on /user/practice/assignments (Section C) | |
| A8 | Dr Priya Sharma quote card at bottom | Bg-cream card with ms-serif italic quote | |
| A9 | NO Recent entries + Pending preview sections | Intentional. Those lists are desktop-only on this route | |

## B. Journal list + composer

| # | Step | Expected | Result |
|---|------|----------|--------|
| B1 | Open /user/practice/journal | "Journal" 32px + entry count + streak count. Floating 48px primary compose button top-right | |
| B2 | Calendar strip | 7 horizontal day cells; today highlighted in primary bg with on-dark mood dot; other days show entry's mood color | |
| B3 | Today's prompt card | Accent-tint background; "Today's prompt" kicker; prompt copy (real pending JOURNAL_PROMPT assignment or static rotation); "Write 5 minutes →" CTA | |
| B4 | Filter chips | All / Gratitude / Relationships / Health / Work / Sleep horizontal scroll. Tapping a chip highlights it BUT entry list does NOT filter (visual only — flagged in PORT_LOG; JournalEntry has no `tags` column) | |
| B5 | Entry list rows | Mood-avatar on left (face icon in tinted circle), title + date/time row, 2-line body clamp | |
| B6 | Tap a row | Navigates to /user/practice/journal/[id] (existing detail; not redesigned this phase) | |
| B7 | Tap floating compose button | Lands on /user/practice/journal/new mobile composer | |
| B8 | Composer header | 40px close button + centered date/time pill + primary Save button | |
| B9 | Optional prompt card (if pending JOURNAL_PROMPT exists) | Accent-tint card with the prompt copy at top | |
| B10 | Title input (28px display font, optional) + body textarea (serif 17px) | Both render with correct typography | |
| B11 | Sticky bottom toolbar | 5-face mood row + mic icon. Tap a face → tinted active state. Tap again → deselects. Mic tap shows "Voice-to-text is coming soon" non-interruptive note | |
| B12 | Save with empty body | Inline error "Write something before saving." Save button stays available | |
| B13 | Save with body | Returns to journal list, new entry visible at top | |
| B14 | Streak count after first entry today | Increments to 1 (or extends existing streak) | |

## C. Assignments list + detail

To populate test data: as a doctor user, create a few assignments of
different types for your test patient. Or insert via SQL.

| # | Step | Expected | Result |
|---|------|----------|--------|
| C1 | Open /user/practice/assignments | Header back arrow + "Assignments" + "From your therapist" subtitle | |
| C2 | Pill tabs | Pending / Completed with count badges. Local state — back button returns you here on Completed tab if you switched | |
| C3 | Pending list | AssignmentCard per row: type pill (5 colours), title (display font), 1-line body clamp, therapist avatar + name footer, arrow CTA | |
| C4 | Empty Pending | "All caught up. Your therapist will add new exercises here." (ms-serif) | |
| C5 | Tap a pending row | Navigates to /user/practice/assignments/[id] mobile detail | |
| C6 | Detail hero | Type pill + 32px display title + due-date row + serif body | |
| C7 | Type-specific completion zone | JOURNAL_PROMPT → textarea + reminder. WORKSHEET → Trigger + Automatic-thought + 1-5 scale + reflection. READING → soft-blue "Open the reading" card. BREATHING → inline 3-min timer. CUSTOM → textarea + optional mood scale | |
| C8 | Tap "Save & complete" with empty response (JOURNAL_PROMPT / CUSTOM) | Inline error "Write a response before saving." | |
| C9 | Fill response + Save & complete (JOURNAL_PROMPT) | Returns to Completed tab; entry also appears in Journal (existing completeAssignment behavior) | |
| C10 | BREATHING type — start timer → reach 3 min → Save | Submit enabled only after timer hits target. Save persists. | |
| C11 | Tap Skip | Returns to Pending tab; row no longer visible (status = SKIPPED) | |
| C12 | Tap a Completed row | Detail shows "Your response" card in ms-serif italic. No skip/save buttons | |

## D. Breathe page

| # | Step | Expected | Result |
|---|------|----------|--------|
| D1 | Open /user/practice/breathe | Soft-blue background. Header back arrow (rounded, semi-transparent). "Take a breath." kicker + "Pick a rhythm." display title | |
| D2 | Three exercise cards | Box · 4·4·4·4 / 4-7-8 · Calming / Coherent · 5·5. Active card has navy left border + check icon | |
| D3 | Length picker | 2 min / 5 min / 10 min pills. Active = navy bg with on-dark text | |
| D4 | Audio cues toggle | Visual switch (not wired to actual audio engine this phase) | |
| D5 | Tap Begin → During state | Animated breath circle (260px outer expanding/contracting per exercise rhythm); phase cue text below ("Breathe in…" / "Hold." / "Breathe out…"); elapsed/total timer above the circle | |
| D6 | Wait until total elapsed reaches target | Auto-advances to Post state after 600ms | |
| D7 | Tap "End early" mid-exercise | Jumps to Post state immediately | |
| D8 | Post state | "How do you feel now? Notice the shift." Mood pick (1-5, visual feedback only) + optional note textarea | |
| D9 | Tap Done | Returns to /user/practice | |
| D10 | Tap "Save to journal" | Lands on /user/practice/journal/new with the note pre-filled if any was typed | |
| D11 | MobileHeader visible throughout | Critical: the SOS button stays in the top-right during pre / during / post. NOT opted out | |
| D12 | NO database writes | Verify via `SELECT * FROM mood_check_ins WHERE user_id = '<test user>' ORDER BY checked_in_at DESC LIMIT 1` — no new row from the breathe Post state mood pick. Frontend-only as designed | |

## E. Lighthouse on /user/practice (manual)

Once signed in on the phone:

| # | Step | Target |
|---|------|--------|
| E1 | DevTools → Lighthouse → mobile audit on /user/practice | Performance > 70 |
| E2 | Same audit | Accessibility > 95 |
| E3 | Same audit | Best Practices 100 |
| E4 | Same audit on /user/practice/breathe | Same targets |

---

## Reporting

Reply with PASS / FAIL / DEFERRED per row. FAILs need a short note +
screenshot. If A1-A9 + B1-B14 + C1-C12 + D1-D12 all PASS, Phase 4
closes. Section E Lighthouse is a nice-to-have — defer if you don't
want to run DevTools on the phone.
