import Link from 'next/link'
import { Video } from 'lucide-react'
import type { Session } from '@/types/dashboard'

type Props = {
  session: Session | null
}

function formatSessionTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.round(
    (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  if (diffDays === 0) return `Today \u00b7 ${time}`
  if (diffDays === 1) return `Tomorrow \u00b7 ${time}`
  return `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} \u00b7 ${time}`
}

export default function NextSessionCard({ session }: Props) {
  if (!session) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-primary p-4">
        {/* Decorative circle */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-primary-soft opacity-40" />

        <div className="relative z-10">
          <p className="text-[15px] font-medium text-white">
            Begin your wellness journey
          </p>
          <p className="text-[13px] text-white/70 mt-1">
            Find a therapist who fits you
          </p>
          <Link
            href="/doctors"
            className="inline-block mt-3 px-4 py-2 rounded-full bg-accent text-white text-[13px] font-medium"
          >
            Find a therapist
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary p-4">
      {/* Decorative circle */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-primary-soft opacity-40" />

      <div className="relative z-10">
        <div className="flex items-center gap-2.5">
          {/* Doctor avatar */}
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-white">
              {session.doctorName
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-white truncate">
              {session.doctorName}
            </p>
            <p className="text-[12px] text-white/60">{session.doctorSpecialty}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="text-[13px] text-white/80">
            {formatSessionTime(session.date)}
          </p>
          <Link
            href={session.meetLink ?? `/user/sessions`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-accent text-white text-[13px] font-medium"
          >
            <Video size={14} />
            Join
          </Link>
        </div>
      </div>
    </div>
  )
}
