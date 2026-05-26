import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })) })

async function main() {
  const doctor = await prisma.doctor.findFirst({ where: { user: { email: 'smoketest-doctor@mindset.test' } } })
  if (!doctor) throw new Error('no doctor')

  console.log('=== Final state ===\n')

  const payouts = await prisma.payout.findMany({
    where: { doctorId: doctor.id },
    include: { earnings: { select: { id: true, doctorAmount: true } } },
  })
  console.log(`Payouts: ${payouts.length}`)
  for (const p of payouts) {
    console.log(`  ${p.id}  ₹${p.amount}  ${p.method}  ${p.transactionRef}  linked ${p.earnings.length} earnings`)
  }

  const earnings = await prisma.doctorEarning.findMany({
    where: { doctorId: doctor.id },
    select: { id: true, doctorAmount: true, status: true, payoutId: true },
    orderBy: { createdAt: 'desc' },
  })
  console.log(`\nEarnings: ${earnings.length}`)
  for (const e of earnings) {
    console.log(`  ₹${e.doctorAmount}  ${e.status.padEnd(7)}  payout=${e.payoutId ?? 'null'}`)
  }

  const notifs = await prisma.notification.findMany({
    where: { userId: doctor.userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })
  const unread = notifs.filter(n => !n.readAt).length
  console.log(`\nNotifications: ${notifs.length} (${unread} unread)`)
  for (const n of notifs) {
    console.log(`  [${n.readAt ? 'read' : 'UNREAD'}]  ${n.kind}  "${n.title}"`)
  }
}
main().finally(() => prisma.$disconnect())
