'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Loader2, XCircle } from 'lucide-react'
import { broadcastEmailVerified } from '@/lib/use-email-verified-signal'

type Status = 'verifying' | 'success' | 'expired' | 'invalid' | 'used'

function statusFromError(err: string | undefined): Status {
  if (err === 'expired') return 'expired'
  if (err === 'used') return 'used'
  return 'invalid'
}

// Token-validation flow — preserves all five existing states (verifying,
// success, expired, invalid, used) with handoff visual treatment on
// mobile and the legacy desktop chrome on lg+. No new POST behavior.

const ERROR_COPY: Record<Exclude<Status, 'verifying' | 'success'>, { title: string; body: string }> = {
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

export default function VerifyEmailTokenFlow() {
  const params = useSearchParams()
  const router = useRouter()
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
          // Broadcast so banners and inline errors in other tabs (or this
          // tab's prior route) clear themselves immediately.
          broadcastEmailVerified()
          // Refresh the router so when the user clicks "Go to dashboard"
          // below, the destination /user route doesn't serve stale RSC.
          router.refresh()
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
  }, [token, router])

  return (
    <>
      <div className="lg:hidden">
        <MobileTokenFlow status={status} />
      </div>
      <div className="hidden lg:block">
        <DesktopTokenFlow status={status} />
      </div>
    </>
  )
}

// ─── Mobile variant ─────────────────────────────────────────────────────
function MobileTokenFlow({ status }: { status: Status }) {
  if (status === 'verifying') {
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
          Verifying your email…
        </p>
      </div>
    )
  }

  if (status === 'success') {
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
            Your email is verified
          </h1>
          <p
            className="mt-2.5 text-sm leading-relaxed max-w-[280px]"
            style={{ color: 'var(--text-muted)' }}
          >
            You can now book sessions and use every part of Mindset.
          </p>
          <Link
            href="/user"
            className="mt-7 inline-flex items-center justify-center gap-2 py-4 px-7 rounded-full text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: 'var(--primary)', color: 'var(--on-dark)' }}
          >
            Go to your dashboard
            <ArrowRight size={16} strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    )
  }

  const copy = ERROR_COPY[status]
  return (
    <div className="px-6 pt-3 pb-6 flex flex-col" style={{ minHeight: '100%' }}>
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
          {copy.title}
        </h1>
        <p
          className="mt-2.5 text-sm leading-relaxed max-w-[300px]"
          style={{ color: 'var(--text-muted)' }}
        >
          {copy.body}
        </p>
        <div className="mt-7 flex flex-wrap gap-3 justify-center">
          <Link
            href="/user"
            className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-full text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: 'var(--primary)', color: 'var(--on-dark)' }}
          >
            Open dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-full text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: 'var(--bg-card)', color: 'var(--primary)', border: '1.5px solid var(--border-strong)' }}
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Desktop variant — unchanged from before sub-phase 1.4 ──────────────
function DesktopTokenFlow({ status }: { status: Status }) {
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

  const copy = ERROR_COPY[status]
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
        {copy.title}
      </h2>
      <p className="text-sm mb-6 leading-relaxed" style={{ color: 'rgba(30,68,92,0.55)' }}>
        {copy.body}
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
