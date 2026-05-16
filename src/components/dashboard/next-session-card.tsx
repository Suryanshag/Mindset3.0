import Link from 'next/link'
import { Video } from 'lucide-react'
import type { Session } from '@/types/dashboard'
import { formatSessionDateRelative } from '@/lib/format-date'

type Props = {
  session: Session | null
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
            {formatSessionDateRelative(session.date)}
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
