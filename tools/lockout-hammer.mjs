#!/usr/bin/env node
// Hit NextAuth credentials login with a wrong password (one attempt per run).
// Usage: node tools/lockout-hammer.mjs <email> <wrong-password> [appUrl]

const email = process.argv[2]
const password = process.argv[3]
const appUrl = process.argv[4] ?? 'https://mindset-ten.vercel.app'

if (!email || !password) {
  console.error('Usage: node tools/lockout-hammer.mjs <email> <wrong-password> [appUrl]')
  process.exit(2)
}

// 1) GET /api/auth/csrf — capture token + cookie
const csrfRes = await fetch(`${appUrl}/api/auth/csrf`)
const csrfData = await csrfRes.json()
const csrfToken = csrfData.csrfToken
const csrfCookie = csrfRes.headers.get('set-cookie')
if (!csrfToken || !csrfCookie) {
  console.error('Failed to obtain CSRF token/cookie')
  console.error('cookie:', csrfCookie, 'data:', csrfData)
  process.exit(1)
}
// Extract just "<name>=<value>" before any attributes
const cookiePair = csrfCookie.split(';')[0]

// 2) POST /api/auth/callback/credentials with form-encoded body
const body = new URLSearchParams({
  csrfToken,
  email,
  password,
  callbackUrl: `${appUrl}/user`,
  json: 'true',
})

const res = await fetch(`${appUrl}/api/auth/callback/credentials`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Cookie: cookiePair,
  },
  body,
  redirect: 'manual',
})

console.log('status:', res.status)
console.log('location:', res.headers.get('location') ?? '(none)')
const text = await res.text()
if (text) console.log('body:', text.slice(0, 200))
