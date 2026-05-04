'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCart } from '@/lib/cart-context'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/team', label: 'Team' },
  { href: '/doctors', label: 'Doctors' },
  { href: '/workshops', label: 'Workshops' },
  { href: '/products', label: 'Products' },
  { href: '/study-materials', label: 'Study Materials' },
  { href: '/contact', label: 'Contact' },
]

const ROLE_HOME: Record<string, string> = {
  ADMIN: '/admin',
  DOCTOR: '/doctor',
  USER: '/user',
}

export default function Navbar({ light = false }: { light?: boolean }) {
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [scrollBack, setScrollBack] = useState(false)
  const pathname = usePathname()
  const lastScrollY = useRef(0)
  const { data: session, status } = useSession()
  const { totalItems } = useCart()

  const isUser = session?.user?.role === 'USER'

  // Scroll direction detection for fixed header
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrollBack(y > 200 && y < lastScrollY.current)
      lastScrollY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close overlay on route change
  useEffect(() => {
    setOverlayOpen(false)
    document.body.classList.remove('overflow-hidden')
  }, [pathname])

  const toggleOverlay = () => {
    const next = !overlayOpen
    setOverlayOpen(next)
    document.body.classList.toggle('overflow-hidden', next)
  }

  const closeOverlay = () => {
    setOverlayOpen(false)
    document.body.classList.remove('overflow-hidden')
  }

  const isLoggedIn = !!session?.user
  const authHref = isLoggedIn
    ? ROLE_HOME[session.user.role ?? ''] ?? '/user'
    : '/login'
  const authLabel = isLoggedIn ? 'Open dashboard' : 'Login'
  const userInitials = isLoggedIn
    ? (session.user.name ?? 'U')
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : ''
  const userImage = isLoggedIn ? session.user.image : null

  const headerClasses = `block-header${light ? ' block-header--light' : ''}${scrollBack ? ' -scroll-back' : ''}`

  return (
    <header className={headerClasses}>
      {/* --- Main top bar --- */}
      <div className="block-header__container container">
        <Link href="/" className="block-header__logo" aria-label="Mindset home">
          <Image
            src="/images/icons/Logo.webp"
            alt="Mindset"
            width={48}
            height={48}
            priority
            className="block-header__logo-img"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="block-header__nav">
          <ul className="block-header__nav-list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                {link.href.includes('#') ? (
                  <a href={link.href}>{link.label}</a>
                ) : (
                  <Link href={link.href}>{link.label}</Link>
                )}
              </li>
            ))}
            {isUser && (
              <li>
                <Link href="/user/cart" className="block-header__cart">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                  {totalItems > 0 && (
                    <span className="block-header__cart-badge">{totalItems > 9 ? '9+' : totalItems}</span>
                  )}
                </Link>
              </li>
            )}
            <li>
              {status === 'loading' ? (
                <span className="block-header__auth-placeholder" />
              ) : (
                <Link href={authHref} className="block-header__auth-btn" style={isLoggedIn ? { display: 'flex', alignItems: 'center', gap: '8px' } : undefined}>
                  {isLoggedIn && (
                    userImage ? (
                      <Image src={userImage} alt="" width={24} height={24} style={{ borderRadius: '50%', objectFit: 'cover' }} unoptimized />
                    ) : (
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--teal, #2D5A4F)', color: '#fff', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{userInitials}</span>
                    )
                  )}
                  {authLabel}
                </Link>
              )}
            </li>
          </ul>
        </nav>

        {/* Mobile: cart + hamburger */}
        <div className="block-header__mobile-right">
          {isUser && (
            <Link href="/user/cart" className="block-header__cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              {totalItems > 0 && (
                <span className="block-header__cart-badge">{totalItems > 9 ? '9+' : totalItems}</span>
              )}
            </Link>
          )}
          <button
            className={`block-header__toggler${overlayOpen ? ' -active' : ''}`}
            onClick={toggleOverlay}
            aria-label="Toggle menu"
          >
            <span className="block-header__toggler-line" />
            <span className="block-header__toggler-line" />
            <span className="block-header__toggler-line" />
          </button>
        </div>
      </div>

      {/* --- Fixed header on scroll-back (desktop) --- */}
      <div className="block-header__fixed">
        <div className="block-header__container container">
          <Link href="/" className="block-header__logo" aria-label="Mindset home">
            <Image
              src="/images/icons/Logo.webp"
              alt="Mindset"
              width={48}
              height={48}
              className="block-header__logo-img"
            />
          </Link>
          <nav className="block-header__nav">
            <ul className="block-header__nav-list">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  {link.href.includes('#') ? (
                    <a href={link.href}>{link.label}</a>
                  ) : (
                    <Link href={link.href}>{link.label}</Link>
                  )}
                </li>
              ))}
              {isUser && (
                <li>
                  <Link href="/user/cart" className="block-header__cart">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                    {totalItems > 0 && (
                      <span className="block-header__cart-badge">{totalItems > 9 ? '9+' : totalItems}</span>
                    )}
                  </Link>
                </li>
              )}
              <li>
                {status === 'loading' ? (
                  <span className="block-header__auth-placeholder" />
                ) : (
                  <Link href={authHref} className="block-header__auth-btn">
                    {authLabel}
                  </Link>
                )}
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* --- Mobile overlay menu --- */}
      <div className={`block-header__overlay${overlayOpen ? ' -active' : ''}`}>
        <div className="block-header__overlay-inner">

          {/* Top bar */}
          <div className="block-header__overlay-top">
            <Link href="/" className="block-header__overlay-logo" onClick={closeOverlay} aria-label="Mindset home">
              <Image
                src="/images/icons/Logo.webp"
                alt="Mindset"
                width={40}
                height={40}
                className="block-header__logo-img"
              />
            </Link>
            <button className="block-header__overlay-close" onClick={closeOverlay} aria-label="Close menu">
              <span /><span />
            </button>
          </div>

          {/* Nav links */}
          <nav className="block-header__overlay-nav">
            <ul className="block-header__overlay-nav-list">
              {NAV_LINKS.map((link, i) => (
                <li key={link.href} style={{ '--nav-i': i } as React.CSSProperties}>
                  {link.href.includes('#') ? (
                    <a
                      href={link.href}
                      onClick={closeOverlay}
                    >
                      <span className="block-header__overlay-nav-num">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="block-header__overlay-nav-label">{link.label}</span>
                      <svg className="block-header__overlay-nav-arrow" width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <path d="M4 11h14M11 4l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>
                  ) : (
                  <Link
                    href={link.href}
                    onClick={closeOverlay}
                    className={pathname === link.href ? '-current' : ''}
                  >
                    <span className="block-header__overlay-nav-num">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="block-header__overlay-nav-label">{link.label}</span>
                    <svg className="block-header__overlay-nav-arrow" width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <path d="M4 11h14M11 4l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="block-header__overlay-footer">
            {isUser && (
              <Link href="/user/cart" className="block-header__overlay-cart-btn" onClick={closeOverlay}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                Cart
                {totalItems > 0 && <span className="block-header__overlay-cart-count">{totalItems > 9 ? '9+' : totalItems}</span>}
              </Link>
            )}
            <Link href={authHref} className="block-header__overlay-auth-btn" onClick={closeOverlay}>
              {status === 'loading' ? '...' : authLabel}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>

        </div>
      </div>
    </header>
  )
}
