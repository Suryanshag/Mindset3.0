import { z } from 'zod'

export const createStudyMaterialSchema = z.object({
  title: z.string().min(2).max(200),
  type: z.enum(['FREE', 'PAID']),
  price: z.number().positive().optional(),
  fileUrl: z.string().url(),
  coverImage: z.string().url().optional(),
  isPublished: z.boolean().default(false),
}).refine(
  (data) => data.type === 'FREE' || (data.type === 'PAID' && data.price !== undefined),
  { message: 'Price is required for paid materials', path: ['price'] }
)
