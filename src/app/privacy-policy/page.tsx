import type { Metadata } from 'next'
import { LegalLayout } from '@/components/legal/legal-layout'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Mindset collects, uses, and protects your personal and sensitive information, including mental-health-related data.',
  alternates: { canonical: '/privacy-policy' },
}

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy" effectiveDate="May 1, 2026">
      <p>
        At Mindset, your privacy isn&apos;t a checkbox &mdash; it&apos;s the foundation of trust we
        ask you to place in us. This policy explains what we collect, why we collect it, and
        the choices you have. We&apos;ve tried to write it in plain language; the legal terms
        you&apos;ll find here are required by Indian data-protection law.
      </p>

      <p>
        This policy is published in compliance with the Digital Personal Data Protection Act,
        2023 (&ldquo;DPDP Act&rdquo;), the Information Technology Act, 2000, and the Information Technology
        (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information)
        Rules, 2011 (&ldquo;SPDI Rules&rdquo;).
      </p>

      <h2>1. Who we are</h2>
      <p>
        &ldquo;Mindset&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo; refers to the
        Mindset platform operated from India. We are the Data Fiduciary under the DPDP Act for
        personal data we collect from you (&ldquo;Data Principal&rdquo;).
      </p>

      <h2>2. What we collect</h2>

      <h3>2.1 Information you give us</h3>
      <ul>
        <li><strong>Account information:</strong> name, email, phone number, password (hashed), date of birth, gender (optional).</li>
        <li><strong>Health and well-being information:</strong> session notes, journal entries, mood check-ins, intake-form responses, and anything you share with a therapist on our platform. This is &ldquo;sensitive personal data&rdquo; under Indian law and we treat it accordingly.</li>
        <li><strong>Payment information:</strong> Razorpay handles all card / UPI / net-banking data on its own PCI-DSS-compliant infrastructure. We only receive a transaction ID and status &mdash; we do not see or store your card details.</li>
        <li><strong>Shipping information:</strong> for physical products, we collect your shipping address and pincode and share these with our logistics partner Shiprocket.</li>
        <li><strong>Communications:</strong> messages you send through our contact forms, support emails, and any feedback you choose to share.</li>
      </ul>

      <h3>2.2 Information we collect automatically</h3>
      <ul>
        <li>Device information (browser type, operating system, screen size).</li>
        <li>Usage data (pages visited, features used, approximate time spent).</li>
        <li>IP address and approximate location (city / region only).</li>
        <li>Cookies and similar technologies for authentication, preferences, and basic analytics. We do not use third-party advertising trackers.</li>
      </ul>

      <h2>3. Why we collect it</h2>
      <ul>
        <li>To provide the service you signed up for &mdash; sessions, workshops, products, journals, library access.</li>
        <li>To process payments, fulfill orders, and ship physical products.</li>
        <li>To match you with appropriate therapists and to let your therapist see what you choose to share with them.</li>
        <li>To send transactional emails (booking confirmations, receipts, password resets).</li>
        <li>To prevent fraud, abuse, and to keep the platform safe.</li>
        <li>To comply with legal obligations (tax invoices, response to lawful requests).</li>
      </ul>

      <h2>4. The legal basis we rely on (DPDP Act)</h2>
      <p>
        We process your personal data on the basis of (a) the consent you give us when you sign
        up, book a session, or place an order, and (b) certain &ldquo;legitimate uses&rdquo; permitted under
        Section 7 of the DPDP Act &mdash; for example, fulfilling an obligation under law, or
        responding to a medical emergency.
      </p>
      <p>
        Where we rely on consent, you can withdraw it at any time by writing to our Grievance
        Officer. Withdrawing consent does not affect the lawfulness of processing carried out
        before the withdrawal.
      </p>

      <h2>5. How we keep mental-health information confidential</h2>
      <div className="callout">
        <p style={{ marginBottom: 0 }}>
          What you tell a Mindset therapist in a session is confidential. It is not visible to
          our administrative team, our marketing team, or other users of the platform.
          Confidentiality may only be broken in narrow situations recognised by Rehabilitation
          Council of India (RCI) ethics &mdash; chiefly when there is a serious and imminent risk to
          your life or someone else&apos;s, or when we are compelled by a court order.
        </p>
      </div>
      <p>
        Therapists access only their own clients&apos; records and are bound by professional
        confidentiality codes in addition to this policy.
      </p>

      <h2>6. Who we share your information with</h2>
      <p>
        We do not sell your personal data. We share specific data with specific partners only
        where it&apos;s necessary to deliver the service:
      </p>
      <ul>
        <li><strong>Razorpay</strong> &mdash; payment processing.</li>
        <li><strong>Shiprocket</strong> &mdash; shipping for physical products.</li>
        <li><strong>Resend</strong> &mdash; transactional email delivery.</li>
        <li><strong>Cloudinary</strong> &mdash; image and media hosting.</li>
        <li><strong>Google Calendar</strong> &mdash; session scheduling for therapists who opt in.</li>
        <li><strong>OpenRouter</strong> &mdash; certain AI-assisted features. Where we use AI, we do not send identifiable session content.</li>
        <li><strong>Hosting and database providers</strong> who store the data on our behalf.</li>
        <li><strong>Lawful authorities</strong> when we receive a valid legal request.</li>
      </ul>
      <p>
        We require each partner to handle the data with security standards comparable to ours.
        Some of these partners may store data outside India; in that case we ensure transfer
        is permitted under the DPDP Act and is governed by appropriate contractual safeguards.
      </p>

      <h2>7. How long we keep it</h2>
      <ul>
        <li>Account data: while your account is active, plus a short retention window after deletion to handle disputes and comply with tax / regulatory requirements.</li>
        <li>Session and clinical notes: retained as required by RCI / professional record-keeping norms (typically 3 years from last interaction) unless you ask for earlier deletion and there is no legal bar to it.</li>
        <li>Payment and tax records: retained for the period required under Indian tax law.</li>
        <li>Marketing consent records: until you opt out.</li>
      </ul>

      <h2>8. Your rights</h2>
      <p>Under the DPDP Act, you have the right to:</p>
      <ul>
        <li>Access a summary of the personal data we process about you.</li>
        <li>Correct or update inaccurate or incomplete data.</li>
        <li>Erase your data, subject to lawful retention requirements.</li>
        <li>Nominate another individual to exercise your rights if you are unable to.</li>
        <li>Grievance redressal &mdash; lodge a complaint with us, and if unresolved, with the Data Protection Board of India.</li>
      </ul>
      <p>
        To exercise any of these rights, write to our Grievance Officer (details below). We
        will respond within the timelines required by law.
      </p>

      <h2>9. Children</h2>
      <p>
        Our services are intended for users aged 18 and above. If you are between 13 and 18, you
        may use the platform only with the verifiable consent of a parent or legal guardian. We
        do not knowingly process the personal data of anyone below 18 without that consent. If
        you believe we have collected such data, please contact us and we will delete it.
      </p>

      <h2>10. Security</h2>
      <p>
        We use TLS encryption in transit, encryption at rest for sensitive fields, role-based
        access controls, and routine security reviews. No system is perfectly secure, but we
        treat any incident seriously and will notify affected users and the Data Protection
        Board where the law requires.
      </p>

      <h2>11. Cookies</h2>
      <p>
        We use a small number of essential cookies for sign-in and preferences, and we may use
        first-party analytics to understand how the site is used in aggregate. You can control
        cookies through your browser settings.
      </p>

      <h2>12. Changes to this policy</h2>
      <p>
        We may update this policy as the platform evolves or as the law changes. The
        &ldquo;Effective&rdquo; date at the top reflects the latest version. For material changes we will
        also notify registered users by email.
      </p>

      <h2>13. Grievance Officer</h2>
      <p>
        In accordance with the IT Act, the IT Rules, and the DPDP Act, our Grievance Officer
        receives and resolves complaints about how your data is handled.
      </p>
      <ul>
        <li><strong>Name:</strong> [To be appointed before launch]</li>
        <li><strong>Email:</strong> grievance@mindset.example</li>
        <li><strong>Address:</strong> [Your registered office address]</li>
      </ul>
      <p>We aim to acknowledge complaints within 48 hours and resolve them within 30 days.</p>

      <h2>14. Contact</h2>
      <p>
        For anything else &mdash; questions, requests, feedback &mdash; reach us at{' '}
        <a href="mailto:hello@mindset.example">hello@mindset.example</a>.
      </p>

      <div className="callout" style={{ marginTop: '3rem' }}>
        <p style={{ marginBottom: 0, fontSize: '0.9rem', opacity: 0.8 }}>
          <strong>Important:</strong> This policy is provided as a starting point and reflects our
          good-faith reading of Indian data-protection law as of the effective date. Please have
          your appointed legal counsel review and tailor it before publishing it on the live
          domain &mdash; particularly the Grievance Officer details, registered office address, and
          any region-specific terms.
        </p>
      </div>
    </LegalLayout>
  )
}
