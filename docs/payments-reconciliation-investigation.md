# Payments reconciliation investigation

The Razorpay-vs-DB cross-check found 3 captured payments missing from
our DB. This document explains the code-side why and identifies what
data needs to come from Vercel/Razorpay dashboards (where I can't
reach from this env) to fully close the loop.

## The 3 stuck payments

| Razorpay payment id | When | Amount | Type | DB Payment row? |
|---|---|---|---|---|
| `pay_SqW8ymLh5KbHiE` | 2026-05-17 23:11 IST | ₹500 | WORKSHOP | YES (PENDING, `order_SqW8AlLUQjphQv`) |
| `pay_SqVAWZZOIVSvzj` | 2026-05-17 22:14 IST | ₹500 | WORKSHOP | NONE |
| `pay_Spx7S2IB4VB7PN` | 2026-05-16 12:56 IST | ₹1500 | SESSION | NONE |

## Code-side audit — three failure modes that can produce these states

### Mode A — Webhook arrived, no Payment row, silent 200

`src/app/api/payments/webhook/route.ts:109–112`:

```ts
if (!payment) {
  console.log('[WEBHOOK] ERROR: Payment not found for order:', razorpayOrderId)
  return NextResponse.json({ received: true })   // 200 → Razorpay never retries
}
```

When Razorpay fires `payment.captured` for an order whose Payment row
doesn't exist in our DB, the webhook logs a single error line and
returns **200**. Razorpay sees a successful delivery and stops
retrying. The user paid; we never recorded it.

This explains the two missing-row cases (`pay_SqVAWZZOIVSvzj` and
`pay_Spx7S2IB4VB7PN`) IF the webhook fired for those payments.

### Mode B — `create-order` non-atomic between Razorpay + Prisma

`src/app/api/payments/create-order/route.ts:278–296`:

```ts
const razorpayOrder = await razorpay.orders.create({ ... })   // 1: Razorpay
                                                              //    side commit
const payment = await prisma.payment.create({ ... })           // 2: our DB
                                                              //    commit
```

These are sequential awaits, **not** wrapped in a transaction (and a
transaction wouldn't help across two systems anyway). If step 2 fails
— Neon cold-start timeout, transient connection drop, Prisma client
error — the Razorpay order is already alive and the user can pay
through it from the modal that already opened on the client (the
client got `payData.data.razorpayOrderId` from step 1's response,
which means our route returned BEFORE the failure… wait, that's not
possible either).

Actually re-reading: if step 2 fails, the `try` block at line 43
catches it and returns `serverErrorResponse()` at line 308 — the
client never gets `razorpayOrderId`, so the modal never opens. So
Mode B as described isn't the cause; the order would be a
"phantom" but the user couldn't pay through it.

UNLESS: the client got `razorpayOrderId` from a PRIOR successful
create-order call (e.g. user clicked Pay twice, first one made it
to the modal but they closed it without paying, second click made
a new order — but the first Razorpay order is still alive for ~5
minutes and the user could in theory re-open and pay the first
modal). That's an edge case and unlikely to explain May 16's
session payment.

### Mode C — `/api/payments/verify` is wired for EBOOK + PRODUCT only

Found by grep:

```
src/components/study-materials/ebook-actions.tsx:82
src/components/library/library-detail-actions.tsx:70
```

Those two callers POST to `/api/payments/verify` immediately after
Razorpay's `handler` callback. The verify route at
`src/app/api/payments/verify/route.ts` checks the signature, flips
Payment.status to PAID, and for PRODUCT additionally flips
Order.paymentStatus.

**Session booking flow does not call `/api/payments/verify`.**
`src/app/(dashboard)/user/sessions/book/page.tsx:142`:

```ts
function handlePaymentSuccess() {
  setPaymentData(null)
  toast.success('Payment successful! Your session is confirmed.')
  ...
}
```

It only toasts. The Session.status flip depends entirely on the
webhook arriving. If the webhook misses (Mode A, or transient
Razorpay→Vercel network issue), the user paid, sees "success", but
the Session never transitions to CONFIRMED.

**Workshop register-button does not call `/api/payments/verify`
either.** Sprint Workshops-Paid Hotfix Task 3 added a 30s polling
loop against `/api/payments/[paymentId]/status` instead — which
also depends on the webhook flipping `Payment.status`. Same failure
mode if the webhook misses.

### What I cannot check from this environment

- **Vercel function logs** for the 3 timeframes (May 16 12:00–13:30
  IST, May 17 22:00–23:30 IST). I don't have `vercel` CLI
  authenticated here. Need:
  - Was `[WEBHOOK]` log present at all for each payment? → tells us
    if Razorpay delivered the event.
  - If delivered: what's the response code path? Did the
    `[WEBHOOK] ERROR: Payment not found` line appear?
  - Any [EMAIL] error lines or unhandled stack traces?
- **Razorpay dashboard** — webhook configuration:
  - URL exactly `https://mindset-ten.vercel.app/api/payments/webhook`
    (not a stale URL like `mindset.org.in/api/...` or a Preview
    deploy URL)
  - Active toggle on
  - Subscribed events: `payment.captured` + `payment.failed`
    minimum
  - Live vs Test mode matches the keys we use (RAZORPAY_KEY_ID
    starts with `rzp_test_` per `src/components/payments/razorpay-
    checkout.tsx:96`, so we're in test mode — webhook URL must
    target the test-mode webhook config)
- **Razorpay dashboard** — recent delivery attempts for these 3
  payment ids. Razorpay shows per-payment what HTTP code our
  webhook returned for each event.

## Root cause hypothesis

**Most likely Mode A** for `pay_SqVAWZZOIVSvzj` and `pay_Spx7S2IB4VB7PN`:
the user successfully paid via a Razorpay order whose Payment row
doesn't exist in our DB. The webhook arrived, looked up by
`razorpayOrderId`, found nothing, returned 200, never retried.

For `pay_SqW8ymLh5KbHiE`: this one has a PENDING Payment row, so the
webhook either (a) never fired (Razorpay-side delivery failure), (b)
fired but errored mid-transaction, or (c) fired but our function
cold-started and timed out before completing. Cannot distinguish
without Vercel logs.

Suspected cause for the missing rows: the older code path before
Sprint Workshops-Paid had only `register-button.tsx`'s stub showing
"Paid workshop registration coming soon". If those Razorpay orders
were created by hand (Razorpay dashboard's "Create order" tool,
admin testing) without going through our `/api/payments/create-
order`, then naturally there's no DB Payment row. Worth confirming
with Suryansh — were any of these three test payments triggered via
Razorpay dashboard tools rather than the actual UI?

## Fix shape

The industry-standard pattern referenced in the sprint plan is correct:

1. **Client-side `/api/payments/verify` is the primary confirmation**
   — signature-verified, synchronous with the user's action. Wire it
   for SESSION + WORKSHOP (currently only EBOOK + PRODUCT). Tasks 3
   and 4.
2. **Webhook is a backup** for cases where the client fetch fails or
   the user closes the tab before verify completes. Same handler,
   idempotent — if Payment is already PAID when webhook arrives, no-op.
3. **`/api/payments/webhook` louder logging** so the next silent drop
   shows up in logs immediately. Task 5.
4. **`/admin/reconcile-payments`** lets ops fix the next dropped
   payment without code. Task 5.
5. **Reconcile the 3 current stuck payments** by hand (Task 2). The
   `pay_SqVAWZZOIVSvzj` workshop one may be a duplicate of
   `pay_SqW8ymLh5KbHiE` (same user, same workshop, ~1h apart) — if
   so, flag for refund instead of double-registering.

Mode B (non-atomic create-order) isn't strictly fixable since
Razorpay+Prisma can't share a transaction, but the verify-first
flow makes it a non-issue: if the user paid, verify creates the
registration regardless of whether the original Payment row
existed.
