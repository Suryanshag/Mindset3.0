import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { authLimiter } from '@/lib/arcjet'
import { handleArcjetDenial } from '@/lib/arcjet-protect'

const schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  const decision = await authLimiter.protect(req)
  const denied = handleArcjetDenial(decision)
  if (denied) return denied

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ locked: false })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    // Don't enumerate — same shape as not-locked.
    return NextResponse.json({ locked: false })
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase().trim() },
    select: { lockedUntil: true },
  })

  if (!user?.lockedUntil || user.lockedUntil <= new Date()) {
    return NextResponse.json({ locked: false })
  }

  return NextResponse.json({
    locked: true,
    until: user.lockedUntil.toISOString(),
  })
}
