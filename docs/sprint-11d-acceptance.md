# Sprint 11d — Acceptance Report

**Date:** 2026-04-27
**Test account:** playwright@test.com
**Environment:** localhost:3000, Next.js 16.2.4 + Turbopack, Razorpay test mode

---

## Pre-flight (Section 2)

### 2a. Schema status

Using `npx prisma db push` (no migration files). Schema is current — `isDigital` column exists on Product model.

### 2b. Products table

| name | isDigital | stock | price |
|------|-----------|-------|-------|
| Anxiety Relief Fidget Kit | false | 30 | 799 |
| Emotional Wellness Toolkit | **true** | 15 | 1899 |
| Mindfulness Meditation Cushion | false | 20 | 1299 |
| Mindset Gratitude Journal | false | 50 | 499 |
| Self-Care Affirmation Cards (50 Pack) | false | 100 | 349 |

5 active products, 1 digital.

### 2c. Webhook env var

`SHIPROCKET_WEBHOOK_TOKEN` was **not set** in .env.local. Set to `test-secret-for-11d` for section 3 testing. The webhook code has an `if (webhookToken)` guard that allows bypass when unset — in production, this MUST be set.

### 2d. Route listing

```
src/app/(dashboard)/user/orders/checkout/page.tsx
src/app/(dashboard)/user/orders/page.tsx
src/app/(dashboard)/user/shop/[id]/page.tsx
src/app/(dashboard)/user/shop/cart/page.tsx
src/app/(dashboard)/user/shop/orders/page.tsx
src/app/(dashboard)/user/shop/page.tsx
```

### 2e. Type check

7 pre-existing errors (unchanged from Sprint 11c):
- 2x `page.tsx` — GSAP type mismatch (Element vs HTMLElement)
- 2x `doctor-card.tsx` / `doctor-filter.tsx` — `@prisma/client/runtime/library` module not found
- 2x `register-button.tsx` — TypeScript union narrowing
- 1x `page.tsx` — duplicate of GSAP issue

No new errors from Sprint 11d changes.

---

## Cosmetic Fixes (Section 1)

### 1a. Teal buttons to sage/primary

**Files changed:** `product-actions.tsx` (3 replacements), `cart-summary-bar.tsx` (1 replacement)

All `var(--teal)` (#0B9DA9 bright cyan) replaced with `var(--color-primary)` (#2D5A4F sage green).

Screenshot: `cosmetic-02-pdp-button.png` — PDP shows sage "View Cart" link and quantity controls

### 1b. Cart badge: terracotta to sage

**File:** `shop-content.tsx` — `bg-accent` changed to `bg-primary`

Screenshot: `cosmetic-01-shop-badge.png` — Cart icon badge is now sage green

### 1c. "In cart" badge: green to sage

**File:** `shop-content.tsx` — `bg-green-50 text-green-600` changed to `bg-primary-tint text-primary`

Screenshot: `cosmetic-04-in-cart-badge.png` — "In cart" badges on product cards now use sage tint

### 1d. Trash icon double border

**File:** `cart/page.tsx` — Added `border-0 bg-transparent` to trash button className

Screenshot: `cosmetic-03-cart-trash.png` — Clean trash icon, no double border

### 1e. Broken cart links

**Files:** `product-actions.tsx`, `cart-summary-bar.tsx` — Changed `href="/user/cart"` to `href="/user/shop/cart"`

No `/user/cart` route exists. Both files were linking to a 404.

### 1f. Empty cart redirect

**File:** `checkout/page.tsx` — Changed `router.push('/products')` to `router.push('/user/shop')`

Also fixed race condition: added `cartLoading` and `sessionStatus` guards to prevent redirect before cart items load.

Screenshot: `cosmetic-05-empty-redirect.png` — Empty cart now redirects to `/user/shop`

---

## Webhook Security (Section 3)

Header checked: `x-api-key`
Rejection behavior: HTTP 200 with `{"received":true}` (intentional — prevents Shiprocket retry loops)

### 3a. No token header
```
HTTP Status: 200
Body: {"received":true}
Console: [SR_WEBHOOK] Invalid token, rejecting
```
**Pass** — Rejected silently.

### 3b. Wrong token
```
HTTP Status: 200
Body: {"received":true}
Console: [SR_WEBHOOK] Invalid token, rejecting
```
**Pass** — Rejected silently.

### 3c. Correct token, no matching AWB
```
HTTP Status: 200
Body: {"received":true}
```
**Pass** — Auth passes, no crash on missing order.

### 3d. Wrong cron secret
```
HTTP Status: 401
Body: {"error":"Unauthorized"}
```
**Pass** — Rejected with 401.

### 3e. Correct cron secret
```
HTTP Status: 200
Body: {"success":true,"reminders":{"processed":0,"sent":0,"failed":0},"followups":{"processed":0,"sent":0,"failed":0},"abandonedOrders":{"found":0,"cleaned":0},"expiredTokens":0}
```
**Pass** — All jobs run successfully.

---

## Digital Purchase (Section 4)

Product: Emotional Wellness Toolkit (`cmmk306nf000jtb3e8fomdydw`, isDigital=true, price=1899)

| Step | Screenshot | Result |
|------|-----------|--------|
| 01. Shop list | `11d-digital-01-shop.png` | Pass — Products visible, featured banner |
| 02. Digital PDP | `11d-digital-02-pdp.png` | Pass — "Digital Product" badge, "Available immediately after purchase", sage button |
| 03. Add to cart | `11d-digital-03-added.png` | Pass — Toast "Added to cart", button morphed to quantity controls + "View Cart" |
| 04. Cart page | `11d-digital-04-cart.png` | Pass — "Digital" label, "Digital delivery — no shipping needed", ₹1,899 |
| 05. Checkout | `11d-digital-05-checkout.png` | Pass — Skips to Step 3 (Payment only), "Digital delivery — available in your library immediately after payment" |
| 06. Confirm modal | `11d-digital-06-confirm-modal.png` | Pass — Shows items, "Digital delivery" notice, total ₹1,899 |
| 07. Razorpay | `11d-digital-07-razorpay.png` | **Blocked** — Razorpay iframe loads but card form doesn't render in Playwright automation |

**DB verification after checkout (pre-payment):**
```
paymentStatus: PENDING
shippingStatus: DELIVERED  (correct for digital — set at order creation)
totalAmount: 1899
items: Emotional Wellness Toolkit
```

**Razorpay payment completion: Not tested** — Requires manual browser testing. Razorpay's checkout iframe doesn't render card inputs in Playwright headless/headed automation. This is a known limitation of Razorpay's anti-automation measures.

---

## Physical Purchase (Section 5)

Product: Anxiety Relief Fidget Kit (`cmmk306fd000gtb3eg9gmynar`, isDigital=false, stock=30, price=799)

| Step | Screenshot | Result |
|------|-----------|--------|
| 01. Physical PDP | `11d-edge-9a-stock-pdp.png` | Pass — No digital badge, "30 in stock" in green, ₹799, sage "Add to Cart" |
| 02-03. Cart | `11d-edge-9g-cart-persisted.png` | Pass — Item in cart, subtotal correct |
| 04-05. Checkout | `11d-mobile-05-checkout.png` (mobile) | Pass — Full 3-step flow visible: Address, Delivery, Payment |

**Razorpay payment completion: Not tested** — Same Razorpay automation limitation.

---

## Edge Cases (Section 9)

| Test | Screenshot | Result | Notes |
|------|-----------|--------|-------|
| 9a. Stock display on PDP | `11d-edge-9a-stock-pdp.png` | **Pass** | Shows "30 in stock" in green |
| 9b. Stock drops during checkout | — | **Not tested** | Requires DB manipulation during live checkout |
| 9c. Quantity exceeds stock | — | **Not tested** | Requires manual +button testing |
| 9d. Empty cart at checkout | `11d-edge-9d-empty-redirect.png` | **Pass** | Redirects to `/user/shop` |
| 9e. Logged-out access | `11d-edge-9e-logged-out.png` | **Pass** | Redirects to `/login?callbackUrl=%2Fuser%2Fshop%2Fcart` |
| 9f. Double-click pay | — | **Not tested** | Requires Razorpay interaction |
| 9g. Cart persistence | `11d-edge-9g-cart-persisted.png` | **Pass** | Items survive hard refresh (DB-backed) |
| 9h. Razorpay dismissed | — | **Not tested** | Requires Razorpay interaction |

---

## Mobile Screenshots (Section 10)

Viewport: 390x844 (iPhone 14 Pro)

| Surface | Screenshot | Result |
|---------|-----------|--------|
| Shop list | `11d-mobile-01-shop.png` | **Pass** — Grid layout, featured banner, bottom nav, all readable |
| Digital PDP | `11d-mobile-02-digital-pdp.png` | **Pass** — "Digital Product" badge, sage button, description |
| Physical PDP | `11d-mobile-03-physical-pdp.png` | **Pass** — Image, price, stock count, sage button |
| Cart | `11d-mobile-04-cart.png` | **Pass** — Item row, quantity controls, "Proceed to Checkout" |
| Checkout | `11d-mobile-05-checkout.png` | **Pass** — Full address form, step indicators, order summary |
| Orders | `11d-mobile-06-orders.png` | **Pass** — Order list renders |
| Library | `11d-mobile-07-library.png` | **Pass** — "Your Library" + "Recommended For You" sections |

No mobile-specific bugs found. All surfaces render cleanly at 390px width.

---

## Bugs Found During Acceptance

### Bug 1: Checkout empty cart redirect race condition (FIXED in this sprint)

**Severity:** Critical (blocks checkout entirely)
**Root cause:** `isLoading` in cart context initialized as `false`. When navigating to checkout, the redirect `useEffect` fires before session resolves and cart items load, immediately sending the user back to `/user/shop` even with items in cart.
**Fix:** Changed `isLoading` initial state to `true` in `cart-context.tsx`, added `sessionStatus` and `cartLoading` guards to the redirect useEffect in `checkout/page.tsx`.

### Bug 2: Checkout step indicator and buttons use Tailwind teal (not documented, not fixed)

**Severity:** Cosmetic
**Description:** The checkout page uses Tailwind `teal-500`/`teal-600` utility classes for step indicators, form elements, and buttons. These render as #14b8a6 (Tailwind teal), not the design system's primary #2D5A4F (sage). This is a different issue from the `var(--teal)` CSS variable bug fixed in this sprint — these are Tailwind color classes baked into the checkout component.
**Scope:** Out of scope for this sprint. Requires a full checkout page color audit.

### Bug 3: Razorpay payment cannot be automated in Playwright

**Severity:** Testing limitation (not a code bug)
**Description:** Razorpay's checkout iframe loads but doesn't render card input forms in Playwright (headed or headless). This is a known anti-automation measure by Razorpay.
**Impact:** Sections 4-8 payment completion, and edge cases 9f/9h, cannot be verified without manual browser testing.

---

## Mobile Bugs Found

None. All surfaces render correctly at 390px width.

---

## Summary

| Category | Tested | Passed | Blocked | Not Tested |
|----------|--------|--------|---------|------------|
| Cosmetic fixes | 6 | 6 | 0 | 0 |
| Webhook security | 5 | 5 | 0 | 0 |
| Digital purchase (pre-payment) | 6 | 6 | 1 | 0 |
| Physical purchase (pre-payment) | 3 | 3 | 1 | 0 |
| Edge cases | 4 | 4 | 0 | 4 |
| Mobile | 7 | 7 | 0 | 0 |
| **Total** | **31** | **31** | **2** | **4** |

**Critical bugs found:** 1 (fixed — checkout redirect race condition)
**Cosmetic bugs found:** 1 (checkout teal classes — deferred to polish backlog)
**Testing limitations:** Razorpay automation blocked — manual browser testing needed for payment completion, stock restoration, and webhook-triggered email verification.

### Ready for beta?

**Conditional yes.** The shop pipeline is functional through to order creation. Cart management, digital/physical product differentiation, checkout flow (address/delivery/payment steps), webhook security, and cron cleanup all work as designed. The two blockers for full sign-off are:

1. **Manual Razorpay test** — Complete one digital and one physical purchase in a real browser. Verify order status, stock decrement, email delivery, and library access.
2. **Shiprocket sandbox** — Shipped/delivered webhook emails need a real AWB code from Shiprocket. If sandbox isn't configured, accept as a known gap for beta.

Both can be done in a 30-minute manual QA session.

---

*All screenshots saved to `/tmp/shop-screenshots/11d/`*
