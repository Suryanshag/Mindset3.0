/**
 * Pair-smoke prep — disposable.
 *
 * One-shot: sets passwords on smoketest users, reports current DB state,
 * and seeds any missing fixtures needed for the 11 live flows.
 *
 * Run: npx tsx scripts/pair-smoke-prep.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const TEST_PASSWORD = 'SmokeTest123!'

async function main() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10)

  // Set passwords + clear any lockouts on both test users.
  await prisma.user.update({
    where: { email: 'smoketest-doctor@mindset.test' },
    data: { password: passwordHash, failedLoginAttempts: 0, lockedUntil: null },
  })
  await prisma.user.update({
    where: { email: 'smoketest-user@mindset.test' },
    data: { password: passwordHash, failedLoginAttempts: 0, lockedUntil: null },
  })

  const testDoctor = await prisma.doctor.findFirst({
    where: { user: { email: 'smoketest-doctor@mindset.test' } },
    include: { user: { select: { id: true, name: true, email: true } } },
  })
  const testUser = await prisma.user.findFirst({
    where: { email: 'smoketest-user@mindset.test' },
    select: { id: true, name: true, email: true },
  })

  if (!testDoctor || !testUser) {
    console.error('Missing test fixtures — run a smoke test first.')
    process.exit(1)
  }

  const now = new Date()
  const counts = {
    sessionsTotal: await prisma.session.count({ where: { doctorId: testDoctor.id } }),
    sessionsToday: await prisma.session.count({
      where: {
        doctorId: testDoctor.id,
        date: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
      },
    }),
    sessionsConfirmed: await prisma.session.count({
      where: { doctorId: testDoctor.id, status: 'CONFIRMED' },
    }),
    notificationsUnread: await prisma.notification.count({
      where: { userId: testDoctor.userId, readAt: null },
    }),
    earningsPending: await prisma.doctorEarning.count({
      where: { doctorId: testDoctor.id, status: 'PENDING' },
    }),
    payouts: await prisma.payout.count({ where: { doctorId: testDoctor.id } }),
    leaves: await prisma.doctorLeave.count({ where: { doctorId: testDoctor.id } }),
    futureSlots: await prisma.availableSlot.count({
      where: { doctorId: testDoctor.id, date: { gte: now }, isBooked: false },
    }),
  }

  console.log('\n=== PRE-FLIGHT STATE ===')
  console.log(`Test doctor:  id=${testDoctor.id}  userId=${testDoctor.userId}  name="${testDoctor.user.name}"  slug=${testDoctor.slug}`)
  console.log(`Test user:    id=${testUser.id}  name="${testUser.name}"`)
  console.log('Counts:', counts)

  // ─── Seed missing fixtures ─────────────────────────────────────
  const seeded: string[] = []

  // Need ≥3 future bookable slots
  if (counts.futureSlots < 3) {
    const slotDates: Date[] = []
    for (let d = 1; d <= 3; d++) {
      const dt = new Date(now)
      dt.setDate(dt.getDate() + d)
      dt.setHours(14, 0, 0, 0)
      slotDates.push(dt)
    }
    await prisma.availableSlot.createMany({
      data: slotDates.map((date) => ({ doctorId: testDoctor.id, date })),
      skipDuplicates: true,
    })
    seeded.push(`${slotDates.length} future slots (tomorrow–+3d at 2pm)`)
  }

  // Need 1 CONFIRMED session today (for testing Mark Complete after a real session)
  if (counts.sessionsToday === 0) {
    const todayMorning = new Date(now)
    todayMorning.setHours(9, 0, 0, 0) // 9 AM today (likely already past)
    await prisma.session.create({
      data: {
        userId: testUser.id,
        doctorId: testDoctor.id,
        date: todayMorning,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        meetLink: 'https://meet.google.com/smoke-test-today',
      },
    })
    seeded.push('1 CONFIRMED session today at 9 AM (test for Mark Complete UI)')
  }

  // Need 1 CONFIRMED session that started 16+ minutes ago (for Mark No-Show)
  // Use a unique session that we can guarantee passes the 15-min gate.
  const sixteenMinAgo = new Date(Date.now() - 16 * 60 * 1000)
  const existing16Min = await prisma.session.findFirst({
    where: {
      doctorId: testDoctor.id,
      status: 'CONFIRMED',
      date: { lt: new Date(Date.now() - 15 * 60 * 1000), gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  })
  let noShowTargetId: string | null = existing16Min?.id ?? null
  if (!existing16Min) {
    const noShowSession = await prisma.session.create({
      data: {
        userId: testUser.id,
        doctorId: testDoctor.id,
        date: sixteenMinAgo,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        meetLink: 'https://meet.google.com/smoke-test-noshow',
      },
    })
    // Also create a paid Payment so the earning split has something to compute against.
    await prisma.payment.create({
      data: {
        userId: testUser.id,
        amount: 500,
        type: 'SESSION',
        status: 'PAID',
        sessionId: noShowSession.id,
        razorpayOrderId: `pair_smoke_noshow_${noShowSession.id}`,
        razorpayPaymentId: `pair_smoke_pay_${noShowSession.id}`,
      },
    })
    noShowTargetId = noShowSession.id
    seeded.push('1 CONFIRMED session 16min ago + PAID payment (test for Mark No-Show)')
  }

  // Need ≥1 PENDING earning unlinked to payout (so Flow 11 has something to pay)
  if (counts.earningsPending < 1) {
    // Build a fresh COMPLETED session + payment + PENDING earning
    const past = new Date(now)
    past.setDate(past.getDate() - 5)
    const s = await prisma.session.create({
      data: {
        userId: testUser.id,
        doctorId: testDoctor.id,
        date: past,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
      },
    })
    const p = await prisma.payment.create({
      data: {
        userId: testUser.id,
        amount: 1000,
        type: 'SESSION',
        status: 'PAID',
        sessionId: s.id,
        razorpayOrderId: `pair_smoke_pending_${s.id}`,
        razorpayPaymentId: `pair_smoke_pendpay_${s.id}`,
      },
    })
    await prisma.doctorEarning.create({
      data: {
        doctorId: testDoctor.id,
        sessionId: s.id,
        paymentId: p.id,
        grossAmount: 1000,
        doctorAmount: 500,
        platformAmount: 500,
        status: 'PENDING',
      },
    })
    seeded.push('1 PENDING earning (₹500 doctor share) for Flow 11')
  }

  console.log('\n=== SEEDED ===')
  if (seeded.length === 0) console.log('(nothing — all fixtures present)')
  else seeded.forEach((s) => console.log(' + ' + s))

  if (noShowTargetId) {
    console.log(`\nNo-show target session id: ${noShowTargetId}`)
  }

  console.log('\n=== LOGIN CREDENTIALS ===')
  console.log(`URL:      http://localhost:3000/login`)
  console.log(`Password: ${TEST_PASSWORD}   (same for both users)`)
  console.log(`Doctor:   smoketest-doctor@mindset.test  → /doctor`)
  console.log(`User:     smoketest-user@mindset.test    → /user`)
  console.log()
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
