# Workshops + Circles audit — ground truth before any payment-wiring work

Snapshot taken 2026-05-17. Pure audit, no code changed. Goal: know
exactly what exists, what doesn't, and what the shortest end-to-end
launch path looks like — separately for Workshops and Circles.

## 1. Schema (prisma/schema.prisma)

### Enums

`WorkshopType` (`prisma/schema.prisma:59`):

```prisma
enum WorkshopType {
  WORKSHOP
  CIRCLE
}
```

`WorkshopStatus` (`prisma/schema.prisma:64`):

```prisma
enum WorkshopStatus {
  SCHEDULED
  LIVE
  COMPLETED
  CANCELLED
}
```

`PresenterTier` (`prisma/schema.prisma:54`):

```prisma
enum PresenterTier {
  PROFESSIONAL
  ASSOCIATE
}
```

`PaymentStatus` (`prisma/schema.prisma:157`):

```prisma
enum PaymentStatus {
  PENDING
  PAID
  REFUNDED
  FAILED
}
```

`PaymentType` (`prisma/schema.prisma:432`):

```prisma
enum PaymentType {
  SESSION
  PRODUCT
  EBOOK
  WORKSHOP
}
```

> Note: there is **no `CIRCLE` variant** in `PaymentType`. Circle
> payments would have to reuse `WORKSHOP` since the underlying
> Workshop row's `type` column distinguishes them.

`NotificationKind` (`prisma/schema.prisma:523`):

```prisma
enum NotificationKind {
  SESSION_REMINDER
  WORKSHOP
  ORDER
  REVIEW_PROMPT
  SYSTEM
  ASSIGNMENT_NEW
  ASSIGNMENT_COMPLETED
}
```

> Note: one shared `WORKSHOP` kind, no separate `CIRCLE` /
> `WORKSHOP_REMINDER` / `CIRCLE_REMINDER` variants. A reminder
> cron-job would re-use `WORKSHOP` (or have to add new enum values).

### Models

`Presenter` (`prisma/schema.prisma:204`):

```prisma
model Presenter {
  id           String         @id @default(cuid())
  name         String
  title        String
  bio          String?        @db.Text
  linkedinUrl  String?        @map("linkedin_url")
  tier         PresenterTier
  upi          String?
  pan          String?
  bankAccount  String?        @map("bank_account")
  ifsc         String?
  isActive     Boolean        @default(true) @map("is_active")
  createdAt    DateTime       @default(now()) @map("created_at")
  updatedAt    DateTime       @updatedAt      @map("updated_at")

  workshops    Workshop[]

  @@map("presenters")
}
```

> Presenter is a **separate model from Doctor** — no FK to Doctor or
> User. Presenters exist independently; they do NOT log into the app
> as Users. Payout fields (upi/pan/bankAccount/ifsc) exist but are
> manually managed via Prisma Studio per a comment in the admin form
> ("Payout details (UPI / PAN / bank) can be added later via Prisma
> Studio."). No PresenterEarning table; only `Workshop.presenterSplitPct`
> stores the cut intent.

`Workshop` (`prisma/schema.prisma:224`) — every field:

```prisma
model Workshop {
  id                String   @id @default(cuid())
  title             String
  subtitle          String?
  description       String   @db.Text
  coverImageUrl     String?  @map("image")
  instructorName    String?           // legacy free-text, kept for compat
  startsAt          DateTime @map("date")
  durationMin       Int      @default(60)
  priceCents        Int      @default(0)
  capacity          Int?              // null = unlimited
  whatsappGroupUrl  String?  @map("whatsapp_group_url")
  published         Boolean  @default(false) @map("isPublished")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  type              WorkshopType   @default(WORKSHOP)
  status            WorkshopStatus @default(SCHEDULED)
  presenterId       String?        @map("presenter_id")
  meetLink          String?        @map("meet_link")
  minCapacity       Int            @default(5) @map("min_capacity")
  presenterSplitPct Int            @default(70) @map("presenter_split_pct")
  cancelledAt       DateTime?      @map("cancelled_at")
  cancelReason      String?        @map("cancel_reason")

  presenter     Presenter?             @relation(fields: [presenterId], references: [id], onDelete: Restrict)
  registrations WorkshopRegistration[]

  @@index([presenterId])
  @@index([startsAt, status])
}
```

> **There is no separate `Circle` model.** A Circle is just
> `Workshop { type: CIRCLE, ... }`. The same model carries both
> product types; behavior diverges only where code branches on
> `workshop.type === 'CIRCLE'`.

`WorkshopRegistration` (`prisma/schema.prisma:256`):

```prisma
model WorkshopRegistration {
  userId       String
  workshopId   String
  registeredAt DateTime  @default(now())

  paymentId    String?   @unique @map("payment_id")
  refundedAt   DateTime? @map("refunded_at")
  attendedAt   DateTime? @map("attended_at")

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  workshop Workshop @relation(fields: [workshopId], references: [id], onDelete: Cascade)
  payment  Payment? @relation(fields: [paymentId], references: [id])

  @@id([userId, workshopId])
  @@index([workshopId, refundedAt])
}
```

> **Important deviation from the audit prompt:** there is **no
> `paymentStatus` enum column** on `WorkshopRegistration`. The
> payment state is inferred from the linked `Payment.status` (via
> `paymentId`) or from `refundedAt`. So the query
> `SELECT "paymentStatus", COUNT(*) FROM "WorkshopRegistration"`
> would error — that column doesn't exist.

`Payment` (`prisma/schema.prisma:410`):

```prisma
model Payment {
  id                  String        @id @default(cuid())
  userId              String
  amount              Decimal       @db.Decimal(10, 2)
  type                PaymentType
  razorpayOrderId     String?       @unique
  razorpayPaymentId   String?       @unique
  razorpaySignature   String?
  status              PaymentStatus @default(PENDING)
  sessionId           String?       @unique
  orderId             String?       @unique
  studyMaterialId     String?
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  user                 User                  @relation(fields: [userId], references: [id])
  session              Session?              @relation(fields: [sessionId], references: [id])
  order                Order?                @relation(fields: [orderId], references: [id])
  earning              DoctorEarning?
  workshopRegistration WorkshopRegistration?
}
```

> **There is no `workshopId` field on Payment.** The link is reverse:
> `WorkshopRegistration.paymentId` → `Payment.id`. Which means there
> is **no place to store "this pending Payment is for workshop X"**
> until the registration row is created — and the registration row
> is what we DON'T want to create speculatively before the payment
> succeeds. This is a real schema gap for the paid flow (called out
> in the prior session's create-paid-workshop plan as
> "Payment.workshopId String? missing").

Back-relations:
- `User.workshopRegistrations  WorkshopRegistration[]` (line 37)
- `Presenter.workshops          Workshop[]` (line 219)
- `Workshop.registrations       WorkshopRegistration[]` (line 250)
- `Workshop.presenter           Presenter?` (line 249)
- `Payment.workshopRegistration WorkshopRegistration?` (line 429)

No relations on Doctor for workshops.

---

## 2. Database state (production, Neon)

Queried 2026-05-17 with the schema-correct version of each prompt
query (note: `paymentStatus` on WorkshopRegistration doesn't exist
— substituted with a JOIN to Payment.status below).

```text
--- Workshop GROUP BY type, status ---
[
  { "type": "WORKSHOP", "status": "SCHEDULED", "count": 1 }
]

--- Workshop sample (latest 10) ---
  {
    "id":          "cmp9ouypv0000l027kuy7gnjf",
    "title":       "Understanding Anxiety — A Practical Workshop",
    "type":        "WORKSHOP",
    "status":      "SCHEDULED",
    "startsAt":    "2026-05-18T05:30:00.000Z",
    "priceCents":  50000,
    "minCapacity": 5,
    "capacity":    null,
    "presenterId": null,
    "published":   true
  }

--- WorkshopRegistration total + per-payment-status breakdown ---
  total: 0
  rows:  (none)

--- Payment GROUP BY type, status ---
[
  { "type": "EBOOK",   "status": "PENDING", "count": 5 },
  { "type": "SESSION", "status": "PAID",    "count": 2 },
  { "type": "SESSION", "status": "PENDING", "count": 2 }
]

--- Payment.type='WORKSHOP' rows ---
  count: 0

--- Presenter rows ---
  count: 1
  { "id": "cmp5kujl6000004l8yo7ss176", "name": "muski",
    "tier": "ASSOCIATE", "isActive": true }
```

### Answers to the prompt's count questions

- **How many Workshops exist?** 1, all of type `WORKSHOP`, status
  `SCHEDULED`, published, paid (₹500). (The 4 dummy workshops were
  deleted earlier today per Suryansh's cleanup request.)
- **How many Circles exist?** **0.** No row has `type = CIRCLE`.
- **Are any registered/paid for already?** 0 registrations of any
  kind. 0 Payment rows of `type = WORKSHOP` ever.
- **Has anyone successfully completed a payment for either, ever?**
  No. The only `PAID` Payment rows in the DB are for SESSION (2
  rows). Everything else is PENDING.

---

## 3. Admin dashboard

### A. Workshop create + edit form

- Create page: **`src/app/(dashboard)/admin/workshops/create/page.tsx`**
- Edit page:   **`src/app/(dashboard)/admin/workshops/[id]/page.tsx`**

**Does the form have a type toggle?** Yes — both create + edit pages
include a WORKSHOP/CIRCLE pill toggle. From create page line 159–184:

```tsx
{/* Type */}
<div>
  <label className={labelCls}>Type</label>
  <div className="flex gap-2">
    {(['WORKSHOP', 'CIRCLE'] as const).map((t) => (
      <button
        key={t}
        type="button"
        onClick={() => selectType(t)}
        className="px-4 py-2 rounded-lg text-sm font-medium border"
        style={{
          background: form.type === t ? 'var(--coral)' : 'white',
          color: form.type === t ? 'white' : '#374151',
          borderColor: form.type === t ? 'var(--coral)' : '#d1d5db',
        }}
      >
        {t === 'WORKSHOP' ? 'Workshop' : 'Circle'}
      </button>
    ))}
  </div>
  <p className="text-xs text-gray-500 mt-1">
    {form.type === 'WORKSHOP'
      ? 'Topic-led, expert-driven session'
      : 'Smaller, peer-led conversation'}
  </p>
</div>
```

**What does the toggle actually change?** Only defaults via
`selectType()` (create page line 60–68):

```tsx
function selectType(t: 'WORKSHOP' | 'CIRCLE') {
  // Default split: WORKSHOP → 70/5, CIRCLE → 50/4.
  setForm({
    ...form,
    type: t,
    presenterSplitPct: t === 'CIRCLE' ? 50 : 70,
    minCapacity: t === 'CIRCLE' ? 4 : 5,
  })
}
```

That's it — no conditional fields, no different validation, no
different labels for the rest of the form. Same date picker, same
price input, same capacity, same description editor, same
publish toggle. Same submit button text ("Create Workshop" even
when type=CIRCLE). The toggle is purely metadata on the row.

**Validation differences (`src/lib/validations/workshop.ts:45`):**

```ts
type: z.enum(['WORKSHOP', 'CIRCLE']).default('WORKSHOP'),
```

Zod accepts both. No diverging refinements. `presenterSplitPct`
defaults to 70 in zod regardless of type — only the client form
nudges it to 50 for CIRCLE.

### B. Workshop list page in admin

- Path: **`src/app/(dashboard)/admin/workshops/page.tsx`**

It fetches `GET /api/admin/workshops` and renders a table. It does
**not show or filter by type at all** — there is no Type column, no
badge, no icon. From line 67–73:

```tsx
<tr className="border-b border-gray-200">
  <th className="text-left py-3 px-4 font-medium text-gray-500">Title</th>
  <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
  <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
  <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
</tr>
```

A Circle on this page is visually indistinguishable from a Workshop.
The `Workshop` TypeScript interface at the top of the file
(line 6–12) doesn't even include the `type` field.

### C. Separate Circle-only admin routes

**No.** `find src/app/(dashboard)/admin -type d -name "circles"` →
no match. The single `/admin/workshops` route serves both via the
shared form. No "manage Circle facilitators" or any Circle-only
tool.

### D. Permissions

ADMIN-only. Two gates:

- Page-level: `src/app/(dashboard)/admin/layout.tsx:23` — redirects
  any non-ADMIN role away from `/admin/*`.
- API-level: `src/app/api/admin/workshops/route.ts:10` (GET) and
  `:39` (POST) both check
  `session.user.role !== 'ADMIN'` → 403.

There is **no presenter-side or doctor-side ability to create
workshops or circles**. Only ADMIN.

---

## 4. User-facing pages

### A. `/user/discover` (hub)

- File: **`src/app/(dashboard)/user/discover/page.tsx`**

Treats workshops + circles as **one thing**: a single "Workshops"
hub card → `/user/discover/workshops`. No separate "Circles" tile.
No mention of the word "Circle" anywhere in the file. The "Coming
up" preview section queries `prisma.workshop.findFirst({ where:
{ published: true, startsAt: { gte: now } } })` with no type filter,
so a Circle could surface there labeled as a "Workshop".

### B. `/user/discover/workshops` (list)

- File: **`src/app/(dashboard)/user/discover/workshops/page.tsx`**

Queries `prisma.workshop.findMany({ where: { published: true, ... } })`
with **no `type` filter**, so the list returns both Workshops and
Circles. **No type badge, icon, or visual differentiation** on the
cards — both render with the same coral-tinted "Ticket" icon and
the same `text-primary` price label.

### C. `/user/discover/circles`

**Does not exist.** No `src/app/(dashboard)/user/discover/circles/`
directory.

### D. Detail page

- File: **`src/app/(dashboard)/user/discover/workshops/[id]/page.tsx`**

Renders identically for `type === 'CIRCLE'` and `type === 'WORKSHOP'`.
No branch on `workshop.type` anywhere in the file. Same hero, same
info card, same description, same register button. Same CTA copy:
"Reserve spot" (or "Reserve spot · ₹X" for paid). There is no
"Join the circle" alternative wording.

### E. Register button

- File: **`src/app/(dashboard)/user/discover/workshops/[id]/register-button.tsx`**

Type-agnostic. Same flow for both Workshops and Circles. From
line 33–51:

```tsx
function handleRegister() {
  if (!isFree) {
    // Paid flow — not implemented yet
    setError('Paid workshop registration coming soon')
    return
  }

  setError(null)
  startTransition(async () => {
    const result = await registerForWorkshop(workshopId)
    if (result.error) {
      setError(result.error === 'full' ? 'Sorry, all spots have been filled' : result.error)
    } else if ('success' in result && result.success) {
      setModalWhatsapp(result.whatsappUrl ?? null)
      setShowModal(true)
      router.refresh()
    }
  })
}
```

Two states it doesn't handle:
- **Paid Circle:** same stub — "Paid workshop registration coming
  soon". User has no way to pay for either.
- **Type-specific copy:** "You're enrolled" / "Reserve spot" /
  "Spots filled" / "This workshop has ended" — Circle users would
  see "workshop" wording too.

### Visual differentiation in the ComingUpRail

The only place in the entire `/user/*` dashboard that distinguishes
Circle from Workshop is the desktop **Coming Up rail**:

`src/lib/queries/upcoming.ts:108` maps the type to a `kind`:

```ts
kind: w.type === 'CIRCLE' ? 'circle' : 'workshop',
```

`src/components/dashboard/desktop/coming-up-rail.tsx:25–45` then
gives the card a 3px left stroke + chip:

```ts
const CHIP: Record<UpcomingItem['kind'], { label: string; cls: string }> = {
  session:  { label: 'Session',  cls: 'bg-primary-tint text-primary' },
  workshop: { label: 'Workshop', cls: 'bg-accent-tint text-accent' },
  circle:   { label: 'Circle',   cls: 'bg-tan-tint text-amber-700' },
}

const TYPE_STROKE: Record<UpcomingItem['kind'], string> = {
  session:  'var(--color-primary)',
  workshop: 'var(--color-accent)',
  circle:   '#C9A961',
}
```

But this **only fires after a user has a registration** (the rail
reads from `WorkshopRegistration`, not from the published-workshop
catalog). Pre-registration there is no Circle/Workshop signal
anywhere in the user surface.

---

## 5. Marketing site

- `src/app/workshops/page.tsx` — **exists**. Public marketing page.
  Loads via `fetch('/api/workshops')` which returns published
  workshops (no type filter), mapping `coverImageUrl → image` and
  `startsAt → date` for legacy field compat.
- `src/app/circles/` — **does NOT exist**. No `mindset.org.in/circles`
  route.
- Homepage / Navbar / static shell — zero mentions of "Circle" by
  name. All `"circle"` string matches in `src/app/page.tsx` and
  `src/components/Navbar.tsx` are `<svg><circle cx=…>` shape
  attributes (cart icon, etc.), not product references.

Marketing-side, Circles do not exist as a concept.

---

## 6. Payment + registration flow

### A. `POST /api/payments/create-order`

- File: **`src/app/api/payments/create-order/route.ts`**

Discriminated union at line 11–40:

```ts
const paymentSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('SESSION'), sessionId: z.string().cuid() }),
  z.object({ type: z.literal('PRODUCT'),  items: ..., shippingAddress: ..., ... }),
  z.object({ type: z.literal('EBOOK'),   studyMaterialId: z.string().cuid() }),
])
```

**Existing branches:** `SESSION` (line 65), `PRODUCT` (line 89),
`EBOOK` (line 240). **No `WORKSHOP` branch.** A client POST with
`type: 'WORKSHOP'` fails Zod parse → 400. No way to create a
Razorpay order or Payment row for a workshop via this endpoint.

### B. `POST /api/payments/webhook`

- File: **`src/app/api/payments/webhook/route.ts`**

`payment.captured` branches (verified by grep):

```
src/app/api/payments/webhook/route.ts:132:  if (payment.type === 'SESSION' && payment.sessionId)
src/app/api/payments/webhook/route.ts:143:  if (payment.type === 'PRODUCT' && payment.orderId)
src/app/api/payments/webhook/route.ts:151:  if (payment.type === 'EBOOK')
src/app/api/payments/webhook/route.ts:159:  if (payment.type === 'PRODUCT' && payment.orderId)
src/app/api/payments/webhook/route.ts:225:  if (payment.type === 'EBOOK' && payment.studyMaterialId)
src/app/api/payments/webhook/route.ts:249:  if (payment.type === 'SESSION' && payment.sessionId)
```

**No `payment.type === 'WORKSHOP'` branch anywhere.** Even if a
Payment row of type WORKSHOP were created by hand and Razorpay
captured it, the webhook would acknowledge the event and silently
do nothing — no WorkshopRegistration row, no email, no notification.

`payment.failed` branch (`:324`): only handles `PRODUCT` (deletes
the abandoned Order). No WORKSHOP handling.

### C. Free workshop registration

There is **no separate `/api/workshops/[id]/register` REST
endpoint**. Free registration is a server action:

- File: **`src/lib/actions/workshops.ts`** — `registerForWorkshop(workshopId)`.

It correctly rejects paid workshops inside the transaction
(line 35–37):

```ts
// Only handle free workshops here
if (workshop.priceCents > 0) {
  return { error: 'Paid workshops require payment flow' }
}
```

On success it creates the registration row, an `engagementEvent`,
and an in-app `Notification { kind: 'WORKSHOP', title: "You're in!" }`.
**It does NOT send an email.** No `sendWorkshopRegistration…`
function is called.

### D. Circle-specific endpoints

`find src/app/api -path "*circle*"` → no matches. No
`/api/circles/*` routes whatsoever.

---

## 7. Email + notifications

### A. Email templates (`src/emails/`)

- `workshop-registration-confirmation.tsx` — **does NOT exist**.
- `circle-registration-confirmation.tsx` — **does NOT exist**.
- Any other workshop/circle email — **none**. `ls src/emails/ |
  grep -iE "workshop|circle"` returns nothing.

### B. Email service (`src/lib/email-service.ts`)

- `sendWorkshopRegistrationConfirmation` — **does not exist**.
- `sendCircleRegistrationConfirmation`  — **does not exist**.

Confirmed by `grep -E "workshop|Workshop|circle|Circle|sendWorkshop|
sendCircle" src/lib/email-service.ts` → zero matches.

### C. Notification kinds

The `NotificationKind` enum has a single `WORKSHOP` value (no
`WORKSHOP_REGISTRATION_CONFIRMED`, no `WORKSHOP_REMINDER`, no
`CIRCLE_*` variants). It is created in exactly **one** place in the
entire codebase:

```
src/lib/actions/workshops.ts:67:  kind: 'WORKSHOP',
```

Inside `registerForWorkshop` — the free-flow registration. Nowhere
else. No reminder job, no day-of notification, no presenter
notification.

---

## 8. Doctor / presenter side

### Doctor dashboard awareness

- Files: `src/app/(dashboard)/doctor/*` (page, calendar, slots,
  patients, assignments, earnings, profile)
- `grep -rE "workshop|presenter" src/app/(dashboard)/doctor/` →
  **zero matches**.

The `/doctor` dashboard has **no concept of workshops or circles**.
A doctor cannot see what workshops are happening, cannot see if they
are listed as a presenter (and they can't be, since Presenter is a
separate model with no FK to Doctor/User).

### Presenter portal

**Does not exist.** Presenter is a Prisma row with no login, no
dashboard, no role. They can't:
- See their upcoming workshops
- See their registered attendees
- Get an automatic "your workshop is tomorrow" email
- See or claim earnings (no `PresenterEarning` table; only the
  intent-side `Workshop.presenterSplitPct` field)

The Presenter row's payout details (`upi`, `pan`, `bankAccount`,
`ifsc`) exist as data fields but are manually managed via Prisma
Studio per the admin form's own comment (`create/page.tsx:325`):

```
Payout details (UPI / PAN / bank) can be added later via Prisma Studio.
```

---

## 9. Open issues / known notes

### `docs/known-bugs.md`

Two workshop-related lines:

- `:49` — references workshop registrations in a rail-hiding
  rationale (not a system bug, just explaining a HideRail decision).
- `:77–90` — admin workshop-create page emits a console warning
  from tiptap (`Duplicate extension names found: ['underline']`).
  Functional but noisy. Unrelated to the workshop/circle product
  flow.

No notes about workshops or circles being incomplete; no notes
about paid flow.

### `docs/operations.md`

`grep -E "[Ww]orkshop|[Cc]ircle|[Pp]resenter" docs/operations.md` →
**no matches**. Operations runbook says nothing about workshops or
circles.

### In-code TODOs / FIXMEs

`grep -rE "TODO.*[Ww]orkshop|TODO.*[Cc]ircle|FIXME.*[Ww]orkshop" src/`
→ **no matches**.

The only "coming soon" in the workshop code is the runtime stub in
`register-button.tsx:36`:

```ts
if (!isFree) {
  // Paid flow — not implemented yet
  setError('Paid workshop registration coming soon')
  return
}
```

---

## Summary

### 1. Are Workshops fully wired end-to-end?

**No.** The free flow works: a published free Workshop can be
registered for via the `registerForWorkshop` server action, the row
is written, an in-app `Notification { kind: 'WORKSHOP' }` is
created, the user is shown the "You're in!" modal with an optional
WhatsApp group link. That's the complete free path.

Everything else is missing:
- **Paid flow:** stubbed with "Paid workshop registration coming
  soon". No `WORKSHOP` branch in `create-order`, no `WORKSHOP`
  branch in either webhook handler, no `Payment.workshopId` field
  to even thread the workshop ID through a pending payment.
- **Email confirmation:** no template, no service function, no
  callsite — neither free nor paid registration sends mail.
- **Reminders:** no cron-side workshop reminder job; the
  session-reminder cron does sessions only.
- **Presenter side:** Presenter rows exist but presenters have no
  login, no dashboard, no email pipeline.
- **Refunds:** `WorkshopRegistration.refundedAt` exists but no API
  or admin flow writes to it.

### 2. Are Circles fully wired end-to-end?

**Even less so.** Circles are a `WorkshopType` enum value and an
admin form pill. Below the admin layer:

- The user-facing dashboard does **not** mention Circles by name
  except in the ComingUpRail chip — and that only fires *after* a
  registration exists. Pre-registration, a Circle is indistinguishable
  from a Workshop on `/user/discover`, the list page, and the detail
  page.
- Marketing site has no `/circles` route and no homepage mention.
- The free-registration server action treats Circles as Workshops
  (same `Workshop.priceCents === 0` check, same registration row,
  same `NotificationKind: 'WORKSHOP'`).
- Paid Circle has zero implementation — same stub as paid Workshop.
- Doctor/Presenter side: no awareness, same as Workshops.

In short: **Circles are a database flag with no product surface.**

### 3. Shortest path to ship "users can register and pay for both Workshops and Circles" at launch

Hands-off the Circle-specific UX for v1 (treat both as one "Workshop"
to the end user; the chip in the upcoming rail already does
distinguish them post-registration). Build the paid flow once,
generically, and let `type` ride along. Roughly five commits:

1. **Schema:** add `Payment.workshopId String?` (additive, nullable,
   safe `prisma db push`). Holds the FK from a pending Payment to
   the Workshop it's for, since `WorkshopRegistration` shouldn't
   exist until payment succeeds.

2. **`POST /api/payments/create-order`:** add a `WORKSHOP` branch.
   Validate the workshop is published, future, has capacity, and
   `priceCents > 0`. Create the Razorpay order. Insert a Payment
   row with `type=WORKSHOP, status=PENDING, workshopId, amount`.
   Return `razorpayOrderId + paymentId` to the client.

3. **`POST /api/payments/webhook`:** add `payment.captured` →
   `WORKSHOP` branch. Mark Payment PAID, then in a transaction
   `prisma.workshopRegistration.create({ userId, workshopId,
   paymentId })`. Send a confirmation email (template needed — see
   next step). Create a `NotificationKind: 'WORKSHOP'` row. Add a
   minimal `payment.failed` branch that just logs (no order to
   roll back; no registration was speculatively created).

4. **Email + notification glue:** add
   `src/emails/workshop-registration-confirmation.tsx` (one
   template that handles both Workshops and Circles via copy
   variations on `workshop.type` — keeps it under one file).
   Wire `sendWorkshopRegistrationConfirmation` in
   `src/lib/email-service.ts`. Also call it from the existing
   *free* path in `registerForWorkshop` so users get a real email
   for free registrations too — currently they get only an in-app
   notification.

5. **Frontend register button:** replace the
   `'Paid workshop registration coming soon'` stub with a real
   flow — POST `create-order` → mount `<RazorpayCheckout>` →
   on `handler` success refresh the page + show the "You're in!"
   modal (same UX shape as the free flow). Keep the button copy
   "Reserve spot · ₹X" unchanged.

Out-of-scope for launch (defer):
- Presenter login / dashboard / earnings ledger.
- Workshop reminder cron (24h / 1h before).
- Refund tooling.
- Distinct Circle marketing copy / dedicated `/circles` page.
- Per-type validation rules (different price ceilings, different
  default duration, etc.).

After those five commits, both Workshops and Circles can be
discovered, registered, paid for, and confirmed end-to-end. The
Circle/Workshop distinction at launch surfaces only in (a) the
admin form pill, (b) the upcoming-rail chip post-registration. Good
enough to ship; the rest can land iteratively without breaking the
critical path.
