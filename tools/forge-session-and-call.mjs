#!/usr/bin/env node
// Forge a NextAuth v5 session JWT for a target user, then POST to a given path.
// Used only for end-to-end testing of server-side gates that depend on auth().
//
// Usage: node tools/forge-session-and-call.mjs <userId> <appUrl> [doctorId] [slotId]
import { encode } from '@auth/core/jwt'

const userId = process.argv[2]
const appUrl = process.argv[3] ?? 'https://mindset-ten.vercel.app'
const doctorId = process.argv[4] ?? 'placeholder'
const slotId = process.argv[5] ?? 'placeholder'

if (!userId) {
  console.error('Usage: node tools/forge-session-and-call.mjs <userId> [appUrl] [doctorId] [slotId]')
  process.exit(2)
}

const secret = process.env.NEXTAUTH_SECRET
if (!secret) {
  console.error('NEXTAUTH_SECRET not in env')
  process.exit(2)
}

const payload = {
  id: userId,
  role: 'USER',
  sub: userId,
  name: 'Test',
  email: 'test@example.com',
}

const token = await encode({
  token: payload,
  secret,
  salt: '__Secure-authjs.session-token',
  maxAge: 30 * 24 * 60 * 60,
})

const cookieName = '__Secure-authjs.session-token'
console.log('forged token (preview):', token.slice(0, 40) + '...')
console.log('doctorId:', doctorId, ' slotId:', slotId)

const res = await fetch(`${appUrl}/api/user/sessions/book`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Cookie: `${cookieName}=${token}`,
  },
  body: JSON.stringify({ doctorId, slotId }),
})

const text = await res.text()
console.log('status:', res.status)
console.log('body:', text)
