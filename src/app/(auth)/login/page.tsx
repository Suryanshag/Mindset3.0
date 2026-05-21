'use client'

import { signIn, getSession, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '@/lib/validations/auth'
import { z } from 'zod'
import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Loader2, Mail, Lock } from 'lucide-react'
import PasswordInput from '@/components/auth/password-input'
import AuthShell from '@/components/auth/auth-shell'
import GoogleButton from '@/components/auth/google-button'
import { MindsetLoader } from '@/components/auth/mindset-loader'
import MobileField from '@/components/auth/mobile-field'
import MobileBackButton from '@/components/auth/mobile-back-button'

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

const ROLE_HOME: Record<string, string> = { ADMIN: '/admin', DOCTOR: '/doctor', USER: '/user' }

// Shared submit flow. Each viewport variant (mobile / desktop) instantiates
// its own RHF form and calls back into this on submit so they don't have to
// share useForm() state (which would force a single field's value to flow
// through both DOM trees and create RHF ref-collision footguns).
//
// Lockout policy: a real lockout (5 failed attempts) redirects to
// /account-locked?until=<ISO8601>. The inline `setError(...)` branch is
// preserved as graceful-degradation fallback if router.push throws —
// the user still sees the same minutes-remaining message inline and is
// never stranded on a half-handled error.
type SubmitContext = {
  setError: (msg: string | null) => void
  setIsLoading: (v: boolean) => void
  router: ReturnType<typeof useRouter>
  callbackUrl: string | null
}

async function submitLogin(data: LoginFormData, ctx: SubmitContext): Promise<void> {
  ctx.setIsLoading(true)
  ctx.setError(null)

  try {
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      try {
        const lockRes = await fetch('/api/auth/check-lock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email }),
        })
        if (lockRes.ok) {
          const lockData = (await lockRes.json()) as {
            locked: boolean
            until?: string
          }
          if (lockData.locked && lockData.until) {
            // Primary path: redirect to the dedicated lockout page with
            // the ISO8601 timestamp so it can render a live countdown.
            // The inline-message fallback below stays as graceful
            // degradation if router.push throws for any reason.
            try {
              ctx.router.push(
                `/account-locked?until=${encodeURIComponent(lockData.until)}`
              )
              // Keep loading state truthy through navigation so the form
              // doesn't visibly re-enable before the next page paints.
              return
            } catch {
              const mins = Math.max(
                1,
                Math.ceil((new Date(lockData.until).getTime() - Date.now()) / 60000)
              )
              ctx.setError(
                `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`
              )
              ctx.setIsLoading(false)
              return
            }
          }
        }
      } catch {
        // Fall through to generic message
      }
      ctx.setError('Invalid email or password')
      ctx.setIsLoading(false)
      return
    }

    // Read role from the freshly-issued JWT session instead of round-
    // tripping /api/user/me. getSession() decodes the cookie via
    // /api/auth/session which is JWT-only (no DB hit) and gets cached
    // by the next-auth client after this call.
    const session = await getSession()
    const role = session?.user?.role

    // Don't reset isLoading on success — keep the loader visible until the
    // component unmounts when the dashboard renders. router.push() is
    // non-blocking so a finally{setIsLoading(false)} would flash the login
    // page before navigation completes.
    if (ctx.callbackUrl) {
      ctx.router.push(ctx.callbackUrl)
      return
    }

    if (role === 'ADMIN') ctx.router.push('/admin')
    else if (role === 'DOCTOR') ctx.router.push('/doctor')
    else ctx.router.push('/user')
  } catch {
    ctx.setError('Something went wrong. Please try again.')
    ctx.setIsLoading(false)
  }
}

// Shared header logic — redirect already-signed-in users, decode the OAuth
// error param. Returns the form-shaped state both variants consume.
function useLoginState() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')
  const message = searchParams.get('message')
  const oauthError = searchParams.get('error')

  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { data: existingSession, status } = useSession()

  useEffect(() => {
    if (status === 'authenticated' && existingSession?.user) {
      const dest = callbackUrl ?? ROLE_HOME[existingSession.user.role ?? ''] ?? '/user'
      router.replace(dest)
    }
  }, [status, existingSession, callbackUrl, router])

  const initialError = useMemo(() => {
    if (!oauthError) return null
    return OAUTH_ERROR_COPY[oauthError] ?? 'Sign-in failed. Try again.'
  }, [oauthError])

  useEffect(() => {
    if (initialError) setError(initialError)
  }, [initialError])

  return {
    router,
    callbackUrl,
    message,
    error,
    setError,
    isLoading,
    setIsLoading,
  }
}

// ─── Mobile variant ──────────────────────────────────────────────────────
function MobileLoginForm() {
  const state = useLoginState()
  const [showPassword, setShowPassword] = useState(false)

  const form: UseFormReturn<LoginFormData> = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginFormData) =>
    submitLogin(data, {
      setError: state.setError,
      setIsLoading: state.setIsLoading,
      router: state.router,
      callbackUrl: state.callbackUrl,
    })

  return (
    <div className="px-6 pt-3 pb-6 flex flex-col" style={{ minHeight: '100%' }}>
      {state.isLoading && <MindsetLoader message="Signing you in…" />}

      <div className="mb-5">
        <MobileBackButton href="/welcome" ariaLabel="Back to welcome" />
      </div>

      <div style={{ animation: 'ms-fade-up .6s both' }}>
        <p
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: 'var(--primary)' }}
        >
          Welcome back
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
          Good to see you<br />again.
        </h1>
      </div>

      {state.message === 'password-reset' && (
        <div
          className="mt-5 p-3.5 rounded-xl flex items-start gap-3 text-sm font-medium"
          style={{ background: 'var(--primary-tint)', color: 'var(--primary)' }}
        >
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          Password reset successfully. Sign in with your new password.
        </div>
      )}

      {state.error && (
        <div
          role="alert"
          className="mt-5 p-3.5 rounded-xl text-sm font-medium"
          style={{ background: 'var(--accent-tint)', color: 'var(--accent-deep)' }}
        >
          {state.error}
        </div>
      )}

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-7 flex flex-col gap-3.5"
        style={{ animation: 'ms-fade-up .6s .1s both' }}
        noValidate
      >
        <MobileField
          label="Email"
          icon={<Mail size={18} strokeWidth={1.7} />}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          fieldError={form.formState.errors.email?.message}
          {...form.register('email')}
        />
        <MobileField
          label="Password"
          icon={<Lock size={18} strokeWidth={1.7} />}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Password"
          fieldError={form.formState.errors.password?.message}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-xs font-bold inline-flex items-center justify-center transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 rounded"
              style={{
                color: 'var(--primary)',
                // WCAG 2.5.5 minimum tap target — the visible text is small
                // but the hit area extends out via padding so the touch
                // surface meets 44x44 without inflating the card height.
                minWidth: 44,
                minHeight: 44,
                padding: '0 8px',
                margin: '-10px -8px -10px 0',
                outlineColor: 'var(--primary)',
              }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          }
          {...form.register('password')}
        />

        <Link
          href="/forgot-password"
          className="self-end text-xs font-bold inline-flex items-center transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded"
          style={{
            color: 'var(--primary)',
            // WCAG 2.5.5 — same 44px minimum touch height.
            minHeight: 44,
            padding: '0 4px',
            outlineColor: 'var(--primary)',
          }}
        >
          Forgot password?
        </Link>

        <button
          type="submit"
          disabled={state.isLoading}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 py-4 rounded-full text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-70"
          style={{
            background: 'var(--primary)',
            color: 'var(--on-dark)',
            animation: 'ms-fade-up .6s .2s both',
          }}
        >
          {state.isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Signing you in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <p
        className="mt-5 text-center text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        New to Mindset?{' '}
        <Link
          href={
            state.callbackUrl
              ? `/register?callbackUrl=${encodeURIComponent(state.callbackUrl)}`
              : '/register'
          }
          className="font-bold transition-opacity hover:opacity-70"
          style={{ color: 'var(--primary)' }}
        >
          Create one
        </Link>
      </p>

      <div className="flex items-center gap-3 my-5" aria-hidden="true">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--text-faint)' }}
        >
          or continue with
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      <GoogleButton callbackUrl={state.callbackUrl ?? '/user'} />

      <p
        className="mt-auto pt-6 text-center text-[11px] leading-relaxed"
        style={{ color: 'var(--text-faint)' }}
      >
        Mindset cares about your privacy — all sessions are end-to-end encrypted.
      </p>
    </div>
  )
}

// ─── Desktop variant — unchanged visual from before sub-phase 1.4 ───────
function DesktopLoginForm() {
  const state = useLoginState()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = (data: LoginFormData) =>
    submitLogin(data, {
      setError: state.setError,
      setIsLoading: state.setIsLoading,
      router: state.router,
      callbackUrl: state.callbackUrl,
    })

  return (
    <div>
      {state.isLoading && <MindsetLoader message="Signing you in…" />}

      <h2
        className="text-2xl sm:text-3xl font-bold mb-1"
        style={{ color: 'var(--navy)', fontFamily: 'var(--font-heading)' }}
      >
        Welcome back
      </h2>
      <p className="text-sm mb-6" style={{ color: 'rgba(30,68,92,0.55)' }}>
        Sign in to continue your journey.
      </p>

      {state.message === 'password-reset' && (
        <div
          className="mb-5 p-3.5 rounded-xl flex items-start gap-3 text-sm font-medium"
          style={{ background: 'rgba(11,157,169,0.08)', color: '#065F46' }}
        >
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--teal)' }} />
          Password reset successfully! Please log in with your new password.
        </div>
      )}

      {state.error && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(249,101,83,0.08)', color: '#991B1B' }}
        >
          {state.error}
        </div>
      )}

      <GoogleButton callbackUrl={state.callbackUrl ?? '/user'} />

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
            placeholder="Password"
          />
          {errors.password && (
            <p className="mt-1.5 text-xs font-medium" style={{ color: '#F96553' }}>
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={state.isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50"
          style={{
            background: 'var(--teal)',
            boxShadow: '0 4px 16px rgba(11,157,169,0.25)',
          }}
          onMouseEnter={(e) => {
            if (state.isLoading) return
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(11,157,169,0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(11,157,169,0.25)'
          }}
        >
          {state.isLoading ? (
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
          href={
            state.callbackUrl
              ? `/register?callbackUrl=${encodeURIComponent(state.callbackUrl)}`
              : '/register'
          }
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
        {/* Mobile chrome — handoff layout. Lives inside the AuthShell's
            form panel (the right column on lg+ is suppressed by the
            wrapper below). */}
        <div className="lg:hidden">
          <MobileLoginForm />
        </div>
        {/* Desktop chrome — existing layout, unchanged. */}
        <div className="hidden lg:block">
          <DesktopLoginForm />
        </div>
      </Suspense>
    </AuthShell>
  )
}
