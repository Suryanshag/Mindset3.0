import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sensitiveActionLimiter, authLimiter } from '@/lib/arcjet'
import { handleArcjetDenial } from '@/lib/arcjet-protect'
import { logAuthEvent } from '@/lib/auth-events'
import { rejectIfBadOrigin } from '@/lib/origin-check'

const schema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .refine((p) => {
      const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/]
      return classes.filter((re) => re.test(p)).length >= 3
    }, 'Password must include 3 of: uppercase, lowercase, number, special character'),
})

export async function POST(req: NextRequest) {
  try {
    const originBlock = rejectIfBadOrigin(req)
    if (originBlock) return originBlock

    const decision = await sensitiveActionLimiter.protect(req)
    const denied = handleArcjetDenial(decision)
    if (denied) return denied

    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Invalid input'
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      )
    }

    const { token, password } = parsed.data

    // Find token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: { select: { id: true, email: true } },
      },
    })

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      )
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        { success: false, error: 'This reset link has already been used. Please request a new one.' },
        { status: 400 }
      )
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'This reset link has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update password + reset lockout state + mark token used in one transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ])

    await logAuthEvent({
      userId: resetToken.userId,
      kind: 'PASSWORD_RESET_COMPLETED',
      request: req,
    })

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully.',
    })
  } catch (error) {
    console.error('[RESET_PASSWORD] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

// GET — validate token (check if valid before showing form)
export async function GET(req: NextRequest) {
  const decision = await authLimiter.protect(req)
  const denied = handleArcjetDenial(decision)
  if (denied) return denied

  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'No token provided' },
      { status: 400 }
    )
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: { expiresAt: true, usedAt: true },
  })

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return NextResponse.json({
      success: false,
      error: 'Invalid or expired reset link.',
    })
  }

  return NextResponse.json({
    success: true,
    expiresAt: resetToken.expiresAt,
  })
}
