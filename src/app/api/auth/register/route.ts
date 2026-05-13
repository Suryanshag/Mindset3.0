import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { registerApiSchema } from '@/lib/validations/auth'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import bcrypt from 'bcryptjs'
import { sendWelcomeEmail, sendEmailVerificationEmail } from '@/lib/email-service'
import { authLimiter } from '@/lib/arcjet'
import { handleArcjetDenial } from '@/lib/arcjet-protect'
import { logAuthEvent } from '@/lib/auth-events'
import crypto from 'crypto'

function normalisePhone(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const digits = raw.replace(/\s|-/g, '').replace(/^\+?91/, '')
  return digits.length === 10 ? digits : undefined
}

export async function POST(req: NextRequest) {
  try {
    const decision = await authLimiter.protect(req)
    const denied = handleArcjetDenial(decision)
    if (denied) return denied

    const body = await req.json()

    // Honeypot: a non-empty website_url means a bot filled the hidden field.
    // Return a fake success without creating anything.
    if (typeof body?.website_url === 'string' && body.website_url.trim().length > 0) {
      await logAuthEvent({
        kind: 'REGISTER_FAILED',
        request: req,
        metadata: { reason: 'honeypot' },
      })
      return successResponse({ id: 'honeypot', email: '', name: '', phone: null, role: 'USER', createdAt: new Date() }, 201)
    }

    const parsed = registerApiSchema.safeParse(body)
    if (!parsed.success) {
      await logAuthEvent({
        kind: 'REGISTER_FAILED',
        request: req,
        metadata: { reason: 'validation' },
      })
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const { name, email, phone, password } = parsed.data

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true },
    })

    if (existing) {
      await logAuthEvent({
        kind: 'REGISTER_FAILED',
        request: req,
        metadata: { reason: 'email_exists' },
      })
      return errorResponse('An account with this email already exists', 409)
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: normalisePhone(phone),
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

    // Fire-and-forget: create verification token + send email
    try {
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
      await prisma.emailVerificationToken.create({
        data: { userId: user.id, token, expiresAt },
      })
      sendEmailVerificationEmail(user.email, {
        userName: user.name,
        verifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`,
        expiresInHours: 24,
      })
      await logAuthEvent({ userId: user.id, kind: 'EMAIL_VERIFICATION_SENT', request: req })
    } catch (err) {
      console.error('[REGISTER] verification email setup failed:', err)
    }

    await logAuthEvent({
      userId: user.id,
      kind: 'REGISTER_SUCCESS',
      request: req,
    })

    return successResponse(user, 201)
  } catch (error) {
    console.error('[REGISTER_ERROR]', error)
    return serverErrorResponse()
  }
}
