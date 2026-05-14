'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Mail } from 'lucide-react'
import AuthShell from '@/components/auth/auth-shell'

const RESEND_COOLDOWN_SECONDS = 60
const COMPLETION_FRESHNESS_MS = 30 * 60 * 1000
const STORAGE_KEY = 'mindset:password-reset-complete'
const inputClass =
  'w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 outline-none border-2'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [completedElsewhere, setCompletedElsewhere] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  // Cross-tab signal: if another *live* tab completes the reset while this
  // page is open, switch this tab out of the "Check your email / Resend link"
  // state. We deliberately do NOT inspect localStorage on initial mount —
  // a stale key from a previous reset shouldn't pre-empt a fresh visit here.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return
      const ts = Number(e.newValue)
      if (Number.isFinite(ts) && Date.now() - ts < COMPLETION_FRESHNESS_MS) {
        setCompletedElsewhere(true)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const handleSubmit = async () => {
    if (cooldown > 0) return
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (data.success) {
        setSubmitted(true)
        setCooldown(RESEND_COOLDOWN_SECONDS)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (completedElsewhere) {
    return (
      <AuthShell headline="All set — your password has been updated.">
        <div>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(11,157,169,0.1)' }}
          >
            <CheckCircle className="w-7 h-7" style={{ color: 'var(--teal)' }} />
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold mb-2"
            style={{ color: 'var(--navy)', fontFamily: 'var(--font-heading)' }}
          >
            Password reset in another tab
          </h2>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: 'rgba(30,68,92,0.6)' }}>
            You&apos;ve already completed the password reset in another tab. Sign in with your new
            password to continue.
          </p>
          <Link
            href="/login?message=password-reset"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white transition-all duration-200"
            style={{ background: 'var(--teal)', boxShadow: '0 4px 16px rgba(11,157,169,0.25)' }}
          >
            Go to login
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell headline="A reset link, on its way.">
      {submitted ? (
        <div>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(11,157,169,0.1)' }}
          >
            <CheckCircle className="w-7 h-7" style={{ color: 'var(--teal)' }} />
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold mb-2"
            style={{ color: 'var(--navy)', fontFamily: 'var(--font-heading)' }}
          >
            Check your email
          </h2>
          <p className="text-sm mb-5 leading-relaxed" style={{ color: 'rgba(30,68,92,0.6)' }}>
            If an account exists for{' '}
            <strong style={{ color: 'var(--navy)' }}>{email}</strong>, you&apos;ll receive a
            password reset link within a few minutes.
          </p>
          <p
            className="text-xs font-medium rounded-xl p-3 mb-6"
            style={{ background: 'rgba(255,170,17,0.08)', color: '#92400E' }}
          >
            The link expires in 15 minutes. Didn&apos;t get it? Check spam, or resend below.
          </p>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={cooldown > 0 || isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50"
            style={{
              background: cooldown > 0 ? 'rgba(11,157,169,0.08)' : 'var(--teal)',
              color: cooldown > 0 ? 'var(--teal)' : '#fff',
              boxShadow:
                cooldown > 0 ? 'none' : '0 4px 16px rgba(11,157,169,0.25)',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending…
              </>
            ) : cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : (
              'Resend link'
            )}
          </button>

          <Link
            href="/login"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold transition-opacity duration-150 hover:opacity-70"
            style={{ color: 'var(--teal)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      ) : (
        <div>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(11,157,169,0.1)' }}
          >
            <Mail className="w-5 h-5" style={{ color: 'var(--teal)' }} />
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold mb-1"
            style={{ color: 'var(--navy)', fontFamily: 'var(--font-heading)' }}
          >
            Forgot password?
          </h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(30,68,92,0.55)' }}>
            Enter your email and we&apos;ll send you a reset link.
          </p>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl text-sm font-medium"
              style={{ background: 'rgba(249,101,83,0.08)', color: '#991B1B' }}
            >
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wide mb-2"
                style={{ color: 'rgba(30,68,92,0.55)' }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit()
                }}
                placeholder="you@example.com"
                className={inputClass}
                style={{
                  background: 'var(--cream)',
                  borderColor: 'transparent',
                  color: 'var(--navy)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--teal)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'transparent'
                }}
                autoFocus
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50"
              style={{
                background: 'var(--teal)',
                boxShadow: '0 4px 16px rgba(11,157,169,0.25)',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  Send reset link
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <Link
            href="/login"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium transition-opacity duration-150 hover:opacity-70"
            style={{ color: 'rgba(30,68,92,0.55)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      )}
    </AuthShell>
  )
}
