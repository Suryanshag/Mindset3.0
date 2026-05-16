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
  const env = process.env.RESEND_FROM_EMAIL
  if (!env) {
    console.warn('[EMAIL] RESEND_FROM_EMAIL not set — using fallback:', FALLBACK_FROM)
    return FALLBACK_FROM
  }
  return env
})()

export const SUPPORT_EMAIL = 'hello@mindset.org.in'
