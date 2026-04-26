import { NextResponse } from 'next/server'

export function handleArcjetDenial(decision: {
  isDenied: () => boolean
  reason: {
    isRateLimit: () => boolean
    isBot: () => boolean
    isShield: () => boolean
  }
}): NextResponse | null {
  if (!decision.isDenied()) return null

  if (decision.reason.isRateLimit()) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  if (decision.reason.isBot()) {
    return NextResponse.json(
      { success: false, error: 'Automated requests are not allowed.' },
      { status: 403 }
    )
  }

  return NextResponse.json(
    { success: false, error: 'Request blocked.' },
    { status: 403 }
  )
}
