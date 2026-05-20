'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { ArrowRight, Mail, Loader2 } from 'lucide-react'
import MobileBackButton from '@/components/auth/mobile-back-button'

const RESEND_COOLDOWN_SECONDS = 60

interface VerifyEmailSentProps {
  /** Email pulled server-side from session.user.email. */
  email: string
}

type SendState = 'idle' | 'sending' | 'sent' | 'error'

function formatCooldown(seconds: number): string {
  if (seconds <= 0) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function VerifyEmailSent({ email }: VerifyEmailSentProps) {
  const router = useRouter()
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS)
  const [sendState, setSendState] = useState<SendState>('idle')

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  const handleResend = async () => {
    if (cooldown > 0 || sendState === 'sending') return
    setSendState('sending')
    try {
      const res = await fetch('/api/auth/email/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        setSendState('sent')
        setCooldown(RESEND_COOLDOWN_SECONDS)
      } else {
        setSendState('error')
      }
    } catch {
      setSendState('error')
    }
  }

  // Sign-out-and-route-to-/register is the honest path for "Wrong email?
  // Edit" — the user has a session bound to the wrong email, and the
  // existing /register page would silently bounce an authed user back to
  // /user. Cleanest is to clear the session and let them re-register.
  // The orphaned account stays in the DB until they re-try with the same
  // address (server returns "email exists") or until a future
  // garbage-collection sweep.
  const handleEditEmail = async () => {
    await signOut({ redirect: false })
    router.push('/register')
  }

  return (
    <>
      <div className="lg:hidden">
        <MobileSent
          email={email}
          cooldown={cooldown}
          sendState={sendState}
          onResend={handleResend}
          onEditEmail={handleEditEmail}
        />
      </div>
      <div className="hidden lg:block">
        <DesktopSent
          email={email}
          cooldown={cooldown}
          sendState={sendState}
          onResend={handleResend}
          onEditEmail={handleEditEmail}
        />
      </div>
    </>
  )
}

type ChildProps = {
  email: string
  cooldown: number
  sendState: SendState
  onResend: () => void
  onEditEmail: () => void
}

// ─── Mobile variant ─────────────────────────────────────────────────────
function MobileSent({ email, cooldown, sendState, onResend, onEditEmail }: ChildProps) {
  return (
    <div className="px-6 pt-3 pb-6 flex flex-col" style={{ minHeight: '100%' }}>
      <div className="mb-5">
        <MobileBackButton href="/login" ariaLabel="Back to sign in" />
      </div>

      <div style={{ animation: 'ms-fade-up .6s both' }}>
        <p
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: 'var(--primary)' }}
        >
          Confirm your email
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
          Check your<br />inbox.
        </h1>
        <p
          className="mt-2.5 text-sm leading-relaxed"
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            color: 'var(--text-muted)',
          }}
        >
          We sent a link to{' '}
          <span
            style={{ fontFamily: 'inherit', fontStyle: 'normal', fontWeight: 700, color: 'var(--text)' }}
          >
            {email}
          </span>
          . Tap it to verify.
        </p>
      </div>

      <div
        className="mt-7 rounded-[26px] p-5"
        style={{
          background: 'var(--bg-cream)',
          animation: 'ms-fade-up .6s .1s both',
        }}
      >
        <a
          href="mailto:"
          className="inline-flex items-center justify-center w-full gap-2 py-3.5 px-6 rounded-full text-sm font-bold transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            background: 'var(--bg-card)',
            color: 'var(--text)',
            boxShadow: 'var(--shadow-card)',
            outlineColor: 'var(--primary)',
          }}
        >
          <Mail size={16} strokeWidth={1.8} aria-hidden="true" />
          Open mail app
        </a>

        <div
          className="mt-3.5 text-center"
          style={{
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontSize: 13,
            fontWeight: 700,
          }}
          aria-live="polite"
        >
          {sendState === 'sending' ? (
            <span
              className="inline-flex items-center gap-2"
              style={{ color: 'var(--text-muted)' }}
            >
              <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Sending…
            </span>
          ) : sendState === 'sent' && cooldown > 0 ? (
            <span style={{ color: 'var(--primary)' }}>Link sent — check your inbox</span>
          ) : sendState === 'error' ? (
            <button
              type="button"
              onClick={onResend}
              className="transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded"
              style={{
                color: 'var(--accent-deep)',
                fontFamily: 'inherit',
                outlineColor: 'var(--primary)',
                minHeight: 44,
                padding: '0 8px',
              }}
            >
              Try again
            </button>
          ) : cooldown > 0 ? (
            <span style={{ color: 'var(--text-muted)' }}>
              Resend in 0:{String(cooldown).padStart(2, '0')}
            </span>
          ) : (
            <button
              type="button"
              onClick={onResend}
              className="transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded"
              style={{
                color: 'var(--primary)',
                fontFamily: 'inherit',
                outlineColor: 'var(--primary)',
                minHeight: 44,
                padding: '0 8px',
              }}
            >
              Resend link
            </button>
          )}
        </div>
      </div>

      <div className="mt-auto pt-7 flex flex-col items-center gap-3 text-sm">
        <button
          type="button"
          onClick={onEditEmail}
          className="font-bold underline underline-offset-[3px] transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded"
          style={{
            color: 'var(--primary)',
            minHeight: 44,
            padding: '0 4px',
            outlineColor: 'var(--primary)',
          }}
        >
          Wrong email? Edit
        </button>
        <Link
          href="/user"
          className="font-medium inline-flex items-center gap-1.5 transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded"
          style={{
            color: 'var(--text-muted)',
            minHeight: 44,
            padding: '0 4px',
            outlineColor: 'var(--primary)',
          }}
        >
          Skip for now
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

// ─── Desktop variant ───────────────────────────────────────────────────
// Net-new visual surface — there was no desktop "check your inbox" stage
// before this commit. Mirrors the existing desktop auth-error visual
// (rounded card icon, 2xl/3xl heading) for consistency with /verify-email's
// other states.
function DesktopSent({ email, cooldown, sendState, onResend, onEditEmail }: ChildProps) {
  return (
    <div>
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'rgba(11,157,169,0.1)' }}
      >
        <Mail className="w-7 h-7" style={{ color: 'var(--teal)' }} />
      </div>
      <h2
        className="text-2xl sm:text-3xl font-bold mb-2"
        style={{ color: 'var(--navy)', fontFamily: 'var(--font-heading)' }}
      >
        Check your inbox
      </h2>
      <p className="text-sm mb-2" style={{ color: 'rgba(30,68,92,0.6)' }}>
        We sent a verification link to{' '}
        <strong style={{ color: 'var(--navy)' }}>{email}</strong>. Tap it to verify your email.
      </p>
      <p
        className="text-xs font-medium rounded-xl p-3 mb-6"
        style={{ background: 'rgba(255,170,17,0.08)', color: '#92400E' }}
      >
        The link expires in 24 hours.
      </p>

      <button
        type="button"
        onClick={onResend}
        disabled={cooldown > 0 || sendState === 'sending'}
        className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50"
        style={{
          background: cooldown > 0 ? 'rgba(11,157,169,0.08)' : 'var(--teal)',
          color: cooldown > 0 ? 'var(--teal)' : '#fff',
          boxShadow: cooldown > 0 ? 'none' : '0 4px 16px rgba(11,157,169,0.25)',
        }}
      >
        {sendState === 'sending' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending…
          </>
        ) : sendState === 'sent' && cooldown > 0 ? (
          'Link sent — check your inbox'
        ) : sendState === 'error' ? (
          'Try again'
        ) : cooldown > 0 ? (
          `Resend in ${cooldown}s`
        ) : (
          'Resend link'
        )}
      </button>

      <div className="mt-5 flex flex-col gap-3 text-sm">
        <button
          type="button"
          onClick={onEditEmail}
          className="self-start font-semibold underline underline-offset-2 transition-opacity duration-150 hover:opacity-70"
          style={{ color: 'var(--teal)' }}
        >
          Wrong email? Edit
        </button>
        <Link
          href="/user"
          className="self-start font-medium inline-flex items-center gap-1.5 transition-opacity duration-150 hover:opacity-70"
          style={{ color: 'rgba(30,68,92,0.55)' }}
        >
          Skip for now
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
