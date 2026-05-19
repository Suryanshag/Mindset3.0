import type { Metadata } from 'next'
import { LegalLayout } from '@/components/legal/legal-layout'
import { OpenCookiePreferencesButton } from '@/components/legal/open-cookie-preferences-button'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'How Mindset uses cookies — what they are, the categories we run, and how to change or withdraw your consent at any time.',
  alternates: { canonical: '/cookies' },
}

export default function CookiePolicyPage() {
  return (
    <LegalLayout title="Cookie Policy" effectiveDate="May 19, 2026">
      <p>
        This page explains how Mindset uses cookies and similar storage technologies (such as
        <code> localStorage</code>) on our website and platform, in plain language. It supplements
        our <a href="/privacy-policy">Privacy Policy</a> and is published in accordance with the
        Digital Personal Data Protection Act, 2023 (&ldquo;DPDP Act&rdquo;).
      </p>

      <h2>1. What cookies are</h2>
      <p>
        Cookies are small text files a website stores in your browser. They let the site remember
        things between page loads (like that you&apos;re signed in) and, in some cases, help us
        understand which features are useful.
      </p>

      <h2>2. The categories we use</h2>

      <h3>Essential</h3>
      <p>
        Required for the platform to work &mdash; these keep you signed in, hold your cart between
        pages, and protect your session from common security attacks. Essential cookies cannot be
        switched off because the site would not function without them.
      </p>

      <h3>Analytics</h3>
      <p>
        Help us understand which features people use and where the experience breaks down. We
        only collect aggregate, non-identifying information. This category is <strong>off by
        default</strong> and only runs if you turn it on.
      </p>

      <h3>Marketing</h3>
      <p>
        Allow us to remember preferences you&apos;ve set across visits so we can keep the experience
        consistent for you. We do not use third-party advertising trackers. This category is{' '}
        <strong>off by default</strong> and only runs if you turn it on.
      </p>

      <h2>3. Your choice and your consent</h2>
      <p>
        The first time you visit Mindset, we ask whether you want to allow non-essential cookies.
        You can <strong>Accept all</strong>, <strong>Reject non-essential</strong>, or open{' '}
        <strong>Customize</strong> to set each category individually. Rejecting is as easy as
        accepting; we do not use dark patterns to nudge you either way.
      </p>
      <p>
        Your choice is stored in your browser&apos;s <code>localStorage</code> under the key{' '}
        <code>mindset_cookie_consent_v1</code>, along with a timestamp.
      </p>

      <h2>4. How to change or withdraw your consent</h2>
      <p>You can change your cookie preferences at any time:</p>
      <ul>
        <li>Open the preferences modal here:</li>
      </ul>
      <p>
        <OpenCookiePreferencesButton />
      </p>
      <p>
        You can also clear your browser&apos;s site data for Mindset to reset all stored consent and
        related cookies.
      </p>

      <h2>5. Cookies set by our partners</h2>
      <p>
        Some pages rely on third-party services (for example, Razorpay for payments and Google
        for reCAPTCHA on sign-up). Those services may set their own cookies when their components
        load. Their cookie practices are governed by their own policies; we link to them where we
        embed the component.
      </p>

      <h2>6. Updates to this policy</h2>
      <p>
        If we change the categories of cookies we run or significantly change how consent is
        captured, we will publish a new version of this page and prompt for fresh consent.
      </p>

      <h2>7. Contact</h2>
      <p>
        Questions about cookies on Mindset? Write to{' '}
        <a href="mailto:mindset.org.connect@gmail.com">mindset.org.connect@gmail.com</a>.
      </p>
    </LegalLayout>
  )
}
