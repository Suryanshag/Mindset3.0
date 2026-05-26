/**
 * Replicates POST /api/admin/payouts logic, sans the ADMIN auth gate.
 * Live-smoke dress rehearsal — bundles the test doctor's 3 PENDING
 * earnings into one Payout, marks them PAID, fires EARNING_PAID notif.
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })) })

async function main() {
  const doctor = await prisma.doctor.findFirst({
    where: { user: { email: 'smoketest-doctor@mindset.test' } },
    select: { id: true, userId: true },
  })
  if (!doctor) throw new Error('no doctor')

  const earnings = await prisma.doctorEarning.findMany({
    where: { doctorId: doctor.id, status: 'PENDING' },
    select: { id: true, doctorAmount: true, payoutId: true, status: true },
  })

  // Mirror handler guards
  for (const e of earnings) {
    if (e.status !== 'PENDING') throw new Error(`Earning ${e.id} is ${e.status}, not PENDING`)
    if (e.payoutId) throw new Error(`Earning ${e.id} already linked to payout ${e.payoutId}`)
  }

  const totalAmount = earnings.reduce((s, e) => s + Number(e.doctorAmount), 0)
  console.log(`Total to settle: ₹${totalAmount} across ${earnings.length} earnings`)

  const payout = await prisma.$transaction(async (tx) => {
    const newPayout = await tx.payout.create({
      data: {
        doctorId: doctor.id,
        amount: totalAmount.toFixed(2),
        method: 'UPI',
        transactionRef: 'SMOKE-DRESS-001',
        note: 'Live smoke dress rehearsal payout',
        // paidAt defaults to now()
      },
    })
    await tx.doctorEarning.updateMany({
      where: { id: { in: earnings.map(e => e.id) } },
      data: { status: 'PAID', payoutId: newPayout.id },
    })
    await tx.notification.create({
      data: {
        userId: doctor.userId,
        kind: 'EARNING_PAID',
        title: 'Payout received',
        body: `₹${totalAmount.toLocaleString('en-IN')} settled via upi for ${earnings.length} session(s).`,
        link: '/doctor/payouts',
      },
    }).catch(() => {})
    return newPayout
  }, { maxWait: 8000, timeout: 15000 })

  console.log(`\n✓ Payout created`)
  console.log(`  id:         ${payout.id}`)
  console.log(`  amount:     ₹${payout.amount}`)
  console.log(`  method:     ${payout.method}`)
  console.log(`  ref:        ${payout.transactionRef}`)
  console.log(`  paidAt:     ${payout.paidAt.toISOString()}`)
}
main().catch(e => { console.error(e); process.exitCode = 1 }).finally(() => prisma.$disconnect())
