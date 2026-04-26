import { z } from 'zod'

export const submitAssignmentSchema = z.object({
  submissionUrl: z.string().url('Invalid file URL'),
})

export const createAssignmentSchema = z.object({
  userId: z.string().cuid(),
  title: z.string().min(2).max(200),
  type: z
    .enum(['JOURNAL_PROMPT', 'READING', 'WORKSHEET', 'BREATHING', 'CUSTOM'])
    .default('CUSTOM'),
  description: z.string().max(2000).optional(),
  instructions: z.string().max(5000).optional(),
  fileUrl: z.string().url().optional(),
  dueDate: z.string().datetime().optional(),
})
