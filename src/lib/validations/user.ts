import { z } from 'zod'

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number').optional(),
  address: z.string().max(500).optional(),
  dateOfBirth: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
  preferredLanguage: z.string().max(50).optional(),
  emergencyContact: z.string().max(100).optional(),
})
