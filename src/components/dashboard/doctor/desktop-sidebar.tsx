'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  CalendarDays,
  ListChecks,
  Users,
  ClipboardList,
  Clock,
  IndianRupee,
  Wallet,
  UserCircle,
  LogOut,
  Globe,
  Bell,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/doctor', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/doctor/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/doctor/sessions', label: 'Sessions', icon: ListChecks },
  { href: '/doctor/patients', label: 'My Patients', icon: Users },
  { href: '/doctor/assignments', label: 'Assignments', icon: ClipboardList },
  { href: '/doctor/slots', label: 'My Slots', icon: Clock },
  { href: '/doctor/earnings', label: 'Earnings', icon: IndianRupee },
  { href: '/doctor/payouts', label: 'Payouts', icon: Wallet },
  { href: '/doctor/profile', label: 'Profile', icon: UserCircle },
]

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function DoctorDesktopSidebar({ doctorName }: { doctorName: string }) {
  const { data: authSession } = useSession()
  const displayName = authSession?.user?.name ?? doctorName
  const pathname = usePathname()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetch('/api/doctor/notifications/unread-count')
      .then((r) => r.json())
      .then((d) => { if (d.success) setUnreadCount(d.data.count) })
      .catch(() => {})
  }, [pathname])

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside
      className="hidden lg:flex w-64 min-h-screen flex-shrink-0 flex-col"
      style={{ background: 'var(--navy)' }}
    >
      {/* Doctor info */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: 'var(--coral)', color: '#fff' }}
          >
            {getInitials(displayName)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--cream)' }}>
              {displayName}
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,248,235,0.5)' }}>
              Doctor
            </p>
          </div>
          <Link
            href="/doctor/notifications"
            className="relative p-1.5 ml-auto"
            aria-label="Notifications"
          >
            <Bell size={16} style={{ color: 'rgba(255,248,235,0.7)' }} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
            )}
          </Link>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: active ? 'var(--coral)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,248,235,0.7)',
                borderLeft: active ? '3px solid var(--cream)' : '3px solid transparent',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon size={20} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Back to website + Sign out */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{ color: 'rgba(255,248,235,0.7)' }}
        >
          <Globe size={18} />
          Back to Website
        </Link>
        <button
          onClick={async () => {
            await signOut({ redirect: false })
            router.replace('/login')
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-colors"
          style={{ color: 'rgba(255,248,235,0.7)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--coral)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,248,235,0.7)')}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
