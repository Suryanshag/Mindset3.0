'use client'

import { format } from 'date-fns'
import { Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface NextSessionCardProps {
  doctorName: string | null
  date: string | null
  meetLink: string | null
}

export default function NextSessionCard({ doctorName, date, meetLink }: NextSessionCardProps) {
  if (!doctorName || !date) {
    return (
      <div
        className="rounded-3xl p-6 h-full flex flex-col justify-between relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--teal) 0%, #087d87 100%)',
          boxShadow: '0 8px 32px rgba(11,157,169,0.20)',
        }}
      >
        {/* Decorative blob */}
        <svg className="absolute -bottom-6 -right-6 opacity-10" width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="60" fill="white" />
        </svg>

        <div className="relative z-10">
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Next Session
          </p>
          <div className="mt-6 flex flex-col items-center text-center">
            <Calendar size={32} className="mb-3" style={{ color: 'rgba(255,255,255,0.4)' }} />
            <p className="text-white/80 text-sm">No upcoming sessions</p>
          </div>
        </div>

        <Link
          href="/doctors"
          className="relative z-10 mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white transition-colors"
        >
          Book one <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  return (
    <div
      className="rounded-3xl p-6 h-full flex flex-col justify-between relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--teal) 0%, #087d87 100%)',
        boxShadow: '0 8px 32px rgba(11,157,169,0.20)',
      }}
    >
      {/* Decorative blobs */}
      <svg className="absolute -bottom-8 -right-8 opacity-[0.08]" width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="70" fill="white" />
      </svg>
      <svg className="absolute -top-4 -right-4 opacity-[0.05]" width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="40" fill="white" />
      </svg>

      <div className="relative z-10">
        <p className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Next Session
        </p>
        <p className="text-lg font-bold text-white mt-3" style={{ fontFamily: 'var(--font-heading)' }}>
          {doctorName}
        </p>
        <p className="text-sm text-white/75 mt-1">
          {format(new Date(date), "EEEE, dd MMM 'at' h:mm a")}
        </p>
      </div>

      {meetLink ? (
        <a
          href={meetLink}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-10 mt-5 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white rounded-xl text-sm font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{ color: 'var(--teal)' }}
        >
          Join Call <ArrowRight size={14} />
        </a>
      ) : (
        <p className="relative z-10 mt-5 text-xs text-white/50">
          Meeting link will appear here
        </p>
      )}
    </div>
  )
}
