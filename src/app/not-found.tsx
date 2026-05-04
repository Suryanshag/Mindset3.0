import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: "The page you're looking for has wandered off. Let's find your way back.",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 py-16 overflow-hidden relative"
      style={{ background: 'linear-gradient(180deg, var(--cream) 0%, var(--background) 100%)' }}
    >
      {/* Soft ambient blobs */}
      <div
        aria-hidden
        className="absolute top-[-20%] left-[-10%] w-[480px] h-[480px] rounded-full opacity-40 blur-3xl pointer-events-none"
        style={{ background: 'var(--soft-blue)' }}
      />
      <div
        aria-hidden
        className="absolute bottom-[-25%] right-[-15%] w-[520px] h-[520px] rounded-full opacity-35 blur-3xl pointer-events-none"
        style={{ background: 'var(--soft-pink)' }}
      />

      <div className="relative w-full max-w-2xl text-center">
        <p
          className="font-heading text-sm tracking-[0.3em] uppercase mb-6"
          style={{ color: 'var(--coral)' }}
        >
          Lost in thought
        </p>

        <h1
          className="font-heading font-extrabold leading-none mb-8"
          style={{
            color: 'var(--navy)',
            fontSize: 'clamp(6rem, 22vw, 12rem)',
            letterSpacing: '-0.04em',
          }}
        >
          4<span style={{ color: 'var(--coral)' }}>0</span>4
        </h1>

        <h2
          className="font-heading text-3xl md:text-4xl font-bold mb-5"
          style={{ color: 'var(--navy)' }}
        >
          This page took a moment for itself.
        </h2>

        <p
          className="text-base md:text-lg leading-relaxed max-w-md mx-auto mb-10"
          style={{ color: 'var(--navy)', opacity: 0.78 }}
        >
          The page you're looking for doesn't exist or has been moved.
          That's okay — taking a wrong turn is part of every journey.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'var(--coral)' }}
          >
            Take me home
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full font-medium transition-colors"
            style={{
              border: '1.5px solid var(--navy)',
              color: 'var(--navy)',
            }}
          >
            Talk to us
          </Link>
        </div>

        <p
          className="mt-12 text-sm"
          style={{ color: 'var(--navy)', opacity: 0.55 }}
        >
          If you're in distress right now, please reach out:{' '}
          <a
            href="tel:9152987821"
            className="underline font-medium"
            style={{ color: 'var(--teal)' }}
          >
            iCall 9152987821
          </a>
        </p>
      </div>
    </main>
  )
}
