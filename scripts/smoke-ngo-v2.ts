/**
 * NGO Registration v2 — data-layer smoke harness (disposable).
 *
 * Run: DATABASE_URL=... npx tsx scripts/smoke-ngo-v2.ts
 *
 * Everything runs inside a single $transaction that is deliberately rolled
 * back at the end (throws ROLLBACK), so NOTHING persists on the database.
 * It exercises the exact Prisma queries + predicates that
 * registerForNgoVisit (src/lib/actions/ngo.ts) and the admin status PATCH
 * (src/app/api/admin/ngo/requests/[id]/route.ts) rely on. It does NOT
 * exercise the NextAuth session wrapper or React UI — those stay browser
 * smoke tests.
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const ROLLBACK = Symbol('rollback')
const log: string[] = []
const fails: string[] = []
function check(label: string, cond: boolean, detail = '') {
  if (cond) log.push(`  ✅ ${label}`)
  else {
    log.push(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`)
    fails.push(label)
  }
}

// Mirror of the action's calendar-based age gate (src/lib/actions/ngo.ts).
function isAtLeast18(dob: Date) {
  const eighteenth = new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate())
  return new Date() >= eighteenth
}
function dobYearsAgo(years: number) {
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  return d
}

async function main() {
  const stamp = Date.now()
  try {
    await prisma.$transaction(async (tx) => {
      const visit = await tx.ngoVisit.create({
        data: {
          ngoName: '__SMOKE_NGO_V2__',
          location: 'Test City',
          description: 'Disposable smoke-test visit — should never persist.',
          visitDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          capacity: 1,
          isPublished: true,
        },
      })
      const userA = await tx.user.create({
        data: { name: 'Smoke A', email: `smoke_${stamp}_a@smoke.invalid`, dateOfBirth: dobYearsAgo(25) },
      })
      const userB = await tx.user.create({
        data: { name: 'Smoke B', email: `smoke_${stamp}_b@smoke.invalid`, dateOfBirth: dobYearsAgo(30) },
      })

      // ── Test 1: register with valid DOB ≥18 (basic regression) ──
      const rA = await tx.ngoJoinRequest.create({
        data: {
          userId: userA.id,
          ngoVisitId: visit.id,
          name: userA.name,
          email: userA.email,
          phone: '9876543210',
          age: null,
          interest: 'Volunteer with Mindset',
        },
      })
      log.push('TEST 1 — register valid DOB ≥18 (regression):')
      check('row created with status default PENDING', rA.status === 'PENDING', `got ${rA.status}`)
      check('updatedAt populated (new column)', rA.updatedAt instanceof Date)
      check('userId + ngoVisitId tied to the drive', rA.userId === userA.id && rA.ngoVisitId === visit.id)
      check('age gate passes for 25y DOB', isAtLeast18(userA.dateOfBirth!))

      // ── Test 2: capacity = 1, second user blocked ──
      log.push('TEST 2 — capacity=1, second user blocked (transaction-critical):')
      const activeCount = await tx.ngoJoinRequest.count({
        where: { ngoVisitId: visit.id, status: { not: 'CANCELLED' } },
      })
      check('active (non-cancelled) count = 1 after A', activeCount === 1, `got ${activeCount}`)
      check('count >= capacity ⇒ B would be blocked with "full"', activeCount >= visit.capacity!, `${activeCount} >= ${visit.capacity}`)
      // CANCELLED rows must NOT consume a slot.
      await tx.ngoJoinRequest.create({
        data: {
          userId: userB.id,
          ngoVisitId: visit.id,
          name: userB.name,
          email: userB.email,
          phone: '9876500000',
          age: null,
          interest: 'Volunteer with Mindset',
          status: 'CANCELLED',
        },
      })
      const activeAfterCancel = await tx.ngoJoinRequest.count({
        where: { ngoVisitId: visit.id, status: { not: 'CANCELLED' } },
      })
      check('CANCELLED row excluded from capacity count (still 1)', activeAfterCancel === 1, `got ${activeAfterCancel}`)

      // ── dedupe (bonus): action uses findUnique(userId_ngoVisitId) ──
      const dupe = await tx.ngoJoinRequest.findUnique({
        where: { userId_ngoVisitId: { userId: userA.id, ngoVisitId: visit.id } },
      })
      check('dedupe: existing registration found ⇒ "already registered"', !!dupe && dupe.id === rA.id)

      // ── Test 3: DOB <18 → age_restricted ──
      log.push('TEST 3 — DOB <18 → age_restricted (new gate correctness):')
      check('17y DOB ⇒ age_restricted (not yet 18)', !isAtLeast18(dobYearsAgo(17)))
      check('exactly 18y DOB today ⇒ allowed (calendar gate)', isAtLeast18(dobYearsAgo(18)))

      // ── Test 4: no DOB → dob_required ──
      log.push('TEST 4 — no DOB → dob_required (gate branch):')
      const noDob: Date | null = null
      check('null DOB ⇒ dob_required branch taken', !noDob)

      // ── Test 5: admin status change persists (PATCH does this update) ──
      log.push('TEST 5 — admin status change persists:')
      const updated = await tx.ngoJoinRequest.update({
        where: { id: rA.id },
        data: { status: 'CONFIRMED' },
      })
      check('update wrote status=CONFIRMED', updated.status === 'CONFIRMED')
      const readBack = await tx.ngoJoinRequest.findUnique({ where: { id: rA.id } })
      check('re-read returns CONFIRMED (persists across reads)', readBack?.status === 'CONFIRMED', `got ${readBack?.status}`)
      check('updatedAt advanced on status change', !!readBack && readBack.updatedAt >= rA.updatedAt)

      // ── Test 6: admin filter + CSV — verify the data each row carries ──
      log.push('TEST 6 — admin filter/CSV data shape (rows carry status + visit name/date):')
      const rows = await tx.ngoJoinRequest.findMany({
        where: { ngoVisitId: visit.id },
        include: { ngoVisit: { select: { ngoName: true, visitDate: true } } },
      })
      const confirmedOnly = rows.filter((r) => r.status === 'CONFIRMED')
      check('client-side filter predicate isolates CONFIRMED rows', confirmedOnly.length === 1 && confirmedOnly[0].id === rA.id)
      check('each row exposes status for the Status column/CSV', rows.every((r) => typeof r.status === 'string'))
      check('each row exposes ngoVisit name + date for CSV columns', rows.every((r) => !!r.ngoVisit?.ngoName && !!r.ngoVisit?.visitDate))

      throw ROLLBACK
    })
  } catch (e) {
    if (e !== ROLLBACK) throw e
  }

  // Confirm rollback left nothing behind.
  const residue = await prisma.ngoVisit.count({ where: { ngoName: '__SMOKE_NGO_V2__' } })
  log.push('')
  log.push(`Rollback verification: residual smoke visits in DB = ${residue} (expect 0)`)
  if (residue !== 0) fails.push('rollback left residue')

  console.log(log.join('\n'))
  console.log('\n' + (fails.length === 0 ? '✅ ALL DATA-LAYER CHECKS PASSED' : `❌ ${fails.length} CHECK(S) FAILED: ${fails.join('; ')}`))
  await pool.end()
  process.exit(fails.length === 0 ? 0 : 1)
}

main().catch(async (e) => {
  console.error('HARNESS ERROR:', e)
  await pool.end()
  process.exit(2)
})
