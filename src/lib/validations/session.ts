import { z } from 'zod'

export const bookSessionSchema = z.object({
  doctorId: z.string().cuid(),
  slotId: z.string().cuid(),
})

export const updateSessionSchema = z.object({
  status: z.enum(['CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().max(5000).optional(),
  meetLink: z.string().url().optional(),
})
