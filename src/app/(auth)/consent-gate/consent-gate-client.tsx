'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { ConsentCheckboxes } from '@/components/auth/consent-checkboxes'

const ROLE_HOME: Record<string, string> = {
  ADMIN: '/admin',
  DOCTOR: '/doctor',
  USER: '/user',
}

export default function ConsentGateClient() {
  const router = useRouter()
  const { data: session, update: updateSession } = useSession()
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!privacyAccepted) {
      setError('You must accept the Privacy Policy and Terms of Use to continue.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/consent-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacyAccepted, marketingConsent }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Something went wrong. Please try again.')
        setIsSubmitting(false)
        return
      }

      // Nudge the NextAuth session so any client code reading the session
      // sees the user as freshly consented. The dashboard layout reads
      // consentedAt from the DB on every render, so this is mostly a
      // belt-and-braces step for any client surface that cares.
      await updateSession()

      const role = session?.user?.role ?? 'USER'
      router.push(ROLE_HOME[role] ?? '/user')
    } catch {
      setError('Network error. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'var(--cream)' }}
    >
      <div className="w-full max-w-md">
        <div className="card-premium p-8 space-y-6">
          <div>
            <h1
              className="font-heading text-3xl font-bold mb-2"
              style={{ color: 'var(--coral)' }}
            >
              Welcome to Mindset
            </h1>
            <p style={{ color: 'var(--navy)', opacity: 0.7 }}>
              One quick step before we get started — please review and accept
              our privacy policy.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg text-sm"
              style={{
                background: 'rgba(249, 101, 83, 0.1)',
                color: '#991B1B',
                border: '1px solid rgba(249, 101, 83, 0.3)',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <ConsentCheckboxes
              privacyAccepted={privacyAccepted}
              marketingConsent={marketingConsent}
              onPrivacyChange={setPrivacyAccepted}
              onMarketingChange={setMarketingConsent}
              isSubmitting={isSubmitting}
            />

            <button
              type="submit"
              disabled={isSubmitting || !privacyAccepted}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--coral)' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Setting up…
                </>
              ) : (
                <>
                  Continue to Mindset
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p
            className="text-xs text-center"
            style={{ color: 'var(--navy)', opacity: 0.55 }}
          >
            By clicking &ldquo;Continue&rdquo;, you agree to our{' '}
            <Link href="/privacy-policy" className="underline hover:opacity-70">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/terms-of-use" className="underline hover:opacity-70">
              Terms of Use
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
