# Sprint 11g Design — Library Entitlement Fix + Library Detail Pages

Date: 2026-05-07

## Problems

1. After purchasing a study material, it doesn't appear in `/user/library`. Root cause: Payment.status only transitions `PENDING → PAID` via the Razorpay webhook. In local dev and any environment where the webhook URL is unreachable, the payment stays PENDING forever and the library query (which filters `status: 'PAID'`) returns nothing.

2. Navigation links from inside the dashboard go to wrong places: library cards link to `/user/ebooks` (a flat legacy page), recommended cards link to the public `/study-materials` site, and no per-material detail page exists inside the dashboard chrome.

## Decisions

- **Buy CTA on detail page:** Direct Razorpay popup (no cart). Ebooks have never gone through the cart; adding `studyMaterialId` to `CartItem` is a schema change deferred to a future sprint.
- **Watermark caching:** Regenerate on every request (no cache). pdf-lib text overlay is fast enough; serverless environments can't reliably persist filesystem cache; Cloudinary write complexity not worth it pre-launch.
- **Detail page layout:** Single-column centred (no two-column) because `StudyMaterial` has no `description` field to fill a right column. Follows the exact pattern of `/user/shop/[id]`.

## Section 1 — Entitlement Fix

### New endpoint: `POST /api/payments/verify`

- Accepts `{ razorpayOrderId, razorpayPaymentId, razorpaySignature }`
- Verifies HMAC-SHA256: `sign(razorpayOrderId + "|" + razorpayPaymentId, RAZORPAY_KEY_SECRET)`
- If valid: marks `Payment.status = 'PAID'`, sets `razorpayPaymentId` and `razorpaySignature` on the row
- Returns `{ success: true }` or 400/403 on bad signature
- Auth-guarded (session required)
- Idempotent: if already PAID, returns success without re-updating

### `EbookActions` update

- Razorpay `handler` callback receives `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`
- Before showing success state: POST to `/api/payments/verify` with those three values
- On success: redirect to `/user/library/[studyMaterialId]` (user lands on the item they just bought, sees "Read →")
- On verify failure: show error, prompt user to contact support
- Webhook remains unchanged as safety net

## Section 2 — `/user/library/[id]` Detail Page

**File:** `src/app/(dashboard)/user/library/[id]/page.tsx` (server component)

**Data fetching (parallel):**
1. `studyMaterial` — `findUnique` where `{ id, isPublished: true }`. If null → inline 404.
2. `payment` — `findFirst` where `{ userId, studyMaterialId: id, type: 'EBOOK', status: 'PAID' }`. Only run if `type === 'PAID'`.

**Ownership logic:**
- `type === 'FREE'` → always owned
- `type === 'PAID'` → owned if payment row exists

**404 state:** Rendered inside dashboard chrome. Message: "This material isn't available anymore." + link back to `/user/library`. No redirect to Next.js 404.

**Layout:**
- `PageHeader` with back → `/user/library`
- Cover image: `aspect-[3/4]`, `rounded-2xl`, `lg:max-w-[480px] lg:mx-auto`
- Title: `text-[22px] font-semibold`
- Price/type label: "Free" or "₹X · Digital" or "Owned"
- CTA block (see below)
- Mobile sticky bottom CTA bar

**CTAs:**

| State | Primary | Secondary |
|---|---|---|
| Owned (PAID payment or FREE) | "Read →" — `href=/api/user/ebooks/[id]/serve` `target=_blank` | "Download" text link — same URL + `?download=1` |
| Unowned (PAID, not purchased) | "Buy ₹X" — opens inline Razorpay popup | — |

**Unowned buy flow:** Inline `EbookActions` component embedded in the page. After purchase, same verify → redirect to `/user/library/[id]` (page reloads as server component showing "Read →").

## Section 3 — Serve Endpoint Update

**File:** `src/app/api/user/ebooks/[id]/serve/route.ts`

Add `?download=1` support:
- If query param present: `Content-Disposition: attachment; filename="..."`
- Default (inline): existing behaviour

Add watermarking for `type === 'PAID'`:
- Fetch original PDF from `material.fileUrl`
- Use `pdf-lib` to embed diagonal text on every page
- Watermark text: `{userEmail} · {paymentId} · {timestamp}`
- Style: gray (0.85, 0.85, 0.85), 30% opacity, 45° rotation, 24pt, centre of each page
- Serve the stamped PDF buffer directly (no caching)
- Free materials (`type === 'FREE'`): serve as-is, no watermark

## Section 4 — Link Audit and Fixes

**Known broken links to fix:**

| File | Current href | Fix |
|---|---|---|
| `src/app/(dashboard)/user/library/page.tsx` line 132 | `/user/ebooks` | `/user/library/[item.id]` |
| `src/app/(dashboard)/user/library/page.tsx` line 187 | `/study-materials` | `/user/library/[item.id]` |
| `src/components/study-materials/ebook-actions.tsx` line 102 | `/user/ebooks` | `/user/library/[studyMaterialId]` |
| `src/components/dashboard/user/sidebar.tsx` line 32 | `/user/ebooks` | `/user/library` |
| `src/components/dashboard/user/sidebar.tsx` line 77 | `/user/ebooks` | `/user/library` |
| `src/components/dashboard/user/quick-actions-mobile.tsx` line 25 | `/study-materials` | `/user/library` |
| `src/app/(dashboard)/user/ebooks/page.tsx` line 141 | `/study-materials` | `/user/library` |

**`/user/ebooks` route:** Add a redirect in `next.config.ts`: `/user/ebooks → /user/library` (permanent: false).

**Grep for stragglers after fixes:** `/user/ebooks`, `/study-materials` inside `src/app/(dashboard)/**`, `/library/` (unprefixed) inside `src/app/(dashboard)/**`.

## Section 5 — Documentation

**New file:** `docs/dev-setup-webhooks.md`

Covers:
- Why Razorpay webhooks can't reach localhost
- ngrok install + `ngrok http 3000` command
- Razorpay dashboard webhook configuration (URL, events, secret)
- How to verify (ngrok inspect UI)
- Production checklist for Suryansh (live mode webhook + env var)

## Files Created
- `src/app/api/payments/verify/route.ts`
- `src/app/(dashboard)/user/library/[id]/page.tsx`
- `docs/dev-setup-webhooks.md`
- `docs/sprint-11g-acceptance.md`

## Files Modified
- `src/app/api/user/ebooks/[id]/serve/route.ts` — watermark + download param
- `src/components/study-materials/ebook-actions.tsx` — call verify, redirect to detail page
- `src/app/(dashboard)/user/library/page.tsx` — fix card links
- `src/components/dashboard/user/sidebar.tsx` — fix /user/ebooks refs
- `src/components/dashboard/user/quick-actions-mobile.tsx` — fix /study-materials ref
- `src/app/(dashboard)/user/ebooks/page.tsx` — fix /study-materials ref
- `next.config.ts` — add /user/ebooks redirect

## Out of Scope
- Cart support for ebooks (requires `CartItem` schema migration)
- Embedded PDF reader UI
- DRM beyond watermarking
- `StudyMaterial` schema additions (description, author, pageCount)
- Onboarding, notifications, PWA
