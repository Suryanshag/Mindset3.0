import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { registerApiSchema } from '@/lib/validations/auth'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import bcrypt from 'bcryptjs'
import { sendWelcomeEmail } from '@/lib/email-service'
import { authLimiter } from '@/lib/arcjet'
import { handleArcjetDenial } from '@/lib/arcjet-protect'

export async function POST(req: NextRequest) {
  try {
    const decision = await authLimiter.protect(req)
    const denied = handleArcjetDenial(decision)
    if (denied) return denied

    const body = await req.json()

    const parsed = registerApiSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const { name, email, phone, password } = parsed.data

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true },
    })

    if (existing) {
      return errorResponse('An account with this email already exists', 409)
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone,
        password: hashedPassword,
        role: 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    })

    // Send welcome email (non-blocking)
    try {
      sendWelcomeEmail(user.email, { userName: user.name })
    } catch (err) {
      console.error('[REGISTER] Welcome email failed:', err)
    }

    return successResponse(user, 201)
  } catch (error) {
    console.error('[REGISTER_ERROR]', error)
    return serverErrorResponse()
  }
}
