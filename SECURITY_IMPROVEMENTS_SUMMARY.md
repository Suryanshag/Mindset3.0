# Security Improvements — Summary & Verification

This document summarizes all security hardening work completed on the Mindset platform (2026-05-30).

---

## 🎯 Overview

Three major security categories addressed:
1. **IDOR Prevention** — Insecure Direct Object Reference testing guide
2. **Input Validation** — Enum filter validation in admin routes  
3. **File Upload Hardening** — Server-signed uploads + client validation

---

## ✅ What Was Implemented

### 1. IDOR Testing Guide

**File**: `IDOR_TEST_CHECKLIST.md`

A manual testing guide for verifying that users cannot access resources owned by other users.

**Includes**:
- 7 endpoints to test (sessions, orders, payments, addresses, assignments, etc.)
- Step-by-step procedures for each endpoint
- Expected vs. actual response validation
- Reporting template for any vulnerabilities found

**Action**: Follow this checklist before production deployment.

---

### 2. Enum Filter Validation (FIXED)

**Files Modified**:
- `src/app/api/admin/payments/route.ts`
- `src/app/api/admin/orders/route.ts`

**What was fixed**:
- Changed from unsafe type casting (`as Prisma.EnumPaymentStatusFilter`) to explicit Zod schema validation
- Invalid query parameters are now rejected at the route level instead of passing to Prisma
- Prevents potential information disclosure from database errors

**New File**:
- `src/lib/validations/enums.ts` — centralized enum schemas + `parseEnumParam()` utility

**Example usage**:
```typescript
import { parseEnumParam, paymentStatusSchema } from '@/lib/validations/enums'

const status = parseEnumParam(url.get('status'), paymentStatusSchema)
// status is now safely typed and validated, or undefined
```

---

### 3. Email Verification Enforcement (FIXED)

**File Modified**: `src/app/api/payments/create-order/route.ts`

**What was fixed**:
- Added explicit email verification check before payment creation
- Users without verified emails now get a clear 403 error with message
- Defense-in-depth: complements the implicit requirement during session booking

**Code**:
```typescript
const user = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { emailVerified: true },
})
if (!user?.emailVerified) {
  return errorResponse('Please verify your email to make payments', 403)
}
```

---

### 4. File Upload Hardening (IMPLEMENTED)

#### 4a. File Validation Helper

**File**: `src/lib/file-upload-validation.ts` (NEW)

Centralized validation with clear error messages:
- **Images**: JPEG, PNG, WebP only | max 5 MB
- **Documents**: PDF only | max 10 MB

**Usage**:
```typescript
const validation = validateFileUpload(file, 'images')
if (!validation.valid) {
  return { error: validation.error }
}
```

#### 4b. Server-Signed Cloudinary Uploads

**File**: `src/lib/cloudinary-upload.ts` (REFACTORED)

**Key improvements**:
1. `generateCloudinaryUploadSignature()` — creates HMAC-SHA256 signed tokens (server-side only)
2. Upload constraints enforced by Cloudinary signature:
   - `allowed_formats: 'jpg,png,webp'`
   - `max_file_size: 5242880` (5 MB)
   - `folder: 'mindset/{userId}'` (user-scoped)
3. Client cannot tamper with upload parameters (signature validates them)

**Security benefit**:
- Clients cannot upload files > 5 MB
- Clients cannot upload non-image files
- Clients cannot upload to other users' folders
- All constraints enforced at Cloudinary level, not client-level

#### 4c. Signed Upload API Route

**File**: `src/app/api/uploads/sign/route.ts` (NEW)

- Requires authentication
- Rate-limited via Arcjet
- Returns signed token scoped to authenticated user
- Called from client before uploading to Cloudinary

**How it works**:
```
Client: GET /api/uploads/sign
Server: Return { signature, timestamp, apiKey, cloudName }
Client: POST to Cloudinary with signed token
Cloudinary: Validate signature, enforce constraints
```

#### 4d. Client-Side File Validation

**Files Updated**:
- `src/app/(dashboard)/doctor/profile/page.tsx` (EXAMPLE)

**Pattern** (replicate in other upload forms):
```typescript
const validation = validateFileUpload(file, 'images')
if (!validation.valid) {
  setMessage(validation.error) // Show user-friendly error
  return
}
const url = await uploadToCloudinary(file)
```

#### 4e. Server-Side Avatar Upload

**File**: `src/lib/actions/upload-avatar.ts` (UPDATED)

- Uses `validateFileUpload()` helper
- Already server-side via Server Action (already secure)
- Better error messages with new validation

---

## 📋 Verification Checklist

### Before Testing
- [ ] Pull latest code
- [ ] Install dependencies: `npm install`
- [ ] Create `.env.local` with all required variables (see below)
- [ ] Database is seeded with test data

### Security Fixes
- [ ] Enum validation: Try `GET /api/admin/payments?status=INVALID_VALUE` (should get error)
- [ ] Email verification: Register account, don't verify email, try to pay for a session (should get 403)
- [ ] IDOR: Follow `IDOR_TEST_CHECKLIST.md` (7 endpoints)

### File Uploads
- [ ] Try uploading `.gif` file to doctor profile → should show validation error
- [ ] Try uploading `.txt` file → should show validation error
- [ ] Upload valid `.png` file → should succeed
- [ ] Check Cloudinary dashboard → file should be in `mindset/{userId}/` folder
- [ ] Try with file > 5 MB → Cloudinary should reject it

### Integration Test
1. Register User A and User B (separate browsers/incognito)
2. User A: Book a therapy session
3. User A: Go to payments and initiate payment (should work)
4. User B: Try to view User A's session ID via API → should get 403/404

### Production Ready?
- [ ] All TypeScript errors resolved (npm run build succeeds)
- [ ] No console.error() with sensitive data
- [ ] Environment variables set correctly
- [ ] Rate limiting working (test with rapid requests)
- [ ] Email verification is enforced (test unverified account)

---

## 🔑 Required Environment Variables

```bash
# Cloudinary (for secure image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret       # SERVER ONLY

# Razorpay (payment verification)
RAZORPAY_KEY_ID=your-public-key
RAZORPAY_KEY_SECRET=your-secret-key         # SERVER ONLY
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# NextAuth
NEXTAUTH_SECRET=<strong-random-string>      # Generate: openssl rand -base64 33
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret

# Cron jobs
CRON_SECRET=<strong-random-string>          # Min 32 chars

# Optional
OPENROUTER_API_KEY=api-key
RECAPTCHA_SECRET_KEY=secret                 # SERVER ONLY
```

---

## 📁 Files Changed

| File | Type | Change |
|------|------|--------|
| `IDOR_TEST_CHECKLIST.md` | NEW | Manual testing guide |
| `SECURITY_HARDENING_GUIDE.md` | NEW | Complete hardening reference |
| `src/lib/validations/enums.ts` | NEW | Enum validation schemas |
| `src/lib/file-upload-validation.ts` | NEW | File upload validation helper |
| `src/app/api/uploads/sign/route.ts` | NEW | Signed upload token endpoint |
| `src/app/api/admin/payments/route.ts` | MODIFIED | Safe enum parsing |
| `src/app/api/admin/orders/route.ts` | MODIFIED | Safe enum parsing |
| `src/app/api/payments/create-order/route.ts` | MODIFIED | Email verification check |
| `src/lib/cloudinary-upload.ts` | REFACTORED | Server-signed uploads |
| `src/lib/actions/upload-avatar.ts` | UPDATED | Uses validation helper |
| `src/app/(dashboard)/doctor/profile/page.tsx` | UPDATED | Client-side validation example |

---

## 🚀 Next Steps

1. **Run verification checklist** (above)
2. **Execute IDOR tests** (`IDOR_TEST_CHECKLIST.md`)
3. **Update remaining upload forms** — add `validateFileUpload()` to:
   - Doctor assignments
   - Admin workshops (create/edit)
   - Admin products (create/edit)
   - Admin study materials (create/edit)
   - User assignments

   Use the doctor profile example as a template.

4. **Production deployment**:
   - Ensure all env vars are set correctly
   - Run `npm run build` (should succeed)
   - All tests pass
   - IDOR tests completed with no vulnerabilities

---

## 📚 Reference

- `IDOR_TEST_CHECKLIST.md` — Manual endpoint testing
- `SECURITY_HARDENING_GUIDE.md` — Detailed guide with examples
- [OWASP IDOR](https://owasp.org/www-community/attacks/Insecure_Direct_Object_Reference_(IDOR))
- [File Upload Security](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)

---

## Questions?

Refer to the detailed guides:
- **IDOR vulnerabilities** → `IDOR_TEST_CHECKLIST.md`
- **Implementation details** → `SECURITY_HARDENING_GUIDE.md`
- **File upload patterns** → See `src/app/(dashboard)/doctor/profile/page.tsx` for example
