#!/usr/bin/env node
// Forge a session JWT and hit /api/auth/session to inspect what fields leak.
import { encode } from '@auth/core/jwt'

const userId = process.argv[2] ?? 'cmp54smvb000004i59zmpvelr'
const appUrl = 'https://mindset-ten.vercel.app'

const token = await encode({
  token: { id: userId, role: 'USER', sub: userId, name: 'Test', email: 'test@example.com' },
  secret: process.env.NEXTAUTH_SECRET,
  salt: '__Secure-authjs.session-token',
  maxAge: 30 * 24 * 60 * 60,
})

const res = await fetch(`${appUrl}/api/auth/session`, {
  headers: { Cookie: `__Secure-authjs.session-token=${token}` },
})

console.log('status:', res.status)
console.log('Set-Cookie:', res.headers.get('set-cookie') ?? '(none)')
console.log('body:', await res.text())
