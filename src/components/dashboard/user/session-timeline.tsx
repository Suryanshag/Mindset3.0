'use client'

import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import { Calendar } from 'lucide-react'
import gsap from 'gsap'

interface Session {
  id: string
  date: string
  meetLink: string | null
  status: string
  doctor: {
    designation: string | null
    user: { name: string }
  }
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: '#FEF3C7', text: '#92400E', dot: 'var(--amber)' },
  CONFIRMED: { bg: '#D1FAE5', text: '#065F46', dot: 'var(--teal)' },
  COMPLETED: { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF' },
  CANCELLED: { bg: '#FEE2E2', text: '#991B1B', dot: 'var(--coral)' },
}

export default function SessionTimeline({ sessions }: { sessions: Session[] }) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!listRef.current || sessions.length === 0) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.timeline-entry',
        { x: -12, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power2.out', delay: 0.2 }
      )
    }, listRef)
    return () => ctx.revert()
  }, [sessions.length])

  return (
    <div
      className="bg-white rounded-3xl overflow-hidden"
      style={{ boxShadow: '0 2px 12px rgba(30,68,92,0.06)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5">
        <h2 className="text-lg font-bold" style={{ color: 'var(--navy)', fontFamily: 'var(--font-heading)' }}>
          Recent Sessions
        </h2>
        <Link
          href="/user/sessions"
          className="text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ color: 'var(--coral)' }}
        >
          View All &rarr;
        </Link>
      </div>

      {/* Timeline */}
      {sessions.length === 0 ? (
        <div className="px-6 pb-8 pt-2 text-center">
          <Calendar size={36} className="mx-auto mb-3" style={{ color: 'var(--teal)', opacity: 0.3 }} />
          <p className="font-semibold text-sm" style={{ color: 'var(--navy)' }}>No sessions yet</p>
          <Link
            href="/doctors"
            className="text-sm font-semibold mt-2 inline-block"
            style={{ color: 'var(--coral)' }}
          >
            Book your first session &rarr;
          </Link>
        </div>
      ) : (
        <div ref={listRef} className="px-6 pb-5">
          {sessions.map((s, i) => {
            const colors = STATUS_COLORS[s.status] ?? STATUS_COLORS.PENDING
            const isLast = i === sessions.length - 1

            return (
              <div key={s.id} className="timeline-entry flex gap-4">
                {/* Timeline rail */}
                <div className="flex flex-col items-center pt-1">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: colors.dot }}
                  />
                  {!isLast && (
                    <div className="w-0.5 flex-1 mt-1 rounded-full" style={{ background: 'var(--cream)' }} />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 flex items-center justify-between gap-3 ${isLast ? '' : 'pb-5'}`}>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm" style={{ color: 'var(--navy)' }}>
                      {s.doctor.user.name}
                    </p>
                    {s.doctor.designation && (
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(30,68,92,0.4)' }}>
                        {s.doctor.designation}
                      </p>
                    )}
                    <p className="text-xs mt-1" style={{ color: 'rgba(30,68,92,0.45)' }}>
                      {format(new Date(s.date), "EEE, dd MMM yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: colors.bg, color: colors.text }}
                    >
                      {s.status}
                    </span>
                    {s.status === 'CONFIRMED' && s.meetLink && (
                      <a
                        href={s.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold px-3 py-1.5 rounded-xl text-white transition-transform hover:scale-[1.03]"
                        style={{ background: 'var(--teal)' }}
                      >
                        Join
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
