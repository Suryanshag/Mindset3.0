'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema } from '@/lib/validations/auth'
import { z } from 'zod'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2 } from 'lucide-react'
import PasswordInput from '@/components/auth/password-input'
import PasswordStrength from '@/components/auth/password-strength'

type RegisterFormData = z.infer<typeof registerSchema>

const inputClass =
  'w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 outline-none border-2'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const passwordValue = watch('password', '')

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Registration failed')
        return
      }

      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (signInResult?.error) {
        router.push('/login')
        return
      }

      router.push('/user')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

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
    <div
      className="rounded-3xl p-7 sm:p-8 w-full max-w-[640px]"
      style={{
        background: '#fff',
        boxShadow: '0 4px 32px rgba(30,68,92,0.08), 0 1px 4px rgba(30,68,92,0.04)',
      }}
    >
      <h2
        className="text-2xl font-bold mb-1"
        style={{
          color: 'var(--navy)',
          fontFamily: 'var(--font-heading)',
        }}
      >
        Create your account
      </h2>
      <p className="text-sm mb-5" style={{ color: 'rgba(30,68,92,0.5)' }}>
        Join the Mindset community
      </p>

      {error && (
        <div
          className="mb-4 p-3 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(249,101,83,0.08)', color: '#991B1B' }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* 2-column grid on desktop, single column on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-bold uppercase tracking-wide mb-2"
              style={{ color: 'rgba(30,68,92,0.55)' }}
            >
              Full Name
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
              Phone Number
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
              placeholder="9876543210"
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
              placeholder="Create a strong password"
            />
            <PasswordStrength password={passwordValue} />
            {errors.password && (
              <p className="mt-1.5 text-xs font-medium" style={{ color: '#F96553' }}>
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm password — full width */}
          <div className="sm:col-span-2">
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-bold uppercase tracking-wide mb-2"
              style={{ color: 'rgba(30,68,92,0.55)' }}
            >
              Confirm Password
            </label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              {...register('confirmPassword')}
              className={inputClass}
              style={inputStyle(!!errors.confirmPassword)}
              onFocus={(e) => handleFocus(e, !!errors.confirmPassword)}
              onBlur={(e) => handleBlur(e, !!errors.confirmPassword)}
              placeholder="Re-enter your password"
            />
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs font-medium" style={{ color: '#F96553' }}>
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 mt-5"
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
              <Loader2 size={16} className="animate-spin" />
              Creating account…
            </>
          ) : (
            <>
              Create Account
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px" style={{ background: 'rgba(30,68,92,0.08)' }} />
        <span className="text-xs" style={{ color: 'rgba(30,68,92,0.3)' }}>or</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(30,68,92,0.08)' }} />
      </div>

      <p className="text-center text-sm" style={{ color: 'rgba(30,68,92,0.5)' }}>
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-bold transition-opacity duration-150 hover:opacity-70"
          style={{ color: 'var(--coral)' }}
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
