import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { authLimiter } from '@/lib/arcjet'
import { handleArcjetDenial } from '@/lib/arcjet-protect'
import { logAuthEvent } from '@/lib/auth-events'
import { rejectIfBadOrigin } from '@/lib/origin-check'

const schema = z.object({ token: z.string().min(8) })

export async function POST(req: NextRequest) {
  const originBlock = rejectIfBadOrigin(req)
  if (originBlock) return originBlock

  const decision = await authLimiter.protect(req)
  const denied = handleArcjetDenial(decision)
  if (denied) return denied

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 400 })
  }

  const record = await prisma.emailVerificationToken.findUnique({
    where: { token: parsed.data.token },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  })

  if (!record) {
    return NextResponse.json(
      { success: false, error: 'invalid', message: 'This verification link is invalid.' },
      { status: 400 }
    )
  }
  if (record.usedAt) {
    return NextResponse.json(
      { success: false, error: 'used', message: 'This link has already been used.' },
      { status: 400 }
    )
  }
  if (record.expiresAt < new Date()) {
    return NextResponse.json(
      { success: false, error: 'expired', message: 'This verification link has expired.' },
      { status: 400 }
    )
  }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
  ])

  await logAuthEvent({
    userId: record.userId,
    kind: 'EMAIL_VERIFIED',
    request: req,
  })

  return NextResponse.json({ success: true })
}
