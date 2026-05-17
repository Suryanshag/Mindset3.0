/**
 * Centralized email sender + support contact config.
 *
 * Why this file exists:
 * - Single source for the `from` address used by every Resend send. If
 *   the env var is missing, we fall back to a *verified* production sender
 *   (NOT Resend's `onboarding@resend.dev` test sender, which only allows
 *   sending to the Resend account owner and produces 403 for anyone else).
 *   That fallback bug is what silently broke booking-confirmation delivery
 *   during the case 1 smoke runs.
 * - Single source for the support email rendered in every template footer.
 *   Templates previously referenced `support@mindset.com` (wrong domain).
 */

const FALLBACK_FROM = 'Mindset <hello@mindset.org.in>'

export const FROM_EMAIL: string = (() => {
  // FROM_EMAIL is only ever used server-side (inside resend.emails.send).
  // process.env.RESEND_FROM_EMAIL is not inlined into the client bundle, so
  // skip the env check entirely on the client — otherwise SUPPORT_EMAIL +
  // APP_BASE_URL importers in client components would trigger spurious
  // console.warn lines on every page load.
  if (typeof window !== 'undefined') return FALLBACK_FROM
  const env = process.env.RESEND_FROM_EMAIL
  if (!env) {
    console.warn('[EMAIL] RESEND_FROM_EMAIL not set — using fallback:', FALLBACK_FROM)
    return FALLBACK_FROM
  }
  // Hard refuse Resend's test sender — it 403s every recipient that isn't
  // the Resend account owner. That value shipped silently for ~24h after
  // the Workshops-Paid sprint until the hotfix investigation caught it
  // (see docs/workshops-paid-hotfix-investigation.md). If someone re-sets
  // the env to the test sender, fall back to the verified production
  // sender and shout in the logs so the next deploy's first log line
  // makes the misconfiguration obvious.
  if (env.toLowerCase().includes('onboarding@resend.dev')) {
    console.error(
      "[EMAIL] RESEND_FROM_EMAIL is set to Resend's test sender " +
        '(onboarding@resend.dev). This 403s any recipient other than ' +
        'the Resend account owner. Forcing fallback to ' + FALLBACK_FROM
    )
    return FALLBACK_FROM
  }
  return env
})()

export const SUPPORT_EMAIL = 'hello@mindset.org.in'

/**
 * Canonical app base URL used inside server-rendered email bodies.
 * Falls back to production so we never render `undefined/...` links.
 */
export const APP_BASE_URL: string =
  process.env.NEXT_PUBLIC_APP_URL || 'https://mindset.org.in'
