import { z } from 'zod'

export const updateDoctorProfileSchema = z.object({
  designation: z.string().min(2).max(100).optional(),
  specialization: z.string().min(2).max(200).optional(),
  qualification: z.string().min(2).max(200).optional(),
  experience: z.number().int().min(0).max(60).optional(),
  bio: z.string().min(10).max(2000).optional(),
  sessionPrice: z.number().positive().max(100000).optional(),
  photo: z.string().url().optional(),
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
})
