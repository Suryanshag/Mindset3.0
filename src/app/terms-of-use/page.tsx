import type { Metadata } from 'next'
import { LegalLayout } from '@/components/legal/legal-layout'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description:
    'The terms governing your use of Mindset — therapy sessions, workshops, products, and community resources.',
  alternates: { canonical: '/terms-of-use' },
}

export default function TermsOfUsePage() {
  return (
    <LegalLayout title="Terms of Use" effectiveDate="May 1, 2026">
      <p>
        These Terms of Use (&ldquo;Terms&rdquo;) govern your use of the Mindset platform, including the
        website, account features, therapy sessions, workshops, study materials, and physical
        products. By creating an account or using the service, you agree to these Terms. If you
        don&apos;t agree, please don&apos;t use the service.
      </p>

      <div className="callout">
        <p style={{ marginBottom: 0 }}>
          <strong>If you are in crisis right now</strong> &mdash; thinking about hurting yourself or
          others &mdash; Mindset is not an emergency service. Please call one of these helplines
          immediately:
        </p>
        <ul style={{ marginTop: '0.75rem', marginBottom: 0 }}>
          <li><strong>iCall</strong> (TISS): <a href="tel:9152987821">9152987821</a></li>
          <li><strong>Vandrevala Foundation</strong>: <a href="tel:18602662345">1860-266-2345</a> (24×7)</li>
          <li><strong>NIMHANS</strong>: <a href="tel:08046110007">080-4611-0007</a></li>
          <li><strong>KIRAN</strong> (national mental health helpline): <a href="tel:18005990019">1800-599-0019</a></li>
        </ul>
      </div>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 18 years old to create an account on your own. If you are between
        13 and 18, you may use the service only with the verifiable consent and supervision of
        a parent or legal guardian, who agrees to be bound by these Terms on your behalf. The
        service is not intended for children under 13.
      </p>

      <h2>2. What Mindset is &mdash; and isn&apos;t</h2>
      <p>
        Mindset connects you with qualified mental-health professionals, hosts wellness
        workshops, and offers self-help resources and products. The platform is{' '}
        <strong>not</strong> a substitute for medical or psychiatric care, an emergency service,
        or a hospital. Browsing this site does not by itself create a doctor-patient or
        therapist-client relationship.
      </p>
      <p>
        Therapists and counsellors on Mindset are independently qualified and registered. The
        clinical advice they give in sessions is theirs, not Mindset&apos;s. Mindset facilitates the
        connection and the booking; it does not direct the clinical conversation.
      </p>

      <h2>3. Your account</h2>
      <ul>
        <li>You agree to provide accurate, up-to-date information.</li>
        <li>You are responsible for keeping your password safe and for all activity under your account.</li>
        <li>One person, one account. Don&apos;t share your account with others.</li>
        <li>Notify us at the contact email below if you suspect unauthorised access.</li>
      </ul>

      <h2>4. Booking and using sessions</h2>
      <ul>
        <li>Sessions are conducted online (video) or in person, depending on the therapist&apos;s availability and your selection.</li>
        <li>Be on time. If you&apos;re going to be more than 10 minutes late, please reschedule &mdash; otherwise the session may be marked as a no-show.</li>
        <li>Reschedule or cancel at least 24 hours before the booked slot. Cancellations within 24 hours, or no-shows, may be charged the full session fee.</li>
        <li>Recording sessions (audio or video) is not permitted by either party without written consent.</li>
        <li>Treat your therapist with the same respect you expect for yourself. We reserve the right to terminate accounts that engage in harassment, threats, or unlawful behaviour.</li>
      </ul>

      <h2>5. Workshops, study materials, and digital products</h2>
      <ul>
        <li>Workshop spots are limited; bookings are confirmed only on receipt of payment.</li>
        <li>Recordings, ebooks, and other digital content are licensed to you for personal, non-commercial use. Don&apos;t share, resell, or republish them.</li>
        <li>All intellectual property in the platform&apos;s content (text, recordings, graphics, code) is owned by Mindset or its licensors and is protected by Indian and international copyright law.</li>
      </ul>

      <h2>6. Physical products, shipping, and returns</h2>
      <ul>
        <li>Physical products are shipped via Shiprocket within India. Delivery times depend on your pincode and product availability.</li>
        <li>Inspect your shipment on delivery. If a product arrives damaged or defective, write to us within 7 days with photos and order details, and we&apos;ll arrange a replacement or refund.</li>
        <li>For hygiene reasons, certain wellness products are non-returnable once opened. The product page will indicate where this applies.</li>
        <li>Refunds, where applicable, are processed back to the original payment method within 7&ndash;10 working days of approval.</li>
      </ul>

      <h2>7. Payments and pricing</h2>
      <ul>
        <li>All prices are in Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise.</li>
        <li>Payments are processed through Razorpay. We don&apos;t see or store your card or banking details.</li>
        <li>If a payment is made in error, write to us within 48 hours and we&apos;ll work to resolve it.</li>
      </ul>

      <h2>8. Refund policy</h2>
      <ul>
        <li><strong>Sessions:</strong> Full refund if cancelled at least 24 hours in advance. Within 24 hours or no-show: non-refundable. Therapist-initiated cancellations are fully refunded or rescheduled at your choice.</li>
        <li><strong>Workshops:</strong> Full refund if requested at least 48 hours before start. After that: non-refundable. Workshops cancelled by Mindset are fully refunded.</li>
        <li><strong>Digital products:</strong> Non-refundable once accessed or downloaded, except where required by law.</li>
        <li><strong>Physical products:</strong> See Section 6.</li>
      </ul>

      <h2>9. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the service for any unlawful purpose.</li>
        <li>Impersonate anyone or misrepresent your affiliation with a person or organisation.</li>
        <li>Harass, threaten, or discriminate against other users or therapists.</li>
        <li>Attempt to gain unauthorised access to the platform or its data.</li>
        <li>Scrape, crawl, or harvest data from the platform without written permission.</li>
        <li>Upload viruses, malware, or content that infringes third-party rights.</li>
      </ul>

      <h2>10. Privacy</h2>
      <p>
        Our handling of personal data is described in the{' '}
        <a href="/privacy-policy">Privacy Policy</a>, which is incorporated into these Terms by
        reference.
      </p>

      <h2>11. Disclaimers</h2>
      <p>
        The service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We do our best, but
        we don&apos;t warrant that the platform will always be uninterrupted, error-free, or that
        any specific outcome (clinical, emotional, or otherwise) will result from your use of
        it. Mental health is deeply individual; no platform can guarantee results.
      </p>
      <p>
        Mindset is not liable for the personal opinions of therapists, decisions you make based
        on session content, or actions taken by other users.
      </p>

      <h2>12. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, Mindset&apos;s total liability for any claim arising
        from or related to the service is limited to the amount you paid us in the three months
        preceding the event giving rise to the claim. We are not liable for indirect,
        incidental, or consequential damages.
      </p>

      <h2>13. Termination</h2>
      <p>
        You can close your account at any time from the account settings or by writing to us.
        We may suspend or terminate accounts that violate these Terms, that pose a risk to other
        users or therapists, or where we are required to by law. Where reasonable, we&apos;ll give
        notice and a chance to remedy the issue.
      </p>

      <h2>14. Governing law and disputes</h2>
      <p>
        These Terms are governed by the laws of India. Subject to mandatory consumer-protection
        laws that may apply where you live, the courts at [Your registered jurisdiction], India
        will have exclusive jurisdiction over any dispute. Before going to court, both parties
        agree to attempt resolution in good faith for at least 30 days, beginning with a written
        notice to our Grievance Officer.
      </p>

      <h2>15. Changes</h2>
      <p>
        We may update these Terms as the service evolves. The latest version will always be at
        this URL with the effective date updated. Material changes will be communicated to
        registered users by email. Continued use of the service after a change means you accept
        the updated Terms.
      </p>

      <h2>16. Contact</h2>
      <p>
        Questions about these Terms? Write to{' '}
        <a href="mailto:hello@mindset.example">hello@mindset.example</a> or use our{' '}
        <a href="/contact">contact form</a>.
      </p>

      <div className="callout" style={{ marginTop: '3rem' }}>
        <p style={{ marginBottom: 0, fontSize: '0.9rem', opacity: 0.8 }}>
          <strong>Important:</strong> These Terms are provided as a starting template that
          reflects standard practice for Indian mental-health platforms. Please have a lawyer
          review them before going live &mdash; especially Sections 6 (returns), 8 (refunds), 12
          (liability cap), and 14 (governing jurisdiction) which depend on your specific
          business setup and registered office.
        </p>
      </div>
    </LegalLayout>
  )
}
