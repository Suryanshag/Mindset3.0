'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Lock, XCircle } from 'lucide-react'
import PasswordInput from '@/components/auth/password-input'
import PasswordStrength from '@/components/auth/password-strength'
import PasswordStrengthBars from '@/components/auth/password-strength-bars'
import AuthShell from '@/components/auth/auth-shell'
import MobileField from '@/components/auth/mobile-field'
import MobileBackButton from '@/components/auth/mobile-back-button'
import { MindsetLoader } from '@/components/auth/mindset-loader'
import { scorePassword } from '@/lib/validations/password-policy'

const inputClass =
  'w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 outline-none border-2'

type TokenStatus = 'checking' | 'valid' | 'invalid'

type ResetPasswordState = {
  token: string | null
  tokenStatus: TokenStatus
  password: string
  setPassword: (v: string) => void
  confirmPassword: string
  setConfirmPassword: (v: string) => void
  showPassword: boolean
  setShowPassword: (v: boolean) => void
  isLoading: boolean
  error: string | null
  success: boolean
  handleReset: () => Promise<void>
}

// Cross-tab signal lives in localStorage; /forgot-password's "completed-
// elsewhere" listener reads this key. Preserve on every successful reset.
const COMPLETION_STORAGE_KEY = 'mindset:password-reset-complete'

function useResetPasswordState(): ResetPasswordState {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [tokenStatus, setTokenStatus] = useState<TokenStatus>('checking')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setTokenStatus('invalid')
      return
    }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => setTokenStatus(data.success ? 'valid' : 'invalid'))
      .catch(() => setTokenStatus('invalid'))
  }, [token])

  const handleReset = async () => {
    setError(null)

    // Client gate: pull from the shared policy module. Server validates
    // again against the same passwordSchema.
    const score = scorePassword(password)
    if (!score.meetsPolicy) {
      setError(
        'Password must be at least 10 characters with 3 of: uppercase, lowercase, number, special character.'
      )
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setIsLoading(false)
        return
      }

      // Cross-tab signal: tell any open /forgot-password tabs that the
      // reset is done so they can flip out of the resend-link UI. Preserved
      // from the pre-restyle behavior; live tabs depend on this.
      try {
        localStorage.setItem(COMPLETION_STORAGE_KEY, String(Date.now()))
      } catch {
        // localStorage may be disabled in private mode; not critical.
      }

      // Success state visible to the user as a brief card; the signIn
      // call runs concurrently to seamlessly drop the user on /user.
      setSuccess(true)

      // Auto-signin per Resolved Decision 6.4. The server returned the
      // email bound to the reset token so the user doesn't have to re-
      // enter the password they just set.
      if (data.email && typeof data.email === 'string') {
        const signInResult = await signIn('credentials', {
          email: data.email,
          password,
          redirect: false,
        })
        if (!signInResult?.error) {
          router.push('/user')
          // Keep isLoading true through navigation — component unmounts.
          return
        }
      }

      // Fallback: signIn failed (or server didn't return email for some
      // reason). Fall back to the legacy redirect with the success-banner
      // message on /login. Existing /login already reads ?message=
      // password-reset and shows the teal banner.
      setTimeout(() => router.push('/login?message=password-reset'), 2500)
    } catch {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  return {
    token,
    tokenStatus,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    isLoading,
    error,
    success,
    handleReset,
  }
}

// ─── Mobile variant ─────────────────────────────────────────────────────
function MobileResetPassword(props: ResetPasswordState) {
  const {
    tokenStatus,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    isLoading,
    error,
    success,
    handleReset,
  } = props

  const passwordScore = scorePassword(password)
  const passwordsMatch = password.length > 0 && password === confirmPassword
  const canSubmit = passwordScore.meetsPolicy && passwordsMatch

  if (tokenStatus === 'checking') {
    return (
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ minHeight: '60vh' }}
        role="status"
        aria-live="polite"
      >
        <Loader2
          size={32}
          className="animate-spin"
          style={{ color: 'var(--primary)' }}
          aria-hidden="true"
        />
        <p
          className="mt-4 text-sm"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
        >
          Verifying your reset link…
        </p>
      </div>
    )
  }

  if (tokenStatus === 'invalid') {
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
              background: 'var(--accent-tint)',
              color: 'var(--accent-deep)',
            }}
          >
            <XCircle size={26} strokeWidth={2.4} aria-hidden="true" />
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
            This link has expired
          </h1>
          <p
            className="mt-2.5 text-sm leading-relaxed max-w-[280px]"
            style={{ color: 'var(--text-muted)' }}
          >
            Password reset links are valid for 15 minutes for your security. Request a fresh one and try again.
          </p>
          <Link
            href="/forgot-password"
            className="mt-7 inline-flex items-center justify-center gap-2 py-4 px-7 rounded-full text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: 'var(--primary)', color: 'var(--on-dark)' }}
          >
            Request new link
            <ArrowRight size={16} strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="px-6 pt-3 pb-6 flex flex-col" style={{ minHeight: '100%' }}>
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
            Password reset successfully
          </h1>
          <p
            className="mt-2.5 text-sm leading-relaxed max-w-[280px] inline-flex items-center gap-2 justify-center"
            style={{ color: 'var(--text-muted)' }}
            role="status"
            aria-live="polite"
          >
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            Signing you in…
          </p>
        </div>
      </div>
    )
  }

  // Default — valid form
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        handleReset()
      }}
      className="px-6 pt-3 pb-6 flex flex-col"
      style={{ minHeight: '100%' }}
      noValidate
    >
      {isLoading && !success && <MindsetLoader message="Resetting your password…" />}

      <div className="mb-5">
        <MobileBackButton href="/login" ariaLabel="Back to sign in" />
      </div>

      <div style={{ animation: 'ms-fade-up .6s both' }}>
        <p
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: 'var(--primary)' }}
        >
          Almost there
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
          Create a new<br />password.
        </h1>
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

      <div className="mt-7 flex flex-col gap-3.5" style={{ animation: 'ms-fade-up .6s .1s both' }}>
        <div>
          <MobileField
            label="New password"
            icon={<Lock size={18} strokeWidth={1.7} />}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs font-bold inline-flex items-center justify-center transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 rounded"
                style={{
                  color: 'var(--primary)',
                  padding: '0 8px',
                  outlineColor: 'var(--primary)',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            }
          />
          <PasswordStrengthBars password={password} />
        </div>

        <div>
          <MobileField
            label="Confirm password"
            icon={<Lock size={18} strokeWidth={1.7} />}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {confirmPassword.length > 0 && (
            <p
              className="mt-1.5 ml-1 text-xs font-bold inline-flex items-center gap-1.5"
              style={{
                color: passwordsMatch ? 'var(--primary)' : 'var(--text-muted)',
              }}
              role="status"
              aria-live="polite"
            >
              {passwordsMatch ? (
                <>
                  <CheckCircle size={12} strokeWidth={2.6} aria-hidden="true" />
                  Passwords match
                </>
              ) : (
                <>
                  <span
                    aria-hidden="true"
                    className="inline-block rounded-full"
                    style={{ width: 8, height: 8, background: 'var(--border-strong)' }}
                  />
                  Don&apos;t match yet
                </>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="mt-auto pt-6">
        <button
          type="submit"
          disabled={!canSubmit || isLoading}
          className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-full text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--primary)', color: 'var(--on-dark)' }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Resetting…
            </>
          ) : (
            <>
              Reset &amp; sign in
              <ArrowRight size={16} strokeWidth={2.2} />
            </>
          )}
        </button>
      </div>
    </form>
  )
}

// ─── Desktop variant — unchanged visual from before sub-phase 1.4 ───────
function DesktopResetPassword(props: ResetPasswordState) {
  const {
    tokenStatus,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    error,
    success,
    handleReset,
  } = props

  if (tokenStatus === 'checking') {
    return (
      <div className="text-center py-10">
        <Loader2
          className="w-8 h-8 animate-spin mx-auto mb-3"
          style={{ color: 'var(--teal)' }}
        />
        <p className="text-sm" style={{ color: 'rgba(30,68,92,0.55)' }}>
          Verifying your reset link…
        </p>
      </div>
    )
  }

  if (tokenStatus === 'invalid') {
    return (
      <div>
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'rgba(249,101,83,0.1)' }}
        >
          <XCircle className="w-7 h-7" style={{ color: 'var(--coral)' }} />
        </div>
        <h2
          className="text-2xl sm:text-3xl font-bold mb-2"
          style={{ color: 'var(--navy)', fontFamily: 'var(--font-heading)' }}
        >
          This link has expired
        </h2>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'rgba(30,68,92,0.55)' }}>
          Password reset links are valid for 15 minutes for your security. Request a fresh one
          and try again.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 px-5 py-3 text-white rounded-xl font-bold text-sm transition-all duration-200"
          style={{ background: 'var(--teal)', boxShadow: '0 4px 16px rgba(11,157,169,0.25)' }}
        >
          Request new link
        </Link>
      </div>
    )
  }

  if (success) {
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
          Password reset successfully
        </h2>
        <p className="text-sm mb-3 inline-flex items-center gap-2" style={{ color: 'rgba(30,68,92,0.55)' }}>
          <Loader2 className="w-4 h-4 animate-spin" />
          Signing you in…
        </p>
      </div>
    )
  }

  return (
    <div>
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
        style={{ background: 'rgba(11,157,169,0.1)' }}
      >
        <Lock className="w-5 h-5" style={{ color: 'var(--teal)' }} />
      </div>
      <h2
        className="text-2xl sm:text-3xl font-bold mb-1"
        style={{ color: 'var(--navy)', fontFamily: 'var(--font-heading)' }}
      >
        Set a new password
      </h2>
      <p className="text-sm mb-6" style={{ color: 'rgba(30,68,92,0.55)' }}>
        Choose a strong password for your account.
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
            className="block text-xs font-bold uppercase tracking-wide mb-2"
            style={{ color: 'rgba(30,68,92,0.55)' }}
          >
            New password
          </label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            autoComplete="new-password"
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
          />
          <PasswordStrength password={password} />
        </div>

        <div>
          <label
            className="block text-xs font-bold uppercase tracking-wide mb-2"
            style={{ color: 'rgba(30,68,92,0.55)' }}
          >
            Confirm password
          </label>
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            autoComplete="new-password"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleReset()
            }}
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
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs font-medium mt-1.5" style={{ color: '#F96553' }}>
              Passwords do not match
            </p>
          )}
          {confirmPassword && password === confirmPassword && password.length >= 10 && (
            <p className="text-xs font-medium mt-1.5" style={{ color: 'var(--teal)' }}>
              Passwords match
            </p>
          )}
        </div>

        <button
          onClick={handleReset}
          disabled={isLoading || !password || !confirmPassword}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50"
          style={{
            background: 'var(--teal)',
            boxShadow: '0 4px 16px rgba(11,157,169,0.25)',
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Resetting…
            </>
          ) : (
            'Reset & sign in'
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

function ResetPasswordInner() {
  const state = useResetPasswordState()

  return (
    <>
      <div className="lg:hidden">
        <MobileResetPassword {...state} />
      </div>
      <div className="hidden lg:block">
        <DesktopResetPassword {...state} />
      </div>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <AuthShell headline="One more step to get you back in.">
      <Suspense
        fallback={
          <div className="text-center py-10">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: 'var(--primary)' }} />
          </div>
        }
      >
        <ResetPasswordInner />
      </Suspense>
    </AuthShell>
  )
}
