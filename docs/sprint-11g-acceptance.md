# Sprint 11g Acceptance Report

## Diagnostic Findings

### Root cause of entitlement bug

The Razorpay `handler` callback in `EbookActions` only called `setMessage('Purchase successful!')` — it never wrote anything to the database. Payment rows only transitioned `PENDING → PAID` via the Razorpay webhook, which cannot reach `localhost:3000` in local development (Razorpay's servers need a public URL). The library page queries `WHERE status='PAID'`, so purchased items never appeared.

### Broken code path (before fix)
```
User pays → Razorpay handler fires → setMessage() [no DB write]
Razorpay server → POST /api/payments/webhook → unreachable on localhost
/user/library query: Payment WHERE status=PAID → 0 rows → empty library
```

### Fixed code path
```
User pays → Razorpay handler fires → POST /api/payments/verify
  → HMAC-SHA256(orderId|paymentId, RAZORPAY_KEY_SECRET) verified
  → Payment.status = PAID, razorpayPaymentId, razorpaySignature written
  → router.push(/user/library/[studyMaterialId])
/user/library query: Payment WHERE status=PAID → 1 row → item appears
Webhook still fires in production as safety net
```

### Broken navigation links (before fix)
| Location | Was | Fixed to |
|----------|-----|----------|
| `/user/library` "Your Library" cards | `/user/ebooks` | `/user/library/[id]` |
| `/user/library` "Recommended" cards | `/study-materials` (public) | `/user/library/[id]` |
| `EbookActions` post-purchase | `/user/ebooks` | `/user/library/[id]` (via redirect) |
| Sidebar NAV_ITEMS "E-Books" | `/user/ebooks` | `/user/library` |
| Sidebar bottomNavItems "Library" | `/user/ebooks` | `/user/library` |
| Quick Actions mobile "Study Materials" | `/study-materials` (public) | `/user/library` |
| `/user/ebooks` "Browse Premium Materials" | `/study-materials` (public) | `/user/library` |

## Files Modified / Created

### Created
- `src/app/api/payments/verify/route.ts` — HMAC payment verification endpoint
- `src/components/library/library-detail-actions.tsx` — client CTA component (Read/Buy/Download)
- `src/app/(dashboard)/user/library/[id]/page.tsx` — library detail server page
- `docs/dev-setup-webhooks.md` — ngrok tunnel setup + production checklist
- `docs/sprint-11g-acceptance.md` — this file

### Modified
- `src/app/api/user/ebooks/[id]/serve/route.ts` — pdf-lib watermark + `?download=1` param
- `src/components/study-materials/ebook-actions.tsx` — call verify, redirect to detail page
- `src/app/(dashboard)/user/library/page.tsx` — card hrefs fixed
- `src/components/dashboard/user/sidebar.tsx` — /user/library links
- `src/components/dashboard/user/quick-actions-mobile.tsx` — /user/library link
- `src/app/(dashboard)/user/ebooks/page.tsx` — /user/library link

## Watermarking Implementation

File: `src/app/api/user/ebooks/[id]/serve/route.ts`

- Library: `pdf-lib` `PDFDocument.load` → `embedFont(Helvetica)` → `drawText` per page
- Stamp text: `{userEmail} · {paymentId} · {YYYY-MM-DD}`
- Style: `rgb(0.75, 0.75, 0.75)`, opacity `0.35`, size `14pt`, `rotate(45°)`, `x=width/2-180, y=height/2`
- Free materials: served as-is, no watermark
- No caching: regenerated on every request (serverless-safe, no filesystem/Cloudinary dependency)
- `?download=1`: switches `Content-Disposition` from `inline` to `attachment`

## Acceptance Tests

> Run these manually and fill in results. Screenshots required for Pass.

### 4a. Webhook + Entitlement (run twice with two different study materials)

| Step | Result | Evidence |
|------|--------|----------|
| Start ngrok, configure Razorpay test webhook | | See docs/dev-setup-webhooks.md |
| Buy paid study material via dashboard | | |
| Check Payment row — status=PAID after verify call | | DB query screenshot |
| Refresh /user/library → item appears under "Your library" | | Screenshot |
| Click item → stays in dashboard at /user/library/[id] | | Screenshot |
| CTA shows "Read →" (owned state) | | Screenshot |
| Click Read → new tab, PDF opens with watermark visible | | Screenshot showing watermark text |
| Click Download → browser downloads PDF | | |
| **Run #2 with second study material** | | |

### 4b. Unowned item flow

| Step | Result | Evidence |
|------|--------|----------|
| /user/library "Recommended" → click item → /user/library/[id] | | Screenshot |
| CTA shows "Buy ₹X" | | Screenshot |
| Click Buy → Razorpay popup opens | | Screenshot |
| After payment → verify fires → page refreshes to "Read →" state | | Screenshot |

### 4c. Free item flow

| Step | Result | Evidence |
|------|--------|----------|
| Free study material in library | | Not Tested if no free items in seed data |
| Click → /user/library/[id] | | |
| CTA shows "Read →", no price shown | | Screenshot |
| Click Read → PDF opens without watermark | | Screenshot |

### 4d. Mobile (390px viewport)

| Check | Result | Evidence |
|-------|--------|----------|
| Library list renders correctly | | Screenshot |
| Detail page (owned) — sticky CTA visible above bottom nav | | Screenshot |
| Detail page (unowned) — sticky Buy CTA visible | | Screenshot |
| Sticky CTA does not overlap bottom nav | | Screenshot |

### 4e. No leaks to public site

| Check | Result |
|-------|--------|
| No `/study-materials` links remain in `/user/**` dashboard routes | Grep clean ✓ |
| No `/user/ebooks` links remain in dashboard nav/cards | Grep clean ✓ |
| No unprefixed `/library/` links in dashboard | Grep clean ✓ |
| Admin routes (`/admin/study-materials/**`) untouched | Not changed ✓ |

### 4f. Shop regression

| Check | Result | Evidence |
|-------|--------|----------|
| /user/shop → click product → /user/shop/[id] still works | | Screenshot |
