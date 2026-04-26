/**
 * Seed sample workshops for dev.
 * Run: npx tsx scripts/seed-workshops.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const now = new Date()

  const workshops = [
    {
      title: 'Managing anxiety in daily life',
      subtitle: 'Practical CBT techniques for everyday calm',
      description:
        'A 90-minute interactive workshop where you will learn breathing exercises, cognitive reframing, and grounding techniques to manage anxiety in work and relationships.',
      instructorName: 'Dr. Meera Sharma',
      startsAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      durationMin: 90,
      priceCents: 0,
      capacity: 50,
      published: true,
    },
    {
      title: 'Mindful journaling for self-discovery',
      subtitle: 'Write your way to clarity',
      description:
        'Learn structured journaling prompts rooted in positive psychology. Bring a notebook — you will leave with a 7-day journaling plan.',
      instructorName: 'Priya Kapoor',
      startsAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      durationMin: 60,
      priceCents: 29900,
      capacity: 30,
      published: true,
    },
    {
      title: 'Sleep hygiene masterclass',
      description:
        'Understand the science of sleep and build a personalised wind-down routine that actually sticks.',
      instructorName: 'Dr. Rohan Patel',
      startsAt: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      durationMin: 75,
      priceCents: 0,
      published: true,
    },
  ]

  for (const ws of workshops) {
    await prisma.workshop.create({ data: ws })
  }

  console.log(`Seeded ${workshops.length} workshops`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
