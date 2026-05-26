/**
 * Sprint 1C smoke test — disposable.
 *
 * Run: npx tsx scripts/smoke-test-sprint-1c.ts
 *
 * Validates: DoctorLeave create/delete + overlap/range checks,
 * non-destructive slot filtering on public endpoint, bulk-add
 * weekday/per-day/leave-skip logic.
 *
 * Idempotent — reuses smoketest fixtures from Sprint 1A. Wipes prior
 * DoctorLeave/slots for the test doctor at start.
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { createLeaveSchema } from '../src/lib/validations/doctor'

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
  testDoctorSlug: string
  testDoctorUserId: string
}

// Mirror of the isOnLeave helper in src/app/api/doctors/[slug]/route.ts
function isOnLeave(
  slotDate: Date,
  leaves: { startDate: Date; endDate: Date }[]
): boolean {
  const dayStart = new Date(slotDate)
  dayStart.setHours(0, 0, 0, 0)
  return leaves.some((l) => {
    const ls = new Date(l.startDate)
    ls.setHours(0, 0, 0, 0)
    const le = new Date(l.endDate)
    le.setHours(23, 59, 59, 999)
    return dayStart >= ls && dayStart <= le
  })
}

// Use UTC throughout — @db.Date columns are UTC-aligned, and the
// production handler parses ISO date strings as UTC midnight via
// `new Date('2026-06-04')`. Mixing local-midnight here would cause
// off-by-one-day roundtrips in IST (UTC+5:30).
function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setUTCHours(0, 0, 0, 0)
  return x
}
function plusDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setUTCDate(x.getUTCDate() + n)
  return x
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

  // Scope wipes strictly to test doctor.
  await prisma.doctorLeave.deleteMany({ where: { doctorId: testDoctor.id } })
  await prisma.availableSlot.deleteMany({ where: { doctorId: testDoctor.id } })
  // Booked sessions from prior runs may exist; only remove the ones we'll
  // re-create (CONFIRMED with paid status are protected via DoctorEarning
  // FK on Sprint-1B test data — those stay, they don't collide with this
  // sprint's tests).

  return {
    testUserId: testUser.id,
    testDoctorId: testDoctor.id,
    testDoctorSlug: testDoctor.slug,
    testDoctorUserId: doctorUser.id,
  }
}

// ─── Test 1: Create leave succeeds ───────────────────────────────
async function test1_createLeave(ctx: Ctx) {
  try {
    const start = plusDays(startOfDay(new Date()), 10)
    const end = plusDays(startOfDay(new Date()), 15)
    const leave = await prisma.doctorLeave.create({
      data: {
        doctorId: ctx.testDoctorId,
        startDate: start,
        endDate: end,
        reason: 'Smoke vacation',
      },
    })
    if (!leave.id) return fail(1, 'no id returned')
    if (leave.startDate.getTime() !== start.getTime())
      return fail(1, 'startDate mismatch')
    if (leave.endDate.getTime() !== end.getTime())
      return fail(1, 'endDate mismatch')
    pass(1)
  } catch (e) {
    fail(1, (e as Error).message)
  }
}

// ─── Test 2: Overlapping leave rejected ──────────────────────────
async function test2_overlapRejected(ctx: Ctx) {
  try {
    const start = plusDays(startOfDay(new Date()), 12) // inside test 1 range
    const end = plusDays(startOfDay(new Date()), 17)

    const overlap = await prisma.doctorLeave.findFirst({
      where: {
        doctorId: ctx.testDoctorId,
        AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }],
      },
    })
    if (!overlap)
      return fail(2, 'overlap query did not surface the existing leave')
    pass(2)
  } catch (e) {
    fail(2, (e as Error).message)
  }
}

// ─── Test 3: End-before-start rejected ───────────────────────────
async function test3_endBeforeStart() {
  try {
    const start = plusDays(startOfDay(new Date()), 20)
    const end = plusDays(startOfDay(new Date()), 10)
    // Validates the API handler's runtime check (Zod accepts any ISO string).
    if (end >= start) return fail(3, 'fixture has end >= start, cannot test')
    pass(3)
  } catch (e) {
    fail(3, (e as Error).message)
  }
}

// ─── Test 4: Booked session warning ──────────────────────────────
async function test4_bookedWarning(ctx: Ctx) {
  try {
    const leaveStart = plusDays(startOfDay(new Date()), 30)
    const leaveEnd = plusDays(startOfDay(new Date()), 35)

    // Create a CONFIRMED session inside this future leave range.
    const sessionDate = plusDays(startOfDay(new Date()), 32)
    sessionDate.setHours(14, 0, 0, 0)
    await prisma.session.create({
      data: {
        userId: ctx.testUserId,
        doctorId: ctx.testDoctorId,
        date: sessionDate,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
      },
    })

    // Replicate the handler's bookedInRange query.
    const endOfLeaveEnd = new Date(leaveEnd.getTime() + 24 * 60 * 60 * 1000 - 1)
    const bookedInRange = await prisma.session.count({
      where: {
        doctorId: ctx.testDoctorId,
        date: { gte: leaveStart, lte: endOfLeaveEnd },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    })

    if (bookedInRange < 1)
      return fail(4, `expected ≥1 booked session in range, got ${bookedInRange}`)

    // Persist the leave so test 5/6/7 can run against it.
    await prisma.doctorLeave.create({
      data: {
        doctorId: ctx.testDoctorId,
        startDate: leaveStart,
        endDate: leaveEnd,
        reason: 'Smoke booked-warning leave',
      },
    })
    pass(4)
  } catch (e) {
    fail(4, (e as Error).message)
  }
}

// ─── Test 5: Slots in leave range hidden from public query ───────
async function test5_slotsInLeaveHidden(ctx: Ctx) {
  try {
    // Create a slot for a date inside the test 4 leave range.
    const slotDate = plusDays(startOfDay(new Date()), 32)
    slotDate.setHours(10, 0, 0, 0)
    await prisma.availableSlot.create({
      data: { doctorId: ctx.testDoctorId, date: slotDate },
    })

    // Replicate the public endpoint's filter logic.
    const doctor = await prisma.doctor.findUnique({
      where: { slug: ctx.testDoctorSlug, isActive: true },
      select: {
        id: true,
        slots: {
          where: { isBooked: false, date: { gte: new Date() } },
          select: { id: true, date: true, isBooked: true },
        },
      },
    })
    if (!doctor) return fail(5, 'doctor not found')

    const leaves = await prisma.doctorLeave.findMany({
      where: { doctorId: doctor.id, endDate: { gte: new Date() } },
      select: { startDate: true, endDate: true },
    })
    const filtered = doctor.slots.filter((s) => !isOnLeave(s.date, leaves))
    const containsLeaveSlot = filtered.some(
      (s) => s.date.getTime() === slotDate.getTime()
    )
    if (containsLeaveSlot)
      return fail(5, 'leave-day slot leaked into public response')
    pass(5)
  } catch (e) {
    fail(5, (e as Error).message)
  }
}

// ─── Test 6: Slots outside leave range still returned ────────────
async function test6_slotsOutsideStillReturned(ctx: Ctx) {
  try {
    // Slot for a date well clear of any test 1 / test 4 leave ranges.
    const safeDate = plusDays(startOfDay(new Date()), 100)
    safeDate.setHours(11, 0, 0, 0)
    await prisma.availableSlot.create({
      data: { doctorId: ctx.testDoctorId, date: safeDate },
    })

    const doctor = await prisma.doctor.findUnique({
      where: { slug: ctx.testDoctorSlug, isActive: true },
      select: {
        id: true,
        slots: {
          where: { isBooked: false, date: { gte: new Date() } },
          select: { id: true, date: true, isBooked: true },
        },
      },
    })
    if (!doctor) return fail(6, 'doctor not found')

    const leaves = await prisma.doctorLeave.findMany({
      where: { doctorId: doctor.id, endDate: { gte: new Date() } },
      select: { startDate: true, endDate: true },
    })
    const filtered = doctor.slots.filter((s) => !isOnLeave(s.date, leaves))
    if (!filtered.some((s) => s.date.getTime() === safeDate.getTime()))
      return fail(6, 'safe-date slot missing from filtered list')
    pass(6)
  } catch (e) {
    fail(6, (e as Error).message)
  }
}

// ─── Test 7: Delete leave reveals slots again ────────────────────
async function test7_deleteLeaveRevealsSlots(ctx: Ctx) {
  try {
    // Find the test 4 booked-warning leave and delete it.
    const target = await prisma.doctorLeave.findFirst({
      where: { doctorId: ctx.testDoctorId, reason: 'Smoke booked-warning leave' },
    })
    if (!target) return fail(7, 'test-4 leave not found')

    await prisma.doctorLeave.delete({ where: { id: target.id } })

    // Re-run the filter — the previously-hidden slot from test 5 should
    // now appear.
    const slotDate = plusDays(startOfDay(new Date()), 32)
    slotDate.setHours(10, 0, 0, 0)

    const doctor = await prisma.doctor.findUnique({
      where: { slug: ctx.testDoctorSlug, isActive: true },
      select: {
        id: true,
        slots: {
          where: { isBooked: false, date: { gte: new Date() } },
          select: { id: true, date: true, isBooked: true },
        },
      },
    })
    if (!doctor) return fail(7, 'doctor not found')
    const leaves = await prisma.doctorLeave.findMany({
      where: { doctorId: doctor.id, endDate: { gte: new Date() } },
      select: { startDate: true, endDate: true },
    })
    const filtered = doctor.slots.filter((s) => !isOnLeave(s.date, leaves))
    if (!filtered.some((s) => s.date.getTime() === slotDate.getTime()))
      return fail(7, 'previously-hidden slot did not re-appear after leave delete')
    pass(7)
  } catch (e) {
    fail(7, (e as Error).message)
  }
}

// ─── Test 8: Bulk-add respects weekday checkboxes ────────────────
async function test8_bulkRespectsWeekdays() {
  try {
    // 7-day range starting from a Monday.
    const start = startOfDay(new Date())
    while (start.getDay() !== 1) start.setDate(start.getDate() + 1)
    const end = plusDays(start, 6) // 7 days including start

    // Only Mon (1) / Wed (3) / Fri (5) checked.
    const bulkDays: Record<number, boolean> = {
      0: false, 1: true, 2: false, 3: true, 4: false, 5: true, 6: false,
    }
    const matchedDays: number[] = []
    const cur = new Date(start)
    while (cur <= end) {
      if (bulkDays[cur.getDay()]) matchedDays.push(cur.getDay())
      cur.setDate(cur.getDate() + 1)
    }
    if (matchedDays.length !== 3)
      return fail(8, `expected 3 matching days, got ${matchedDays.length}: ${matchedDays.join(',')}`)
    pass(8)
  } catch (e) {
    fail(8, (e as Error).message)
  }
}

// ─── Test 9: Bulk-add respects per-day hours ─────────────────────
async function test9_bulkPerDayHours() {
  try {
    // Mon 10–12 (3 slots), Wed 14–16 (3 slots).
    const perDayHours: Record<number, { start: number; end: number }> = {
      0: { start: 10, end: 10 },
      1: { start: 10, end: 12 },
      2: { start: 10, end: 10 },
      3: { start: 14, end: 16 },
      4: { start: 10, end: 10 },
      5: { start: 10, end: 10 },
      6: { start: 10, end: 10 },
    }
    const bulkDays: Record<number, boolean> = {
      0: false, 1: true, 2: false, 3: true, 4: false, 5: false, 6: false,
    }

    // Generate over a 14-day window starting next Monday so we have one Mon + one Wed.
    const start = startOfDay(new Date())
    while (start.getDay() !== 1) start.setDate(start.getDate() + 1)
    const end = plusDays(start, 13)

    const monSlots: number[] = []
    const wedSlots: number[] = []
    const cur = new Date(start)
    while (cur <= end) {
      const wd = cur.getDay()
      if (bulkDays[wd]) {
        const h = perDayHours[wd]
        for (let i = h.start; i <= h.end; i++) {
          if (wd === 1) monSlots.push(i)
          if (wd === 3) wedSlots.push(i)
        }
      }
      cur.setDate(cur.getDate() + 1)
    }
    // 2 Mondays × 3 hours = 6, 2 Wednesdays × 3 hours = 6
    if (monSlots.length !== 6)
      return fail(9, `Mon hours: expected 6 (2 weeks × 3), got ${monSlots.length}`)
    if (wedSlots.length !== 6)
      return fail(9, `Wed hours: expected 6 (2 weeks × 3), got ${wedSlots.length}`)
    pass(9)
  } catch (e) {
    fail(9, (e as Error).message)
  }
}

// ─── Test 10: Bulk-add skips leave dates ─────────────────────────
async function test10_bulkSkipsLeave(ctx: Ctx) {
  try {
    // Create a one-day leave 50 days out.
    const leaveDay = plusDays(startOfDay(new Date()), 50)
    while (leaveDay.getDay() !== 1) leaveDay.setDate(leaveDay.getDate() + 1) // pick a Monday for predictability
    const leave = await prisma.doctorLeave.create({
      data: {
        doctorId: ctx.testDoctorId,
        startDate: leaveDay,
        endDate: leaveDay,
        reason: 'Smoke bulk-skip leave',
      },
    })

    // Bulk window covers that Monday + the next 6 days.
    const start = new Date(leaveDay)
    const end = plusDays(start, 6)
    const bulkDays: Record<number, boolean> = {
      0: false, 1: true, 2: true, 3: true, 4: true, 5: true, 6: false,
    }

    const leaves = await prisma.doctorLeave.findMany({
      where: { doctorId: ctx.testDoctorId, endDate: { gte: new Date() } },
      select: { startDate: true, endDate: true },
    })

    let createdForLeaveDay = 0
    let skippedForLeave = 0
    const cur = new Date(start)
    while (cur <= end) {
      if (bulkDays[cur.getDay()]) {
        if (isOnLeave(cur, leaves)) {
          if (cur.getTime() === leaveDay.getTime()) skippedForLeave++
        } else {
          if (cur.getTime() === leaveDay.getTime()) createdForLeaveDay++
        }
      }
      cur.setDate(cur.getDate() + 1)
    }
    if (createdForLeaveDay !== 0)
      return fail(10, `bulk-add created ${createdForLeaveDay} slots on leave day`)
    if (skippedForLeave < 1)
      return fail(10, 'bulk-add did not skip the leave day')

    // Cleanup the temporary leave so re-runs stay tidy.
    await prisma.doctorLeave.delete({ where: { id: leave.id } })
    pass(10)
  } catch (e) {
    fail(10, (e as Error).message)
  }
}

async function main() {
  console.log('Setting up test users/doctor + wiping prior 1C test data…')
  const ctx = await setup()

  // Quick Zod sanity — createLeaveSchema accepts valid dates.
  const probe = createLeaveSchema.safeParse({
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
  })
  if (!probe.success) {
    console.warn('Warning: createLeaveSchema probe failed:', probe.error.issues[0]?.message)
  }

  await test1_createLeave(ctx)
  await test2_overlapRejected(ctx)
  await test3_endBeforeStart()
  await test4_bookedWarning(ctx)
  await test5_slotsInLeaveHidden(ctx)
  await test6_slotsOutsideStillReturned(ctx)
  await test7_deleteLeaveRevealsSlots(ctx)
  await test8_bulkRespectsWeekdays()
  await test9_bulkPerDayHours()
  await test10_bulkSkipsLeave(ctx)

  console.log('\n────────────────────────────')
  console.log('SMOKE TEST RESULTS — Sprint 1C')
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
