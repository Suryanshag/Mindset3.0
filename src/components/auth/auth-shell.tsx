'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Lock } from 'lucide-react'
import HelplineModal from './helpline-modal'

interface AuthShellProps {
  children: React.ReactNode
  headline?: string
}

const TRUST_PILLS = [
  'RCI-aligned therapists',
  'DPDP-compliant',
  'End-to-end secure',
] as const

export default function AuthShell({
  children,
  headline = 'Your mental health, supported with care.',
}: AuthShellProps) {
  const [helplineOpen, setHelplineOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: 'var(--cream)' }}>
      {/* Brand panel — desktop left 45%, mobile compact top */}
      <aside
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-10 xl:p-14 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--teal) 0%, #0AA9B5 55%, #38C9D3 100%)',
        }}
      >
        <Link href="/" className="inline-flex items-center gap-2 z-10">
          <Image
            src="/images/icons/Logo.webp"
            alt="Mindset"
            width={36}
            height={36}
            priority
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <span className="text-lg font-bold text-white tracking-tight">Mindset</span>
        </Link>

        <div className="z-10 max-w-md">
          <h1
            className="text-3xl xl:text-4xl font-bold leading-tight mb-5 text-white"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {headline}
          </h1>
          <div className="flex flex-wrap gap-2">
            {TRUST_PILLS.map((p) => (
              <span
                key={p}
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  color: '#fff',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <p className="z-10 text-xs text-white/70">
          &copy; {new Date().getFullYear()} Mindset
        </p>

        {/* Soft decorative blobs */}
        <div
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            width: 380,
            height: 380,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)',
            top: '-80px',
            right: '-100px',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,248,235,0.22), transparent 70%)',
            bottom: '-60px',
            left: '-60px',
          }}
        />
      </aside>

      {/* Form panel — desktop right 55%, mobile full */}
      <main className="flex-1 flex flex-col">
        {/* Mobile-only wordmark */}
        <header className="lg:hidden px-5 pt-6 pb-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/images/icons/Logo.webp" alt="Mindset" width={28} height={28} />
            <span className="text-base font-bold tracking-tight" style={{ color: 'var(--navy)' }}>
              Mindset
            </span>
          </Link>
        </header>

        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-6 sm:py-10">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>

        {/* Footer link cluster + trust strip */}
        <footer className="px-5 sm:px-8 pb-6 pt-2 space-y-3">
          <div
            className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs"
            style={{ color: 'rgba(30,68,92,0.55)' }}
          >
            <Link href="/terms-of-use" className="hover:opacity-70 transition-opacity">
              Terms
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/privacy-policy" className="hover:opacity-70 transition-opacity">
              Privacy
            </Link>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setHelplineOpen(true)}
              className="font-semibold hover:opacity-70 transition-opacity"
              style={{ color: 'var(--coral)' }}
            >
              Need help right now?
            </button>
          </div>
          <div
            className="flex items-center justify-center gap-2 text-xs"
            style={{ color: 'rgba(30,68,92,0.45)' }}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Your data is encrypted and protected under India&apos;s DPDP Act.</span>
          </div>
        </footer>
      </main>

      <HelplineModal open={helplineOpen} onClose={() => setHelplineOpen(false)} />
    </div>
  )
}
