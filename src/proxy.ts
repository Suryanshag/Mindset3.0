import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const ROLE_ROUTES: Record<string, string[]> = {
  '/user': ['USER', 'ADMIN'],
  '/doctor': ['DOCTOR', 'ADMIN'],
  '/admin': ['ADMIN'],
}

const ROLE_HOME: Record<string, string> = {
  ADMIN: '/admin',
  DOCTOR: '/doctor',
  USER: '/user',
}

export const proxy = auth((req) => {
  const { nextUrl } = req
  const session = req.auth
  const pathname = nextUrl.pathname

  for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(route)) {
      if (!session?.user) {
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
      }

      const userRole = session.user.role as string
      if (!allowedRoles.includes(userRole)) {
        const home = ROLE_HOME[userRole] ?? '/'
        return NextResponse.redirect(new URL(home, req.url))
      }
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/user/:path*',
    '/doctor/:path*',
    '/admin/:path*',
  ],
}
