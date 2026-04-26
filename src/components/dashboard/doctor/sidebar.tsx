'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardList,
  Clock,
  IndianRupee,
  TrendingUp,
  UserCircle,
  LogOut,
  Globe,
  Menu,
  X,
} from 'lucide-react'
import MobileBottomNav from '@/components/dashboard/mobile-bottom-nav'

const NAV_ITEMS = [
  { href: '/doctor', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/doctor/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/doctor/patients', label: 'My Patients', icon: Users },
  { href: '/doctor/assignments', label: 'Assignments', icon: ClipboardList },
  { href: '/doctor/slots', label: 'My Slots', icon: Clock },
  { href: '/doctor/earnings', label: 'Earnings', icon: IndianRupee },
  { href: '/doctor/profile', label: 'Profile', icon: UserCircle },
]

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function DoctorSidebar({ doctorName }: { doctorName: string }) {
  const { data: authSession } = useSession()
  const displayName = authSession?.user?.name ?? doctorName
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
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
              onClick={() => setMobileOpen(false)}
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
    </div>
  )

  const bottomNavItems = [
    { href: '/doctor', label: 'Home', icon: LayoutDashboard, exact: true },
    { href: '/doctor/calendar', label: 'Calendar', icon: CalendarDays },
    { href: '/doctor/patients', label: 'Patients', icon: Users },
    { href: '/doctor/assignments', label: 'Tasks', icon: ClipboardList },
    { href: '/doctor/earnings', label: 'Earnings', icon: TrendingUp },
  ]

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100/80 flex items-center justify-between px-4 h-14 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} style={{ color: 'var(--navy)' }} />
          </button>
          <span className="font-semibold text-sm" style={{ color: 'var(--navy)' }}>
            Mindset
          </span>
        </div>
        <span className="text-xs bg-coral-50 text-coral-700 px-2.5 py-1 rounded-full font-semibold" style={{ background: '#fef2f2', color: '#b91c1c' }}>
          Doctor
        </span>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav items={bottomNavItems} />

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          onClick={() => setMobileOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-72 max-w-[85vw] h-full shadow-2xl flex flex-col"
            style={{ background: 'var(--navy)', animation: 'slideInLeft 0.2s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: 'var(--cream)' }}
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:block w-64 min-h-screen flex-shrink-0"
        style={{ background: 'var(--navy)' }}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
