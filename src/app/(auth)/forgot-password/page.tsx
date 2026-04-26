'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react'

const inputClass =
  'w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 outline-none border-2'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
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
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="rounded-3xl p-7 sm:p-9 w-full max-w-[420px]"
      style={{
        background: '#fff',
        boxShadow: '0 4px 32px rgba(30,68,92,0.08), 0 1px 4px rgba(30,68,92,0.04)',
      }}
    >
      {submitted ? (
        <div className="text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(11,157,169,0.1)' }}
          >
            <CheckCircle className="w-7 h-7" style={{ color: 'var(--teal)' }} />
          </div>
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--navy)', fontFamily: 'var(--font-heading)' }}
          >
            Check Your Email
          </h2>
          <p className="text-sm mb-5 leading-relaxed" style={{ color: 'rgba(30,68,92,0.55)' }}>
            If an account exists for <strong style={{ color: 'var(--navy)' }}>{email}</strong>, you will receive a password reset link within a few minutes.
          </p>
          <p
            className="text-xs font-medium rounded-xl p-3 mb-6"
            style={{ background: 'rgba(255,170,17,0.08)', color: '#92400E' }}
          >
            The link expires in 15 minutes.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity duration-150 hover:opacity-70"
            style={{ color: 'var(--teal)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-7">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(11,157,169,0.1)' }}
            >
              <Mail className="w-5 h-5" style={{ color: 'var(--teal)' }} />
            </div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: 'var(--navy)', fontFamily: 'var(--font-heading)' }}
            >
              Forgot Password?
            </h2>
            <p className="text-sm" style={{ color: 'rgba(30,68,92,0.5)' }}>
              Enter your email and we&apos;ll send you a reset link.
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
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wide mb-2"
                style={{ color: 'rgba(30,68,92,0.55)' }}
              >
                Email Address
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
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--teal)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent' }}
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
                  Sending…
                </>
              ) : (
                'Send Reset Link'
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
      )}
    </div>
  )
}
