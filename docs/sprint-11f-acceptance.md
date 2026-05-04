# Sprint 11f — Acceptance Report

**Date:** 2026-04-28
**Test account:** playwright@test.com
**Environment:** localhost:3000, Next.js 16.2.4 + Turbopack, Razorpay test mode

---

## Bug 1: Mobile cart icon in dashboard header

### What was missing

The desktop dashboard spine had a Cart link (added in Sprint 11a), but the mobile dashboard header had no cart access. Users on mobile had to navigate to Shop first to reach the cart.

### Fix

**File created:** `src/components/dashboard/cart-header-icon.tsx`

Client component using `useCart()` to read `totalItems`. Renders a Lucide `ShoppingBag` (22px, strokeWidth 1.5) linking to `/user/cart`. Badge logic:
- `totalItems === 0` → icon only, no badge
- `totalItems > 0 && totalItems <= 9` → sage circle with digit
- `totalItems > 9` → sage circle with "9+"

**File modified:** `src/components/dashboard/header.tsx`

Added `<CartHeaderIcon />` between the streak pill and the notification bell. Header remains a server component — CartHeaderIcon is a client component imported into it (React server components can render client component children).

### Verification

| Test | Screenshot | Result |
|------|-----------|--------|
| Empty cart — icon visible, no badge | `11f-mobile-header-empty.png` | **Pass** |
| 1 item in cart — sage "1" badge | `11f-mobile-header-badge.png` | **Pass** |
| Tap icon → navigates to /user/cart | `11f-mobile-cart-page.png` | **Pass** |

---

## Bug 2: Pay button — confirm modal removed

### Diagnosis: Why the double-click bug persisted after Sprint 11e

Sprint 11e added `autoOpen` to `RazorpayCheckout` — when the component mounts, it polls for `window.Razorpay` and auto-opens the payment modal. This worked in Playwright but failed on real devices.

**Root cause:** The `autoOpen` useEffect had `handlePayment` in its dependency array:

```tsx
// Sprint 11e — BUGGY
useEffect(() => {
  if (!autoOpen || autoOpened.current) return
  autoOpened.current = true
  const timer = setInterval(() => {
    if (window.Razorpay) {
      clearInterval(timer)
      handlePayment()
    }
  }, 100)
  return () => clearInterval(timer)
}, [autoOpen, handlePayment])  // <-- handlePayment changes every render
```

`handlePayment` is a `useCallback` depending on `onSuccess` and `onDismiss` — both are **non-memoized function declarations** in `checkout/page.tsx`. They get new references on every React render, causing `handlePayment` to get a new reference, which triggers the effect's cleanup function (kills the polling interval). The effect re-runs, but `autoOpened.current` is already `true`, so it returns early. Net result: polling starts, gets cancelled on next render, never restarts.

In Playwright testing, `window.Razorpay` was cached from a prior page load, so the first 100ms poll found it before React's re-render killed the interval. On a real device loading fresh, the SDK took longer, the polling got cancelled, and autoOpen silently failed.

**Secondary issue:** The Razorpay SDK was only loaded when `RazorpayCheckout` mounted (after the API call completed). This added 2-5 seconds of SDK download time to the critical path.

### Fix

**2a. Removed the confirm modal entirely.**

The intermediate "Are you sure you want to pay?" modal was:
- Redundant (Razorpay's own modal shows the payment amount)
- The source of two sprints of bugs
- Not used by any major checkout flow (Stripe, Shopify, Amazon all go button → payment directly)

**2b. Fixed autoOpen** using a ref to avoid dependency-triggered cleanup:

```tsx
// Sprint 11f — FIXED
const handlePaymentRef = useRef<(() => void) | null>(null)
// ... after handlePayment useCallback:
handlePaymentRef.current = handlePayment

useEffect(() => {
  if (!autoOpen || autoOpened.current) return
  autoOpened.current = true
  let attempts = 0
  const timer = setInterval(() => {
    attempts++
    if (window.Razorpay) {
      clearInterval(timer)
      handlePaymentRef.current?.()
    } else if (attempts > 100) {
      clearInterval(timer)
    }
  }, 100)
  return () => clearInterval(timer)
}, [autoOpen])  // <-- only depends on autoOpen (stable boolean)
```

The ref always points to the latest `handlePayment` without triggering effect cleanup.

**2c. Pre-loaded Razorpay SDK** on checkout page mount:

```tsx
// In checkout/page.tsx — runs when page loads, not when user clicks Pay
useEffect(() => {
  const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
  if (existing) return
  const script = document.createElement('script')
  script.src = 'https://checkout.razorpay.com/v1/checkout.js'
  script.async = true
  document.body.appendChild(script)
}, [])
```

This eliminated SDK loading from the critical path. Time-to-Razorpay dropped from 2-6 seconds to ~130ms.

**2d. Double-click guard.** Pay button uses `placing` state:
- On click: `placing=true`, button disabled with Loader2 spinner + "Processing..."
- On API success: `paymentData` set, button replaced by RazorpayCheckout (autoOpen fires)
- On API error: `placing=false`, button re-enabled, error shown
- On Razorpay dismiss: `paymentData=null`, `placing=false`, button re-enabled for retry

### Files modified

| File | Change |
|------|--------|
| `src/app/(dashboard)/user/orders/checkout/page.tsx` | Removed OrderConfirmModal import, `showConfirmModal` state, modal rendering. Pay button calls `handlePlaceOrder` directly with inline spinner. Added Razorpay SDK pre-load on mount. `placing` stays true on success path (reset on dismiss/error). |
| `src/components/payments/razorpay-checkout.tsx` | Added `handlePaymentRef` ref. autoOpen effect depends only on `[autoOpen]`, calls via ref. Added 10-second timeout (100 attempts). |

### Files deleted

| File | Reason |
|------|--------|
| `src/components/checkout/order-confirm-modal.tsx` | No remaining imports. Confirmed with grep. |

### Verification — five-times-in-a-row test

**Desktop (1280x900):**

| Run | Click count to open Razorpay | Time | Result |
|-----|------------------------------|------|--------|
| 1   | 1                            | 112ms | Pass   |
| 2   | 1                            | 131ms | Pass   |
| 3   | 1                            | 126ms | Pass   |
| 4   | 1                            | 130ms | Pass   |
| 5   | 1                            | 128ms | Pass   |

**Mobile (390x844):**

| Run | Click count to open Razorpay | Time | Result |
|-----|------------------------------|------|--------|
| 1   | 1                            | 114ms | Pass   |
| 2   | 1                            | 143ms | Pass   |
| 3   | 1                            | 140ms | Pass   |
| 4   | 1                            | 141ms | Pass   |
| 5   | 1                            | 139ms | Pass   |

**10/10 passes. All single-click. All under 150ms.**

### Screenshots

| Surface | Screenshot | Result |
|---------|-----------|--------|
| Desktop checkout — "Pay" button, no modal | `11f-desktop-checkout-pay.png` | **Pass** — Button says "Pay ₹1,899", no "Confirm & Pay" |
| Desktop — Razorpay opened after single click | `11f-desktop-razorpay-open.png` | **Pass** — Button shows "Processing..." spinner, Razorpay iframe present |
| Mobile checkout — "Pay" button | `11f-mobile-checkout-pay.png` | **Pass** — Same direct Pay button |
| Mobile — Razorpay opened after single click | `11f-mobile-razorpay-open.png` | **Pass** — "Processing..." spinner, Razorpay iframe present |

---

## First-run failure analysis

Before the SDK pre-load fix, the initial test run had 2 failures out of 10:

| Run | Time | Result | Cause |
|-----|------|--------|-------|
| Desktop 4 | 6190ms | Fail | Razorpay SDK loading from network (no cache) exceeded 6s test timeout |
| Mobile 1 | 6264ms | Fail | Same — fresh browser context, SDK not cached |

After adding SDK pre-loading to checkout page mount, all 10 runs passed with times under 150ms. The SDK is loaded while the user is reviewing their order, so it's ready by the time they click Pay.

---

## Files changed summary

| File | Action |
|------|--------|
| `src/components/dashboard/cart-header-icon.tsx` | **Created** — client component for mobile header cart icon |
| `src/components/dashboard/header.tsx` | **Modified** — added CartHeaderIcon between streak pill and bell |
| `src/app/(dashboard)/user/orders/checkout/page.tsx` | **Modified** — removed confirm modal, direct Pay button with spinner, SDK pre-load |
| `src/components/payments/razorpay-checkout.tsx` | **Modified** — ref-based autoOpen, stable effect deps |
| `src/components/checkout/order-confirm-modal.tsx` | **Deleted** — no remaining consumers |

---

## Out of scope (deferred to 11g)

- Checkout right-rail layout redesign
- Sticky bottom bar on mobile checkout
- Order summary moved to sidebar
- Any visual restyle beyond modal removal

---

*All screenshots saved to `/tmp/shop-screenshots/11f/`*
