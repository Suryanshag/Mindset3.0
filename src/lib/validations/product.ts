import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(10).max(5000),
  price: z.number().positive().max(1000000),
  stock: z.number().int().min(0),
  image: z.string().url().optional(),
  sku: z.string().max(100).optional(),
  weight: z.number().positive().max(100).optional(),
  isActive: z.boolean().default(true),
})
