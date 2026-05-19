import { z } from 'zod'

// Profile-edit semantics (post-2026-05-19, Bug 3 fix):
// - Optional fields absent from the body are left untouched.
// - Empty strings on dateOfBirth / preferredLanguage / emergencyContact are
//   treated as "clear this field" and persisted as NULL.
// - Phone has no empty-string branch here on purpose: clearing phone is
//   blocked at the client (see /user/profile/personal/page.tsx). Anything
//   sent to the server still has to satisfy the regex.
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number').optional(),
  address: z.string().max(500).optional(),
  dateOfBirth: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : v === '' ? null : undefined)),
  preferredLanguage: z
    .string()
    .max(50)
    .optional()
    .transform((v) => (v === '' ? null : v)),
  emergencyContact: z
    .string()
    .max(100)
    .optional()
    .transform((v) => (v === '' ? null : v)),
})
