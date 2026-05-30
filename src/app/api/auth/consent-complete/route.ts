import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { logAuthEvent } from '@/lib/auth-events'
import { CONSENT_VERSION } from '@/lib/consent'
import { z } from 'zod'

const consentSchema = z.object({
  privacyAccepted: z.literal(true),
  marketingConsent: z.boolean().optional(),
})

/**
 * Records DPDP consent for the currently-authenticated user. Designed for
 * the Google OAuth post-login gate (`/consent-gate`) — email signups
 * capture consent atomically inside /api/auth/register, so they never reach
 * this endpoint.
 *
 * Idempotent: if the user has already consented we return success without
 * a second write or audit event, so a duplicate submission (slow network +
 * second click) doesn't double-log.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 401)
    }

    const body = await req.json()
    const parsed = consentSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid consent submission', 400)
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { consentedAt: true },
    })
    if (!user) return errorResponse('User not found', 404)
    if (user.consentedAt) {
      // Already consented — no-op, but report success so the client UX
      // proceeds normally on a stale gate hit.
      return successResponse({ success: true, alreadyConsented: true })
    }

    const marketingConsent = parsed.data.marketingConsent ?? false
    const now = new Date()
    const consentIpAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      null
    const consentUserAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        consentedAt: now,
        consentVersion: CONSENT_VERSION,
        consentIpAddress,
        consentUserAgent,
        marketingConsent,
        marketingConsentAt: marketingConsent ? now : null,
      },
    })

    await logAuthEvent({
      userId: session.user.id,
      kind: 'CONSENT_GRANTED',
      request: req,
      metadata: { version: CONSENT_VERSION, marketingConsent, source: 'oauth-gate' },
    })

    return successResponse({ success: true })
  } catch (error) {
    console.error('[CONSENT_COMPLETE_ERROR]', error)
    return serverErrorResponse()
  }
}
