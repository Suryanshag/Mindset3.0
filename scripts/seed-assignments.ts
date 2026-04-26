/**
 * Seed assignments for dev.
 * Run: npx tsx scripts/seed-assignments.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    select: { id: true },
    take: 3,
  })
  const doctors = await prisma.doctor.findMany({
    select: { id: true },
    take: 3,
  })

  if (users.length === 0 || doctors.length === 0) {
    console.error('No users or doctors found. Seed those first.')
    return
  }

  const now = new Date()
  const tomorrow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const assignments = [
    {
      doctorId: doctors[0].id,
      userId: users[0].id,
      type: 'JOURNAL_PROMPT' as const,
      title: 'Reflect on a positive experience this week',
      instructions:
        'Think about one moment this week where you felt genuinely happy or at peace. Write about what happened, who was there, and how it made you feel. Try to be as specific as possible — sensory details help.',
      dueDate: tomorrow,
    },
    {
      doctorId: doctors[0].id,
      userId: users[0].id,
      type: 'BREATHING' as const,
      title: '5-minute breathing exercise',
      instructions:
        'Find a quiet spot, sit comfortably, and follow the guided breathing timer. Breathe in for 4 counts, hold for 4, exhale for 6. Repeat for the full 5 minutes.',
      dueDate: null,
    },
    {
      doctorId: doctors[1 % doctors.length].id,
      userId: users[0].id,
      type: 'READING' as const,
      title: 'Read Chapter 3: Understanding Triggers',
      instructions:
        'Read the assigned chapter and take note of any triggers you can identify in your own life. We will discuss your findings in the next session.',
      dueDate: nextWeek,
    },
    {
      doctorId: doctors[0].id,
      userId: users[0].id,
      type: 'WORKSHEET' as const,
      title: 'CBT Thought Record',
      instructions:
        'Fill out the thought record worksheet: describe the situation, your automatic thought, the emotion it triggered, evidence for/against the thought, and a balanced alternative thought.',
      dueDate: tomorrow,
    },
  ]

  let count = 0
  for (const a of assignments) {
    await prisma.assignment.create({
      data: {
        doctorId: a.doctorId,
        userId: a.userId,
        type: a.type,
        title: a.title,
        instructions: a.instructions,
        dueDate: a.dueDate,
        description: '',
      },
    })
    count++
  }

  console.log(`Seeded ${count} assignments`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
