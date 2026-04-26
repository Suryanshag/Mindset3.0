import { z } from 'zod'

export const ngoJoinSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  city: z.string().min(2).max(100),
  age: z.number().int().min(13).max(100),
  interest: z.string().min(10).max(1000),
})

export const createNgoVisitSchema = z.object({
  ngoName: z.string().min(2).max(200),
  location: z.string().min(2).max(200),
  description: z.string().min(10).max(5000),
  photos: z.array(z.string().url()).default([]),
  visitDate: z.string().datetime(),
  isPublished: z.boolean().default(false),
})
