'use client'

import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '@/lib/validations/auth'
import { z } from 'zod'
import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Loader2 } from 'lucide-react'
import PasswordInput from '@/components/auth/password-input'
import AuthShell from '@/components/auth/auth-shell'
import GoogleButton from '@/components/auth/google-button'

type LoginFormData = z.infer<typeof loginSchema>

const inputClass =
  'w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 outline-none border-2'

const OAUTH_ERROR_COPY: Record<string, string> = {
  email_exists:
    'An account with this email already exists. Sign in with your password below, or use "Forgot password" to reset it.',
  OAuthSignin: 'Google sign-in failed. Try again or use email.',
  OAuthCallback: 'Google sign-in failed. Try again or use email.',
  OAuthAccountNotLinked: 'Google sign-in failed. Try again or use email.',
  Callback: 'Google sign-in failed. Try again or use email.',
  AccessDenied: 'You cancelled the Google sign-in.',
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')
  const message = searchParams.get('message')
  const oauthError = searchParams.get('error')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const initialError = useMemo(() => {
    if (!oauthError) return null
    return OAUTH_ERROR_COPY[oauthError] ?? 'Sign-in failed. Try again.'
  }, [oauthError])

  useEffect(() => {
    if (initialError) setError(initialError)
  }, [initialError])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        return
      }

      const sessionRes = await fetch('/api/auth/me')
      const sessionData = await sessionRes.json()
      const role = sessionData?.data?.role

      if (callbackUrl) {
        router.push(callbackUrl)
        return
      }

      if (role === 'ADMIN') router.push('/admin')
      else if (role === 'DOCTOR') router.push('/doctor')
      else router.push('/user')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h2
        className="text-2xl sm:text-3xl font-bold mb-1"
        style={{ color: 'var(--navy)', fontFamily: 'var(--font-heading)' }}
      >
        Welcome back
      </h2>
      <p className="text-sm mb-6" style={{ color: 'rgba(30,68,92,0.55)' }}>
        Sign in to continue your journey.
      </p>

      {message === 'password-reset' && (
        <div
          className="mb-5 p-3.5 rounded-xl flex items-start gap-3 text-sm font-medium"
          style={{ background: 'rgba(11,157,169,0.08)', color: '#065F46' }}
        >
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--teal)' }} />
          Password reset successfully! Please log in with your new password.
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(249,101,83,0.08)', color: '#991B1B' }}
        >
          {error}
        </div>
      )}

      <GoogleButton callbackUrl={callbackUrl ?? '/user'} />

      <div className="flex items-center gap-3 my-5" aria-hidden="true">
        <div className="flex-1 h-px" style={{ background: 'rgba(30,68,92,0.12)' }} />
        <span className="text-xs uppercase tracking-wide" style={{ color: 'rgba(30,68,92,0.4)' }}>
          or continue with email
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(30,68,92,0.12)' }} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold uppercase tracking-wide mb-2"
            style={{ color: 'rgba(30,68,92,0.55)' }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className={inputClass}
            style={{
              background: 'var(--cream)',
              borderColor: errors.email ? '#F96553' : 'transparent',
              color: 'var(--navy)',
            }}
            onFocus={(e) => {
              if (!errors.email) e.currentTarget.style.borderColor = 'var(--teal)'
            }}
            onBlur={(e) => {
              if (!errors.email) e.currentTarget.style.borderColor = 'transparent'
            }}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-1.5 text-xs font-medium" style={{ color: '#F96553' }}>
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="password"
              className="block text-xs font-bold uppercase tracking-wide"
              style={{ color: 'rgba(30,68,92,0.55)' }}
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold transition-opacity duration-150 hover:opacity-70"
              style={{ color: 'var(--teal)' }}
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            {...register('password')}
            className={inputClass}
            style={{
              background: 'var(--cream)',
              borderColor: errors.password ? '#F96553' : 'transparent',
              color: 'var(--navy)',
            }}
            onFocus={(e) => {
              if (!errors.password) e.currentTarget.style.borderColor = 'var(--teal)'
            }}
            onBlur={(e) => {
              if (!errors.password) e.currentTarget.style.borderColor = 'transparent'
            }}
            placeholder="Enter your password"
          />
          {errors.password && (
            <p className="mt-1.5 text-xs font-medium" style={{ color: '#F96553' }}>
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50"
          style={{
            background: 'var(--teal)',
            boxShadow: '0 4px 16px rgba(11,157,169,0.25)',
          }}
          onMouseEnter={(e) => {
            if (isLoading) return
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
              <Loader2 size={16} className="animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm mt-5" style={{ color: 'rgba(30,68,92,0.55)' }}>
        New here?{' '}
        <Link
          href="/register"
          className="font-bold transition-opacity duration-150 hover:opacity-70"
          style={{ color: 'var(--coral)' }}
        >
          Create account
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <div className="animate-pulse" style={{ minHeight: 420 }} aria-hidden="true" />
        }
      >
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
