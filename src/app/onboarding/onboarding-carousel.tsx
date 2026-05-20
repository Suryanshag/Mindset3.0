'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CalendarDays,
  NotebookPen,
  Heart,
  Ticket,
} from 'lucide-react'

// 1-year cookie, client-readable per Resolved Decision 9.
const ONBOARDED_COOKIE_MAX_AGE = 365 * 24 * 60 * 60

interface Slide {
  kicker: string
  title: string
  desc: string
  Icon: typeof Heart
  bg: string // CSS color or var()
  iconColor: string
}

// Per handoff TUTORIALS.user. Doctor tutorial is out of scope per
// Resolved Decision 12.
const SLIDES: readonly Slide[] = [
  {
    kicker: 'Check in',
    title: 'A 60-second daily ritual',
    desc:
      "Tap once to mark how you're feeling. Look back at your week as a soft, kind chart.",
    Icon: Heart,
    bg: 'var(--accent-tint)',
    iconColor: 'var(--accent)',
  },
  {
    kicker: 'Therapy',
    title: 'Find someone who fits',
    desc:
      'Browse counsellors by specialty, language and time. Book a 60-minute session in two taps.',
    Icon: CalendarDays,
    bg: 'var(--primary-tint)',
    iconColor: 'var(--primary)',
  },
  {
    kicker: 'Journal',
    title: 'Write only when you want',
    desc:
      'Daily prompts, a private space, and voice notes. Nothing is shared without your say so.',
    Icon: NotebookPen,
    bg: 'var(--bg-cream)',
    iconColor: 'var(--accent-deep)',
  },
  {
    kicker: 'Workshops',
    title: 'Show up, gently',
    desc:
      'Live workshops, NGO visits, and a self-care library — pick what feels right this week.',
    Icon: Ticket,
    bg: 'var(--soft-blue)',
    iconColor: 'var(--navy)',
  },
]

function markOnboarded() {
  if (typeof document === 'undefined') return
  document.cookie = `mindset_onboarded=1; Max-Age=${ONBOARDED_COOKIE_MAX_AGE}; Path=/; SameSite=Lax`
}

export default function OnboardingCarousel() {
  const router = useRouter()
  const [index, setIndex] = useState(0)

  const slide = SLIDES[index]
  const isLast = index === SLIDES.length - 1
  const Icon = slide.Icon

  const handleSkip = () => {
    markOnboarded()
    router.replace('/user')
  }

  const handleAdvance = () => {
    if (isLast) {
      markOnboarded()
      router.replace('/user')
      return
    }
    setIndex(index + 1)
  }

  const handleBack = () => {
    if (index === 0) return
    setIndex(index - 1)
  }

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg-app)', color: 'var(--text)' }}
    >
      {/* Header — dot progress + skip */}
      <header className="flex items-center justify-between px-6 pt-5">
        <div className="flex items-center gap-1.5" aria-label={`Slide ${index + 1} of ${SLIDES.length}`}>
          {SLIDES.map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="block rounded-full transition-all duration-300"
              style={{
                width: i === index ? 22 : 6,
                height: 6,
                background: i === index ? 'var(--primary)' : 'var(--border-strong)',
              }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={handleSkip}
          className="text-[13px] font-bold transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          Skip
        </button>
      </header>

      {/* Slide art + copy. The art is a flat-tinted card with a lucide
          icon centered — Phase 1 placeholder; richer illustrations can
          replace this in a Phase 6 polish pass without changing the
          surrounding layout. */}
      <section
        key={index}
        className="flex-1 px-7 pt-6 flex flex-col"
        style={{ animation: 'ms-slide-in .4s both' }}
      >
        <div
          className="rounded-[28px] flex items-center justify-center"
          style={{
            background: slide.bg,
            height: 280,
          }}
        >
          <Icon
            size={88}
            strokeWidth={1.5}
            style={{ color: slide.iconColor }}
            aria-hidden="true"
          />
        </div>

        <div className="mt-6">
          <p
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: 'var(--accent)' }}
          >
            {slide.kicker}
          </p>
          <h1
            className="mt-1.5"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 32,
              lineHeight: 1.0,
              color: 'var(--text)',
            }}
          >
            {slide.title}
          </h1>
          <p
            className="mt-3"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 17,
              lineHeight: 1.5,
              color: 'var(--text-muted)',
            }}
          >
            {slide.desc}
          </p>
        </div>
      </section>

      {/* Bottom controls — circular Back + pill Next/Get started */}
      <div className="flex items-center gap-3 px-6 pb-7 pt-5">
        {index > 0 && (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Previous slide"
            className="flex items-center justify-center rounded-full transition-opacity hover:opacity-80"
            style={{
              width: 52,
              height: 52,
              background: 'var(--bg-card)',
              color: 'var(--primary)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <button
          type="button"
          onClick={handleAdvance}
          className="flex-1 inline-flex items-center justify-center gap-2.5 rounded-full py-4 text-sm font-bold transition-opacity hover:opacity-90"
          style={{
            background: 'var(--primary)',
            color: 'var(--on-dark)',
          }}
        >
          {isLast ? (
            <>
              Get started
              <Check size={16} strokeWidth={2.4} />
            </>
          ) : (
            <>
              Next
              <ArrowRight size={16} strokeWidth={2.2} />
            </>
          )}
        </button>
      </div>
    </main>
  )
}
