'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Mail } from 'lucide-react'
import AuthShell from '@/components/auth/auth-shell'
import MobileField from '@/components/auth/mobile-field'
import MobileBackButton from '@/components/auth/mobile-back-button'

const RESEND_COOLDOWN_SECONDS = 60
const COMPLETION_FRESHNESS_MS = 30 * 60 * 1000
const STORAGE_KEY = 'mindset:password-reset-complete'
const inputClass =
  'w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 outline-none border-2'

// All state lives in the page component; mobile + desktop variants are
// dumb renderers that read from a shared hook. This avoids the dual-form
// gymnastics from /login + /register because /forgot-password has no
// RHF — just useState for an email string and a few flags.
type ForgotPasswordState = {
  email: string
  setEmail: (v: string) => void
  isLoading: boolean
  submitted: boolean
  error: string | null
  cooldown: number
  completedElsewhere: boolean
  handleSubmit: () => Promise<void>
}

function useForgotPasswordState(): ForgotPasswordState {
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

  return {
    email,
    setEmail,
    isLoading,
    submitted,
    error,
    cooldown,
    completedElsewhere,
    handleSubmit,
  }
}

// Format remaining cooldown as 0:XX (mono).
function formatCooldown(seconds: number): string {
  if (seconds <= 0) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// ─── Mobile variant ─────────────────────────────────────────────────────
function MobileForgotPassword(props: ForgotPasswordState) {
  const { email, setEmail, isLoading, submitted, error, cooldown, completedElsewhere, handleSubmit } = props

  if (completedElsewhere) {
    return (
      <div className="px-6 pt-3 pb-6 flex flex-col" style={{ minHeight: '100%' }}>
        <div className="mb-5">
          <MobileBackButton href="/login" ariaLabel="Back to sign in" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center" style={{ animation: 'ms-fade-up .6s both' }}>
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 56,
              height: 56,
              background: 'var(--primary-tint)',
              color: 'var(--primary)',
            }}
          >
            <CheckCircle size={26} strokeWidth={2.4} aria-hidden="true" />
          </div>
          <h1
            className="mt-5"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 28,
              lineHeight: 1.15,
              color: 'var(--text)',
            }}
          >
            Password reset in another tab
          </h1>
          <p
            className="mt-2.5 text-sm leading-relaxed max-w-[280px]"
            style={{ color: 'var(--text-muted)' }}
          >
            You&apos;ve already completed the password reset in another tab. Sign in with your new password to continue.
          </p>
          <Link
            href="/login?message=password-reset"
            className="mt-7 inline-flex items-center justify-center gap-2 py-4 px-7 rounded-full text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: 'var(--primary)', color: 'var(--on-dark)' }}
          >
            Go to login
            <ArrowRight size={16} strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="px-6 pt-3 pb-6 flex flex-col" style={{ minHeight: '100%' }}>
        <div className="mb-5">
          <MobileBackButton href="/login" ariaLabel="Back to sign in" />
        </div>

        <div
          className="rounded-[26px] p-7"
          style={{
            background: 'var(--bg-cream)',
            animation: 'ms-fade-up .6s both',
          }}
        >
          <div className="flex justify-center">
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 56,
                height: 56,
                background: 'var(--primary-tint)',
                color: 'var(--primary)',
              }}
            >
              <CheckCircle size={26} strokeWidth={2.4} aria-hidden="true" />
            </div>
          </div>
          <h1
            className="mt-5 text-center"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 24,
              lineHeight: 1.15,
              color: 'var(--text)',
            }}
          >
            We sent a link to{' '}
            <span style={{ color: 'var(--primary)' }}>{email}</span>
          </h1>
          <p
            className="mt-3 text-sm leading-relaxed text-center"
            style={{ color: 'var(--text-muted)' }}
          >
            Check spam if you don&apos;t see it in a minute.
          </p>

          {/* Amber expiry warning preserved from the existing implementation —
              the handoff doesn't show it, but the 15-minute window is a real
              fact users need to know. */}
          <div
            className="mt-4 px-3.5 py-2.5 rounded-xl text-xs font-medium"
            style={{ background: 'var(--amber-soft)', color: 'var(--accent-deep)' }}
          >
            The link expires in 15 minutes.
          </div>

          <div className="mt-5 grid gap-2.5">
            <a
              href="mailto:"
              className="inline-flex items-center justify-center py-3.5 px-6 rounded-full text-sm font-bold transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                background: 'var(--primary)',
                color: 'var(--on-dark)',
                outlineColor: 'var(--primary)',
              }}
            >
              Open mail app
            </a>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={cooldown > 0 || isLoading}
              className="inline-flex items-center justify-center py-3.5 px-6 rounded-full text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                background: 'transparent',
                color: cooldown > 0 ? 'var(--text-muted)' : 'var(--primary)',
                border: '1.5px solid var(--border-strong)',
                outlineColor: 'var(--primary)',
              }}
              aria-live="polite"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" /> Sending…
                </>
              ) : cooldown > 0 ? (
                <span style={{ fontFamily: 'ui-monospace, monospace' }}>
                  Resend in {formatCooldown(cooldown)}
                </span>
              ) : (
                'Resend link'
              )}
            </button>
          </div>
        </div>

        <Link
          href="/login"
          className="mt-5 inline-flex items-center gap-2 self-start text-sm font-bold transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded"
          style={{
            color: 'var(--primary)',
            minHeight: 44,
            padding: '0 4px',
            outlineColor: 'var(--primary)',
          }}
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>
      </div>
    )
  }

  // Default — input stage
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit()
      }}
      className="px-6 pt-3 pb-6 flex flex-col"
      style={{ minHeight: '100%' }}
      noValidate
    >
      {isLoading && <MindsetLoaderOverlay />}

      <div className="mb-5">
        <MobileBackButton href="/login" ariaLabel="Back to sign in" />
      </div>

      <div style={{ animation: 'ms-fade-up .6s both' }}>
        <p
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: 'var(--primary)' }}
        >
          Reset password
        </p>
        <h1
          className="mt-1.5"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 32,
            lineHeight: 1.05,
            color: 'var(--text)',
          }}
        >
          What&apos;s your<br />email?
        </h1>
        <p
          className="mt-2.5 text-sm leading-relaxed"
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            color: 'var(--text-muted)',
          }}
        >
          We&apos;ll send a reset link if this account exists.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 p-3.5 rounded-xl text-sm font-medium"
          style={{ background: 'var(--accent-tint)', color: 'var(--accent-deep)' }}
        >
          {error}
        </div>
      )}

      <div className="mt-7" style={{ animation: 'ms-fade-up .6s .1s both' }}>
        <MobileField
          label="Email"
          icon={<Mail size={18} strokeWidth={1.7} />}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
      </div>

      <div className="mt-auto pt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-full text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-70"
          style={{ background: 'var(--primary)', color: 'var(--on-dark)' }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Sending…
            </>
          ) : (
            <>
              Send reset link
              <ArrowRight size={16} strokeWidth={2.2} />
            </>
          )}
        </button>
      </div>
    </form>
  )
}

// ─── Desktop variant — unchanged visual from before sub-phase 1.4 ───────
function DesktopForgotPassword(props: ForgotPasswordState) {
  const { email, setEmail, isLoading, submitted, error, cooldown, completedElsewhere, handleSubmit } = props

  if (completedElsewhere) {
    return (
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
    )
  }

  if (submitted) {
    return (
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
            boxShadow: cooldown > 0 ? 'none' : '0 4px 16px rgba(11,157,169,0.25)',
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
    )
  }

  return (
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
  )
}

export default function ForgotPasswordPage() {
  const state = useForgotPasswordState()

  return (
    <AuthShell headline="A reset link, on its way.">
      <div className="lg:hidden">
        <MobileForgotPassword {...state} />
      </div>
      <div className="hidden lg:block">
        <DesktopForgotPassword {...state} />
      </div>
    </AuthShell>
  )
}
