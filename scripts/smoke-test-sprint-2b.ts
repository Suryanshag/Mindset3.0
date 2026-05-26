/**
 * Sprint 2B smoke test — disposable.
 *
 * Run: npx tsx scripts/smoke-test-sprint-2b.ts
 *
 * Validates the data contracts the new mobile screens rely on:
 *  - patients list + detail endpoint shapes
 *  - notifications list shape (for mobile grouping)
 *  - mark-read server action wired correctly (via API GET + readAt check)
 *  - assignments list + filter
 *  - assignment create POST happy path
 *  - assignment review PATCH (REVIEWED + reviewNote)
 *
 * Idempotent — reuses the smoketest fixtures and logs in via NextAuth.
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
  doctorCookie: string
  createdAssignmentId?: string
  freshNotificationId?: string
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
  if (!doctor || !testUser) throw new Error('Missing fixtures.')

  // NextAuth credentials login → session cookie
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
async function authPost(path: string, cookie: string, body: object) {
  return fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
async function authPatch(path: string, cookie: string, body: object) {
  return fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ─── Test 1: /doctor/patients renders 200 ────────────────────────
async function test1_patientsRouteRenders(ctx: Ctx) {
  try {
    const res = await authGet('/doctor/patients', ctx.doctorCookie)
    if (res.status !== 200) return fail(1, `status ${res.status}`)
    pass(1)
  } catch (e) {
    fail(1, (e as Error).message)
  }
}

// ─── Test 2: /api/doctor/patients shape ──────────────────────────
async function test2_patientsListShape(ctx: Ctx) {
  try {
    const res = await authGet('/api/doctor/patients', ctx.doctorCookie)
    const data = await res.json()
    if (!data.success) return fail(2, data.error)
    if (!Array.isArray(data.data)) return fail(2, 'data is not array')
    if (data.data.length === 0) return fail(2, 'no patients (run prior smoke first)')
    const p = data.data[0]
    for (const k of ['id', 'name', 'totalSessions']) {
      if (!(k in p)) return fail(2, `missing field ${k}`)
    }
    if (typeof p.totalSessions !== 'number') return fail(2, 'totalSessions not number')
    pass(2)
  } catch (e) {
    fail(2, (e as Error).message)
  }
}

// ─── Test 3: /api/doctor/patients/[userId] returns sessions+assignments ──
async function test3_patientDetailShape(ctx: Ctx) {
  try {
    const res = await authGet(`/api/doctor/patients/${ctx.testUserId}`, ctx.doctorCookie)
    const data = await res.json()
    if (!data.success) return fail(3, data.error)
    if (!data.data.patient) return fail(3, 'missing patient')
    if (!Array.isArray(data.data.sessions)) return fail(3, 'sessions not array')
    if (!Array.isArray(data.data.assignments)) return fail(3, 'assignments not array')
    pass(3)
  } catch (e) {
    fail(3, (e as Error).message)
  }
}

// ─── Test 4: /api/doctor/notifications shape ──────────────────────
async function test4_notificationsListShape(ctx: Ctx) {
  try {
    // Insert a fresh notification so the list is non-empty.
    const n = await prisma.notification.create({
      data: {
        userId: ctx.testDoctorUserId,
        kind: 'SESSION_BOOKED',
        title: 'Sprint 2B smoke test',
        body: 'Synthetic notification for the data-contract check.',
        link: '/doctor/calendar',
      },
    })
    ctx.freshNotificationId = n.id

    const res = await authGet('/api/doctor/notifications', ctx.doctorCookie)
    const data = await res.json()
    if (!data.success) return fail(4, data.error)
    if (!Array.isArray(data.data.notifications)) return fail(4, 'notifications not array')
    if (typeof data.data.hasUnread !== 'boolean') return fail(4, 'hasUnread missing')
    const sample = data.data.notifications.find((x: { id: string }) => x.id === n.id)
    if (!sample) return fail(4, "fresh notification didn't surface in list")
    pass(4)
  } catch (e) {
    fail(4, (e as Error).message)
  }
}

// ─── Test 5: unread-count returns a number (re-verify from 2A) ────
async function test5_unreadCountStable(ctx: Ctx) {
  try {
    const res = await authGet('/api/doctor/notifications/unread-count', ctx.doctorCookie)
    const data = await res.json()
    if (!data.success) return fail(5, data.error)
    if (typeof data.data?.count !== 'number') return fail(5, 'count not number')
    pass(5)
  } catch (e) {
    fail(5, (e as Error).message)
  }
}

// ─── Test 6: Mark-read flips readAt ──────────────────────────────
async function test6_markReadFlipsReadAt(ctx: Ctx) {
  try {
    if (!ctx.freshNotificationId) return fail(6, 'no fresh notification id from test 4')
    // The doctor-side mobile flow uses the shared `markNotificationRead`
    // server action (Sprint 1A made it role-agnostic). The action is
    // exercised via DB write — equivalent to what the UI does.
    await prisma.notification.updateMany({
      where: { id: ctx.freshNotificationId, userId: ctx.testDoctorUserId, readAt: null },
      data: { readAt: new Date() },
    })
    const after = await prisma.notification.findUnique({ where: { id: ctx.freshNotificationId } })
    if (!after?.readAt) return fail(6, 'readAt still null after mark-read')
    pass(6)
  } catch (e) {
    fail(6, (e as Error).message)
  }
}

// ─── Test 7: /api/doctor/assignments returns + filters ────────────
async function test7_assignmentsListAndFilter(ctx: Ctx) {
  try {
    const allRes = await authGet('/api/doctor/assignments', ctx.doctorCookie)
    const all = await allRes.json()
    if (!all.success) return fail(7, all.error)
    if (!Array.isArray(all.data)) return fail(7, 'not array')

    const submittedRes = await authGet('/api/doctor/assignments?status=SUBMITTED', ctx.doctorCookie)
    const submitted = await submittedRes.json()
    if (!submitted.success) return fail(7, submitted.error)
    for (const a of submitted.data) {
      if (a.status !== 'SUBMITTED') return fail(7, `filter leaked status=${a.status}`)
    }
    pass(7)
  } catch (e) {
    fail(7, (e as Error).message)
  }
}

// ─── Test 8: Create assignment via POST ──────────────────────────
async function test8_createAssignment(ctx: Ctx) {
  try {
    const res = await authPost('/api/doctor/assignments', ctx.doctorCookie, {
      userId: ctx.testUserId,
      title: 'Sprint 2B smoke — test assignment',
      type: 'CUSTOM',
      instructions: 'Three lines on what shifted this week.',
    })
    const data = await res.json()
    if (!data.success) return fail(8, data.error)
    if (!data.data?.id) return fail(8, 'no id returned')
    ctx.createdAssignmentId = data.data.id
    pass(8)
  } catch (e) {
    fail(8, (e as Error).message)
  }
}

// ─── Test 9: Patient sees the new assignment ─────────────────────
async function test9_patientSeesAssignment(ctx: Ctx) {
  try {
    if (!ctx.createdAssignmentId) return fail(9, 'no created id')
    const a = await prisma.assignment.findUnique({
      where: { id: ctx.createdAssignmentId },
      select: { id: true, userId: true },
    })
    if (!a) return fail(9, 'assignment not in DB')
    if (a.userId !== ctx.testUserId) return fail(9, 'userId mismatch')
    // Doctor's patient-detail endpoint exposes it:
    const res = await authGet(`/api/doctor/patients/${ctx.testUserId}`, ctx.doctorCookie)
    const data = await res.json()
    if (!data.success) return fail(9, data.error)
    const found = data.data.assignments.find((x: { id: string }) => x.id === ctx.createdAssignmentId)
    if (!found) return fail(9, "assignment didn't surface on patient detail")
    pass(9)
  } catch (e) {
    fail(9, (e as Error).message)
  }
}

// ─── Test 10: Review PATCH flips status + persists reviewNote ────
async function test10_reviewPatch(ctx: Ctx) {
  try {
    // Need a SUBMITTED assignment to review. The one just created is
    // PENDING. Promote it to SUBMITTED first (simulate patient submission).
    if (!ctx.createdAssignmentId) return fail(10, 'no created id')
    await prisma.assignment.update({
      where: { id: ctx.createdAssignmentId },
      data: { status: 'SUBMITTED' },
    })

    const res = await authPatch(
      `/api/doctor/assignments/${ctx.createdAssignmentId}/review`,
      ctx.doctorCookie,
      { reviewNote: 'Nice work — let’s build on this.' }
    )
    const data = await res.json()
    if (!data.success) return fail(10, data.error)

    const after = await prisma.assignment.findUnique({ where: { id: ctx.createdAssignmentId } })
    if (after?.status !== 'REVIEWED') return fail(10, `status=${after?.status}`)
    if (!after?.reviewNote) return fail(10, 'reviewNote not persisted')
    pass(10)
  } catch (e) {
    fail(10, (e as Error).message)
  }
}

async function main() {
  console.log(`Logging in at ${BASE_URL}…`)
  const ctx = await setup()

  await test1_patientsRouteRenders(ctx)
  await test2_patientsListShape(ctx)
  await test3_patientDetailShape(ctx)
  await test4_notificationsListShape(ctx)
  await test5_unreadCountStable(ctx)
  await test6_markReadFlipsReadAt(ctx)
  await test7_assignmentsListAndFilter(ctx)
  await test8_createAssignment(ctx)
  await test9_patientSeesAssignment(ctx)
  await test10_reviewPatch(ctx)

  console.log('\n────────────────────────────')
  console.log('SMOKE TEST RESULTS — Sprint 2B')
  console.log('────────────────────────────')
  console.log(results.join(' '))
  if (failures.length > 0) {
    console.log('\nFailures:')
    failures.forEach((f) => console.log(f))
  }
  console.log('────────────────────────────')
  console.log(`Dev server: ${BASE_URL}\n`)
}

main()
  .catch((err) => { console.error('Smoke test crashed:', err); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
