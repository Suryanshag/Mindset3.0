import Link from 'next/link'
import { PenLine, Compass, Calendar, Search, BookOpen } from 'lucide-react'
import type { EngagementState } from '@/lib/queries/dashboard'

export default function HomeRail({ engagementState }: { engagementState: EngagementState }) {
  if (engagementState === 'empty') {
    return (
      <div className="space-y-5">
        <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px]">
          Quick actions
        </p>
        <div className="space-y-2">
          <RailAction href="/doctors" icon={Search} label="Find a therapist" />
          <RailAction href="/user/discover/workshops" icon={Compass} label="Browse workshops" />
          <RailAction href="/user/discover" icon={BookOpen} label="Browse library" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px]">
        Quick actions
      </p>
      <div className="space-y-2">
        <RailAction href="/user/reflection/today" icon={PenLine} label="Write something" />
        <RailAction href="/user/discover/workshops" icon={Compass} label="Browse workshops" />
        <RailAction href="/user/sessions" icon={Calendar} label="View all sessions" />
      </div>
    </div>
  )
}

function RailAction({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-text transition-colors duration-150 hover:bg-white/60"
      style={{ border: '0.5px solid var(--color-border)' }}
    >
      <Icon size={16} className="text-text-faint shrink-0" />
      {label}
    </Link>
  )
}
