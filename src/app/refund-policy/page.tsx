import type { Metadata } from 'next'
import { LegalLayout } from '@/components/legal/legal-layout'

export const metadata: Metadata = {
  title: 'Refund Policy',
  description:
    'Cancellation and refund terms for therapy sessions, workshops, and products on Mindset.',
  alternates: { canonical: '/refund-policy' },
}

export default function RefundPolicyPage() {
  return (
    <LegalLayout title="Refund Policy" effectiveDate="May 19, 2026">
      <p>
        This page explains how cancellations and refunds work on Mindset across each of our
        services. The Privacy Policy and <a href="/terms-of-use">Terms of Use</a> are
        incorporated into these refund terms by reference.
      </p>

      <h2>Therapy Sessions</h2>
      <ul>
        <li>
          <strong>Free cancellation</strong> up to 24 hours before the session start time. Full
          refund processed within 5&ndash;7 business days.
        </li>
        <li>
          <strong>Within 24 hours of the session</strong>: 50% refund. The other 50%
          compensates the therapist&apos;s reserved time.
        </li>
        <li>
          <strong>No-show without notice</strong>: No refund.
        </li>
        <li>
          <strong>Cancellation by Mindset or the therapist</strong>: 100% refund, regardless of
          timing.
        </li>
      </ul>

      <h2>Workshops</h2>
      <ul>
        <li>
          <strong>Free cancellation</strong> up to 48 hours before the workshop start time.
          Full refund processed within 5&ndash;7 business days.
        </li>
        <li>
          <strong>Within 48 hours of the workshop</strong>: No refund. Workshops have fixed
          capacity; late cancellations cannot be filled.
        </li>
        <li>
          <strong>Cancellation by Mindset</strong>: 100% refund.
        </li>
      </ul>

      <h2>Physical Products</h2>
      <ul>
        <li>
          Returnable within 7 days of delivery if unused and in original packaging. Refund
          processed after the return is received and inspected.
        </li>
        <li>
          For hygiene reasons, certain wellness products are non-returnable once opened. The
          product page indicates where this applies.
        </li>
      </ul>

      <h2>Digital Products</h2>
      <ul>
        <li>
          Ebooks and recorded workshops are non-refundable once purchased. Sample chapters or
          previews are available before buying where applicable.
        </li>
      </ul>

      <h2>Refund Method</h2>
      <p>
        Refunds are processed back to the original payment method via Razorpay. Allow
        5&ndash;7 business days for the amount to reflect in your account. For payment-related
        issues, email{' '}
        <a href="mailto:mindset.org.connect@gmail.com">mindset.org.connect@gmail.com</a> with
        your order ID or session reference.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about a specific refund or this policy? Write to{' '}
        <a href="mailto:mindset.org.connect@gmail.com">mindset.org.connect@gmail.com</a>. We
        aim to acknowledge within 48 hours and resolve within 5&ndash;7 business days.
      </p>

      <div className="callout" style={{ marginTop: '3rem' }}>
        <p style={{ marginBottom: 0, fontSize: '0.9rem', opacity: 0.8 }}>
          <strong>Important:</strong> This policy reflects standard practice for Indian
          mental-health platforms. The cancellation windows above describe our policy
          intent; cancellation tools inside the dashboard enforce the 24-hour and 48-hour
          gates today. Refund processing is handled by our operations team via Razorpay and
          may take the stated 5&ndash;7 business days.
        </p>
      </div>
    </LegalLayout>
  )
}
