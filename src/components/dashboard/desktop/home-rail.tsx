import Link from 'next/link'
import { PenLine, Compass, Calendar, Search, BookOpen, ExternalLink } from 'lucide-react'
import type { EngagementState } from '@/lib/queries/dashboard'

export default function HomeRail({ engagementState }: { engagementState: EngagementState }) {
  if (engagementState === 'empty') {
    return (
      <div className="space-y-6">
        <div className="space-y-5">
          <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px]">
            Quick actions
          </p>
          <div className="space-y-2">
            <RailAction
              href="/user/sessions/book"
              icon={Search}
              label="Browse our therapists →"
            />
            <RailAction
              // TODO: replace with /user/wellness-quiz when the quiz lands.
              href="/user"
              icon={PenLine}
              label="Take the wellness quiz"
            />
            <RailAction
              href="https://mindset.org.in/about"
              icon={ExternalLink}
              label="Read our story →"
              external
            />
          </div>
        </div>

        {/* Small explainer for cold-start users — sits below Quick actions */}
        <div
          className="rounded-xl p-4 space-y-2"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          <p className="text-[13px] text-text leading-relaxed">
            Mindset combines therapy with daily practice.
          </p>
          <p className="text-[12px] text-text-muted leading-relaxed">
            Most people start with one session and build from there.
          </p>
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
        <RailAction href="/user/library" icon={BookOpen} label="Browse library" />
      </div>
    </div>
  )
}

function RailAction({
  href,
  icon: Icon,
  label,
  external = false,
}: {
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  external?: boolean
}) {
  const className =
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-text transition-colors duration-150 hover:bg-white/60'
  const style = { border: '1px solid var(--color-border)' }
  const content = (
    <>
      <Icon size={16} className="text-text-faint shrink-0" />
      {label}
    </>
  )

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
      >
        {content}
      </a>
    )
  }

  return (
    <Link href={href} className={className} style={style}>
      {content}
    </Link>
  )
}
