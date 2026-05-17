import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import type { Role } from '@prisma/client'
import { logAuthEvent } from '@/lib/auth-events'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// Fail loud if Google OAuth env vars are missing in any non-test process.
if (process.env.NODE_ENV !== 'test') {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error(
      '[AUTH] GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required. Google sign-in will fail until both are set in process.env.'
    )
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'select_account',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            password: true,
            failedLoginAttempts: true,
            lockedUntil: true,
          },
        })

        // No user OR no password (Google-only account). Same response so no enumeration.
        if (!user || !user.password) return null

        // Currently locked? Refuse even if password is correct.
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          // Fire-and-forget — audit log, doesn't gate the response.
          logAuthEvent({
            userId: user.id,
            kind: 'LOGIN_FAILED',
            metadata: { reason: 'locked' },
          }).catch((err) => console.error('[AUTH_EVENT_LOG_FAILED]', err))
          return null
        }

        const passwordMatch = await bcrypt.compare(password, user.password)
        if (!passwordMatch) {
          // Failed-password branch: lockout state MUST be awaited so an
          // attacker can't beat the rate limit by firing parallel attempts.
          const newAttempts = user.failedLoginAttempts + 1
          if (newAttempts >= 5) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: 0,
                lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
              },
            })
            logAuthEvent({ userId: user.id, kind: 'ACCOUNT_LOCKED' })
              .catch((err) => console.error('[AUTH_EVENT_LOG_FAILED]', err))
          } else {
            await prisma.user.update({
              where: { id: user.id },
              data: { failedLoginAttempts: newAttempts },
            })
            logAuthEvent({
              userId: user.id,
              kind: 'LOGIN_FAILED',
              metadata: { attempts: newAttempts },
            }).catch((err) => console.error('[AUTH_EVENT_LOG_FAILED]', err))
          }
          return null
        }

        // Success — fire-and-forget the counter reset + audit log so we
        // return to NextAuth immediately. lastLoginAt and the success row
        // are not required to be persisted before the user's session
        // cookie is set; both can settle async without affecting auth
        // correctness. Saves a sequential update + insert (~400-500ms warm)
        // off the credentials POST critical path.
        prisma.user
          .update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lastLoginAt: new Date() },
          })
          .catch((err) => console.error('[AUTH_POST_LOGIN_UPDATE_FAILED]', err))
        logAuthEvent({ userId: user.id, kind: 'LOGIN_SUCCESS' })
          .catch((err) => console.error('[AUTH_EVENT_LOG_FAILED]', err))

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return true
      if (!user.email) return false

      const email = user.email.toLowerCase().trim()
      const existing = await prisma.user.findUnique({
        where: { email },
        include: { accounts: { where: { provider: 'google' } } },
      })

      // New user — adapter will create the User + Account rows.
      if (!existing) return true

      // Already has Google linked — normal sign-in.
      if (existing.accounts.length > 0) return true

      // Email exists via credentials, no Google linked — refuse (Option A).
      await logAuthEvent({
        userId: existing.id,
        kind: 'LOGIN_GOOGLE_BLOCKED',
        metadata: { reason: 'email_exists_credentials' },
      })
      return '/login?error=email_exists'
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role as Role
      }
      // When update() is called from client
      if (trigger === 'update' && session) {
        if (session.name !== undefined) token.name = session.name
        if (session.image !== undefined) token.picture = session.image
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
      }
      return session
    },
  },
  events: {
    async linkAccount({ user, account }) {
      if (account.provider !== 'google') return
      if (!user.id) return
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date(), lastLoginAt: new Date() },
        })
      } catch (err) {
        console.error('[AUTH] linkAccount update failed', err)
      }
      await logAuthEvent({ userId: user.id, kind: 'REGISTER_GOOGLE' })
    },
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return
      if (!user.id) return
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })
      } catch (err) {
        console.error('[AUTH] signIn lastLoginAt update failed', err)
      }
      await logAuthEvent({ userId: user.id, kind: 'LOGIN_GOOGLE_SUCCESS' })
    },
  },
})
