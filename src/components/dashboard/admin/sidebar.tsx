'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  Calendar,
  BookOpen,
  Heart,
  ShoppingBag,
  FileText,
  Package,
  CreditCard,
  MessageSquare,
  LogOut,
  Globe,
  Menu,
  X,
} from 'lucide-react'
import MobileBottomNav from '@/components/dashboard/mobile-bottom-nav'

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/sessions', label: 'Sessions', icon: Calendar },
  { href: '/admin/workshops', label: 'Workshops', icon: BookOpen },
  { href: '/admin/ngo', label: 'NGO Visits', icon: Heart },
  { href: '/admin/products', label: 'Products', icon: ShoppingBag },
  { href: '/admin/study-materials', label: 'Study Materials', icon: FileText },
  { href: '/admin/orders', label: 'Orders', icon: Package },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
]

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function AdminSidebar({ adminName }: { adminName: string }) {
  const { data: authSession } = useSession()
  const displayName = authSession?.user?.name ?? adminName
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
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
              Admin
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
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
    { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: '/admin/sessions', label: 'Sessions', icon: Calendar },
    { href: '/admin/orders', label: 'Orders', icon: Package },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
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
        <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-semibold">
          Admin
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
