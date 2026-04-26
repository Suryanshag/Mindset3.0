import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const createDoctorSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  password: z
    .string()
    .min(8)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password must include uppercase, lowercase, number, and special character'
    ),
  designation: z.string().min(2).max(100),
  type: z.enum(['COUNSELOR', 'PSYCHOLOGIST']),
  specialization: z.string().min(2).max(200),
  qualification: z.string().min(2).max(200),
  experience: z.number().int().min(0).max(60),
  bio: z.string().min(10).max(2000),
  sessionPrice: z.number().positive().max(100000),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const body = await req.json()

    const parsed = createDoctorSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const {
      name, email, phone, password, designation,
      type, specialization, qualification,
      experience, bio, sessionPrice, slug,
    } = parsed.data

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true },
    })
    if (existingUser) {
      return errorResponse('A user with this email already exists', 409)
    }

    const existingSlug = await prisma.doctor.findUnique({
      where: { slug },
      select: { id: true },
    })
    if (existingSlug) {
      return errorResponse('This slug is already taken. Choose a different one.', 409)
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone,
          password: hashedPassword,
          role: 'DOCTOR',
        },
        select: { id: true, name: true, email: true },
      })

      const doctor = await tx.doctor.create({
        data: {
          userId: user.id,
          slug,
          designation,
          type,
          specialization,
          qualification,
          experience,
          bio,
          sessionPrice,
        },
        select: {
          id: true,
          slug: true,
          designation: true,
          type: true,
          specialization: true,
          experience: true,
          sessionPrice: true,
        },
      })

      return { user, doctor }
    })

    return successResponse(result, 201)
  } catch (error) {
    console.error('[CREATE_DOCTOR_ERROR]', error)
    return serverErrorResponse()
  }
}
