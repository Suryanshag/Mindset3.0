import { NextResponse } from 'next/server'

/**
 * Reject requests whose Origin header doesn't match the app's public URL.
 * NextAuth v5 requires Origin matching for cross-site protection on state-changing
 * endpoints; we apply the same to our hand-rolled auth APIs.
 *
 * Returns a 403 response on mismatch; null if the request passes.
 */
export function rejectIfBadOrigin(req: Request): NextResponse | null {
  const origin = req.headers.get('origin')
  // Same-origin form submissions or curl/server-to-server calls have no Origin.
  // We only enforce when an Origin is sent (browser cross-site protection).
  if (!origin) return null

  const expected = process.env.NEXT_PUBLIC_APP_URL
  if (!expected) return null

  try {
    const a = new URL(origin)
    const b = new URL(expected)
    if (a.origin !== b.origin) {
      return NextResponse.json(
        { success: false, error: 'Cross-origin request refused.' },
        { status: 403 }
      )
    }
    return null
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid origin.' },
      { status: 403 }
    )
  }
}
