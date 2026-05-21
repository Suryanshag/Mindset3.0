'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema } from '@/lib/validations/auth'
import { scorePassword } from '@/lib/validations/password-policy'
import { z } from 'zod'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Loader2, Mail, Lock, Phone, User } from 'lucide-react'
import PasswordInput from '@/components/auth/password-input'
import PasswordStrength from '@/components/auth/password-strength'
import PasswordStrengthBars from '@/components/auth/password-strength-bars'
import AuthShell from '@/components/auth/auth-shell'
import GoogleButton from '@/components/auth/google-button'
import { MindsetLoader } from '@/components/auth/mindset-loader'
import MobileField from '@/components/auth/mobile-field'
import MobileBackButton from '@/components/auth/mobile-back-button'

type RegisterFormData = z.infer<typeof registerSchema>

const inputClass =
  'w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 outline-none border-2'

const OAUTH_ERROR_COPY: Record<string, string> = {
  email_exists:
    'An account with this email already exists. Sign in with your password instead, or use "Forgot password" to reset.',
  OAuthSignin: 'Google sign-in failed. Try again or use email.',
  OAuthCallback: 'Google sign-in failed. Try again or use email.',
  OAuthAccountNotLinked: 'Google sign-in failed. Try again or use email.',
}

const ROLE_HOME: Record<string, string> = { ADMIN: '/admin', DOCTOR: '/doctor', USER: '/user' }

// Shared submit flow. Mobile and desktop forms instantiate their own
// useForm() so DOM nodes don't collide across the lg:hidden / hidden lg:block
// divide (same pattern as /login). The submit logic is server-validated
// against registerApiSchema; client-side validation runs against
// registerSchema which adds confirmPassword on top.
//
// Post-signup redirect target is /user for now. The handoff design + the
// /verify-email "?sent=1" stage decision in docs/phase-1/diff-auth.md §F
// changes that target — but the /verify-email route doesn't handle the
// ?sent=1 query yet, so flipping the redirect now would land users on the
// existing token-validation "invalid link" state. Coupled with the
// /verify-email turn; see PORT_LOG.md.
type SubmitContext = {
  setError: (msg: string | null) => void
  setIsLoading: (v: boolean) => void
  router: ReturnType<typeof useRouter>
  honeypotValue: string
}

async function submitRegister(data: RegisterFormData, ctx: SubmitContext): Promise<void> {
  ctx.setIsLoading(true)
  ctx.setError(null)

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        password: data.password,
        website_url: ctx.honeypotValue,
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      ctx.setError(result.error || 'Registration failed')
      ctx.setIsLoading(false)
      return
    }

    // Honeypot path returns 200 with id="honeypot" — silently bounce to login.
    if (result?.data?.id === 'honeypot') {
      ctx.router.push('/login?message=registered')
      return
    }

    const signInResult = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (signInResult?.error) {
      ctx.router.push('/login')
      return
    }

    // Post-signup landing: /verify-email?sent=1 per Resolved Decision 3.
    // The user is now authed (signIn() above just set the session), so
    // /verify-email's server component reads session.user.email and shows
    // the "check your inbox" stage. Skip-for-now link there falls back
    // to /user; we don't strand the user. Don't reset isLoading on
    // success — keep the loader visible until the component unmounts as
    // the new route renders.
    ctx.router.push('/verify-email?sent=1')
  } catch {
    ctx.setError('Something went wrong. Please try again.')
    ctx.setIsLoading(false)
  }
}

function useRegisterState() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')
  const oauthError = searchParams.get('error')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { data: existingSession, status } = useSession()

  useEffect(() => {
    // Guard against firing during the submit flow. signIn() inside
    // submitRegister updates the session, which would trigger this effect
    // and push to ROLE_HOME ahead of the post-signup /verify-email?sent=1
    // push the submit handler makes — losing the verification-prompt
    // intent. isLoading stays true through navigation; the effect only
    // fires for actual "user visits /register while already authed."
    if (isLoading) return
    if (status === 'authenticated' && existingSession?.user) {
      router.replace(callbackUrl ?? ROLE_HOME[existingSession.user.role ?? ''] ?? '/user')
    }
  }, [status, existingSession, callbackUrl, router, isLoading])

  const initialError = useMemo(() => {
    if (!oauthError) return null
    return OAUTH_ERROR_COPY[oauthError] ?? null
  }, [oauthError])

  useEffect(() => {
    if (initialError) setError(initialError)
  }, [initialError])

  return { router, callbackUrl, error, setError, isLoading, setIsLoading }
}

// Hidden honeypot field. Same markup as the desktop variant so the route
// handler sees an identical body shape. Render once per form variant.
function HoneypotField({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null> }) {
  return (
    <div
      inert
      aria-hidden="true"
      style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
    >
      <label htmlFor="contact_via_url">Leave this field blank</label>
      <input
        ref={inputRef}
        id="contact_via_url"
        name="website_url"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  )
}

type RegisterState = ReturnType<typeof useRegisterState>

// ─── Mobile variant — 2-step flow ───────────────────────────────────────
function MobileRegisterForm({ state }: { state: RegisterState }) {
  const [step, setStep] = useState<0 | 1>(0)
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const honeypotRef = useRef<HTMLInputElement>(null)

  const form: UseFormReturn<RegisterFormData> = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
  })

  const passwordValue = form.watch('password', '')

  const onSubmit = (data: RegisterFormData) =>
    submitRegister(data, {
      setError: state.setError,
      setIsLoading: state.setIsLoading,
      router: state.router,
      honeypotValue: honeypotRef.current?.value ?? '',
    })

  const handleAdvance = async () => {
    const valid = await form.trigger('name')
    if (valid) setStep(1)
  }

  const handleBack = () => {
    if (step === 0) state.router.push('/welcome')
    else setStep(0)
  }

  // Submit is disabled on step 1 until: name passed step 0 validation, T&C
  // checked, and the password score reflects a server-policy pass. The
  // form's resolver still runs full validation on submit; this gate is
  // UX-belt-and-suspenders so the user doesn't tap "Create account" only
  // to see the same field rejected.
  const passwordScore = scorePassword(passwordValue)
  const canSubmit = agreedToTerms && passwordScore.meetsPolicy

  return (
    <div className="px-6 pt-3 pb-6 flex flex-col" style={{ minHeight: '100%' }}>
      {state.isLoading && <MindsetLoader message="Creating your account…" />}

      {/* Header — back button + 2-step progress bar */}
      <header className="flex items-center gap-3.5 mb-6">
        <MobileBackButton
          onClick={handleBack}
          ariaLabel={step === 0 ? 'Back to welcome' : 'Back to step 1'}
        />
        <div className="flex-1 flex gap-1.5" aria-label={`Step ${step + 1} of 2`}>
          {[0, 1].map((i) => (
            <span
              key={i}
              aria-hidden="true"
              className="block flex-1 rounded-[2px] transition-colors duration-300"
              style={{
                height: 4,
                background: i <= step ? 'var(--primary)' : 'var(--border-strong)',
              }}
            />
          ))}
        </div>
      </header>

      {state.error && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-2xl text-sm font-medium"
          style={{ background: 'var(--accent-tint)', color: 'var(--accent-deep)' }}
        >
          {state.error}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col" noValidate>
        <HoneypotField inputRef={honeypotRef} />

        {step === 0 ? (
          // ─── Step 0 — Name ───────────────────────────────────────────
          // key forces React to treat step-0 and step-1 as distinct
          // subtrees; without it, React reconciles the two <div> blocks
          // and reuses the same DOM <input> element across steps, which
          // leaks the previous step's typed value into the new step's
          // first field.
          <div key="step-0" style={{ animation: 'ms-fade-up .35s both' }}>
            <p
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--primary)' }}
            >
              Welcome
            </p>
            <h1
              className="mt-1.5"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 32,
                lineHeight: 1.0,
                color: 'var(--text)',
              }}
            >
              What should we<br />call you?
            </h1>
            <p
              className="mt-2.5 text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              Used in your greeting and journal — as casual as you like.
            </p>

            <div className="mt-6">
              <MobileField
                label="Your name"
                icon={<User size={18} strokeWidth={1.7} />}
                type="text"
                autoComplete="name"
                placeholder="e.g. Aanya"
                fieldError={form.formState.errors.name?.message}
                {...form.register('name')}
              />
            </div>

            <p
              className="mt-3 text-xs"
              style={{ color: 'var(--text-faint)' }}
            >
              You can change this anytime.
            </p>
          </div>
        ) : (
          // ─── Step 1 — Credentials ────────────────────────────────────
          <div key="step-1" style={{ animation: 'ms-fade-up .35s both' }}>
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
                lineHeight: 1.0,
                color: 'var(--text)',
              }}
            >
              Your sign-in<br />details.
            </h1>
            <p
              className="mt-2.5 text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              We use email for session reminders and gentle nudges only.
            </p>

            <div className="mt-6 flex flex-col gap-3.5">
              <MobileField
                label="Email"
                icon={<Mail size={18} strokeWidth={1.7} />}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                fieldError={form.formState.errors.email?.message}
                {...form.register('email')}
              />

              <div>
                <MobileField
                  label="Password"
                  icon={<Lock size={18} strokeWidth={1.7} />}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Password"
                  fieldError={form.formState.errors.password?.message}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-xs font-bold inline-flex items-center justify-center transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 rounded"
                      style={{
                        color: 'var(--primary)',
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
                <PasswordStrengthBars password={passwordValue} />
              </div>

              <MobileField
                label="Confirm password"
                icon={<Lock size={18} strokeWidth={1.7} />}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Confirm password"
                fieldError={form.formState.errors.confirmPassword?.message}
                {...form.register('confirmPassword')}
              />

              <MobileField
                label="Phone (optional)"
                icon={<Phone size={18} strokeWidth={1.7} />}
                type="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                fieldError={form.formState.errors.phone?.message}
                {...form.register('phone')}
              />
            </div>

            <label
              className="flex items-start gap-2.5 mt-5 text-xs cursor-pointer"
              style={{ color: 'var(--text-muted)', minHeight: 44, padding: '6px 0' }}
            >
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 flex-shrink-0"
                style={{ accentColor: 'var(--primary)', width: 18, height: 18 }}
                aria-describedby="tc-description"
              />
              <span id="tc-description">
                I agree to Mindset&apos;s{' '}
                <Link
                  href="/terms-of-use"
                  className="font-bold underline underline-offset-2 hover:opacity-80"
                  style={{ color: 'var(--primary)' }}
                >
                  Terms of Use
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy-policy"
                  className="font-bold underline underline-offset-2 hover:opacity-80"
                  style={{ color: 'var(--primary)' }}
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>
        )}

        {/* Bottom CTA — pinned via mt-auto so the page layout stays
            stable regardless of which step renders. */}
        <div className="mt-auto pt-6">
          {step === 0 ? (
            <button
              type="button"
              onClick={handleAdvance}
              className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-full text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: 'var(--primary)', color: 'var(--on-dark)' }}
            >
              Next
              <ArrowRight size={16} strokeWidth={2.2} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={state.isLoading || !canSubmit}
              className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-full text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--primary)', color: 'var(--on-dark)' }}
            >
              {state.isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating your account…
                </>
              ) : (
                <>
                  Create account
                  <Check size={16} strokeWidth={2.4} />
                </>
              )}
            </button>
          )}

          <p
            className="mt-4 text-center text-xs"
            style={{ color: 'var(--text-faint)', lineHeight: 1.55 }}
          >
            Therapist? Accounts are created by our admin team —{' '}
            <Link
              href="/contact"
              className="font-bold underline underline-offset-2"
              style={{ color: 'var(--text-muted)' }}
            >
              request access
            </Link>
            .
          </p>

          <p
            className="mt-5 text-center text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Already have an account?{' '}
            <Link
              href={
                state.callbackUrl
                  ? `/login?callbackUrl=${encodeURIComponent(state.callbackUrl)}`
                  : '/login'
              }
              className="font-bold transition-opacity hover:opacity-70"
              style={{ color: 'var(--primary)' }}
            >
              Sign in
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
        </div>
      </form>
    </div>
  )
}

// ─── Desktop variant — unchanged from before sub-phase 1.4 ──────────────
function DesktopRegisterForm({ state }: { state: RegisterState }) {
  const honeypotRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  const passwordValue = watch('password', '')

  const onSubmit = (data: RegisterFormData) =>
    submitRegister(data, {
      setError: state.setError,
      setIsLoading: state.setIsLoading,
      router: state.router,
      honeypotValue: honeypotRef.current?.value ?? '',
    })

  function inputStyle(fieldError: boolean) {
    return {
      background: 'var(--cream)',
      borderColor: fieldError ? '#F96553' : 'transparent',
      color: 'var(--navy)',
    }
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>, hasError: boolean) {
    if (!hasError) e.currentTarget.style.borderColor = 'var(--teal)'
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>, hasError: boolean) {
    if (!hasError) e.currentTarget.style.borderColor = 'transparent'
  }

  return (
    <div>
      {state.isLoading && <MindsetLoader message="Creating your account…" />}

      <h2
        className="text-2xl sm:text-3xl font-bold mb-1"
        style={{ color: 'var(--navy)', fontFamily: 'var(--font-heading)' }}
      >
        Create your account
      </h2>
      <p className="text-sm mb-6" style={{ color: 'rgba(30,68,92,0.55)' }}>
        Join the Mindset community.
      </p>

      {state.error && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-2xl text-sm font-medium"
          style={{ background: 'rgba(249,101,83,0.08)', color: '#991B1B' }}
        >
          {state.error}
        </div>
      )}

      <GoogleButton callbackUrl="/user" />

      <div className="flex items-center gap-3 my-5" aria-hidden="true">
        <div className="flex-1 h-px" style={{ background: 'rgba(30,68,92,0.12)' }} />
        <span className="text-xs uppercase tracking-wide" style={{ color: 'rgba(30,68,92,0.4)' }}>
          or continue with email
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(30,68,92,0.12)' }} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <HoneypotField inputRef={honeypotRef} />

        <div>
          <label
            htmlFor="name"
            className="block text-xs font-bold uppercase tracking-wide mb-2"
            style={{ color: 'rgba(30,68,92,0.55)' }}
          >
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            {...register('name')}
            className={inputClass}
            style={inputStyle(!!errors.name)}
            onFocus={(e) => handleFocus(e, !!errors.name)}
            onBlur={(e) => handleBlur(e, !!errors.name)}
            placeholder="Your full name"
          />
          {errors.name && (
            <p className="mt-1.5 text-xs font-medium" style={{ color: '#F96553' }}>
              {errors.name.message}
            </p>
          )}
        </div>

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
            style={inputStyle(!!errors.email)}
            onFocus={(e) => handleFocus(e, !!errors.email)}
            onBlur={(e) => handleBlur(e, !!errors.email)}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-1.5 text-xs font-medium" style={{ color: '#F96553' }}>
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-xs font-bold uppercase tracking-wide mb-2"
            style={{ color: 'rgba(30,68,92,0.55)' }}
          >
            Phone <span style={{ color: 'rgba(30,68,92,0.35)' }}>(optional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            {...register('phone')}
            className={inputClass}
            style={inputStyle(!!errors.phone)}
            onFocus={(e) => handleFocus(e, !!errors.phone)}
            onBlur={(e) => handleBlur(e, !!errors.phone)}
            placeholder="+91 98765 43210"
          />
          {errors.phone && (
            <p className="mt-1.5 text-xs font-medium" style={{ color: '#F96553' }}>
              {errors.phone.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-bold uppercase tracking-wide mb-2"
            style={{ color: 'rgba(30,68,92,0.55)' }}
          >
            Password
          </label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            {...register('password')}
            className={inputClass}
            style={inputStyle(!!errors.password)}
            onFocus={(e) => handleFocus(e, !!errors.password)}
            onBlur={(e) => handleBlur(e, !!errors.password)}
            placeholder="Password"
          />
          <PasswordStrength password={passwordValue} />
          {errors.password && (
            <p className="mt-1.5 text-xs font-medium" style={{ color: '#F96553' }}>
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-bold uppercase tracking-wide mb-2"
            style={{ color: 'rgba(30,68,92,0.55)' }}
          >
            Confirm password
          </label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            {...register('confirmPassword')}
            className={inputClass}
            style={inputStyle(!!errors.confirmPassword)}
            onFocus={(e) => handleFocus(e, !!errors.confirmPassword)}
            onBlur={(e) => handleBlur(e, !!errors.confirmPassword)}
            placeholder="Confirm password"
          />
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs font-medium" style={{ color: '#F96553' }}>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={state.isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 mt-2"
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
              Creating account…
            </>
          ) : (
            <>
              Create account
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm mt-5" style={{ color: 'rgba(30,68,92,0.55)' }}>
        Already have an account?{' '}
        <Link
          href={
            state.callbackUrl
              ? `/login?callbackUrl=${encodeURIComponent(state.callbackUrl)}`
              : '/login'
          }
          className="font-bold transition-opacity duration-150 hover:opacity-70"
          style={{ color: 'var(--coral)' }}
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}

// Page-level wrapper that calls useRegisterState() exactly once and
// passes the result to both viewport variants. With separate hook calls
// per variant, the auto-redirect-when-authed useEffect runs twice on
// session changes — the hidden-variant's isLoading remains false during
// the visible variant's submit, so it racingly pushes to ROLE_HOME and
// the post-signup intent (/verify-email?sent=1) is lost.
function RegisterPageInner() {
  const state = useRegisterState()
  return (
    <>
      <div className="lg:hidden">
        <MobileRegisterForm state={state} />
      </div>
      <div className="hidden lg:block">
        <DesktopRegisterForm state={state} />
      </div>
    </>
  )
}

export default function RegisterPage() {
  return (
    <AuthShell headline="Build a steady, kinder relationship with yourself.">
      <Suspense
        fallback={<div className="animate-pulse" style={{ minHeight: 480 }} aria-hidden="true" />}
      >
        <RegisterPageInner />
      </Suspense>
    </AuthShell>
  )
}
