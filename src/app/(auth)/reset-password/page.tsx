'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Loader2, Lock, XCircle } from 'lucide-react'
import PasswordInput from '@/components/auth/password-input'
import PasswordStrength from '@/components/auth/password-strength'
import AuthShell from '@/components/auth/auth-shell'

const inputClass =
  'w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 outline-none border-2'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [tokenStatus, setTokenStatus] = useState<'checking' | 'valid' | 'invalid'>('checking')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setTokenStatus('invalid')
      return
    }
    fetch(`/api/auth/reset-password?token=${token}`)
      .then((res) => res.json())
      .then((data) => setTokenStatus(data.success ? 'valid' : 'invalid'))
      .catch(() => setTokenStatus('invalid'))
  }, [token])

  const passwordValid = (p: string) => {
    if (p.length < 10) return 'Password must be at least 10 characters'
    const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/]
    if (classes.filter((re) => re.test(p)).length < 3) {
      return 'Password must include 3 of: uppercase, lowercase, number, special character'
    }
    return null
  }

  const handleReset = async () => {
    setError(null)
    const msg = passwordValid(password)
    if (msg) {
      setError(msg)
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
      if (data.success) {
        setSuccess(true)
        setTimeout(() => router.push('/login?message=password-reset'), 2500)
      } else {
        setError(data.error)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

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
        <p className="text-sm mb-3" style={{ color: 'rgba(30,68,92,0.55)' }}>
          Your password has been updated. We&apos;ll take you to the login page in a moment.
        </p>
        <Link
          href="/login?message=password-reset"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all duration-200"
          style={{ background: 'var(--teal)', boxShadow: '0 4px 16px rgba(11,157,169,0.25)' }}
        >
          Go to login
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
            placeholder="Minimum 10 characters"
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
            placeholder="Repeat your password"
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
            'Reset password'
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

export default function ResetPasswordPage() {
  return (
    <AuthShell headline="One more step to get you back in.">
      <Suspense
        fallback={
          <div className="text-center py-10">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: 'var(--teal)' }} />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  )
}
