import { cache } from 'react'
import { auth } from '@/lib/auth'

// Request-memoized session. auth() decodes + verifies the JWT on every
// call, and the dashboard render tree calls it three times per home render
// (the (dashboard) layout, the /user layout, AND the page). Wrapping in
// React cache() collapses those to a single verify per request.
//
// Use this in Server Components / pages. Middleware (proxy.ts) and route
// handlers keep calling auth() directly — cache() is a React server
// primitive and must not leak into the edge/middleware path.
export const getSession = cache(async () => auth())
