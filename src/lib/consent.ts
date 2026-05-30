/**
 * DPDP consent — single source of truth.
 *
 * `CONSENT_VERSION` is the effective date of the privacy policy the user
 * accepted. Bump it whenever the policy materially changes; any user whose
 * stored `consentVersion` no longer matches this value can be detected and
 * re-prompted.
 *
 * Consumers:
 *   - /api/auth/register (email signup)
 *   - /api/auth/consent-complete (Google OAuth post-login gate)
 *   - …any future surface that captures or compares consent versions.
 */
export const CONSENT_VERSION = '2026-05-30'
