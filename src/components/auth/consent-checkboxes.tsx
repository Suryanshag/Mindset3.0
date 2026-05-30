'use client'

import Link from 'next/link'

interface ConsentCheckboxesProps {
  privacyAccepted: boolean
  marketingConsent: boolean
  onPrivacyChange: (value: boolean) => void
  onMarketingChange: (value: boolean) => void
  isSubmitting?: boolean
}

/**
 * Shared consent checkboxes — currently rendered by the Google-OAuth
 * consent-gate page only. The email signup pages (`/register`) keep their
 * own inlined checkboxes because they're wired through react-hook-form's
 * register() helper and have intentional mobile/desktop visual differences;
 * extracting them into this bare-props component would have required
 * unwinding both. Step-Zero of the consent-gate sprint flagged that
 * tradeoff explicitly.
 */
export function ConsentCheckboxes({
  privacyAccepted,
  marketingConsent,
  onPrivacyChange,
  onMarketingChange,
  isSubmitting = false,
}: ConsentCheckboxesProps) {
  return (
    <div className="space-y-4">
      <label className="flex items-start gap-3 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={privacyAccepted}
          onChange={(e) => onPrivacyChange(e.target.checked)}
          disabled={isSubmitting}
          className="mt-1 cursor-pointer"
          style={{ accentColor: 'var(--coral)' }}
          required
        />
        <span style={{ color: 'var(--navy)', opacity: 0.85 }}>
          I have read and accept the{' '}
          <Link
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--teal)', textDecoration: 'underline' }}
          >
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link
            href="/terms-of-use"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--teal)', textDecoration: 'underline' }}
          >
            Terms of Use
          </Link>
          , and I consent to Mindset processing my personal and
          mental-health-related data as described.
        </span>
      </label>

      <label className="flex items-start gap-3 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={marketingConsent}
          onChange={(e) => onMarketingChange(e.target.checked)}
          disabled={isSubmitting}
          className="mt-1 cursor-pointer"
          style={{ accentColor: 'var(--coral)' }}
        />
        <span style={{ color: 'var(--navy)', opacity: 0.85 }}>
          Send me occasional emails about workshops, wellness resources, and
          Mindset updates. (Optional &mdash; you can unsubscribe anytime.)
        </span>
      </label>
    </div>
  )
}

export default ConsentCheckboxes
