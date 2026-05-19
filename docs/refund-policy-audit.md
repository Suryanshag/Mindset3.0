# Refund Policy Audit — Mindset

**Status:** Draft for ratification by Suryansh + Muskan
**Audited:** 2026-05-19
**Scope:** every code/email/copy reference to "refund", "cancellation", time-windows ("24-hour", "48-hour"), and related operational language.

> **No code or copy was changed in this audit.** Ratify the canonical policy below, then a follow-up sprint standardizes wording and closes the behavioural gap flagged in §Critical issues.

---

## Critical issues found

These need a decision before any rewrite — they are not just wording mismatches, they are policy-vs-behaviour gaps.

### C1 — User-initiated session cancellation does NOT trigger any refund

The Terms of Use, §8, promise *"Full refund if cancelled at least 24 hours in advance"* for sessions.
The actual code path:

- `src/lib/actions/sessions.ts:7-46` — `cancelSession()` blocks cancellation within 24h and otherwise sets `Session.status = 'CANCELLED'`. It does **not**:
  - call Razorpay refund API
  - update `Payment.status` to `REFUNDED`
  - send a cancellation email to the user
  - include any `refundNote`

The doctor- and admin-initiated paths (`src/app/api/doctor/sessions/[id]/route.ts:141-159`, `src/app/api/admin/sessions/[id]/route.ts:54-77`) send a cancellation email with a `refundNote` saying "Your refund will be processed within 5-7 business days." — but again, no actual Razorpay refund call is made anywhere. The note is a promise the system does not keep.

**Implication:** Today, every "refund" is a manual operations action by Suryansh/Muskan via the Razorpay dashboard. There is no automated refund in the codebase. The Terms commit to refunds the system does not execute.

**Options to ratify:**
- **(A)** Build automated Razorpay refund into `cancelSession` + the doctor/admin cancellation paths. Update Terms to match.
- **(B)** Soften Terms to "Refund processed within X business days on request — email mindset.org.connect@gmail.com" and document the manual ops process in `docs/operations.md`.

### C2 — Inconsistent "refund processing window" wording

Three different windows appear across the codebase:

| File | Wording | Window |
|---|---|---|
| `src/app/terms-of-use/page.tsx:86` | "Refunds, where applicable, are processed back to the original payment method within 7–10 working days of approval." | 7–10 working days |
| `src/app/api/doctor/sessions/[id]/route.ts:153-154` | `'Your refund will be processed within 5-7 business days.'` | 5–7 business days |
| `src/app/api/admin/sessions/[id]/route.ts:70-71` | `'Your refund will be processed within 5-7 business days.'` | 5–7 business days |
| Razorpay actual SLA | Normal refunds: 5–7 working days. Instant refunds (extra fee): minutes. | 5–7 |

**Recommendation:** standardize on **"5–7 business days"** everywhere — matches Razorpay's actual SLA and the emails users already receive.

### C3 — No public `/refund-policy` page

The Privacy Policy and Terms link to each other; neither links to a standalone refund page. Indian e-commerce users expect a dedicated refund/return page (also a Razorpay best-practice for dispute defense). The refund text currently lives only inside §6 + §8 of Terms.

**Recommendation:** create `src/app/refund-policy/page.tsx` using the canonical text below, add to sitemap + main marketing footer.

### C4 — Workshop "48 hours" window not enforced in code

Terms §8: *"Workshops: Full refund if requested at least 48 hours before start. After that: non-refundable."*
There is no user-facing workshop cancellation flow at all (no `cancelRegistration` action exists). The only workshop-related cancel logic is `src/app/api/admin/workshops/[id]/route.ts:118` which refuses to *delete* a workshop that has registrations — that's admin schema management, not user refund logic.

**Implication:** the 48-hour window is theoretical. Users have no UI to cancel a registration; ops has no tool either.

**Options:**
- **(A)** Build user-side "Cancel registration" with the 48-hour gate + automated refund.
- **(B)** Add an admin tool: "Refund + cancel registration for user X on workshop Y."
- **(C)** Defer until first user requests a refund post-launch; document the manual ops process meanwhile.

---

## Current state — exhaustive reference list

### Public-facing legal copy

- `src/app/terms-of-use/page.tsx:69` — *"Reschedule or cancel at least 24 hours before the booked slot. Cancellations within 24 hours, or no-shows, may be charged the full session fee."*
- `src/app/terms-of-use/page.tsx:84` — *"If a product arrives damaged or defective, write to us within 7 days with photos and order details, and we'll arrange a replacement or refund."*
- `src/app/terms-of-use/page.tsx:86` — *"Refunds, where applicable, are processed back to the original payment method within 7–10 working days of approval."*
- `src/app/terms-of-use/page.tsx:93` — *"If a payment is made in error, write to us within 48 hours and we'll work to resolve it."*
- `src/app/terms-of-use/page.tsx:96-101` — §8 Refund policy (sessions, workshops, digital, physical) — see §C1, §C2, §C4 above for mismatches with implementation.
- `src/app/terms-of-use/page.tsx:174-181` — lawyer-review callout already names §6 (returns) + §8 (refunds) as needing legal review.

### In-app dashboard copy

- `src/app/(dashboard)/user/sessions/[id]/page.tsx:66-68` — `canCancel = isUpcoming && hoursUntil > 24` — code gate matches Terms §4.
- `src/app/(dashboard)/user/sessions/[id]/page.tsx:178` — *"Can't cancel within 24 hours of start time."* (rendered when user is past the window) — matches Terms.
- `src/app/(dashboard)/user/orders/page.tsx:327-333` — *"Returns and refunds → mailto: mindset.org.connect@gmail.com?subject=Return%20or%20refund%20request"* — sends user to email-based refund flow (no in-app tool).
- `src/app/(dashboard)/user/sessions/book/page.tsx:188` — *"Payment cancelled. Your session slot is still reserved for 10 minutes."* — payment-flow Razorpay modal cancel, unrelated to session cancellation. No change needed.

### Server actions + API routes

- `src/lib/actions/sessions.ts:22-23` — *"Sessions can't be cancelled within 24 hours of the start time"* — matches Terms gate but does not refund (see §C1).
- `src/app/api/doctor/sessions/[id]/route.ts:153-154` — `refundNote: 'Your refund will be processed within 5-7 business days.'` (paid sessions only).
- `src/app/api/admin/sessions/[id]/route.ts:70-71` — same wording.
- `src/app/api/admin/orders/[id]/cancel-shipment/route.ts` — Shiprocket shipment cancel; no refund text. Calls `cancelShipment()`. Does not refund the order's Payment row.

### Email templates

- `src/emails/session-cancelled.tsx:13` — accepts optional `refundNote: string` prop; renders it in a green callout with a "💰" emoji when present (line 50-72). Refund text is whatever the calling route passes — currently always the "5-7 business days" string.
- No `workshop-cancelled` email template exists. No `order-refunded` email template exists.

### Operations doc

- `docs/operations.md:45-49` — *"If a session is < 30 minutes away and still has no link… mark the session `CANCELLED` and trigger a refund — better than a no-show"* — operational guidance assumes a refund happens; in practice this is a manual Razorpay-dashboard action.

### Schema enums (no copy, but worth noting)

- `Payment.status` enum includes `REFUNDED` — appears in `src/app/(dashboard)/admin/payments/page.tsx`, `users/[id]/page.tsx`, `user/payments/page.tsx`, etc. The chip renders correctly; it just isn't ever set automatically.

### False positives (not policy text)

These matched the grep but are unrelated (UI button labels, JS `let cancelled = false` flags, etc.):
- Every dashboard "Cancel" button (modal dismiss / form cancel).
- Every `useEffect` with `let cancelled = false` cleanup pattern.
- Schema enum `'CANCELLED'` literals in session/workshop status types.

---

## Proposed canonical policy

Below is the policy to ratify. After ratification, the follow-up sprint should (a) update `src/app/terms-of-use/page.tsx` §6 + §8 to match, (b) create `src/app/refund-policy/page.tsx` from this text, (c) standardize the "5–7 business days" string across all emails, (d) decide on the behavioural questions in §C1 and §C4.

```markdown
# Mindset — Refund Policy

## Therapy Sessions

- **Free cancellation** up to 24 hours before the session start time. Full refund
  processed within 5–7 business days.
- **Within 24 hours of session**: 50% refund. The other 50% compensates the
  therapist's reserved time.
- **No-show without notice**: No refund.
- **Cancellation by Mindset or the therapist**: 100% refund, regardless of timing.

## Workshops

- **Free cancellation** up to 48 hours before the workshop start time. Full
  refund processed within 5–7 business days.
- **Within 48 hours of workshop**: No refund. Workshops have fixed capacity;
  late cancellations cannot be filled.
- **Cancellation by Mindset**: 100% refund.

## Physical Products (journals, etc.)

- Returnable within 7 days of delivery if unused and in original packaging.
  Refund processed after the return is received and inspected.
- For hygiene reasons, certain wellness products are non-returnable once
  opened. The product page indicates where this applies.

## Digital Products (ebooks, recorded workshops)

- No refunds after purchase. Sample chapters or previews available before
  buying where applicable.

## Refund Method

Refunds are processed back to the original payment method via Razorpay. Allow
5–7 business days for the amount to reflect in your account. For payment
issues, email mindset.org.connect@gmail.com with your order ID.
```

### Open policy questions for Suryansh + Muskan to decide

1. **Sessions within 24h** — keep current "non-refundable" (Terms §8) or change to canonical "50% refund"? The canonical 50% is more user-friendly but creates an operations burden.
2. **Workshops within 48h** — keep canonical "no refund" or relax to 50%?
3. **Refund SLA** — confirm "5–7 business days" matches Razorpay's actual experience for our test transactions.
4. **Automate or stay manual?** — see §C1 above. Soft launch (10–20 users) can absorb manual refunds; at scale this becomes a real ops cost.

---

## Action items after ratification

These are the discrete code/copy changes a follow-up sprint should make once the canonical policy above is approved:

- [ ] **Update `src/app/terms-of-use/page.tsx`** §4 (Booking) and §8 (Refund policy) to match canonical wording.
- [ ] **Create `src/app/refund-policy/page.tsx`** using `LegalLayout`, mirroring the canonical text. Add `/refund-policy` to `src/app/sitemap.ts`.
- [ ] **Add footer link** to the new refund page on the main marketing footer (search for `Privacy Policy` link in marketing nav/footer components).
- [ ] **Standardize the email refund note**:
  - `src/app/api/doctor/sessions/[id]/route.ts:153-154`
  - `src/app/api/admin/sessions/[id]/route.ts:70-71`
  - Use one shared constant from `src/lib/refund-copy.ts` (new file).
- [ ] **Decision from §C1** — either build automated Razorpay refund into `cancelSession` + doctor/admin cancel paths, or soften the Terms language. Update `docs/operations.md` to document whichever path is chosen.
- [ ] **Decision from §C4** — either build a user-side workshop cancellation flow with the 48-hour gate, or add an admin "refund + cancel registration" tool, or document the manual ops path explicitly.
- [ ] **Add `workshop-cancelled.tsx` email template** if §C4 builds a real workshop cancel flow.
- [ ] **Add `order-refunded.tsx` email template** if we want symmetric notifications on physical-product refunds (currently goes through manual email reply only).
