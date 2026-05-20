import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { auth } from '@/lib/auth'
import GoogleButton from '@/components/auth/google-button'

export const metadata: Metadata = {
  title: 'Welcome to Mindset',
  description:
    'Small steps, kept close. Therapy, journaling, and gentle daily check-ins — together in one calm place.',
  robots: { index: false, follow: false },
}

const ROLE_HOME: Record<string, string> = {
  ADMIN: '/admin',
  DOCTOR: '/doctor',
  USER: '/user',
}

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // If already authed, skip welcome — the page is purely a pre-auth surface.
  // Honour callbackUrl if present.
  const session = await auth()
  const params = await searchParams
  const callbackUrl =
    typeof params.callbackUrl === 'string' ? params.callbackUrl : undefined

  if (session?.user) {
    redirect(callbackUrl ?? ROLE_HOME[session.user.role ?? ''] ?? '/user')
  }

  const loginHref = callbackUrl
    ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : '/login'
  const registerHref = callbackUrl
    ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : '/register'
  const googleCallbackUrl = callbackUrl ?? '/user'

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg-app)', color: 'var(--text)' }}
    >
      {/* Top illustration band — primary background with decorative
          blobs + brand mark. Mobile-first by design; on lg+ the band
          stays the same but the inner content centers more tightly. */}
      <header
        className="relative overflow-hidden flex flex-col"
        style={{
          background: 'var(--primary)',
          color: 'var(--on-dark)',
          minHeight: 'min(56vh, 460px)',
          borderBottomLeftRadius: 56,
          borderBottomRightRadius: 56,
        }}
      >
        <span
          aria-hidden="true"
          className="absolute pointer-events-none rounded-full"
          style={{
            width: 240,
            height: 240,
            background: 'radial-gradient(circle, rgba(255,248,235,0.08), transparent 70%)',
            right: -40,
            top: -60,
            animation: 'ms-float-a 12s ease-in-out infinite',
          }}
        />
        <span
          aria-hidden="true"
          className="absolute pointer-events-none rounded-full"
          style={{
            width: 220,
            height: 220,
            background: 'radial-gradient(circle, rgba(201,120,100,0.22), transparent 70%)',
            left: -50,
            top: 80,
            animation: 'ms-float-b 14s ease-in-out infinite',
          }}
        />

        <div className="relative px-7 pt-10 flex items-center gap-3">
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={36}
            height={36}
            priority
            aria-hidden="true"
            style={{ borderRadius: 10 }}
          />
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 22,
              letterSpacing: '0.01em',
            }}
          >
            Mindset
          </span>
        </div>

        <div className="relative px-7 pb-9 mt-auto max-w-sm">
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(36px, 9vw, 44px)',
              lineHeight: 1.0,
              animation: 'ms-fade-up .8s .15s both',
            }}
          >
            Small steps,
            <br />
            kept close.
          </h1>
          <p
            className="mt-3"
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 16,
              opacity: 0.78,
              lineHeight: 1.5,
              maxWidth: 280,
              animation: 'ms-fade-up .8s .3s both',
            }}
          >
            Therapy, journaling, and gentle daily check-ins — together in one
            calm place.
          </p>
        </div>
      </header>

      {/* CTAs */}
      <section
        className="flex-1 flex flex-col gap-3 px-6 pt-7 pb-6 max-w-sm w-full mx-auto"
        style={{ animation: 'ms-fade-up .8s .45s both' }}
      >
        <Link
          href={registerHref}
          className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-full text-sm font-bold transition-opacity hover:opacity-90"
          style={{
            background: 'var(--primary)',
            color: 'var(--on-dark)',
          }}
        >
          Create an account
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href={loginHref}
          className="w-full inline-flex items-center justify-center py-4 rounded-full text-sm font-bold transition-opacity hover:opacity-80"
          style={{
            background: 'transparent',
            color: 'var(--primary)',
            border: '1.5px solid var(--primary-tint)',
          }}
        >
          I have an account
        </Link>

        <div className="flex items-center gap-3 my-1.5" aria-hidden="true">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--text-faint)' }}
          >
            or continue with
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        <GoogleButton callbackUrl={googleCallbackUrl} />

        <p
          className="mt-auto pt-6 text-center text-xs leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          By continuing you agree to our{' '}
          <Link
            href="/terms-of-use"
            className="underline underline-offset-2 hover:opacity-80"
          >
            Terms
          </Link>{' '}
          &{' '}
          <Link
            href="/privacy-policy"
            className="underline underline-offset-2 hover:opacity-80"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </section>
    </main>
  )
}
