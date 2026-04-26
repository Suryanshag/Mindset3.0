import { z } from 'zod'

export const createSlotSchema = z.object({
  dates: z.array(z.string().datetime()).min(1).max(100),
})
