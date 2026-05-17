# Workshops-Paid hotfix investigation

Diagnosis run 2026-05-17 against production DB + local env. Two real
root causes found — one explains the missing email, the other explains
the missing registration row.

## DB state of the most recent test payment

```text
User: choudharysuryansh1111@gmail.com  (id: cmp46znjl000005l5qc9m3rg9)

--- WORKSHOP Payment rows (latest 5) ---
  id:                  cmpa07cwu000004jspl2zc9sk
  type:                WORKSHOP
  workshopId:          cmp9ouypv0000l027kuy7gnjf
  amount:              500
  razorpayOrderId:     order_SqV8huNCmsPDDp
  razorpayPaymentId:   null
  razorpaySignature:   null
  status:              FAILED         ← NOT PAID
  createdAt:           2026-05-17T16:42:53.599Z
  updatedAt:           2026-05-17T16:44:25.839Z   (~90s later)

--- WorkshopRegistration rows: 0 ---

--- Notifications since the test: 0 new ones ---
```

## Root cause 1 — Razorpay reported `payment.failed`, not `payment.captured`

The 90-second gap between `createdAt` and `updatedAt` proves the
webhook fired on the test order. It transitioned the Payment row from
`PENDING → FAILED`, which means Razorpay sent a `payment.failed`
event (handled at `src/app/api/payments/webhook/route.ts:315–369`,
which calls `prisma.payment.updateMany` to flip status).

So: the test card payment **did not succeed** at Razorpay's end. The
Razorpay modal may have closed without an obvious error (or with a
quick error toast the user missed), but the captured handler never
fired client-side and the webhook delivered a failure event.

Possible causes from Razorpay's side:
- 3DS challenge cancelled or wrong OTP
- Test card declined because of a Razorpay test-mode rule
- Network interruption mid-payment
- The wrong test card number (the correct one for India is
  `4111 1111 1111 1111` — re-confirm)

This is not a server-side bug. **No code change can flip a Razorpay-
side failure into a success.** Action: re-run the test cleanly with a
known-good test card, watch the Razorpay modal for any decline
message, and check the live webhook again.

`payment.failed` handling on our side IS correct — the row is marked
FAILED, the user sees no false "you're registered" state, no
registration row is leaked.

## Root cause 2 — `RESEND_FROM_EMAIL` is set to the test sender

This is the bug the user suspected. Local `.env.local` (and almost
certainly Vercel production env) has:

```
RESEND_FROM_EMAIL=onboarding@resend.dev
```

`src/lib/email-config.ts` does the right thing — it only falls back
to the verified `Mindset <hello@mindset.org.in>` if the env var is
**unset**. When the env var is set to the literal string
`onboarding@resend.dev`, that is what every Resend call uses.

Resend's `onboarding@resend.dev` test sender has a hard policy:

> can only send to the email address you registered Resend with
> (returns 403 to any other recipient).

So:
- Emails to the account owner (probably Suryansh's Resend signup
  email) **do** land. That's why prior session-booking smoke runs
  appeared to work.
- Emails to anyone else, including end-users on the platform,
  silently 403. Resend dashboard logs would show the 403; the email
  never delivers.

This explains every "email didn't arrive" report. The send code is
correct — the FROM address is wrong because the env value is the
test sender.

### What's NOT the cause

- No hardcoded `'onboarding@resend.dev'` anywhere in `src/` (grep
  confirmed). The only reference is the warning comment in
  `email-config.ts` explaining why the fallback exists.
- No template hardcodes a `from` field — all templates render bodies
  only, and `sendEmail()` in `email-service.ts:35` is the single
  place that calls `resend.emails.send` with `from: FROM_EMAIL`.
- Webhook signature, transaction logic, and registration creation
  code are correct (verified by code review). They simply never ran
  for this specific test payment because Razorpay said it failed.

## The fix

Per task: two things, but only one is a code/config change.

### Fix A — change `RESEND_FROM_EMAIL` (env var, not code)

Required in **two places**:

1. Local `.env.local` (so dev/CI uses the right sender).
2. **Vercel project env** for production (Settings → Environment
   Variables → `RESEND_FROM_EMAIL`).

Value to set in both:

```
RESEND_FROM_EMAIL=Mindset <hello@mindset.org.in>
```

Or, equivalently, **delete the variable entirely**. Without it the
`FALLBACK_FROM` constant in `email-config.ts` (which is the same
verified sender) kicks in. Deleting is safer — one fewer env var to
keep in sync across environments.

After the Vercel env change, the next deploy (or manual redeploy)
picks it up. All subsequent emails ship from the verified domain.

### Fix B — re-run the Razorpay test payment

Not a code fix. Use a fresh browser session, confirm the test card
number is exactly `4111 1111 1111 1111`, watch for any error in the
Razorpay modal during 3DS. If it fails again, the Razorpay dashboard
will have an entry under the test order ID `order_SqV8huNCmsPDDp`
explaining why.

## Open question for Suryansh

Was the test payment YOU ran today the one whose Razorpay order id is
`order_SqV8huNCmsPDDp` (created at 16:42 UTC = 22:12 IST)? If yes,
the FAILED status above is your run and Razorpay genuinely declined
it. If you ran a different one, share the order id from the Razorpay
dashboard and we can dig into that Payment row instead.
