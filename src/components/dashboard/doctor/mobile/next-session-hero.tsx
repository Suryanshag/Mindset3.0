'use client'

import Link from 'next/link'
import { ArrowRight, Calendar, Video } from 'lucide-react'
import { formatSessionTime } from '@/lib/format-date'
import StatusBadge from './status-badge'

// Slots/availability management is desktop-only — empty state stays
// informational (no dead-end tap on mobile).

interface NextSessionLike {
  id: string
  date: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  meetLink: string | null
  user: { name: string }
}

interface Props {
  next: NextSessionLike | null
  durationMin?: number
}

/** Same join-window math as session-window.ts — duplicated client-side
 *  so the hero can pick its CTA without a network round-trip. */
function joinWindowOpen(s: NextSessionLike, durationMin: number): boolean {
  if (s.status !== 'CONFIRMED') return false
  const start = new Date(s.date).getTime()
  const now = Date.now()
  return now >= start - 15 * 60 * 1000 && now <= start + (durationMin + 15) * 60 * 1000
}

function relativeLabel(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now()
  const absMin = Math.round(Math.abs(diffMs) / 60000)
  if (diffMs < 0 && absMin < 60) return 'starting now'
  if (diffMs < 0) return 'earlier today'
  if (absMin < 60) return `in ${absMin}m`
  const hrs = Math.floor(absMin / 60)
  const mins = absMin % 60
  if (hrs < 24) return mins > 0 ? `in ${hrs}h ${mins}m` : `in ${hrs}h`
  return new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function NextSessionHero({ next, durationMin = 60 }: Props) {
  // ── No upcoming session — quiet, informational. No tap target. ──
  if (!next) {
    return (
      <div
        className="flex items-center gap-3.5 rounded-[22px] p-[18px]"
        style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
      >
        <div
          className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0"
          style={{ background: 'var(--bg-app)', color: 'var(--text-muted)' }}
        >
          <Calendar size={20} strokeWidth={1.7} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="ms-display text-[20px] leading-tight" style={{ color: 'var(--text)' }}>
            No sessions scheduled
          </div>
          <p
            className="ms-serif italic text-[12.5px] mt-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Set availability from desktop.
          </p>
        </div>
      </div>
    )
  }

  const showJoin = joinWindowOpen(next, durationMin) && !!next.meetLink
  const niceTime = formatSessionTime(next.date)

  return (
    <div
      className="relative overflow-hidden rounded-[22px] p-5"
      style={{ background: 'var(--primary)', color: 'var(--on-dark, var(--cream))' }}
    >
      {/* Decorative blobs — kept subtle so layout doesn't ship a heavy SVG dep */}
      <span
        aria-hidden
        className="absolute -right-10 -top-12 w-[180px] h-[180px] rounded-full"
        style={{ background: 'rgba(255,248,235,0.08)' }}
      />
      <span
        aria-hidden
        className="absolute -left-10 -bottom-12 w-[150px] h-[150px] rounded-full"
        style={{ background: 'rgba(201,120,100,0.18)' }}
      />

      <div className="relative">
        <div
          className="text-[11px] font-extrabold uppercase opacity-75"
          style={{ letterSpacing: '0.14em' }}
        >
          Next session
        </div>
        <div className="ms-display text-[30px] mt-1.5 leading-[1.05]">
          {next.user.name ?? 'Patient'}
        </div>
        <div className="flex items-center gap-2.5 mt-2 text-[13px]">
          <span>{niceTime}</span>
          <span className="opacity-60">·</span>
          <span className="opacity-85">{relativeLabel(next.date)}</span>
          <span className="opacity-60">·</span>
          <span className="opacity-85">{durationMin} min</span>
        </div>
        <div className="mt-2.5">
          <StatusBadge status={next.status} />
        </div>
        <div className="mt-4">
          {showJoin ? (
            <a
              href={next.meetLink!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full text-[13.5px] font-extrabold"
              style={{
                padding: '11px 18px',
                background: 'var(--accent)',
                color: 'var(--on-dark, var(--cream))',
              }}
            >
              <Video size={14} strokeWidth={2.2} />
              Join now
            </a>
          ) : (
            <Link
              href="/doctor/sessions?tab=upcoming"
              className="inline-flex items-center gap-1.5 rounded-full text-[12.5px] font-extrabold"
              style={{
                padding: '10px 14px',
                background: 'rgba(255,248,235,0.16)',
                color: 'var(--on-dark, var(--cream))',
                border: '1px solid rgba(255,248,235,0.20)',
              }}
            >
              View session <ArrowRight size={12} strokeWidth={2.4} />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
