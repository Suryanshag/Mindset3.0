'use client'

import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '@/lib/validations/auth'
import { z } from 'zod'
import { useState, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react'
import PasswordInput from '@/components/auth/password-input'

type LoginFormData = z.infer<typeof loginSchema>

const inputClass =
  'w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 outline-none border-2'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')
  const message = searchParams.get('message')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

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
    <div
      className="rounded-3xl p-7 sm:p-9 w-full max-w-[420px] relative z-20"
      style={{
        background: 'transparent',
      }}
    >
      <h2
        className="text-2xl font-bold mb-1"
        style={{
          color: 'var(--navy)',
          fontFamily: 'var(--font-heading)',
        }}
      >
        Welcome back
      </h2>
      <p className="text-sm mb-5" style={{ color: 'rgba(30,68,92,0.5)' }}>
        Sign in to continue your journey
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
          className="mb-5 p-3.5 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(249,101,83,0.08)', color: '#991B1B' }}
        >
          {error}
        </div>
      )}

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
              Forgot?
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
              Sign In
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm mt-3" style={{ color: 'rgba(30,68,92,0.5)' }}>
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-bold transition-opacity duration-150 hover:opacity-70"
          style={{ color: 'var(--coral)' }}
        >
          Create one
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <>
      <Suspense
        fallback={
          <div
            className="rounded-3xl p-9 animate-pulse w-full max-w-[420px]"
            style={{
              background: '#fff',
              boxShadow: '0 4px 32px rgba(30,68,92,0.08)',
              height: 420,
            }}
          />
        }
      >
        <LoginForm />
      </Suspense>

      {/* Compassion illustration — absolute at bottom, slides up on mount */}
      <div
        className="fixed bottom-0 left-0 right-0 z-0 flex justify-center pointer-events-none select-none"
        style={{
          animation: 'authSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both',
        }}
      >
        <Image
          src="/images/sections/compassion.webp"
          alt="People showing compassion"
          width={900}
          height={600}
          priority
          className="max-w-[900px] w-full h-auto"
          style={{ opacity: 0.85 }}
        />
      </div>
    </>
  )
}
