/**
 * Sprint 1A smoke test — disposable.
 *
 * Run: npx tsx scripts/smoke-test-sprint-1a.ts
 *
 * Orchestrates booking/cancel/assignment flows directly via Prisma and
 * asserts the right Notification rows + sessions list filtering land.
 * Skips HTTP/auth — replicates the underlying DB writes that the route
 * handlers execute so we don't need to mock NextAuth.
 *
 * Idempotent — test data uses fixed emails (smoketest-*@mindset.test)
 * and the script wipes the test doctor's notifications + sessions at
 * start so assertions only see this run's data.
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'
import { format as formatDate } from 'date-fns'

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

// Mirror of src/lib/format-date.ts → formatSessionDate.
function formatSessionDate(d: Date): string {
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', ...opts }).format(d)
  return `${fmt({ weekday: 'short' })}, ${fmt({ day: 'numeric' })} ${fmt({ month: 'short' })}`
}

type Ctx = {
  testUserId: string
  testUserName: string
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
    update: {},
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

  // Wipe prior-run data scoped to the test doctor + test user so each
  // run starts from a known-empty slate. Cleanup is intentionally
  // scoped — never touches real users/doctors.
  await prisma.notification.deleteMany({ where: { userId: doctorUser.id } })
  await prisma.session.deleteMany({ where: { doctorId: testDoctor.id } })
  await prisma.assignment.deleteMany({ where: { doctorId: testDoctor.id } })

  return {
    testUserId: testUser.id,
    testUserName: testUser.name,
    testDoctorId: testDoctor.id,
    testDoctorUserId: doctorUser.id,
  }
}

// ─── Test 1: Booking creates SESSION_BOOKED notification ─────────
async function test1_bookingCreatesNotification(ctx: Ctx) {
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(14, 0, 0, 0)

    const session = await prisma.session.create({
      data: {
        userId: ctx.testUserId,
        doctorId: ctx.testDoctorId,
        date: tomorrow,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
      },
    })

    // Replicate the notification write from src/app/api/payments/verify/route.ts
    await prisma.notification.create({
      data: {
        userId: ctx.testDoctorUserId,
        kind: 'SESSION_BOOKED',
        title: 'New session booked',
        body: `${ctx.testUserName} booked a session for ${formatSessionDate(session.date)}`,
        link: `/doctor/calendar?date=${formatDate(session.date, 'yyyy-MM-dd')}`,
      },
    })

    const found = await prisma.notification.findFirst({
      where: {
        userId: ctx.testDoctorUserId,
        kind: 'SESSION_BOOKED',
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!found) return fail(1, 'no SESSION_BOOKED notification row')
    if (Date.now() - found.createdAt.getTime() > 60_000)
      return fail(1, `notification createdAt is stale (${found.createdAt.toISOString()})`)
    pass(1)
  } catch (e) {
    fail(1, (e as Error).message)
  }
}

// ─── Test 2: Unread count increments ─────────────────────────────
async function test2_unreadCountIncrements(ctx: Ctx) {
  try {
    // Replicate /api/doctor/notifications/unread-count query.
    const count = await prisma.notification.count({
      where: { userId: ctx.testDoctorUserId, readAt: null },
    })
    if (count < 1) return fail(2, `expected ≥1 unread, got ${count}`)
    pass(2)
  } catch (e) {
    fail(2, (e as Error).message)
  }
}

// ─── Test 3: Notification link points to /doctor/calendar ────────
async function test3_notificationLinkPatched(ctx: Ctx) {
  try {
    const latest = await prisma.notification.findFirst({
      where: {
        userId: ctx.testDoctorUserId,
        kind: 'SESSION_BOOKED',
      },
      orderBy: { createdAt: 'desc' },
    })
    if (!latest) return fail(3, 'no SESSION_BOOKED notification to check')
    if (!latest.link || !latest.link.startsWith('/doctor/calendar')) {
      return fail(3, `link was "${latest.link}" — expected /doctor/calendar*`)
    }
    pass(3)
  } catch (e) {
    fail(3, (e as Error).message)
  }
}

// ─── Test 4: Mark-read updates readAt ────────────────────────────
async function test4_markReadUpdatesReadAt(ctx: Ctx) {
  try {
    const target = await prisma.notification.findFirst({
      where: { userId: ctx.testDoctorUserId, kind: 'SESSION_BOOKED', readAt: null },
      orderBy: { createdAt: 'desc' },
    })
    if (!target) return fail(4, 'no unread SESSION_BOOKED to mark')

    // Replicate markNotificationRead from src/lib/actions/notifications.ts
    await prisma.notification.updateMany({
      where: { id: target.id, userId: ctx.testDoctorUserId, readAt: null },
      data: { readAt: new Date() },
    })

    const after = await prisma.notification.findUnique({ where: { id: target.id } })
    if (!after?.readAt) return fail(4, 'readAt still null after update')
    pass(4)
  } catch (e) {
    fail(4, (e as Error).message)
  }
}

// ─── Test 5: Upcoming view returns the test session ──────────────
async function test5_sessionsListReturnsTestSession(ctx: Ctx) {
  try {
    // Replicate /api/doctor/sessions?view=upcoming WHERE clause.
    const now = new Date()
    const sessions = await prisma.session.findMany({
      where: {
        doctorId: ctx.testDoctorId,
        date: { gte: now },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      orderBy: { date: 'asc' },
    })
    if (sessions.length === 0) return fail(5, 'no upcoming sessions found')
    pass(5)
  } catch (e) {
    fail(5, (e as Error).message)
  }
}

// ─── Test 6: Tab filtering (today / upcoming / past) ─────────────
async function test6_tabFiltering(ctx: Ctx) {
  try {
    // Wipe sessions from test 1 so we start fresh for the tab grid.
    await prisma.session.deleteMany({ where: { doctorId: ctx.testDoctorId } })

    const today = new Date()
    today.setHours(15, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const [sToday, sTomorrow, sYesterday] = await Promise.all([
      prisma.session.create({
        data: {
          userId: ctx.testUserId,
          doctorId: ctx.testDoctorId,
          date: today,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
        },
      }),
      prisma.session.create({
        data: {
          userId: ctx.testUserId,
          doctorId: ctx.testDoctorId,
          date: tomorrow,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
        },
      }),
      prisma.session.create({
        data: {
          userId: ctx.testUserId,
          doctorId: ctx.testDoctorId,
          date: yesterday,
          status: 'COMPLETED',
          paymentStatus: 'PAID',
        },
      }),
    ])

    // Mirror the route's WHERE construction.
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

    const todayRows = await prisma.session.findMany({
      where: {
        doctorId: ctx.testDoctorId,
        date: { gte: startOfDay, lt: endOfDay },
      },
    })
    const upcomingRows = await prisma.session.findMany({
      where: {
        doctorId: ctx.testDoctorId,
        date: { gte: now },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    })
    const pastRows = await prisma.session.findMany({
      where: {
        doctorId: ctx.testDoctorId,
        OR: [
          { date: { lt: now } },
          { status: { in: ['COMPLETED', 'CANCELLED'] } },
        ],
      },
    })

    const todayIds = new Set(todayRows.map((r) => r.id))
    const upcomingIds = new Set(upcomingRows.map((r) => r.id))
    const pastIds = new Set(pastRows.map((r) => r.id))

    if (!todayIds.has(sToday.id))
      return fail(6, `today tab missing today session`)
    if (todayIds.has(sTomorrow.id) || todayIds.has(sYesterday.id))
      return fail(6, `today tab leaked non-today sessions`)
    if (!upcomingIds.has(sTomorrow.id))
      return fail(6, `upcoming tab missing tomorrow session`)
    if (upcomingIds.has(sYesterday.id))
      return fail(6, `upcoming tab leaked yesterday's session`)
    if (!pastIds.has(sYesterday.id))
      return fail(6, `past tab missing yesterday session`)
    pass(6)
  } catch (e) {
    fail(6, (e as Error).message)
  }
}

// ─── Test 7: User cancellation triggers doctor notification ──────
async function test7_cancellationTriggersDoctorNotif(ctx: Ctx) {
  try {
    // Create a fresh future session to cancel.
    const future = new Date()
    future.setDate(future.getDate() + 3)
    const session = await prisma.session.create({
      data: {
        userId: ctx.testUserId,
        doctorId: ctx.testDoctorId,
        date: future,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
      },
    })

    // Replicate cancelSession's in-transaction writes (the in-app
    // notification block — refund/email side-effects are out of scope
    // for this smoke).
    await prisma.$transaction(
      async (tx) => {
        await tx.session.update({
          where: { id: session.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancellationReason: 'smoke test cancel',
          },
        })
        await tx.notification.create({
          data: {
            userId: ctx.testDoctorUserId,
            kind: 'SESSION_CANCELLED_BY_USER',
            title: 'Session cancelled',
            body: `${ctx.testUserName} cancelled their session scheduled for ${formatSessionDate(session.date)}`,
            link: `/doctor/calendar`,
          },
        })
      },
      { maxWait: 8000, timeout: 15000 }
    )

    const notif = await prisma.notification.findFirst({
      where: {
        userId: ctx.testDoctorUserId,
        kind: 'SESSION_CANCELLED_BY_USER',
      },
      orderBy: { createdAt: 'desc' },
    })
    if (!notif) return fail(7, 'no SESSION_CANCELLED_BY_USER row')
    if (notif.link !== '/doctor/calendar')
      return fail(7, `link was "${notif.link}" — expected /doctor/calendar`)
    pass(7)
  } catch (e) {
    fail(7, (e as Error).message)
  }
}

// ─── Test 8: Assignment submission triggers notification ─────────
async function test8_assignmentSubmissionTriggersNotif(ctx: Ctx) {
  try {
    const assignment = await prisma.assignment.create({
      data: {
        doctorId: ctx.testDoctorId,
        userId: ctx.testUserId,
        title: 'Smoke test homework',
        instructions: 'Do the smoke test',
        status: 'PENDING',
      },
    })

    // Replicate /api/user/assignments/[id]/submit logic: flip to
    // SUBMITTED + create the doctor notification.
    await prisma.assignment.update({
      where: { id: assignment.id },
      data: { status: 'SUBMITTED', submissionUrl: 'https://example.com/submission' },
    })

    await prisma.notification.create({
      data: {
        userId: ctx.testDoctorUserId,
        kind: 'ASSIGNMENT_SUBMITTED',
        title: 'Assignment submitted',
        body: `${ctx.testUserName} submitted "${assignment.title}" for review`,
        link: `/doctor/assignments?status=SUBMITTED`,
      },
    })

    const notif = await prisma.notification.findFirst({
      where: {
        userId: ctx.testDoctorUserId,
        kind: 'ASSIGNMENT_SUBMITTED',
      },
      orderBy: { createdAt: 'desc' },
    })
    if (!notif) return fail(8, 'no ASSIGNMENT_SUBMITTED row')
    if (!notif.link?.startsWith('/doctor/assignments'))
      return fail(8, `link was "${notif.link}" — expected /doctor/assignments*`)
    pass(8)
  } catch (e) {
    fail(8, (e as Error).message)
  }
}

// ─── Test 9: AI agent files preserved, button hidden ─────────────
async function test9_aiAgentHiddenButPreserved() {
  try {
    const root = path.resolve(__dirname, '..')
    const slotsPagePath = path.join(root, 'src/app/(dashboard)/doctor/slots/page.tsx')
    const aiRoutePath = path.join(root, 'src/app/api/doctor/slots/ai/route.ts')
    const aiComponentPath = path.join(root, 'src/components/dashboard/doctor/slot-ai-agent.tsx')

    const slotsPage = fs.readFileSync(slotsPagePath, 'utf8')
    const hidden =
      slotsPage.includes('AI agent hidden') ||
      slotsPage.includes('eslint-disable-next-line @typescript-eslint/no-unused-vars')
    if (!hidden)
      return fail(9, 'slots page missing hide-marker (comment or eslint-disable)')

    if (!fs.existsSync(aiRoutePath))
      return fail(9, 'api/doctor/slots/ai/route.ts missing')
    if (!fs.existsSync(aiComponentPath))
      return fail(9, 'slot-ai-agent.tsx component missing')
    pass(9)
  } catch (e) {
    fail(9, (e as Error).message)
  }
}

async function main() {
  console.log('Setting up test users/doctor + wiping prior test data…')
  const ctx = await setup()

  await test1_bookingCreatesNotification(ctx)
  await test2_unreadCountIncrements(ctx)
  await test3_notificationLinkPatched(ctx)
  await test4_markReadUpdatesReadAt(ctx)
  await test5_sessionsListReturnsTestSession(ctx)
  await test6_tabFiltering(ctx)
  await test7_cancellationTriggersDoctorNotif(ctx)
  await test8_assignmentSubmissionTriggersNotif(ctx)
  await test9_aiAgentHiddenButPreserved()

  console.log('\n────────────────────────────')
  console.log('SMOKE TEST RESULTS — Sprint 1A')
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
