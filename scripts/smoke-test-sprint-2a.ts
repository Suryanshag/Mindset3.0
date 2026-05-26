/**
 * Sprint 2A smoke test — disposable.
 *
 * Run: npx tsx scripts/smoke-test-sprint-2a.ts
 *
 * UI-heavy sprint; tests focus on data contracts the mobile UI relies on:
 *  - sessions endpoint shapes per ?view= variant
 *  - leaves endpoint shape
 *  - notifications unread-count endpoint
 *  - PATCH session transitions (COMPLETED + NO_SHOW) still create earnings
 *  - /doctor page renders 200 for an authenticated DOCTOR session
 *
 * Idempotent — reuses smoketest fixtures. Wipes prior Sprint-2A sessions
 * scoped to the test doctor at start.
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const TEST_DOCTOR_EMAIL = 'smoketest-doctor@mindset.test'
const TEST_USER_EMAIL = 'smoketest-user@mindset.test'
const TEST_PASSWORD = 'SmokeTest123!'
const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000'

const results: string[] = []
const failures: string[] = []

function pass(n: number) { results.push(`${n}✅`) }
function fail(n: number, reason: string) {
  results.push(`${n}❌`)
  failures.push(`  Test ${n}: ${reason}`)
}

type Ctx = {
  testUserId: string
  testDoctorId: string
  testDoctorUserId: string
  /** Persisted next-auth session cookie for the test doctor. */
  doctorCookie: string
}

async function setup(): Promise<Ctx> {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10)
  await prisma.user.update({
    where: { email: TEST_DOCTOR_EMAIL },
    data: { password: passwordHash, failedLoginAttempts: 0, lockedUntil: null },
  })

  const doctor = await prisma.doctor.findFirst({
    where: { user: { email: TEST_DOCTOR_EMAIL } },
    select: { id: true, userId: true },
  })
  const testUser = await prisma.user.findFirst({ where: { email: TEST_USER_EMAIL } })
  if (!doctor || !testUser) throw new Error('Missing fixtures — run a prior smoke test first.')

  // Log in via NextAuth credentials to get a session cookie. We use the
  // basic Auth.js /api/auth/csrf + /api/auth/callback/credentials dance.
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`, { credentials: 'include' })
  const { csrfToken } = await csrfRes.json()
  const csrfCookie = csrfRes.headers.get('set-cookie') ?? ''

  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      cookie: csrfCookie,
    },
    body: new URLSearchParams({
      csrfToken,
      email: TEST_DOCTOR_EMAIL,
      password: TEST_PASSWORD,
      callbackUrl: `${BASE_URL}/doctor`,
      json: 'true',
    }),
    redirect: 'manual',
  })

  // Collect all cookies returned by the login flow.
  const setCookies = loginRes.headers.getSetCookie?.() ?? []
  const cookieJar = [csrfCookie, ...setCookies]
    .map((c) => c.split(';')[0])
    .filter(Boolean)
    .join('; ')

  return {
    testUserId: testUser.id,
    testDoctorId: doctor.id,
    testDoctorUserId: doctor.userId,
    doctorCookie: cookieJar,
  }
}

async function authGet(path: string, cookie: string) {
  return fetch(`${BASE_URL}${path}`, { headers: { cookie }, redirect: 'manual' })
}
async function authPatch(path: string, cookie: string, body: object) {
  return fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ─── Test 1: /doctor route renders 200 ────────────────────────────
async function test1_doctorRouteRenders(ctx: Ctx) {
  try {
    const res = await authGet('/doctor', ctx.doctorCookie)
    // Auth.js may return a 200 (rendered) or a redirect if cookies didn't
    // bind. Accept the 200; flag anything else as failure.
    if (res.status !== 200) return fail(1, `expected 200, got ${res.status}`)
    pass(1)
  } catch (e) {
    fail(1, (e as Error).message)
  }
}

// ─── Test 2: /api/doctor/sessions?view=today shape ────────────────
async function test2_sessionsTodayShape(ctx: Ctx) {
  try {
    const res = await authGet('/api/doctor/sessions?view=today', ctx.doctorCookie)
    if (res.status !== 200) return fail(2, `status ${res.status}`)
    const data = await res.json()
    if (!data.success) return fail(2, `success=false: ${data.error}`)
    if (!Array.isArray(data.data)) return fail(2, 'data is not an array')
    // Optional shape check — empty arrays are valid for "no sessions today"
    pass(2)
  } catch (e) {
    fail(2, (e as Error).message)
  }
}

// ─── Test 3: /api/doctor/sessions?view=upcoming filters correctly ─
async function test3_upcomingFiltering(ctx: Ctx) {
  try {
    const res = await authGet('/api/doctor/sessions?view=upcoming', ctx.doctorCookie)
    const data = await res.json()
    if (!data.success) return fail(3, `success=false: ${data.error}`)
    const now = Date.now()
    for (const s of data.data) {
      const t = new Date(s.date).getTime()
      if (t < now) return fail(3, `session ${s.id} date ${s.date} is in the past`)
      if (s.status !== 'PENDING' && s.status !== 'CONFIRMED') {
        return fail(3, `session ${s.id} has status ${s.status}, expected PENDING|CONFIRMED`)
      }
    }
    pass(3)
  } catch (e) {
    fail(3, (e as Error).message)
  }
}

// ─── Test 4: /api/doctor/sessions?view=past includes NO_SHOW ──────
async function test4_pastIncludesNoShow(ctx: Ctx) {
  try {
    const res = await authGet('/api/doctor/sessions?view=past', ctx.doctorCookie)
    const data = await res.json()
    if (!data.success) return fail(4, `success=false: ${data.error}`)
    // The past tab must include NO_SHOW sessions per Sprint 1B requirement.
    // We don't require one to exist (DB may not have one), but if any do
    // exist in DB for this doctor with status=NO_SHOW, they must surface.
    const noShowInDb = await prisma.session.count({
      where: { doctorId: ctx.testDoctorId, status: 'NO_SHOW' },
    })
    const noShowInResp = data.data.filter((s: { status: string }) => s.status === 'NO_SHOW').length
    if (noShowInDb !== noShowInResp) {
      return fail(4, `DB has ${noShowInDb} NO_SHOW but past tab returned ${noShowInResp}`)
    }
    pass(4)
  } catch (e) {
    fail(4, (e as Error).message)
  }
}

// ─── Test 5: /api/doctor/leaves returns the doctor's leaves ───────
async function test5_leavesEndpoint(ctx: Ctx) {
  try {
    const dbLeaves = await prisma.doctorLeave.count({ where: { doctorId: ctx.testDoctorId } })
    const res = await authGet('/api/doctor/leaves', ctx.doctorCookie)
    const data = await res.json()
    if (!data.success) return fail(5, `success=false: ${data.error}`)
    if (!Array.isArray(data.data)) return fail(5, 'data is not an array')
    if (data.data.length !== dbLeaves) {
      return fail(5, `DB has ${dbLeaves} leaves, endpoint returned ${data.data.length}`)
    }
    pass(5)
  } catch (e) {
    fail(5, (e as Error).message)
  }
}

// ─── Test 6: /api/doctor/notifications/unread-count ───────────────
async function test6_unreadCountEndpoint(ctx: Ctx) {
  try {
    const dbUnread = await prisma.notification.count({
      where: { userId: ctx.testDoctorUserId, readAt: null },
    })
    const res = await authGet('/api/doctor/notifications/unread-count', ctx.doctorCookie)
    const data = await res.json()
    if (!data.success) return fail(6, `success=false: ${data.error}`)
    if (typeof data.data?.count !== 'number') return fail(6, 'count is not a number')
    if (data.data.count !== dbUnread) {
      return fail(6, `DB unread=${dbUnread}, endpoint returned ${data.data.count}`)
    }
    pass(6)
  } catch (e) {
    fail(6, (e as Error).message)
  }
}

// ─── Test 7: PATCH COMPLETED on 45+min past session creates earning ─
async function test7_completedCreatesEarning(ctx: Ctx) {
  try {
    // Create a fresh fixture: CONFIRMED session 1h ago with a PAID payment.
    const past = new Date(Date.now() - 60 * 60 * 1000)
    const session = await prisma.session.create({
      data: {
        userId: ctx.testUserId,
        doctorId: ctx.testDoctorId,
        date: past,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
      },
    })
    await prisma.payment.create({
      data: {
        userId: ctx.testUserId,
        amount: 1000,
        type: 'SESSION',
        status: 'PAID',
        sessionId: session.id,
        razorpayOrderId: `smoke_2a_complete_${session.id}`,
        razorpayPaymentId: `smoke_2a_completepay_${session.id}`,
      },
    })

    const res = await authPatch(`/api/doctor/sessions/${session.id}`, ctx.doctorCookie, { status: 'COMPLETED' })
    const data = await res.json()
    if (!data.success) return fail(7, `PATCH failed: ${data.error}`)

    const earning = await prisma.doctorEarning.findFirst({ where: { sessionId: session.id } })
    if (!earning) return fail(7, 'no earning row created')
    if (Number(earning.doctorAmount) !== 500) {
      return fail(7, `doctorAmount=${earning.doctorAmount}, expected 500 (50% of 1000)`)
    }
    pass(7)
  } catch (e) {
    fail(7, (e as Error).message)
  }
}

// ─── Test 8: PATCH NO_SHOW on 15–45min past session creates earning ─
async function test8_noShowCreatesEarning(ctx: Ctx) {
  try {
    // 20 minutes in the past — past the 15-min gate, before 45-min complete gate.
    const past = new Date(Date.now() - 20 * 60 * 1000)
    const session = await prisma.session.create({
      data: {
        userId: ctx.testUserId,
        doctorId: ctx.testDoctorId,
        date: past,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
      },
    })
    await prisma.payment.create({
      data: {
        userId: ctx.testUserId,
        amount: 600,
        type: 'SESSION',
        status: 'PAID',
        sessionId: session.id,
        razorpayOrderId: `smoke_2a_noshow_${session.id}`,
        razorpayPaymentId: `smoke_2a_noshowpay_${session.id}`,
      },
    })

    const res = await authPatch(`/api/doctor/sessions/${session.id}`, ctx.doctorCookie, { status: 'NO_SHOW' })
    const data = await res.json()
    if (!data.success) return fail(8, `PATCH failed: ${data.error}`)

    const earning = await prisma.doctorEarning.findFirst({ where: { sessionId: session.id } })
    if (!earning) return fail(8, 'no earning row created')
    if (Number(earning.doctorAmount) !== 300) {
      return fail(8, `doctorAmount=${earning.doctorAmount}, expected 300 (50% of 600)`)
    }
    pass(8)
  } catch (e) {
    fail(8, (e as Error).message)
  }
}

async function main() {
  console.log(`Logging in as ${TEST_DOCTOR_EMAIL} at ${BASE_URL}…`)
  const ctx = await setup()
  if (!ctx.doctorCookie || !ctx.doctorCookie.includes('next-auth') && !ctx.doctorCookie.includes('authjs')) {
    console.warn('Warning: session cookie may be missing — login flow returned unexpected cookies.')
  }

  await test1_doctorRouteRenders(ctx)
  await test2_sessionsTodayShape(ctx)
  await test3_upcomingFiltering(ctx)
  await test4_pastIncludesNoShow(ctx)
  await test5_leavesEndpoint(ctx)
  await test6_unreadCountEndpoint(ctx)
  await test7_completedCreatesEarning(ctx)
  await test8_noShowCreatesEarning(ctx)

  console.log('\n────────────────────────────')
  console.log('SMOKE TEST RESULTS — Sprint 2A')
  console.log('────────────────────────────')
  console.log(results.join(' '))
  if (failures.length > 0) {
    console.log('\nFailures:')
    failures.forEach((f) => console.log(f))
  }
  console.log('────────────────────────────')
  console.log(`Dev server: ${BASE_URL}`)
  console.log(`Test doctor: ${TEST_DOCTOR_EMAIL}\n`)
}

main()
  .catch((err) => {
    console.error('Smoke test crashed:', err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
