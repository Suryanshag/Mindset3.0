/**
 * Seed upcoming sessions for dev.
 * Run: npx tsx scripts/seed-sessions.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const user = await prisma.user.findFirst({
    where: { role: 'USER' },
    select: { id: true },
  })
  const doctors = await prisma.doctor.findMany({
    select: { id: true },
    take: 2,
  })

  if (!user || doctors.length === 0) {
    console.error('No users or doctors found. Seed those first.')
    return
  }

  const now = new Date()

  // Session 1: tomorrow at 10 AM, confirmed with meet link
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  // Session 2: next week at 3 PM, pending
  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 7)
  nextWeek.setHours(15, 0, 0, 0)

  const sessions = [
    {
      userId: user.id,
      doctorId: doctors[0].id,
      date: tomorrow,
      status: 'CONFIRMED' as const,
      paymentStatus: 'PAID' as const,
      meetLink: 'https://meet.google.com/abc-defg-hij',
    },
    {
      userId: user.id,
      doctorId: doctors[1 % doctors.length].id,
      date: nextWeek,
      status: 'PENDING' as const,
      paymentStatus: 'PAID' as const,
    },
  ]

  let count = 0
  for (const s of sessions) {
    await prisma.session.create({ data: s })
    count++
  }

  console.log(`Seeded ${count} sessions`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
