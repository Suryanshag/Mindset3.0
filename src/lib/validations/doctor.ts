import { z } from 'zod'

const panSchema = z
  .string()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, 'Invalid PAN format (e.g. ABCDE1234F)')
  .optional()
  .or(z.literal(''))

const upiSchema = z
  .string()
  .regex(/^[\w.\-]+@[\w.\-]+$/, 'Invalid UPI ID format')
  .max(100)
  .optional()
  .or(z.literal(''))

const payoutFullNameSchema = z
  .string()
  .min(2)
  .max(100)
  .optional()
  .or(z.literal(''))

export const updateDoctorProfileSchema = z.object({
  designation: z.string().min(2).max(100).optional(),
  specialization: z.string().min(2).max(200).optional(),
  qualification: z.string().min(2).max(200).optional(),
  experience: z.number().int().min(0).max(60).optional(),
  bio: z.string().min(10).max(2000).optional(),
  sessionPrice: z.number().positive().max(100000).optional(),
  photo: z.string().url().optional(),
  panNumber: panSchema,
  upiId: upiSchema,
  payoutFullName: payoutFullNameSchema,
})

export const createLeaveSchema = z.object({
  startDate: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid start date'),
  endDate: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid end date'),
  reason: z.string().max(500).optional(),
})

export const adminUpdateDoctorSchema = z.object({
  designation: z.string().min(2).max(100).optional(),
  type: z.enum(['COUNSELOR', 'PSYCHOLOGIST']).optional(),
  specialization: z.string().min(2).max(200).optional(),
  qualification: z.string().min(2).max(200).optional(),
  experience: z.number().int().min(0).max(60).optional(),
  bio: z.string().min(10).max(2000).optional(),
  sessionPrice: z.number().positive().max(100000).optional(),
  isActive: z.boolean().optional(),
  photo: z.string().url().optional(),
  panNumber: panSchema,
  upiId: upiSchema,
  payoutFullName: payoutFullNameSchema,
  // License & credentialing. `licenseNumber`/`licenseType` are admin-editable
  // free-form fields. `licenseVerified` is an action flag — true = mark
  // verified, false = clear verification. The PATCH handler resolves the
  // verifier id from the session (never trusts a client-supplied id).
  licenseNumber: z.string().max(50).optional().or(z.literal('')),
  licenseType: z
    .enum(['RCI', 'MCI', 'State Medical Council', 'Other'])
    .optional()
    .or(z.literal('')),
  licenseVerified: z.boolean().optional(),
})
