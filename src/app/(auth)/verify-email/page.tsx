'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Loader2, XCircle } from 'lucide-react'
import AuthShell from '@/components/auth/auth-shell'

type Status = 'verifying' | 'success' | 'expired' | 'invalid' | 'used'

function statusFromError(err: string | undefined): Status {
  if (err === 'expired') return 'expired'
  if (err === 'used') return 'used'
  return 'invalid'
}

function VerifyEmailInner() {
  const params = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState<Status>('verifying')

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/auth/email/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const data = await res.json()
        if (cancelled) return
        if (res.ok && data.success) {
          setStatus('success')
        } else {
          setStatus(statusFromError(data?.error))
        }
      } catch {
        if (!cancelled) setStatus('invalid')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  if (status === 'verifying') {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: 'var(--teal)' }} />
        <p className="text-sm" style={{ color: 'rgba(30,68,92,0.55)' }}>
          Verifying your email…
        </p>
      </div>
    )
  }

  if (status === 'success') {
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
          Your email is verified
        </h2>
        <p className="text-sm mb-6" style={{ color: 'rgba(30,68,92,0.55)' }}>
          You can now book sessions and use every part of Mindset.
        </p>
        <Link
          href="/user"
          className="inline-flex items-center gap-2 px-5 py-3 text-white rounded-xl font-bold text-sm transition-all duration-200"
          style={{ background: 'var(--teal)', boxShadow: '0 4px 16px rgba(11,157,169,0.25)' }}
        >
          Go to your dashboard
        </Link>
      </div>
    )
  }

  const copy: Record<Exclude<Status, 'verifying' | 'success'>, { title: string; body: string }> = {
    expired: {
      title: 'This link has expired',
      body: 'Verification links are valid for 24 hours. Request a fresh one from your dashboard and try again.',
    },
    invalid: {
      title: 'Link not recognised',
      body: 'This verification link is invalid. It may have been copied incorrectly — try requesting a new one.',
    },
    used: {
      title: 'Link already used',
      body: 'This verification link has already been used. If your email is verified, you can just sign in.',
    },
  }
  const text = copy[status]

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
        {text.title}
      </h2>
      <p className="text-sm mb-6 leading-relaxed" style={{ color: 'rgba(30,68,92,0.55)' }}>
        {text.body}
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/user"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white transition-all duration-200"
          style={{ background: 'var(--teal)', boxShadow: '0 4px 16px rgba(11,157,169,0.25)' }}
        >
          Open dashboard
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-200"
          style={{ background: 'var(--cream)', color: 'var(--navy)' }}
        >
          Back to login
        </Link>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <AuthShell headline="One quick check, and you're set.">
      <Suspense
        fallback={
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: 'var(--teal)' }} />
          </div>
        }
      >
        <VerifyEmailInner />
      </Suspense>
    </AuthShell>
  )
}
