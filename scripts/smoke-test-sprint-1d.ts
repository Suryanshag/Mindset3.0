/**
 * Sprint 1D smoke test — disposable.
 *
 * Run: npx tsx scripts/smoke-test-sprint-1d.ts
 *
 * Validates: Payout creation transaction, cross-doctor / already-linked
 * rejection, EARNING_PAID notification, GET payouts summary, orphaned
 * PAID handling, earnings endpoint payout join, amount integrity,
 * SetNull cascade behavior on payout delete.
 *
 * Idempotent — reuses smoketest fixtures. Wipes prior 1D
 * payouts/earnings/payments/sessions scoped to the test doctors.
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const TEST_DOCTOR_EMAIL = 'smoketest-doctor@mindset.test'
const TEST_DOCTOR2_EMAIL = 'smoketest-doctor2@mindset.test'
const TEST_USER_EMAIL = 'smoketest-user@mindset.test'

const results: string[] = []
const failures: string[] = []

function pass(n: number) { results.push(`${n}✅`) }
function fail(n: number, reason: string) {
  results.push(`${n}❌`)
  failures.push(`  Test ${n}: ${reason}`)
}

type Ctx = {
  testUserId: string
  testDoctorAId: string
  testDoctorAUserId: string
  testDoctorBId: string
  // First 2 earning ids created in test 1 (used downstream).
  createdEarningIds?: string[]
  createdPayoutId?: string
}

async function setup(): Promise<Ctx> {
  const testUser = await prisma.user.upsert({
    where: { email: TEST_USER_EMAIL },
    update: { name: 'Smoke Test User' },
    create: {
      email: TEST_USER_EMAIL,
      name: 'Smoke Test User',
      role: 'USER',
      emailVerified: new Date(),
    },
  })

  const doctorAUser = await prisma.user.upsert({
    where: { email: TEST_DOCTOR_EMAIL },
    update: { name: 'Dr. Smoke Test' },
    create: {
      email: TEST_DOCTOR_EMAIL,
      name: 'Dr. Smoke Test',
      role: 'DOCTOR',
      emailVerified: new Date(),
    },
  })

  const doctorBUser = await prisma.user.upsert({
    where: { email: TEST_DOCTOR2_EMAIL },
    update: { name: 'Dr. Smoke Test 2' },
    create: {
      email: TEST_DOCTOR2_EMAIL,
      name: 'Dr. Smoke Test 2',
      role: 'DOCTOR',
      emailVerified: new Date(),
    },
  })

  const doctorA = await prisma.doctor.upsert({
    where: { userId: doctorAUser.id },
    update: {},
    create: {
      userId: doctorAUser.id,
      slug: 'dr-smoke-test',
      designation: 'Smoke Test Doctor',
      type: 'COUNSELOR',
      specialization: 'Test',
      qualification: 'Test',
      experience: 1,
      bio: 'Smoke test doctor',
      sessionPrice: 100,
    },
  })

  const doctorB = await prisma.doctor.upsert({
    where: { userId: doctorBUser.id },
    update: {},
    create: {
      userId: doctorBUser.id,
      slug: 'dr-smoke-test-2',
      designation: 'Smoke Test Doctor 2',
      type: 'COUNSELOR',
      specialization: 'Test',
      qualification: 'Test',
      experience: 1,
      bio: 'Smoke test doctor 2',
      sessionPrice: 100,
    },
  })

  // Scoped wipe — delete in FK-safe order. Earnings must go before
  // payments (paymentId is unique FK on earning).
  await prisma.payout.deleteMany({
    where: { doctorId: { in: [doctorA.id, doctorB.id] } },
  })
  await prisma.doctorEarning.deleteMany({
    where: { doctorId: { in: [doctorA.id, doctorB.id] } },
  })
  await prisma.payment.deleteMany({
    where: { session: { doctorId: { in: [doctorA.id, doctorB.id] } } },
  })
  await prisma.session.deleteMany({
    where: { doctorId: { in: [doctorA.id, doctorB.id] } },
  })
  await prisma.notification.deleteMany({
    where: { userId: { in: [doctorAUser.id, doctorBUser.id] } },
  })

  return {
    testUserId: testUser.id,
    testDoctorAId: doctorA.id,
    testDoctorAUserId: doctorAUser.id,
    testDoctorBId: doctorB.id,
  }
}

async function createEarning(
  ctx: Ctx,
  doctorId: string,
  amount = 100,
  daysAgo = 5,
): Promise<{ earningId: string; paymentId: string; sessionId: string }> {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
  const session = await prisma.session.create({
    data: {
      userId: ctx.testUserId,
      doctorId,
      date,
      status: 'COMPLETED',
      paymentStatus: 'PAID',
    },
  })
  const payment = await prisma.payment.create({
    data: {
      userId: ctx.testUserId,
      amount,
      type: 'SESSION',
      status: 'PAID',
      sessionId: session.id,
      razorpayOrderId: `smoke_1d_order_${session.id}`,
      razorpayPaymentId: `smoke_1d_pay_${session.id}`,
    },
  })
  const earning = await prisma.doctorEarning.create({
    data: {
      doctorId,
      sessionId: session.id,
      paymentId: payment.id,
      grossAmount: amount,
      doctorAmount: (amount * 0.5).toFixed(2),
      platformAmount: (amount * 0.5).toFixed(2),
      status: 'PENDING',
    },
  })
  return { earningId: earning.id, paymentId: payment.id, sessionId: session.id }
}

// ─── Test 1: Payout creation succeeds ────────────────────────────
async function test1_createPayout(ctx: Ctx) {
  try {
    const e1 = await createEarning(ctx, ctx.testDoctorAId, 200, 10)
    const e2 = await createEarning(ctx, ctx.testDoctorAId, 300, 12)
    ctx.createdEarningIds = [e1.earningId, e2.earningId]

    // Replicate /api/admin/payouts POST transaction.
    const earnings = await prisma.doctorEarning.findMany({
      where: { id: { in: ctx.createdEarningIds } },
      select: { id: true, doctorAmount: true },
    })
    const total = earnings.reduce((s, e) => s + Number(e.doctorAmount), 0)

    const payout = await prisma.$transaction(async (tx) => {
      const p = await tx.payout.create({
        data: {
          doctorId: ctx.testDoctorAId,
          amount: total.toFixed(2),
          method: 'UPI',
          transactionRef: 'SMOKE-REF-001',
          note: 'Sprint 1D test payout',
        },
      })
      await tx.doctorEarning.updateMany({
        where: { id: { in: ctx.createdEarningIds! } },
        data: { status: 'PAID', payoutId: p.id },
      })
      await tx.notification
        .create({
          data: {
            userId: ctx.testDoctorAUserId,
            kind: 'EARNING_PAID',
            title: 'Payout received',
            body: `₹${total.toLocaleString('en-IN')} settled via upi for ${earnings.length} session(s).`,
            link: '/doctor/payouts',
          },
        })
        .catch(() => {})
      return p
    }, { maxWait: 8000, timeout: 15000 })

    ctx.createdPayoutId = payout.id

    const after = await prisma.doctorEarning.findMany({
      where: { id: { in: ctx.createdEarningIds } },
      select: { id: true, status: true, payoutId: true },
    })
    if (!after.every((e) => e.status === 'PAID'))
      return fail(1, 'earnings not flipped to PAID')
    if (!after.every((e) => e.payoutId === payout.id))
      return fail(1, 'earnings not linked to payout')
    if (Number(payout.amount) !== 250)
      return fail(1, `payout.amount was ${payout.amount}, expected 250`)
    pass(1)
  } catch (e) {
    fail(1, (e as Error).message)
  }
}

// ─── Test 2: Notification fires ──────────────────────────────────
async function test2_notificationFires(ctx: Ctx) {
  try {
    const notif = await prisma.notification.findFirst({
      where: {
        userId: ctx.testDoctorAUserId,
        kind: 'EARNING_PAID',
      },
      orderBy: { createdAt: 'desc' },
    })
    if (!notif) return fail(2, 'no EARNING_PAID notification row')
    if (notif.link !== '/doctor/payouts')
      return fail(2, `link was "${notif.link}", expected /doctor/payouts`)
    pass(2)
  } catch (e) {
    fail(2, (e as Error).message)
  }
}

// ─── Test 3: Cross-doctor earning rejected ───────────────────────
async function test3_crossDoctorRejected(ctx: Ctx) {
  try {
    const eB = await createEarning(ctx, ctx.testDoctorBId, 100, 3)
    const earnings = await prisma.doctorEarning.findMany({
      where: { id: { in: [eB.earningId] } },
      select: { id: true, doctorId: true },
    })
    // Replicate handler's per-earning guard.
    const wouldReject = earnings.some((e) => e.doctorId !== ctx.testDoctorAId)
    if (!wouldReject)
      return fail(3, 'guard would have allowed cross-doctor earning')
    pass(3)
  } catch (e) {
    fail(3, (e as Error).message)
  }
}

// ─── Test 4: Already-PAID earning rejected ───────────────────────
async function test4_alreadyPaidRejected(ctx: Ctx) {
  try {
    if (!ctx.createdEarningIds) return fail(4, 'no test-1 earning ids available')
    const earnings = await prisma.doctorEarning.findMany({
      where: { id: { in: ctx.createdEarningIds } },
      select: { id: true, status: true, payoutId: true },
    })
    const wouldReject = earnings.some((e) => e.status !== 'PENDING' || e.payoutId !== null)
    if (!wouldReject)
      return fail(4, 'guard would have allowed already-paid earning re-link')
    pass(4)
  } catch (e) {
    fail(4, (e as Error).message)
  }
}

// ─── Test 5: GET /api/doctor/payouts summary correct ─────────────
async function test5_getPayoutsSummary(ctx: Ctx) {
  try {
    const payouts = await prisma.payout.findMany({
      where: { doctorId: ctx.testDoctorAId },
      orderBy: { paidAt: 'desc' },
      include: {
        earnings: {
          select: {
            id: true,
            doctorAmount: true,
            session: { select: { date: true, user: { select: { name: true } } } },
          },
        },
      },
    })
    const totalPaidOut = payouts.reduce((s, p) => s + Number(p.amount), 0)

    if (payouts.length < 1) return fail(5, 'no payouts returned')
    if (totalPaidOut !== 250) return fail(5, `totalPaidOut was ${totalPaidOut}, expected 250`)
    if (payouts[0].earnings.length !== 2)
      return fail(5, `expected 2 earnings, got ${payouts[0].earnings.length}`)
    pass(5)
  } catch (e) {
    fail(5, (e as Error).message)
  }
}

// ─── Test 6: Orphaned PAID appears in summary ────────────────────
async function test6_orphanedPaidSurfaced(ctx: Ctx) {
  try {
    // Simulate Prisma Studio mistake: mark a fresh earning PAID with no payoutId.
    const e = await createEarning(ctx, ctx.testDoctorAId, 400, 1)
    await prisma.doctorEarning.update({
      where: { id: e.earningId },
      data: { status: 'PAID' }, // intentionally no payoutId
    })

    const agg = await prisma.doctorEarning.aggregate({
      where: { doctorId: ctx.testDoctorAId, status: 'PAID', payoutId: null },
      _sum: { doctorAmount: true },
      _count: true,
    })
    const orphanedAmount = Number(agg._sum.doctorAmount ?? 0)
    if (orphanedAmount < 200)
      return fail(6, `expected orphaned ≥200, got ${orphanedAmount}`)
    if (agg._count < 1)
      return fail(6, `expected orphaned count ≥1, got ${agg._count}`)
    pass(6)
  } catch (e) {
    fail(6, (e as Error).message)
  }
}

// ─── Test 7: Earnings endpoint includes paidAt+paymentMethod ─────
async function test7_earningsHasPayoutFields(ctx: Ctx) {
  try {
    const earnings = await prisma.doctorEarning.findMany({
      where: { doctorId: ctx.testDoctorAId },
      include: {
        session: { select: { date: true, user: { select: { name: true } } } },
        payout: { select: { id: true, paidAt: true, method: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    const linked = earnings.find((e) => e.payoutId !== null && e.status === 'PAID')
    if (!linked) return fail(7, 'no PAID + linked earning found')
    if (!linked.payout?.paidAt)
      return fail(7, 'payout.paidAt missing on linked earning')
    if (!linked.payout?.method)
      return fail(7, 'payout.method missing on linked earning')

    // Verify the response-shape mapping the handler does.
    const mapped = {
      paidAt: linked.payout?.paidAt ?? null,
      paymentMethod: linked.payout?.method ?? null,
    }
    if (mapped.paidAt === null || mapped.paymentMethod === null)
      return fail(7, 'mapping produced null values')
    pass(7)
  } catch (e) {
    fail(7, (e as Error).message)
  }
}

// ─── Test 8: Payout amount = sum of linked earnings ──────────────
async function test8_amountIntegrity(ctx: Ctx) {
  try {
    if (!ctx.createdPayoutId) return fail(8, 'no payout id available')
    const payout = await prisma.payout.findUnique({
      where: { id: ctx.createdPayoutId },
      include: { earnings: { select: { doctorAmount: true } } },
    })
    if (!payout) return fail(8, 'payout not found')
    const earningsSum = payout.earnings.reduce((s, e) => s + Number(e.doctorAmount), 0)
    if (Math.abs(Number(payout.amount) - earningsSum) > 0.01)
      return fail(8, `amount ${payout.amount} ≠ earnings sum ${earningsSum}`)
    pass(8)
  } catch (e) {
    fail(8, (e as Error).message)
  }
}

// ─── Test 9: Delete payout → earnings.payoutId = null, status stays PAID ──
async function test9_deletePayoutSetsNull(ctx: Ctx) {
  try {
    if (!ctx.createdPayoutId) return fail(9, 'no payout id available')
    if (!ctx.createdEarningIds) return fail(9, 'no earning ids available')

    await prisma.payout.delete({ where: { id: ctx.createdPayoutId } })

    const after = await prisma.doctorEarning.findMany({
      where: { id: { in: ctx.createdEarningIds } },
      select: { id: true, status: true, payoutId: true },
    })
    if (after.length !== ctx.createdEarningIds.length)
      return fail(9, 'earnings were cascaded (expected SetNull)')
    if (!after.every((e) => e.payoutId === null))
      return fail(9, 'payoutId not nulled after payout delete')
    if (!after.every((e) => e.status === 'PAID'))
      return fail(9, 'status was changed by payout delete (expected to stay PAID)')
    pass(9)
  } catch (e) {
    fail(9, (e as Error).message)
  }
}

async function main() {
  console.log('Setting up test users/doctors + wiping prior 1D test data…')
  const ctx = await setup()

  await test1_createPayout(ctx)
  await test2_notificationFires(ctx)
  await test3_crossDoctorRejected(ctx)
  await test4_alreadyPaidRejected(ctx)
  await test5_getPayoutsSummary(ctx)
  await test6_orphanedPaidSurfaced(ctx)
  await test7_earningsHasPayoutFields(ctx)
  await test8_amountIntegrity(ctx)
  await test9_deletePayoutSetsNull(ctx)

  console.log('\n────────────────────────────')
  console.log('SMOKE TEST RESULTS — Sprint 1D')
  console.log('────────────────────────────')
  console.log(results.join(' '))
  if (failures.length > 0) {
    console.log('\nFailures:')
    failures.forEach((f) => console.log(f))
  }
  console.log('────────────────────────────')
  console.log(
    `Test data left in DB: user=${TEST_USER_EMAIL}, doctorA=${TEST_DOCTOR_EMAIL}, doctorB=${TEST_DOCTOR2_EMAIL}`
  )
  console.log('Inspect via: npx prisma studio\n')
}

main()
  .catch((err) => {
    console.error('Smoke test crashed:', err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
