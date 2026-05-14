import type { NextRequest } from 'next/server'

/**
 * Resolve the app's public base URL for building absolute links inside
 * transactional emails (verify-email, reset-password, etc).
 *
 * Order of preference:
 *   1. The incoming request's own origin — most accurate, reflects the actual
 *      host the user is on (works for preview deployments, custom domains,
 *      proxies behind correct x-forwarded-host).
 *   2. `process.env.NEXT_PUBLIC_APP_URL` — explicit override.
 *   3. Hard-coded production URL as a last resort, with a console warning so
 *      misconfiguration surfaces in Vercel logs.
 *
 * Always returns a value with no trailing slash.
 */
export function getAppBaseUrl(req?: Request | NextRequest): string {
  if (req) {
    try {
      // NextRequest exposes nextUrl; fall back to URL(req.url) for plain Request.
      const url = (req as NextRequest).nextUrl ?? new URL(req.url)
      const forwardedHost = req.headers.get('x-forwarded-host')
      const forwardedProto = req.headers.get('x-forwarded-proto')
      const host = forwardedHost ?? url.host
      const proto = forwardedProto ?? url.protocol.replace(':', '')
      if (host) return `${proto}://${host}`.replace(/\/$/, '')
    } catch {
      // fall through
    }
  }
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (envUrl) return envUrl.replace(/\/$/, '')

  console.warn(
    '[APP_URL] NEXT_PUBLIC_APP_URL is not set and no request available. ' +
      'Transactional email links will fall back to the hard-coded production URL.'
  )
  return 'https://mindset-ten.vercel.app'
}
