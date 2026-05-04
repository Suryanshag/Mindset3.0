'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app-error]', error)
  }, [error])

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 py-16 overflow-hidden relative"
      style={{ background: 'linear-gradient(180deg, var(--cream) 0%, var(--background) 100%)' }}
    >
      <div
        aria-hidden
        className="absolute top-[-15%] right-[-10%] w-[420px] h-[420px] rounded-full opacity-35 blur-3xl pointer-events-none"
        style={{ background: 'var(--amber-light)' }}
      />
      <div
        aria-hidden
        className="absolute bottom-[-20%] left-[-12%] w-[460px] h-[460px] rounded-full opacity-35 blur-3xl pointer-events-none"
        style={{ background: 'var(--soft-pink)' }}
      />

      <div className="relative w-full max-w-xl text-center">
        <div
          aria-hidden
          className="mx-auto mb-8 w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: 'var(--coral)', opacity: 0.15 }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--coral)' }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <p
          className="font-heading text-sm tracking-[0.3em] uppercase mb-4"
          style={{ color: 'var(--coral)' }}
        >
          A small hiccup
        </p>

        <h1
          className="font-heading text-4xl md:text-5xl font-bold mb-5 leading-tight"
          style={{ color: 'var(--navy)' }}
        >
          Something didn't go as planned.
        </h1>

        <p
          className="text-base md:text-lg leading-relaxed max-w-md mx-auto mb-10"
          style={{ color: 'var(--navy)', opacity: 0.78 }}
        >
          We've logged what happened and our team will look into it.
          In the meantime, give it another try — most things sort themselves out.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-8 py-3 rounded-full font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'var(--coral)' }}
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full font-medium transition-colors"
            style={{ border: '1.5px solid var(--navy)', color: 'var(--navy)' }}
          >
            Go home
          </Link>
        </div>

        {error.digest && (
          <p
            className="text-xs font-mono"
            style={{ color: 'var(--navy)', opacity: 0.4 }}
          >
            Reference: {error.digest}
          </p>
        )}
      </div>
    </main>
  )
}
