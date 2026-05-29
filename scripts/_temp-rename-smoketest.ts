/**
 * TEMP — rename smoketest accounts for truncation verification.
 * Strictly scoped to smoketest-doctor@mindset.test and smoketest-user@mindset.test.
 * Records originals to scripts/_temp-rename-smoketest-originals.json so the
 * sibling restore script can revert cleanly.
 *
 * Delete this file + the originals JSON after restore.
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { writeFileSync } from 'node:fs'

const DOCTOR_EMAIL = 'smoketest-doctor@mindset.test'
const USER_EMAIL = 'smoketest-user@mindset.test'
const DOCTOR_LONG = 'Dr Suryansh Agarwal Krishnamurthy Sharma'
const USER_LONG = 'Aanya Verma Krishnamurthy Iyer Subramanian'

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
})

async function main() {
  const doctor = await prisma.user.findUnique({
    where: { email: DOCTOR_EMAIL },
    select: { id: true, name: true, email: true },
  })
  const patient = await prisma.user.findUnique({
    where: { email: USER_EMAIL },
    select: { id: true, name: true, email: true },
  })

  if (!doctor) throw new Error(`No user with email ${DOCTOR_EMAIL}`)
  if (!patient) throw new Error(`No user with email ${USER_EMAIL}`)

  const originals = {
    doctor: { id: doctor.id, email: doctor.email, originalName: doctor.name },
    patient: { id: patient.id, email: patient.email, originalName: patient.name },
    capturedAt: new Date().toISOString(),
  }
  writeFileSync('scripts/_temp-rename-smoketest-originals.json', JSON.stringify(originals, null, 2))
  console.log('Recorded originals:')
  console.log(`  doctor:  "${doctor.name}"  (${doctor.email})`)
  console.log(`  patient: "${patient.name}" (${patient.email})`)

  await prisma.user.update({
    where: { id: doctor.id },
    data: { name: DOCTOR_LONG },
  })
  await prisma.user.update({
    where: { id: patient.id },
    data: { name: USER_LONG },
  })

  console.log('\nUpdated:')
  console.log(`  doctor:  "${DOCTOR_LONG}"`)
  console.log(`  patient: "${USER_LONG}"`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
