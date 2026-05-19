# Bug 3 — Profile save returns success but doesn't update DB

**Status:** Root cause confirmed. Fix direction needs Suryansh's call before code change.
**Investigated:** 2026-05-19
**Repro:** Edit `/user/profile/personal`, blank the phone field, click Save → "Saved successfully" toast, but refresh shows the old phone back.

---

## Tl;dr

This is a **client-side bug** that interacts with **a permissive server contract**. The page deliberately strips empty fields from the PATCH body, so blanking a field tells the server "don't touch this" instead of "clear it." The server faithfully obeys, returns success, and the old value survives.

The same bug applies to four fields: `phone`, `dateOfBirth`, `preferredLanguage`, `emergencyContact`. The only field you *can* blank is `name`, and only because it accidentally has the opposite bug (unconditional send → would let you save an empty string if zod let you, which it doesn't because of `min(2)`).

---

## Trace

### 1. Form (`src/app/(dashboard)/user/profile/personal/page.tsx:50-75`)

```typescript
function handleSave() {
  setError(null)
  setSuccess(false)
  startSave(async () => {
    try {
      const body: Record<string, unknown> = { name: form.name }
      if (form.phone) body.phone = form.phone               // ← bug: empty string is falsy
      if (form.dateOfBirth) body.dateOfBirth = form.dateOfBirth
      if (form.preferredLanguage) body.preferredLanguage = form.preferredLanguage
      if (form.emergencyContact) body.emergencyContact = form.emergencyContact

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        // ...
        body: JSON.stringify(body),
      })
```

Every `if (form.X) body.X = form.X` line silently drops the field when the user clears it. The intent was probably "don't send unchanged fields," but the implementation can't tell the difference between "I didn't touch this" and "I just blanked this."

### 2. Endpoint (`src/app/api/user/profile/route.ts:35-67`)

```typescript
export async function PATCH(req: Request) {
  // ...
  const body = await req.json()
  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? 'Validation failed', 400)
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    // ...
  })
```

The endpoint does call `prisma.user.update` — there's no stub. But with `data: parsed.data`, if `phone` isn't in `parsed.data`, Prisma writes only the keys that *are* present. The DB column is preserved. Update succeeds. Response is `success: true`. The UI's `setSuccess(true)` fires.

### 3. Zod schema (`src/lib/validations/user.ts:1-10`)

```typescript
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number').optional(),
  address: z.string().max(500).optional(),
  dateOfBirth: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
  preferredLanguage: z.string().max(50).optional(),
  emergencyContact: z.string().max(100).optional(),
})
```

`optional()` means *the key can be absent* — it does NOT mean *empty string is allowed*. So even if the client did send `phone: ''`, the regex would reject it and the endpoint would return a 400, not a clear. We'd surface the validation error in the UI's `error` state.

So both layers conspire: client doesn't send empty, server wouldn't accept it if it did. Either way, no clear is possible.

### 4. Single source of truth — no model confusion

The page reads `User.phone` (line 17, GET handler `select: { phone: true }`). The form is wired to that same row's `phone` column. There's no second "phone" elsewhere (no Patient model; the schema only has `User.phone` and `NgoJoinRequest.phone`, and the form doesn't touch the NGO row). So this isn't a "form writes one place, page reads another" problem — both are pointed at `User.phone`. The data just never gets written.

---

## Why no Vercel logs were inspected

Reading the code is conclusive — the bug is on the page that sends the request, not on the endpoint that receives it. The page's `if (form.phone)` check is the smoking gun. Adding a `console.log` would just confirm what the four-line stanza already says: when the user clears phone, the body PATCHed is `{name: '...'}` with no phone key.

---

## Decision needed from Suryansh before I fix

The fix shape depends on a policy call: **should users be able to clear their phone number at all?**

### Option A — Allow clearing (recommended for UX)

User can remove phone (and dateOfBirth, preferredLanguage, emergencyContact). The NGO `INCOMPLETE_PROFILE` flow we just shipped would correctly prompt for it again at registration time. Phone is operationally useful (session reminders, NGO confirmation) but not legally mandated for an account to exist.

Implementation:
- Frontend: always send all fields. Empty string → empty string.
- Zod: accept empty string as "clear this." For phone: `z.union([z.literal(''), z.string().regex(/^[6-9]\d{9}$/)])`. For free-text fields: drop the `.optional()` (or keep it) and let empty strings through.
- Prisma write: transform empty strings to `null` before the update (since the columns are nullable on the schema).

About 15 lines changed across page + schema + endpoint. No DB migration.

### Option B — Phone is required after first set (sticky required)

Once a user sets phone, they can't clear it (only change it). Other fields stay clearable.

Implementation:
- Frontend: send all fields except phone.
- Phone clearing in UI is disabled with a tooltip ("required for booking confirmations — contact support to update").
- Zod stays.

About 5 lines. More restrictive, easier to defend if phone-based ops ever depend on it.

### Option C — Soft launch fix only

Just match user expectation: the "Saved" toast lies. At minimum, when the user clears a field that the current code silently drops, show "Some fields could not be saved" instead of green-checkmark success.

About 3 lines. Doesn't fix the underlying behaviour, just the lie. Not recommended — kicks the can.

---

## Recommendation

**Option A.** It matches the user's mental model ("the field is empty, so save empty"), it's consistent with the NGO INCOMPLETE_PROFILE flow that already handles missing-phone gracefully, and it's the same amount of work as Option B once you account for the tooltip + disabled-state UX.

If Suryansh prefers B for soft-launch caution, I can ship that and a follow-up sprint can relax it.

## Action items (post-decision)

If Option A:
- [ ] `src/app/(dashboard)/user/profile/personal/page.tsx` — replace the four conditional appends with unconditional sends.
- [ ] `src/lib/validations/user.ts` — allow `''` for phone (union or refinement). Free-text fields are already permissive enough; just verify.
- [ ] `src/app/api/user/profile/route.ts` — coerce `''` → `null` for nullable columns before the Prisma write.

If Option B:
- [ ] Same form file: leave phone out of the unconditional list; unconditional for the rest.
- [ ] Disable the phone field's clear-to-empty path in the UI.
