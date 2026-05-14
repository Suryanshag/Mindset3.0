import { z } from 'zod'

export const createPresenterSchema = z.object({
  name: z.string().min(2).max(120),
  title: z.string().min(2).max(200),
  tier: z.enum(['PROFESSIONAL', 'ASSOCIATE']),
  bio: z.string().max(2000).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  upi: z.string().max(100).optional(),
  pan: z.string().max(20).optional(),
  bankAccount: z.string().max(50).optional(),
  ifsc: z.string().max(20).optional(),
})
