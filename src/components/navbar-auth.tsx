'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'

const ROLE_HOME: Record<string, string> = {
  ADMIN: '/admin',
  DOCTOR: '/doctor',
  USER: '/user',
}

export function NavbarAuthDesktop() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="w-24 h-9 animate-pulse rounded-lg" style={{ background: 'rgba(0,0,0,0.1)' }} />
  }

  if (session?.user) {
    const href = ROLE_HOME[session.user.role ?? ''] ?? '/user'
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary nav-cta"
      >
        Dashboard
      </a>
    )
  }

  return (
    <Link href="/login" className="btn-primary nav-cta">
      Login
    </Link>
  )
}

export function NavbarAuthMobile() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="w-20 h-8 animate-pulse rounded-lg" style={{ background: 'rgba(0,0,0,0.1)' }} />
  }

  if (session?.user) {
    const href = ROLE_HOME[session.user.role ?? ''] ?? '/user'
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary nav-cta-mobile"
      >
        Dashboard
      </a>
    )
  }

  return (
    <Link href="/login" className="btn-primary nav-cta-mobile">
      Login
    </Link>
  )
}

export function NavbarAuthFloating() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="w-24 h-9 animate-pulse rounded-lg" style={{ background: 'rgba(0,0,0,0.1)' }} />
  }

  if (session?.user) {
    const href = ROLE_HOME[session.user.role ?? ''] ?? '/user'
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary nav-cta"
      >
        Dashboard
      </a>
    )
  }

  return (
    <Link href="/login" className="btn-primary nav-cta">
      Login
    </Link>
  )
}
