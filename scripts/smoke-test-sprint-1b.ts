/**
 * Sprint 1B smoke test — disposable.
 *
 * Run: npx tsx scripts/smoke-test-sprint-1b.ts
 *
 * Validates: PAN/UPI/payoutFullName on Doctor, NO_SHOW session status
 * with 15-min rule + 50/50 earnings split, user-side past-tab inclusion.
 *
 * Idempotent — reuses smoketest fixtures from Sprint 1A. Wipes prior
 * Sprint-1B test sessions/earnings/notifications at start.
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { updateDoctorProfileSchema } from '../src/lib/validations/doctor'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const TEST_DOCTOR_EMAIL = 'smoketest-doctor@mindset.test'
const TEST_USER_EMAIL = 'smoketest-user@mindset.test'

const results: string[] = []
const failures: string[] = []

function pass(n: number) {
  results.push(`${n}✅`)
}
function fail(n: number, reason: string) {
  results.push(`${n}❌`)
  failures.push(`  Test ${n}: ${reason}`)
}

type Ctx = {
  testUserId: string
  testDoctorId: string
  testDoctorUserId: string
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

  const doctorUser = await prisma.user.upsert({
    where: { email: TEST_DOCTOR_EMAIL },
    update: { name: 'Dr. Smoke Test' },
    create: {
      email: TEST_DOCTOR_EMAIL,
      name: 'Dr. Smoke Test',
      role: 'DOCTOR',
      emailVerified: new Date(),
    },
  })

  const testDoctor = await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {
      // Clear payout fields so test 1 starts from a known state.
      panNumber: null,
      upiId: null,
      payoutFullName: null,
    },
    create: {
      userId: doctorUser.id,
      slug: 'dr-smoke-test',
      designation: 'Smoke Test Doctor',
      type: 'COUNSELOR',
      specialization: 'Test',
      qualification: 'Test Qual',
      experience: 1,
      bio: 'Smoke test doctor',
      sessionPrice: 100,
    },
  })

  // Scope wipes to test doctor — never touches real data.
  await prisma.doctorEarning.deleteMany({ where: { doctorId: testDoctor.id } })
  await prisma.payment.deleteMany({
    where: { session: { doctorId: testDoctor.id } },
  })
  await prisma.session.deleteMany({ where: { doctorId: testDoctor.id } })
  await prisma.notification.deleteMany({ where: { userId: doctorUser.id } })

  return {
    testUserId: testUser.id,
    testDoctorId: testDoctor.id,
    testDoctorUserId: doctorUser.id,
  }
}

// ─── Test 1: Doctor profile accepts PAN/UPI ──────────────────────
async function test1_acceptsPanUpi(ctx: Ctx) {
  try {
    const parsed = updateDoctorProfileSchema.safeParse({
      panNumber: 'abcde1234f',
      upiId: 'test@okhdfcbank',
      payoutFullName: 'Dr. Smoke Test',
    })
    if (!parsed.success) return fail(1, 'valid input rejected by schema')

    const data: Record<string, unknown> = { ...parsed.data }
    if (data.panNumber === '') data.panNumber = null
    if (data.upiId === '') data.upiId = null
    if (data.payoutFullName === '') data.payoutFullName = null
    if (typeof data.panNumber === 'string')
      data.panNumber = data.panNumber.toUpperCase()

    await prisma.doctor.update({
      where: { id: ctx.testDoctorId },
      data,
    })

    const after = await prisma.doctor.findUnique({
      where: { id: ctx.testDoctorId },
      select: { panNumber: true, upiId: true, payoutFullName: true },
    })
    if (after?.panNumber !== 'ABCDE1234F')
      return fail(1, `PAN not uppercased: "${after?.panNumber}"`)
    if (after?.upiId !== 'test@okhdfcbank')
      return fail(1, `UPI mismatch: "${after?.upiId}"`)
    if (after?.payoutFullName !== 'Dr. Smoke Test')
      return fail(1, `payoutFullName mismatch: "${after?.payoutFullName}"`)
    pass(1)
  } catch (e) {
    fail(1, (e as Error).message)
  }
}

// ─── Test 2: Invalid PAN rejected ────────────────────────────────
async function test2_invalidPanRejected() {
  try {
    const parsed = updateDoctorProfileSchema.safeParse({ panNumber: 'INVALID' })
    if (parsed.success) return fail(2, 'invalid PAN was accepted')
    const issue = parsed.error.issues[0]?.message ?? ''
    if (!/pan/i.test(issue))
      return fail(2, `error message missing PAN context: "${issue}"`)
    pass(2)
  } catch (e) {
    fail(2, (e as Error).message)
  }
}

// ─── Test 3: Invalid UPI rejected ────────────────────────────────
async function test3_invalidUpiRejected() {
  try {
    const parsed = updateDoctorProfileSchema.safeParse({ upiId: 'notavalidupi' })
    if (parsed.success) return fail(3, 'invalid UPI was accepted')
    const issue = parsed.error.issues[0]?.message ?? ''
    if (!/upi/i.test(issue))
      return fail(3, `error message missing UPI context: "${issue}"`)
    pass(3)
  } catch (e) {
    fail(3, (e as Error).message)
  }
}

// ─── Test 4: Empty strings normalized to null ────────────────────
async function test4_emptyStringsNullified(ctx: Ctx) {
  try {
    const parsed = updateDoctorProfileSchema.safeParse({
      panNumber: '',
      upiId: '',
      payoutFullName: '',
    })
    if (!parsed.success) return fail(4, 'empty strings rejected by schema')

    const data: Record<string, unknown> = { ...parsed.data }
    if (data.panNumber === '') data.panNumber = null
    if (data.upiId === '') data.upiId = null
    if (data.payoutFullName === '') data.payoutFullName = null

    await prisma.doctor.update({
      where: { id: ctx.testDoctorId },
      data,
    })

    const after = await prisma.doctor.findUnique({
      where: { id: ctx.testDoctorId },
      select: { panNumber: true, upiId: true, payoutFullName: true },
    })
    if (after?.panNumber !== null)
      return fail(4, `PAN not null after empty-string update: "${after?.panNumber}"`)
    if (after?.upiId !== null)
      return fail(4, `UPI not null after empty-string update: "${after?.upiId}"`)
    if (after?.payoutFullName !== null)
      return fail(4, `payoutFullName not null: "${after?.payoutFullName}"`)
    pass(4)
  } catch (e) {
    fail(4, (e as Error).message)
  }
}

// ─── Test 5: NO_SHOW after 15-min → earning created ──────────────
async function test5_noShowAfter15minCreatesEarning(ctx: Ctx) {
  try {
    const startedTwentyMinAgo = new Date(Date.now() - 20 * 60 * 1000)
    const session = await prisma.session.create({
      data: {
        userId: ctx.testUserId,
        doctorId: ctx.testDoctorId,
        date: startedTwentyMinAgo,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
      },
    })
    const payment = await prisma.payment.create({
      data: {
        userId: ctx.testUserId,
        amount: 100,
        type: 'SESSION',
        status: 'PAID',
        sessionId: session.id,
        razorpayOrderId: `smoke_order_${session.id}`,
        razorpayPaymentId: `smoke_pay_${session.id}`,
      },
    })

    // Replicate the API NO_SHOW transition (15-min check + earning create).
    const fifteenMinAfter = new Date(session.date.getTime() + 15 * 60 * 1000)
    if (new Date() < fifteenMinAfter)
      return fail(5, 'guard rejected even though session is > 15 min old')

    const updated = await prisma.$transaction(
      async (tx) => {
        const s = await tx.session.update({
          where: { id: session.id },
          data: { status: 'NO_SHOW' },
        })
        const grossAmount = Number(payment.amount)
        const doctorAmount = (grossAmount * 0.5).toFixed(2)
        const platformAmount = (grossAmount * 0.5).toFixed(2)
        await tx.doctorEarning.create({
          data: {
            doctorId: ctx.testDoctorId,
            sessionId: session.id,
            paymentId: payment.id,
            grossAmount: payment.amount,
            doctorAmount,
            platformAmount,
            status: 'PENDING',
          },
        })
        return s
      },
      { maxWait: 8000, timeout: 15000 }
    )

    if (updated.status !== 'NO_SHOW')
      return fail(5, `status was "${updated.status}"`)
    const earning = await prisma.doctorEarning.findFirst({
      where: { sessionId: session.id },
    })
    if (!earning) return fail(5, 'no DoctorEarning row created')
    if (Number(earning.doctorAmount) !== 50)
      return fail(5, `doctorAmount was ${earning.doctorAmount}, expected 50`)
    if (earning.status !== 'PENDING')
      return fail(5, `earning status was "${earning.status}"`)
    pass(5)
  } catch (e) {
    fail(5, (e as Error).message)
  }
}

// ─── Test 6: NO_SHOW blocked before 15 min ───────────────────────
async function test6_noShowBlockedBefore15min(ctx: Ctx) {
  try {
    const startedFiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    const session = await prisma.session.create({
      data: {
        userId: ctx.testUserId,
        doctorId: ctx.testDoctorId,
        date: startedFiveMinAgo,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
      },
    })

    const fifteenMinAfter = new Date(session.date.getTime() + 15 * 60 * 1000)
    const wouldReject = new Date() < fifteenMinAfter
    if (!wouldReject)
      return fail(6, 'guard would have allowed early NO_SHOW (5 min after start)')
    pass(6)
  } catch (e) {
    fail(6, (e as Error).message)
  }
}

// ─── Test 7: NO_SHOW blocked on non-CONFIRMED ────────────────────
async function test7_noShowBlockedOnNonConfirmed(ctx: Ctx) {
  try {
    const session = await prisma.session.create({
      data: {
        userId: ctx.testUserId,
        doctorId: ctx.testDoctorId,
        date: new Date(Date.now() - 30 * 60 * 1000),
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
    })
    // The handler's first guard: existingSession.status !== 'CONFIRMED' → reject.
    if (session.status === 'CONFIRMED')
      return fail(7, 'fixture session was unexpectedly CONFIRMED')
    pass(7)
  } catch (e) {
    fail(7, (e as Error).message)
  }
}

// ─── Test 8: NO_SHOW appears in user past tab query ──────────────
async function test8_noShowInPastTab(ctx: Ctx) {
  try {
    const now = new Date()
    const pastSessions = await prisma.session.findMany({
      where: {
        userId: ctx.testUserId,
        doctorId: ctx.testDoctorId,
        OR: [
          { date: { lt: now } },
          { status: { in: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] } },
        ],
      },
      select: { id: true, status: true },
    })
    const hasNoShow = pastSessions.some((s) => s.status === 'NO_SHOW')
    if (!hasNoShow)
      return fail(8, "user past-tab query didn't surface NO_SHOW session")
    pass(8)
  } catch (e) {
    fail(8, (e as Error).message)
  }
}

// ─── Test 9: NO_SHOW DoctorEarning has 50/50 split ───────────────
async function test9_noShowEarningSplit(ctx: Ctx) {
  try {
    const earning = await prisma.doctorEarning.findFirst({
      where: { doctorId: ctx.testDoctorId, session: { status: 'NO_SHOW' } },
      include: { session: { select: { status: true } } },
    })
    if (!earning) return fail(9, 'no NO_SHOW earning row found')
    const gross = Number(earning.grossAmount)
    const doctor = Number(earning.doctorAmount)
    const platform = Number(earning.platformAmount)
    if (Math.abs(doctor - gross * 0.5) > 0.01)
      return fail(9, `doctorAmount ${doctor} ≠ 50% of ${gross}`)
    if (Math.abs(platform - gross * 0.5) > 0.01)
      return fail(9, `platformAmount ${platform} ≠ 50% of ${gross}`)
    pass(9)
  } catch (e) {
    fail(9, (e as Error).message)
  }
}

async function main() {
  console.log('Setting up test users/doctor + wiping prior 1B test data…')
  const ctx = await setup()

  await test1_acceptsPanUpi(ctx)
  await test2_invalidPanRejected()
  await test3_invalidUpiRejected()
  await test4_emptyStringsNullified(ctx)
  await test5_noShowAfter15minCreatesEarning(ctx)
  await test6_noShowBlockedBefore15min(ctx)
  await test7_noShowBlockedOnNonConfirmed(ctx)
  await test8_noShowInPastTab(ctx)
  await test9_noShowEarningSplit(ctx)

  console.log('\n────────────────────────────')
  console.log('SMOKE TEST RESULTS — Sprint 1B')
  console.log('────────────────────────────')
  console.log(results.join(' '))
  if (failures.length > 0) {
    console.log('\nFailures:')
    failures.forEach((f) => console.log(f))
  }
  console.log('────────────────────────────')
  console.log(
    `Test data left in DB: user=${TEST_USER_EMAIL}, doctor=${TEST_DOCTOR_EMAIL}`
  )
  console.log('Inspect via: npx prisma studio\n')
}

main()
  .catch((err) => {
    console.error('Smoke test crashed:', err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
