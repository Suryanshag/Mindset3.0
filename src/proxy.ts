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
        // Preserve the full path + query string so post-login redirect lands
        // back exactly where the user was, including e.g. ?doctorId=X.
        loginUrl.searchParams.set('callbackUrl', pathname + nextUrl.search)
        return NextResponse.redirect(loginUrl)
      }

      const userRole = session.user.role as string
      if (!allowedRoles.includes(userRole)) {
        const home = ROLE_HOME[userRole] ?? '/'
        return NextResponse.redirect(new URL(home, req.url))
      }
    }
  }

  // Forward the pathname as a request header so Server Components (most
  // notably MobileShell's post-session-interstitial skip-list) can read
  // the current route. Next App Router doesn't surface req.url to RSCs;
  // header-passing through middleware is the documented pattern.
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
})

export const config = {
  matcher: [
    '/user/:path*',
    '/doctor/:path*',
    '/admin/:path*',
  ],
}
