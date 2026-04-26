import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email-service'
import crypto from 'crypto'
import { z } from 'zod'
import { authLimiter } from '@/lib/arcjet'
import { handleArcjetDenial } from '@/lib/arcjet-protect'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const decision = await authLimiter.protect(req)
    const denied = handleArcjetDenial(decision)
    if (denied) return denied

    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      // Return same message to prevent enumeration
      return NextResponse.json({
        success: true,
        message: 'If this email exists, you will receive a reset link shortly.',
      })
    }

    const { email } = parsed.data

    // Find user — but ALWAYS return same response
    // whether email exists or not (prevents enumeration)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, email: true },
    })

    if (user) {
      // Invalidate any existing unused tokens
      await prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: {
          expiresAt: new Date(),
        },
      })

      // Generate cryptographically secure token
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      })

      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

      // Non-blocking email send
      sendPasswordResetEmail(user.email, {
        userName: user.name ?? 'there',
        resetUrl,
        expiresInMinutes: 15,
      })

      console.log('[FORGOT_PASSWORD] Reset link sent to:', user.email)
    }

    // Always return same response
    return NextResponse.json({
      success: true,
      message: 'If this email exists, you will receive a reset link shortly.',
    })
  } catch (error) {
    console.error('[FORGOT_PASSWORD] Error:', error)
    // Even on error return same message
    return NextResponse.json({
      success: true,
      message: 'If this email exists, you will receive a reset link shortly.',
    })
  }
}
