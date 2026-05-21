# Phase 5 — Real-device QA checklist

Owner-driven checklist for the 7 ported surfaces. Seven sections (A–G).

## Pre-requisites

Same as Phase 1-4. `npm run build && ARCJET_KEY="" npm start` +
`adb reverse tcp:3000 tcp:3000` + open `http://localhost:3000` on
the phone.

---

## A. Discover hub

| # | Step | Expected | Result |
|---|------|----------|--------|
| A1 | Open /user/discover | "Discover" header + serif subtitle + cart icon (top-right). Cart shows badge when cart has items. | |
| A2 | Two sibling tiles | Workshops (navy bg) + Shop (bg-cream). Each navigates to its destination. | |
| A3 | Self-care library section | Renders when StudyMaterials exist. Hero strip ("You have X saved" or "Library is empty") + horizontal preview rail | |
| A4 | NGO visits CTA card | Primary-bg card with "Next · <date>" or "One Saturday a month" kicker. CTA → /user/discover/ngo-visits | |
| A5 | Cart button → /user/cart | Verified | |

## B. Workshops (list + detail)

| # | Step | Expected | Result |
|---|------|----------|--------|
| B1 | Tap Workshops tile → /user/discover/workshops | Navy hero, featured workshop card, "More this week" rail, past attended list (if any) | |
| B2 | Tap a workshop → /user/discover/workshops/[id] | Tinted hero, presenter card, date/duration grid, description, sticky bottom register pill | |
| B3 | Paid workshop with test Razorpay card 4111... | Existing verify-first flow fires; on success "You're enrolled" + Meet link card (window state appropriate) | |
| B4 | Free workshop | Reserve spot CTA; verifies registration | |
| B5 | Workshop in past or full | Appropriate disabled state from existing WorkshopRegisterButton | |

## C. Library

| # | Step | Expected | Result |
|---|------|----------|--------|
| C1 | /user/library | "Continue reading" hero card (most-recently-opened owned). Owned grid + Browse Free + Browse Paid grids below. | |
| C2 | Tap an owned item | /user/library/[id] existing detail opens (file URL preview). Reading-state access tracking still fires (existing /api/user/library/[materialId]/access). | |
| C3 | Empty library | Empty state card with "library is coming together" copy | |

## D. NGO visits

| # | Step | Expected | Result |
|---|------|----------|--------|
| D1 | /user/discover/ngo-visits | List of upcoming visits with cover photos + "✓ Registered" badges on already-registered ones | |
| D2 | Tap a visit → /user/discover/ngo-visits/[id] | Existing detail (unchanged Sprint NGO-Dashboard chrome) | |
| D3 | Register CTA on detail | Existing flow with profile-gate when fields missing | |

## E. Shop

| # | Step | Expected | Result |
|---|------|----------|--------|
| E1 | /user/shop | "Shop" header + cart icon + filter chip row + 2-col product grid | |
| E2 | Tap a product → /user/shop/[id] | Mobile detail with hero image, title, price, status pill, About section, sticky bottom action bar | |
| E3 | "Add to Cart" via ProductActions | Cart badge in header updates (useCart hook) | |
| E4 | "Digital" filter chip | Filters by isDigital. Other chips highlight but don't filter (no category field — flagged in PORT_LOG) | |
| E5 | Out-of-stock product | "Out of stock" pill + dimmed card | |

## F. Cart

| # | Step | Expected | Result |
|---|------|----------|--------|
| F1 | /user/cart with items | Stacked line-item cards: 64px cover + name + price + qty stepper + Remove + line total | |
| F2 | Adjust qty via ± | Subtotal updates in sticky bottom bar | |
| F3 | Remove an item | Item disappears, subtotal updates | |
| F4 | Empty cart | Decorative blob + "Your cart is empty" + Browse shop CTA | |
| F5 | "Checkout" button | Navigates to /user/orders/checkout | |
| F6 | Cart badge in Discover header | Reflects current cart count | |

## G. Checkout

| # | Step | Expected | Result |
|---|------|----------|--------|
| G1 | /user/orders/checkout | Mobile chrome (back arrow + "Checkout" display title). Step indicator below. | |
| G2 | Existing 3-step flow (address → courier → payment) | All existing functionality preserved. Tailwind responsive classes handle the layout. | |
| G3 | Pay via Razorpay test card | Existing verify-first flow fires unchanged. On success → /user/orders/[id]. | |
| G4 | Back button → /user/cart | Verified | |

---

## Reporting

Reply with PASS / FAIL / DEFERRED per row. FAILs need a screenshot.
If A1-A5 + B1-B5 + C1-C3 + D1-D3 + E1-E5 + F1-F6 + G1-G4 all PASS,
Phase 5 closes.
