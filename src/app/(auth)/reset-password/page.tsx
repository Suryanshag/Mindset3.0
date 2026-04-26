'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle, XCircle, ArrowLeft, Lock } from 'lucide-react'
import PasswordInput from '@/components/auth/password-input'
import PasswordStrength from '@/components/auth/password-strength'

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
      .then((data) => {
        setTokenStatus(data.success ? 'valid' : 'invalid')
      })
      .catch(() => setTokenStatus('invalid'))
  }, [token])

  const handleReset = async () => {
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError('Password must contain uppercase, lowercase, and a number')
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
        setTimeout(() => {
          router.push('/login?message=password-reset')
        }, 3000)
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
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: 'var(--teal)' }} />
        <p className="text-sm" style={{ color: 'rgba(30,68,92,0.5)' }}>Verifying your reset link…</p>
      </div>
    )
  }

  if (tokenStatus === 'invalid') {
    return (
      <div className="text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(249,101,83,0.1)' }}
        >
          <XCircle className="w-7 h-7" style={{ color: 'var(--coral)' }} />
        </div>
        <h2
          className="text-xl font-bold mb-2"
          style={{ color: 'var(--navy)', fontFamily: 'var(--font-heading)' }}
        >
          Link Invalid or Expired
        </h2>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'rgba(30,68,92,0.5)' }}>
          This password reset link is invalid or has expired. Reset links are only valid for 15 minutes.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-bold text-sm transition-all duration-200"
          style={{ background: 'var(--teal)', boxShadow: '0 4px 16px rgba(11,157,169,0.25)' }}
        >
          Request New Link
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(11,157,169,0.1)' }}
        >
          <CheckCircle className="w-7 h-7" style={{ color: 'var(--teal)' }} />
        </div>
        <h2
          className="text-xl font-bold mb-2"
          style={{ color: 'var(--navy)', fontFamily: 'var(--font-heading)' }}
        >
          Password Reset!
        </h2>
        <p className="text-sm mb-2" style={{ color: 'rgba(30,68,92,0.5)' }}>
          Your password has been updated successfully.
        </p>
        <p className="text-xs" style={{ color: 'rgba(30,68,92,0.3)' }}>Redirecting to login…</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-7">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
          style={{ background: 'rgba(11,157,169,0.1)' }}
        >
          <Lock className="w-5 h-5" style={{ color: 'var(--teal)' }} />
        </div>
        <h2
          className="text-2xl font-bold mb-1"
          style={{ color: 'var(--navy)', fontFamily: 'var(--font-heading)' }}
        >
          Set New Password
        </h2>
        <p className="text-sm" style={{ color: 'rgba(30,68,92,0.5)' }}>
          Choose a strong password for your account.
        </p>
      </div>

      {error && (
        <div
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
            New Password
          </label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            className={inputClass}
            style={{
              background: 'var(--cream)',
              borderColor: 'transparent',
              color: 'var(--navy)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--teal)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent' }}
          />
          <PasswordStrength password={password} />
        </div>

        <div>
          <label
            className="block text-xs font-bold uppercase tracking-wide mb-2"
            style={{ color: 'rgba(30,68,92,0.55)' }}
          >
            Confirm Password
          </label>
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleReset()
            }}
            className={inputClass}
            style={{
              background: 'var(--cream)',
              borderColor: 'transparent',
              color: 'var(--navy)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--teal)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent' }}
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs font-medium mt-1.5" style={{ color: '#F96553' }}>Passwords do not match</p>
          )}
          {confirmPassword && password === confirmPassword && password.length >= 8 && (
            <p className="text-xs font-medium mt-1.5" style={{ color: 'var(--teal)' }}>Passwords match</p>
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
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(11,157,169,0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(11,157,169,0.25)'
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Resetting…
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium transition-opacity duration-150 hover:opacity-70"
          style={{ color: 'rgba(30,68,92,0.5)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </div>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div
      className="rounded-3xl p-7 sm:p-9 w-full max-w-[420px]"
      style={{
        background: '#fff',
        boxShadow: '0 4px 32px rgba(30,68,92,0.08), 0 1px 4px rgba(30,68,92,0.04)',
      }}
    >
      <Suspense
        fallback={
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: 'var(--teal)' }} />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
