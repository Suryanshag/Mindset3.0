'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  CreditCard,
  BookOpen,
  Package,
  ShoppingCart,
  UserCircle,
  MapPin,
  LogOut,
  Globe,
  Menu,
  X,
  Pin,
  PinOff,
} from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import MobileBottomNav from '@/components/dashboard/mobile-bottom-nav'

const NAV_ITEMS = [
  { href: '/user', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/user/sessions', label: 'My Sessions', icon: Calendar },
  { href: '/user/assignments', label: 'Assignments', icon: ClipboardList },
  { href: '/user/payments', label: 'Payments', icon: CreditCard },
  { href: '/user/library', label: 'Library', icon: BookOpen },
  { href: '/user/orders', label: 'My Orders', icon: Package },
  { href: '/user/cart', label: 'Cart', icon: ShoppingCart },
  { href: '/user/profile', label: 'Profile', icon: UserCircle },
  { href: '/user/addresses', label: 'Addresses', icon: MapPin },
]

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function UserSidebar({ userName }: { userName: string }) {
  const { data: authSession } = useSession()
  const displayName = authSession?.user?.name ?? userName
  const pathname = usePathname()
  const router = useRouter()
  const { totalItems, clearCart } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-pinned')
    if (saved === 'true') setPinned(true)
  }, [])

  function togglePin() {
    const next = !pinned
    setPinned(next)
    localStorage.setItem('sidebar-pinned', String(next))
  }

  const expanded = pinned || hovered

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  const bottomNavItems = [
    { href: '/user', label: 'Home', icon: LayoutDashboard, exact: true },
    { href: '/user/sessions', label: 'Sessions', icon: Calendar },
    { href: '/user/orders', label: 'Orders', icon: Package },
    { href: '/user/library', label: 'Library', icon: BookOpen },
    { href: '/user/profile', label: 'Profile', icon: UserCircle },
  ]

  return (
    <>
      {/* ═══ Mobile Top Bar ═══ */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 h-14"
        style={{ background: 'var(--cream)', borderBottom: '1px solid rgba(30,68,92,0.06)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-xl active:scale-95 transition-transform"
            aria-label="Open menu"
          >
            <Menu size={20} style={{ color: 'var(--navy)' }} />
          </button>
          <span className="font-bold text-sm" style={{ color: 'var(--navy)', fontFamily: 'var(--font-heading)' }}>
            Mindset
          </span>
        </div>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
          style={{ background: 'var(--coral)' }}
          suppressHydrationWarning
        >
          {getInitials(displayName)}
        </div>
      </div>

      {/* ═══ Mobile Bottom Nav ═══ */}
      <MobileBottomNav items={bottomNavItems} />

      {/* ═══ Mobile Drawer Overlay ═══ */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          onClick={() => setMobileOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" />
          <div
            className="relative w-72 max-w-[85vw] h-full shadow-2xl flex flex-col"
            style={{ background: 'var(--navy)', animation: 'slideInLeft 0.25s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-white/10 transition-colors"
              style={{ color: 'var(--cream)' }}
            >
              <X size={18} />
            </button>

            {/* Drawer User Info */}
            <div className="p-5 pb-4 border-b border-white/8">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: 'var(--coral)' }}
                  suppressHydrationWarning
                >
                  {getInitials(displayName)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--cream)' }}>
                    {displayName}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(255,248,235,0.4)' }}>Patient</p>
                </div>
              </div>
            </div>

            {/* Drawer Nav */}
            <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
              {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{
                      background: active ? 'rgba(249,101,83,0.12)' : 'transparent',
                      color: active ? 'var(--coral)' : 'rgba(255,248,235,0.6)',
                    }}
                  >
                    <Icon size={20} />
                    {label}
                    {label === 'Cart' && totalItems > 0 && (
                      <span className="ml-auto bg-teal-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {totalItems > 9 ? '9+' : totalItems}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-white/8 space-y-0.5">
              <Link
                href="/"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ color: 'rgba(255,248,235,0.85)' }}
              >
                <Globe size={18} />
                Back to Website
              </Link>
              <button
                onClick={async () => {
                  await clearCart()
                  await signOut({ redirect: false })
                  router.replace('/login')
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold w-full transition-all duration-200"
                style={{ color: '#F96553', background: 'rgba(249,101,83,0.1)' }}
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Desktop Sidebar — Slim Rail ═══ */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0 min-h-screen transition-all duration-300 ease-out"
        style={{
          width: expanded ? '240px' : '72px',
          background: 'var(--navy)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* User Avatar + Pin */}
        <div className="p-3 pt-5 pb-4 border-b border-white/8">
          <div className={`flex items-center ${expanded ? 'gap-3 px-2' : 'justify-center'}`}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: 'var(--coral)' }}
              suppressHydrationWarning
            >
              {getInitials(displayName)}
            </div>
            {expanded && (
              <div className="min-w-0 flex-1 flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--cream)' }}>
                    {displayName}
                  </p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,248,235,0.35)' }}>Patient</p>
                </div>
                <button
                  onClick={togglePin}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                  style={{ color: 'rgba(255,248,235,0.4)' }}
                  title={pinned ? 'Unpin sidebar' : 'Pin sidebar open'}
                >
                  {pinned ? <PinOff size={14} /> : <Pin size={14} />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center rounded-xl text-sm font-medium
                  transition-all duration-200 group relative
                  ${expanded ? 'gap-3 px-3 py-2.5' : 'justify-center py-3'}
                `}
                style={{
                  background: active ? 'rgba(249,101,83,0.12)' : 'transparent',
                  color: active ? '#F96553' : 'rgba(255,248,235,0.55)',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
                title={!expanded ? label : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                {expanded && (
                  <span className="truncate">{label}</span>
                )}
                {expanded && label === 'Cart' && totalItems > 0 && (
                  <span className="ml-auto bg-teal-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
                {!expanded && label === 'Cart' && totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-teal-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-2 border-t border-white/8 space-y-0.5">
          <Link
            href="/"
            className={`
              flex items-center rounded-xl text-sm font-medium transition-colors
              ${expanded ? 'gap-3 px-3 py-2.5' : 'justify-center py-3'}
            `}
            style={{ color: 'rgba(255,248,235,0.85)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFF8EB')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,248,235,0.85)')}
            title={!expanded ? 'Back to Website' : undefined}
          >
            <Globe size={18} className="flex-shrink-0" />
            {expanded && <span>Back to Website</span>}
          </Link>
          <button
            onClick={async () => {
              await clearCart()
              await signOut({ redirect: false })
              router.replace('/login')
            }}
            className={`
              flex items-center rounded-xl text-sm font-semibold w-full transition-all duration-200
              ${expanded ? 'gap-3 px-3 py-2.5' : 'justify-center py-3'}
            `}
            style={{ color: '#F96553', background: 'rgba(249,101,83,0.1)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(249,101,83,0.18)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(249,101,83,0.1)' }}
            title={!expanded ? 'Sign Out' : undefined}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {expanded && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
