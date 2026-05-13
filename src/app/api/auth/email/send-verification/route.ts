import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendEmailVerificationEmail } from '@/lib/email-service'
import { sensitiveActionLimiter } from '@/lib/arcjet'
import { handleArcjetDenial } from '@/lib/arcjet-protect'
import { logAuthEvent } from '@/lib/auth-events'
import { rejectIfBadOrigin } from '@/lib/origin-check'

const EXPIRES_HOURS = 24

export async function POST(req: NextRequest) {
  const originBlock = rejectIfBadOrigin(req)
  if (originBlock) return originBlock

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const decision = await sensitiveActionLimiter.protect(req)
  const denied = handleArcjetDenial(decision)
  if (denied) return denied

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, emailVerified: true },
  })
  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
  }

  // Already verified — return success without sending.
  if (user.emailVerified) {
    return NextResponse.json({ success: true, alreadyVerified: true })
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + EXPIRES_HOURS * 60 * 60 * 1000)

  // Invalidate prior unused tokens
  await prisma.emailVerificationToken.updateMany({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { expiresAt: new Date() },
  })
  await prisma.emailVerificationToken.create({
    data: { userId: user.id, token, expiresAt },
  })

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`

  sendEmailVerificationEmail(user.email, {
    userName: user.name ?? 'there',
    verifyUrl,
    expiresInHours: EXPIRES_HOURS,
  })

  await logAuthEvent({
    userId: user.id,
    kind: 'EMAIL_VERIFICATION_SENT',
    request: req,
  })

  return NextResponse.json({ success: true })
}
