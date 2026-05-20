'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Lock, ShieldCheck } from 'lucide-react'
import MobileBackButton from '@/components/auth/mobile-back-button'

interface AccountLockedClientProps {
  /** Pre-validated ISO8601 string from the server. The Date below is
   *  guaranteed parseable and within 24h of now. */
  untilIso: string
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return '0:00'
  const totalSeconds = Math.ceil(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function AccountLockedClient({ untilIso }: AccountLockedClientProps) {
  const untilMs = new Date(untilIso).getTime()
  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    // Stop ticking once unlocked — the displayed mm:ss is "0:00" forever
    // after that, and a still-running interval would pin a CPU wakeup.
    if (now >= untilMs) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [now, untilMs])

  const remainingMs = untilMs - now
  const isUnlocked = remainingMs <= 0
  const display = formatRemaining(remainingMs)

  return (
    <>
      <div className="lg:hidden">
        <MobileLocked isUnlocked={isUnlocked} display={display} />
      </div>
      <div className="hidden lg:block">
        <DesktopLocked isUnlocked={isUnlocked} display={display} />
      </div>
    </>
  )
}

type ChildProps = {
  isUnlocked: boolean
  display: string
}

// ─── Mobile variant ─────────────────────────────────────────────────────
function MobileLocked({ isUnlocked, display }: ChildProps) {
  return (
    <div className="px-6 pt-3 pb-6 flex flex-col" style={{ minHeight: '100%' }}>
      <div className="mb-5">
        <MobileBackButton href="/login" ariaLabel="Back to sign in" />
      </div>

      <div style={{ animation: 'ms-fade-up .6s both' }}>
        <p
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: 'var(--accent-deep)' }}
        >
          Account paused
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
          We've paused this<br />account for safety.
        </h1>
        <p
          className="mt-2.5 text-sm leading-relaxed"
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            color: 'var(--text-muted)',
          }}
        >
          Too many sign-in attempts. Try again in 15 minutes, or reset your password now.
        </p>
      </div>

      <div
        className="mt-7 rounded-[26px] p-5 flex flex-col items-center"
        style={{
          background: 'rgba(250, 167, 157, 0.18)',
          animation: 'ms-fade-up .6s .1s both',
        }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 56,
            height: 56,
            background: '#FFFFFF',
            color: 'var(--accent-deep)',
            boxShadow: 'var(--shadow-card)',
          }}
          aria-hidden="true"
        >
          {isUnlocked ? (
            <ShieldCheck size={26} strokeWidth={2.2} />
          ) : (
            <Lock size={24} strokeWidth={2.2} />
          )}
        </div>

        <div
          className="mt-4 text-center"
          style={{
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontSize: 28,
            fontWeight: 700,
            color: isUnlocked ? 'var(--primary)' : 'var(--accent-deep)',
            lineHeight: 1,
          }}
          aria-live="polite"
          aria-label={isUnlocked ? 'Account unlocked' : `Time remaining: ${display}`}
        >
          {display}
        </div>
        <p
          className="mt-2 text-xs"
          style={{ color: 'var(--text-muted)', letterSpacing: '0.04em' }}
        >
          {isUnlocked ? 'Your account is unlocked' : 'until you can try again'}
        </p>
      </div>

      <div className="mt-7 flex flex-col gap-3">
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center w-full gap-2 py-4 px-6 rounded-full text-sm font-bold transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            background: 'var(--primary)',
            color: 'var(--on-dark)',
            outlineColor: 'var(--primary)',
          }}
        >
          Reset password
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full gap-2 py-4 px-6 rounded-full text-sm font-bold transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            background: 'var(--bg-card)',
            color: isUnlocked ? 'var(--primary)' : 'var(--text)',
            border: `1.5px solid ${isUnlocked ? 'var(--primary)' : 'var(--border-strong)'}`,
            boxShadow: isUnlocked ? 'var(--shadow-card)' : 'none',
            outlineColor: 'var(--primary)',
          }}
        >
          {isUnlocked ? (
            <>
              Sign in now
              <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
            </>
          ) : (
            'Back to login'
          )}
        </Link>
      </div>
    </div>
  )
}

// ─── Desktop variant ────────────────────────────────────────────────────
// Net-new desktop surface — no prior "account locked" page existed.
// Mirrors the existing desktop auth-error visual treatment (rounded
// icon tile, 2xl/3xl heading) used by verify-email's error states for
// consistency with the rest of the desktop auth chrome.
function DesktopLocked({ isUnlocked, display }: ChildProps) {
  return (
    <div>
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'rgba(250, 167, 157, 0.18)' }}
        aria-hidden="true"
      >
        {isUnlocked ? (
          <ShieldCheck className="w-7 h-7" style={{ color: 'var(--accent-deep)' }} />
        ) : (
          <Lock className="w-7 h-7" style={{ color: 'var(--accent-deep)' }} />
        )}
      </div>
      <h2
        className="text-2xl sm:text-3xl font-bold mb-2"
        style={{ color: 'var(--navy)', fontFamily: 'var(--font-heading)' }}
      >
        We've paused this account for safety
      </h2>
      <p className="text-sm mb-2" style={{ color: 'rgba(30,68,92,0.6)' }}>
        Too many sign-in attempts. Try again in 15 minutes, or reset your password now.
      </p>

      <div
        className="mt-3 mb-6 inline-flex items-baseline gap-2 px-4 py-2 rounded-xl"
        style={{ background: 'rgba(250, 167, 157, 0.12)' }}
        aria-live="polite"
        aria-label={isUnlocked ? 'Account unlocked' : `Time remaining: ${display}`}
      >
        <span
          style={{
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontSize: 22,
            fontWeight: 700,
            color: isUnlocked ? 'var(--teal)' : 'var(--accent-deep)',
          }}
        >
          {display}
        </span>
        <span className="text-xs" style={{ color: 'rgba(30,68,92,0.55)' }}>
          {isUnlocked ? 'unlocked' : 'remaining'}
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white transition-all duration-200"
          style={{ background: 'var(--teal)', boxShadow: '0 4px 16px rgba(11,157,169,0.25)' }}
        >
          Reset password
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-200"
          style={{
            background: isUnlocked ? 'var(--teal)' : 'var(--cream)',
            color: isUnlocked ? '#fff' : 'var(--navy)',
            boxShadow: isUnlocked ? '0 4px 16px rgba(11,157,169,0.25)' : 'none',
          }}
        >
          {isUnlocked ? (
            <>
              Sign in now
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            'Back to login'
          )}
        </Link>
      </div>
    </div>
  )
}
