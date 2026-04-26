/**
 * Seed sample notifications for dev.
 * Run: npx tsx scripts/seed-notifications.ts
 *
 * Pass a userId as the first arg:
 *   npx tsx scripts/seed-notifications.ts clxxxxxxxxxx
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const userId = process.argv[2]
  if (!userId) {
    // Fall back to first USER in the DB
    const user = await prisma.user.findFirst({ where: { role: 'USER' } })
    if (!user) {
      console.error('No user found. Pass a userId as argument.')
      process.exit(1)
    }
    return seed(user.id)
  }
  return seed(userId)
}

async function seed(userId: string) {
  const now = Date.now()
  const hour = 60 * 60 * 1000
  const day = 24 * hour

  const notifications = [
    {
      userId,
      kind: 'SESSION_REMINDER' as const,
      title: 'Session tomorrow at 10:00 AM',
      body: 'Your session with Dr. Meera Sharma is tomorrow. Join from the Sessions tab.',
      link: '/user/sessions',
      createdAt: new Date(now - 2 * hour),
    },
    {
      userId,
      kind: 'WORKSHOP' as const,
      title: 'New workshop: Managing anxiety',
      body: 'A free workshop on daily anxiety management is open for registration.',
      link: '/workshops',
      createdAt: new Date(now - 5 * hour),
    },
    {
      userId,
      kind: 'SYSTEM' as const,
      title: 'Welcome to Mindset',
      body: 'We are glad to have you. Start by completing your profile.',
      link: '/user/profile',
      createdAt: new Date(now - 1 * day),
      readAt: new Date(now - 20 * hour),
    },
    {
      userId,
      kind: 'ORDER' as const,
      title: 'Your order has shipped',
      body: 'Order #1234 is on its way. Track it from the Shop tab.',
      link: '/user/shop',
      createdAt: new Date(now - 2 * day),
    },
    {
      userId,
      kind: 'REVIEW_PROMPT' as const,
      title: 'How was your session?',
      body: 'Share feedback about your session with Dr. Meera Sharma to help us improve.',
      link: '/user/sessions',
      createdAt: new Date(now - 4 * day),
      readAt: new Date(now - 3 * day),
    },
    {
      userId,
      kind: 'SYSTEM' as const,
      title: 'Complete your profile',
      body: 'Add your phone number and address to unlock personalized recommendations.',
      link: '/user/profile',
      createdAt: new Date(now - 8 * day),
      readAt: new Date(now - 7 * day),
    },
  ]

  for (const n of notifications) {
    await prisma.notification.create({ data: n })
  }

  console.log(`Seeded ${notifications.length} notifications for user ${userId}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
