# IDOR Test Checklist — Manual Verification Guide

**Purpose**: Verify that users cannot access resources owned by other users.

**Ownership Check**: For each endpoint, verify the server checks that `session.user.id` matches the resource owner before returning data.

---

## Setup

1. **Create two test accounts** in your local/staging environment:
   - **User A**: email `test-a@mindset.local`, password `TestPass123!`
   - **User B**: email `test-b@mindset.local`, password `TestPass123!`

2. **Keep both logged in simultaneously**:
   - Open two browser windows/tabs in incognito mode
   - Tab 1: logged in as User A
   - Tab 2: logged in as User B
   - Or use two different browsers

3. **For each endpoint below**:
   - User A creates/owns a resource (session, payment, order, etc.)
   - Extract the resource ID from the response
   - Switch to User B's session
   - Try to access User A's resource by ID
   - **Expected**: 403 Forbidden or 404 Not Found
   - **If returns 200**: IDOR vulnerability confirmed ❌

---

## Endpoint Tests

### 1. Session Details — `GET /api/user/sessions/[id]`
**What to test**: Can User B read User A's therapy session details?

**Test steps**:
1. **User A**: 
   - Navigate to `/user/sessions` (or via API: `GET /api/user/sessions`)
   - Create/book a session with a doctor
   - Copy the session ID from the response (e.g., `clp123abc456def`)
2. **User B**:
   - Open Dev Console (F12)
   - Run: `fetch('/api/user/sessions/clp123abc456def').then(r => r.json()).then(d => console.log(d))`
   - Or modify the URL directly if it's a GET page like `/user/sessions/clp123abc456def`
3. **Expected**:
   - Status: 403 or 404
   - Response: `{ success: false, error: "Forbidden" }` or `{ success: false, error: "Session not found" }`
4. **If returns 200 with session data**: FAIL ❌ → Report immediately

**Code to verify** (`/src/app/api/user/sessions/[id]/route.ts`):
- Check: Does it verify `session.user.id` before returning data?
- Look for: `if (session.session.userId !== session.user.id) return errorResponse('Forbidden', 403)`

---

### 2. Order Details — `GET /api/user/orders/[id]`
**What to test**: Can User B read User A's order (shipping address, payment info)?

**Test steps**:
1. **User A**:
   - Navigate to `/user/orders` and create an order (or check existing orders)
   - Copy the order ID (e.g., `ord_1234567890`)
2. **User B**:
   - Run: `fetch('/api/user/orders/ord_1234567890').then(r => r.json()).then(d => console.log(d))`
3. **Expected**: 403 or 404
4. **If returns 200 with order + shipping address**: FAIL ❌

**Code to verify** (`/src/app/api/user/orders/[id]/route.ts`):
- Check: `if (order.userId !== session.user.id) return errorResponse('Forbidden', 403)`

---

### 3. Payment Details — `GET /api/user/payments/[id]`
**What to test**: Can User B view User A's payment history (amounts, methods, status)?

**Test steps**:
1. **User A**:
   - Create a payment (session, product, or workshop)
   - Copy the payment ID from response
2. **User B**:
   - Run: `fetch('/api/user/payments/pay_xyz123').then(r => r.json()).then(d => console.log(d))`
3. **Expected**: 403 or 404
4. **If returns payment details**: FAIL ❌

**Code to verify** (`/src/app/api/user/payments/[id]/route.ts`):
- Check: `if (payment.userId !== session.user.id) return errorResponse('Forbidden', 403)`

---

### 4. Address Details — `GET /api/user/addresses/[id]`
**What to test**: Can User B read User A's saved addresses?

**Test steps**:
1. **User A**:
   - Navigate to account settings → addresses
   - Create or note an existing address ID
2. **User B**:
   - Run: `fetch('/api/user/addresses/addr_abc123').then(r => r.json()).then(d => console.log(d))`
3. **Expected**: 403 or 404
4. **If returns address with full details**: FAIL ❌

**Code to verify** (`/src/app/api/user/addresses/[id]/route.ts`):
- Check: `if (address.userId !== session.user.id) return errorResponse('Forbidden', 403)`

---

### 5. Doctor Sessions — `GET /api/doctor/sessions/[id]` (PATCH updates)
**What to test**: Can Doctor B update Doctor A's sessions or see Doctor A's patient details?

**Test steps**:
1. **Doctor A**:
   - Have patients book sessions
   - Copy a session ID
2. **Doctor B**:
   - Try to update that session: 
     ```bash
     curl -X PATCH /api/doctor/sessions/sess_abc123 \
       -H "Authorization: Bearer <doctor-b-token>" \
       -H "Content-Type: application/json" \
       -d '{"status":"COMPLETED"}'
     ```
   - Or fetch: `fetch('/api/doctor/sessions/sess_abc123').then(r => r.json()).then(d => console.log(d))`
3. **Expected**: 403 or 404
4. **If Doctor B can update Doctor A's session**: FAIL ❌

**Code to verify** (`/src/app/api/doctor/sessions/[id]/route.ts:35-37`):
```typescript
if (existingSession.doctorId !== doctor.id) {
  return errorResponse('Forbidden', 403)
}
```
✅ This check IS present and correct.

---

### 6. Cart Items — `GET/DELETE /api/user/cart/[productId]`
**What to test**: Can User B delete items from User A's cart?

**Test steps**:
1. **User A**:
   - Add a product to cart (note product ID)
2. **User B**:
   - Try to delete: `DELETE /api/user/cart/<product-id>`
3. **Expected**: Cart is user-scoped, so User B has an empty cart. Deleting from own empty cart should succeed (200) but not affect User A's cart.
4. **If User B can see/delete User A's cart items**: FAIL ❌

**Note**: Cart endpoints typically don't need IDOR checks if they're user-scoped (delete own cart item), but verify they don't expose User A's cart to User B.

---

### 7. Assignments — `GET /api/user/assignments/[id]`
**What to test**: Can User B view User A's workshop/course assignments?

**Test steps**:
1. **User A**:
   - Enroll in a workshop, get the assignment ID
2. **User B**:
   - Try: `fetch('/api/user/assignments/assign_123').then(r => r.json()).then(d => console.log(d))`
3. **Expected**: 403 or 404
4. **If returns assignment details**: FAIL ❌

---

## Pass/Fail Criteria

| Endpoint | User A (Owner) | User B (Non-owner) | Status |
|----------|---|---|---|
| GET `/api/user/sessions/[id]` | 200 ✅ | 403 ❌ | ? |
| GET `/api/user/orders/[id]` | 200 ✅ | 403 ❌ | ? |
| GET `/api/user/payments/[id]` | 200 ✅ | 403 ❌ | ? |
| GET `/api/user/addresses/[id]` | 200 ✅ | 403 ❌ | ? |
| PATCH `/api/doctor/sessions/[id]` | 200 ✅ | 403 ❌ | ? |
| GET/DELETE `/api/user/cart/[productId]` | 200 ✅ | 200 (own cart) ✅ | ? |
| GET `/api/user/assignments/[id]` | 200 ✅ | 403 ❌ | ? |

**All must pass for deployment.**

---

## Reporting Template

If you find a vulnerability, create a GitHub issue with:

```
**Title**: IDOR in [endpoint name]

**Endpoint**: GET/POST/PATCH /api/...

**Steps to Reproduce**:
1. Create User A account
2. Create resource X, note ID
3. Create User B account
4. As User B, fetch User A's resource using ID
5. User B receives 200 with full resource data

**Expected**: 403 Forbidden
**Actual**: 200 OK, returns User A's data

**Impact**: User B can read/modify User A's [resource type]

**Fix**: Add ownership check before returning data
```

---

## Timing

- Run this checklist **before** any production deployment
- Expected time: ~15 minutes per endpoint (7 endpoints = ~2 hours total)
- Can be parallelized if multiple testers available
